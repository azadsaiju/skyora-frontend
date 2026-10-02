"use client";

/**
 * Sticky top navigation with hash-route links, active pill state,
 * WhatsApp CTA and a mobile hamburger dropdown.
 */

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import type { PublicRoute } from "@/hooks/use-hash-route";
import { Button } from "@/components/ui/button";

const NAV_LINKS: { label: string; route: PublicRoute; href: string }[] = [
  { label: "Home", route: "home", href: "#/" },
  { label: "Courses", route: "courses", href: "#/courses" },
  { label: "Achievements", route: "achievements", href: "#/achievements" },
  { label: "Placements", route: "placements", href: "#/placements" },
  { label: "About", route: "about", href: "#/about" },
  { label: "Contact", route: "contact", href: "#/contact" },
];

export function Navbar({ route }: { route: PublicRoute }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
        {/* Logo */}
        <a
          href="#/"
          aria-label="Skyora Group of Institutes — Home"
          className="flex min-w-0 items-center gap-3"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink font-display text-xl leading-none text-white"
          >
            S
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-none tracking-tight">
              SKYORA
            </span>
            <span className="mt-0.5 hidden font-grotesk text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground sm:block">
              Group of Institutes
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = route === link.route;
            return (
              <a
                key={link.route}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1 font-grotesk text-sm font-bold transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden rounded-lg font-bold uppercase brutal-hover lg:inline-flex"
          >
            <a
              href={siteConfig.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book Free Call
            </a>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-white shadow-hard-sm transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none lg:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t-2 border-ink bg-cream px-4 pt-3 pb-4 lg:hidden"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const active = route === link.route;
              return (
                <li key={link.route}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2.5 font-grotesk text-sm font-bold uppercase ${
                      active ? "bg-ink text-white" : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <Button
            asChild
            className="mt-3 w-full rounded-lg font-bold uppercase brutal-hover"
          >
            <a
              href={siteConfig.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book Free Call
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}
