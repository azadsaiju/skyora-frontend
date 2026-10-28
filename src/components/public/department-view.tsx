"use client";

/**
 * Shared department page view for /aviation and /it.
 * Renders: hero (title + certification badge) → intro →
 * ALL courses from the shared data store (skills, career opportunities,
 * where you can work) → opportunities band (industry growth + placement).
 *
 * Data is fetched server-side and passed in; pages using this are
 * force-dynamic so admin edits appear on the next request.
 */

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  Clock,
  GraduationCap,
  Layers,
  MapPin,
  MessageCircle,
  Plane,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import type { CoursePublicDTO, EnquiryCourseOption, Track } from "@/lib/types";
import type { DepartmentMeta } from "@/lib/departments";
import { IT_COURSES_DATA } from "@/lib/it-courses-data";
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
        <li key={item} className="flex items-start gap-2 text-sm break-words text-stone-600">
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


const AVIATION_CATEGORY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  "cabin-crew-training": { label: "In-Flight Hospitality", Icon: Plane },
  "ground-staff-airport-operations": { label: "Ground Operations", Icon: Briefcase },
  "airport-management-cargo": { label: "Logistics & Cargo", Icon: Layers },
  "airline-ticketing-gds": { label: "Travel Commerce", Icon: BookOpen },
};

const DEDICATED_COURSE_ROUTES: Record<string, string> = {
  "data-science": "/it/data-science",
  "data-analytics": "/it/data-analytics",
  "data-analyst-professional": "/it/data-analytics",
  "artificial-intelligence": "/it/artificial-intelligence",
  "machine-learning": "/it/machine-learning",
};

