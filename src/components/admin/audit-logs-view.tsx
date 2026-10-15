"use client";

/**
 * Audit logs — SUPER_ADMIN only (server 403s ADMIN). Filterable by action
 * and entity, paginated, with color-coded action badges. Every security
 * -relevant event (logins, exports, deletes, status changes…) lands here.
 */

import * as React from "react";
import { RefreshCw, ScrollText } from "lucide-react";

import { api, qs } from "@/lib/client";
import type { AuditLogDTO, AuditLogListResponseDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  EmptyState,
  FIELD_CLASS,
  TableSkeleton,
  fmtDateTime,
  toastApiError,
} from "@/components/admin/admin-ui";

const PAGE_SIZE = 20;

/** Color families for audit actions (failed first — LOGIN_FAILED contains LOGIN). */
function actionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.includes("FAILED")) return "#DC2626"; // red
  if (a.startsWith("MFA") || a.startsWith("RECOVERY_CODE"))
    return "#A855F7"; // purple — 2FA lifecycle events
  if (a.startsWith("WHATSAPP")) return "#16A34A"; // green — deep-link clicks
  if (a.startsWith("REMINDER")) return "#FF7A00"; // orange — digest runs
  if (a.includes("IMPORT")) return "#00B8D9"; // cyan — bulk imports
  if (a.includes("LOGIN")) return "#16A34A"; // green
  if (a.includes("EXPORT")) return "#2563EB"; // blue
  if (a.includes("DELETE")) return "#FF2E63"; // pink
  if (a.includes("CREATE")) return "#00B8D9"; // cyan
  if (
    a.includes("UPDATE") ||
    a.includes("CHANGE") ||
    a.includes("RESET") ||
    a.includes("ACTIVATE")
  )
    return "#FF7A00"; // orange
  return "#6B7280"; // gray
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className="inline-block max-w-40 truncate whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase text-white"
      style={{ backgroundColor: actionColor(action) }}
      title={action}
    >
      {action}
    </span>
  );
}

function LogMeta({ log }: { log: AuditLogDTO }) {
  return (
    <div className="space-y-0.5">
      <p className="font-grotesk text-sm font-bold">
        {log.user?.name ?? "Unknown user"}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {log.user?.email ?? "—"}
      </p>
    </div>
  );
}

export function AuditLogsView() {
  const [actionInput, setActionInput] = React.useState("");
  const [entityInput, setEntityInput] = React.useState("");
  const [action, setAction] = React.useState("");
  const [entity, setEntity] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<AuditLogListResponseDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Debounce filter inputs (350 ms).
  React.useEffect(() => {
    const t = setTimeout(() => {
      setAction(actionInput.trim().toUpperCase());
      setEntity(entityInput.trim().toUpperCase());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [actionInput, entityInput]);

  React.useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const query = qs({
          action: action || undefined,
          entity: entity || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        const res = await api<AuditLogListResponseDTO>(
          `/api/audit-logs${query}`,
          { signal: controller.signal }
        );
        setData(res);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        toastApiError(err, "Could not load audit logs.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [action, entity, page, refreshKey]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize)))
    : 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Logs"
        description="Security-relevant activity across the admin portal."
      >
        <Button
          variant="outline"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="border-2 border-ink bg-white font-grotesk font-bold"
        >
          <RefreshCw
            className={`size-4${loading ? " animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </AdminPageHeader>

      <div className="brutal-card flex flex-col gap-3 p-4 md:flex-row">
        <Input
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          placeholder="Filter action e.g. EXPORT"
          aria-label="Filter by action"
          className={`${FIELD_CLASS} md:flex-1`}
        />
        <Input
          value={entityInput}
          onChange={(e) => setEntityInput(e.target.value)}
          placeholder="Filter entity e.g. ENQUIRY"
          aria-label="Filter by entity"
          className={`${FIELD_CLASS} md:flex-1`}
        />
      </div>

      {loading && !data ? (
        <TableSkeleton rows={6} />
      ) : !data || data.items.length === 0 ? (
        <div className="brutal-card">
          <EmptyState
            icon={ScrollText}
            title="No audit logs found"
            message="Activity will appear here as admins use the portal. Try clearing the filters."
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
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Time</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">User</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Action</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Entity</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Entity ID</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">IP</TableHead>
                      <TableHead className="font-grotesk text-xs font-bold uppercase">Meta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((log) => (
                      <TableRow key={log.id} className="hover:bg-cream">
                        <TableCell className="whitespace-nowrap font-grotesk text-sm">
                          {fmtDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <LogMeta log={log} />
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={log.action} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-grotesk text-xs font-bold">
                          {log.entity}
                        </TableCell>
                        <TableCell>
                          <span
                            className="block max-w-24 truncate font-mono text-xs"
                            title={log.entityId ?? undefined}
                          >
                            {log.entityId ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{log.ipAddress ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="block w-48 truncate font-mono text-xs text-muted-foreground"
                            title={log.meta ?? undefined}
                          >
                            {log.meta ?? "—"}
                          </span>
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
            {data.items.map((log) => (
              <div key={log.id} className="brutal-card-sm space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <ActionBadge action={log.action} />
                  <span className="whitespace-nowrap font-grotesk text-xs text-muted-foreground">
                    {fmtDateTime(log.createdAt)}
                  </span>
                </div>
                <LogMeta log={log} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-bold uppercase text-muted-foreground">Entity</p>
                    <p className="font-grotesk font-bold">{log.entity}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold uppercase text-muted-foreground">IP</p>
                    <p className="truncate font-mono">{log.ipAddress ?? "—"}</p>
                  </div>
                </div>
                {log.meta ? (
                  <p className="break-all rounded-lg bg-cream p-2 font-mono text-[11px] text-muted-foreground">
                    {log.meta}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-grotesk text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {data.total} entries · Page {data.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-2 border-ink bg-white font-grotesk font-bold"
              >
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
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
