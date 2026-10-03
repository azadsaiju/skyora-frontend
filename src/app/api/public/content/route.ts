import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/content
 * Public, unauthenticated content feed for the marketing site:
 * active courses, latest achievements, open vacancies.
 * Always fresh (no caching) so admin edits reflect immediately.
 */
export async function GET() {
  try {
    const [courses, achievements, vacancies] = await Promise.all([
      db.course.findMany({
        where: { isActive: true },
        orderBy: [{ track: "asc" }, { createdAt: "asc" }],
      }),
      db.achievement.findMany({ orderBy: { date: "desc" }, take: 24 }),
      db.vacancy.findMany({
        where: { isOpen: true },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);
    return NextResponse.json(
      { courses, achievements, vacancies },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[public/content]", e);
    return NextResponse.json(
      { courses: [], achievements: [], vacancies: [] },
      { status: 200 }
    );
  }
}
