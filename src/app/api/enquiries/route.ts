import { NextRequest, NextResponse } from "next/server";
import { enquiryQuerySchema, handleApiError } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildEnquiryWhere } from "@/lib/enquiry-filters";
import { maskEmail, maskPhone } from "@/lib/mask";
import type {
  EnquiryListResponseDTO,
  EnquiryListItemDTO,
  EnquiryStatus,
  Track,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/enquiries — paginated, filterable list.
 * ADMIN role: phone/email are MASKED in list view (full values only in detail).
 * SUPER_ADMIN: full values everywhere.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const sp = req.nextUrl.searchParams;
    const query = enquiryQuerySchema.parse(Object.fromEntries(sp.entries()));

    const where = await buildEnquiryWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [total, rows] = await Promise.all([
      db.enquiry.count({ where }),
      db.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          course: { select: { id: true, title: true, track: true } },
          assignedTo: { select: { id: true, name: true } },
          followUps: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { note: true, nextActionDate: true },
          },
        },
      }),
    ]);

    const mask = user.role === "ADMIN";
    const items: EnquiryListItemDTO[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: mask ? maskPhone(row.phone) : row.phone,
      email: mask ? maskEmail(row.email) : row.email,
      status: row.status as EnquiryStatus,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      course: row.course
        ? { id: row.course.id, title: row.course.title, track: row.course.track as Track }
        : null,
      assignedTo: row.assignedTo,
      latestFollowUpNote: row.followUps[0]?.note ?? null,
      latestNextActionDate: row.followUps[0]?.nextActionDate
        ? row.followUps[0].nextActionDate.toISOString()
        : null,
    }));

    const payload: EnquiryListResponseDTO = {
      items,
      total,
      page,
      pageSize,
    };
    return NextResponse.json(payload);
  } catch (e) {
    return handleApiError(e);
  }
}
