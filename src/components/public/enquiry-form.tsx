"use client";

/**
 * Public enquiry form (used inline on Contact and inside EnquiryDialog).
 * Controlled fields + native HTML validation, honeypot anti-bot field,
 * shadcn Select for course interest, sonner toasts for errors.
 */

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import type { CourseDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PHONE_PATTERN = "^[+]?[0-9][0-9\\s\\-()]{7,15}$";

interface EnquiryFormProps {
  courses: CourseDTO[];
  initialCourseId?: string;
  source: string;
  onSuccess?: () => void;
}

export function EnquiryForm({
  courses,
  initialCourseId,
  source,
  onSuccess,
}: EnquiryFormProps) {
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    email: `${uid}-email`,
    course: `${uid}-course`,
    message: `${uid}-message`,
  };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Pre-select the requested course once the course list is available.
  useEffect(() => {
    if (!initialCourseId) return;
    if (courses.some((c) => c.id === initialCourseId)) {
      setCourseId((prev) => prev || initialCourseId);
    }
  }, [initialCourseId, courses]);

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setCourseId("");
    setMessage("");
    setWebsite("");
    setSucceeded(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!courseId) {
      toast.error("Please select a course.");
      return;
    }
    setSubmitting(true);
    try {
      await api<{ ok: boolean }>("/api/enquiry", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          courseId,
          message: message.trim(),
          source,
          website,
        }),
      });
      setSucceeded(true);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Could not send your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-green bg-brand-green/10">
          <CheckCircle2 className="h-8 w-8 text-brand-green" aria-hidden />
        </div>
        <p className="font-display text-2xl uppercase">Enquiry received!</p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Our counsellors will call you within 24 hours. Keep your phone
          handy!
        </p>
        <Button
          variant="outline"
          onClick={reset}
          className="rounded-lg border-2 border-ink font-bold uppercase brutal-hover"
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
        <Label htmlFor={ids.name}>
          Full Name <span className="text-brand-pink">*</span>
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
          className="rounded-lg border-2 border-ink bg-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={ids.phone}>
            Phone <span className="text-brand-pink">*</span>
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
            className="rounded-lg border-2 border-ink bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.email}>
            Email <span className="text-brand-pink">*</span>
          </Label>
          <Input
            id={ids.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="rounded-lg border-2 border-ink bg-white"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={ids.course}>
          Course Interest <span className="text-brand-pink">*</span>
        </Label>
        <Select value={courseId} onValueChange={setCourseId} required>
          <SelectTrigger
            id={ids.course}
            aria-label="Course interest"
            className="w-full rounded-lg border-2 border-ink bg-white"
          >
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-2 border-ink">
            {courses.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
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
        <Label htmlFor={ids.message}>
          Message{" "}
          <span className="text-xs font-normal text-muted-foreground">
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
          className="rounded-lg border-2 border-ink bg-white"
        />
        <p className="text-right text-xs text-muted-foreground">
          {message.length}/1000
        </p>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-lg font-bold uppercase brutal-hover"
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
