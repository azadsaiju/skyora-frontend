import { NextRequest, NextResponse } from "next/server";
import {
  followUpCreateSchema,
  followUpUpdateSchema,
  handleApiError,
  jsonError,
} from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/enquiries/[id]/followups — add a follow-up note (+ optional
 * next-action date). Audit-logged as FOLLOWUP_CREATE.
 */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = followUpCreateSchema.parse(body);

    const enquiry = await db.enquiry.findUnique({ where: { id } });
    if (!enquiry) return jsonError(404, "Enquiry not found.", "NOT_FOUND");

    const followUp = await db.followUp.create({
      data: {
        enquiryId: id,
        note: data.note,
        nextActionDate: data.nextActionDate
          ? new Date(`${data.nextActionDate}T12:00:00.000Z`)
          : null,
        createdById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    await logAudit({
      userId: user.id,
      action: "FOLLOWUP_CREATE",
      entity: "ENQUIRY",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { followUpId: followUp.id, nextActionDate: data.nextActionDate ?? null },
    });

    return NextResponse.json(
      {
        id: followUp.id,
        enquiryId: followUp.enquiryId,
        note: followUp.note,
        nextActionDate: followUp.nextActionDate
          ? followUp.nextActionDate.toISOString()
          : null,
        createdAt: followUp.createdAt.toISOString(),
        createdBy: followUp.createdBy,
      },
      { status: 201 }
    );
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * PATCH /api/enquiries/[id]/followups — update an existing follow-up note
 * or reschedule its next-action date. Audit-logged as FOLLOWUP_UPDATE.
 */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = followUpUpdateSchema.parse(body);

    const existing = await db.followUp.findFirst({
      where: { id: data.followUpId, enquiryId: id },
    });
    if (!existing) return jsonError(404, "Follow-up not found.", "NOT_FOUND");

    const updateData: { note?: string; nextActionDate?: Date | null } = {};
    if (data.note !== undefined) {
      updateData.note = data.note;
    }
    if (data.nextActionDate !== undefined) {
      updateData.nextActionDate = data.nextActionDate
        ? new Date(`${data.nextActionDate}T12:00:00.000Z`)
        : null;
    }

    const updated = await db.followUp.update({
      where: { id: existing.id },
      data: updateData,
      include: { createdBy: { select: { id: true, name: true } } },
    });

    await logAudit({
      userId: user.id,
      action: "FOLLOWUP_UPDATE",
      entity: "ENQUIRY",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: {
        followUpId: updated.id,
        nextActionDate: data.nextActionDate ?? null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      enquiryId: updated.enquiryId,
      note: updated.note,
      nextActionDate: updated.nextActionDate
        ? updated.nextActionDate.toISOString()
        : null,
      createdAt: updated.createdAt.toISOString(),
      createdBy: updated.createdBy,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
