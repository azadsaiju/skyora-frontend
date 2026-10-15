"use client";

/**
 * Public enquiry form:
 * - Full name, phone (+91 pattern), email, course select, message
 * - Cloudflare Turnstile captcha (skipped in dev when secret not configured)
 * - Honeypot field (hidden from screen-readers, traps dumb bots)
 * - Submits to /api/enquiry with rate limiting
 * - Success state stays mounted inside the card / dialog
 */

import { useId, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { EnquiryCourseOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileWidget } from "@/components/public/turnstile-widget";

interface EnquiryFormProps {
  courses: EnquiryCourseOption[];
  initialCourseId?: string;
  source: string;
  onSuccess?: () => void;
}

// Basic E.164-ish regex for Indian / international numbers.
const PHONE_PATTERN = "^[+]?[0-9]{10,15}$";

export function EnquiryForm({
  courses,
  initialCourseId,
  source,
  onSuccess,
}: EnquiryFormProps) {
  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    phone: `${baseId}-phone`,
    email: `${baseId}-email`,
    course: `${baseId}-course`,
    message: `${baseId}-message`,
  };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [attempt, setAttempt] = useState(0); // forces fresh captcha on retry

  const turnstileEnabled = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setCourseId(initialCourseId ?? "");
    setMessage("");
    setWebsite("");
    setCaptchaToken(null);
    setErrorMsg(null);
    setSucceeded(false);
    setAttempt((a) => a + 1);
  }

  function handleCaptcha(token: string | null) {
    setCaptchaToken(token);
    if (token) setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Honeypot tripped — silently drop the lead.
    if (website.trim().length > 0) {
      setSucceeded(true);
      return;
    }

    if (turnstileEnabled && !captchaToken) {
      setErrorMsg("Please complete the verification check.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          courseId,
          message: message.trim() || undefined,
          source,
          captchaToken: captchaToken ?? undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Could not send your enquiry. Please try again."
        );
      }

      setSucceeded(true);
      onSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not send your enquiry. Please try again."
      );
      setCaptchaToken(null);
      setAttempt((a) => a + 1); // fresh captcha for the retry
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
          <CheckCircle2 className="h-8 w-8 text-brand-green" aria-hidden />
        </div>
        <p className="font-display text-2xl uppercase text-ink">Enquiry received!</p>
        <p className="max-w-xs text-sm leading-relaxed text-stone-600">
          Our counsellors will call you within 24 hours. Keep your phone
          handy!
        </p>
        <Button
          variant="outline"
          onClick={reset}
          className="rounded-xl border-[#dcd4c5] bg-white font-bold uppercase text-ink shadow-xs hover:bg-stone-100 brutal-hover"
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      {/* Honeypot — hidden from humans, catnip for bots */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="space-y-1.5">
        <Label htmlFor={ids.name} className="text-stone-800 font-semibold">
          Full Name <span className="text-brand-blue">*</span>
        </Label>
        <Input
          id={ids.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="e.g. Priya Sharma"
          className="rounded-xl border border-[#e6dfd3] bg-[#fbf9f4] text-ink placeholder:text-stone-400 focus:bg-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={ids.phone} className="text-stone-800 font-semibold">
            Phone <span className="text-brand-blue">*</span>
          </Label>
          <Input
            id={ids.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            pattern={PHONE_PATTERN}
            title="Enter a valid phone number, e.g. +91 98765 43210"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className="rounded-xl border border-[#e6dfd3] bg-[#fbf9f4] text-ink placeholder:text-stone-400 focus:bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.email} className="text-stone-800 font-semibold">
            Email <span className="text-brand-blue">*</span>
          </Label>
          <Input
            id={ids.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="rounded-xl border border-[#e6dfd3] bg-[#fbf9f4] text-ink placeholder:text-stone-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={ids.course} className="text-stone-800 font-semibold">
          Course Interest <span className="text-brand-blue">*</span>
        </Label>
        <Select value={courseId} onValueChange={setCourseId} required>
          <SelectTrigger
            id={ids.course}
            aria-label="Course interest"
            className="w-full rounded-xl border border-[#e6dfd3] bg-[#fbf9f4] text-ink"
          >
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-[#e6dfd3] bg-white text-ink shadow-lg">
            {courses.length === 0 ? (
              <div className="px-3 py-2 text-sm text-stone-500">
                No courses available right now.
              </div>
            ) : (
              courses.map((c) => (
                <SelectItem key={c.id} value={c.id} className="rounded-md">
                  {c.title} · {c.duration}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={ids.message} className="text-stone-800 font-semibold">
          Message{" "}
          <span className="text-xs font-normal text-stone-500">
            (Optional)
          </span>
        </Label>
        <Textarea
          id={ids.message}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Tell us your goal — dream airline, target company, current background…"
          className="rounded-xl border border-[#e6dfd3] bg-[#fbf9f4] text-ink placeholder:text-stone-400 focus:bg-white"
        />
        <p className="text-right text-xs text-stone-500">
          {message.length}/1000
        </p>
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600 border border-red-200">
          {errorMsg}
        </p>
      )}

      <TurnstileWidget key={attempt} onToken={handleCaptcha} />

      <Button
        type="submit"
        disabled={submitting || (turnstileEnabled && !captchaToken)}
        className="h-11 w-full rounded-xl bg-ink font-bold uppercase text-white hover:bg-stone-800 brutal-hover"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden />
            Submit Enquiry
          </>
        )}
      </Button>
    </form>
  );
}
