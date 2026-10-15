import { NextRequest, NextResponse } from "next/server";
import { vacancyUpdateSchema, handleApiError, jsonError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** PATCH /api/vacancies/[id] — update (incl. open/close toggle). Audit-logged. */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = vacancyUpdateSchema.parse(body);

    const existing = await db.vacancy.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Vacancy not found.", "NOT_FOUND");

    const vacancy = await db.vacancy.update({ where: { id }, data });

    await logAudit({
      userId: user.id,
      action: "VACANCY_UPDATE",
      entity: "VACANCY",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { changes: data },
    });

    return NextResponse.json({ vacancy });
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/vacancies/[id] — delete a vacancy. Audit-logged. */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireAuth(req);
    const { id } = await ctx.params;

    const existing = await db.vacancy.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Vacancy not found.", "NOT_FOUND");

    await db.vacancy.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "VACANCY_DELETE",
      entity: "VACANCY",
      entityId: id,
      ipAddress: getClientIp(req),
      meta: { title: existing.title, company: existing.company },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
