"use client";

/**
 * Shared building blocks for the Skyora admin portal (neobrutalist style).
 * Every admin view composes these so paddings, borders and badges stay
 * consistent across the portal.
 */

import * as React from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, parseISO, startOfToday } from "date-fns";

import { cn } from "@/lib/utils";
import { STATUS_COLORS, type EnquiryStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── SESSION-AWARE ERROR HANDLING ─────────────────────────────────────────────

/** Fired when any API call returns 401 — AdminApp switches to the login view. */
export const SESSION_EXPIRED_EVENT = "skyora:admin-session-expired";
/** Fired when an API call returns code PASSWORD_CHANGE_REQUIRED. */
export const PASSWORD_CHANGE_REQUIRED_EVENT =
  "skyora:admin-password-change-required";

export function notifySessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

export function notifyPasswordChangeRequired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PASSWORD_CHANGE_REQUIRED_EVENT));
  }
}

type ApiErrorShape = Error & { status?: number; code?: string };

/**
 * Standard way to surface an API error in the admin portal:
 * - 401           → notify root app to show the login view (it toasts once)
 * - PASSWORD_CHANGE_REQUIRED → notify root app to show change-password view
 * - anything else → toast the server's message (or a friendly fallback)
 */
export function toastApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): void {
  const e = (err ?? null) as ApiErrorShape | null;
  if (e && e.status === 401) {
    notifySessionExpired();
    return;
  }
  if (e && e.code === "PASSWORD_CHANGE_REQUIRED") {
    notifyPasswordChangeRequired();
    return;
  }
  toast.error(e?.message || fallback);
}

/** Shared password rule: ≥ 8 chars, at least one letter and one number. */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw)) return "Must contain at least one letter.";
  if (!/[0-9]/.test(pw)) return "Must contain at least one number.";
  return null;
}

// ── SHARED FIELD STYLING ─────────────────────────────────────────────────────

export const FIELD_CLASS = "border-2 border-ink bg-white font-grotesk";
export const SELECT_TRIGGER_CLASS =
  "w-full border-2 border-ink bg-white font-grotesk";

// ── DATE HELPERS ─────────────────────────────────────────────────────────────

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yy");
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM, HH:mm");
}

export function isDateOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return false;
  return isBefore(d, startOfToday());
}

// ── PAGE HEADER ──────────────────────────────────────────────────────────────

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl uppercase leading-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

// ── STAT CARD ────────────────────────────────────────────────────────────────

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  color,
  hint,
  onClick,
  ariaLabel,
  className,
  iconClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  /** hex color for the icon square */
  color: string;
  hint?: string;
  /** when provided the whole card becomes a button */
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white",
          iconClassName
        )}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-3xl leading-none">{value}</div>
        <div className="mt-1.5 text-xs font-bold uppercase tracking-wide">
          {label}
        </div>
        {hint ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={cn(
          "brutal-card-sm brutal-hover flex w-full cursor-pointer items-center gap-3 p-4 text-left",
          className
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={cn("brutal-card-sm flex items-center gap-3 p-4", className)}
    >
      {inner}
    </div>
  );
}

// ── STATUS BADGE ─────────────────────────────────────────────────────────────

export function StatusBadge({
  status,
  children,
}: {
  status: EnquiryStatus;
  /** optional override label, e.g. "NEW × 4" */
  children?: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border-2 border-ink px-2.5 py-0.5 font-grotesk text-[11px] font-bold uppercase text-white"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {children ?? status}
    </span>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl border-2 border-ink bg-cream shadow-hard-sm">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-sm uppercase">{title}</h3>
      {message ? (
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

// ── TABLE SKELETON ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="space-y-3 rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm"
      role="status"
      aria-label="Loading data"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
          <Skeleton className="hidden h-4 w-16 lg:block" />
        </div>
      ))}
    </div>
  );
}

// ── CONFIRM DELETE DIALOG ────────────────────────────────────────────────────

export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
  loading,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  /** external pending flag (defaults to internal busy state) */
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const pending = loading ?? busy;

  function handleConfirm() {
    void (async () => {
      setBusy(true);
      try {
        await onConfirm();
        setOpen(false);
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!pending) setOpen(o);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-xl border-2 border-ink bg-white shadow-hard">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="font-grotesk">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              // keep the dialog open while the async confirm runs
              e.preventDefault();
              handleConfirm();
            }}
            className="border-2 border-ink bg-destructive font-grotesk font-bold uppercase text-white shadow-hard-sm hover:bg-destructive/90"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
