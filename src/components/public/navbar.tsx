"use client";

/**
 * Sticky top navigation shared by every public page.
 * Real routes for departments/About + hash link for the admin portal.
 * Active-link styling works on both the home hash-router and real paths.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import { useHashRoute, type PublicRoute } from "@/hooks/use-hash-route";
import { Button } from "@/components/ui/button";

interface NavLink {
  label: string;
  href: string;
  /** external/hash links render as plain <a> (no Next prefetch) */
  plain?: boolean;
  match: (pathname: string, route: PublicRoute) => boolean;
}

const NAV_LINKS: NavLink[] = [
  {
    label: "Home",
    href: "/",
    match: (p, route) => p === "/" && route === "home",
  },
  {
    label: "Aviation",
    href: "/aviation",
    match: (p) => p.startsWith("/aviation"),
  },
  {
    label: "IT & Software",
    href: "/it",
    match: (p) => p.startsWith("/it"),
  },
  {
    label: "Mentorship",
    href: "/mentorship",
    match: (p) => p.startsWith("/mentorship"),
  },
  {
    label: "Certifications",
    href: "/certifications",
    match: (p) => p.startsWith("/certifications"),
  },
  {
    label: "About",
    href: "/about",
    match: (p) => p.startsWith("/about"),
  },
  {
    label: "Admin",
    href: "/#/admin",
    plain: true,
    match: (_p, route) => route === "admin",
  },
];

function NavAnchor({
  link,
  active,
  className,
  onClick,
}: {
  link: NavLink;
  active: boolean;
  className: string;
  onClick?: () => void;
}) {
  if (link.plain) {
    return (
      <a
        href={link.href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {link.label}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  // Hash route (home sections + admin). Initial state "home" matches SSR;
  // the hook re-renders after mount when a hash like #/admin is present.
  const { route } = useHashRoute();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-olive-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Skyora Group of Institutes — Home"
          className="flex min-w-0 items-center gap-3"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-ink bg-white"
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={736}
              height={1024}
              className="h-full w-full object-contain p-0.5"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-none tracking-tight">
              SKYORA
            </span>
            <span className="mt-0.5 hidden font-grotesk text-[9px] font-bold uppercase tracking-[0.3em] text-olive-ink/80 sm:block">
              Group of Institutes
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.match(pathname, route);
            return (
              <NavAnchor
                key={link.label}
                link={link}
                active={active}
                className={`rounded-full px-3 py-1 font-grotesk text-sm font-bold transition-colors ${
                  active
                    ? "bg-ink text-cream"
                    : "text-olive-ink hover:bg-ink/10 hover:text-ink"
                }`}
              />
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
              onClick={() => trackWhatsApp("navbar")}
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
          className="border-t-2 border-ink bg-olive-tint px-4 pt-3 pb-4 lg:hidden"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const active = link.match(pathname, route);
              return (
                <li key={link.label}>
                  <NavAnchor
                    link={link}
                    active={active}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 font-grotesk text-sm font-bold uppercase ${
                      active ? "bg-ink text-cream" : "text-olive-ink hover:bg-ink/10"
                    }`}
                  />
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
              onClick={() => trackWhatsApp("navbar_mobile")}
            >
              Book Free Call
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}
