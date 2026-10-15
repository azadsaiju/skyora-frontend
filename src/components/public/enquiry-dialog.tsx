"use client";

/**
 * Dialog wrapper around EnquiryForm with a brutal-styled trigger button.
 * Stays open on success so the form's success panel is visible.
 */

import type { EnquiryCourseOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnquiryForm } from "@/components/public/enquiry-form";

interface EnquiryDialogProps {
  courses: EnquiryCourseOption[];
  initialCourseId?: string;
  source: string;
  triggerLabel: string;
  triggerClassName?: string;
}

export function EnquiryDialog({
  courses,
  initialCourseId,
  source,
  triggerLabel,
  triggerClassName,
}: EnquiryDialogProps) {
  const course = initialCourseId
    ? courses.find((c) => c.id === initialCourseId)
    : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={
            triggerClassName ?? "rounded-lg font-bold uppercase brutal-hover"
          }
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="nice-scrollbar max-h-[85vh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[#e6dfd3] bg-white shadow-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-tight uppercase text-ink">
            Enquire Now
          </DialogTitle>
          <DialogDescription className="text-stone-600">
            {course ? (
              <>
                Interested in{" "}
                <span className="font-bold text-ink">{course.title}</span> (
                {course.duration})? Fill this in — a counsellor calls you back
                within 24 hours.
              </>
            ) : (
              "Fill this in — a counsellor calls you back within 24 hours."
            )}
          </DialogDescription>
        </DialogHeader>
        <EnquiryForm
          courses={courses}
          initialCourseId={initialCourseId}
          source={source}
        />
      </DialogContent>
    </Dialog>
  );
}
