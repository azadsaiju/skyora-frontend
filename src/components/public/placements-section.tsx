"use client";

/**
 * Placements page: static "recently placed" student grid (siteConfig)
 * plus a live vacancies board fetched from /api/public/content.
 */

import { motion, type Variants } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
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
      className="brutal-card-sm flex min-w-0 gap-3 p-4"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-sm text-white"
        style={{ background: color }}
      >
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-grotesk text-sm font-bold break-words">
          {name}
        </span>
        <span className="block text-xs break-words text-muted-foreground">
          {course}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold break-words">{company}</span>
          <Badge
            variant="outline"
            className="rounded-full border-2 border-ink bg-white text-[10px] font-bold uppercase"
          >
            {role}
          </Badge>
        </span>
      </span>
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
      className="brutal-card flex min-w-0 flex-col p-5"
    >
      <h4 className="font-grotesk text-base font-bold break-words md:text-lg">
        {vacancy.title}
      </h4>
      <p className="mt-0.5 text-sm font-medium text-brand-blue">
        {vacancy.company}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="break-words">{vacancy.location}</span>
      </p>
      <Badge
        variant="outline"
        className="mt-2 w-fit rounded-full border-2 border-ink bg-white text-[11px] font-bold uppercase"
      >
        {JOB_TYPE_LABELS[vacancy.jobType] ?? vacancy.jobType}
      </Badge>
      <p className="mt-2 line-clamp-2 text-sm break-words text-muted-foreground">
        {vacancy.description}
      </p>
      <div className="flex-1" />
      <Button
        asChild
        variant="outline"
        className="mt-4 w-full rounded-lg border-2 border-ink font-bold uppercase brutal-hover"
      >
        <a
          href={vacancy.applyLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply Now <ExternalLink className="h-4 w-4" aria-hidden />
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
      <Skeleton className="mt-4 h-10 w-full rounded-lg" />
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
      <h3 className="mt-12 font-display text-xl uppercase md:text-2xl">
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
        <h3 className="font-display text-2xl leading-none uppercase md:text-3xl">
          Open vacancies
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-grotesk text-[10px] font-bold tracking-wider uppercase">
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
          <p className="font-display text-xl uppercase md:text-2xl">
            No open vacancies right now
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            New roles drop weekly. Enquire below and the placement cell will
            match you as soon as one lands.
          </p>
          <Button
            asChild
            className="mt-5 rounded-lg font-bold uppercase brutal-hover"
          >
            <a href="#/contact">Enquire Now</a>
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
