"use client";

/**
 * Home page:
 * - Premium daylight cream & olive green design system
 * - Hero inspired by the Skyora campus + ascending flight visual
 * - 4 interactive category cards (Aviation, Full Stack, AI & ML, Data Science & Analytics)
 * - IATA & STED official certifications strip
 * - Recruiter marquee with hiring partners
 * - Dual runway department highlight cards
 * - Aviation courses syllabus grid
 * - IT & Software courses with category tabs (AI/ML, Data Science, Data Analytics, Full Stack)
 * - 1:1 faculty mentorship guarantee
 * - Live DB vacancies query with application links
 * - Student testimonials
 * - Final conversion CTA
 */

import { useState } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  GraduationCap,
  Laptop,
  Layers,
  MapPin,
  Plane,
  Quote,
  Shield,
  Star,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import { DEPARTMENTS } from "@/lib/departments";
import type { CourseDTO, CoursePublicDTO, Track, JobType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/public/section-heading";
import { StatCards } from "@/components/public/stat-cards";
import { RecruiterMarquee } from "@/components/public/marquee";
import { usePublicContent } from "@/components/public/use-public-content";
import { ContentError } from "@/components/public/content-state";

// ── Motion variants ──────────────────────────────────────────────────────────
const HERO_CONTAINER: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const HERO_ITEM: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};
const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

/** Flatten the API CourseDTO to the public shape. */
function toPublic(c: CourseDTO): CoursePublicDTO {
  return {
    id: c.id,
    title: c.title,
    track: c.track,
    slug: c.slug,
    duration: c.duration,
    description: c.description,
    skills: c.skills.split("\n").filter(Boolean),
    jobRoles: c.jobRoles.split("\n").filter(Boolean),
    workplaces: c.workplaces.split("\n").filter(Boolean),
    image: c.image,
  };
}

// ── 4 Hero Category Cards ───────────────────────────────────────────────────
interface HeroCategory {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  targetId: string;
}

const HERO_CATEGORIES: HeroCategory[] = [
  {
    title: "Aviation Courses",
    subtitle: "Cabin Crew & Airport Ops",
    icon: Plane,
    targetId: "aviation-courses",
  },
  {
    title: "Full Stack Development",
    subtitle: "MERN, Next.js & Cloud",
    icon: Code2,
    targetId: "it-courses",
  },
  {
    title: "AI & Machine Learning",
    subtitle: "Deep Learning & MLOps",
    icon: Brain,
    targetId: "it-courses",
  },
  {
    title: "Data Science & Analytics",
    subtitle: "Python, SQL & Power BI",
    icon: BarChart3,
    targetId: "it-courses",
  },
];

// ── Static Course definitions with rich category tags ────────────────────────
interface StaticCourse {
  title: string;
  category: "aviation" | "fullstack" | "aiml" | "datascience" | "analytics" | "security";
  categoryLabel: string;
  duration: string;
  description: string;
  skills: string[];
  icon: LucideIcon;
  deptPath: string;
}

const AVIATION_COURSES: StaticCourse[] = [
  {
    title: "Cabin Crew Training",
    category: "aviation",
    categoryLabel: "In-Flight Hospitality",
    duration: "6 Months",
    description:
      "Comprehensive flight attendant training covering safety protocols, in-flight hospitality, aviation grooming, personality development and mock interview simulations.",
    skills: ["Safety Procedures", "In-Flight Service", "Grooming & Etiquette", "Emergency Drills"],
    icon: Plane,
    deptPath: "/aviation",
  },
  {
    title: "Ground Staff & Airport Ops",
    category: "aviation",
    categoryLabel: "Ground Operations",
    duration: "4 Months",
    description:
      "Master check-in systems, boarding desk procedures, passenger assistance, baggage handling, and security protocols across modern commercial airports.",
    skills: ["Check-in Counters", "Boarding Gate Ops", "Baggage Services", "Passenger Handling"],
    icon: BriefcaseBusiness,
    deptPath: "/aviation",
  },
  {
    title: "Airport Management & Cargo",
    category: "aviation",
    categoryLabel: "Logistics & Cargo",
    duration: "6 Months",
    description:
      "End-to-end air cargo handling, dangerous goods regulations (DGR), ramp safety coordination, and terminal management operations for international carriers.",
    skills: ["Air Cargo Logistics", "DGR Awareness", "Ramp Coordination", "Terminal Ops"],
    icon: Layers,
    deptPath: "/aviation",
  },
  {
    title: "Airline Ticketing & GDS",
    category: "aviation",
    categoryLabel: "Travel Commerce",
    duration: "3 Months",
    description:
      "Practical mastery of global distribution systems (Amadeus & Galileo), fare calculations, PNR creation, and flight reservations across global airlines.",
    skills: ["Amadeus GDS", "Galileo", "Fare Construction", "E-Ticketing"],
    icon: BookOpen,
    deptPath: "/aviation",
  },
];

