import "server-only";
import type { Prisma } from "@prisma/client";

/**
 * Shared filter builder for the enquiries list + Excel export endpoints,
 * so both always apply identical filters.
 */
export function buildEnquiryWhere(
  params: {
    search?: string;
    courseId?: string;
    status?: string;
    assignedToId?: string;
    from?: string;
    to?: string;
    followup?: string;
  }
): Prisma.EnquiryWhereInput {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86_400_000);

  const where: Prisma.EnquiryWhereInput = {};

  if (params.courseId) where.courseId = params.courseId;
  if (params.status) where.status = params.status;
  if (params.assignedToId === "unassigned") where.assignedToId = null;
  else if (params.assignedToId) where.assignedToId = params.assignedToId;

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) {
      const d = new Date(`${params.from}T00:00:00`);
      if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (params.to) {
      const d = new Date(`${params.to}T23:59:59.999`);
      if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
    }
  }

  if (params.followup === "today") {
    where.followUps = {
      some: { nextActionDate: { gte: startToday, lt: endToday } },
    };
  } else if (params.followup === "overdue") {
    where.followUps = { some: { nextActionDate: { lt: startToday } } };
  }

  if (params.search) {
    // SQLite `contains` is case-sensitive — search a few case variants.
    const s = params.search;
    const variants = Array.from(new Set([s, s.toLowerCase(), s.toUpperCase()]));
    where.OR = ["name", "email", "phone"].flatMap((field) =>
      variants.map((v) => ({ [field]: { contains: v } }))
    );
  }

  return where;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfToday(): Date {
  return new Date(startOfToday().getTime() + 86_400_000);
}
