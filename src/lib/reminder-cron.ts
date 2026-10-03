import "server-only";
import cron from "node-cron";
import { runReminderJob } from "@/lib/reminders";

/**
 * Daily follow-up reminder cron (Prompt 9).
 * Schedule: REMINDER_HOUR:REMINDER_MINUTE in REMINDER_TZ (default 9:00
 * Asia/Calcutta). Guarded against duplicate scheduling across hot reloads
 * via a global flag. Failures are logged and never crash the server.
 */

const g = globalThis as unknown as { __skyoraReminderCron?: boolean };

export function startReminderCron(): void {
  if (g.__skyoraReminderCron) return;
  g.__skyoraReminderCron = true;

  const hourRaw = Number(process.env.REMINDER_HOUR ?? 9);
  const minuteRaw = Number(process.env.REMINDER_MINUTE ?? 0);
  const tz = process.env.REMINDER_TZ ?? "Asia/Calcutta";

  const hour = Number.isInteger(hourRaw) && hourRaw >= 0 && hourRaw <= 23 ? hourRaw : 9;
  const minute =
    Number.isInteger(minuteRaw) && minuteRaw >= 0 && minuteRaw <= 59 ? minuteRaw : 0;
  const expr = `${minute} ${hour} * * *`;

  cron.schedule(
    expr,
    () => {
      void runReminderJob("cron").catch((err) =>
        console.error("[reminders] cron run failed:", err)
      );
    },
    { timezone: tz }
  );

  console.log(`[reminders] daily digest cron scheduled: "${expr}" (${tz})`);
}
