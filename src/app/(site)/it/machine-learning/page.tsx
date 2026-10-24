import type { Metadata } from "next";
import { IT_COURSES_DATA } from "@/lib/it-courses-data";
import { getPublishedCourses, getCourseBySlug } from "@/lib/courses";
import type { EnquiryCourseOption } from "@/lib/types";
import { JsonLdScript, breadcrumbJsonLd, courseJsonLd } from "@/lib/seo-jsonld";
import { ITCoursePageView } from "@/components/public/it-course-page";

export const dynamic = "force-dynamic";

const SLUG = "machine-learning";
const CANONICAL = "https://www.skyoragroup.com/it/machine-learning";
const courseStatic = IT_COURSES_DATA[SLUG];

export const metadata: Metadata = {
  title: courseStatic.seoTitle,
  description: courseStatic.seoDescription,
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: `${courseStatic.title} Course in Kochi | Skyora Group of Institutes`,
    description: courseStatic.seoDescription,
    url: CANONICAL,
    type: "website",
  },
};

export default async function MachineLearningCoursePage() {
  const dbCourse = await getCourseBySlug(SLUG);
  const allItCourses = await getPublishedCourses("IT");

  const enquiryOptions: EnquiryCourseOption[] = allItCourses.map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    duration: c.duration,
  }));

  const courseData = {
    ...courseStatic,
    duration: dbCourse?.duration || courseStatic.duration,
    overview: dbCourse?.description || courseStatic.overview,
    skills: dbCourse?.skills?.length ? dbCourse.skills : courseStatic.skills,
    jobRoles: dbCourse?.jobRoles?.length ? dbCourse.jobRoles : courseStatic.jobRoles,
    workplaces: dbCourse?.workplaces?.length
      ? dbCourse.workplaces
      : courseStatic.workplaces,
  };

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "IT & Software", url: "https://www.skyoragroup.com/it" },
          { name: courseData.title, url: CANONICAL },
        ])}
      />
      <JsonLdScript
        data={courseJsonLd({
          name: `${courseData.title} Course in Kochi`,
          description: courseData.seoDescription,
          url: CANONICAL,
        })}
      />
      <ITCoursePageView
        course={courseData}
        enquiryOptions={enquiryOptions}
        dbCourseId={dbCourse?.id}
      />
    </>
  );
}
