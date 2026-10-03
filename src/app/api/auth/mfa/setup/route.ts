import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateSecret, generateURI } from "otplib";
import { handleApiError, jsonError } from "@/lib/validators";
import { db } from "@/lib/db";
import { resolveMfaActor, getClientIp } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/mfa/setup
 * Generates (or regenerates) a TOTP secret for the current actor and returns
 * an otpauth:// URI + QR code (data URL) + the plain secret for manual entry.
 * Works for both:
 *  - the forced enrollment right after login (mfa-pending cookie), and
 *  - optional self-service enrollment from the Security page (session).
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await resolveMfaActor(req);
    if (!actor) {
      return jsonError(
        401,
        "Verification session expired — please sign in again.",
        "MFA_PENDING_EXPIRED"
      );
    }

    const user = await db.user.findUnique({ where: { id: actor.userId } });
    if (!user || !user.isActive) {
      return jsonError(401, "Account unavailable.", "UNAUTHORIZED");
    }
    if (user.totpEnabled) {
      return jsonError(
        400,
        "Two-factor authentication is already enabled on this account.",
        "MFA_ALREADY_ENABLED"
      );
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: "Skyora Admin",
      label: user.email,
      secret,
    });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });

    // Store the pending secret — 2FA is NOT active until confirm succeeds.
    await db.user.update({
      where: { id: user.id },
      data: { totpSecret: secret },
    });

    await logAudit({
      userId: user.id,
      action: "MFA_SETUP_STARTED",
      entity: "USER",
      entityId: user.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ otpauthUrl, qrDataUrl, secret });
  } catch (e) {
    return handleApiError(e);
  }
}
