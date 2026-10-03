import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import {
  handleApiError,
  jsonError,
  mfaCodeSchema,
} from "@/lib/validators";
import { db } from "@/lib/db";
import {
  resolveMfaActor,
  createSession,
  respondWithSession,
  clearMfaCookie,
  getClientIp,
  generateRecoveryCodes,
  hashRecoveryCodes,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  loginLockState,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/mfa/confirm { code }
 * Completes TOTP enrollment: verifies the first code against the pending
 * secret, enables 2FA, hands back 10 single-use recovery codes (plaintext,
 * shown exactly once) and issues the real session.
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

    const body = await req.json().catch(() => null);
    const { code } = mfaCodeSchema.parse(body);

    const user = await db.user.findUnique({ where: { id: actor.userId } });
    if (!user || !user.isActive) {
      return jsonError(401, "Account unavailable.", "UNAUTHORIZED");
    }
    if (user.totpEnabled || !user.totpSecret) {
      return jsonError(
        400,
        "No pending two-factor enrollment found. Sign in and try again.",
        "MFA_NOT_PENDING"
      );
    }

    const ip = getClientIp(req);
    const lockKey = `${user.email}|${ip}`;
    const lock = loginLockState(lockKey);
    if (lock.locked) {
      const mins = Math.max(1, Math.ceil(lock.retryAfterSec / 60));
      return jsonError(
        429,
        `Too many failed attempts. Account temporarily locked — try again in ${mins} minute${mins > 1 ? "s" : ""}.`,
        "LOGIN_LOCKED",
        { retryAfterSec: lock.retryAfterSec }
      );
    }

    const result = await verify({ secret: user.totpSecret, token: code });
    if (!result.valid) {
      recordLoginFailure(lockKey);
      await logAudit({
        userId: user.id,
        action: "MFA_CODE_FAILED",
        entity: "AUTH",
        entityId: user.id,
        ipAddress: ip,
        meta: { step: "enroll_confirm" },
      });
      return jsonError(
        400,
        "That code didn't match. Check your authenticator app and try again.",
        "MFA_CODE_INVALID"
      );
    }

    clearLoginFailures(lockKey);

    // Enable 2FA + issue 10 single-use recovery codes (hashes stored).
    const recoveryCodes = generateRecoveryCodes(10);
    await db.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpSecret: user.totpSecret,
        recoveryCodes: hashRecoveryCodes(recoveryCodes),
      },
    });

    await logAudit({
      userId: user.id,
      action: "MFA_ENABLED",
      entity: "USER",
      entityId: user.id,
      ipAddress: ip,
      meta: { recoveryCodesIssued: recoveryCodes.length },
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "SUPER_ADMIN" | "ADMIN",
      mustChangePassword: user.mustChangePassword,
      totpEnabled: true,
    };

    if (actor.viaSession) {
      // Self-service enrollment from the Security page — session stays valid.
      return NextResponse.json({ recoveryCodes, user: sessionUser });
    }

    // Forced enrollment after login — rotate sessions + issue session.
    await db.session.deleteMany({ where: { userId: user.id } });
    const { token, maxAge } = await createSession(user.id, req);
    const res = respondWithSession(
      { recoveryCodes, user: sessionUser },
      token,
      maxAge
    );
    return clearMfaCookie(res);
  } catch (e) {
    return handleApiError(e);
  }
}
