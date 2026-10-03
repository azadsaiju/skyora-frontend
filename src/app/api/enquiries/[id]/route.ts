import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { enquiryUpdateSchema } from "@/lib/validators";
import type { EnquiryDetailDTO, EnquiryStatus, Track } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/enquiries/[id] — full detail incl. follow-up history.
 * Both roles may view detail (full values shown here per spec).
 * Access is re-verified server-side on every fetch (IDOR guard).
 */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireAuth(req);
    const { id } = await ctx.params;

    const row = await db.enquiry.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, track: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        followUps: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
    if (!row) return jsonError(404, "Enquiry not found.", "NOT_FOUND");

    const payload: EnquiryDetailDTO = {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: row.status as EnquiryStatus,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      course: row.course
        ? { id: row.course.id, title: row.course.title, track: row.course.track as Track }
        : null,
      assignedTo: row.assignedTo,
      followUps: row.followUps.map((f) => ({
        id: f.id,
        enquiryId: f.enquiryId,
        note: f.note,
        nextActionDate: f.nextActionDate ? f.nextActionDate.toISOString() : null,
        createdAt: f.createdAt.toISOString(),
        createdBy: f.createdBy,
      })),
    };
    return NextResponse.json(payload);
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * PATCH /api/enquiries/[id] — update status and/or assignment.
 * Every change is audit-logged (STATUS_CHANGE / ASSIGN_CHANGE).
 */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = enquiryUpdateSchema.parse(body);

    const existing = await db.enquiry.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Enquiry not found.", "NOT_FOUND");

    const updateData: { status?: string; assignedToId?: string | null } = {};

    if (data.status && data.status !== existing.status) {
      updateData.status = data.status;
    }
    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null || data.assignedToId === "") {
        updateData.assignedToId = null;
      } else {
        const assignee = await db.user.findUnique({
          where: { id: data.assignedToId },
        });
        if (!assignee || !assignee.isActive) {
          return jsonError(400, "Assignee must be an active admin.", "INVALID_ASSIGNEE");
        }
        updateData.assignedToId = assignee.id;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return jsonError(400, "Nothing to update.", "NO_CHANGES");
    }

    const updated = await db.enquiry.update({
      where: { id },
      data: updateData,
      include: {
        course: { select: { id: true, title: true, track: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const ip = getClientIp(req);
    if (updateData.status) {
      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "ENQUIRY",
        entityId: id,
        ipAddress: ip,
        meta: { from: existing.status, to: updateData.status },
      });
    }
    if (updateData.assignedToId !== undefined) {
      await logAudit({
        userId: user.id,
        action: "ASSIGN_CHANGE",
        entity: "ENQUIRY",
        entityId: id,
        ipAddress: ip,
        meta: { from: existing.assignedToId, to: updateData.assignedToId },
      });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      assignedTo: updated.assignedTo
        ? { id: updated.assignedTo.id, name: updated.assignedTo.name }
        : null,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * DELETE /api/enquiries/[id] — SUPER_ADMIN only.
 * ADMIN (even via direct API call) receives 403. Audit-logged.
 */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    if (user.role !== "SUPER_ADMIN") {
      return jsonError(
        403,
        "Forbidden — only super admins can delete enquiries.",
        "FORBIDDEN"
      );
    }
    const { id } = await ctx.params;
    const existing = await db.enquiry.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Enquiry not found.", "NOT_FOUND");

    await db.enquiry.delete({ where: { id } });
    await logAudit({
      userId: user.id,
      action: "ENQUIRY_DELETE",
      entity: "ENQUIRY",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { name: existing.name, email: existing.email },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
