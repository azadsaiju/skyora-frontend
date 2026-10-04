import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/validators";
import type { Role, SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "skyora_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ── MFA PENDING COOKIE ───────────────────────────────────────────────────────
// Issued after a successful PASSWORD check when TOTP is required. Proves the
// user knows the password but has NOT completed 2FA yet — never grants API
// access (admin routes only accept the real session cookie).
export const MFA_COOKIE = "skyora_mfa";
// 15 minutes — covers first-time enrollment (installing an authenticator app,
// scanning the QR, entering the first code). The timer restarts when the QR
// is displayed (setup route refreshes the cookie).
const MFA_TTL_SEC = 900;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn(
      "[auth] AUTH_SECRET is not set — falling back to an INSECURE dev secret. Set AUTH_SECRET in production!"
    );
    return "skyora-insecure-dev-secret";
  }
  return secret;
}

function signMfaValue(userId: string, issuedAtMs: number): string {
  const payload = `${userId}.${issuedAtMs}`;
  const sig = createHmac("sha256", authSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyMfaValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, issuedAt, sig] = parts as [string, string, string];
  const expected = createHmac("sha256", authSecret())
    .update(`${userId}.${issuedAt}`)
    .digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(issuedAt) > MFA_TTL_SEC * 1000) return null;
  return userId;
}

export function setMfaCookie(res: NextResponse, userId: string): NextResponse {
  res.cookies.set(MFA_COOKIE, signMfaValue(userId, Date.now()), {
    ...cookieOptions(MFA_TTL_SEC),
    maxAge: MFA_TTL_SEC,
  });
  return res;
}

export function clearMfaCookie(res: NextResponse): NextResponse {
  res.cookies.set(MFA_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return res;
}

function readCookie(req: NextRequest | Request, name: string): string | null {
  if (
    "cookies" in req &&
    typeof (req as NextRequest).cookies?.get === "function"
  ) {
    return (req as NextRequest).cookies.get(name)?.value ?? null;
  }
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/**
 * Resolve the user behind an MFA challenge: either via the short-lived
 * mfa-pending cookie (post-password, pre-session) or — for self-service
 * enrollment from the Security page — via a fully authenticated session.
 */
export async function resolveMfaActor(
  req: NextRequest | Request
): Promise<{ userId: string; viaSession: boolean } | null> {
  const sessionUser = await getSessionUser(req);
  if (sessionUser) return { userId: sessionUser.id, viaSession: true };
  const pendingId = verifyMfaValue(readCookie(req, MFA_COOKIE));
  if (!pendingId) return null;
  const user = await db.user.findUnique({ where: { id: pendingId } });
  if (!user || !user.isActive) return null;
  return { userId: user.id, viaSession: false };
}

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

// ── RECOVERY CODES (single-use, 2FA fallback) ───────────────────────────────
/** High-entropy random codes → SHA-256 is the appropriate hash (not bcrypt). */
export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 10; j++) code += alphabet[randomInt(alphabet.length)];
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

export function hashRecoveryCodes(codes: string[]): string {
  return JSON.stringify(codes.map((c) => hashToken(normalizeRecoveryCode(c))));
}

function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Returns the index of the matching unused code, or -1. */
export function matchRecoveryCode(
  storedJson: string | null,
  candidate: string
): number {
  if (!storedJson) return -1;
  let hashes: string[];
  try {
    hashes = JSON.parse(storedJson) as string[];
  } catch {
    return -1;
  }
  const candidateHash = hashToken(normalizeRecoveryCode(candidate));
  return hashes.findIndex((h) => {
    const a = Buffer.from(h, "hex");
    const b = Buffer.from(candidateHash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** Remove the used code (by index) and persist the remaining hashes. */
export async function consumeRecoveryCode(
  userId: string,
  storedJson: string,
  usedIndex: number
): Promise<void> {
  const hashes = JSON.parse(storedJson) as string[];
  hashes.splice(usedIndex, 1);
  await db.user.update({
    where: { id: userId },
    data: { recoveryCodes: JSON.stringify(hashes) },
  });
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
  return readCookie(req, SESSION_COOKIE);
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
    totpEnabled: session.user.totpEnabled,
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