function CourseCard({
  course,
  dept,
  enquiryOptions,
}: {
  course: CoursePublicDTO;
  dept: DepartmentMeta;
  enquiryOptions: EnquiryCourseOption[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dedicatedRoute = DEDICATED_COURSE_ROUTES[course.slug];
  const aviationMeta = AVIATION_CATEGORY_META[course.slug];
  const Icon = aviationMeta?.Icon ?? GraduationCap;

  return (
    <motion.article
      variants={GRID_ITEM}
      className="brutal-card flex min-w-0 flex-col overflow-hidden transition-all duration-300 hover:shadow-lg h-fit self-start"
    >
      <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
        {/* Top bar: Icon on left, category pill on right */}
        <div className="flex items-center justify-between gap-2">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#14281D] text-[#6EA820] shadow-xs"
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-3 py-1 font-grotesk text-[10px] font-bold tracking-wider uppercase text-stone-700">
            {aviationMeta?.label ?? (course.duration ? `Duration: ${course.duration}` : "Certified Course")}
          </span>
        </div>

        {/* Title & Duration */}
        <h3 className="mt-4 font-grotesk text-xl leading-tight font-bold break-words text-ink">
          {course.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-stone-500">
          Duration: {course.duration}
        </p>

        {/* Description */}
        <p className="mt-2.5 text-xs leading-relaxed break-words text-stone-600 line-clamp-3 md:text-sm">
          {course.description}
        </p>

        {/* Highlighted skill pills preview (like ss1) */}
        {course.skills.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {course.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#e6dfd3] bg-white px-2.5 py-1 font-grotesk text-[10px] font-medium text-stone-700 shadow-2xs"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Animated Read More / View Curriculum Button in Olive Green */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#6EA820]/40 bg-[#6EA820]/10 px-3.5 py-1.5 font-grotesk text-xs font-bold tracking-wider uppercase text-[#476e15] shadow-xs transition-all duration-300 hover:border-[#6EA820] hover:bg-[#6EA820] hover:text-white hover:shadow-sm active:scale-95"
          >
            <span>{isExpanded ? "Close Details" : "View Curriculum"}</span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="inline-flex text-[#6EA820] transition-colors group-hover:text-white"
            >
              <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
            </motion.span>
          </button>
        </div>

        {/* Expandable details with smooth accordion animation */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-3 pb-1 border-t border-stone-100 mt-3">
                {/* Full Skills list */}
                {course.skills.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase text-stone-800">
                      <GraduationCap className="h-4 w-4 text-[#6EA820]" aria-hidden />
                      All Modules & Skills
                    </p>
                    <div className="mt-2">
                      <Bullets items={course.skills} color="#6EA820" />
                    </div>
                  </div>
                )}

                {/* Career opportunities / job roles */}
                {course.jobRoles.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase text-stone-800">
                      <Briefcase className="h-4 w-4 text-[#6EA820]" aria-hidden />
                      Career Opportunities
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {course.jobRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-2.5 py-1 font-grotesk text-[11px] font-bold break-words text-stone-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Where you can work */}
                {course.workplaces.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase text-stone-800">
                      <MapPin className="h-4 w-4 text-[#6EA820]" aria-hidden />
                      Where You Can Work
                    </p>
                    <div className="mt-2">
                      <Bullets items={course.workplaces} color="#6EA820" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3.5">
          <EnquiryDialog
            courses={enquiryOptions}
            initialCourseId={course.id}
            source={`department:${course.slug}`}
            triggerLabel="Enquire Now"
            triggerClassName="rounded-xl bg-ink px-4 py-2 text-xs font-bold uppercase text-white hover:bg-stone-800 brutal-hover"
          />
          <span className="inline-flex items-center gap-1 font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#6EA820]">
            <span className="h-2 w-2 rounded-full bg-[#6EA820] animate-pulse" />
            Batches Open
          </span>
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
    <div className="brutal-card flex min-w-0 flex-col p-6">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: `${accent}18`, color: accent }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-grotesk text-lg leading-tight font-bold break-words text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed break-words text-stone-600">
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
      <section aria-label={`${dept.name} department hero`} className="relative overflow-hidden border-b border-[#e6dfd3] gradient-mesh">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.25]" />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: `${dept.accent}12` }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="min-w-0 max-w-3xl">
            <p className="font-grotesk text-xs font-bold tracking-[0.3em] uppercase text-stone-500 md:text-sm">
              Skyora {dept.name} Department
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] uppercase text-ink">
              {dept.name}
            </h1>
            <p className="mt-4 max-w-xl font-grotesk text-base font-bold text-stone-700 md:text-lg">
              {dept.tagline}
            </p>

            {/* Certification badge */}
            <p className="mt-5 inline-flex max-w-full items-center gap-2.5 rounded-xl border border-[#e6dfd3] bg-white px-4 py-2.5 shadow-xs">
              <span className="min-w-0">
                <span className="block font-grotesk text-sm font-bold tracking-wide uppercase text-stone-800">
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
                triggerClassName="rounded-xl bg-ink px-6 font-bold uppercase text-white hover:bg-stone-800 brutal-hover"
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-[#dcd4c5] bg-white font-bold uppercase text-ink shadow-xs hover:bg-stone-100 brutal-hover"
              >
                <a href="#courses">View Courses</a>
              </Button>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 py-2 font-grotesk text-xs font-bold uppercase text-stone-700 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" style={{ color: dept.accent }} aria-hidden />
              {courses.length} career program{courses.length === 1 ? "" : "s"}
            </div>
          </div>
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
          <h2 className="font-display text-2xl leading-none uppercase text-ink md:text-3xl">
            About the department
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-stone-600 md:text-lg">
            {dept.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-3 py-1.5 font-grotesk text-xs font-bold uppercase text-stone-700">
              <GraduationCap className="h-4 w-4" aria-hidden />
              {cert.short}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-3 py-1.5 font-grotesk text-xs font-bold uppercase text-stone-700">
              <Briefcase className="h-4 w-4" aria-hidden />
              Placement support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-[#f4ede3] px-3 py-1.5 font-grotesk text-xs font-bold uppercase text-stone-700">
              <Building2 className="h-4 w-4" aria-hidden />
              Working industry mentors
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── COURSES ──────────────────────────────────────────────── */}
      <section id="courses" aria-label={`${dept.name} courses`} className="scroll-mt-24 border-t border-[#e6dfd3] bg-[#f4ede3]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <SectionHeading
            eyebrow={`${courses.length} program${courses.length === 1 ? "" : "s"} · certification included`}
            title={`${dept.name} COURSES`}
            highlight="COURSES"
            description={`Every ${dept.name} program below is mentor-led, project-first and mapped to what employers actually test for. Pick a course to see the skills, the job roles and where you can work.`}
          />

          {courses.length === 0 ? (
            <div className="brutal-card mx-auto mt-10 max-w-lg p-8 text-center md:p-12">
              <p className="font-display text-xl uppercase text-ink">No courses here yet</p>
              <p className="mt-2 text-sm text-stone-500">
                We&apos;re finalising the {dept.name} lineup — enquire on WhatsApp
                and we&apos;ll send the brochure first.
              </p>
              <div className="mt-6">
                <Button asChild className="rounded-xl bg-ink font-bold uppercase text-white hover:bg-stone-800 brutal-hover">
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
              className={`mt-10 grid items-start gap-6 md:grid-cols-2 ${courses.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
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

      {/* ── FLAGSHIP IT SPECIALIZATIONS ───────────────────────────── */}
      {dept.track === "IT" && (
        <section
          aria-label="Flagship IT Specializations"
          className="border-t border-[#e6dfd3] bg-[#F2F4EB] py-12 md:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHeading
              eyebrow="Specialized Career Tracks"
              title="FLAGSHIP IT SPECIALIZATIONS"
              highlight="SPECIALIZATIONS"
              description="Explore dedicated, in-depth curriculum pathways in Data Science, Artificial Intelligence, Machine Learning, and Data Analytics at our Kochi training center."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(IT_COURSES_DATA).map((spec) => (
                <div
                  key={spec.slug}
                  className="brutal-card-sm flex flex-col justify-between p-6 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-grotesk text-xs font-bold uppercase text-[#0891B2]">
                        {spec.duration}
                      </span>
                      <BadgeCheck className="h-4 w-4 text-brand-green" aria-hidden />
                    </div>
                    <h3 className="mt-2 font-grotesk text-lg font-bold text-ink">
                      {spec.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone-600 line-clamp-3">
                      {spec.tagline}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-[#E6DFC8] pt-4">
                    <Link
                      href={spec.route}
                      className="inline-flex items-center gap-1.5 font-grotesk text-xs font-bold uppercase tracking-wider text-ink hover:text-[#0891B2]"
                    >
                      Explore {spec.title}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── OPPORTUNITIES ────────────────────────────────────────── */}
      <section aria-label={`${dept.name} opportunities`} className="border-t border-[#e6dfd3]">
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
            className="relative mt-12 overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-xl md:p-14"
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
                  Start your {dept.name}{" "}
                  <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">career</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm text-stone-300 md:text-base">
                  Talk to a counsellor today — free, no pressure. We&apos;ll map
                  the right course, duration and batch for you.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <EnquiryDialog
                  courses={enquiryOptions}
                  source={`department-cta:${dept.track}`}
                  triggerLabel="Enquire Now"
                  triggerClassName="rounded-xl bg-brand-blue px-6 font-bold uppercase text-white hover:bg-brand-blue/90 brutal-hover"
                />
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-xl border border-white/20 font-bold uppercase text-white hover:bg-white/10"
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
