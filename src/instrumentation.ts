/**
 * Next.js instrumentation hook — runs once per server process at boot.
 * Starts the daily follow-up reminder cron (Node runtime only; the Edge
 * bundle never imports node-cron).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startReminderCron } = await import("@/lib/reminder-cron");
  startReminderCron();
}
