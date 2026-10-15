import { NextRequest, NextResponse } from "next/server";
import { whatsappTrackSchema, handleApiError, jsonError } from "@/lib/validators";
import { getClientIp, getSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/track/whatsapp — public WhatsApp deep-link click tracking
 * (Prompt 10). No cookies required (visitors are anonymous); every click
 * lands in the audit trail as WHATSAPP_CLICKED with the page context and,
 * when a counsellor opens a lead, the enquiry id.
 *
 * Abuse control: 30 events per IP per minute; payloads Zod-validated;
 * never stores PII beyond the IP already used across audit rows.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const limit = checkRateLimit(`wa-track:${ip}`, 30, 60_000);
    if (!limit.allowed) {
      return jsonError(429, "Too many events.", "RATE_LIMITED", {
        retryAfterSec: limit.retryAfterSec,
      });
    }

    const body = (await req.json().catch(() => null)) as unknown;
    const data = whatsappTrackSchema.parse(body);

    // Attach the staff user when a counsellor clicks a lead in the drawer.
    const sessionUser = await getSessionUser(req).catch(() => null);

    await logAudit({
      userId: sessionUser?.id ?? null,
      action: "WHATSAPP_CLICKED",
      entity: "whatsapp",
      entityId: data.enquiryId ?? null,
      ipAddress: ip,
      meta: { context: data.context },
    });

    // 202 Accepted — the beacon is fire-and-forget; body is informational.
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (e) {
    return handleApiError(e);
  }
}
