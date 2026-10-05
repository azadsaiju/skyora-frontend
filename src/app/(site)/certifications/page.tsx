import type { Metadata } from "next";
import { CertificationsPage } from "@/components/public/certifications-page";
import { getPublishedCourses } from "@/lib/courses";
import type { EnquiryCourseOption } from "@/lib/types";

/**
 * /certifications — IATA Preferred, STED Council and institute certificates.
 * force-dynamic: the enquiry course list reads the same shared store the
 * admin manages, so new courses are selectable immediately.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certifications — IATA Preferred · STED Council · Skyora",
  description:
    "Certifications Skyora students earn: IATA-preferred aviation training, STED Council certificates for IT courses and the Skyora institute certificate with project and interview records.",
};

export default async function Certifications() {
  const courses = await getPublishedCourses();
  const enquiryOptions: EnquiryCourseOption[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    duration: c.duration,
  }));

  return <CertificationsPage enquiryOptions={enquiryOptions} />;
}
