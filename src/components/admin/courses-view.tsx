"use client";

/**
 * Courses admin — CRUD for the two public course tracks (Aviation & IT).
 *
 * Every field here maps 1:1 to what the public site renders:
 *  - skills      → "Skills you will learn" bullets on /aviation & /it
 *  - jobRoles    → "Career opportunities" bullets
 *  - workplaces  → "Where you can work" bullets
 *  - image       → course card image (empty = auto-assign department hero)
 *  - isActive    → hide/show on the public site without deleting
 *
 * The homepage cards and the department pages read the SAME database rows
 * (via /api/public/content and the RSC pages), so changes made here appear
 * on the public site instantly — no code changes, no redeploy.
 */

import * as React from "react";
import Image from "next/image";
import {
  Clock,
  Code2,
  GraduationCap,
  ImagePlus,
  Loader2,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import { DEPARTMENTS } from "@/lib/departments";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  track: Track;
  title: string;
  duration: string;
  description: string;
  skills: string;
  jobRoles: string;
  workplaces: string;
  sortOrder: string;
  isActive: boolean;
  /** "" → auto-assign department hero; otherwise an uploaded /uploads/... path */
  image: string;
}

const EMPTY_FORM: CourseFormState = {
  track: "AVIATION",
  title: "",
  duration: "",
  description: "",
  skills: "",
  jobRoles: "",
  workplaces: "",
  sortOrder: "0",
  isActive: true,
  image: "",
};

