import type { Metadata } from "next";
import { ContactSection } from "@/components/public/contact-section";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

const CANONICAL = "https://www.skyoragroup.com/contact";

export const metadata: Metadata = {
  title: "Contact Us & Admissions Enquiry | Skyora Group of Institutes",
  description:
    "Contact Skyora Group of Institutes in Kochi, Kerala. Speak to an admission counsellor for aviation and IT training programs via phone, WhatsApp, email, or our online enquiry form.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Contact Skyora Group of Institutes | Admissions in Kochi",
    description:
      "Get in touch with Skyora Group counsellors in Kochi, Kerala for aviation and IT courses. Free counselling, syllabus guidance, and admission support.",
    url: CANONICAL,
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "Contact", url: CANONICAL },
        ])}
      />
      <ContactSection />
    </>
  );
}
