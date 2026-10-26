"use client";

/**
 * Admin login — full-screen brutalist card with show/hide password.
 * Errors (401 invalid creds, 429 lockout, 403 deactivated) are toasted
 * with the server's own message.
 */

import * as React from "react";
import Image from "next/image";
import { Eye, EyeOff, Info, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_CLASS } from "@/components/admin/admin-ui";

interface LoginResponse {
  user?: SessionUser;
  mfaRequired?: boolean;
  mustEnroll?: boolean;
}

export function LoginView({
  onSuccess,
  onMfaRequired,
}: {
  onSuccess: (user: SessionUser) => void;
  onMfaRequired: (mustEnroll: boolean) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      // TOTP-gated accounts receive a challenge instead of a session.
      if (res.mfaRequired) {
        onMfaRequired(Boolean(res.mustEnroll));
        return;
      }
      if (!res.user) {
        toast.error("Sign in failed. Please try again.");
        return;
      }
      toast.success(`Welcome back, ${res.user.name}`);
      onSuccess(res.user);
    } catch (err) {
      const e2 = err as Error & { status?: number };
      toast.error(e2.message || "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream p-4">
      <div
        className="dot-grid pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
      />

      <main className="relative w-full max-w-[420px]">
        <div className="brutal-card w-[min(420px,calc(100vw-2rem))] p-8">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-white shadow-hard-sm"
              aria-hidden="true"
            >
              <Image
                src="/logo-mark.png"
                alt="Skyora Logo"
                width={1024}
                height={1024}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none">SKYORA</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-grotesk text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <Lock className="size-3" aria-hidden="true" />
                Secure Admin Portal
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border-2 border-dashed border-ink/25 bg-cream px-3 py-2.5">
            <Info
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Restricted area — login is for authorised admins &amp;
              administrators only, to review enquiry details and manage site
              content. Students can enquire via WhatsApp or the enquiry form.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-login-email"
                className="font-grotesk text-xs font-bold uppercase"
              >
                Email
              </Label>
              <Input
                id="admin-login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@skyora.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="admin-login-password"
                className="font-grotesk text-xs font-bold uppercase"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className={`${FIELD_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-grotesk font-bold uppercase shadow-hard-sm"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="size-4" aria-hidden="true" />
              )}
              {submitting ? "Signing In…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-1.5 border-t-2 border-dashed border-ink/20 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Sessions are httpOnly + SameSite=Strict. 5 failed attempts = 15
              min lockout. 2FA is optional — enable it under Security.
            </p>
            <a
              href="/"
              className="inline-block font-grotesk text-xs font-bold uppercase tracking-wide underline underline-offset-4 hover:text-brand-pink"
            >
              ← Back to site
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
