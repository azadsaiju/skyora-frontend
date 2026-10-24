"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  HelpCircle,
  Laptop,
  MapPin,
  MessageCircle,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import { IT_COURSES_DATA, type ITCourseInfo } from "@/lib/it-courses-data";
import type { EnquiryCourseOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/public/section-heading";
import { EnquiryDialog } from "@/components/public/enquiry-dialog";

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface ITCoursePageProps {
  course: ITCourseInfo;
  enquiryOptions: EnquiryCourseOption[];
  dbCourseId?: string;
}

export function ITCoursePageView({
  course,
  enquiryOptions,
  dbCourseId,
}: ITCoursePageProps) {
  const relatedCourses = course.relatedSlugs
    .map((slug) => IT_COURSES_DATA[slug])
    .filter((c): c is ITCourseInfo => Boolean(c));

  const whatsappMessage = encodeURIComponent(
    `Hi Skyora, I would like to enquire about the ${course.title} course in Kochi.`
  );
  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`;

  return (
    <div className="bg-[#F8F9F5]">
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-[#E6DFC8]/80 bg-[#F4F6EE] px-4 py-3 md:px-6"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 font-grotesk text-xs font-semibold text-stone-600 md:text-sm">
          <Link href="/" className="hover:text-[#14281D]">
            Home
          </Link>
          <span aria-hidden className="text-stone-400">
            /
          </span>
          <Link href="/it" className="hover:text-[#14281D]">
            IT &amp; Software
          </Link>
          <span aria-hidden className="text-stone-400">
            /
          </span>
          <span className="text-[#14281D] font-bold" aria-current="page">
            {course.title}
          </span>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        aria-label={`${course.title} Course Overview`}
        className="relative overflow-hidden border-b border-[#E6DFC8] bg-gradient-to-b from-[#FAFBF8] to-[#F2F4EB] py-14 md:py-20"
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-[120px] bg-[#0891B2]/10"
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-3xl">
            {/* Dept pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E6DFC8] bg-white px-3.5 py-1.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#0891B2]" aria-hidden />
              Skyora IT Department · STED Council Certified
            </div>

            <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] uppercase text-[#14281D]">
              {course.title} <span className="text-[#0891B2]">Course in Kochi</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-stone-700 md:text-lg">
              {course.tagline}
            </p>

            {/* Quick-facts bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFC8] bg-white px-3 py-1.5 font-grotesk text-xs font-bold text-stone-700 shadow-xs">
                <Clock className="h-4 w-4 text-[#0891B2]" aria-hidden />
                Duration: {course.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFC8] bg-white px-3 py-1.5 font-grotesk text-xs font-bold text-stone-700 shadow-xs">
                <MapPin className="h-4 w-4 text-[#0891B2]" aria-hidden />
                Kochi, Kerala (Classroom &amp; Lab)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFC8] bg-white px-3 py-1.5 font-grotesk text-xs font-bold text-stone-700 shadow-xs">
                <BadgeCheck className="h-4 w-4 text-brand-green" aria-hidden />
                STED Council Certification
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFC8] bg-white px-3 py-1.5 font-grotesk text-xs font-bold text-stone-700 shadow-xs">
                <UserCheck className="h-4 w-4 text-[#0891B2]" aria-hidden />
                1:1 Faculty Mentorship
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <EnquiryDialog
                courses={enquiryOptions}
                initialCourseId={dbCourseId}
                source={`course-page:${course.slug}`}
                triggerLabel="Enquire for Next Batch"
                triggerClassName="rounded-xl bg-[#14281D] px-6 py-3 font-grotesk text-sm font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#1E3A2B] brutal-hover"
              />
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-[#D8CFBE] bg-white px-6 py-3 font-grotesk text-sm font-bold uppercase tracking-wider text-[#14281D] shadow-xs hover:bg-stone-100 brutal-hover"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp(`course:${course.slug}`)}
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-brand-green" aria-hidden />
                  WhatsApp Counselling
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSE OVERVIEW ──────────────────────────────────────── */}
      <section
        aria-label="Course Overview & Program Highlights"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16"
      >
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main overview */}
          <div className="brutal-card p-6 md:p-8 lg:col-span-2">
            <h2 className="font-display text-2xl uppercase text-[#14281D] md:text-3xl">
              Course Overview
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-700 md:text-lg">
              {course.overview}
            </p>

            <div className="mt-6 border-t border-[#E6DFC8] pt-6">
              <h3 className="font-grotesk text-sm font-bold uppercase tracking-wider text-stone-800">
                Program Highlights
              </h3>
              <ul className="mt-4 space-y-3">
                {course.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2.5 text-sm text-stone-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-brand-green"
                      aria-hidden
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            <div className="mt-6 rounded-xl bg-[#F4EDE3] p-4">
              <p className="font-grotesk text-xs font-bold uppercase tracking-wider text-stone-800">
                Eligibility &amp; Prerequisites
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {course.prerequisites}
              </p>
            </div>
          </div>

          {/* Quick info card */}
          <div className="space-y-6">
            <div className="brutal-card p-6">
              <h3 className="font-display text-lg uppercase text-[#14281D]">
                Certification Info
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {course.certification.full}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E6DFC8] bg-white px-3 py-1.5 font-grotesk text-xs font-bold text-stone-800">
                <GraduationCap className="h-4 w-4 text-[#0891B2]" aria-hidden />
                {course.certification.short}
              </div>
            </div>

            <div className="brutal-card p-6">
              <h3 className="font-display text-lg uppercase text-[#14281D]">
                Training Location
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Classroom sessions, practical coding labs, and mentor consultations
                take place at Skyora&apos;s Kochi training center.
              </p>
              <p className="mt-3 text-xs font-grotesk font-semibold text-stone-500">
                Service Area: Kochi, Ernakulam, and across Kerala
              </p>
            </div>

            <div className="brutal-card p-6 bg-[#14281D] text-white">
              <h3 className="font-display text-lg uppercase text-white">
                Admissions &amp; Fees
              </h3>
              <p className="mt-2 text-sm text-stone-300 leading-relaxed">
                Fee structure, upcoming batch schedules, and seat availability are
                shared directly during your free counselling session.
              </p>
              <EnquiryDialog
                courses={enquiryOptions}
                initialCourseId={dbCourseId}
                source={`course-sidebar:${course.slug}`}
                triggerLabel="Request Fee & Batch Details"
                triggerClassName="mt-4 w-full rounded-xl bg-white font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] hover:bg-stone-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CURRICULUM & SKILLS ──────────────────────────────────── */}
      <section
        aria-label="Curriculum and Skills Covered"
        className="border-t border-[#E6DFC8] bg-[#F4EDE3] py-12 md:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            eyebrow="Hands-on Syllabus"
            title="SKILLS YOU WILL LEARN"
            highlight="SKILLS"
            description={`Every topic in the ${course.title} curriculum is aligned with what engineering managers and tech recruiters test in technical rounds.`}
          />

          <motion.div
            variants={GRID_CONTAINER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {course.skills.map((skill, index) => (
              <motion.div
                key={skill}
                variants={GRID_ITEM}
                className="brutal-card-sm flex items-start gap-3 p-5"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0891B2]/10 font-grotesk text-xs font-bold text-[#0891B2]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-grotesk text-base font-bold text-[#14281D]">
                    {skill}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tools & Frameworks */}
          <div className="mt-10 brutal-card p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#0891B2]" aria-hidden />
              <h3 className="font-display text-lg uppercase text-[#14281D]">
                Tools &amp; Libraries Practiced
              </h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.tools.map((tool) => (
                <Badge
                  key={tool}
                  variant="outline"
                  className="rounded-full border-[#D8CFBE] bg-white px-3.5 py-1.5 font-grotesk text-xs font-bold text-stone-800"
                >
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CAREER OPPORTUNITIES & WORKPLACES ──────────────────────── */}
      <section
        aria-label="Career Outcomes and Target Workplaces"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
      >
        <SectionHeading
          eyebrow="Placement Pathways"
          title="CAREER OPPORTUNITIES"
          highlight="CAREER"
          description={`Roles our graduates train for and the types of companies actively recruiting for ${course.title} skillsets.`}
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Job roles */}
          <div className="brutal-card p-6 md:p-8">
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-5 w-5 text-[#0891B2]" aria-hidden />
              <h3 className="font-display text-xl uppercase text-[#14281D]">
                Target Job Roles
              </h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.jobRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-xl border border-[#E6DFC8] bg-[#F4EDE3] px-3 py-2 font-grotesk text-xs font-bold text-[#14281D]"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-stone-500 leading-relaxed">
              Our placement cell coordinates interview slots, prepares resume
              iterations, and schedules technical mock sessions until you are placed.
            </p>
          </div>

          {/* Where you can work */}
          <div className="brutal-card p-6 md:p-8">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-[#0891B2]" aria-hidden />
              <h3 className="font-display text-xl uppercase text-[#14281D]">
                Where You Can Work
              </h3>
            </div>
            <ul className="mt-4 space-y-3">
              {course.workplaces.map((workplace) => (
                <li
                  key={workplace}
                  className="flex items-start gap-2.5 text-sm text-stone-700"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0891B2]" aria-hidden />
                  <span>{workplace}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── RELATED IT COURSES (Contextual Internal Links) ─────────── */}
      <section
        aria-label="Related IT Specializations"
        className="border-t border-[#E6DFC8] bg-[#F2F4EB] py-12 md:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-grotesk text-xs font-bold uppercase tracking-[0.25em] text-[#0891B2]">
                Explore The Cluster
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase text-[#14281D] md:text-3xl">
                Related IT Specializations
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-fit rounded-xl border-[#D8CFBE] bg-white font-grotesk text-xs font-bold uppercase text-[#14281D]"
            >
              <Link href="/it" className="inline-flex items-center gap-1.5">
                All IT Programs
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((rel) => (
              <article
                key={rel.slug}
                className="brutal-card-sm flex flex-col justify-between p-6 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-grotesk text-xs font-bold uppercase text-[#0891B2]">
                      {rel.duration}
                    </span>
                    <BadgeCheck className="h-4 w-4 text-brand-green" aria-hidden />
                  </div>
                  <h3 className="mt-2 font-grotesk text-lg font-bold text-[#14281D]">
                    {rel.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600 line-clamp-3">
                    {rel.tagline}
                  </p>
                </div>
                <div className="mt-6 border-t border-[#E6DFC8] pt-4">
                  <Link
                    href={rel.route}
                    className="inline-flex items-center gap-1.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] hover:text-[#0891B2]"
                  >
                    View {rel.title} Details
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CONVERSION CTA ──────────────────────────────────── */}
      <section
        aria-label="Enquire for Course"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-[#14281D] p-8 text-white shadow-xl md:p-12"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl uppercase leading-tight md:text-4xl">
                Ready to master{" "}
                <span className="text-[#0891B2]">{course.title}</span>?
              </h2>
              <p className="mt-3 text-sm text-stone-300 md:text-base leading-relaxed">
                Connect with an admission counsellor in Kochi. Discuss batch timings,
                lab access, curriculum modules, and placement options with zero obligation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <EnquiryDialog
                courses={enquiryOptions}
                initialCourseId={dbCourseId}
                source={`course-cta:${course.slug}`}
                triggerLabel="Enquire Now"
                triggerClassName="rounded-xl bg-[#0891B2] px-6 py-3 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#0891B2]/90 brutal-hover"
              />
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/20 bg-transparent font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
              >
                <Link href="/contact">Visit Contact Center</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
