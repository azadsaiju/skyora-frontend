"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHashRoute } from "@/hooks/use-hash-route";
import { HomeSection } from "@/components/public/home-section";
import { CoursesSection } from "@/components/public/courses-section";
import { AchievementsSection } from "@/components/public/achievements-section";
import { PlacementsSection } from "@/components/public/placements-section";
import { ContactSection } from "@/components/public/contact-section";
import { AdminApp } from "@/components/admin/admin-app";

/**
 * Home (the `/` route). The legacy hash routes still work here:
 * - #/admin → full-screen admin portal (no public chrome)
 * - #/courses → redirected to the new /aviation department page
 * - #/about   → redirected to the new /about page
 * - #/achievements, #/placements, #/contact → legacy sections kept alive
 */
export default function HomePage() {
  const { route } = useHashRoute();
  const router = useRouter();

  const redirect =
    route === "courses" ? "/aviation" : route === "about" ? "/about" : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (route === "admin") return <AdminApp />;
  if (redirect) return null;

  return (
    <>
      {route === "home" && <HomeSection />}
      {route === "achievements" && <AchievementsSection />}
      {route === "placements" && <PlacementsSection />}
      {route === "contact" && <ContactSection />}
    </>
  );
}
