import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfToday, endOfToday } from "@/lib/enquiry-filters";
import type { DashboardDataDTO, EnquiryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/dashboard — headline stats + chart data for the admin home. */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const startToday = startOfToday();
    const endToday = endOfToday();

    const [
      openEnquiriesWithFollowUps,
      newEnquiries,
      newEnquiriesToday,
      enrolledCount,
      totalEnquiries,
      openVacancies,
      statusGroups,
      recentEnquiries,
      whatsappRows,
    ] = await Promise.all([
      db.enquiry.findMany({
        where: { status: { notIn: ["ENROLLED", "LOST"] } },
        select: {
          id: true,
          followUps: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { nextActionDate: true },
          },
        },
      }),
      db.enquiry.count({ where: { status: "NEW" } }),
      db.enquiry.count({ where: { status: "NEW", createdAt: { gte: startToday } } }),
      db.enquiry.count({ where: { status: "ENROLLED" } }),
      db.enquiry.count(),
      db.vacancy.count({ where: { isOpen: true } }),
      db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      // last 7 days of enquiries for the bar chart
      db.enquiry.findMany({
        where: { createdAt: { gte: new Date(startToday.getTime() - 6 * 86_400_000) } },
        select: { createdAt: true },
      }),
      // WhatsApp deep-link clicks, last 7 days (Prompt 10)
      db.auditLog.findMany({
        where: {
          action: "WHATSAPP_CLICKED",
          createdAt: { gte: new Date(startToday.getTime() - 6 * 86_400_000) },
        },
        select: { meta: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    let todayFollowUps = 0;
    let overdueFollowUps = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const e of openEnquiriesWithFollowUps) {
      const d = e.followUps[0]?.nextActionDate;
      if (!d) continue;
      const dStr = d.toISOString().slice(0, 10);
      if ((d >= startToday && d < endToday) || dStr === todayStr) {
        todayFollowUps++;
      } else if (d < startToday && dStr < todayStr) {
        overdueFollowUps++;
      }
    }

    const statusBreakdown: Record<EnquiryStatus, number> = {
      NEW: 0,
      CONTACTED: 0,
      FOLLOWUP: 0,
      DEMO: 0,
      ENROLLED: 0,
      LOST: 0,
    };
    for (const group of statusGroups) {
      if (group.status in statusBreakdown) {
        statusBreakdown[group.status as EnquiryStatus] = group._count._all;
      }
    }

    // bucket last 7 days
    const enquiriesByDay: DashboardDataDTO["enquiriesByDay"] = [];
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(startToday.getTime() - i * 86_400_000);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const count = recentEnquiries.filter(
        (e) =>
          e.createdAt.getTime() >= dayStart.getTime() &&
          e.createdAt.getTime() < dayEnd.getTime()
      ).length;
      enquiriesByDay.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayLabels[dayStart.getDay()]!,
        count,
      });
    }

    // Tally WhatsApp click contexts from the audit meta JSON.
    const contextCounts = new Map<string, number>();
    for (const row of whatsappRows) {
      let context = "unknown";
      try {
        const parsed = JSON.parse(row.meta ?? "{}") as { context?: string };
        if (typeof parsed.context === "string" && parsed.context) {
          context = parsed.context;
        }
      } catch {
        // malformed meta → count as unknown
      }
      contextCounts.set(context, (contextCounts.get(context) ?? 0) + 1);
    }
    const whatsappTopContexts = [...contextCounts.entries()]
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const data: DashboardDataDTO = {
      todayFollowUps,
      overdueFollowUps,
      newEnquiries,
      newEnquiriesToday,
      enrolledCount,
      totalEnquiries,
      openVacancies,
      statusBreakdown,
      enquiriesByDay,
      whatsappClicks7d: whatsappRows.length,
      whatsappTopContexts,
    };

    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}
