import { NextRequest } from "next/server";
import {
  changePasswordSchema,
  handleApiError,
  ApiError,
} from "@/lib/validators";
import {
  requireAuth,
  verifyPassword,
  hashPassword,
  createSession,
  respondWithSession,
  deleteAllUserSessions,
  getClientIp,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/change-password
 * Verifies the current password, sets a new hash, clears the
 * mustChangePassword flag, rotates the session.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, { allowPendingPasswordChange: true });
    const body = await req.json().catch(() => null);
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");

    const ok = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!ok) throw new ApiError(400, "Current password is incorrect.");

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    // Rotate: kill all old sessions, issue a fresh one.
    await deleteAllUserSessions(user.id);
    const { token, maxAge } = await createSession(user.id, req);

    await logAudit({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      entity: "USER",
      entityId: user.id,
      ipAddress: getClientIp(req),
    });

    return respondWithSession(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: false,
        },
      },
      token,
      maxAge
    );
  } catch (e) {
    return handleApiError(e);
  }
}
