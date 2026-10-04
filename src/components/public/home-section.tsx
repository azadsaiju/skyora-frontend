"use client";

/**
 * Home page: hero → stats band → recruiter marquee → course highlights
 * (two tracks) → testimonials → enquiry CTA.
 */

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  ChevronRight,
  Code2,
  Plane,
  Quote,
  Star,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import type { CourseDTO, Track } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/public/section-heading";
import { StatCards } from "@/components/public/stat-cards";
import { RecruiterMarquee } from "@/components/public/marquee";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

// ── Motion variants ──────────────────────────────────────────────────────────
const HERO_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const HERO_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

// ── Track highlight card ─────────────────────────────────────────────────────
interface TrackCardProps {
  title: string;
  track: Track;
  Icon: LucideIcon;
  color: string;
  courses: CourseDTO[];
}

function TrackCard({ title, track, Icon, color, courses }: TrackCardProps) {
  return (
    <div className="brutal-card flex min-w-0 flex-col p-6 md:p-8">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white shadow-hard-sm"
          style={{ background: color }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-none uppercase md:text-2xl">
            {title}
          </h3>
          <span
            aria-hidden
            className="mt-2 block h-1.5 w-14 rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>

      {/* Track certification — IATA Preferred (Aviation) / STED Council (IT) */}
      <p className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-1.5">
        <Award aria-hidden className="h-3.5 w-3.5 shrink-0" style={{ color }} />
        <span className="font-grotesk text-[11px] font-bold tracking-widest uppercase">
          {siteConfig.certifications[track].short}
        </span>
      </p>

      {courses.length === 0 ? (
        <p className="mt-6 rounded-lg bg-cream px-3 py-3 text-sm text-muted-foreground">
          New batches are being scheduled — check the courses page soon.
        </p>
      ) : (
        <div className="mt-5 space-y-1">
          {courses.map((course) => (
            <a
              key={course.id}
              href="#/courses"
              className="group -mx-2 flex min-w-0 items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-cream"
            >
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-grotesk text-sm font-bold break-words md:text-base">
                    {course.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {course.duration}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs break-words text-muted-foreground md:text-sm">
                  {course.description}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </a>
          ))}
        </div>
      )}

      <a
        href="#/courses"
        className="mt-5 inline-flex items-center gap-1.5 font-grotesk text-sm font-bold text-brand-pink uppercase hover:underline"
      >
        View all courses <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="brutal-card min-w-0 p-6 md:p-8" aria-hidden>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-1.5 w-14 rounded-full" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-lg" />
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
export function HomeSection() {
  const { data, error, loading, refetch } = usePublicContent();

  const aviationCourses = (data?.courses ?? [])
    .filter((c) => c.track === "AVIATION")
    .slice(0, 3);
  const itCourses = (data?.courses ?? [])
    .filter((c) => c.track === "IT")
    .slice(0, 3);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section aria-label="Skyora hero" className="relative overflow-hidden">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl md:h-96 md:w-96"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl md:h-96 md:w-96"
        />

        <motion.div
          variants={HERO_CONTAINER}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        >
          <motion.div variants={HERO_ITEM}>
            <a
              href="#/courses"
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 font-grotesk text-xs font-bold tracking-wide uppercase shadow-hard-sm brutal-hover md:text-sm"
            >
              Admissions Open 2025
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>

          <motion.h1
            variants={HERO_ITEM}
            className="mt-6 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] uppercase"
          >
            Careers take <span className="text-brand-pink">flight</span> at
            Skyora
          </motion.h1>

          <motion.p
            variants={HERO_ITEM}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Aviation &amp; IT training under one roof — mentor-led batches,
            real projects and mock interviews that end in offer letters.
            Choose the cabin, the airport ops desk or the code editor: our
            placement engine has already landed 500+ students in airlines and
            tech companies.
          </motion.p>

          <motion.div
            variants={HERO_ITEM}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="rounded-lg font-bold uppercase brutal-hover"
            >
              <a
                href={siteConfig.links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("home_hero")}
              >
                Book Free Call
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-lg border-2 border-ink bg-white font-bold uppercase shadow-hard-sm brutal-hover"
            >
              <a href="#/courses">Explore Courses</a>
            </Button>
          </motion.div>

          <motion.p
            variants={HERO_ITEM}
            className="mt-6 font-grotesk text-sm font-bold text-muted-foreground"
          >
            500+ placements · 40+ hiring partners · 2 career tracks
          </motion.p>
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section
        aria-label="Skyora in numbers"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16"
      >
        <StatCards />
      </section>

      {/* ── RECRUITER MARQUEE ────────────────────────────────────── */}
      <RecruiterMarquee />

      {/* ── COURSE HIGHLIGHTS ────────────────────────────────────── */}
      <section
        aria-label="Course highlights — two tracks"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
      >
        <SectionHeading
          eyebrow="Two tracks. One goal."
          title="PICK YOUR RUNWAY"
          highlight="RUNWAY"
          description="Aviation or IT — both tracks share the same DNA: small batches, working mentors and a placement cell that does not sleep."
        />

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <TrackSkeleton />
            <TrackSkeleton />
          </div>
        ) : error ? (
          <div className="mt-10">
            <ContentError message={error} onRetry={refetch} />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <TrackCard
              title="AVIATION"
              track="AVIATION"
              Icon={Plane}
              color="#2563EB"
              courses={aviationCourses}
            />
            <TrackCard
              title="IT & SOFTWARE"
              track="IT"
              Icon={Code2}
              color="#00B8D9"
              courses={itCourses}
            />
          </div>
        )}
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section
        aria-label="Student testimonials"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
      >
        <SectionHeading
          eyebrow="Wall of love"
          title="STUDENTS SPEAK"
          highlight="SPEAK"
          description="Unedited words from students who did the work and got the offer."
        />

        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {siteConfig.testimonials.map((t) => (
            <motion.figure
              key={t.name}
              variants={GRID_ITEM}
              className="brutal-card-sm flex min-w-0 flex-col p-5"
            >
              <Quote
                aria-hidden
                className="h-7 w-7 shrink-0"
                style={{ color: t.color }}
              />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4">
                <p className="font-grotesk text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
              <div
                className="mt-3 flex gap-0.5"
                role="img"
                aria-label={`Rated 5 out of 5 by ${t.name}`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className="h-3.5 w-3.5 fill-current"
                    style={{ color: t.color }}
                  />
                ))}
              </div>
            </motion.figure>
          ))}
        </motion.div>
      </section>

      {/* ── ENQUIRY CTA ──────────────────────────────────────────── */}
      <section
        aria-label="Talk to a counsellor"
        className="mx-auto max-w-7xl px-4 pt-4 pb-16 md:px-6 md:pb-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white md:p-16"
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-4xl leading-[0.95] uppercase md:text-6xl">
              Ready for <span className="text-brand-pink">takeoff?</span>
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
              Talk to a counsellor — free, no pressure. Five minutes on the
              phone can save you a year of guessing.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-lg bg-brand-pink font-bold uppercase brutal-hover"
              >
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("home_cta")}
                >
                  Book Free Call
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-lg border-2 border-white font-bold uppercase text-white hover:bg-white hover:text-ink"
              >
                <a href="#/contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
