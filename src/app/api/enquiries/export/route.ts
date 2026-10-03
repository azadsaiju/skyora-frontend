import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { enquiryQuerySchema, handleApiError } from "@/lib/validators";
import { requireAuth, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildEnquiryWhere } from "@/lib/enquiry-filters";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * GET /api/enquiries/export — real .xlsx via ExcelJS.
 * Applies the same filters as the list endpoint. Every export writes an
 * AuditLog entry (action=EXPORT) with row count + who exported.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const sp = req.nextUrl.searchParams;
    const query = enquiryQuerySchema.parse(Object.fromEntries(sp.entries()));

    const where = buildEnquiryWhere(query);
    const rows = await db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true, track: true } },
        assignedTo: { select: { name: true } },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { note: true, nextActionDate: true },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Skyora Admin Portal";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Enquiries", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "Course", key: "course", width: 26 },
      { header: "Track", key: "track", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Source", key: "source", width: 16 },
      { header: "Assigned To", key: "assignedTo", width: 18 },
      { header: "Next Action", key: "nextAction", width: 14 },
      { header: "Latest Note", key: "latestNote", width: 40 },
      { header: "Message", key: "message", width: 40 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Header styling — bold black on light gray.
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF0A0A0A" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFAF9F6" },
    };
    headerRow.border = {
      bottom: { style: "thin", color: { argb: "FF0A0A0A" } },
    };

    for (const row of rows) {
      sheet.addRow({
        name: row.name,
        phone: row.phone,
        email: row.email,
        course: row.course?.title ?? "—",
        track: row.course?.track ?? "—",
        status: row.status,
        source: row.source,
        assignedTo: row.assignedTo?.name ?? "Unassigned",
        nextAction: row.followUps[0]?.nextActionDate
          ? row.followUps[0].nextActionDate.toISOString().slice(0, 10)
          : "",
        latestNote: row.followUps[0]?.note ?? "",
        message: row.message ?? "",
        createdAt: row.createdAt.toISOString().replace("T", " ").slice(0, 16),
      });
    }

    sheet.autoFilter = { from: "A1", to: { row: 1, column: 12 } };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `skyora-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`;

    await logAudit({
      userId: user.id,
      action: "EXPORT",
      entity: "ENQUIRY",
      entityId: null,
      ipAddress: getClientIp(req),
      meta: {
        rows: rows.length,
        filters: {
          search: query.search ?? null,
          courseId: query.courseId ?? null,
          status: query.status ?? null,
          assignedToId: query.assignedToId ?? null,
          from: query.from ?? null,
          to: query.to ?? null,
          followup: query.followup ?? null,
        },
      },
    });

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": MIME_XLSX,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
