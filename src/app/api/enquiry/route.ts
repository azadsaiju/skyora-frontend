import { NextRequest, NextResponse } from "next/server";
import { enquiryCreateSchema, handleApiError, jsonError } from "@/lib/validators";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/enquiry — public enquiry submission.
 * - Rate limited: max 3 submissions per IP per 10 minutes → 429.
 * - Honeypot field `website` must be empty; bot fills → silent fake success.
 * - Zod-validated; stored with source page + timestamp.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Rate limit per IP
    const limit = checkRateLimit(`enquiry:${ip}`, 3, 10 * 60_000);
    if (!limit.allowed) {
      return jsonError(
        429,
        "You've sent several enquiries already. Please try again in a few minutes or reach us directly on WhatsApp.",
        "RATE_LIMITED",
        { retryAfterSec: limit.retryAfterSec }
      );
    }

    const body = await req.json().catch(() => null);
    const data = enquiryCreateSchema.parse(body);

    // 2. Honeypot — pretend everything is fine, save nothing.
    if (data.website && data.website.trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    // 3. Validate the referenced course exists (and is active).
    const course = await db.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course || !course.isActive) {
      return jsonError(400, "Selected course is not available.", "INVALID_COURSE");
    }

    // 4. Persist
    await db.enquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        courseId: course.id,
        message: data.message || null,
        source: data.source || "website",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
