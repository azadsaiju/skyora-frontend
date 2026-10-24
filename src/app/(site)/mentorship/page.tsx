import type { Metadata } from "next";
import { MentorshipPage } from "@/components/public/mentorship-page";
import { getPublishedCourses } from "@/lib/courses";
import type { EnquiryCourseOption } from "@/lib/types";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

/**
 * /mentorship — the 1:1 mentorship program.
 * force-dynamic: the enquiry course list reads the same shared store the
 * admin manages, so new courses are selectable immediately.
 */
export const dynamic = "force-dynamic";

const CANONICAL = "https://www.skyoragroup.com/mentorship";

export const metadata: Metadata = {
  title: "Career Mentorship — 1:1 Guidance from Aviation & IT Professionals",
  description:
    "Skyora's mentorship program in Kochi, Kerala: 1:1 mentoring with industry mentors from aviation and IT, mock interviews, resume preparation, career roadmap and placement guidance for freshers and graduates.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Career Mentorship | Skyora Group of Institutes",
    description:
      "1:1 career mentorship with aviation and IT industry mentors — mock interviews, resume building and placement guidance in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default async function Mentorship() {
  const courses = await getPublishedCourses();
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
          { name: "Mentorship", url: CANONICAL },
        ])}
      />
      <MentorshipPage enquiryOptions={enquiryOptions} />
    </>
  );
}

