"use client";

/**
 * Follow-up reminders card (Prompt 9, dashboard). SUPER_ADMIN only:
 * previews the digest (due today + overdue) and can trigger the digest
 * email immediately ("Send now") — SMTP optional, result surfaced honestly.
 */

import * as React from "react";
import { AlarmClock, Bell, Loader2, Send } from "lucide-react";
import { format, parseISO } from "date-fns";

import { api } from "@/lib/client";
import type { ReminderDigestDTO, ReminderRunResultDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toastApiError } from "@/components/admin/admin-ui";

export function RemindersCard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [digest, setDigest] = React.useState<ReminderDigestDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setDigest(await api<ReminderDigestDTO>("/api/reminders"));
    } catch {
      setDigest(null); // card silently degrades — dashboard stays usable
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isSuperAdmin) void load();
    else setLoading(false);
  }, [isSuperAdmin, load]);

  async function sendNow() {
    setSending(true);
    try {
      const res = await api<ReminderRunResultDTO>("/api/reminders", {
        method: "POST",
      });
      if (res.mail.sent) {
        toast.success(
          `Digest emailed to ${res.mail.recipients} recipient${
            res.mail.recipients === 1 ? "" : "s"
          }.`
        );
      } else if (res.mail.error === "SMTP_NOT_CONFIGURED") {
        toast.info(
          "SMTP is not configured — the digest was logged to the server console instead."
        );
      } else if (res.digest.total === 0) {
        toast.info("Nothing due — all follow-ups are on schedule.");
      } else {
        toastApiError(new Error("Email could not be sent (SMTP error)."));
      }
      setDigest(res.digest);
    } catch (err) {
      toastApiError(err, "Could not run the reminder digest.");
    } finally {
      setSending(false);
    }
  }

  if (!isSuperAdmin) return null;

  const items = digest ? [...digest.overdue, ...digest.dueToday] : [];

  return (
    <section aria-label="Follow-up reminders" className="brutal-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-grotesk text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Follow-up Reminders
          </h2>
          {digest ? (
            <p className="mt-1 font-grotesk text-sm font-bold">
              <span className="text-brand-orange">{digest.dueToday.length}</span>{" "}
              due today ·{" "}
              <span className={cn(digest.overdue.length > 0 && "text-brand-red")}>
                {digest.overdue.length}
              </span>{" "}
              overdue
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh reminders"
            className="border-2 border-ink bg-white font-grotesk font-bold"
          >
            <RefreshSpinner loading={loading} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => void sendNow()}
            disabled={sending}
            aria-label="Send reminder digest now"
            className="font-grotesk font-bold"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            Send now
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        A digest email goes to all staff every morning (default 09:00 IST).
        Without SMTP configured, the digest is logged to the server console.
      </p>

      <div className="nice-scrollbar mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : items.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-ink/30 bg-white p-4 text-sm text-muted-foreground">
            Nothing due — all follow-ups are on schedule. 🎉
          </p>
        ) : (
          items.map((i) => (
            <div
              key={`${i.enquiryId}-${i.nextActionDate}`}
              className="flex items-start justify-between gap-3 rounded-xl border-2 border-ink bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-grotesk text-sm font-bold">
                  {i.studentName}
                  <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                    {i.course ?? "No course"}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{i.note}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                  {i.assignedTo ?? "Unassigned"}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white",
                  i.overdue ? "bg-brand-red" : "bg-brand-orange"
                )}
              >
                {i.overdue ? (
                  <AlarmClock className="size-3" aria-hidden="true" />
                ) : (
                  <Bell className="size-3" aria-hidden="true" />
                )}
                {i.overdue ? "Overdue" : "Today"} ·{" "}
                {format(parseISO(i.nextActionDate), "d MMM")}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RefreshSpinner({ loading }: { loading: boolean }) {
  return loading ? (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  ) : null;
}