/** Track chip used in the table + form (Aviation / IT & Software). */
function TrackChip({ track }: { track: Track }) {
  const Icon = track === "AVIATION" ? Plane : Code2;
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 font-grotesk text-[11px] font-bold uppercase">
      <Icon className="size-3.5" aria-hidden="true" />
      {DEPARTMENTS[track].name}
    </span>
  );
}

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
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setFields(
      initial
        ? {
            track: initial.track,
            title: initial.title,
            duration: initial.duration,
            description: initial.description,
            skills: initial.skills,
            jobRoles: initial.jobRoles,
            workplaces: initial.workplaces,
            sortOrder: String(initial.sortOrder ?? 0),
            isActive: initial.isActive,
            image: initial.image ?? "",
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
    if (fields.skills.trim().length < 1)
      errs.skills = "Add at least one skill (one per line).";
    return errs;
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ path: string }>("/api/upload", {
        method: "POST",
        body: fd,
      });
      set("image", res.path);
      toast.success("Image uploaded");
    } catch (err) {
      toastApiError(err, "Could not upload the image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
        track: fields.track,
        title: fields.title.trim(),
        duration: fields.duration.trim(),
        description: fields.description.trim(),
        skills: fields.skills.trim(),
        jobRoles: fields.jobRoles.trim(),
        workplaces: fields.workplaces.trim(),
        image: fields.image.trim(),
        sortOrder: Number(fields.sortOrder) || 0,
        isActive: fields.isActive,
      });
      if (initial) {
        await api<{ course: CourseDTO }>(`/api/courses/${initial.id}`, {
          method: "PATCH",
          body,
        });
        toast.success("Course updated — live on the public site");
      } else {
        await api<{ course: CourseDTO }>("/api/courses", { method: "POST", body });
        toast.success("Course added — live on the public site");
      }
      onSaved();
    } catch (err) {
      toastApiError(err, "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  const previewImage =
    fields.image || DEPARTMENTS[fields.track].heroImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nice-scrollbar max-h-[90vh] overflow-y-auto rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            {initial ? "Edit Course" : "Add New Course"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this course — the department page, homepage card and enquiry form update instantly."
              : "New courses appear instantly on the matching department page and the homepage card."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Department + duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-track" className="font-grotesk text-xs font-bold uppercase">
                Department
              </Label>
              <Select
                value={fields.track}
                onValueChange={(v) => set("track", v as Track)}
              >
                <SelectTrigger
                  id="course-track"
                  aria-label="Course department"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DEPARTMENTS[t].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Shows on {DEPARTMENTS[fields.track].path}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-duration" className="font-grotesk text-xs font-bold uppercase">
                Duration
              </Label>
              <Input
                id="course-duration"
                value={fields.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="e.g. 4 Months"
                className={FIELD_CLASS}
                aria-invalid={!!errors.duration}
              />
              {errors.duration ? (
                <p className="text-xs font-bold text-brand-red">{errors.duration}</p>
              ) : null}
            </div>
          </div>

          {/* Title */}
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

          {/* Description */}
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

          {/* Skills / Job roles / Workplaces */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="course-skills" className="font-grotesk text-xs font-bold uppercase">
                Skills You Will Learn
              </Label>
              <Textarea
                id="course-skills"
                value={fields.skills}
                onChange={(e) => set("skills", e.target.value)}
                rows={6}
                placeholder={"One per line, e.g.\nSafety & Emergency Procedures\nFirst Aid"}
                className={`${FIELD_CLASS} resize-none nice-scrollbar`}
                aria-invalid={!!errors.skills}
              />
              {errors.skills ? (
                <p className="text-xs font-bold text-brand-red">{errors.skills}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-jobs" className="font-grotesk text-xs font-bold uppercase">
                Job Opportunities
              </Label>
              <Textarea
                id="course-jobs"
                value={fields.jobRoles}
                onChange={(e) => set("jobRoles", e.target.value)}
                rows={6}
                placeholder={"One per line, e.g.\nCabin Crew\nFlight Purser"}
                className={`${FIELD_CLASS} resize-none nice-scrollbar`}
              />
              <p className="text-[11px] text-muted-foreground">Career roles listed under each course.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-workplaces" className="font-grotesk text-xs font-bold uppercase">
                Where You Can Work
              </Label>
              <Textarea
                id="course-workplaces"
                value={fields.workplaces}
                onChange={(e) => set("workplaces", e.target.value)}
                rows={6}
                placeholder={"One per line, e.g.\nDomestic & international airlines\nAirports"}
                className={`${FIELD_CLASS} resize-none nice-scrollbar`}
              />
              <p className="text-[11px] text-muted-foreground">Airlines, airports, companies…</p>
            </div>
          </div>

          {/* Image */}
          <div className="rounded-lg border-2 border-dashed border-ink/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-ink bg-olive-tint"
                >
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={previewImage.startsWith("/uploads/")}
                  />
                </span>
                <div>
                  <p className="font-grotesk text-xs font-bold uppercase">
                    Course image
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {fields.image
                      ? "Custom image uploaded"
                      : "Auto-assigns the department image"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fields.image ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => set("image", "")}
                    className="border-2 border-ink bg-white font-grotesk font-bold"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Use department image
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-ink bg-white font-grotesk font-bold"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus className="size-4" aria-hidden="true" />
                  )}
                  Upload image
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  aria-label="Upload course image"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sort order + active */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-sort" className="font-grotesk text-xs font-bold uppercase">
                Display order
              </Label>
              <Input
                id="course-sort"
                type="number"
                min={0}
                max={999}
                value={fields.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className={FIELD_CLASS}
              />
              <p className="text-[11px] text-muted-foreground">Lower numbers appear first.</p>
            </div>
            <div className="flex items-center justify-between self-end rounded-lg border-2 border-dashed border-ink/30 p-3">
              <Label htmlFor="course-active" className="font-grotesk text-sm font-bold">
                Active on public site
              </Label>
              <Switch
                id="course-active"
                checked={fields.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
            </div>
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
              disabled={saving || uploading}
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

function CourseRow({
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
  const skillList = course.skills
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const jobList = course.jobRoles
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <TableRow className={course.isActive ? "" : "opacity-60"}>
      <TableCell>
        <TrackChip track={course.track} />
      </TableCell>
      <TableCell className="min-w-[180px]">
        <p className="font-grotesk font-bold break-words">{course.title}</p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" aria-hidden="true" />
          {course.duration}
          {!course.isActive ? (
            <span className="ml-1.5 rounded-full border-2 border-ink bg-brand-yellow px-1.5 font-grotesk text-[9px] font-bold uppercase">
              Hidden
            </span>
          ) : null}
        </p>
      </TableCell>
      <TableCell className="hidden max-w-[260px] lg:table-cell">
        <p className="line-clamp-2 text-sm break-words text-muted-foreground">
          {course.description}
        </p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="text-sm font-bold">{skillList.length} skills</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {skillList[0] ?? "—"}
        </p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="text-sm font-bold">{jobList.length} roles</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {jobList[0] ?? "—"}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Switch
            checked={course.isActive}
            disabled={toggling}
            onCheckedChange={(v) => onToggleActive(course, v)}
            aria-label={`Toggle ${course.title} visible on the public site`}
          />
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
      </TableCell>
    </TableRow>
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
      toast.success(isActive ? "Course published" : "Course hidden from the public site");
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Courses"
        description="Programs across the Aviation and IT & Software departments — published live to the public site."
      >
        <Button
          onClick={openAdd}
          className="font-grotesk font-bold uppercase shadow-hard-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add New Course
        </Button>
      </AdminPageHeader>

      {loading && courses === null ? (
        <div className="brutal-card space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            message="Add your first Aviation or IT & Software course — it appears instantly on the department page and homepage."
          />
        </div>
      ) : (
        <div className="brutal-card overflow-hidden">
          <div className="nice-scrollbar overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-grotesk text-xs font-bold uppercase">
                    Department
                  </TableHead>
                  <TableHead className="font-grotesk text-xs font-bold uppercase">
                    Course
                  </TableHead>
                  <TableHead className="hidden font-grotesk text-xs font-bold uppercase lg:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="hidden font-grotesk text-xs font-bold uppercase md:table-cell">
                    Skills
                  </TableHead>
                  <TableHead className="hidden font-grotesk text-xs font-bold uppercase md:table-cell">
                    Job Roles
                  </TableHead>
                  <TableHead className="text-right font-grotesk text-xs font-bold uppercase">
                    Live / Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    toggling={togglingId === c.id}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 shrink-0 text-brand-pink" aria-hidden="true" />
        Courses saved here appear instantly on the homepage cards and the
        Aviation / IT &amp; Software department pages — no code changes needed.
      </p>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
