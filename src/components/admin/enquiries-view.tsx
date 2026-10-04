"use client";

/**
 * Enquiries — the core admin view. Filterable, paginated list with Excel
 * export, desktop table + mobile card list, and a detail drawer for each
 * enquiry. NOTE for ADMIN role: the server masks phone/email in this list
 * (values are rendered exactly as returned — never unmasked client-side).
 */

import * as React from "react";
import {
  AlarmClock,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { isBefore, parseISO, startOfToday } from "date-fns";

import { api, qs } from "@/lib/client";
import {
  ENQUIRY_STATUSES,
  type CourseDTO,
  type EnquiryListResponseDTO,
  type EnquiryStatus,
  type SessionUser,
  type Track,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnquiryDrawer } from "@/components/admin/enquiry-drawer";
import { ImportCsvDialog } from "@/components/admin/import-dialog";
import {
  AdminPageHeader,
  EmptyState,
  FIELD_CLASS,
  SELECT_TRIGGER_CLASS,
  StatusBadge,
  TableSkeleton,
  fmtDateShort,
  toastApiError,
} from "@/components/admin/admin-ui";

const PAGE_SIZE = 10;
const ALL = "__all__";

type FollowupFilter = "" | "today" | "overdue";
type AssigneeFilter = "" | "me" | "unassigned";

interface Filters {
  search: string;
  courseId: string;
  status: EnquiryStatus | "";
  assignedToId: AssigneeFilter;
  from: string;
  to: string;
  followup: FollowupFilter;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  courseId: "",
  status: "",
  assignedToId: "",
  from: "",
  to: "",
  followup: "",
};

function TrackBadge({ track }: { track: Track }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white",
        track === "AVIATION" ? "bg-brand-blue" : "bg-brand-cyan"
      )}
    >
      {track}
    </span>
  );
}

