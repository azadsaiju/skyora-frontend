import { NextRequest, NextResponse } from "next/server";
import { vacancyCreateSchema, handleApiError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET /api/vacancies — admin list (includes closed). */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const vacancies = await db.vacancy.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ vacancies });
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/vacancies — create a vacancy. Audit-logged. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => null);
    const data = vacancyCreateSchema.parse(body);

    const vacancy = await db.vacancy.create({ data });

    await logAudit({
      userId: user.id,
      action: "VACANCY_CREATE",
      entity: "VACANCY",
      entityId: vacancy.id,
      ipAddress: getClientIp(req),
      meta: { title: vacancy.title, company: vacancy.company },
    });

    return NextResponse.json({ vacancy }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
