import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/validators";
import { requireSuperAdmin } from "@/lib/auth";
import { buildReminderDigest, runReminderJob } from "@/lib/reminders";

export const dynamic = "force-dynamic";

/**
 * GET /api/reminders — SUPER_ADMIN only.
 * Returns the current follow-up digest (due today + overdue) WITHOUT
 * sending anything. Useful for the dashboard preview.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const digest = await buildReminderDigest();
    return NextResponse.json(digest);
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * POST /api/reminders — SUPER_ADMIN only ("Send digest now").
 * Builds the digest and delivers it immediately (email when SMTP is
 * configured, server console otherwise). Audited as REMINDER_RUN/manual.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin(req);
    const result = await runReminderJob("manual", user);
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
