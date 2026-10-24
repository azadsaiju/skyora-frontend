import type { Metadata } from "next";
import { DepartmentView } from "@/components/public/department-view";
import { DEPARTMENTS } from "@/lib/departments";
import { getPublishedCourses } from "@/lib/courses";
import type { CoursePublicDTO, EnquiryCourseOption } from "@/lib/types";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

/**
 * /aviation — Aviation department page.
 * force-dynamic: renders ALL Aviation courses straight from the shared
 * database store, so courses added/edited in the admin panel appear here
 * instantly with no code changes or redeploy.
 */
export const dynamic = "force-dynamic";

const dept = DEPARTMENTS.AVIATION;
const CANONICAL = "https://www.skyoragroup.com/aviation";

export const metadata: Metadata = {
  title: "Aviation Courses in Kochi — Cabin Crew, Ground Staff & Airport Ops Training",
  description:
    "IATA-preferred aviation courses in Kochi, Kerala — cabin crew training, ground staff and airport operations programs with mock interviews, grooming drills and placement support at Skyora Group.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Aviation Courses in Kochi | Skyora Group of Institutes",
    description:
      "IATA-preferred cabin crew, ground staff and airport operations training with placement support in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default async function AviationPage() {
  const courses: CoursePublicDTO[] = await getPublishedCourses("AVIATION");
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
          { name: "Aviation", url: CANONICAL },
        ])}
      />
      <DepartmentView dept={dept} courses={courses} enquiryOptions={enquiryOptions} />
    </>
  );
}

