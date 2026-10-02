import { NextRequest, NextResponse } from "next/server";
import { courseUpdateSchema, handleApiError, jsonError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** PATCH /api/courses/[id] — update course (incl. isActive toggle). Audit-logged. */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = courseUpdateSchema.parse(body);

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Course not found.", "NOT_FOUND");

    const course = await db.course.update({ where: { id }, data });

    await logAudit({
      userId: user.id,
      action: "COURSE_UPDATE",
      entity: "COURSE",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { changes: data },
    });

    return NextResponse.json({ course });
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/courses/[id] — deletes a course; detaches its enquiries. Audit-logged. */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Course not found.", "NOT_FOUND");

    // Detach enquiries, then delete (courseId is optional on Enquiry).
    await db.enquiry.updateMany({ where: { courseId: id }, data: { courseId: null } });
    await db.course.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "COURSE_DELETE",
      entity: "COURSE",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { title: existing.title },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
