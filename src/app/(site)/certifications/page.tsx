import type { Metadata } from "next";
import { CertificationsPage } from "@/components/public/certifications-page";
import { getPublishedCourses } from "@/lib/courses";
import type { EnquiryCourseOption } from "@/lib/types";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

/**
 * /certifications — IATA Preferred, STED Council and institute certificates.
 * force-dynamic: the enquiry course list reads the same shared store the
 * admin manages, so new courses are selectable immediately.
 */
export const dynamic = "force-dynamic";

const CANONICAL = "https://www.skyoragroup.com/certifications";

export const metadata: Metadata = {
  title: "Certifications — IATA Preferred & STED Council Certified Courses",
  description:
    "Certifications Skyora students earn: IATA-preferred aviation training, STED Council certificates for IT courses and the Skyora institute certificate with project and interview records. Industry-recognised credentials in Kochi, Kerala.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Certifications | Skyora Group of Institutes",
    description:
      "IATA-preferred aviation certification and STED Council IT certificates — industry-recognised credentials from Skyora Group in Kochi.",
    url: CANONICAL,
    type: "website",
  },
};

export default async function Certifications() {
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
          { name: "Certifications", url: CANONICAL },
        ])}
      />
      <CertificationsPage enquiryOptions={enquiryOptions} />
    </>
  );
}

