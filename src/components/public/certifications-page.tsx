"use client";

/**
 * /certifications — the certifications Skyora students earn:
 * IATA Preferred (Aviation), STED Council (IT) and the institute
 * certificate, each displayed with key highlights.
 */

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Code2,
  Plane,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import type { EnquiryCourseOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/public/section-heading";
import { EnquiryDialog } from "@/components/public/enquiry-dialog";

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface CertificationCard {
  key: string;
  title: string;
  issuingBody: string;
  dept: "AVIATION" | "IT" | "BOTH";
  image: string;
  highlights: string[];
  color: string;
}

const CARDS: CertificationCard[] = [
  {
    key: "iata",
    title: "IATA Preferred Training",
    issuingBody: "International Air Transport Association (IATA)",
    dept: "AVIATION",
    image: "/certifications/iata-preferred.png",
    highlights: [
      "Curriculum aligned with IATA international standards",
      "Recognised by airlines and airport employers worldwide",
      "Covers safety, service, DCS and DGCA-norm ground operations",
      "Awarded on completing any Skyora Aviation course",
    ],
    color: "#1d4ed8",
  },
  {
    key: "sted",
    title: "STED Council Certificate",
    issuingBody: "Scientific & Technical Education Development Council",
    dept: "IT",
    image: "/certifications/sted-council.png",
    highlights: [
      "Official certificate on successful course completion",
      "Validates your Data Science / Analytics / Development skills",
      "Adds government-recognised weight to your resume",
      "Awarded on completing any Skyora IT & Software course",
    ],
    color: "#0284c7",
  },
  {
    key: "institute",
    title: "Skyora Institute Certificate",
    issuingBody: "Skyora Group of Institutes",
    dept: "BOTH",
    image: "/logo-full.png",
    highlights: [
      "Issued for every Skyora program — both departments",
      "Backed by your capstone project and mentor evaluations",
      "Includes your mock-interview and placement-readiness record",
      "Trusted by our 40+ hiring partners",
    ],
    color: "#d97706",
  },
];

const DEPT_META: Record<
  CertificationCard["dept"],
  { label: string; Icon: typeof Plane }
> = {
  AVIATION: { label: "Aviation Department", Icon: Plane },
  IT: { label: "IT & Software Department", Icon: Code2 },
  BOTH: { label: "Aviation + IT & Software", Icon: Building2 },
};

export function CertificationsPage({
  enquiryOptions,
}: {
  enquiryOptions: EnquiryCourseOption[];
}) {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section aria-label="Certifications hero" className="relative overflow-hidden border-b border-[#e6dfd3] gradient-mesh">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.25]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center md:px-6 md:py-24">
          <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-stone-500 md:text-sm">
            Papers that open doors
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.95] uppercase text-ink">
            Certifications that{" "}
            <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">employers</span>{" "}
            recognise
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg">
            Every Skyora program ends with a certificate — from IATA-preferred
            aviation training to the STED Council award for IT skills — plus
            your project portfolio and interview record.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 py-2 font-grotesk text-xs font-bold tracking-wide uppercase text-stone-700 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-brand-blue" aria-hidden />
              Issued on course completion
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 py-2 font-grotesk text-xs font-bold tracking-wide uppercase text-stone-700 shadow-xs">
              <BadgeCheck className="h-4 w-4 text-brand-blue" aria-hidden />
              Recognised by 40+ hiring partners
            </span>
          </div>
        </div>
      </section>

      {/* ── CERTIFICATION CARDS ──────────────────────────────────── */}
      <section aria-label="Certifications offered" className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
        <SectionHeading
          eyebrow="What you earn"
          title="THE CERTIFICATES"
          highlight="CERTIFICATES"
          description="One per department — plus the institute certificate every Skyora student receives."
        />

        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {CARDS.map((card) => {
            const Dept = DEPT_META[card.dept];
            return (
              <motion.article
                key={card.key}
                variants={GRID_ITEM}
                className="brutal-card flex min-w-0 flex-col p-6"
              >
                {/* Certificate image */}
                <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-[#e6dfd3] bg-white p-5 shadow-xs">
                  <Image
                    src={card.image}
                    alt={`${card.title} — official certificate mark`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain p-6"
                  />
                </div>

                <div
                  aria-hidden
                  className="mt-5 block h-1 w-14 rounded-full"
                  style={{ background: card.color }}
                />
                <h2 className="mt-3 font-grotesk text-xl leading-tight font-bold break-words text-ink">
                  {card.title}
                </h2>

                {/* Issuing body */}
                <p className="mt-2 flex items-start gap-2 text-sm text-stone-600">
                  <ScrollText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-grotesk text-[10px] font-bold tracking-widest uppercase text-stone-400">
                      Issued by
                    </span>
                    <span className="break-words">{card.issuingBody}</span>
                  </span>
                </p>

                {/* Department */}
                <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-2.5 py-1 font-grotesk text-[11px] font-bold uppercase text-stone-700">
                  <Dept.Icon className="h-3.5 w-3.5" style={{ color: card.color }} aria-hidden />
                  {Dept.label}
                </p>

                {/* Key highlights */}
                <div className="mt-4">
                  <p className="font-grotesk text-xs font-bold tracking-wide uppercase text-stone-800">
                    Key highlights
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {card.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 text-sm break-words text-stone-600"
                      >
                        <BadgeCheck
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: card.color }}
                          aria-hidden
                        />
                        <span className="min-w-0">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1" />
                <div className="mt-6">
                  <Button
                    asChild
                    className="w-full rounded-xl bg-ink font-bold uppercase text-white hover:bg-stone-800 brutal-hover sm:w-auto"
                  >
                    <Link
                      href={
                        card.dept === "IT"
                          ? "/it"
                          : card.dept === "AVIATION"
                            ? "/aviation"
                            : "/aviation"
                      }
                    >
                      View {card.dept === "IT" ? "IT" : "Aviation"} courses
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section aria-label="Enquire about certifications" className="mx-auto max-w-7xl px-4 pt-4 pb-16 md:px-6 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-xl md:p-14"
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="min-w-0">
              <h2 className="font-display text-3xl leading-[0.95] uppercase text-white md:text-5xl">
                Earn yours{" "}
                <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">next</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-stone-300 md:text-base">
                Pick a course, finish the capstone, walk out with the
                certificate and the portfolio to back it up.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                source="certifications"
                triggerLabel="Enquire Now"
                triggerClassName="rounded-xl bg-brand-blue px-6 font-bold uppercase text-white hover:bg-brand-blue/90 brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-xl border border-white/20 font-bold uppercase text-white hover:bg-white/10"
              >
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("certifications")}
                >
                  WhatsApp us
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
