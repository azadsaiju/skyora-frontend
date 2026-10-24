import type { Metadata } from "next";
import { DepartmentView } from "@/components/public/department-view";
import { DEPARTMENTS } from "@/lib/departments";
import { getPublishedCourses } from "@/lib/courses";
import type { CoursePublicDTO, EnquiryCourseOption } from "@/lib/types";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

/**
 * /it — IT & Software department page.
 * force-dynamic: renders ALL IT courses straight from the shared database
 * store, so courses added/edited in the admin panel appear here instantly
 * with no code changes or redeploy.
 */
export const dynamic = "force-dynamic";

const dept = DEPARTMENTS.IT;
const CANONICAL = "https://www.skyoragroup.com/it";

export const metadata: Metadata = {
  title: "IT & Software Courses in Kochi — Data Science, AI, Full Stack & Analytics",
  description:
    "STED Council certified IT training in Kochi, Kerala — data science, artificial intelligence, machine learning, data analytics, full stack development and cyber security courses with mentor-led projects and placement support at Skyora Group.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "IT & Software Courses in Kochi | Skyora Group of Institutes",
    description:
      "STED Council certified data science, AI, machine learning, data analytics, full stack development and cyber security training in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default async function ITPage() {
  const courses: CoursePublicDTO[] = await getPublishedCourses("IT");
  const enquiryOptions: EnquiryCourseOption[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    duration: c.duration,
  }));

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "IT & Software", url: CANONICAL },
        ])}
      />
      <DepartmentView dept={dept} courses={courses} enquiryOptions={enquiryOptions} />
    </>
  );
}

