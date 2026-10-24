import type { Metadata } from "next";
import { PlacementsSection } from "@/components/public/placements-section";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

const CANONICAL = "https://www.skyoragroup.com/placements";

export const metadata: Metadata = {
  title: "Placements & Career Opportunities | Skyora Group of Institutes",
  description:
    "Explore Skyora Group placement records in Kochi, Kerala. Student placements across aviation airlines and top IT recruiters, plus live vacancies with active hiring partners.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Placements & Live Vacancies | Skyora Group of Institutes",
    description:
      "Aviation and IT student placement highlights, active hiring partners, and live career vacancies at Skyora Group of Institutes in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default function PlacementsPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "Placements", url: CANONICAL },
        ])}
      />
      <PlacementsSection />
    </>
  );
}