function NextActionCell({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground">—</span>;
  const overdue = isBefore(parseISO(iso), startOfToday());
  return (
    <span className="inline-flex flex-col">
      <span
        className={cn(
          "whitespace-nowrap font-grotesk font-bold",
          overdue && "text-brand-red"
        )}
      >
        {fmtDateShort(iso)}
      </span>
      {overdue ? (
        <span className="text-[10px] font-bold uppercase text-brand-red">
          Overdue
        </span>
      ) : null}
    </span>
  );
}

export function EnquiriesView({ user }: { user: SessionUser }) {
  const [searchInput, setSearchInput] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<EnquiryListResponseDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [courses, setCourses] = React.useState<CourseDTO[]>([]);
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [importOpen, setImportOpen] = React.useState(false);

  const isMasked = user.role === "ADMIN";

  // Debounce the search box (350 ms).
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      setFilters((f) => (f.search === next ? f : { ...f, search: next }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Course filter options (cached once).
  React.useEffect(() => {
    void api<{ courses: CourseDTO[] }>("/api/courses")
      .then((r) => setCourses(r.courses))
      .catch((err) => toastApiError(err, "Could not load course filters."));
  }, []);

  // Build query params from the current filters (no paging — shared with export).
  const baseQuery = React.useCallback((): string => {
    return qs({
      search: filters.search || undefined,
      courseId: filters.courseId || undefined,
      status: filters.status || undefined,
      // "me" is a UI concept — send the real user id to the server.
      assignedToId:
        filters.assignedToId === "me"
          ? user.id
          : filters.assignedToId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      followup: filters.followup || undefined,
    });
  }, [filters, user.id]);

  // Load the list whenever filters / page / refreshKey change.
  React.useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const base = baseQuery();
        const res = await api<EnquiryListResponseDTO>(
          `/api/enquiries${base}${base ? "&" : "?"}page=${page}&pageSize=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        setData(res);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        toastApiError(err, "Could not load enquiries.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [baseQuery, page, refreshKey]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.courseId !== "" ||
    filters.status !== "" ||
    filters.assignedToId !== "" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.followup !== "";

  function clearFilters() {
    setSearchInput("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize)))
    : 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enquiries"
        description={
          isMasked
            ? "Contact details are masked in this list — open a record for full values."
            : "Every lead from the public site, with follow-up tracking."
        }
      >
        <span className="hidden font-grotesk text-sm font-bold text-muted-foreground sm:inline">
          {data ? `${data.total} total` : "…"}
        </span>
        <Button
          variant="outline"
          onClick={() => setImportOpen(true)}
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <Upload className="size-4" aria-hidden="true" />
          Import CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = `/api/enquiries/export${baseQuery()}`;
          }}
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <Download className="size-4" aria-hidden="true" />
          Download Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const base = baseQuery();
            window.location.href = `/api/enquiries/export${base}${base ? "&" : "?"}format=csv`;
          }}
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <FileText className="size-4" aria-hidden="true" />
          Download CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          aria-label="Refresh enquiries"
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <RefreshCw
            className={cn("size-4", loading && "animate-spin")}
            aria-hidden="true"
          />
        </Button>
      </AdminPageHeader>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="brutal-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="enquiry-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, phone, email…"
              aria-label="Search name, phone or email"
              className={`${FIELD_CLASS} pl-9`}
            />
          </div>

          <Select
            value={filters.status || ALL}
            onValueChange={(v) =>
              updateFilter("status", v === ALL ? "" : (v as EnquiryStatus))
            }
          >
            <SelectTrigger
              aria-label="Filter by status"
              className={SELECT_TRIGGER_CLASS}
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ENQUIRY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.courseId || ALL}
            onValueChange={(v) => updateFilter("courseId", v === ALL ? "" : v)}
          >
            <SelectTrigger
              aria-label="Filter by course"
              className={SELECT_TRIGGER_CLASS}
            >
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assignedToId || ALL}
            onValueChange={(v) =>
              updateFilter(
                "assignedToId",
                v === ALL ? "" : (v as AssigneeFilter)
              )
            }
          >
            <SelectTrigger
              aria-label="Filter by assignee"
              className={SELECT_TRIGGER_CLASS}
            >
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All assignees</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={filters.followup === "today" ? "default" : "outline"}
              aria-pressed={filters.followup === "today"}
              onClick={() =>
                updateFilter(
                  "followup",
                  filters.followup === "today" ? "" : "today"
                )
              }
              className={cn(
                "font-grotesk font-bold",
                filters.followup !== "today" && "border-2 border-ink bg-white"
              )}
            >
              <Bell className="size-4" aria-hidden="true" />
              Due Today
            </Button>
            <Button
              type="button"
              variant={filters.followup === "overdue" ? "default" : "outline"}
              aria-pressed={filters.followup === "overdue"}
              onClick={() =>
                updateFilter(
                  "followup",
                  filters.followup === "overdue" ? "" : "overdue"
                )
              }
              className={cn(
                "font-grotesk font-bold",
                filters.followup === "overdue"
                  ? "bg-brand-red hover:bg-brand-red/90"
                  : "border-2 border-ink bg-white"
              )}
            >
              <AlarmClock className="size-4" aria-hidden="true" />
              Overdue
            </Button>
          </div>

          <Input
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter("from", e.target.value)}
            aria-label="Created from date"
            className={FIELD_CLASS}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter("to", e.target.value)}
            aria-label="Created to date"
            className={FIELD_CLASS}
          />
        </div>

        {hasActiveFilters ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="font-grotesk font-bold text-muted-foreground hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : !data || data.items.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={Inbox}
            title="No enquiries found"
            message={
              hasActiveFilters
                ? "Try adjusting or clearing the filters."
                : "New enquiries from the public site will appear here."
            }
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
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Name
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Course
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Contact
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Status
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Assigned
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Next Action
                      </TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">
                        Created
                      </TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((e) => (
                      <TableRow
                        key={e.id}
                        onClick={() => setDrawerId(e.id)}
                        className="cursor-pointer hover:bg-cream"
                      >
                        <TableCell>
                          <div className="font-bold">{e.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {e.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {e.course ? (
                            <div>
                              <div className="font-grotesk font-bold">
                                {e.course.title}
                              </div>
                              <div className="mt-1">
                                <TrackBadge track={e.course.track} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-grotesk text-sm">
                          {e.phone}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={e.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {e.assignedTo ? (
                            e.assignedTo.name
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <NextActionCell iso={e.latestNextActionDate} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {fmtDateShort(e.createdAt)}
                        </TableCell>
                        <TableCell>
                          <ChevronRight
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
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
            {data.items.map((e) => {
              const overdue =
                e.latestNextActionDate !== null &&
                isBefore(parseISO(e.latestNextActionDate), startOfToday());
              return (
                <div key={e.id} className="brutal-card-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-grotesk font-bold">
                        {e.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.email}
                      </p>
                      <p className="mt-0.5 font-grotesk text-sm">{e.phone}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold uppercase text-muted-foreground">
                        Course
                      </p>
                      <p className="truncate font-grotesk font-bold">
                        {e.course?.title ?? "—"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold uppercase text-muted-foreground">
                        Assigned
                      </p>
                      <p className="truncate font-grotesk font-bold">
                        {e.assignedTo?.name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-muted-foreground">
                        Next action
                      </p>
                      <p
                        className={cn(
                          "font-grotesk font-bold",
                          overdue && "text-brand-red"
                        )}
                      >
                        {e.latestNextActionDate
                          ? fmtDateShort(e.latestNextActionDate)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-muted-foreground">
                        Created
                      </p>
                      <p className="font-grotesk font-bold">
                        {fmtDateShort(e.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrawerId(e.id)}
                    className="mt-3 w-full border-2 border-ink bg-white font-grotesk font-bold"
                  >
                    View Details
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-grotesk text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {data.total} enquiries · Page {data.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-2 border-ink bg-white font-grotesk font-bold"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="border-2 border-ink bg-white font-grotesk font-bold"
              >
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {drawerId ? (
        <EnquiryDrawer
          enquiryId={drawerId}
          user={user}
          open
          onClose={() => setDrawerId(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      ) : null}

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
