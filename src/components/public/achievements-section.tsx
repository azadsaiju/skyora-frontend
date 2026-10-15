"use client";

/**
 * Achievements page: GitHub banner + grid of wins (hackathons,
 * certifications, projects, placements) pulled from /api/public/content.
 */

import { motion, type Variants } from "framer-motion";
import { format } from "date-fns";
import { ArrowUpRight, Calendar, Github } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import type { AchievementDTO, AchievementType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/public/section-heading";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

const TYPE_COLORS: Record<AchievementType, string> = {
  HACKATHON: "#e11d48",
  CERTIFICATION: "#1d4ed8",
  PROJECT: "#d97706",
  PLACEMENT: "#059669",
};

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : format(date, "dd MMM yyyy");
}

function AchievementCard({ achievement }: { achievement: AchievementDTO }) {
  const color = TYPE_COLORS[achievement.type] ?? "#1d4ed8";
  return (
    <motion.article
      variants={GRID_ITEM}
      className="brutal-card-sm flex min-w-0 flex-col p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="rounded-full border-[#e6dfd3] bg-[#f4ede3] text-[11px] font-bold uppercase text-stone-700"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          {achievement.type}
        </Badge>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-stone-500">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {formatDate(achievement.date)}
        </span>
      </div>
      <h3 className="mt-3 font-grotesk text-base font-bold break-words text-ink md:text-lg">
        {achievement.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed break-words text-stone-600">
        {achievement.description}
      </p>
      {achievement.link ? (
        <a
          href={achievement.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 font-grotesk text-sm font-bold text-brand-blue hover:underline"
        >
          View link <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </motion.article>
  );
}

function AchievementSkeleton() {
  return (
    <div className="brutal-card-sm min-w-0 p-5" aria-hidden>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="ml-auto h-4 w-20" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function AchievementsSection() {
  const { data, error, loading, refetch } = usePublicContent();
  const achievements = data?.achievements ?? [];

  return (
    <section
      aria-label="Achievements"
      className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
    >
      <SectionHeading
        eyebrow="IT wins"
        title="RECEIPTS, NOT PROMISES"
        highlight="RECEIPTS"
        description="Hackathon podiums, shipped projects, certifications and placement letters — timestamped proof of what our students do."
      />

      {/* GitHub banner */}
      <motion.a
        href={siteConfig.links.github}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="group brutal-card mt-10 flex items-center gap-4 p-6 brutal-hover md:gap-6"
      >
        <Github
          aria-hidden
          className="h-10 w-10 shrink-0 text-ink md:h-12 md:w-12"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight uppercase text-ink md:text-xl">
            Follow the work on GitHub
          </span>
          <span className="mt-1 block text-sm text-stone-600">
            Real projects, hackathon repos &amp; student code from our IT
            track.
          </span>
        </span>
        <ArrowUpRight
          aria-hidden
          className="h-6 w-6 shrink-0 text-stone-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink"
        />
      </motion.a>

      {/* Grid */}
      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:gap-6">
          <AchievementSkeleton />
          <AchievementSkeleton />
          <AchievementSkeleton />
          <AchievementSkeleton />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ContentError message={error} onRetry={refetch} />
        </div>
      ) : achievements.length === 0 ? (
        <div className="brutal-card mt-6 p-10 text-center">
          <p className="font-display text-xl uppercase text-ink">
            No achievements yet
          </p>
          <p className="mt-2 text-sm text-stone-500">
            The next one is being built — follow the GitHub banner above to
            watch it happen.
          </p>
        </div>
      ) : (
        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-6 grid gap-4 sm:grid-cols-2 md:gap-6"
        >
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}
