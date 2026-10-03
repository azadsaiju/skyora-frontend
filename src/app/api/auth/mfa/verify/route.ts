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
  matchRecoveryCode,
  consumeRecoveryCode,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  loginLockState,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/mfa/verify { code }
 * Second step of an MFA-gated login: accepts a 6-digit TOTP code or one of
 * the single-use recovery codes. Shares the 5-fail → 15-min lockout with
 * the password step. On success issues the session and clears the pending
 * cookie.
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
    if (!user.totpEnabled || !user.totpSecret) {
      return jsonError(
        400,
        "Two-factor authentication is not active on this account.",
        "MFA_NOT_ENABLED"
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

    // 1. Try TOTP first.
    let totpOk = false;
    try {
      const result = await verify({ secret: user.totpSecret, token: code });
      totpOk = result.valid;
    } catch {
      totpOk = false;
    }

    // 2. Fall back to a single-use recovery code.
    let recoveryIndex = -1;
    if (!totpOk) {
      recoveryIndex = matchRecoveryCode(user.recoveryCodes, code);
    }

    if (!totpOk && recoveryIndex < 0) {
      recordLoginFailure(lockKey);
      await logAudit({
        userId: user.id,
        action: "MFA_CODE_FAILED",
        entity: "AUTH",
        entityId: user.id,
        ipAddress: ip,
        meta: { step: "login_verify" },
      });
      return jsonError(
        400,
        "That code didn't match. Enter a code from your authenticator app or a recovery code.",
        "MFA_CODE_INVALID"
      );
    }

    clearLoginFailures(lockKey);

    if (recoveryIndex >= 0 && user.recoveryCodes) {
      await consumeRecoveryCode(user.id, user.recoveryCodes, recoveryIndex);
      const remaining = Math.max(
        0,
        (JSON.parse(user.recoveryCodes) as string[]).length - 1
      );
      await logAudit({
        userId: user.id,
        action: "RECOVERY_CODE_USED",
        entity: "USER",
        entityId: user.id,
        ipAddress: ip,
        meta: { remaining },
      });
    }

    await logAudit({
      userId: user.id,
      action: "MFA_LOGIN_SUCCESS",
      entity: "AUTH",
      entityId: user.id,
      ipAddress: ip,
      meta: { method: totpOk ? "totp" : "recovery_code" },
    });

    // Rotate sessions and issue the real one.
    await db.session.deleteMany({ where: { userId: user.id } });
    const { token, maxAge } = await createSession(user.id, req);
    const res = respondWithSession(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          totpEnabled: user.totpEnabled,
        },
      },
      token,
      maxAge
    );
    return clearMfaCookie(res);
  } catch (e) {
    return handleApiError(e);
  }
}
