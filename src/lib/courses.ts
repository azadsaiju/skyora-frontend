/**
 * Server-side course helpers shared by the public pages (RSC) and APIs.
 * The Course row stores lists as newline-separated strings (SQLite has no
 * string arrays); these helpers parse them into arrays for rendering.
 */

import { db } from "@/lib/db";
import type { Course } from "@prisma/client";
import type { CoursePublicDTO, Track } from "@/lib/types";
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
  try {
    const courses = await db.course.findMany({
      where: { isActive: true, ...(track ? { track } : {}) },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return courses.map(toPublicCourse);
  } catch (e) {
    console.error("[courses:getPublishedCourses]", e);
    return [];
  }
}

/**
 * Fetch a single published course by its unique slug.
 * Returns null if not found or inactive.
 */
export async function getCourseBySlug(slug: string): Promise<CoursePublicDTO | null> {
  try {
    const course = await db.course.findUnique({
      where: { slug },
    });
    if (!course || !course.isActive) return null;
    return toPublicCourse(course);
  } catch (e) {
    console.error(`[courses:getCourseBySlug] Error fetching slug "${slug}":`, e);
    return null;
  }
}

/** Image for a course card: course.image if set, else the department hero. */
export function courseImage(course: Pick<CoursePublicDTO, "image" | "track">): string {
  return course.image ?? DEPARTMENTS[course.track].heroImage;
}
