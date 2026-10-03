"use client";

/**
 * Achievements admin — CRUD grid for student wins (hackathons,
 * certifications, projects, placements) shown on the public site.
 */

import * as React from "react";
import {
  Calendar,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { api } from "@/lib/client";
import type { AchievementDTO, AchievementType } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminPageHeader,
  ConfirmDeleteDialog,
  EmptyState,
  FIELD_CLASS,
  SELECT_TRIGGER_CLASS,
  fmtDate,
  toastApiError,
} from "@/components/admin/admin-ui";

const TYPES: AchievementType[] = [
  "HACKATHON",
  "CERTIFICATION",
  "PROJECT",
  "PLACEMENT",
];

const TYPE_COLORS: Record<AchievementType, string> = {
  HACKATHON: "#FF2E63",
  CERTIFICATION: "#2563EB",
  PROJECT: "#FF7A00",
  PLACEMENT: "#16A34A",
};

function TypeBadge({ type }: { type: AchievementType }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}

interface AchievementFormState {
  title: string;
  description: string;
  type: AchievementType;
  date: string;
  link: string;
}

const EMPTY_FORM: AchievementFormState = {
  title: "",
  description: "",
  type: "HACKATHON",
  date: "",
  link: "",
};

function AchievementFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: AchievementDTO | null;
  onSaved: () => void;
}) {
  const [fields, setFields] = React.useState<AchievementFormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setFields(
      initial
        ? {
            title: initial.title,
            description: initial.description,
            type: initial.type,
            date: format(parseISO(initial.date), "yyyy-MM-dd"),
            link: initial.link ?? "",
          }
        : EMPTY_FORM
    );
  }, [open, initial]);

  function set<K extends keyof AchievementFormState>(
    key: K,
    value: AchievementFormState[K]
  ) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (fields.title.trim().length < 2)
      errs.title = "Title is required (min 2 characters).";
    if (fields.description.trim().length < 5)
      errs.description = "Description is required (min 5 characters).";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date))
      errs.date = "Date is required.";
    if (fields.link.trim() && !/^https?:\/\/\S+\.\S+/i.test(fields.link.trim()))
      errs.link = "Enter a valid URL starting with http(s):// (or leave empty).";
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
        description: fields.description.trim(),
        type: fields.type,
        date: fields.date,
        link: fields.link.trim(),
      });
      if (initial) {
        await api<{ achievement: AchievementDTO }>(
          `/api/achievements/${initial.id}`,
          { method: "PATCH", body }
        );
        toast.success("Achievement updated");
      } else {
        await api<{ achievement: AchievementDTO }>("/api/achievements", {
          method: "POST",
          body,
        });
        toast.success("Achievement added");
      }
      onSaved();
    } catch (err) {
      toastApiError(err, "Could not save the achievement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nice-scrollbar max-h-[90vh] overflow-y-auto rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            {initial ? "Edit Achievement" : "Add Achievement"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this student win shown on the public site."
              : "Celebrate a student win on the public site."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ach-title" className="font-grotesk text-xs font-bold uppercase">
              Title
            </Label>
            <Input
              id="ach-title"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Smart India Hackathon finalists"
              className={FIELD_CLASS}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="text-xs font-bold text-brand-red">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ach-desc" className="font-grotesk text-xs font-bold uppercase">
              Description
            </Label>
            <Textarea
              id="ach-desc"
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What happened and why it matters…"
              className={`${FIELD_CLASS} resize-none`}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="text-xs font-bold text-brand-red">{errors.description}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ach-type" className="font-grotesk text-xs font-bold uppercase">
                Type
              </Label>
              <Select
                value={fields.type}
                onValueChange={(v) => set("type", v as AchievementType)}
              >
                <SelectTrigger
                  id="ach-type"
                  aria-label="Achievement type"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ach-date" className="font-grotesk text-xs font-bold uppercase">
                Date
              </Label>
              <Input
                id="ach-date"
                type="date"
                value={fields.date}
                onChange={(e) => set("date", e.target.value)}
                className={FIELD_CLASS}
                aria-invalid={!!errors.date}
              />
              {errors.date ? (
                <p className="text-xs font-bold text-brand-red">{errors.date}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ach-link" className="font-grotesk text-xs font-bold uppercase">
              Link (optional)
            </Label>
            <Input
              id="ach-link"
              type="url"
              value={fields.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://…"
              className={FIELD_CLASS}
              aria-invalid={!!errors.link}
            />
            {errors.link ? (
              <p className="text-xs font-bold text-brand-red">{errors.link}</p>
            ) : null}
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
              {initial ? "Save Changes" : "Add Achievement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AchievementsView() {
  const [achievements, setAchievements] = React.useState<AchievementDTO[] | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AchievementDTO | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ achievements: AchievementDTO[] }>(
        "/api/achievements"
      );
      setAchievements(res.achievements);
    } catch (err) {
      toastApiError(err, "Could not load achievements.");
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

  function openEdit(a: AchievementDTO) {
    setEditing(a);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    void load();
  }

  async function handleDelete(a: AchievementDTO) {
    try {
      await api(`/api/achievements/${a.id}`, { method: "DELETE" });
      toast.success("Achievement deleted");
      void load();
    } catch (err) {
      toastApiError(err, "Could not delete the achievement.");
    }
  }

  const rows = achievements ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Achievements"
        description="Student wins celebrated on the public site."
      >
        <Button
          onClick={openAdd}
          className="font-grotesk font-bold uppercase shadow-hard-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Achievement
        </Button>
      </AdminPageHeader>

      {loading && achievements === null ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="brutal-card-sm space-y-3 p-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            message="Add hackathons, certifications, projects and placements to inspire new enquiries."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <div key={a.id} className="brutal-card-sm flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <TypeBadge type={a.type} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" aria-hidden="true" />
                  {fmtDate(a.date)}
                </span>
              </div>
              <h3 className="font-grotesk font-bold leading-snug">{a.title}</h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {a.description}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-dashed border-ink/10 pt-3">
                {a.link ? (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-grotesk text-xs font-bold text-brand-blue underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    View Link
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No link</span>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(a)}
                    aria-label={`Edit ${a.title}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${a.title}`}
                      >
                        <Trash2
                          className="size-4 text-brand-red"
                          aria-hidden="true"
                        />
                      </Button>
                    }
                    title="Delete achievement?"
                    description={`“${a.title}” will be removed from the public site. This cannot be undone.`}
                    onConfirm={() => handleDelete(a)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AchievementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