const IT_COURSES: StaticCourse[] = [
  {
    title: "Full Stack Web Development",
    category: "fullstack",
    categoryLabel: "Full Stack MERN",
    duration: "6 Months",
    description:
      "Modern full-stack engineering with MongoDB, Express.js, React, Node.js, Next.js and TypeScript. Build production SaaS apps with cloud deployment and RESTful APIs.",
    skills: ["React & Next.js", "Node.js & Express", "MongoDB & Prisma", "TypeScript", "Tailwind CSS"],
    icon: Code2,
    deptPath: "/it",
  },
  {
    title: "AI & Machine Learning",
    category: "aiml",
    categoryLabel: "AI & ML",
    duration: "6 Months",
    description:
      "Build intelligent systems with Python, TensorFlow and PyTorch. Master supervised learning, computer vision, natural language processing and LLM fine-tuning.",
    skills: ["Python", "TensorFlow & PyTorch", "Neural Networks", "NLP & Computer Vision", "LLMs"],
    icon: Brain,
    deptPath: "/it/artificial-intelligence",
  },
  {
    title: "Data Science Specialization",
    category: "datascience",
    categoryLabel: "Data Science",
    duration: "6 Months",
    description:
      "End-to-end data pipelines: statistical analysis, predictive modeling, machine learning algorithms and big data analysis on real industry datasets.",
    skills: ["Python & Pandas", "Statistics & Math", "Scikit-Learn", "Feature Engineering", "Data Modeling"],
    icon: BarChart3,
    deptPath: "/it/data-science",
  },
  {
    title: "Data Analytics & BI",
    category: "analytics",
    categoryLabel: "Business Intelligence",
    duration: "4 Months",
    description:
      "Transform raw business data into actionable dashboards using advanced SQL, Microsoft Power BI, Tableau and automated Python data processing workflows.",
    skills: ["SQL (PostgreSQL)", "Power BI", "Tableau", "Excel Automation", "KPI Dashboards"],
    icon: BarChart3,
    deptPath: "/it/data-analytics",
  },
  {
    title: "Mobile App Development (Flutter)",
    category: "fullstack",
    categoryLabel: "Mobile Development",
    duration: "4 Months",
    description:
      "Craft high-performance native iOS and Android applications with Dart and Flutter. Implement state management, Firebase backends and app store publishing.",
    skills: ["Dart", "Flutter Architecture", "Firebase", "State Management", "App Stores"],
    icon: Laptop,
    deptPath: "/it",
  },
  {
    title: "Cyber Security & Ethical Hacking",
    category: "security",
    categoryLabel: "Cyber Security",
    duration: "5 Months",
    description:
      "Hands-on defense and attack simulations: network security, ethical penetration testing, vulnerability assessment, cryptography and SOC monitoring.",
    skills: ["Network Security", "Penetration Testing", "Wireshark & Linux", "SOC Fundamentals"],
    icon: Shield,
    deptPath: "/it",
  },
];

