/**
 * Department metadata — single source of truth for the two career tracks.
 * Used by the homepage cards, /aviation, /it, /certifications and the admin
 * courses manager so every surface stays consistent.
 */

import type { Track } from "@/lib/types";

export interface DepartmentMeta {
  track: Track;
  /** Display name, e.g. "Aviation" */
  name: string;
  /** Full nav label, e.g. "IT & Software" */
  navLabel: string;
  /** Public route path: /aviation · /it */
  path: string;
  /** Accent color (harmonized with the olive theme) */
  accent: string;
  /** Department hero image (also the auto-assigned course image) */
  heroImage: string;
  /** Short blurb shown under the hero */
  tagline: string;
  /** Longer intro paragraph */
  intro: string;
  /** Meta description for SEO */
  metaDescription: string;
}

export const DEPARTMENTS: Record<Track, DepartmentMeta> = {
  AVIATION: {
    track: "AVIATION",
    name: "Aviation",
    navLabel: "Aviation",
    path: "/aviation",
    accent: "#1D4ED8",
    heroImage: "/departments/aviation-hero.png",
    tagline: "From check-in desk to cruising altitude.",
    intro:
      "The Skyora Aviation department trains the people who keep an airport moving — cabin crew, ground staff and airport operations teams. Every program is built with working airline professionals, drilled in mock panels and real scenarios, and aligned with IATA standards, so you walk into airline interviews already doing the job.",
    metaDescription:
      "Skyora Aviation department — IATA-preferred cabin crew, ground staff and airport operations courses with mock interviews and placement support.",
  },
  IT: {
    track: "IT",
    name: "IT & Software",
    navLabel: "IT & Software",
    path: "/it",
    accent: "#0891B2",
    heroImage: "/departments/it-hero.png",
    tagline: "Code, data, dashboards — shipped, not memorized.",
    intro:
      "The Skyora IT & Software department turns beginners into hireable engineers, analysts and data scientists. You learn by shipping: real datasets, real apps, real code reviews from mentors who work in the industry — with a STED Council certificate and a portfolio that speaks in interviews.",
    metaDescription:
      "Skyora IT & Software department — STED Council certified Data Science, analytics, Flutter and full stack courses with mentor-led projects and placement support.",
  },
};

export const TRACK_LIST: Track[] = ["AVIATION", "IT"];
