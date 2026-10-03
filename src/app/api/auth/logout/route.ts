import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/validators";
import {
  getSessionUser,
  deleteSession,
  clearSessionCookie,
  getClientIp,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — invalidates the server-side session + clears cookie. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    await deleteSession(req);
    if (user) {
      await logAudit({
        userId: user.id,
        action: "LOGOUT",
        entity: "AUTH",
        entityId: user.id,
        ipAddress: getClientIp(req),
      });
    }
    return clearSessionCookie(NextResponse.json({ ok: true }));
  } catch (e) {
    return handleApiError(e);
  }
}
