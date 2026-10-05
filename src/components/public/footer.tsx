"use client";

/**
 * Site footer — brand, quick links, contact channels, socials.
 * pb-24 on mobile so the fixed floating action buttons never cover text.
 * Bottom bar exposes a labelled "Admin Login" entry to the staff portal (#/admin).
 */

import Image from "next/image";
import {
  Github,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "#/" },
  { label: "Courses", href: "#/courses" },
  { label: "Achievements", href: "#/achievements" },
  { label: "Placements", href: "#/placements" },
  { label: "About", href: "#/about" },
  { label: "Contact", href: "#/contact" },
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
    <footer className="mt-auto rounded-t-2xl bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-40 md:px-6 md:pt-16 md:pb-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="min-w-0">
            <a
              href="#/"
              aria-label="Skyora Group of Institutes — Home"
              className="flex w-fit items-center gap-3"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white/20 bg-white"
              >
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={736}
                  height={1024}
                  className="h-full w-full object-contain p-0.5"
                />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg leading-none">
                  SKYORA
                </span>
                <span className="mt-1 block font-grotesk text-[9px] font-bold uppercase tracking-[0.3em] text-white/50">
                  Group of Institutes
                </span>
              </span>
            </a>
            <p className="mt-4 font-grotesk font-bold">{siteConfig.tagline}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 text-white transition-colors hover:border-brand-pink hover:bg-brand-pink focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer quick links" className="min-w-0">
            <h3 className="font-display text-sm uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-brand-pink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="min-w-0">
            <h3 className="font-display text-sm uppercase tracking-widest">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.links.phoneHref}
                  className="flex items-center gap-2.5 text-white/60 transition-colors hover:text-brand-pink"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="break-words">
                    {siteConfig.links.phoneDisplay}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.gmail}
                  className="flex items-start gap-2.5 text-white/60 transition-colors hover:text-brand-pink"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="break-all">{GMAIL_ADDRESS}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("footer")}
                  className="flex items-center gap-2.5 text-white/60 transition-colors hover:text-brand-pink"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — md:pr-24 keeps the Admin Login pill clear of the fixed
            floating action buttons (WhatsApp/call) pinned to the bottom-right. */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:pr-24">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <p className="max-w-md md:text-right">
              We never share your data. Enquiries are used only for admission
              counselling.
            </p>
            <a
              href="#/admin"
              aria-label="Admin and staff login portal"
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-white/25 px-2.5 py-1.5 font-grotesk text-[11px] font-bold uppercase tracking-wider text-white/70 transition-colors hover:border-brand-pink hover:text-brand-pink focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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
