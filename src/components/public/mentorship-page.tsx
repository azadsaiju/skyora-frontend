"use client";

/**
 * /mentorship — the 1:1 mentorship program: what it covers, the mentor
 * team (with illustrated portraits) and an "Apply for Mentorship" CTA.
 */

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  MessagesSquare,
  Mic,
  Plane,
  Code2,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import type { EnquiryCourseOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/public/section-heading";
import { EnquiryDialog } from "@/components/public/enquiry-dialog";

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface MentorCard {
  name: string;
  role: string;
  dept: "AVIATION" | "IT" | "PLACEMENT";
  photo: string;
  tag: string;
  color: string;
}

const MENTORS: MentorCard[] = [
  {
    name: "Capt. Rekha Menon",
    role: "Cabin Crew Mentor",
    dept: "AVIATION",
    photo: "/mentors/mentor-aviation.png",
    tag: "Cabin Crew Mentor — 8 yrs airline experience",
    color: "#FF2E63",
  },
  {
    name: "Arjun Deshpande",
    role: "Senior Data Scientist",
    dept: "IT",
    photo: "/mentors/mentor-data.png",
    tag: "Senior Data Scientist — 12 yrs in ML & analytics",
    color: "#0891B2",
  },
  {
    name: "Sneha Kulkarni",
    role: "Full Stack Mentor",
    dept: "IT",
    photo: "/mentors/mentor-fullstack.png",
    tag: "Senior Developer — 10 yrs building products",
    color: "#2563EB",
  },
  {
    name: "Faisal Khan",
    role: "Placement Head",
    dept: "PLACEMENT",
    photo: "/mentors/mentor-placement.png",
    tag: "Placement Head — 500+ students placed",
    color: "#FF7A00",
  },
];

const HOW_IT_WORKS: { Icon: LucideIcon; title: string; text: string; color: string }[] = [
  {
    Icon: MessagesSquare,
    title: "1:1 mentoring",
    text: "Every student is paired with a mentor from Aviation or IT — weekly one-on-one sessions, honest feedback and a plan built around your target job.",
    color: "#FF2E63",
  },
  {
    Icon: Mic,
    title: "Mock interviews",
    text: "Real interview panels — airline grooming rounds, HR screens and technical grills — recorded, reviewed and repeated until you walk in confident.",
    color: "#2563EB",
  },
  {
    Icon: FileText,
    title: "Resume preparation",
    text: "Your resume, LinkedIn and portfolio rebuilt by mentors who actually screen candidates — highlighting projects and skills employers scan for.",
    color: "#FF7A00",
  },
  {
    Icon: ClipboardList,
    title: "Industry projects",
    text: "Work on real datasets, real apps and real airline scenarios — the same deliverables you'll be handed on day one of the job.",
    color: "#00B8D9",
  },
];

const DEPT_ICONS: Record<MentorCard["dept"], typeof Plane> = {
  AVIATION: Plane,
  IT: Code2,
  PLACEMENT: CalendarCheck,
};

const DEPT_LABEL: Record<MentorCard["dept"], string> = {
  AVIATION: "Aviation",
  IT: "IT & Software",
  PLACEMENT: "Placements",
};

export function MentorshipPage({
  enquiryOptions,
}: {
  enquiryOptions: EnquiryCourseOption[];
}) {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section aria-label="Mentorship program hero" className="relative overflow-hidden border-b-2 border-ink">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground md:text-sm">
              Skyora Mentorship Program
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.95] uppercase">
              Mentored by people who <span className="text-brand-pink">do the job</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              One-on-one guidance from working airline professionals and tech
              engineers — mock interviews, resume prep and a clear roadmap to
              your first offer letter.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                source="mentorship-hero"
                triggerLabel="Apply for Mentorship"
                triggerClassName="rounded-lg px-6 font-bold uppercase brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-lg border-2 border-ink bg-white font-bold uppercase shadow-hard-sm brutal-hover"
              >
                <a
                  href={siteConfig.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp("mentorship_hero")}
                >
                  Ask on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative min-w-0"
          >
            <div className="brutal-card relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image
                src="/departments/mentorship-hero.png"
                alt="A Skyora mentor and student in a one-on-one mock interview session"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <span className="absolute -bottom-4 left-5 inline-flex rotate-[-2deg] items-center gap-1.5 rounded-lg border-2 border-ink bg-brand-pink px-3 py-1.5 font-grotesk text-xs font-bold tracking-wide text-white uppercase shadow-hard-sm">
              1:1 · Aviation & IT mentors
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section aria-label="How the mentorship program works" className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
        <SectionHeading
          eyebrow="What you get"
          title="HOW THE PROGRAM WORKS"
          highlight="WORKS"
          description="Not a lecture series — a working relationship with someone who does the job you're training for."
        />
        <motion.div
          variants={GRID_CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {HOW_IT_WORKS.map(({ Icon, title, text, color }) => (
            <motion.div key={title} variants={GRID_ITEM} className="brutal-card-sm min-w-0 p-5">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink text-white shadow-hard-sm"
                style={{ background: color }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-grotesk font-bold break-words">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
                {text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MENTORS ──────────────────────────────────────────────── */}
      <section aria-label="Meet the mentors" className="border-t-2 border-ink bg-olive-tint/60">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <SectionHeading
            eyebrow="Your mentors"
            title="MEET THE MENTORS"
            highlight="MENTORS"
            description="Airline crew, data scientists, developers and placement specialists — every one of them works in the industry they teach."
          />
          <motion.div
            variants={GRID_CONTAINER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MENTORS.map((mentor) => {
              const DeptIcon = DEPT_ICONS[mentor.dept];
              return (
                <motion.figure
                  key={mentor.name}
                  variants={GRID_ITEM}
                  className="brutal-card flex min-w-0 flex-col items-center p-5 text-center"
                >
                  <span
                    aria-hidden
                    className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-white shadow-hard-sm"
                  >
                    <Image
                      src={mentor.photo}
                      alt={`Illustrated portrait of ${mentor.name}, ${mentor.role} at Skyora`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </span>
                  <figcaption className="mt-4 min-w-0">
                    <p className="font-grotesk font-bold break-words">{mentor.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{mentor.role}</p>
                  </figcaption>
                  <span
                    className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase"
                    style={{ borderColor: mentor.color, color: mentor.color }}
                  >
                    <DeptIcon className="h-3 w-3" aria-hidden />
                    {DEPT_LABEL[mentor.dept]}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed break-words text-muted-foreground">
                    {mentor.tag}
                  </p>
                </motion.figure>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── APPLY CTA ────────────────────────────────────────────── */}
      <section aria-label="Apply for mentorship" className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:px-6 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-olive-deep p-8 text-cream md:p-16"
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
                Ready for your <span className="text-brand-pink">1:1?</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-cream/70 md:text-base">
                Apply for mentorship — tell us your track and target job, and
                a counsellor matches you with the right mentor within 24
                hours.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                source="mentorship-cta"
                triggerLabel="Apply for Mentorship"
                triggerClassName="rounded-lg bg-brand-pink px-6 font-bold uppercase brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-lg border-2 border-cream font-bold uppercase text-cream hover:bg-cream hover:text-ink"
              >
                <Link href="/certifications">
                  See certifications <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
