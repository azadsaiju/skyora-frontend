import "server-only";
import { db } from "@/lib/db";
import { endOfToday, startOfToday } from "@/lib/enquiry-filters";
import { sendMail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/types";

/**
 * Follow-up reminder digest (Prompt 9).
 *
 * buildReminderDigest() collects every open enquiry whose latest scheduled
 * next-action falls due today or is overdue (excluding ENROLLED / LOST),
 * grouped for the daily email. runReminderJob() emails all active admins
 * (SMTP optional — otherwise the digest is logged) and writes one
 * REMINDER_RUN audit entry.
 */

export interface ReminderItem {
  enquiryId: string;
  studentName: string;
  phone: string;
  status: string;
  course: string | null;
  note: string;
  nextActionDate: string;
  assignedTo: string | null;
  overdue: boolean;
}

export interface ReminderDigest {
  generatedAt: string;
  dueToday: ReminderItem[];
  overdue: ReminderItem[];
  total: number;
}

export async function buildReminderDigest(): Promise<ReminderDigest> {
  const startToday = startOfToday();
  const endToday = endOfToday();

  // Every follow-up scheduled for today-or-earlier on a still-open enquiry.
  const rows = await db.followUp.findMany({
    where: {
      nextActionDate: { lte: endToday },
      enquiry: { status: { notIn: ["ENROLLED", "LOST"] } },
    },
    include: {
      enquiry: {
        include: {
          course: { select: { title: true } },
          assignedTo: { select: { name: true } },
        },
      },
    },
    orderBy: { nextActionDate: "asc" },
  });

  const items: ReminderItem[] = rows.map((f) => ({
    enquiryId: f.enquiryId,
    studentName: f.enquiry.name,
    phone: f.enquiry.phone,
    status: f.enquiry.status,
    course: f.enquiry.course?.title ?? null,
    note: f.note,
    nextActionDate: (f.nextActionDate ?? f.createdAt).toISOString(),
    assignedTo: f.enquiry.assignedTo?.name ?? null,
    overdue: f.nextActionDate ? f.nextActionDate.getTime() < startToday.getTime() : false,
  }));

  return {
    generatedAt: new Date().toISOString(),
    dueToday: items.filter((i) => !i.overdue),
    overdue: items.filter((i) => i.overdue),
    total: items.length,
  };
}

/** Recipients: every active staff account, or the REMINDER_TO override list. */
async function reminderRecipients(): Promise<string[]> {
  const override = process.env.REMINDER_TO;
  if (override) {
    return override
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /.+@.+\..+/.test(e));
  }
  const users = await db.user.findMany({
    where: { isActive: true },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionHtml(title: string, items: ReminderItem[], accent: string): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <strong>${esc(i.studentName)}</strong><br/>
          <span style="color:#666;font-size:12px">${esc(i.course ?? "No course")}</span>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">
          ${esc(i.note)}<br/>
          <span style="color:#666;font-size:12px">${esc(i.assignedTo ?? "Unassigned")} · ${esc(
            new Date(i.nextActionDate).toISOString().slice(0, 10)
          )}</span>
        </td>
      </tr>`
    )
    .join("");
  return `<h3 style="margin:16px 0 8px;color:${accent}">${title} (${items.length})</h3>
    <table style="border-collapse:collapse;width:100%">${rows}</table>`;
}

function digestHtml(d: ReminderDigest): string {
  return `<div style="font-family:Arial,sans-serif;max-width:640px">
    <h2 style="margin:0 0 4px">Skyora — Follow-up Digest</h2>
    <p style="color:#666;margin:0 0 8px">${new Date(d.generatedAt).toUTCString()}</p>
    <p><strong>${d.dueToday.length}</strong> due today · <strong>${d.overdue.length}</strong> overdue</p>
    ${sectionHtml("OVERDUE", d.overdue, "#DC2626")}
    ${sectionHtml("DUE TODAY", d.dueToday, "#FF7A00")}
    ${
      d.total === 0
        ? '<p style="color:#16A34A">Nothing due — all follow-ups are on schedule. ✅</p>'
        : ""
    }
    <p style="color:#999;font-size:12px;margin-top:24px">
      Open the admin console → Enquiries for the full list. Digest scheduled daily at ${
        process.env.REMINDER_HOUR ?? "9"
      }:00 ${process.env.REMINDER_TZ ?? "Asia/Calcutta"}.
    </p>
  </div>`;
}

function digestText(d: ReminderDigest): string {
  const line = (i: ReminderItem) =>
    `- ${i.studentName} (${i.course ?? "No course"}) — ${i.note} — action ${i.nextActionDate.slice(0, 10)} — ${i.assignedTo ?? "Unassigned"}`;
  return [
    "Skyora — Follow-up Digest",
    `${d.dueToday.length} due today, ${d.overdue.length} overdue`,
    "",
    d.overdue.length ? "OVERDUE:" : "",
    ...d.overdue.map(line),
    "",
    d.dueToday.length ? "DUE TODAY:" : "",
    ...d.dueToday.map(line),
    d.total === 0 ? "Nothing due — all follow-ups are on schedule." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build the digest, deliver it (email when SMTP is configured, console
 * otherwise) and audit the run. Never throws — cron callers rely on that.
 */
export async function runReminderJob(
  trigger: "cron" | "manual",
  actor?: SessionUser
): Promise<{
  digest: ReminderDigest;
  mail: { sent: boolean; recipients: number; error?: string };
}> {
  const digest = await buildReminderDigest();

  let mail: { sent: boolean; recipients: number; error?: string } = {
    sent: false,
    recipients: 0,
  };

  if (digest.total > 0) {
    const to = await reminderRecipients();
    mail.recipients = to.length;
    if (to.length > 0) {
      const dateLabel = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: process.env.REMINDER_TZ ?? "Asia/Calcutta",
      });
      const result = await sendMail({
        to,
        subject: `Skyora follow-ups — ${digest.overdue.length} overdue, ${digest.dueToday.length} due today (${dateLabel})`,
        text: digestText(digest),
        html: digestHtml(digest),
      });
      mail = { ...result, recipients: to.length };
      if (!result.sent && result.error === "SMTP_NOT_CONFIGURED") {
        // Dev/sandbox fallback: the digest still lands in the server log.
        console.info(
          `[reminders] SMTP not configured — digest for ${digest.total} follow-up(s) follows:\n${digestText(digest)}`
        );
      }
    }
  } else if (trigger === "manual") {
    console.info("[reminders] manual run: nothing due today.");
  }

  await logAudit({
    userId: actor?.id ?? null,
    action: "REMINDER_RUN",
    entity: "followup",
    meta: {
      trigger,
      dueToday: digest.dueToday.length,
      overdue: digest.overdue.length,
      emailed: mail.sent,
      recipients: mail.recipients,
      mailError: mail.error ?? null,
    },
  });

  return { digest, mail };
}
