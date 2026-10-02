import { NextRequest, NextResponse } from "next/server";
import {
  achievementUpdateSchema,
  handleApiError,
  jsonError,
} from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** PATCH /api/achievements/[id] — update. Audit-logged. */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = achievementUpdateSchema.parse(body);

    const existing = await db.achievement.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Achievement not found.", "NOT_FOUND");

    const achievement = await db.achievement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.link !== undefined && { link: data.link || null }),
        ...(data.date !== undefined && { date: new Date(`${data.date}T00:00:00`) }),
      },
    });

    await logAudit({
      userId: user.id,
      action: "ACHIEVEMENT_UPDATE",
      entity: "ACHIEVEMENT",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { changes: data },
    });

    return NextResponse.json({ achievement });
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/achievements/[id] — delete. Audit-logged. */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;

    const existing = await db.achievement.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Achievement not found.", "NOT_FOUND");

    await db.achievement.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "ACHIEVEMENT_DELETE",
      entity: "ACHIEVEMENT",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { title: existing.title },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
