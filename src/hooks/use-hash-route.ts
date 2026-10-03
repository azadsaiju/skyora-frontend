"use client";

import { useEffect, useState, useCallback } from "react";

export type PublicRoute =
  | "home"
  | "courses"
  | "achievements"
  | "placements"
  | "about"
  | "contact"
  | "admin";

const VALID: PublicRoute[] = [
  "home",
  "courses",
  "achievements",
  "placements",
  "about",
  "contact",
  "admin",
];

function parseHash(): PublicRoute {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace(/^#\/?/, "").split(/[?/]/)[0] ?? "";
  return (VALID as string[]).includes(raw) ? (raw as PublicRoute) : "home";
}

/**
 * Hash-based router for the single-page shell.
 * - "#/courses"  → courses
 * - "#/admin"    → admin portal
 * - "#/" or ""   → home
 */
export function useHashRoute(): {
  route: PublicRoute;
  navigate: (route: PublicRoute) => void;
} {
  const [route, setRoute] = useState<PublicRoute>("home");

  useEffect(() => {
    const apply = () => {
      const next = parseHash();
      setRoute(next);
      // scroll to top on section change
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const navigate = useCallback((next: PublicRoute) => {
    window.location.hash = next === "home" ? "/" : `/${next}`;
  }, []);

  return { route, navigate };
}
