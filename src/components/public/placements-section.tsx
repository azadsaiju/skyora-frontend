"use client";

/**
 * Placements page: static "recently placed" student grid (siteConfig)
 * plus a live vacancies board fetched from /api/public/content.
 */

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { CheckCircle2, ExternalLink, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import type { JobType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/public/section-heading";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// ── Recently placed (static config data) ─────────────────────────────────────
interface PlacedStudent {
  name: string;
  course: string;
  company: string;
  role: string;
  color: string;
}

function PlacedCard({ name, course, company, role, color }: PlacedStudent) {
  return (
    <motion.div
      variants={GRID_ITEM}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#e6dfd3] bg-white p-4.5 shadow-xs transition-all duration-300 hover:border-[#6EA820]/60 hover:shadow-lg"
    >
      {/* Top subtle hover accent line */}
      <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-[#6EA820] to-[#88c92a] transition-all duration-300 group-hover:w-full" />

      <div className="flex items-start gap-3">
        {/* Animated Avatar with badge */}
        <div className="relative">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
            style={{
              background: `linear-gradient(135deg, ${color}22 0%, ${color}0c 100%)`,
              color,
              border: `1.5px solid ${color}35`,
            }}
          >
            {initialsOf(name)}
          </span>
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#6EA820]" />
          </span>
        </div>

        {/* Student Name & Course */}
        <div className="min-w-0 flex-1">
          <p className="font-grotesk text-sm font-bold text-[#14281D] transition-colors group-hover:text-[#24422D]">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 font-medium truncate">
            {course}
          </p>
        </div>
      </div>

      {/* Company & Role Badge */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-grotesk text-sm font-extrabold text-[#14281D]">
          {company}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#6EA820]/30 bg-[#6EA820]/10 px-2.5 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-wide text-[#476e15] transition-colors group-hover:border-[#6EA820] group-hover:bg-[#6EA820] group-hover:text-white">
          {role}
        </span>
      </div>
    </motion.div>
  );
}

// ── Vacancy card (fetched data) ──────────────────────────────────────────────
function VacancyCard({
  vacancy,
}: {
  vacancy: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: JobType;
    description: string;
    applyLink: string;
  };
}) {
  return (
    <motion.article
      variants={GRID_ITEM}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e6dfd3] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#6EA820]/60 hover:shadow-lg"
    >
      <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-[#6EA820] to-[#88c92a] transition-all duration-300 group-hover:w-full" />
      <h4 className="font-grotesk text-base font-bold break-words text-ink md:text-lg">
        {vacancy.title}
      </h4>
      <p className="mt-0.5 text-sm font-semibold text-[#6EA820]">
        {vacancy.company}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6EA820]" aria-hidden />
        <span className="break-words">{vacancy.location}</span>
      </p>
      <span className="mt-2.5 w-fit rounded-full border border-[#6EA820]/30 bg-[#6EA820]/10 px-2.5 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-wider text-[#476e15]">
        {JOB_TYPE_LABELS[vacancy.jobType] ?? vacancy.jobType}
      </span>
      <p className="mt-3 line-clamp-2 text-sm break-words text-stone-600">
        {vacancy.description}
      </p>
      <div className="flex-1" />
      <Button
        asChild
        variant="outline"
        className="mt-4 w-full rounded-xl border-[#dcd4c5] bg-white font-bold uppercase text-ink shadow-xs hover:border-[#6EA820] hover:bg-[#6EA820] hover:text-white transition-all duration-200"
      >
        <a
          href={vacancy.applyLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply Now <ExternalLink className="h-4 w-4 ml-1" aria-hidden />
        </a>
      </Button>
    </motion.article>
  );
}

function VacancySkeleton() {
  return (
    <div className="brutal-card min-w-0 p-5" aria-hidden>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-6 w-24 rounded-full" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
    </div>
  );
}

export function PlacementsSection() {
  const { data, error, loading, refetch } = usePublicContent();
  const vacancies = data?.vacancies ?? [];

  return (
    <section
      aria-label="Placements and vacancies"
      className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
    >
      <SectionHeading
        eyebrow="Placements"
        title="FROM CLASSROOM TO COCKPIT & CODE"
        highlight="COCKPIT"
        description="Our placement cell works while you study — by the time you finish, the interviews are already booked."
      />

      {/* Part A — recently placed */}
      <h3 className="mt-12 font-display text-xl uppercase text-ink md:text-2xl">
        Recently placed
      </h3>
      <motion.div
        variants={GRID_CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {siteConfig.placements.map((p) => (
          <PlacedCard
            key={p.name}
            name={p.name}
            course={p.course}
            company={p.company}
            role={p.role}
            color={p.color}
          />
        ))}
      </motion.div>

      {/* Part B — live vacancies */}
      <div className="mt-14 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-2xl leading-none uppercase text-ink md:text-3xl">
          Open vacancies
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dfd3] bg-white px-2.5 py-1 font-grotesk text-[10px] font-bold tracking-wider uppercase text-stone-700 shadow-xs">
          <span
            aria-hidden
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-green"
          />
          Live
        </span>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <VacancySkeleton />
          <VacancySkeleton />
          <VacancySkeleton />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ContentError message={error} onRetry={refetch} />
        </div>
      ) : vacancies.length === 0 ? (
        <div className="brutal-card mt-6 p-8 text-center md:p-10">
          <p className="font-display text-xl uppercase text-ink md:text-2xl">
            No open vacancies right now
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            New roles drop weekly. Enquire below and the placement cell will
            match you as soon as one lands.
          </p>
          <Button
            asChild
            className="mt-5 rounded-xl bg-ink font-bold uppercase text-white hover:bg-stone-800 brutal-hover"
          >
            <Link href="/contact">Enquire Now</Link>
          </Button>
        </div>
      ) : (
        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {vacancies.map((vacancy) => (
            <VacancyCard key={vacancy.id} vacancy={vacancy} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
