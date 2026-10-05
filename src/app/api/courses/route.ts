import { NextRequest, NextResponse } from "next/server";
import { courseCreateSchema, handleApiError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/mask";

export const dynamic = "force-dynamic";

/** GET /api/courses — admin management list (includes inactive). */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const courses = await db.course.findMany({
      orderBy: [{ track: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ courses });
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/courses — create a course. Audit-logged. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => null);
    const data = courseCreateSchema.parse(body);

    // unique slug generation
    let slug = slugify(data.title) || `course-${Date.now()}`;
    let suffix = 1;
    while (await db.course.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${slugify(data.title)}-${suffix}`;
    }

    const course = await db.course.create({
      data: {
        title: data.title,
        track: data.track,
        slug,
        duration: data.duration,
        description: data.description,
        skills: data.skills,
        jobRoles: data.jobRoles,
        workplaces: data.workplaces,
        image: data.image ? data.image : null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    await logAudit({
      userId: user.id,
      action: "COURSE_CREATE",
      entity: "COURSE",
      entityId: course.id,
      ipAddress: getClientIp(req),
      meta: { title: course.title, track: course.track },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
