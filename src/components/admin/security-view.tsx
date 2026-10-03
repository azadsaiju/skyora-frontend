"use client";

/**
 * Security view — per-account two-factor authentication management.
 * - SUPER_ADMIN: 2FA is mandatory (enrollment is forced at login); view-only
 *   status here, disable is blocked server-side.
 * - ADMIN: optional opt-in via the same QR → code → recovery-codes flow,
 *   and opt-out with password confirmation.
 */

import * as React from "react";
import {
  Check,
  Copy,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminPageHeader,
  FIELD_CLASS,
  toastApiError,
} from "@/components/admin/admin-ui";

interface SecurityViewProps {
  user: SessionUser;
  onUserUpdate: (user: SessionUser) => void;
}

type EnrollmentStep = "qr" | "codes";

export function SecurityView({ user, onUserUpdate }: SecurityViewProps) {
  const isSuper = user.role === "SUPER_ADMIN";

  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [enrollStep, setEnrollStep] = React.useState<EnrollmentStep>("qr");
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [savedConfirmed, setSavedConfirmed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const [disableOpen, setDisableOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");

  function resetEnrollment() {
    setEnrollOpen(false);
    setEnrollStep("qr");
    setQrDataUrl(null);
    setSecret(null);
    setCode("");
    setRecoveryCodes([]);
    setSavedConfirmed(false);
  }

  async function startEnrollment() {
    setEnrollOpen(true);
    setBusy(true);
    try {
      const res = await api<{ qrDataUrl: string; secret: string }>(
        "/api/auth/mfa/setup",
        { method: "POST" }
      );
      setQrDataUrl(res.qrDataUrl);
      setSecret(res.secret);
    } catch (err) {
      toastApiError(err);
      resetEnrollment();
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrollment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api<{
        recoveryCodes: string[];
        user: SessionUser;
      }>("/api/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      setRecoveryCodes(res.recoveryCodes);
      onUserUpdate(res.user);
      setEnrollStep("codes");
      toast.success("Two-factor authentication enabled");
    } catch (err) {
      toastApiError(err);
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api<{ user: SessionUser }>("/api/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      onUserUpdate(res.user);
      setDisableOpen(false);
      setPassword("");
      toast.success("Two-factor authentication disabled");
    } catch (err) {
      toastApiError(err);
    } finally {
      setBusy(false);
    }
  }

  function copyAllCodes() {
    void navigator.clipboard
      .writeText(recoveryCodes.join("\n"))
      .then(() => toast.success("Recovery codes copied"))
      .catch(() => toast.error("Copy failed — write the codes down manually."));
  }

  return (
    <div>
      <AdminPageHeader
        title="SECURITY"
        description="Protect your account with two-factor authentication."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 2FA status card ─────────────────────────────────────────────── */}
        <section
          aria-label="Two-factor authentication status"
          className="brutal-card p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white shadow-hard-sm ${
                  user.totpEnabled ? "bg-brand-green" : "bg-brand-orange"
                }`}
              >
                {user.totpEnabled ? (
                  <ShieldCheck className="size-5" />
                ) : (
                  <ShieldAlert className="size-5" />
                )}
              </span>
              <div>
                <h2 className="font-display text-xl uppercase">
                  Two-Factor Authentication
                </h2>
                <p className="mt-1 flex items-center gap-2 font-grotesk text-sm">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${
                      user.totpEnabled ? "bg-brand-green" : "bg-brand-orange"
                    }`}
                  />
                  {user.totpEnabled ? "Enabled on this account" : "Not enabled"}
                </p>
              </div>
            </div>
            <span className="rounded-md border-2 border-ink bg-cream px-2 py-1 font-grotesk text-[10px] font-bold uppercase tracking-widest">
              {isSuper ? "Required" : "Recommended"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {isSuper
              ? "Two-factor authentication is mandatory for super admin accounts. If you are seeing this page without 2FA, complete enrollment at your next sign-in — the portal will not open without it."
              : user.totpEnabled
                ? "Codes from your authenticator app (or a recovery code) are requested after every password sign-in. Keep your 10 recovery codes safe — each works once."
                : "Add a second lock to your account: after entering your password you'll be asked for a 6-digit code from an authenticator app. ADMIN accounts can opt in or out anytime here."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {!user.totpEnabled ? (
              <Button
                onClick={() => void startEnrollment()}
                disabled={busy}
                className="justify-center bg-brand-pink font-grotesk font-bold uppercase text-white hover:bg-brand-pink/90"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Enable 2FA
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={busy || isSuper}
                title={
                  isSuper
                    ? "2FA cannot be disabled on super admin accounts"
                    : undefined
                }
                onClick={() => setDisableOpen(true)}
                className="justify-center border-2 border-ink font-grotesk font-bold uppercase"
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
                Disable 2FA
              </Button>
            )}
          </div>
        </section>

        {/* ── What we protect card ────────────────────────────────────────── */}
        <section aria-label="Account security measures" className="brutal-card p-6">
          <h2 className="font-display text-xl uppercase">Account Armor</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Password hashing", "bcrypt, cost 12 — plaintext never stored"],
              [
                "Brute-force lockout",
                "5 failed attempts → 15-minute lock, per account + IP",
              ],
              [
                "Session handling",
                "httpOnly, SameSite=Strict cookies; server-side rotation on login",
              ],
              [
                "Audit trail",
                "Logins, MFA events, exports and deletes are all recorded",
              ],
            ].map(([title, detail]) => (
              <li key={title} className="flex items-start gap-2.5">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-brand-green"
                />
                <span>
                  <strong className="font-grotesk">{title}</strong>
                  <span className="block text-muted-foreground">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ── Enrollment dialog: QR → codes ─────────────────────────────────── */}
      <Dialog open={enrollOpen} onOpenChange={(o) => !o && resetEnrollment()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-ink shadow-hard! nice-scrollbar sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">
              {enrollStep === "qr" ? "Enable 2FA" : "Save recovery codes"}
            </DialogTitle>
            <DialogDescription>
              {enrollStep === "qr"
                ? "Scan with Google Authenticator / Authy / 1Password, then enter the current code."
                : "Each code works exactly once if you lose your authenticator. They are shown only this once."}
            </DialogDescription>
          </DialogHeader>

          {enrollStep === "qr" ? (
            busy && !qrDataUrl ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Generating enrollment…
              </div>
            ) : qrDataUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrDataUrl}
                    alt="TOTP enrollment QR code — scan with your authenticator app"
                    className="size-[200px] rounded-lg border-2 border-ink"
                  />
                </div>
                {secret ? (
                  <p className="break-all rounded-lg bg-cream p-2.5 text-center font-mono text-xs font-bold">
                    {secret}
                  </p>
                ) : null}
                <form onSubmit={confirmEnrollment} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="security-totp-code"
                      className="font-grotesk text-xs font-bold uppercase"
                    >
                      6-digit code
                    </Label>
                    <Input
                      id="security-totp-code"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className={`${FIELD_CLASS} text-center font-mono text-lg tracking-[0.4em]`}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className="w-full justify-center font-grotesk font-bold uppercase"
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                    Verify & Enable
                  </Button>
                </form>
              </div>
            ) : null
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg border-2 border-ink bg-cream p-3">
                {recoveryCodes.map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-ink/30 bg-white px-2 py-1.5 text-center font-mono text-xs font-bold tracking-wider"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={copyAllCodes}
                className="w-full justify-center border-2 border-ink font-grotesk font-bold uppercase"
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
                  I saved these codes somewhere safe.
                </span>
              </label>
              <Button
                type="button"
                disabled={!savedConfirmed}
                onClick={resetEnrollment}
                className="w-full justify-center font-grotesk font-bold uppercase"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Disable dialog (ADMIN only) ───────────────────────────────────── */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="border-2 border-ink shadow-hard! sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">
              Disable 2FA
            </DialogTitle>
            <DialogDescription>
              This removes the extra protection from your account. Confirm
              with your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={disableTotp} className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="security-disable-password"
                className="font-grotesk text-xs font-bold uppercase"
              >
                Password
              </Label>
              <Input
                id="security-disable-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <Button
              type="submit"
              disabled={busy || !password}
              className="w-full justify-center bg-brand-red font-grotesk font-bold uppercase text-white hover:bg-brand-red/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-4" aria-hidden="true" />
              )}
              I understand — disable 2FA
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
