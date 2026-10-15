import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enquiryImportSchema, handleApiError, jsonError } from "@/lib/validators";
import { db } from "@/lib/db";
import { requireAuth, getClientIp } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseCsv, normalizePhone } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Hard cap on data rows per import (excluding the header row). */
const MAX_ROWS = 500;

// Row-level shape: name* and phone* required, email/course/message optional.
const rowSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9][0-9\s\-()]{7,15}$/, "Enter a valid phone number"),
  email: z
    .union([
      z.string().trim().toLowerCase().email("Enter a valid email"),
      z.literal(""),
    ])
    .default(""),
  course: z.string().trim().max(120).default(""),
  message: z.string().trim().max(1000).default(""),
});

/**
 * POST /api/enquiries/import — bulk enquiry import from CSV (Prompt 8).
 *
 * Body: { csv: string, fileName?: string }
 * CSV format (header row required, column order flexible):
 *   name,phone,email,course,message
 *
 * Behaviour:
 * - Auth: any active admin (SUPER_ADMIN + ADMIN — counsellors import leads).
 * - Rate limited: 5 imports per user per hour → 429.
 * - ≤ 500 data rows per import.
 * - Course matched by exact title (case-insensitive) or slug; must be active.
 * - Rows failing validation / unknown course are skipped with a reason.
 * - De-duplication: phone already in the system OR repeated in the file →
 *   skipped ("duplicate").
 * - Audited: ENQUIRY_IMPORT with imported/failed counts.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const limit = checkRateLimit(`import:${user.id}`, 5, 60 * 60_000);
    if (!limit.allowed) {
      return jsonError(
        429,
        "Too many imports. Please try again in a few minutes.",
        "RATE_LIMITED",
        { retryAfterSec: limit.retryAfterSec }
      );
    }

    const body = (await req.json().catch(() => null)) as unknown;
    const { csv, fileName } = enquiryImportSchema.parse(body);

    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return jsonError(
        400,
        "CSV must have a header row plus at least one data row.",
        "EMPTY_IMPORT"
      );
    }

    // ── Header mapping (order-flexible, names case-insensitive) ──
    const header = rows[0]!.map((h) => h.trim().toLowerCase());
    const idx = (names: string[]): number =>
      header.findIndex((h) => names.includes(h));
    const colName = idx(["name", "student name", "full name"]);
    const colPhone = idx(["phone", "mobile", "phone number", "contact"]);
    const colEmail = idx(["email", "email address"]);
    const colCourse = idx(["course", "course name", "program"]);
    const colMessage = idx(["message", "note", "notes", "remark"]);

    if (colName === -1 || colPhone === -1) {
      return jsonError(
        400,
        'CSV header must include "name" and "phone" columns (email, course and message are optional).',
        "BAD_HEADER"
      );
    }

    const dataRows = rows.slice(1);
    if (dataRows.length > MAX_ROWS) {
      return jsonError(
        400,
        `Too many rows — maximum ${MAX_ROWS} per import (got ${dataRows.length}).`,
        "TOO_MANY_ROWS"
      );
    }

    // Existing phones for de-duplication (single cheap query on SQLite).
    const existing = await db.enquiry.findMany({ select: { phone: true } });
    const seen = new Set(existing.map((e) => normalizePhone(e.phone)));

    // Active courses for lookup: by title (lower) or slug.
    const courses = await db.course.findMany({ where: { isActive: true } });
    const byTitle = new Map(
      courses.map((c) => [c.title.trim().toLowerCase(), c.id])
    );
    const bySlug = new Map(courses.map((c) => [c.slug, c.id]));

    interface FailedRow {
      row: number;
      name: string;
      reason: string;
    }
    const failed: FailedRow[] = [];
    const toCreate: {
      name: string;
      phone: string;
      email: string;
      courseId: string | null;
      message: string | null;
      source: string;
    }[] = [];

    dataRows.forEach((cells, i) => {
      const rowNo = i + 2; // 1-based, +1 for the header row
      const raw = {
        name: (cells[colName] ?? "").trim(),
        phone: (cells[colPhone] ?? "").trim(),
        email: colEmail === -1 ? "" : (cells[colEmail] ?? "").trim(),
        course: colCourse === -1 ? "" : (cells[colCourse] ?? "").trim(),
        message: colMessage === -1 ? "" : (cells[colMessage] ?? "").trim(),
      };

      if (!raw.name && !raw.phone) return; // silently skip fully blank rows

      const parsed = rowSchema.safeParse(raw);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        failed.push({
          row: rowNo,
          name: raw.name || "(unnamed)",
          reason: `${issue?.path.join(".") || "input"}: ${
            issue?.message ?? "invalid"
          }`,
        });
        return;
      }

      const key = normalizePhone(parsed.data.phone);
      if (!key) {
        failed.push({
          row: rowNo,
          name: parsed.data.name,
          reason: "phone: no digits",
        });
        return;
      }
      if (seen.has(key)) {
        failed.push({
          row: rowNo,
          name: parsed.data.name,
          reason: "duplicate — this phone number already exists",
        });
        return;
      }
      seen.add(key);

      let courseId: string | null = null;
      if (parsed.data.course) {
        const wanted = parsed.data.course.toLowerCase();
        courseId = byTitle.get(wanted) ?? bySlug.get(wanted) ?? null;
        if (!courseId) {
          failed.push({
            row: rowNo,
            name: parsed.data.name,
            reason: `course "${parsed.data.course}" not found (must match an active course title or slug)`,
          });
          return;
        }
      }

      toCreate.push({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        courseId,
        message: parsed.data.message || null,
        source: "import",
      });
    });

    if (toCreate.length > 0) {
      await db.enquiry.createMany({ data: toCreate });
    }

    await logAudit({
      userId: user.id,
      action: "ENQUIRY_IMPORT",
      entity: "enquiry",
      ipAddress: getClientIp(req),
      meta: {
        fileName,
        totalRows: dataRows.length,
        imported: toCreate.length,
        failed: failed.length,
      },
    });

    return NextResponse.json(
      {
        total: dataRows.length,
        imported: toCreate.length,
        failed,
      },
      { status: 200 }
    );
  } catch (e) {
    return handleApiError(e);
  }
}
