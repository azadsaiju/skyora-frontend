"use client";

/**
 * Shared department page view for /aviation and /it.
 * Renders: hero (title + certification badge + department image) → intro →
 * ALL courses from the shared data store (skills, career opportunities,
 * where you can work) → opportunities band (industry growth + placement).
 *
 * Data is fetched server-side and passed in; pages using this are
 * force-dynamic so admin edits appear on the next request.
 */

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  GraduationCap,
  MapPin,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import type { CoursePublicDTO, EnquiryCourseOption, Track } from "@/lib/types";
import type { DepartmentMeta } from "@/lib/departments";
import { courseImage } from "@/lib/courses";
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

interface DepartmentViewProps {
  dept: DepartmentMeta;
  courses: CoursePublicDTO[];
  enquiryOptions: EnquiryCourseOption[];
}

function Bullets({
  items,
  color,
  max,
}: {
  items: string[];
  color: string;
  max?: number;
}) {
  const shown = max ? items.slice(0, max) : items;
  return (
    <ul className="space-y-1.5">
      {shown.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm break-words text-muted-foreground">
          <span
            aria-hidden
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CourseCard({
  course,
  dept,
  enquiryOptions,
}: {
  course: CoursePublicDTO;
  dept: DepartmentMeta;
  enquiryOptions: EnquiryCourseOption[];
}) {
  return (
    <motion.article
      variants={GRID_ITEM}
      className="brutal-card flex min-w-0 flex-col overflow-hidden"
    >
      {/* Course image (custom upload or auto-assigned department hero) */}
      <div className="relative h-44 w-full border-b-2 border-ink sm:h-52">
        <Image
          src={courseImage(course)}
          alt={`${course.title} — ${dept.name} course at Skyora`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized={courseImage(course).startsWith("/uploads/")}
        />
        <span
          aria-hidden
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-grotesk text-[11px] font-bold tracking-wide uppercase shadow-hard-sm"
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {course.duration}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
        <h3 className="font-grotesk text-xl leading-tight font-bold break-words">
          {course.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
          {course.description}
        </p>

        {/* Skills you will learn */}
        {course.skills.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase">
              <GraduationCap className="h-4 w-4" style={{ color: dept.accent }} aria-hidden />
              Skills you will learn
            </p>
            <div className="mt-2">
              <Bullets items={course.skills} color={dept.accent} max={6} />
            </div>
          </div>
        )}

        {/* Career opportunities / job roles */}
        {course.jobRoles.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase">
              <Briefcase className="h-4 w-4" style={{ color: dept.accent }} aria-hidden />
              Career opportunities
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {course.jobRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border-2 border-ink bg-white px-2.5 py-1 font-grotesk text-[11px] font-bold break-words"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Where you can work */}
        {course.workplaces.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase">
              <MapPin className="h-4 w-4" style={{ color: dept.accent }} aria-hidden />
              Where you can work
            </p>
            <div className="mt-2">
              <Bullets items={course.workplaces} color={dept.accent} />
            </div>
          </div>
        )}

        <div className="flex-1" />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <EnquiryDialog
            courses={enquiryOptions}
            initialCourseId={course.id}
            source={`department:${course.slug}`}
            triggerLabel="Enquire Now"
            triggerClassName="rounded-lg font-bold uppercase brutal-hover"
          />
          <a
            href={siteConfig.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp(`department:${course.slug}`)}
            className="inline-flex items-center gap-1.5 font-grotesk text-sm font-bold text-brand-pink uppercase hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function OpportunityCard({
  Icon,
  title,
  text,
  accent,
}: {
  Icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="brutal-card-sm flex min-w-0 flex-col p-5">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white shadow-hard-sm"
        style={{ background: accent }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-grotesk font-bold break-words">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export function DepartmentView({ dept, courses, enquiryOptions }: DepartmentViewProps) {
  const cert = siteConfig.certifications[dept.track as Track];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section aria-label={`${dept.name} department hero`} className="relative overflow-hidden border-b-2 border-ink">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${dept.accent}33` }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground md:text-sm">
              Skyora {dept.name} Department
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] uppercase">
              {dept.name}
            </h1>
            <p className="mt-4 max-w-xl font-grotesk text-base font-bold text-ink/80 md:text-lg">
              {dept.tagline}
            </p>

            {/* Certification badge — IATA PREFERRED / CERTIFICATE BY STED COUNCIL */}
            <p className="mt-5 inline-flex max-w-full items-center gap-2.5 rounded-xl border-2 border-ink bg-white px-4 py-2.5 shadow-hard-sm">
              <Image
                src={cert.logo}
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="size-7 shrink-0 object-contain"
              />
              <span className="min-w-0">
                <span className="block font-grotesk text-sm font-bold tracking-wide uppercase">
                  {cert.short}
                </span>
              </span>
              <BadgeCheck className="h-5 w-5 shrink-0" style={{ color: dept.accent }} aria-hidden />
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                source={`department-hero:${dept.track}`}
                triggerLabel="Enquire Now"
                triggerClassName="rounded-lg px-6 font-bold uppercase brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-lg border-2 border-ink bg-white font-bold uppercase shadow-hard-sm brutal-hover"
              >
                <a href="#courses">View Courses</a>
              </Button>
            </div>
          </div>

          {/* Department hero image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative min-w-0"
          >
            <div className="brutal-card relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image
                src={dept.heroImage}
                alt={`${dept.name} department at Skyora Group of Institutes`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <span className="absolute -bottom-4 left-5 inline-flex rotate-[-2deg] items-center gap-1.5 rounded-lg border-2 border-ink bg-brand-yellow px-3 py-1.5 font-grotesk text-xs font-bold tracking-wide uppercase shadow-hard-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {courses.length} career program{courses.length === 1 ? "" : "s"}
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────── */}
      <section aria-label={`About the ${dept.name} department`} className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="brutal-card p-6 md:p-10"
        >
          <h2 className="font-display text-2xl leading-none uppercase md:text-3xl">
            About the department
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-relaxed md:text-lg">
            {dept.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-olive-tint px-3 py-1.5 font-grotesk text-xs font-bold uppercase">
              <GraduationCap className="h-4 w-4" aria-hidden />
              {cert.short}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-olive-tint px-3 py-1.5 font-grotesk text-xs font-bold uppercase">
              <Briefcase className="h-4 w-4" aria-hidden />
              Placement support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-olive-tint px-3 py-1.5 font-grotesk text-xs font-bold uppercase">
              <Building2 className="h-4 w-4" aria-hidden />
              Working industry mentors
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── COURSES ──────────────────────────────────────────────── */}
      <section id="courses" aria-label={`${dept.name} courses`} className="scroll-mt-24 border-t-2 border-ink bg-olive-tint/60">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <SectionHeading
            eyebrow={`${courses.length} program${courses.length === 1 ? "" : "s"} · certification included`}
            title={`${dept.name} COURSES`}
            highlight="COURSES"
            description={`Every ${dept.name} program below is mentor-led, project-first and mapped to what employers actually test for. Pick a course to see the skills, the job roles and where you can work.`}
          />

          {courses.length === 0 ? (
            <div className="brutal-card mx-auto mt-10 max-w-lg p-8 text-center md:p-12">
              <p className="font-display text-xl uppercase">No courses here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re finalising the {dept.name} lineup — enquire on WhatsApp
                and we&apos;ll send the brochure first.
              </p>
              <div className="mt-6">
                <Button asChild className="rounded-lg font-bold uppercase brutal-hover">
                  <a
                    href={siteConfig.links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsApp(`department-empty:${dept.track}`)}
                  >
                    Ask on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              variants={GRID_CONTAINER}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  dept={dept}
                  enquiryOptions={enquiryOptions}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── OPPORTUNITIES ────────────────────────────────────────── */}
      <section aria-label={`${dept.name} opportunities`} className="border-t-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <SectionHeading
            eyebrow="Your future in this field"
            title="OPPORTUNITIES"
            highlight="OPPORTUNITIES"
            description={`The ${dept.name} industry is hiring — and Skyora's placement cell works for you until you're in.`}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OpportunityCard
              Icon={TrendingUp}
              title="Industry growth"
              text={
                dept.track === "AVIATION"
                  ? "India is the world's fastest-growing aviation market — hundreds of new aircraft and thousands of cabin crew and airport hires every year."
                  : "Data, apps and AI keep exploding — companies hire analysts, data scientists and developers faster than universities produce them."
              }
              accent={dept.accent}
            />
            <OpportunityCard
              Icon={Briefcase}
              title="Placement support"
              text="A dedicated placement cell with 40+ hiring partners, mock interviews, resume labs and interview scheduling until you're placed."
              accent={dept.accent}
            />
            <OpportunityCard
              Icon={BadgeCheck}
              title="Recognised certification"
              text={cert.full}
              accent={dept.accent}
            />
            <OpportunityCard
              Icon={Building2}
              title="Hiring partners"
              text={
                dept.track === "AVIATION"
                  ? "IndiGo, Air India, Vistara, SpiceJet, Akasa Air, airport terminal operators and ground handling companies."
                  : "TCS, Infosys, Wipro, Accenture, Cognizant, Amazon, Deloitte and fast-growing product startups."
              }
              accent={dept.accent}
            />
          </div>

          {/* CTA band */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative mt-12 overflow-hidden rounded-3xl bg-olive-deep p-8 text-cream md:p-14"
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
                  Start your {dept.name} <span className="text-brand-pink">career</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm text-cream/70 md:text-base">
                  Talk to a counsellor today — free, no pressure. We&apos;ll map
                  the right course, duration and batch for you.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <EnquiryDialog
                  courses={enquiryOptions}
                  source={`department-cta:${dept.track}`}
                  triggerLabel="Enquire Now"
                  triggerClassName="rounded-lg bg-brand-pink px-6 font-bold uppercase brutal-hover"
                />
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-lg border-2 border-cream font-bold uppercase text-cream hover:bg-cream hover:text-ink"
                >
                  <Link href="/mentorship">
                    Meet the mentors <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