// ── 1:1 Faculty Mentorship Features ──────────────────────────────────────────
interface FacultyFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FACULTY_FEATURES: FacultyFeature[] = [
  {
    title: "Personalised Learning Roadmap",
    description:
      "Your faculty mentor tailors the schedule and project pace to your unique goals — whether aiming for international airlines or software engineering roles.",
    icon: BookOpen,
  },
  {
    title: "Weekly 1-on-1 Milestone Reviews",
    description:
      "Never get stuck in a crowded lecture hall. Every week your mentor reviews your code or aviation mock performance in an exclusive 1:1 feedback session.",
    icon: UserCheck,
  },
  {
    title: "Industry-Active Practitioner Mentors",
    description:
      "Learn from professionals with active airline and tech backgrounds: commercial aviators, airline ops supervisors and senior software developers.",
    icon: GraduationCap,
  },
  {
    title: "Rigorous Interview-Ready Drills",
    description:
      "Extensive grooming drills, technical live-coding sessions and behavioral mock panels ensure you walk into placement interviews completely confident.",
    icon: BriefcaseBusiness,
  },
];

// ── Course Card Component ────────────────────────────────────────────────────
function CourseCard({ course }: { course: StaticCourse }) {
  const IconComp = course.icon;
  return (
    <motion.div variants={GRID_ITEM} className="flex">
      <Link
        href={course.deptPath}
        className="group relative flex w-full flex-col justify-between rounded-2xl border border-[#E4DEC3] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(20,40,29,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#6EA820]/60 hover:shadow-lg"
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#14281D] text-[#6EA820] shadow-xs transition-colors group-hover:bg-[#6EA820] group-hover:text-white"
            >
              <IconComp className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-[#F4F6EE] px-2.5 py-1 font-grotesk text-[10px] font-bold tracking-wider uppercase text-[#24422D]">
              {course.categoryLabel}
            </span>
          </div>

          <h4 className="mt-4 font-grotesk text-lg font-bold text-[#14281D] transition-colors group-hover:text-[#24422D]">
            {course.title}
          </h4>
          <span className="mt-1 block text-xs font-semibold text-stone-500">
            Duration: {course.duration}
          </span>
          <p className="mt-2.5 text-sm leading-relaxed text-[#4A5D4F]">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {course.skills.map((s) => (
              <span
                key={s}
                className="rounded-md border border-stone-200/80 bg-stone-50/70 px-2 py-0.5 font-grotesk text-[11px] font-medium text-stone-600"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="inline-flex items-center gap-1 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] transition-colors group-hover:text-[#6EA820]">
            View Curriculum
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="text-[11px] font-bold text-stone-400 uppercase">
            Batches Open
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Vacancy card (live DB data) ──────────────────────────────────────────────
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
    <motion.div variants={GRID_ITEM}>
      <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E4DEC3] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(20,40,29,0.04)] transition-all hover:border-[#6EA820]/50 hover:shadow-md">
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-[#14281D] px-2.5 py-0.5 font-grotesk text-[10px] font-bold tracking-wider uppercase text-[#6EA820]">
              {JOB_TYPE_LABELS[vacancy.jobType] ?? vacancy.jobType}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="h-3 w-3" aria-hidden />
              {vacancy.location}
            </span>
          </div>

          <h4 className="mt-3 font-grotesk text-lg font-bold text-[#14281D]">
            {vacancy.title}
          </h4>
          <p className="mt-0.5 font-grotesk text-sm font-semibold text-[#6EA820]">
            {vacancy.company}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 line-clamp-3">
            {vacancy.description}
          </p>
        </div>

        <Button
          asChild
          className="mt-5 w-full rounded-full bg-[#14281D] font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
        >
          <a
            href={vacancy.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5"
          >
            Apply Now
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}

function VacancySkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs" aria-hidden>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-3 h-12 w-full" />
      <Skeleton className="mt-5 h-9 w-full rounded-full" />
    </div>
  );
}

// ── Department Highlight Card ────────────────────────────────────────────────
function TrackCard({
  track,
  Icon,
  courses,
}: {
  track: Track;
  Icon: LucideIcon;
  courses: CoursePublicDTO[];
}) {
  const dept = DEPARTMENTS[track];
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-[#E4DEC3] bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:p-9">
      <div>
        <div className="flex items-center justify-between gap-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#14281D] text-[#6EA820] shadow-xs"
          >
            <Icon className="h-7 w-7" />
          </span>
          <span className="rounded-full bg-[#F4F6EE] px-3 py-1 font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#24422D]">
            {siteConfig.certifications[track].short}
          </span>
        </div>

        <h3 className="mt-5 font-display text-2xl uppercase text-[#14281D] md:text-3xl">
          {dept.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4A5D4F]">
          {dept.tagline}
        </p>

        <div className="mt-6 border-t border-stone-100 pt-5">
          <p className="font-grotesk text-xs font-bold uppercase tracking-wider text-stone-500">
            Featured Programs
          </p>
          <div className="mt-3 space-y-2">
            {courses.length === 0 ? (
              <p className="text-xs text-stone-400">Batches enrolling now</p>
            ) : (
              courses.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-[#14281D]">{c.title}</span>
                  <span className="text-xs text-stone-500">{c.duration}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          asChild
          className="w-full rounded-full bg-[#14281D] font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
        >
          <Link href={dept.path} className="inline-flex items-center justify-center gap-1.5">
            Explore {dept.name}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── MAIN HOMEPAGE SECTION ────────────────────────────────────────────────────
export function HomeSection() {
  const { data, error, loading, refetch } = usePublicContent();
  const [itFilter, setItFilter] = useState<"all" | "aiml" | "datascience" | "analytics" | "fullstack">("all");

  const aviationCourses = (data?.courses ?? [])
    .filter((c) => c.track === "AVIATION")
    .slice(0, 3)
    .map(toPublic);
  const itCourses = (data?.courses ?? [])
    .filter((c) => c.track === "IT")
    .slice(0, 3)
    .map(toPublic);

  const vacancies = data?.vacancies ?? [];

  const filteredItCourses =
    itFilter === "all"
      ? IT_COURSES
      : IT_COURSES.filter((c) => c.category === itFilter);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-[#F8F9F5] text-[#14281D]">
      {/* ── HERO SECTION (Daylight campus & ascending flight visual) ── */}
      <section
        aria-label="Skyora institute hero"
        className="relative overflow-hidden border-b border-[#E6DFC8]/60 bg-[#F8F9F5]"
      >
        {/* Full-width desktop background visual */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-cover bg-right-top lg:block"
          style={{ backgroundImage: `url('/hero/skyora-hero-bg.webp')` }}
        >
          {/* Gentle left-side wash: ensures 100% typography contrast while revealing trees, aircraft, and campus */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9F5] via-[#F8F9F5]/75 via-42% to-transparent" />
          {/* Bottom fade into cards */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F8F9F5] via-[#F8F9F5]/50 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-14 md:px-6 md:pt-14 md:pb-16 lg:pt-16 lg:pb-20">
          <motion.div
            variants={HERO_CONTAINER}
            initial="hidden"
            animate="show"
            className="max-w-2xl lg:max-w-xl xl:max-w-2xl"
          >
            {/* Admissions Badge */}
            <motion.div variants={HERO_ITEM}>
              <Link
                href="/aviation"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/95 px-4 py-1.5 font-grotesk text-xs font-bold tracking-wider uppercase text-[#14281D] shadow-xs backdrop-blur-md transition-all hover:border-[#6EA820] hover:bg-white"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6EA820]" />
                Admissions Open 2025
                <ArrowRight className="h-3.5 w-3.5 text-[#6EA820]" aria-hidden />
              </Link>
            </motion.div>

            {/* Headline matching user design direction */}
            <motion.h1
              variants={HERO_ITEM}
              className="mt-6 font-display text-[clamp(2.75rem,5.8vw,5.5rem)] leading-[0.93] tracking-tight uppercase text-[#14281D]"
            >
              Careers Take<br />
              <span className="text-[#6EA820]">Flight</span> At<br />
              Skyora
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={HERO_ITEM}
              className="mt-6 text-base leading-relaxed text-[#3B4C41] md:text-lg"
            >
              Aviation &amp; IT training under one roof — mentor-led batches,
              real projects and mock interviews that end in offer letters. Choose
              the cabin, the airport ops desk or the tech lab — and build a
              career that truly takes off.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              variants={HERO_ITEM}
              className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4"
            >
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#14281D] px-8 py-3.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#1E3A2B] hover:shadow-md hover:-translate-y-0.5"
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
                className="rounded-full border border-stone-300 bg-white px-7 py-3.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] shadow-xs transition-all hover:bg-stone-50 hover:border-stone-400"
              >
                <Link href="/aviation">Explore Courses</Link>
              </Button>
            </motion.div>

            {/* Social Trust Bar */}
            <motion.p
              variants={HERO_ITEM}
              className="mt-6 flex items-center gap-2 font-grotesk text-xs font-semibold uppercase tracking-wider text-stone-500"
            >
              <CheckCircle2 className="h-4 w-4 text-[#6EA820]" />
              500+ Placements · 40+ Hiring Partners · 1:1 Faculty Mentorship
            </motion.p>
          </motion.div>

          {/* Mobile / Tablet Showcase Card (< lg screens) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 overflow-hidden rounded-3xl border border-[#E4DEC3] bg-white shadow-md lg:hidden"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src="/hero/skyora-hero-card.webp"
                alt="Skyora Integrated Campus with commercial airplane soaring in flight"
                width={1200}
                height={800}
                className="h-full w-full object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-white/95 px-4 py-2.5 backdrop-blur-md shadow-xs">
                <div>
                  <p className="font-grotesk text-xs font-bold text-[#14281D]">
                    Skyora Integrated Campus
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Aviation &amp; Technology Facilities
                  </p>
                </div>
                <span className="rounded-full bg-[#6EA820] px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                  Live Admissions
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── 4 Hero Category Cards ── */}
          <motion.div
            variants={GRID_CONTAINER}
            initial="hidden"
            animate="show"
            className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-16 lg:grid-cols-4"
          >
            {HERO_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <motion.div key={cat.title} variants={GRID_ITEM}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(cat.targetId)}
                    className="group flex h-full w-full flex-col items-center justify-center rounded-2xl border border-stone-200/90 bg-white/90 p-4 text-center shadow-[0_4px_20px_-2px_rgba(20,40,29,0.05)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#6EA820]/60 hover:bg-white hover:shadow-md sm:p-5"
                  >
                    <span
                      aria-hidden
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6EA820] text-white shadow-xs transition-transform duration-200 group-hover:scale-105"
                    >
                      <IconComp className="h-6 w-6" />
                    </span>
                    <h3 className="mt-3 font-grotesk text-sm font-bold text-[#14281D] transition-colors group-hover:text-[#24422D] sm:text-base">
                      {cat.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-stone-500 font-medium">
                      {cat.subtitle}
                    </p>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────── */}
      <section
        aria-label="Skyora statistics"
        className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
      >
        <StatCards />
      </section>

      {/* ── IATA & STED CERTIFICATIONS SECTION ────────────────────── */}
      <section
        aria-label="Certifications — IATA and STED Council"
        className="border-y border-[#E6DFC8] bg-[#F2F4EC]"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
        >
          <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
            {/* Left: Headline & accreditation context */}
            <div>
              <p className="flex items-center gap-2 font-grotesk text-xs font-bold uppercase tracking-[0.2em] text-[#6EA820]">
                <span className="h-2 w-2 rounded-full bg-[#6EA820]" />
                Industry Accreditations
              </p>
              <h3 className="mt-2.5 font-display text-2xl uppercase text-[#14281D] md:text-3xl lg:text-4xl">
                Globally Recognised Credentials That Open Aviation &amp; Tech Doors
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4A5D4F] md:text-base">
                SKYORA delivers certifications recognized worldwide by leading
                commercial airlines, international airports and global IT enterprises.
              </p>
            </div>

            {/* Right: IATA + STED Council badges */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* IATA Badge */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E4DEC3] bg-white p-5 text-center shadow-xs transition-transform hover:-translate-y-0.5 sm:p-6">
                <div className="relative h-14 w-28 sm:h-16 sm:w-32">
                  <Image
                    src="/certifications/iata-preferred.png"
                    alt="IATA — International Air Transport Association Authorized Training Center"
                    fill
                    className="object-contain"
                  />
                </div>
                <h4 className="mt-3 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] sm:text-sm">
                  IATA Authorized
                </h4>
                <p className="mt-1 text-[11px] text-stone-500">
                  Global Aviation Standard
                </p>
              </div>

              {/* STED Council Badge */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E4DEC3] bg-white p-5 text-center shadow-xs transition-transform hover:-translate-y-0.5 sm:p-6">
                <div className="relative h-14 w-28 sm:h-16 sm:w-32">
                  <Image
                    src="/certifications/sted-council.png"
                    alt="STED Council — Scientific & Technical Education Development Council"
                    fill
                    className="object-contain"
                  />
                </div>
                <h4 className="mt-3 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] sm:text-sm">
                  STED Council
                </h4>
                <p className="mt-1 text-[11px] text-stone-500">
                  National Skill Certification
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── RECRUITER MARQUEE ─────────────────────────────────────── */}
      <section aria-label="Our hiring partners" className="bg-[#F8F9F5]">
        <RecruiterMarquee />
      </section>

      {/* ── DUAL RUNWAY DEPARTMENT CARDS ──────────────────────────── */}
      <section
        aria-label="Departments"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20"
      >
        <SectionHeading
          eyebrow="Dual Runway Approach"
          title="Two Industry Pillars Under One Roof"
          highlight="Under One Roof"
          highlightClassName="text-[#6EA820]"
          dotColor="bg-[#6EA820]"
          description="Choose between high-growth aviation operations or cutting-edge software engineering, backed by dedicated labs and career mentors."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:mt-12">
          <TrackCard
            track="AVIATION"
            Icon={Plane}
            courses={aviationCourses}
          />
          <TrackCard
            track="IT"
            Icon={Code2}
            courses={itCourses}
          />
        </div>
      </section>

      {/* ── AVIATION COURSES GRID ─────────────────────────────────── */}
      <section
        id="aviation-courses"
        aria-label="Aviation courses"
        className="scroll-mt-24 border-t border-[#E6DFC8]/80 bg-[#F4F6EE] py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Aviation Programs"
              title="Cabin Crew & Airport Operations"
              highlight="Airport Operations"
              highlightClassName="text-[#6EA820]"
              dotColor="bg-[#6EA820]"
              description="From aircraft passenger service to ramp coordination and global ticketing systems — structured for direct placement."
            />
            <Button
              asChild
              className="w-fit rounded-full bg-[#14281D] px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
            >
              <Link href="/aviation" className="inline-flex items-center gap-1.5">
                View All Aviation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <motion.div
            variants={GRID_CONTAINER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {AVIATION_COURSES.map((course) => (
              <CourseCard key={course.title} course={course} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── IT COURSES WITH CATEGORY TABS ─────────────────────────── */}
      <section
        id="it-courses"
        aria-label="IT and software courses"
        className="scroll-mt-24 border-t border-[#E6DFC8]/80 bg-[#F8F9F5] py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Technology Programs"
              title="Software Engineering, AI & Data Science"
              highlight="AI & Data Science"
              highlightClassName="text-[#6EA820]"
              dotColor="bg-[#6EA820]"
              description="Full stack web, artificial intelligence, data analytics and mobile app development engineered for high-growth tech roles."
            />
            <Button
              asChild
              className="w-fit rounded-full bg-[#14281D] px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
            >
              <Link href="/it" className="inline-flex items-center gap-1.5">
                View All IT
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Interactive Category Tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Tech Courses" },
              { id: "aiml", label: "AI & Machine Learning" },
              { id: "datascience", label: "Data Science" },
              { id: "analytics", label: "Data Analytics" },
              { id: "fullstack", label: "Full Stack & Mobile" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setItFilter(tab.id as typeof itFilter)}
                className={`rounded-full px-4 py-2 font-grotesk text-xs font-bold uppercase tracking-wider transition-all ${
                  itFilter === tab.id
                    ? "bg-[#14281D] text-white shadow-xs"
                    : "border border-stone-200 bg-white text-[#24422D] hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            variants={GRID_CONTAINER}
            initial="hidden"
            animate="show"
            key={itFilter}
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredItCourses.map((course) => (
              <CourseCard key={course.title} course={course} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 1:1 FACULTY MENTORSHIP SECTION ────────────────────────── */}
      <section
        aria-label="One faculty for one student mentorship"
        className="border-t border-[#E6DFC8]/80 bg-[#F2F4EC] py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            eyebrow="Personalized Mentorship"
            title="One Faculty For One Student Mentorship"
            highlight="One Student"
            highlightClassName="text-[#6EA820]"
            dotColor="bg-[#6EA820]"
            description="At SKYORA, you are never lost in a crowd. Every student is paired with a dedicated personal faculty mentor who tracks progress from day one until job placement."
          />

          {/* Guarantee banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10 overflow-hidden rounded-3xl border border-[#E4DEC3] bg-gradient-to-br from-[#14281D] to-[#223E2E] p-8 text-white shadow-md md:p-10"
          >
            <div className="grid items-center gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#6EA820]/20 px-3 py-1 font-grotesk text-xs font-bold uppercase tracking-wider text-[#6EA820]">
                  <UserCheck className="h-3.5 w-3.5" />
                  Mentorship Guarantee
                </span>
                <h3 className="mt-3 font-display text-2xl uppercase sm:text-3xl">
                  Dedicated 1-on-1 Guidance For Every Enrolled Student
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-300 md:text-base">
                  Daily doubts clearance, code reviews, grooming feedback, and
                  individual placement preparation. Your success is your mentor&apos;s
                  primary mission.
                </p>
              </div>

              <div className="flex flex-col items-start rounded-2xl bg-white/10 p-5 backdrop-blur-sm md:items-center md:text-center">
                <span className="font-display text-4xl text-[#6EA820] sm:text-5xl">
                  1 : 1
                </span>
                <span className="mt-1 font-grotesk text-xs font-bold tracking-wider uppercase text-white">
                  Student : Mentor Ratio
                </span>
                <span className="mt-0.5 text-xs text-stone-300">
                  Guaranteed across all batches
                </span>
              </div>
            </div>
          </motion.div>

          {/* 4 Feature cards */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACULTY_FEATURES.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-[#E4DEC3] bg-white p-6 shadow-xs transition-transform hover:-translate-y-1"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F6EE] text-[#6EA820]"
                  >
                    <IconComp className="h-6 w-6" />
                  </span>
                  <h4 className="mt-4 font-grotesk text-base font-bold text-[#14281D]">
                    {feat.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A5D4F]">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LIVE VACANCIES SECTION ────────────────────────────────── */}
      <section
        id="vacancies"
        aria-label="Job vacancies"
        className="scroll-mt-24 border-t border-[#E6DFC8]/80 bg-[#F8F9F5] py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Placement Cell"
              title="Live Industry Vacancies & Hiring Openings"
              highlight="Live Industry Vacancies"
              highlightClassName="text-[#6EA820]"
              dotColor="bg-[#6EA820]"
              description="Active opportunities from our hiring network across international airlines, ground handling agencies and IT software firms."
            />
            <Button
              asChild
              className="w-fit rounded-full bg-[#14281D] px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
            >
              <a
                href={siteConfig.links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("vacancies_inquiry")}
                className="inline-flex items-center gap-1.5"
              >
                Inquire For Openings
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <VacancySkeleton />
                <VacancySkeleton />
                <VacancySkeleton />
              </div>
            ) : error ? (
              <ContentError
                message={error ?? "Failed to load live vacancies"}
                onRetry={refetch}
              />
            ) : vacancies.length === 0 ? (
              <div className="rounded-2xl border border-[#E4DEC3] bg-white p-8 text-center sm:p-12">
                <BriefcaseBusiness className="mx-auto h-12 w-12 text-[#6EA820]" />
                <h4 className="mt-3 font-grotesk text-lg font-bold text-[#14281D]">
                  New Openings Are Being Added
                </h4>
                <p className="mt-1 text-sm text-stone-500">
                  Our placement team is currently onboarding corporate vacancies for the upcoming drive.
                </p>
                <Button
                  asChild
                  className="mt-5 rounded-full bg-[#14281D] font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1E3A2B]"
                >
                  <a
                    href={siteConfig.links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsApp("vacancies_empty_whatsapp")}
                  >
                    Contact Placement Cell
                  </a>
                </Button>
              </div>
            ) : (
              <motion.div
                variants={GRID_CONTAINER}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {vacancies.map((vacancy) => (
                  <VacancyCard key={vacancy.id} vacancy={vacancy} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section
        aria-label="Testimonials"
        className="border-t border-[#E6DFC8]/80 bg-[#F4F6EE] py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            eyebrow="Placement Stories"
            title="From Training To Takeoff"
            highlight="Takeoff"
            highlightClassName="text-[#6EA820]"
            dotColor="bg-[#6EA820]"
            description="Listen to graduates who turned mentor-led training into rewarding aviation and technology careers."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-12">
            {[
              {
                name: "Ananya Nair",
                role: "Cabin Crew · Qatar Airways",
                program: "Aviation Academy",
                quote:
                  "The 1:1 grooming sessions and mock interviews at SKYORA gave me the exact confidence needed for the Qatar Airways assessment day. I cleared in my first attempt!",
              },
              {
                name: "Rahul Pillai",
                role: "Full Stack Engineer · UST",
                program: "Tech Academy",
                quote:
                  "Building real production projects with React and Node under senior mentor guidance made all the difference. I had 3 interview rounds and received an offer within 2 weeks of graduation.",
              },
              {
                name: "Fathima Zehra",
                role: "Airport Ops Specialist · Indigo",
                program: "Aviation Academy",
                quote:
                  "The IATA-aligned curriculum and Amadeus software training made me feel at home at Cochin International Airport from day one. SKYORA's placement team is incredible.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-2xl border border-[#E4DEC3] bg-white p-6 shadow-xs sm:p-7"
              >
                <div>
                  <Quote className="h-8 w-8 text-[#6EA820]/40" />
                  <p className="mt-3 text-sm leading-relaxed text-[#4A5D4F]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <p className="font-grotesk text-sm font-bold text-[#14281D]">
                    {t.name}
                  </p>
                  <p className="text-xs font-semibold text-[#6EA820]">
                    {t.role}
                  </p>
                  <p className="text-[11px] text-stone-400">{t.program}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ──────────────────────────────────────── */}
      <section
        aria-label="Enrolment call to action"
        className="border-t border-[#E6DFC8]/80 bg-[#14281D] py-16 text-white md:py-24"
      >
        <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#6EA820]/20 px-4 py-1 font-grotesk text-xs font-bold uppercase tracking-wider text-[#6EA820]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#6EA820]" />
            New Batches Starting Soon
          </span>
          <h2 className="mt-4 font-display text-3xl uppercase sm:text-5xl md:text-6xl">
            Ready For Takeoff? Join Kerala&apos;s Premier Institute.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
            Whether your destination is thirty thousand feet in the air or building
            the next generation of software, your journey starts here. Speak with an
            academic counselor today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#6EA820] px-8 py-3.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#14281D] shadow-md hover:bg-[#7CB925] hover:-translate-y-0.5"
            >
              <a
                href={siteConfig.links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp("home_cta")}
              >
                Book Free Counseling
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border border-stone-600 bg-transparent px-7 py-3.5 font-grotesk text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-stone-400"
            >
              <Link href="/aviation">Explore All Programs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
