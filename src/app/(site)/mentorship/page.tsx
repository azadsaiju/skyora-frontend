import type { Metadata } from "next";
import { MentorshipPage } from "@/components/public/mentorship-page";
import { getPublishedCourses } from "@/lib/courses";
import type { EnquiryCourseOption } from "@/lib/types";

/**
 * /mentorship — the 1:1 mentorship program.
 * force-dynamic: the enquiry course list reads the same shared store the
 * admin manages, so new courses are selectable immediately.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentorship — 1:1 guidance from Aviation & IT professionals",
  description:
    "Skyora's mentorship program: 1:1 mentoring with industry mentors from Aviation and IT, mock interviews, resume preparation and a roadmap to your first offer.",
};

export default async function Mentorship() {
  const courses = await getPublishedCourses();
  const enquiryOptions: EnquiryCourseOption[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    duration: c.duration,
  }));

  return <MentorshipPage enquiryOptions={enquiryOptions} />;
}
