import { NextRequest, NextResponse } from "next/server";
import { auditLogQuerySchema, handleApiError } from "@/lib/validators";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AuditLogListResponseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit-logs — SUPER_ADMIN only. ADMIN receives 403 (even via
 * direct API calls). Paginated, filterable by action/entity.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const sp = req.nextUrl.searchParams;
    const query = auditLogQuerySchema.parse(Object.fromEntries(sp.entries()));

    const where = {
      ...(query.action && { action: { contains: query.action } }),
      ...(query.entity && { entity: query.entity }),
    };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [total, rows] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const payload: AuditLogListResponseDTO = {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        ipAddress: row.ipAddress,
        meta: row.meta,
        createdAt: row.createdAt.toISOString(),
        user: row.user,
      })),
      total,
      page,
      pageSize,
    };
    return NextResponse.json(payload);
  } catch (e) {
    return handleApiError(e);
  }
}
