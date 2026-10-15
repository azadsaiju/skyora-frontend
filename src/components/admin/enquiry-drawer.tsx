"use client";

/**
 * Enquiry detail drawer (Sheet). Full contact values (the list may mask
 * them for ADMIN — the server returns full values here), status + assignment
 * controls, WhatsApp deep link, follow-up history with an add form, and a
 * SUPER_ADMIN-only delete danger zone.
 */

import * as React from "react";
import {
  Calendar,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { api } from "@/lib/client";
import { trackWhatsApp } from "@/lib/track-whatsapp";
import {
  ENQUIRY_STATUSES,
  STATUS_COLORS,
  type EnquiryDetailDTO,
  type EnquiryStatus,
  type FollowUpDTO,
  type SessionUser,
  type UserDTO,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDeleteDialog,
  FIELD_CLASS,
  SELECT_TRIGGER_CLASS,
  StatusBadge,
  fmtDate,
  fmtDateShort,
  isDateOverdue,
  toastApiError,
} from "@/components/admin/admin-ui";

interface EnquiryPatchResponse {
  id: string;
  status: EnquiryStatus;
  assignedTo: { id: string; name: string } | null;
}

const UNASSIGNED = "__none__";

function MetaItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 font-grotesk text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
        {label}
      </p>
      {href ? (
        <a
          href={href}
          className="mt-0.5 block truncate font-grotesk text-sm font-bold underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-0.5 truncate font-grotesk text-sm font-bold">
          {value}
        </p>
      )}
    </div>
  );
}

