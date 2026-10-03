"use client";

/**
 * Courses admin — CRUD for the two public course tracks (Aviation & IT).
 * Includes an isActive toggle (hide/show on the public site) and a syllabus
 * editor with one topic per line. Deleting a course detaches (never deletes)
 * its enquiries — enforced server-side.
 */

import * as React from "react";
import {
  Clock,
  Code2,
  GraduationCap,
  Loader2,
  Pencil,
  Plane,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { CourseDTO, Track } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminPageHeader,
  ConfirmDeleteDialog,
  EmptyState,
  FIELD_CLASS,
  SELECT_TRIGGER_CLASS,
  toastApiError,
} from "@/components/admin/admin-ui";

const TRACKS: Track[] = ["AVIATION", "IT"];

interface CourseFormState {
  title: string;
  track: Track;
  duration: string;
  description: string;
  syllabus: string;
  isActive: boolean;
}

const EMPTY_FORM: CourseFormState = {
  title: "",
  track: "AVIATION",
  duration: "",
  description: "",
  syllabus: "",
  isActive: true,
};

function CourseFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: CourseDTO | null;
  onSaved: () => void;
}) {
  const [fields, setFields] = React.useState<CourseFormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setFields(
      initial
        ? {
            title: initial.title,
            track: initial.track,
            duration: initial.duration,
            description: initial.description,
            syllabus: initial.syllabus,
            isActive: initial.isActive,
          }
        : EMPTY_FORM
    );
  }, [open, initial]);

  function set<K extends keyof CourseFormState>(
    key: K,
    value: CourseFormState[K]
  ) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (fields.title.trim().length < 2)
      errs.title = "Title is required (min 2 characters).";
    if (fields.duration.trim().length < 1)
      errs.duration = "Duration is required.";
    if (fields.description.trim().length < 10)
      errs.description = "Description is required (min 10 characters).";
    if (fields.syllabus.trim().length < 1)
      errs.syllabus = "Add at least one syllabus topic.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const body = JSON.stringify({
        title: fields.title.trim(),
        track: fields.track,
        duration: fields.duration.trim(),
        description: fields.description.trim(),
        syllabus: fields.syllabus.trim(),
        isActive: fields.isActive,
      });
      if (initial) {
        await api<{ course: CourseDTO }>(`/api/courses/${initial.id}`, {
          method: "PATCH",
          body,
        });
        toast.success("Course updated");
      } else {
        await api<{ course: CourseDTO }>("/api/courses", { method: "POST", body });
        toast.success("Course added");
      }
      onSaved();
    } catch (err) {
      toastApiError(err, "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nice-scrollbar max-h-[90vh] overflow-y-auto rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            {initial ? "Edit Course" : "Add Course"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this course as it appears on the public site."
              : "Create a new course for the Aviation or IT track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="course-title" className="font-grotesk text-xs font-bold uppercase">
              Title
            </Label>
            <Input
              id="course-title"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Cabin Crew Training"
              className={FIELD_CLASS}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="text-xs font-bold text-brand-red">{errors.title}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-track" className="font-grotesk text-xs font-bold uppercase">
                Track
              </Label>
              <Select
                value={fields.track}
                onValueChange={(v) => set("track", v as Track)}
              >
                <SelectTrigger
                  id="course-track"
                  aria-label="Course track"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-duration" className="font-grotesk text-xs font-bold uppercase">
                Duration
              </Label>
              <Input
                id="course-duration"
                value={fields.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="e.g. 3 months"
                className={FIELD_CLASS}
                aria-invalid={!!errors.duration}
              />
              {errors.duration ? (
                <p className="text-xs font-bold text-brand-red">{errors.duration}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-desc" className="font-grotesk text-xs font-bold uppercase">
              Description
            </Label>
            <Textarea
              id="course-desc"
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What students learn and how it lands them jobs…"
              className={`${FIELD_CLASS} resize-none`}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="text-xs font-bold text-brand-red">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-syllabus" className="font-grotesk text-xs font-bold uppercase">
              Syllabus Highlights
            </Label>
            <Textarea
              id="course-syllabus"
              value={fields.syllabus}
              onChange={(e) => set("syllabus", e.target.value)}
              rows={5}
              placeholder={"One topic per line, e.g.\nMock interviews\nDCS basics"}
              className={`${FIELD_CLASS} resize-none`}
              aria-invalid={!!errors.syllabus}
            />
            <p className="text-[11px] text-muted-foreground">
              One topic per line — the first few appear as bullets on the site.
            </p>
            {errors.syllabus ? (
              <p className="text-xs font-bold text-brand-red">{errors.syllabus}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-ink/30 p-3">
            <Label htmlFor="course-active" className="font-grotesk text-sm font-bold">
              Active on public site
            </Label>
            <Switch
              id="course-active"
              checked={fields.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-2 border-ink bg-white font-grotesk font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-grotesk font-bold uppercase shadow-hard-sm"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {initial ? "Save Changes" : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({
  course,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  course: CourseDTO;
  toggling: boolean;
  onEdit: (c: CourseDTO) => void;
  onToggleActive: (c: CourseDTO, active: boolean) => void;
  onDelete: (c: CourseDTO) => void;
}) {
  const bullets = course.syllabus
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const shown = bullets.slice(0, 2);
  const extra = bullets.length - shown.length;

  return (
    <div className="brutal-card-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grotesk font-bold">{course.title}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 font-grotesk text-[10px] font-bold">
              <Clock className="size-3" aria-hidden="true" />
              {course.duration}
            </span>
            {!course.isActive ? (
              <span className="rounded-full border-2 border-ink bg-brand-yellow px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase">
                Inactive
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
          {shown.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {shown.map((b) => (
                <li key={b} className="flex gap-1.5 text-xs">
                  <span aria-hidden="true">•</span>
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
              {extra > 0 ? (
                <li className="text-xs font-bold text-muted-foreground">
                  +{extra} more topic{extra > 1 ? "s" : ""}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Switch
            checked={course.isActive}
            disabled={toggling}
            onCheckedChange={(v) => onToggleActive(course, v)}
            aria-label={`Toggle ${course.title} active`}
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(course)}
              aria-label={`Edit ${course.title}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <ConfirmDeleteDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${course.title}`}
                >
                  <Trash2 className="size-4 text-brand-red" aria-hidden="true" />
                </Button>
              }
              title="Delete course?"
              description={`“${course.title}” will be removed from the public site. Linked enquiries are detached (not deleted). This cannot be undone.`}
              onConfirm={() => onDelete(course)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoursesView() {
  const [courses, setCourses] = React.useState<CourseDTO[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CourseDTO | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ courses: CourseDTO[] }>("/api/courses");
      setCourses(res.courses);
    } catch (err) {
      toastApiError(err, "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(c: CourseDTO) {
    setEditing(c);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    void load();
  }

  async function handleToggleActive(c: CourseDTO, isActive: boolean) {
    setTogglingId(c.id);
    try {
      const res = await api<{ course: CourseDTO }>(`/api/courses/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setCourses((prev) =>
        prev ? prev.map((x) => (x.id === c.id ? res.course : x)) : prev
      );
      toast.success(isActive ? "Course published" : "Course hidden");
    } catch (err) {
      toastApiError(err, "Could not update the course.");
      void load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(c: CourseDTO) {
    try {
      await api(`/api/courses/${c.id}`, { method: "DELETE" });
      toast.success("Course deleted");
      void load();
    } catch (err) {
      toastApiError(err, "Could not delete the course.");
    }
  }

  const rows = courses ?? [];
  const aviation = rows.filter((c) => c.track === "AVIATION");
  const it = rows.filter((c) => c.track === "IT");

  const sections: {
    label: string;
    icon: LucideIcon;
    color: string;
    courses: CourseDTO[];
  }[] = [
    { label: "Aviation", icon: Plane, color: "#2563EB", courses: aviation },
    { label: "IT", icon: Code2, color: "#00B8D9", courses: it },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Courses"
        description="Programs offered across the Aviation and IT tracks."
      >
        <Button
          onClick={openAdd}
          className="font-grotesk font-bold uppercase shadow-hard-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Course
        </Button>
      </AdminPageHeader>

      {loading && courses === null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="brutal-card-sm space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            message="Add your first Aviation or IT course to show it on the public site."
          />
        </div>
      ) : (
        sections.map((section) => (
          <section
            key={section.label}
            aria-label={`${section.label} courses`}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-white"
                style={{ backgroundColor: section.color }}
                aria-hidden="true"
              >
                <section.icon className="size-4" />
              </span>
              <h2 className="font-display text-lg uppercase">
                {section.label}
              </h2>
              <span className="font-grotesk text-xs font-bold text-muted-foreground">
                {section.courses.length} course
                {section.courses.length === 1 ? "" : "s"}
              </span>
            </div>
            {section.courses.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-ink/30 bg-white/60 p-4 text-sm text-muted-foreground">
                No {section.label} courses yet.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {section.courses.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    toggling={togglingId === c.id}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
