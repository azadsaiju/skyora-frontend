"use client";

/**
 * /about — the SKYORA story: mission, vision, why-us pillars, stats row
 * and the campus image, all on the olive canvas in brutal style.
 */

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Rocket,
  Target,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/public/section-heading";
import { StatCards } from "@/components/public/stat-cards";

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const WHY_ICONS = [Rocket, Users, HeartHandshake, Compass];

export function AboutPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section aria-label="About Skyora hero" className="relative overflow-hidden border-b-2 border-ink">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground md:text-sm">
              About Skyora Group of Institutes
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.95] uppercase">
              Built like an <span className="text-brand-pink">airport</span>.
              Runs like a <span className="text-brand-pink">tech lab</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Two career tracks — Aviation and IT — with the same DNA:
              mentor-led, project-first, placement-obsessed.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="rounded-lg font-bold uppercase brutal-hover">
                <Link href="/aviation">
                  Explore Aviation <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-lg border-2 border-ink bg-white font-bold uppercase shadow-hard-sm brutal-hover"
              >
                <Link href="/it">Explore IT &amp; Software</Link>
              </Button>
            </div>
          </div>

          {/* Campus image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative min-w-0"
          >
            <div className="brutal-card relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image
                src="/departments/about-campus.png"
                alt="Students collaborating with a mentor in a Skyora classroom"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <span className="absolute -bottom-4 left-5 inline-flex rotate-[-2deg] items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-grotesk text-xs font-bold tracking-wide uppercase shadow-hard-sm">
              Learn · Build · Grow
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────── */}
      <section aria-label="The Skyora story" className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="brutal-card p-6 md:p-10"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex w-fit shrink-0 flex-col items-center gap-2 rounded-xl border-2 border-ink bg-white p-5 shadow-hard-sm">
              <Image
                src="/logo-full.png"
                alt="Official Skyora Group of Institutes logo — green S emblem with Learn · Build · Grow motto"
                width={300}
                height={267}
                className="h-auto w-40 md:w-52"
              />
              <span className="font-grotesk text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground">
                Our identity
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl leading-none uppercase md:text-3xl">
                Our story
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed md:text-lg">
                {siteConfig.story}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── MISSION & VISION ─────────────────────────────────────── */}
      <section aria-label="Mission and vision" className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="brutal-card p-6 md:p-8"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-brand-pink text-white shadow-hard-sm"
            >
              <Target className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl uppercase md:text-2xl">Mission</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              To make every student job-ready — through small batches, working
              mentors and training built around what airlines and tech
              companies actually test for, not outdated theory.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
            className="brutal-card p-6 md:p-8"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-brand-cyan text-white shadow-hard-sm"
            >
              <Compass className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl uppercase md:text-2xl">Vision</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              To be the institute careers take flight from — where a village
              student and a city student get the same mentors, the same
              projects and the same shot at an airline cabin or a tech office.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────────────── */}
      <section aria-label="Why students choose us" className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <SectionHeading
          eyebrow="Why us"
          title="WHY STUDENTS CHOOSE US"
          highlight="CHOOSE US"
          description="Small batches, working mentors and a placement cell that does not sleep — the Skyora difference."
        />
        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {siteConfig.whyUs.map((item, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <motion.div
                key={item.title}
                variants={GRID_ITEM}
                className="brutal-card-sm min-w-0 p-5"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink text-white shadow-hard-sm"
                  style={{ background: item.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-grotesk font-bold break-words">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
                  {item.text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── STATS ROW ────────────────────────────────────────────── */}
      <section aria-label="Skyora in numbers" className="border-y-2 border-ink bg-olive-tint/60">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeading
            eyebrow="Proof, not promises"
            title="SKYORA IN NUMBERS"
            highlight="NUMBERS"
          />
          <div className="mt-10">
            <StatCards />
          </div>
        </div>
      </section>

      {/* ── MENTORS TEASER ───────────────────────────────────────── */}
      <section aria-label="Meet the mentors" className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="brutal-card flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-10">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-none uppercase md:text-3xl">
              Taught by people who <span className="text-brand-pink">do the job</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Airline captains, data scientists, app developers and a
              placement team that has landed 500+ students — meet the mentors
              behind every Skyora batch.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 rounded-lg font-bold uppercase brutal-hover"
          >
            <Link href="/mentorship">
              Meet the mentors <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
