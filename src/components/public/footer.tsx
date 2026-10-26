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
  { label: "Mentorship", href: "/mentorship" },
  { label: "Certifications", href: "/certifications" },
  { label: "About", href: "/about" },
];

const SOCIALS: { label: string; href: string; Icon: typeof Github }[] = [
  { label: "Chat on WhatsApp", href: siteConfig.links.whatsapp, Icon: MessageCircle },
  { label: "Skyora on Instagram", href: siteConfig.links.instagram, Icon: Instagram },
  { label: "Skyora on LinkedIn", href: siteConfig.links.linkedin, Icon: Linkedin },
  { label: "Skyora on GitHub", href: siteConfig.links.github, Icon: Github },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#e6dfd3] bg-[#ece4d6]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-40 md:px-6 md:pt-16 md:pb-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.4fr]">
          {/* Brand */}
          <div className="min-w-0">
            <a
              href="/"
              aria-label="Skyora Group of Institutes — Home"
              className="flex w-fit items-center gap-3"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e6dfd3] bg-white shadow-xs"
              >
                <Image
                  src="/logo-mark.png"
                  alt="Skyora Logo"
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
                  Group of Institutes
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
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 transition-colors hover:text-ink"
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
            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5 text-stone-600">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-pink" aria-hidden />
                <address className="not-italic leading-relaxed text-stone-600">
                  <span className="block font-semibold text-ink">
                    Skyora group of instituions
                  </span>
                  <span>3rd floor, Corner Stone Building,</span>
                  <br />
                  <span>Near kadavanthra metro station Pillar No 783,</span>
                  <br />
                  <span>Cochin Kerala</span>
                </address>
              </div>

              <div>
                <a
                  href={siteConfig.links.phoneHref}
                  className="flex items-center gap-2.5 text-stone-600 transition-colors hover:text-ink"
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
                  <span className="break-words font-medium">
                    {siteConfig.links.phoneDisplay}
                  </span>
                </a>
              </div>

              <div>
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("footer")}
                  className="flex items-center gap-2.5 text-stone-600 transition-colors hover:text-ink"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                  <span className="font-medium">WhatsApp us</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#ded5c5] pt-6 text-xs text-stone-500 md:flex-row">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
