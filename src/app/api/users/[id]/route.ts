import { NextRequest, NextResponse } from "next/server";
import { userUpdateSchema, handleApiError, jsonError } from "@/lib/validators";
import {
  requireSuperAdmin,
  hashPassword,
  deleteAllUserSessions,
  getClientIp,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/users/[id] — SUPER_ADMIN only.
 * Supports: rename, activate/deactivate, password reset (forces change on
 * next login + kills sessions). A super admin cannot deactivate themselves
 * and the last active SUPER_ADMIN cannot be deactivated.
 */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const data = userUpdateSchema.parse(body);

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return jsonError(404, "User not found.", "NOT_FOUND");

    if (data.isActive === false) {
      if (target.id === actor.id) {
        return jsonError(400, "You cannot deactivate your own account.", "SELF_DEACTIVATE");
      }
      if (target.role === "SUPER_ADMIN") {
        const activeSupers = await db.user.count({
          where: { role: "SUPER_ADMIN", isActive: true, id: { not: target.id } },
        });
        if (activeSupers === 0) {
          return jsonError(
            400,
            "Cannot deactivate the last active super admin.",
            "LAST_SUPER_ADMIN"
          );
        }
      }
    }

    const updateData: {
      name?: string;
      isActive?: boolean;
      passwordHash?: string;
      mustChangePassword?: boolean;
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
      updateData.mustChangePassword = true;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Password reset invalidates every existing session of that user.
    if (data.password) await deleteAllUserSessions(id);

    const ip = getClientIp(req);
    if (data.isActive === true) {
      await logAudit({
        userId: actor.id,
        action: "USER_ACTIVATE",
        entity: "USER",
        entityId: id,
        ipAddress: ip,
        meta: { email: user.email },
      });
    } else if (data.isActive === false) {
      await logAudit({
        userId: actor.id,
        action: "USER_DEACTIVATE",
        entity: "USER",
        entityId: id,
        ipAddress: ip,
        meta: { email: user.email },
      });
    } else if (data.password) {
      await logAudit({
        userId: actor.id,
        action: "PASSWORD_RESET",
        entity: "USER",
        entityId: id,
        ipAddress: ip,
        meta: { email: user.email },
      });
    } else {
      await logAudit({
        userId: actor.id,
        action: "USER_UPDATE",
        entity: "USER",
        entityId: id,
        ipAddress: ip,
        meta: { changes: { name: data.name } },
      });
    }

    return NextResponse.json({ user });
  } catch (e) {
    return handleApiError(e);
  }
}
