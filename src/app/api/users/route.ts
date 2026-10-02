import { NextRequest, NextResponse } from "next/server";
import { userCreateSchema, handleApiError, jsonError } from "@/lib/validators";
import { requireSuperAdmin, hashPassword, getClientIp } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/users — SUPER_ADMIN only. ADMIN receives 403.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
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
    return NextResponse.json({ users });
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * POST /api/users — SUPER_ADMIN only. Creates an admin/super-admin account.
 * New accounts are flagged mustChangePassword=true.
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireSuperAdmin(req);
    const body = await req.json().catch(() => null);
    const data = userCreateSchema.parse(body);

    const emailTaken = await db.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      return jsonError(409, "An account with this email already exists.", "EMAIL_TAKEN");
    }

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        mustChangePassword: true,
      },
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

    await logAudit({
      userId: actor.id,
      action: "USER_CREATE",
      entity: "USER",
      entityId: user.id,
      ipAddress: getClientIp(req),
      meta: { email: user.email, role: user.role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
