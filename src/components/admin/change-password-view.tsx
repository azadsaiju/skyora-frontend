"use client";

/**
 * Forced password change — shown for seeded/reset accounts
 * (mustChangePassword === true). Client-validates the new password
 * (≥ 8 chars, letter + number, confirm match) with inline errors.
 */

import * as React from "react";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FIELD_CLASS,
  toastApiError,
  validatePassword,
} from "@/components/admin/admin-ui";

type ShowMap = { current: boolean; next: boolean; confirm: boolean };

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  disabled,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="font-grotesk text-xs font-bold uppercase"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${FIELD_CLASS} pr-10 ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordView({
  user,
  onDone,
}: {
  user: SessionUser;
  onDone: (user: SessionUser) => void;
}) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState<ShowMap>({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const pwProblem = validatePassword(next);
    if (pwProblem) {
      setError(`New password: ${pwProblem}`);
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await api<{ user: SessionUser }>(
        "/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        }
      );
      toast.success("Password updated — welcome!");
      onDone(res.user);
    } catch (err) {
      // 400 wrong current password → server message; 401 → session expired.
      toastApiError(err, "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream p-4">
      <div
        className="dot-grid pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
      />

      <main className="relative w-full max-w-[460px]">
        <div className="brutal-card w-[min(460px,calc(100vw-2rem))] p-8">
          <div className="flex items-start gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-brand-orange text-white shadow-hard-sm"
              aria-hidden="true"
            >
              <ShieldAlert className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl uppercase leading-tight">
                Set a New Password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Hi {firstName} — your account is seeded or was recently reset.
                You must set a new password before you can continue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordField
              id="cp-current"
              label="Current password"
              value={current}
              onChange={setCurrent}
              show={show.current}
              onToggle={() =>
                setShow((s) => ({ ...s, current: !s.current }))
              }
              autoComplete="current-password"
              disabled={submitting}
            />
            <div>
              <PasswordField
                id="cp-new"
                label="New password"
                value={next}
                onChange={setNext}
                show={show.next}
                onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
                autoComplete="new-password"
                disabled={submitting}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Min 8 characters with at least one letter and one number.
              </p>
            </div>
            <PasswordField
              id="cp-confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              show={show.confirm}
              onToggle={() =>
                setShow((s) => ({ ...s, confirm: !s.confirm }))
              }
              autoComplete="new-password"
              disabled={submitting}
            />

            <div aria-live="polite">
              {error ? (
                <p role="alert" className="text-xs font-bold text-brand-red">
                  {error}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-grotesk font-bold uppercase shadow-hard-sm"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {submitting ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
