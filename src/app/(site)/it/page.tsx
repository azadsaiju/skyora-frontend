import type { Metadata } from "next";
import { DepartmentView } from "@/components/public/department-view";
import { DEPARTMENTS } from "@/lib/departments";
import { getPublishedCourses } from "@/lib/courses";
import type { CoursePublicDTO, EnquiryCourseOption } from "@/lib/types";

/**
 * /it — IT & Software department page.
 * force-dynamic: renders ALL IT courses straight from the shared database
 * store, so courses added/edited in the admin panel appear here instantly
 * with no code changes or redeploy.
 */
export const dynamic = "force-dynamic";

const dept = DEPARTMENTS.IT;

export const metadata: Metadata = {
  title: `${dept.name} Department — ${dept.tagline}`,
  description: dept.metaDescription,
};

export default async function ITPage() {
  const courses: CoursePublicDTO[] = await getPublishedCourses("IT");
  const enquiryOptions: EnquiryCourseOption[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    duration: c.duration,
  }));

  return <DepartmentView dept={dept} courses={courses} enquiryOptions={enquiryOptions} />;
}
