"use client";

/**
 * MFA challenge view — two modes:
 *  - mustEnroll: forced TOTP setup (QR → first code → 10 recovery codes shown
 *    exactly once) required for SUPER_ADMIN before any session is issued.
 *  - verify: enter a 6-digit authenticator code or a single-use recovery code.
 * Runs between the password step and the dashboard; no session exists yet.
 */

import * as React from "react";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_CLASS } from "@/components/admin/admin-ui";

interface MfaViewProps {
  mustEnroll: boolean;
  onAuthenticated: (user: SessionUser) => void;
  onExpired: () => void;
}

function MfaShell({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream p-4">
      <div
        className="dot-grid pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
      />
      <main className="relative w-full max-w-[460px]">
        <div className="brutal-card w-[min(460px,calc(100vw-2rem))] p-8">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-ink font-display text-xl text-white shadow-hard-sm"
              aria-hidden="true"
            >
              <ShieldCheck className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none">{title}</p>
              <p className="mt-1.5 font-grotesk text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Step {step} · Skyora Admin
              </p>
            </div>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function MfaView({ mustEnroll, onAuthenticated, onExpired }: MfaViewProps) {
  const [step, setStep] = React.useState<"setup" | "codes" | "verify">(
    mustEnroll ? "setup" : "verify"
  );
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [savedConfirmed, setSavedConfirmed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [setupLoading, setSetupLoading] = React.useState(mustEnroll);

  // Fetch the QR/secret when entering enrollment.
  React.useEffect(() => {
    if (step !== "setup") return;
    let cancelled = false;
    setSetupLoading(true);
    void api<{
      qrDataUrl: string;
      secret: string;
    }>("/api/auth/mfa/setup", { method: "POST" })
      .then((res) => {
        if (cancelled) return;
        setQrDataUrl(res.qrDataUrl);
        setSecret(res.secret);
      })
      .catch((err: Error & { status?: number; code?: string }) => {
        if (cancelled) return;
        if (err.code === "MFA_PENDING_EXPIRED" || err.status === 401) {
          toast.error(err.message || "Verification session expired.");
          onExpired();
          return;
        }
        if (err.code === "MFA_ALREADY_ENABLED") {
          // Enrollment already done in another tab — fall back to verify.
          setStep("verify");
          return;
        }
        toast.error(err.message || "Could not start setup. Please retry.");
      })
      .finally(() => {
        if (!cancelled) setSetupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, onExpired]);

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api<{
        recoveryCodes: string[];
        user: SessionUser;
      }>("/api/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      setRecoveryCodes(res.recoveryCodes);
      setStep("codes");
    } catch (err) {
      const e2 = err as Error & { status?: number; code?: string };
      if (e2.code === "MFA_PENDING_EXPIRED" || e2.status === 401) {
        toast.error(e2.message || "Verification session expired.");
        onExpired();
        return;
      }
      toast.error(e2.message || "Could not verify the code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api<{ user: SessionUser }>("/api/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      toast.success(`Welcome back, ${res.user.name}`);
      onAuthenticated(res.user);
    } catch (err) {
      const e2 = err as Error & { status?: number; code?: string };
      if (e2.code === "MFA_PENDING_EXPIRED" || e2.status === 401) {
        toast.error(e2.message || "Verification session expired.");
        onExpired();
        return;
      }
      toast.error(e2.message || "Could not verify the code.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyAllCodes() {
    void navigator.clipboard
      .writeText(recoveryCodes.join("\n"))
      .then(() => toast.success("Recovery codes copied"))
      .catch(() => toast.error("Copy failed — write the codes down manually."));
  }

  // ── Step 2: recovery codes (enrollment only) ────────────────────────────────
  if (step === "codes") {
    return (
      <MfaShell step="2 of 2" title="SAVE RECOVERY CODES">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Two-factor authentication is now <strong>enabled</strong>. If you
          lose your authenticator, one of these single-use codes is the only
          way back in. <strong className="text-ink">They will never be shown again.</strong>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border-2 border-ink bg-cream p-4">
          {recoveryCodes.map((c) => (
            <span
              key={c}
              className="rounded-md border border-ink/30 bg-white px-2 py-1.5 text-center font-mono text-sm font-bold tracking-wider"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={copyAllCodes}
            className="w-full justify-center border-2 border-ink font-grotesk font-bold uppercase shadow-hard-sm"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copy all codes
          </Button>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border-2 border-ink bg-white p-3">
            <input
              type="checkbox"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[#ff2e63]"
            />
            <span className="text-sm font-medium">
              I saved these codes somewhere safe (password manager / printed).
            </span>
          </label>
          <Button
            type="button"
            disabled={!savedConfirmed}
            onClick={() => {
              // Session was issued by /confirm — fetch the fresh user.
              void api<{ user: SessionUser }>("/api/auth/me")
                .then((res) => {
                  toast.success("Two-factor authentication is ready.");
                  onAuthenticated(res.user);
                })
                .catch(() => {
                  toast.error("Session missing — please sign in again.");
                  onExpired();
                });
            }}
            className="w-full justify-center bg-brand-pink font-grotesk font-bold uppercase text-white hover:bg-brand-pink/90"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </MfaShell>
    );
  }

  // ── Step 1: scan QR + enter first code (enrollment) ────────────────────────
  if (step === "setup") {
    return (
      <MfaShell step="1 of 2" title="SET UP 2FA">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Super admin accounts require two-factor authentication. Scan the QR
          code with Google Authenticator / Authy / 1Password, then enter the
          6-digit code to activate.
        </p>

        {setupLoading ? (
          <div className="mt-6 flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Generating your secure enrollment…
          </div>
        ) : qrDataUrl ? (
          <>
            <div className="mt-5 flex justify-center">
              <div className="rounded-xl border-2 border-ink bg-white p-3 shadow-hard-sm">
                {/* Data URL generated locally by our own API — safe to use. */}
                <img
                  src={qrDataUrl}
                  alt="TOTP enrollment QR code — scan with your authenticator app"
                  className="size-[220px]"
                />
              </div>
            </div>

            {secret ? (
              <div className="mt-3 rounded-lg border-2 border-dashed border-ink/40 bg-cream p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Can&apos;t scan? Enter this key manually
                </p>
                <p className="mt-1 break-all font-mono text-sm font-bold">
                  {secret}
                </p>
              </div>
            ) : null}

            <form onSubmit={handleConfirm} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="mfa-code"
                  className="font-grotesk text-xs font-bold uppercase"
                >
                  6-digit code
                </Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  disabled={submitting}
                  className={`${FIELD_CLASS} text-center font-mono text-lg tracking-[0.4em]`}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="w-full justify-center font-grotesk font-bold uppercase shadow-hard-sm"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                {submitting ? "Verifying…" : "Verify & Enable"}
              </Button>
            </form>
          </>
        ) : null}
      </MfaShell>
    );
  }

  // ── Verify (returning 2FA user) ─────────────────────────────────────────────
  return (
    <MfaShell step="2 of 2" title="TWO-FACTOR CHECK">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Enter the 6-digit code from your authenticator app — or one of your
        single-use recovery codes if you lost access.
      </p>
      <form onSubmit={handleVerify} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="mfa-verify-code"
            className="font-grotesk text-xs font-bold uppercase"
          >
            Authenticator or recovery code
          </Label>
          <div className="relative">
            <KeyRound
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="mfa-verify-code"
              autoComplete="one-time-code"
              placeholder="123456  or  A1B2C-D3E4F"
              maxLength={20}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              className={`${FIELD_CLASS} pl-9 font-mono tracking-wider`}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full justify-center font-grotesk font-bold uppercase shadow-hard-sm"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-4" aria-hidden="true" />
          )}
          {submitting ? "Verifying…" : "Verify"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        5 failed attempts lock the account for 15 minutes.
      </p>
    </MfaShell>
  );
}
