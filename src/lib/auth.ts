import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/validators";
import type { Role, SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "skyora_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ── PASSWORDS ────────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── SESSIONS ─────────────────────────────────────────────────────────────────
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

function readSessionToken(req: NextRequest | Request): string | null {
  if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    return (req as NextRequest).cookies.get(SESSION_COOKIE)?.value ?? null;
  }
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    sameSite: "strict" as const,
    // Secure in production (HTTPS); dev server runs on plain HTTP.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}

/** Creates a fresh session row and returns the raw token for the cookie. */
export async function createSession(
  userId: string,
  req: NextRequest | Request
): Promise<{ token: string; maxAge: number }> {
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
    },
  });
  return { token, maxAge: SESSION_TTL_MS / 1000 };
}

/** Resolves the authenticated user from the session cookie (or null). */
export async function getSessionUser(
  req: NextRequest | Request
): Promise<SessionUser | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    // Opportunistic cleanup of the expired session.
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    mustChangePassword: session.user.mustChangePassword,
  };
}

export function setSessionCookie(
  res: NextResponse,
  token: string,
  maxAgeSec: number
): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAgeSec));
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return res;
}

export async function deleteSession(req: NextRequest | Request): Promise<void> {
  const token = readSessionToken(req);
  if (!token) return;
  await db.session
    .delete({ where: { tokenHash: hashToken(token) } })
    .catch(() => undefined);
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

// ── ROUTE GUARDS (server-side RBAC — never trust the client) ─────────────────
/**
 * Require any active, authenticated admin session.
 * Unless `allowPendingPasswordChange`, blocks users who must change
 * their password first (seeded accounts, password resets).
 */
export async function requireAuth(
  req: NextRequest | Request,
  opts?: { allowPendingPasswordChange?: boolean }
): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
  if (user.mustChangePassword && !opts?.allowPendingPasswordChange) {
    throw new ApiError(
      403,
      "You must change your password before continuing.",
      "PASSWORD_CHANGE_REQUIRED"
    );
  }
  return user;
}

/** Require a SUPER_ADMIN session (users, audit logs, deletes). */
export async function requireSuperAdmin(req: NextRequest | Request): Promise<SessionUser> {
  const user = await requireAuth(req);
  if (user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Forbidden — super admin access required.",
      "FORBIDDEN"
    );
  }
  return user;
}

/** Attach session cookie to a JSON response in one call. */
export function respondWithSession(
  data: unknown,
  token: string,
  maxAgeSec: number,
  status = 200
): NextResponse {
  const res = NextResponse.json(data, { status });
  return setSessionCookie(res, token, maxAgeSec);
}
