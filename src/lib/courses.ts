/**
 * Server-side course helpers shared by the public pages (RSC) and APIs.
 * The Course row stores lists as newline-separated strings (SQLite has no
 * string arrays); these helpers parse them into arrays for rendering.
 */

import { db } from "@/lib/db";
import type { Course } from "@prisma/client";
import type { CoursePublicDTO, Track } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/departments";

export const DEFAULT_AVIATION_COURSES: CoursePublicDTO[] = [
  {
    id: "course-aviation-cabin-crew",
    title: "Cabin Crew Training",
    track: "AVIATION",
    slug: "cabin-crew-training",
    duration: "6 Months",
    description:
      "Comprehensive flight attendant training covering safety protocols, in-flight hospitality, aviation grooming, personality development and mock interview simulations.",
    skills: [
      "Safety Procedures (SEP)",
      "In-Flight Hospitality & Service",
      "Aviation Grooming & Deportment",
      "Emergency Drills & First Aid",
      "Passenger Psychology & Conflict Resolution",
      "Airline Interview & Grooming Panels",
    ],
    jobRoles: [
      "Cabin Crew / Flight Attendant",
      "Flight Purser",
      "Senior Cabin Crew",
      "Airline Customer Service",
      "In-Flight Service Trainer",
    ],
    workplaces: [
      "Domestic airlines (IndiGo, Air India, SpiceJet, Akasa Air)",
      "International carriers (Emirates, Qatar Airways, Etihad)",
      "Charter flight operators & corporate aviation",
    ],
    image: null,
  },
  {
    id: "course-aviation-ground-staff",
    title: "Ground Staff & Airport Ops",
    track: "AVIATION",
    slug: "ground-staff-airport-operations",
    duration: "4 Months",
    description:
      "Master check-in systems, boarding desk procedures, passenger assistance, baggage handling, and security protocols across modern commercial airports.",
    skills: [
      "Check-in Counters & DCS Systems",
      "Boarding Gate Operations & Procedures",
      "Baggage Services & Lost & Found",
      "Passenger Handling & Special Assistance",
      "Ramp Safety & Apron Awareness",
      "Airport Security & DGCA Regulations",
    ],
    jobRoles: [
      "Ground Staff / Customer Service Agent",
      "Check-in & Boarding Executive",
      "Ramp Coordinator",
      "Ticketing & Reservation Officer",
      "Baggage Service Agent",
      "Airport Lounge Staff",
    ],
    workplaces: [
      "Commercial airport terminals (CIAL, DIAL, BLR)",
      "Ground handling agencies (Celebi, AISATS, Bird Group)",
      "Airline ground operations teams",
    ],
    image: null,
  },
  {
    id: "course-aviation-cargo-management",
    title: "Airport Management & Cargo",
    track: "AVIATION",
    slug: "airport-management-cargo",
    duration: "6 Months",
    description:
      "End-to-end air cargo handling, dangerous goods regulations (DGR), ramp safety coordination, and terminal management operations for international carriers.",
    skills: [
      "Air Cargo Logistics & Documentation",
      "Dangerous Goods Regulations (DGR) Awareness",
      "Ramp Coordination & Turnaround Management",
      "Terminal Operations & Airport Flow Management",
      "Air Waybill (AWB) Processing",
      "Customs & Freight Handling Procedures",
    ],
    jobRoles: [
      "Air Cargo Operations Officer",
      "Airport Terminal Manager",
      "Ramp Safety Officer",
      "Air Freight & Logistics Executive",
      "DGR Compliance Specialist",
    ],
    workplaces: [
      "International airport cargo terminals",
      "Air cargo freighters (Blue Dart Aviation, FedEx, DHL)",
      "Aviation logistics & supply chain companies",
      "Airport management authorities (AAI, Adani Airports, GMR)",
    ],
    image: null,
  },
  {
    id: "course-aviation-ticketing-gds",
    title: "Airline Ticketing & GDS",
    track: "AVIATION",
    slug: "airline-ticketing-gds",
    duration: "3 Months",
    description:
      "Practical mastery of global distribution systems (Amadeus & Galileo), fare calculations, PNR creation, and flight reservations across global airlines.",
    skills: [
      "Amadeus GDS Software Practical Training",
      "Galileo Reservation System",
      "Fare Construction & Mileage Rules",
      "PNR Creation & Modification",
      "E-Ticketing, Reissuance & Refunds",
      "Visa, Passport & TIMATIC Regulations",
    ],
    jobRoles: [
      "Airline Ticketing Officer",
      "GDS Reservation Specialist",
      "Travel Consultant / Corporate Travel Executive",
      "Airline Sales & Booking Coordinator",
      "Airport Customer Helpdesk Agent",
    ],
    workplaces: [
      "International & domestic airline booking desks",
      "Global travel management companies (MakeMyTrip, Thomas Cook)",
      "Corporate business travel agencies",
      "Airport customer support centres",
    ],
    image: null,
  },
];

export function parseLines(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

export function toPublicCourse(course: Course): CoursePublicDTO {
  return {
    id: course.id,
    title: course.title,
    track: course.track as Track,
    slug: course.slug,
    duration: course.duration,
    description: course.description,
    skills: parseLines(course.skills),
    jobRoles: parseLines(course.jobRoles),
    workplaces: parseLines(course.workplaces),
    image: course.image && course.image.length > 0 ? course.image : null,
  };
}

/**
 * Published courses for the public site, ordered by sortOrder then title.
 * When admin adds/edits a course these pages pick it up on the next request
 * (pages using this helper are force-dynamic).
 */
export async function getPublishedCourses(track?: Track): Promise<CoursePublicDTO[]> {
  try {
    const courses = await db.course.findMany({
      where: { isActive: true, ...(track ? { track } : {}) },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    const mapped = courses.map(toPublicCourse);

    if (!track || track === "AVIATION") {
      const existingSlugs = new Set(mapped.map((c) => c.slug));
      const missingAviation = DEFAULT_AVIATION_COURSES.filter(
        (c) => !existingSlugs.has(c.slug)
      );
      if (track === "AVIATION" && mapped.length === 0) {
        return DEFAULT_AVIATION_COURSES;
      }
      return [...mapped, ...missingAviation];
    }

    return mapped;
  } catch (e) {
    console.error("[courses:getPublishedCourses]", e);
    if (track === "AVIATION") {
      return DEFAULT_AVIATION_COURSES;
    }
    return [];
  }
}

/**
 * Fetch a single published course by its unique slug.
 * Returns null if not found or inactive.
 */
export async function getCourseBySlug(slug: string): Promise<CoursePublicDTO | null> {
  try {
    const course = await db.course.findUnique({
      where: { slug },
    });
    if (!course || !course.isActive) {
      const fallback = DEFAULT_AVIATION_COURSES.find((c) => c.slug === slug);
      if (fallback) return fallback;
      return null;
    }
    return toPublicCourse(course);
  } catch (e) {
    console.error(`[courses:getCourseBySlug] Error fetching slug "${slug}":`, e);
    const fallback = DEFAULT_AVIATION_COURSES.find((c) => c.slug === slug);
    if (fallback) return fallback;
    return null;
  }
}

/** Image for a course card: course.image if set, else the department hero. */
export function courseImage(course: Pick<CoursePublicDTO, "image" | "track">): string {
  return course.image ?? DEPARTMENTS[course.track].heroImage;
}
