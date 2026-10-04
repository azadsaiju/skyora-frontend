"use client";

/**
 * Admin dashboard — key stats, 7-day enquiries bar chart and pipeline
 * status breakdown. Stat cards for follow-ups jump straight to the
 * enquiries view.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlarmClock,
  Bell,
  Briefcase,
  GraduationCap,
  Inbox,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { api } from "@/lib/client";
import {
  ENQUIRY_STATUSES,
  type DashboardDataDTO,
  type SessionUser,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminPageHeader,
  AdminStatCard,
  EmptyState,
  StatusBadge,
  TableSkeleton,
  toastApiError,
} from "@/components/admin/admin-ui";
import { RemindersCard } from "@/components/admin/reminders-card";

export function DashboardView({
  user,
  onOpenEnquiries,
  onOpenSecurity,
}: {
  user: SessionUser;
  onOpenEnquiries: () => void;
  onOpenSecurity: () => void;
}) {
  const [data, setData] = React.useState<DashboardDataDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await api<DashboardDataDTO>("/api/dashboard"));
    } catch (err) {
      setFailed(true);
      toastApiError(err, "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const max = data
    ? Math.max(1, ...data.enquiriesByDay.map((d) => d.count))
    : 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={`${format(new Date(), "EEEE, d MMMM yyyy")} · Signed in as ${user.email}`}
      >
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <RefreshCw
            className={cn("size-4", loading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </AdminPageHeader>

      {failed && !data ? (
        <div className="brutal-card flex flex-col items-center gap-4 p-10 text-center">
          <p className="font-display text-sm uppercase">
            Dashboard failed to load
          </p>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching your stats. Check your
            connection and try again.
          </p>
          <Button
            onClick={() => void load()}
            className="font-grotesk font-bold"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="brutal-card-sm flex items-center gap-3 p-4">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
          <TableSkeleton rows={4} />
        </div>
      ) : data ? (
        <>
          {!user.totpEnabled ? (
            <section
              aria-label="Two-factor authentication is off"
              className="brutal-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-brand-orange text-white shadow-hard-sm"
              >
                <ShieldAlert className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-grotesk text-sm font-bold uppercase tracking-wide">
                  Two-factor authentication is OFF
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optional — sign in currently needs only your password. Add an
                  authenticator-app code as a second lock from the Security
                  page; you can turn it off again anytime.
                </p>
              </div>
              <Button
                onClick={onOpenSecurity}
                className="shrink-0 justify-center bg-brand-pink font-grotesk font-bold uppercase text-white hover:bg-brand-pink/90"
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
                Manage 2FA
              </Button>
            </section>
          ) : null}
          <section
            aria-label="Key statistics"
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <AdminStatCard
              label="Today's Follow-ups"
              value={data.todayFollowUps}
              icon={Bell}
              color="#FF7A00"
              hint="Tap to open enquiries"
              onClick={onOpenEnquiries}
              ariaLabel="Today's follow-ups — open the enquiries view"
            />
            {data.overdueFollowUps > 0 ? (
              <AdminStatCard
                label="Overdue Follow-ups"
                value={data.overdueFollowUps}
                icon={AlarmClock}
                color="#FFFFFF"
                iconClassName="text-brand-pink"
                onClick={onOpenEnquiries}
                ariaLabel="Overdue follow-ups — open the enquiries view"
                className="bg-brand-pink! text-white"
              />
            ) : null}
            <AdminStatCard
              label="New Enquiries"
              value={data.newEnquiries}
              icon={Inbox}
              color="#2563EB"
              hint={`+${data.newEnquiriesToday} today`}
            />
            <AdminStatCard
              label="Enrolled"
              value={data.enrolledCount}
              icon={GraduationCap}
              color="#16A34A"
            />
            <AdminStatCard
              label="Total Enquiries"
              value={data.totalEnquiries}
              icon={Users}
              color="#0A0A0A"
            />
            <AdminStatCard
              label="Open Vacancies"
              value={data.openVacancies}
              icon={Briefcase}
              color="#00B8D9"
            />
            <AdminStatCard
              label="WhatsApp Clicks"
              value={data.whatsappClicks7d}
              icon={MessageCircle}
              color="#16A34A"
              hint="last 7 days"
            />
          </section>

          <section aria-label="Enquiries over the last 7 days" className="brutal-card p-6">
            <h2 className="font-grotesk text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Enquiries — Last 7 Days
            </h2>
            <div className="mt-6 flex h-44 gap-2 sm:gap-3">
              {data.enquiriesByDay.map((d, i) => {
                const pct = d.count > 0 ? Math.max((d.count / max) * 100, 8) : 0;
                return (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      {d.count > 0 ? (
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 font-grotesk text-xs font-bold">
                          {d.count}
                        </span>
                      ) : null}
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          delay: i * 0.06,
                          ease: "easeOut",
                        }}
                        className={cn(
                          "w-full max-w-10 min-h-[4px] rounded-t",
                          d.count > 0
                            ? "bg-ink transition-colors hover:bg-brand-pink"
                            : "bg-ink/15"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="font-grotesk text-[10px] font-bold uppercase text-muted-foreground">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Pipeline status breakdown" className="brutal-card p-6">
            <h2 className="font-grotesk text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pipeline Status
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {ENQUIRY_STATUSES.map((s) => (
                <StatusBadge key={s} status={s}>
                  {`${s} × ${data.statusBreakdown[s] ?? 0}`}
                </StatusBadge>
              ))}
            </div>
          </section>

          {data.whatsappClicks7d > 0 ? (
            <section
              aria-label="WhatsApp click sources"
              className="brutal-card p-6"
            >
              <h2 className="font-grotesk text-xs font-bold uppercase tracking-widest text-muted-foreground">
                WhatsApp Deep Links — Last 7 Days
              </h2>
              <ul className="mt-4 space-y-2">
                {data.whatsappTopContexts.map((c) => {
                  const pct = Math.max(
                    (c.count / Math.max(1, data.whatsappClicks7d)) * 100,
                    6
                  );
                  return (
                    <li key={c.context} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate font-grotesk text-xs font-bold uppercase">
                        {c.context.replace(/_/g, " ")}
                      </span>
                      <span
                        className="h-3 rounded-full border-2 border-ink bg-brand-green"
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                      <span className="font-grotesk text-sm font-bold tabular-nums">
                        {c.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <RemindersCard isSuperAdmin={user.role === "SUPER_ADMIN"} />
        </>
      ) : (
        <div className="brutal-card">
          <EmptyState
            icon={Inbox}
            title="Nothing to show"
            message="Dashboard data is unavailable right now."
          />
        </div>
      )}
    </div>
  );
}
