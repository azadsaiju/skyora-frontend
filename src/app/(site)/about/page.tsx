import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

const CANONICAL = "https://www.skyoragroup.com/about";

export const metadata: Metadata = {
  title: "About Skyora Group of Institutes — Our Story, Mission & Mentors",
  description:
    "Learn about Skyora Group of Institutes — our story, mission, mentor-led training approach, and commitment to aviation and IT career development in Kochi, Kerala. Small batches, real projects, and active placement support.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "About Skyora Group of Institutes — Our Story, Mission & Mentors",
    description:
      "Discover the Skyora story — mentor-led aviation and IT training with small batches, real projects and placement support in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default function About() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "About", url: CANONICAL },
        ])}
      />
      <AboutPage />
    </>
  );
}

