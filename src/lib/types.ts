/**
 * Shared TypeScript DTOs used by both API routes and client components.
 */

export type Role = "SUPER_ADMIN" | "ADMIN";
export type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOWUP"
  | "DEMO"
  | "ENROLLED"
  | "LOST";
export type Track = "AVIATION" | "IT";
export type AchievementType =
  | "HACKATHON"
  | "CERTIFICATION"
  | "PROJECT"
  | "PLACEMENT";
export type JobType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOWUP",
  "DEMO",
  "ENROLLED",
  "LOST",
];

export const STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW: "#2563EB",
  CONTACTED: "#00B8D9",
  FOLLOWUP: "#FF7A00",
  DEMO: "#A855F7",
  ENROLLED: "#16A34A",
  LOST: "#6B7280",
};

// ── AUTH ─────────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  totpEnabled: boolean;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

// ── PUBLIC CONTENT ───────────────────────────────────────────────────────────
export interface CourseDTO {
  id: string;
  title: string;
  track: Track;
  slug: string;
  duration: string;
  description: string;
  /** newline-separated syllabus highlight bullets */
  syllabus: string;
  isActive: boolean;
  createdAt: string;
}

export interface AchievementDTO {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  link: string | null;
  date: string;
  createdAt: string;
}

export interface VacancyDTO {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: JobType;
  description: string;
  applyLink: string;
  isOpen: boolean;
  createdAt: string;
}

export interface PublicContentDTO {
  courses: CourseDTO[];
  achievements: AchievementDTO[];
  vacancies: VacancyDTO[];
}

// ── ENQUIRIES ────────────────────────────────────────────────────────────────
export interface FollowUpDTO {
  id: string;
  enquiryId: string;
  note: string;
  nextActionDate: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export interface EnquiryListItemDTO {
  id: string;
  name: string;
  /** masked (ADMIN list view) or full (SUPER_ADMIN) */
  phone: string;
  email: string;
  status: EnquiryStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string; track: Track } | null;
  assignedTo: { id: string; name: string } | null;
  latestFollowUpNote: string | null;
  latestNextActionDate: string | null;
}

export interface EnquiryDetailDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string | null;
  status: EnquiryStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string; track: Track } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  followUps: FollowUpDTO[];
}

export interface EnquiryListResponseDTO {
  items: EnquiryListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ── CSV IMPORT (Prompt 8) ────────────────────────────────────────────────────
export interface EnquiryImportFailedRowDTO {
  /** 1-based CSV row number (2 = first data row, header is row 1) */
  row: number;
  name: string;
  reason: string;
}

export interface EnquiryImportResultDTO {
  total: number;
  imported: number;
  failed: EnquiryImportFailedRowDTO[];
}

// ── REMINDERS (Prompt 9) ─────────────────────────────────────────────────────
export interface ReminderItemDTO {
  enquiryId: string;
  studentName: string;
  phone: string;
  status: EnquiryStatus;
  course: string | null;
  note: string;
  nextActionDate: string;
  assignedTo: string | null;
  overdue: boolean;
}

export interface ReminderDigestDTO {
  generatedAt: string;
  dueToday: ReminderItemDTO[];
  overdue: ReminderItemDTO[];
  total: number;
}

export interface ReminderRunResultDTO {
  digest: ReminderDigestDTO;
  mail: { sent: boolean; recipients: number; error?: string };
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
export interface DashboardDataDTO {
  todayFollowUps: number;
  overdueFollowUps: number;
  newEnquiries: number;
  newEnquiriesToday: number;
  enrolledCount: number;
  totalEnquiries: number;
  openVacancies: number;
  statusBreakdown: Record<EnquiryStatus, number>;
  enquiriesByDay: { date: string; label: string; count: number }[];
  /** WhatsApp deep-link clicks in the last 7 days (Prompt 10) */
  whatsappClicks7d: number;
  whatsappTopContexts: { context: string; count: number }[];
}

// ── AUDIT ────────────────────────────────────────────────────────────────────
export interface AuditLogDTO {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  meta: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface AuditLogListResponseDTO {
  items: AuditLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}
