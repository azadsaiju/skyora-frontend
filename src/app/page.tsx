"use client";

import { useHashRoute } from "@/hooks/use-hash-route";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FloatingButtons } from "@/components/public/floating-buttons";
import { HomeSection } from "@/components/public/home-section";
import { CoursesSection } from "@/components/public/courses-section";
import { AchievementsSection } from "@/components/public/achievements-section";
import { PlacementsSection } from "@/components/public/placements-section";
import { AboutSection } from "@/components/public/about-section";
import { ContactSection } from "@/components/public/contact-section";
import { AdminApp } from "@/components/admin/admin-app";

export default function Page() {
  const { route } = useHashRoute();

  // Admin portal — unlinked, noindex, rendered on demand via #/admin
  if (route === "admin") {
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <Navbar route={route} />
      <main className="flex-1">
        {route === "home" && <HomeSection />}
        {route === "courses" && <CoursesSection />}
        {route === "achievements" && <AchievementsSection />}
        {route === "placements" && <PlacementsSection />}
        {route === "about" && <AboutSection />}
        {route === "contact" && <ContactSection />}
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
