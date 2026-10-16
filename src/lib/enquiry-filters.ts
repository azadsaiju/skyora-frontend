import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Shared filter builder for the enquiries list + Excel export endpoints,
 * so both always apply identical filters.
 */
export async function buildEnquiryWhere(
  params: {
    search?: string;
    courseId?: string;
    status?: string;
    assignedToId?: string;
    from?: string;
    to?: string;
    followup?: string;
  }
): Promise<Prisma.EnquiryWhereInput> {
  const startToday = startOfToday();
  const endToday = endOfToday();
  const todayStr = new Date().toISOString().slice(0, 10);

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

  if (params.followup === "today" || params.followup === "overdue") {
    // Overdue/Today follow-ups only pertain to open enquiries (not ENROLLED or LOST)
    // and are determined strictly by each enquiry's LATEST follow-up.
    const openEnquiries = await db.enquiry.findMany({
      where: {
        ...(params.status
          ? { status: params.status }
          : { status: { notIn: ["ENROLLED", "LOST"] } }),
      },
      select: {
        id: true,
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { nextActionDate: true },
        },
      },
    });

    const matchingIds = openEnquiries
      .filter((e) => {
        const d = e.followUps[0]?.nextActionDate;
        if (!d) return false;
        const dStr = d.toISOString().slice(0, 10);
        if (params.followup === "today") {
          return (d >= startToday && d < endToday) || dStr === todayStr;
        }
        if (params.followup === "overdue") {
          return d < startToday && dStr < todayStr;
        }
        return false;
      })
      .map((e) => e.id);

    where.id = { in: matchingIds };
  }

  if (params.search) {
    const s = params.search;
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { phone: { contains: s } },
    ];
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
