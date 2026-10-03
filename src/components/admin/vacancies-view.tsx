"use client";

/**
 * Vacancies admin — CRUD for the public vacancies board plus an inline
 * open/closed toggle. Desktop table, mobile cards, shared add/edit dialog
 * with inline client validation.
 */

import * as React from "react";
import { Briefcase, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import type { JobType, VacancyDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
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
  TableSkeleton,
  fmtDateShort,
  toastApiError,
} from "@/components/admin/admin-ui";

const JOB_TYPES: JobType[] = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"];

const JOB_TYPE_COLORS: Record<JobType, string> = {
  FULL_TIME: "#2563EB",
  PART_TIME: "#FF7A00",
  INTERNSHIP: "#00B8D9",
  CONTRACT: "#FF2E63",
};

function jobTypeLabel(t: JobType): string {
  return t.replace("_", " ");
}

function JobTypeBadge({ type }: { type: JobType }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white"
      style={{ backgroundColor: JOB_TYPE_COLORS[type] }}
    >
      {jobTypeLabel(type)}
    </span>
  );
}

function OpenPill({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white",
        isOpen ? "bg-brand-green" : "bg-[#6B7280]"
      )}
    >
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

interface VacancyFormState {
  title: string;
  company: string;
  location: string;
  jobType: JobType;
  description: string;
  applyLink: string;
  isOpen: boolean;
}

const EMPTY_FORM: VacancyFormState = {
  title: "",
  company: "",
  location: "",
  jobType: "FULL_TIME",
  description: "",
  applyLink: "",
  isOpen: true,
};

function VacancyFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: VacancyDTO | null;
  onSaved: () => void;
}) {
  const [fields, setFields] = React.useState<VacancyFormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setFields(
      initial
        ? {
            title: initial.title,
            company: initial.company,
            location: initial.location,
            jobType: initial.jobType,
            description: initial.description,
            applyLink: initial.applyLink,
            isOpen: initial.isOpen,
          }
        : EMPTY_FORM
    );
  }, [open, initial]);

  function set<K extends keyof VacancyFormState>(key: K, value: VacancyFormState[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (fields.title.trim().length < 2) errs.title = "Title is required (min 2 characters).";
    if (fields.company.trim().length < 1) errs.company = "Company is required.";
    if (fields.location.trim().length < 1) errs.location = "Location is required.";
    if (fields.description.trim().length < 5)
      errs.description = "Description is required (min 5 characters).";
    if (!/^https?:\/\/\S+\.\S+/i.test(fields.applyLink.trim()))
      errs.applyLink = "Enter a valid URL starting with http(s)://.";
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
        company: fields.company.trim(),
        location: fields.location.trim(),
        jobType: fields.jobType,
        description: fields.description.trim(),
        applyLink: fields.applyLink.trim(),
        isOpen: fields.isOpen,
      });
      if (initial) {
        await api<{ vacancy: VacancyDTO }>(`/api/vacancies/${initial.id}`, {
          method: "PATCH",
          body,
        });
        toast.success("Vacancy updated");
      } else {
        await api<{ vacancy: VacancyDTO }>("/api/vacancies", {
          method: "POST",
          body,
        });
        toast.success("Vacancy added");
      }
      onSaved();
    } catch (err) {
      toastApiError(err, "Could not save the vacancy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nice-scrollbar max-h-[90vh] overflow-y-auto rounded-xl border-2 border-ink bg-white shadow-hard sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            {initial ? "Edit Vacancy" : "Add Vacancy"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this role on the public vacancies board."
              : "Post a new role to the public vacancies board."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="vac-title" className="font-grotesk text-xs font-bold uppercase">
              Title
            </Label>
            <Input
              id="vac-title"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Cabin Crew — Delhi Base"
              className={FIELD_CLASS}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="text-xs font-bold text-brand-red">{errors.title}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vac-company" className="font-grotesk text-xs font-bold uppercase">
                Company
              </Label>
              <Input
                id="vac-company"
                value={fields.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. IndiGo"
                className={FIELD_CLASS}
                aria-invalid={!!errors.company}
              />
              {errors.company ? (
                <p className="text-xs font-bold text-brand-red">{errors.company}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vac-location" className="font-grotesk text-xs font-bold uppercase">
                Location
              </Label>
              <Input
                id="vac-location"
                value={fields.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Mumbai"
                className={FIELD_CLASS}
                aria-invalid={!!errors.location}
              />
              {errors.location ? (
                <p className="text-xs font-bold text-brand-red">{errors.location}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vac-type" className="font-grotesk text-xs font-bold uppercase">
              Job Type
            </Label>
            <Select
              value={fields.jobType}
              onValueChange={(v) => set("jobType", v as JobType)}
            >
              <SelectTrigger
                id="vac-type"
                aria-label="Job type"
                className={SELECT_TRIGGER_CLASS}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {jobTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vac-desc" className="font-grotesk text-xs font-bold uppercase">
              Description
            </Label>
            <Textarea
              id="vac-desc"
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Role summary, requirements, salary range…"
              className={`${FIELD_CLASS} resize-none`}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="text-xs font-bold text-brand-red">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vac-link" className="font-grotesk text-xs font-bold uppercase">
              Apply Link
            </Label>
            <Input
              id="vac-link"
              type="url"
              value={fields.applyLink}
              onChange={(e) => set("applyLink", e.target.value)}
              placeholder="https://careers.example.com/apply"
              className={FIELD_CLASS}
              aria-invalid={!!errors.applyLink}
            />
            {errors.applyLink ? (
              <p className="text-xs font-bold text-brand-red">{errors.applyLink}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-ink/30 p-3">
            <Label htmlFor="vac-open" className="font-grotesk text-sm font-bold">
              Open for applications
            </Label>
            <Switch
              id="vac-open"
              checked={fields.isOpen}
              onCheckedChange={(v) => set("isOpen", v)}
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
            <Button type="submit" disabled={saving} className="font-grotesk font-bold uppercase shadow-hard-sm">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {initial ? "Save Changes" : "Add Vacancy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VacanciesView() {
  const [vacancies, setVacancies] = React.useState<VacancyDTO[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VacancyDTO | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ vacancies: VacancyDTO[] }>("/api/vacancies");
      setVacancies(res.vacancies);
    } catch (err) {
      toastApiError(err, "Could not load vacancies.");
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

  function openEdit(v: VacancyDTO) {
    setEditing(v);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    void load();
  }

  async function handleToggle(v: VacancyDTO, isOpen: boolean) {
    setTogglingId(v.id);
    try {
      const res = await api<{ vacancy: VacancyDTO }>(`/api/vacancies/${v.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isOpen }),
      });
      setVacancies((prev) =>
        prev ? prev.map((x) => (x.id === v.id ? res.vacancy : x)) : prev
      );
      toast.success(isOpen ? "Vacancy opened" : "Vacancy closed");
    } catch (err) {
      toastApiError(err, "Could not update the vacancy.");
      void load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(v: VacancyDTO) {
    try {
      await api(`/api/vacancies/${v.id}`, { method: "DELETE" });
      toast.success("Vacancy deleted");
      void load();
    } catch (err) {
      toastApiError(err, "Could not delete the vacancy.");
    }
  }

  const rows = vacancies ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vacancies"
        description="Roles shown on the public vacancies board."
      >
        <Button
          onClick={openAdd}
          className="font-grotesk font-bold uppercase shadow-hard-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Vacancy
        </Button>
      </AdminPageHeader>

      {loading && vacancies === null ? (
          <TableSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <div className="brutal-card">
            <EmptyState
              icon={Briefcase}
              title="No vacancies yet"
              message="Add your first role to show it on the public site."
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="brutal-card overflow-hidden">
                <div className="nice-scrollbar overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cream hover:bg-cream">
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Title</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Company</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Location</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Type</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Status</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Posted</TableHead>
                        <TableHead className="font-grotesk text-xs font-bold uppercase">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((v) => (
                        <TableRow key={v.id} className="hover:bg-cream">
                          <TableCell className="max-w-56">
                            <p className="truncate font-grotesk font-bold">{v.title}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{v.description}</p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{v.company}</TableCell>
                          <TableCell className="whitespace-nowrap">{v.location}</TableCell>
                          <TableCell>
                            <JobTypeBadge type={v.jobType} />
                          </TableCell>
                          <TableCell>
                            <OpenPill isOpen={v.isOpen} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {fmtDateShort(v.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={v.isOpen}
                                disabled={togglingId === v.id}
                                onCheckedChange={(checked) => void handleToggle(v, checked)}
                                aria-label={`Toggle vacancy open for ${v.title}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(v)}
                                aria-label={`Edit ${v.title}`}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                              <ConfirmDeleteDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${v.title}`}
                                  >
                                    <Trash2 className="size-4 text-brand-red" aria-hidden="true" />
                                  </Button>
                                }
                                title="Delete vacancy?"
                                description={`“${v.title}” at ${v.company} will be removed from the public board. This cannot be undone.`}
                                onConfirm={() => handleDelete(v)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((v) => (
                <div key={v.id} className="brutal-card-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-grotesk font-bold">{v.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {v.company} · {v.location}
                      </p>
                    </div>
                    <OpenPill isOpen={v.isOpen} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <JobTypeBadge type={v.jobType} />
                    <span className="text-xs text-muted-foreground">
                      Posted {fmtDateShort(v.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{v.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-dashed border-ink/10 pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={v.isOpen}
                        disabled={togglingId === v.id}
                        onCheckedChange={(checked) => void handleToggle(v, checked)}
                        aria-label={`Toggle vacancy open for ${v.title}`}
                      />
                      <span className="font-grotesk text-xs font-bold uppercase">
                        {v.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(v)}
                        className="border-2 border-ink bg-white font-grotesk font-bold"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <ConfirmDeleteDialog
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Delete ${v.title}`}
                            className="border-2 border-ink bg-white font-grotesk font-bold text-brand-red hover:bg-brand-red hover:text-white"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </Button>
                        }
                        title="Delete vacancy?"
                        description={`“${v.title}” at ${v.company} will be removed from the public board. This cannot be undone.`}
                        onConfirm={() => handleDelete(v)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      <VacancyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
