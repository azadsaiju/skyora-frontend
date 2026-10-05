"use client";

/**
 * /certifications — the certifications Skyora students earn:
 * IATA Preferred (Aviation), STED Council (IT) and the institute
 * certificate, each as a brutal card with the official mark, issuing
 * body, department and key highlights.
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
    color: "#1D4ED8",
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
    color: "#0891B2",
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
    color: "#387003",
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
      <section aria-label="Certifications hero" className="relative overflow-hidden border-b-2 border-ink">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 text-center md:px-6 md:py-20">
          <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground md:text-sm">
            Papers that open doors
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.95] uppercase">
            Certifications that <span className="text-brand-pink">employers</span> recognise
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Every Skyora program ends with a certificate — from IATA-preferred
            aviation training to the STED Council award for IT skills — plus
            your project portfolio and interview record.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 font-grotesk text-xs font-bold tracking-wide uppercase shadow-hard-sm">
              <ShieldCheck className="h-4 w-4 text-brand-pink" aria-hidden />
              Issued on course completion
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 font-grotesk text-xs font-bold tracking-wide uppercase shadow-hard-sm">
              <BadgeCheck className="h-4 w-4 text-brand-pink" aria-hidden />
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
                {/* Certificate image / mockup */}
                <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-ink bg-olive-tint p-5">
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
                  className="mt-5 block h-1.5 w-14 rounded-full"
                  style={{ background: card.color }}
                />
                <h2 className="mt-3 font-grotesk text-xl leading-tight font-bold break-words">
                  {card.title}
                </h2>

                {/* Issuing body */}
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <ScrollText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-grotesk text-[10px] font-bold tracking-widest uppercase">
                      Issued by
                    </span>
                    <span className="break-words">{card.issuingBody}</span>
                  </span>
                </p>

                {/* Department */}
                <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-grotesk text-[11px] font-bold uppercase">
                  <Dept.Icon className="h-3.5 w-3.5" style={{ color: card.color }} aria-hidden />
                  {Dept.label}
                </p>

                {/* Key highlights */}
                <div className="mt-4">
                  <p className="font-grotesk text-xs font-bold tracking-wide uppercase">
                    Key highlights
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {card.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 text-sm break-words text-muted-foreground"
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
                    className="w-full rounded-lg font-bold uppercase brutal-hover sm:w-auto"
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
          className="relative overflow-hidden rounded-3xl bg-olive-deep p-8 text-cream md:p-14"
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="min-w-0">
              <h2 className="font-display text-3xl leading-[0.95] uppercase md:text-5xl">
                Earn yours <span className="text-brand-pink">next</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-cream/70 md:text-base">
                Pick a course, finish the capstone, walk out with the
                certificate and the portfolio to back it up.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                source="certifications"
                triggerLabel="Enquire Now"
                triggerClassName="rounded-lg bg-brand-pink px-6 font-bold uppercase brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-lg border-2 border-cream font-bold uppercase text-cream hover:bg-cream hover:text-ink"
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
