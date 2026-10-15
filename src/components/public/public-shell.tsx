"use client";

/**
 * Shared chrome for every public page (home + /aviation, /it, /about,
 * /mentorship, /certifications). Renders the olive canvas wrapper with
 * Navbar, Footer and floating action buttons.
 *
 * When the #/admin hash is active the shell renders its children bare —
 * the admin portal is a full-screen dashboard without public chrome.
 */

import type { ReactNode } from "react";
import { useHashRoute } from "@/hooks/use-hash-route";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FloatingButtons } from "@/components/public/floating-buttons";

export function PublicShell({ children }: { children: ReactNode }) {
  const { route } = useHashRoute();

  if (route === "admin") {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
