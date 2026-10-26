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
    <header className="sticky top-0 z-40 border-b border-[#E6DFC8]/80 bg-[#F8F9F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Skyora Group of Institutes — Home"
          className="flex min-w-0 items-center gap-3"
        >
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200/90 bg-white shadow-xs"
          >
            <Image
              src="/logo-mark.png"
              alt="Skyora Logo"
              width={1024}
              height={1024}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-none tracking-tight text-[#14281D]">
              SKYORA
            </span>
            <span className="mt-0.5 hidden font-grotesk text-[9px] font-bold uppercase tracking-[0.25em] text-stone-500 sm:block">
              Group of Institutes
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav aria-label="Primary" className="hidden items-center gap-1.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = link.match(pathname, route);
            return (
              <NavAnchor
                key={link.label}
                link={link}
                active={active}
                className={`rounded-full px-4 py-1.5 font-grotesk text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#14281D] text-white shadow-xs"
                    : "text-[#24422D] hover:bg-stone-200/50 hover:text-[#14281D]"
                }`}
              />
            );
          })}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden rounded-full bg-[#14281D] px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#1E3A2B] lg:inline-flex"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-[#14281D] shadow-xs transition-colors hover:bg-stone-50 lg:hidden"
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
          className="border-t border-[#E6DFC8]/80 bg-[#F4F6EE] px-4 pt-3 pb-4 lg:hidden"
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
                    className={`block rounded-xl px-3.5 py-2.5 font-grotesk text-sm font-semibold ${
                      active ? "bg-[#14281D] text-white" : "text-[#24422D] hover:bg-stone-200/60"
                    }`}
                  />
                </li>
              );
            })}
          </ul>
          <Button
            asChild
            className="mt-3 w-full rounded-full bg-[#14281D] py-3 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
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