function FollowUpItem({
  f,
  isLatest,
  isClosed,
  onUpdate,
}: {
  f: FollowUpDTO;
  isLatest: boolean;
  isClosed: boolean;
  onUpdate: (id: string, note: string, nextActionDate: string) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editNote, setEditNote] = React.useState(f.note);
  const [editDate, setEditDate] = React.useState(
    f.nextActionDate ? f.nextActionDate.slice(0, 10) : ""
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setEditNote(f.note);
    setEditDate(f.nextActionDate ? f.nextActionDate.slice(0, 10) : "");
  }, [f.note, f.nextActionDate]);

  const overdue = !isClosed && isLatest && isDateOverdue(f.nextActionDate);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editNote.trim().length < 2) {
      toast.error("Note is too short.");
      return;
    }
    setSaving(true);
    try {
      await onUpdate(f.id, editNote, editDate);
      setEditing(false);
    } catch {
      // toast shown in onUpdate
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="relative group">
      <span
        className={cn(
          "absolute -left-[22px] top-1.5 size-3 rounded-full border-2 border-ink",
          overdue
            ? "bg-brand-pink"
            : isLatest
            ? "bg-brand-cyan"
            : "bg-white"
        )}
        aria-hidden="true"
      />
      {editing ? (
        <form onSubmit={handleSave} className="brutal-card-sm space-y-2.5 bg-white p-3">
          <Textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            rows={2}
            required
            className={`${FIELD_CLASS} resize-none text-xs`}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Next action date (optional)
              </Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className={`${FIELD_CLASS} text-xs`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setEditNote(f.note);
                  setEditDate(f.nextActionDate ? f.nextActionDate.slice(0, 10) : "");
                }}
                className="h-8 border-2 border-ink text-xs font-grotesk font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-grotesk font-bold uppercase shadow-hard-sm"
              >
                {saving ? (
                  <Loader2 className="mr-1 size-3 animate-spin" aria-hidden="true" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="flex-1 whitespace-pre-wrap text-sm">{f.note}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-ink opacity-70 group-hover:opacity-100"
              title="Edit or reschedule follow-up"
            >
              <Pencil className="mr-1 size-3" aria-hidden="true" />
              Edit
            </Button>
          </div>
          {f.nextActionDate ? (
            <span
              className={cn(
                "mt-1.5 inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase",
                overdue
                  ? "bg-brand-pink text-white"
                  : isLatest
                  ? "bg-white text-ink"
                  : "border-ink/40 bg-muted/30 text-muted-foreground"
              )}
            >
              <Calendar className="size-3" aria-hidden="true" />
              Next: {fmtDateShort(f.nextActionDate)}
              {overdue ? " · Overdue" : isLatest ? "" : " · Completed"}
            </span>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            by {f.createdBy?.name ?? "—"} ·{" "}
            {format(parseISO(f.createdAt), "dd MMM yyyy, HH:mm")}
          </p>
        </>
      )}
    </li>
  );
}

export function EnquiryDrawer({
  enquiryId,
  user,
  open,
  onClose,
  onChanged,
}: {
  enquiryId: string;
  user: SessionUser;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = React.useState<EnquiryDetailDTO | null>(null);
  const [loadedForId, setLoadedForId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [assignSaving, setAssignSaving] = React.useState(false);
  const [assignees, setAssignees] = React.useState<UserDTO[]>([]);
  const [note, setNote] = React.useState("");
  const [nextActionDate, setNextActionDate] = React.useState("");
  const [followSaving, setFollowSaving] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  const isSuper = user.role === "SUPER_ADMIN";
  const stale = detail !== null && loadedForId !== enquiryId;

  // Reset the follow-up form when switching enquiries.
  React.useEffect(() => {
    setNote("");
    setNextActionDate("");
  }, [enquiryId]);

  // Load the detail for this enquiry.
  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const d = await api<EnquiryDetailDTO>(`/api/enquiries/${enquiryId}`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setDetail(d);
        setLoadedForId(enquiryId);
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        const e = err as Error & { status?: number };
        if (e.status === 404) {
          toast.error("Enquiry not found — it may have been deleted.");
          onClose();
        } else {
          toastApiError(err, "Could not load this enquiry.");
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enquiryId, open, reloadKey]);

  // Assignee options — SUPER_ADMIN only (ADMIN would get a 403 from /api/users).
  React.useEffect(() => {
    if (!open || !isSuper) return;
    void api<{ users: UserDTO[] }>("/api/users")
      .then((r) =>
        setAssignees(r.users.filter((u) => u.isActive))
      )
      .catch((err) => {
        setAssignees([]);
        toastApiError(err, "Could not load assignees.");
      });
  }, [open, isSuper]);

  async function handleStatusChange(status: EnquiryStatus) {
    if (!detail) return;
    setStatusSaving(true);
    try {
      const res = await api<EnquiryPatchResponse>(`/api/enquiries/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setDetail((d) => (d ? { ...d, status: res.status } : d));
      toast.success("Status updated");
      onChanged();
    } catch (err) {
      toastApiError(err, "Could not update the status.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAssigneeChange(value: string) {
    if (!detail) return;
    const assignedToId = value === UNASSIGNED ? null : value;
    setAssignSaving(true);
    try {
      const res = await api<EnquiryPatchResponse>(`/api/enquiries/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedToId }),
      });
      setDetail((d) =>
        d
          ? {
              ...d,
              assignedTo: res.assignedTo
                ? {
                    id: res.assignedTo.id,
                    name: res.assignedTo.name,
                    email:
                      d.assignedTo && d.assignedTo.id === res.assignedTo.id
                        ? d.assignedTo.email
                        : "",
                  }
                : null,
            }
          : d
      );
      toast.success(
        res.assignedTo ? "Assignment updated" : "Enquiry unassigned"
      );
      onChanged();
    } catch (err) {
      toastApiError(err, "Could not update the assignment.");
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleAddFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail || followSaving) return;
    if (note.trim().length < 2) {
      toast.error("Please write a follow-up note first.");
      return;
    }
    setFollowSaving(true);
    try {
      await api<FollowUpDTO>(`/api/enquiries/${detail.id}/followups`, {
        method: "POST",
        body: JSON.stringify({
          note: note.trim(),
          nextActionDate: nextActionDate || null,
        }),
      });
      toast.success("Follow-up added");
      setNote("");
      setNextActionDate("");
      setReloadKey((k) => k + 1);
      onChanged();
    } catch (err) {
      toastApiError(err, "Could not add the follow-up.");
    } finally {
      setFollowSaving(false);
    }
  }

  async function handleUpdateFollowUp(
    followUpId: string,
    updatedNote: string,
    updatedDate: string
  ) {
    if (!detail) return;
    try {
      await api(`/api/enquiries/${detail.id}/followups`, {
        method: "PATCH",
        body: JSON.stringify({
          followUpId,
          note: updatedNote.trim(),
          nextActionDate: updatedDate || null,
        }),
      });
      toast.success("Follow-up updated");
      setReloadKey((k) => k + 1);
      onChanged();
    } catch (err) {
      toastApiError(err, "Could not update the follow-up.");
      throw err;
    }
  }

  async function handleDelete() {
    if (!detail) return;
    try {
      await api<{ ok: boolean }>(`/api/enquiries/${detail.id}`, {
        method: "DELETE",
      });
      toast.success("Enquiry deleted");
      onClose();
      onChanged();
    } catch (err) {
      toastApiError(err, "Could not delete the enquiry.");
    }
  }

  const waHref = detail
    ? `https://wa.me/${detail.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi ${detail.name}, this is Skyora Group of Institutes regarding your ${detail.course?.title ?? "course"} enquiry.`
      )}`
    : "#";

  const sortedFollowUps = detail
    ? [...detail.followUps].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      )
    : [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[min(520px,100vw)] gap-0 p-0 sm:max-w-none"
      >
        {loading || stale || !detail ? (
          <div className="space-y-4 p-6" role="status" aria-label="Loading enquiry">
            <SheetTitle className="sr-only">Enquiry details</SheetTitle>
            <SheetDescription className="sr-only">
              Loading enquiry details and follow-up history
            </SheetDescription>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="nice-scrollbar h-full overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="font-display text-2xl uppercase leading-tight">
                  {detail.name}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Enquiry details and follow-up history
                </SheetDescription>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={detail.status} />
                  {sortedFollowUps[0]?.nextActionDate &&
                  detail.status !== "ENROLLED" &&
                  detail.status !== "LOST" ? (
                    isDateOverdue(sortedFollowUps[0].nextActionDate) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-brand-pink px-2.5 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white">
                        <Calendar className="size-3" aria-hidden="true" />
                        Overdue · {fmtDateShort(sortedFollowUps[0].nextActionDate)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 font-grotesk text-[10px] font-bold uppercase text-ink">
                        <Calendar className="size-3" aria-hidden="true" />
                        Next: {fmtDateShort(sortedFollowUps[0].nextActionDate)}
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            </div>

            {user.role === "ADMIN" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                List views mask phone/email for your role — full contact
                details are shown here.
              </p>
            ) : null}

            {/* Meta grid */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetaItem
                icon={Phone}
                label="Phone"
                value={detail.phone}
                href={`tel:${detail.phone}`}
              />
              <MetaItem
                icon={Mail}
                label="Email"
                value={detail.email}
                href={`mailto:${detail.email}`}
              />
              <MetaItem
                label="Course"
                value={detail.course?.title ?? "—"}
              />
              <div className="min-w-0">
                <p className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Source
                </p>
                <span className="mt-1 inline-block rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase">
                  {detail.source}
                </span>
              </div>
              <MetaItem label="Created" value={fmtDate(detail.createdAt)} />
              <MetaItem label="Updated" value={fmtDate(detail.updatedAt)} />
            </div>

            {/* Message */}
            <div className="mt-4">
              <p className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Message
              </p>
              {detail.message ? (
                <blockquote className="mt-1 rounded-lg border-2 border-dashed border-ink/30 bg-cream p-3 text-sm">
                  “{detail.message}”
                </blockquote>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  No message
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <Button
              asChild
              className="mt-5 w-full border-2 border-ink bg-white font-grotesk font-bold text-brand-green shadow-hard-sm hover:bg-brand-green hover:text-white"
            >
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open WhatsApp chat"
                onClick={() => trackWhatsApp("admin_lead", detail.id)}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp Lead
              </a>
            </Button>

            {/* Status control */}
            <div className="mt-6 space-y-1.5">
              <Label
                htmlFor="enquiry-status"
                className="font-grotesk text-xs font-bold uppercase"
              >
                Status
              </Label>
              <Select
                value={detail.status}
                onValueChange={(v) =>
                  void handleStatusChange(v as EnquiryStatus)
                }
                disabled={statusSaving}
              >
                <SelectTrigger
                  id="enquiry-status"
                  aria-label="Change enquiry status"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full border border-ink"
                          style={{ backgroundColor: STATUS_COLORS[s] }}
                          aria-hidden="true"
                        />
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusSaving ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Saving…
                </p>
              ) : null}
            </div>

            {/* Assignment (SUPER_ADMIN only) */}
            {isSuper ? (
              <div className="mt-4 space-y-1.5">
                <Label
                  htmlFor="enquiry-assignee"
                  className="font-grotesk text-xs font-bold uppercase"
                >
                  Assigned To
                </Label>
                <Select
                  value={detail.assignedTo?.id ?? UNASSIGNED}
                  onValueChange={(v) => void handleAssigneeChange(v)}
                  disabled={assignSaving}
                >
                  <SelectTrigger
                    id="enquiry-assignee"
                    aria-label="Change assignment"
                    className={SELECT_TRIGGER_CLASS}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {assignees.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                        {u.role === "SUPER_ADMIN" ? " (super admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignSaving ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2
                      className="size-3 animate-spin"
                      aria-hidden="true"
                    />
                    Saving…
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Follow-up history */}
            <section aria-label="Follow-up history" className="mt-6">
              <h3 className="font-display text-sm uppercase">
                Follow-up History
              </h3>
              {sortedFollowUps.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No follow-ups yet — add the first one below.
                </p>
              ) : (
                <ul className="ml-2 mt-4 space-y-4 border-l-2 border-ink pl-4">
                  {sortedFollowUps.map((f, idx) => (
                    <FollowUpItem
                      key={f.id}
                      f={f}
                      isLatest={idx === 0}
                      isClosed={
                        detail.status === "ENROLLED" || detail.status === "LOST"
                      }
                      onUpdate={handleUpdateFollowUp}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* Add follow-up */}
            <form
              onSubmit={handleAddFollowUp}
              className="brutal-card-sm mt-5 space-y-3 p-4"
            >
              <p className="font-grotesk text-xs font-bold uppercase tracking-wide">
                Add Follow-up
              </p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Called — interested in Aviation track. Schedule a demo for Saturday."
                aria-label="Follow-up note"
                className={`${FIELD_CLASS} resize-none`}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="fu-next-date"
                    className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Next action date (optional)
                  </Label>
                  <Input
                    id="fu-next-date"
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={followSaving}
                  className="font-grotesk font-bold uppercase shadow-hard-sm"
                >
                  {followSaving ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  Add Follow-up
                </Button>
              </div>
            </form>

            {/* Danger zone — SUPER_ADMIN only */}
            {isSuper ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-brand-red/60 bg-brand-red/5 p-4">
                <p className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-brand-red">
                  Danger Zone
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this enquiry and all of its follow-ups.
                  </p>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-2 border-ink bg-white font-grotesk font-bold text-brand-red hover:bg-brand-red hover:text-white"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </Button>
                    }
                    title="Delete enquiry permanently?"
                    description={`This deletes “${detail.name}” and all follow-up history forever. This action cannot be undone.`}
                    onConfirm={handleDelete}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
