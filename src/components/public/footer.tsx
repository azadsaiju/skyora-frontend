"use client";

/**
 * Site footer — brand, quick links, contact channels, socials.
 * pb-24 on mobile so the fixed floating action buttons never cover text.
 * Bottom bar exposes a labelled "Admin Login" entry to the staff portal (#/admin).
 */

import Image from "next/image";
import Link from "next/link";
import {
  Github,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Aviation", href: "/aviation" },
  { label: "IT & Software", href: "/it" },
  { label: "Placements", href: "/placements" },
  { label: "Achievements", href: "/achievements" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Certifications", href: "/certifications" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const IT_LINKS: { label: string; href: string }[] = [
  { label: "Data Science", href: "/it/data-science" },
  { label: "Artificial Intelligence", href: "/it/artificial-intelligence" },
  { label: "Machine Learning", href: "/it/machine-learning" },
  { label: "Data Analytics", href: "/it/data-analytics" },
];

const SOCIALS: { label: string; href: string; Icon: typeof Github }[] = [
  { label: "Chat on WhatsApp", href: siteConfig.links.whatsapp, Icon: MessageCircle },
  { label: "Email Skyora", href: siteConfig.links.gmail, Icon: Mail },
  { label: "Skyora on Instagram", href: siteConfig.links.instagram, Icon: Instagram },
  { label: "Skyora on LinkedIn", href: siteConfig.links.linkedin, Icon: Linkedin },
  { label: "Skyora on GitHub", href: siteConfig.links.github, Icon: Github },
];

const GMAIL_ADDRESS = siteConfig.links.gmail.replace(/^mailto:/, "");

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#e6dfd3] bg-[#ece4d6]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-40 md:px-6 md:pt-16 md:pb-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.4fr]">
          {/* Brand */}
          <div className="min-w-0">
            <a
              href="/"
              aria-label="Skyora Group of Institutions — Home"
              className="flex w-fit items-center gap-3"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e6dfd3] bg-white shadow-xs"
              >
                <Image
                  src="/images/skyora-logo.jpeg"
                  alt="Skyora Group of Institutions"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg leading-none text-ink">
                  SKYORA
                </span>
                <span className="mt-1 block font-grotesk text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
                  Group of Institutions
                </span>
              </span>
            </a>
            <p className="mt-4 font-grotesk font-bold text-ink">{siteConfig.tagline}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
              {siteConfig.description}
            </p>
            {/* Socials */}
            <div className="mt-6 flex flex-wrap gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cfbe] bg-white text-stone-700 shadow-xs transition-colors hover:border-ink hover:bg-stone-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer quick links" className="min-w-0">
            <h3 className="font-display text-sm uppercase tracking-widest text-ink">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-600 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* IT Programs */}
          <nav aria-label="IT Training Specializations" className="min-w-0">
            <h3 className="font-display text-sm uppercase tracking-widest text-ink">
              IT Programs
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {IT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-600 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="min-w-0">
            <h3 className="font-display text-sm uppercase tracking-widest text-ink">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-stone-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                <span className="leading-relaxed">
                  {siteConfig.address.full}
                </span>
              </li>
              <li>
                <a
                  href={siteConfig.links.phoneHref}
                  className="flex items-center gap-2.5 text-stone-600 transition-colors hover:text-ink"
                >
                  <Phone className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                  <span className="break-words font-medium">
                    {siteConfig.links.phoneDisplay}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("footer")}
                  className="flex items-center gap-2.5 text-stone-600 transition-colors hover:text-ink"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                  <span className="break-words">
                    WhatsApp: {siteConfig.links.phoneDisplay}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.gmail}
                  className="flex items-start gap-2.5 text-stone-600 transition-colors hover:text-ink"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                  <span className="break-all">{GMAIL_ADDRESS}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[#ded5c5] pt-6 text-xs text-stone-500 md:flex-row md:items-center md:justify-between md:pr-24">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <p className="max-w-md md:text-right">
              We never share your data. Enquiries are used only for admission
              counselling.
            </p>
            <a
              href="/#/admin"
              aria-label="Admin and staff login portal"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#d8cfbe] bg-white px-2.5 py-1.5 font-grotesk text-[11px] font-bold uppercase tracking-wider text-stone-700 shadow-xs transition-colors hover:border-ink hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
