/**
 * Server-side course helpers shared by the public pages (RSC) and APIs.
 * The Course row stores lists as newline-separated strings (SQLite has no
 * string arrays); these helpers parse them into arrays for rendering.
 */

import { db } from "@/lib/db";
import type { Course, Track } from "@prisma/client";
import type { CoursePublicDTO } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/departments";

export function parseLines(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

export function toPublicCourse(course: Course): CoursePublicDTO {
  return {
    id: course.id,
    title: course.title,
    track: course.track as Track,
    slug: course.slug,
    duration: course.duration,
    description: course.description,
    skills: parseLines(course.skills),
    jobRoles: parseLines(course.jobRoles),
    workplaces: parseLines(course.workplaces),
    image: course.image && course.image.length > 0 ? course.image : null,
  };
}

/**
 * Published courses for the public site, ordered by sortOrder then title.
 * When admin adds/edits a course these pages pick it up on the next request
 * (pages using this helper are force-dynamic).
 */
export async function getPublishedCourses(track?: Track): Promise<CoursePublicDTO[]> {
  const courses = await db.course.findMany({
    where: { isActive: true, ...(track ? { track } : {}) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return courses.map(toPublicCourse);
}

/** Image for a course card: course.image if set, else the department hero. */
export function courseImage(course: Pick<CoursePublicDTO, "image" | "track">): string {
  return course.image ?? DEPARTMENTS[course.track].heroImage;
}
