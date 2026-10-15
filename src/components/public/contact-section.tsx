"use client";

/**
 * Contact page: channel cards (WhatsApp / Gmail / Instagram / LinkedIn),
 * enquiry info panel and the full enquiry form.
 * All links are read from siteConfig.links — nothing hardcoded.
 */

import { motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import { Skeleton } from "@/components/ui/skeleton";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

const GMAIL_ADDRESS = siteConfig.links.gmail.replace(/^mailto:/, "");
const INSTAGRAM_HANDLE = `${
  siteConfig.links.instagram.split("/").filter(Boolean).pop() ?? "skyora"
}`;

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CHANNELS: {
  label: string;
  sub: string;
  href: string;
  Icon: LucideIcon;
  color: string;
  external: boolean;
}[] = [
  {
    label: "WhatsApp",
    sub: "Chat instantly — fastest reply",
    href: siteConfig.links.whatsapp,
    Icon: MessageCircle,
    color: "#059669",
    external: true,
  },
  {
    label: "Gmail",
    sub: GMAIL_ADDRESS,
    href: siteConfig.links.gmail,
    Icon: Mail,
    color: "#e11d48",
    external: false,
  },
  {
    label: "Instagram",
    sub: INSTAGRAM_HANDLE,
    href: siteConfig.links.instagram,
    Icon: Instagram,
    color: "#d97706",
    external: true,
  },
  {
    label: "LinkedIn",
    sub: "Company news & alumni wins",
    href: siteConfig.links.linkedin,
    Icon: Linkedin,
    color: "#1d4ed8",
    external: true,
  },
];

const PROMISES = [
  "Response within 24 hours — usually much faster",
  "A counsellor calls you back, free",
  "No spam. Your details stay with Skyora.",
];

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-9 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export function ContactSection() {
  const { data, error, loading, refetch } = usePublicContent();
  const courses = data?.courses ?? [];

  return (
    <section
      aria-label="Contact Skyora"
      className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
    >
      {/* Big heading */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="font-display text-5xl leading-[0.95] uppercase text-ink sm:text-6xl lg:text-7xl">
          {"Let's "}
          <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">talk</span>.
        </h2>
        <p className="mt-4 text-base text-stone-600 md:text-lg">
          Pick a channel — a human always answers.
        </p>
      </motion.div>

      {/* Channel cards */}
      <motion.div
        variants={GRID_CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CHANNELS.map(({ label, sub, href, Icon, color, external }) => (
          <motion.a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={() => {
              if (label === "WhatsApp") trackWhatsApp("contact_card");
            }}
            variants={GRID_ITEM}
            className="brutal-card brutal-hover block min-w-0 p-5"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: `${color}18`, color }}
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="mt-4 block font-display text-lg uppercase text-ink">
              {label}
            </span>
            <span className="mt-1 block text-sm break-words text-stone-600">
              {sub}
            </span>
            <span className="mt-3 inline-flex items-center gap-1 font-grotesk text-xs font-bold uppercase text-brand-blue">
              Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </motion.a>
        ))}
      </motion.div>

      {/* Info + form */}
      <div className="mt-12 grid gap-6 lg:grid-cols-5">
        <div className="brutal-card p-6 md:p-8 lg:col-span-2">
          <h3 className="font-display text-2xl leading-tight uppercase text-ink">
            Send an enquiry
          </h3>
          <ul className="mt-5 space-y-3">
            {PROMISES.map((promise) => (
              <li
                key={promise}
                className="flex items-start gap-2.5 text-sm break-words text-stone-700"
              >
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-green"
                />
                <span>{promise}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-grotesk text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
            Prefer to call?
          </p>
          <a
            href={siteConfig.links.phoneHref}
            className="mt-2 inline-block font-display text-xl break-all text-ink transition-colors hover:text-brand-blue md:text-2xl"
          >
            {siteConfig.links.phoneDisplay}
          </a>
        </div>

        <div className="brutal-card p-6 md:p-8 lg:col-span-3">
          {loading ? (
            <FormSkeleton />
          ) : error ? (
            <ContentError message={error} onRetry={refetch} />
          ) : (
            <>
              {courses.length === 0 && (
                <p className="mb-4 rounded-xl bg-[#f4ede3] px-3 py-2 text-sm text-stone-600">
                  The course list is updating — call or WhatsApp us in the
                  meantime.
                </p>
              )}
              <EnquiryForm
                courses={courses}
                source="contact"
                onSuccess={() =>
                  toast.success(
                    "Enquiry received — our counsellors will call you within 24 hours."
                  )
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
