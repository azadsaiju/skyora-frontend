import { NextRequest, NextResponse } from "next/server";
import { achievementCreateSchema, handleApiError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET /api/achievements — admin list (latest first). */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const achievements = await db.achievement.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ achievements });
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/achievements — create. Audit-logged. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => null);
    const data = achievementCreateSchema.parse(body);

    const achievement = await db.achievement.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        link: data.link || null,
        date: new Date(`${data.date}T00:00:00`),
      },
    });

    await logAudit({
      userId: user.id,
      action: "ACHIEVEMENT_CREATE",
      entity: "ACHIEVEMENT",
      entityId: achievement.id,
      ipAddress: getClientIp(req),
      meta: { title: achievement.title, type: achievement.type },
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
