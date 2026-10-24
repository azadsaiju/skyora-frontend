import type { Metadata } from "next";
import { AchievementsSection } from "@/components/public/achievements-section";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/seo-jsonld";

const CANONICAL = "https://www.skyoragroup.com/achievements";

export const metadata: Metadata = {
  title: "Achievements & Student Wins | Skyora Group of Institutes",
  description:
    "Explore hackathon podiums, shipped projects, global certifications, and placement letters achieved by Skyora Group students in Kochi, Kerala.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: "Student Achievements & Milestones | Skyora Group of Institutes",
    description:
      "Timestamped proof of what our students achieve: hackathon finalists, Microsoft DP-900 batch certifications, and production app deployments in Kochi, Kerala.",
    url: CANONICAL,
    type: "website",
  },
};

export default function AchievementsPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.skyoragroup.com" },
          { name: "Achievements", url: CANONICAL },
        ])}
      />
      <AchievementsSection />
    </>
  );
}
