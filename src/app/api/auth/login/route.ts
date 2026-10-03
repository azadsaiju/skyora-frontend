import { NextRequest } from "next/server";
import {
  loginSchema,
  handleApiError,
  jsonError,
  ApiError,
} from "@/lib/validators";
import {
  verifyPassword,
  createSession,
  respondWithSession,
  getClientIp,
} from "@/lib/auth";
import { db } from "@/lib/db";
import {
  loginLockState,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Rate limited: 5 failed attempts (per email+IP) → 15-minute lockout.
 * On success: rotates sessions (old ones invalidated), sets httpOnly cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email, password } = loginSchema.parse(body);
    const ip = getClientIp(req);
    const lockKey = `${email}|${ip}`;

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

    const user = await db.user.findUnique({ where: { email } });
    const passwordOk = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !passwordOk) {
      recordLoginFailure(lockKey);
      await logAudit({
        userId: user?.id ?? null,
        action: "LOGIN_FAILED",
        entity: "AUTH",
        entityId: email,
        ipAddress: ip,
        meta: { reason: user ? "invalid_password" : "unknown_email" },
      });
      // Generic message — never reveal whether the account exists.
      throw new ApiError(401, "Invalid email or password.");
    }

    if (!user.isActive) {
      await logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "AUTH",
        entityId: user.id,
        ipAddress: ip,
        meta: { reason: "account_disabled" },
      });
      throw new ApiError(403, "This account has been deactivated.");
    }

    clearLoginFailures(lockKey);

    // Rotate sessions: invalidate any previous sessions for this user.
    await db.session.deleteMany({ where: { userId: user.id } });
    const { token, maxAge } = await createSession(user.id, req);

    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "AUTH",
      entityId: user.id,
      ipAddress: ip,
    });

    return respondWithSession(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      },
      token,
      maxAge
    );
  } catch (e) {
    return handleApiError(e);
  }
}
