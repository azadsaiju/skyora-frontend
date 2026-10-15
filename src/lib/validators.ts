import { z } from "zod";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ── ENUM VALUE LISTS (SQLite-safe enums, enforced here) ─────────────────────
export const ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOWUP",
  "DEMO",
  "ENROLLED",
  "LOST",
] as const;
export const TRACKS = ["AVIATION", "IT"] as const;
export const ACHIEVEMENT_TYPES = [
  "HACKATHON",
  "CERTIFICATION",
  "PROJECT",
  "PLACEMENT",
] as const;
export const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "CONTRACT",
] as const;

// ── API ERROR ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(
  status: number,
  message: string,
  code?: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

/** Convert any thrown error into a safe JSON response (never leaks internals). */
export function handleApiError(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return jsonError(e.status, e.message, e.code);
  }
  if (e instanceof ZodError) {
    const first = e.issues[0];
    const msg = first
      ? `${first.path.join(".") || "input"}: ${first.message}`
      : "Validation failed";
    return jsonError(400, msg, "VALIDATION_ERROR", {
      issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  console.error("[api] unhandled error:", e);
  return jsonError(500, "Internal server error");
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// ── PUBLIC ENQUIRY (honeypot field: website) ─────────────────────────────────
export const enquiryCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9][0-9\s\-()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  courseId: z.string().trim().min(1, "Select a course").max(64),
  message: z.string().trim().max(1000).optional().default(""),
  source: z.string().trim().min(1).max(60).optional().default("website"),
  /** honeypot — must stay empty; filled values are silently discarded */
  website: z.string().max(200).optional().default(""),
  /** Cloudflare Turnstile token (verified server-side when configured) */
  turnstileToken: z.string().max(2048).optional().default(""),
});

// ── ENQUIRY ADMIN ────────────────────────────────────────────────────────────
export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  assignedToId: z.string().max(64).nullable().optional(),
});

export const followUpCreateSchema = z.object({
  note: z.string().trim().min(2, "Note is too short").max(1000),
  nextActionDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Use date format YYYY-MM-DD"
    )
    .nullable()
    .optional(),
});

export const followUpUpdateSchema = z.object({
  followUpId: z.string().min(1, "Follow-up ID is required"),
  note: z.string().trim().min(2, "Note is too short").max(1000).optional(),
  nextActionDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Use date format YYYY-MM-DD"
    )
    .nullable()
    .optional(),
});

export const enquiryQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  courseId: z.string().trim().max(64).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  assignedToId: z.string().trim().max(64).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followup: z.enum(["today", "overdue"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

// ── COURSES ──────────────────────────────────────────────────────────────────
export const courseCreateSchema = z.object({
  title: z.string().trim().min(2).max(100),
  track: z.enum(TRACKS),
  duration: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(2000),
  /** newline-separated "skills you will learn" bullets */
  skills: z.string().trim().min(1, "Add at least one skill").max(2000),
  /** newline-separated career opportunities / job roles */
  jobRoles: z.string().trim().max(2000).optional().default(""),
  /** newline-separated "where you can work" entries */
  workplaces: z.string().trim().max(2000).optional().default(""),
  /** /public image path; empty → auto-assign department image */
  image: z
    .union([
      z
        .string()
        .trim()
        .startsWith("/", "Image path must start with /")
        .max(400),
      z.literal(""),
    ])
    .nullable()
    .optional()
    .default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export const courseUpdateSchema = courseCreateSchema.partial();

// ── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
export const achievementCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1000),
  type: z.enum(ACHIEVEMENT_TYPES),
  link: z
    .union([z.string().trim().url("Enter a valid URL").max(400), z.literal("")])
    .optional()
    .default(""),
  /** date string YYYY-MM-DD (admin date input) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use date format YYYY-MM-DD"),
});
export const achievementUpdateSchema = achievementCreateSchema.partial();

// ── VACANCIES ────────────────────────────────────────────────────────────────
export const vacancyCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(100),
  jobType: z.enum(JOB_TYPES),
  description: z.string().trim().min(5).max(2000),
  applyLink: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(400)
    .refine((v) => /^https?:\/\//i.test(v), "URL must start with http(s)://"),
  isOpen: z.boolean().optional().default(true),
});
export const vacancyUpdateSchema = vacancyCreateSchema.partial();

// ── USERS (SUPER_ADMIN) ──────────────────────────────────────────────────────
export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  role: z.enum(ROLES),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
  /** password reset — forces change on next login */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number")
    .optional(),
});

// ── MFA (TOTP 2FA) ──────────────────────────────────────────────────────────
/** 6-digit TOTP code or a recovery code like AB3D9-K2M7X. */
export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter your 6-digit code")
    .max(20, "Code is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Codes contain letters and digits only"),
});

export const mfaDisableSchema = z.object({
  password: z.string().min(1, "Password is required").max(128),
});

// ── ENQUIRY CSV IMPORT (Prompt 8) ────────────────────────────────────────────
export const enquiryImportSchema = z.object({
  /** Raw CSV text (≤ 500 KB) with header row: name,phone,email,course,message */
  csv: z
    .string()
    .min(1, "CSV content is empty")
    .max(500_000, "CSV file is too large (max 500 KB)"),
  /** Original file name — audit metadata only */
  fileName: z.string().trim().max(120).optional().default("pasted.csv"),
});

// ── WHATSAPP DEEP-LINK TRACKING (Prompt 10) ──────────────────────────────────
export const whatsappTrackSchema = z.object({
  /** Where the click happened, e.g. "floating", "navbar", "admin_lead" */
  context: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9:_-]{1,40}$/,
      "Context must be 1-40 chars (letters, digits, : _ -)"
    ),
  /** Optional enquiry id when a counsellor opens a lead on WhatsApp */
  enquiryId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]{8,64}$/, "Invalid enquiry id")
    .optional(),
});

// ── AUDIT LOG QUERY ──────────────────────────────────────────────────────────
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  action: z.string().trim().max(40).optional(),
  entity: z.string().trim().max(40).optional(),
});
