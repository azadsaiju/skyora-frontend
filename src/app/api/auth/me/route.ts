import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/validators";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — current session user (or 401). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return jsonError(401, "Unauthorized", "UNAUTHORIZED");
    }
    return NextResponse.json({ user });
  } catch (e) {
    return handleApiError(e);
  }
}
