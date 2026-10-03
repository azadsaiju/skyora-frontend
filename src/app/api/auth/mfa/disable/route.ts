import { NextRequest, NextResponse } from "next/server";
import {
  handleApiError,
  jsonError,
  mfaDisableSchema,
} from "@/lib/validators";
import { db } from "@/lib/db";
import {
  requireAuth,
  verifyPassword,
  getClientIp,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/mfa/disable { password }
 * Turns OFF 2FA for the signed-in account — ADMIN only. 2FA is MANDATORY
 * for SUPER_ADMIN accounts and can never be disabled (403).
 * Requires the account password as a second consent factor.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session.role === "SUPER_ADMIN") {
      return jsonError(
        403,
        "Two-factor authentication is mandatory for super admin accounts and cannot be disabled.",
        "MFA_MANDATORY"
      );
    }

    const body = await req.json().catch(() => null);
    const { password } = mfaDisableSchema.parse(body);

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return jsonError(401, "Account unavailable.", "UNAUTHORIZED");
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      await logAudit({
        userId: user.id,
        action: "MFA_DISABLE_FAILED",
        entity: "USER",
        entityId: user.id,
        ipAddress: getClientIp(req),
        meta: { reason: "invalid_password" },
      });
      return jsonError(401, "Incorrect password.", "INVALID_PASSWORD");
    }

    await db.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, recoveryCodes: null },
    });

    await logAudit({
      userId: user.id,
      action: "MFA_DISABLED",
      entity: "USER",
      entityId: user.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        totpEnabled: false,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
