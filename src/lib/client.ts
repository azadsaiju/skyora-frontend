"use client";

/**
 * Small typed fetch helper for client components.
 * Throws an Error with the server's `error` message on non-2xx responses.
 *
 * Cookie-free fallback (preview panels / third-party iframes often block
 * cookie writes): the auth endpoints also return tokens in the response body.
 * - Session token → stored (localStorage + memory) and sent as
 *   `Authorization: Bearer` on every call.
 * - MFA pending token → stored and sent as `x-mfa-pending` until the 2FA
 *   challenge completes (short-lived server-side regardless of storage).
 * The httpOnly cookies remain the primary mechanism wherever they work.
 */

const SESSION_KEY = "skyora.sessionToken";
const MFA_PENDING_KEY = "skyora.mfaPending";

let memorySession: string | null = null;
let memoryMfa: string | null = null;

function storageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked (some iframes) — memory fallback covers us
  }
}

function storageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore — memory fallback still in play
  }
}

function storageRemove(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ── Session token ────────────────────────────────────────────────────────────
export function getSessionToken(): string | null {
  if (memorySession) return memorySession;
  memorySession = storageGet(SESSION_KEY);
  return memorySession;
}

export function setSessionToken(token: string): void {
  memorySession = token;
  storageSet(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  memorySession = null;
  storageRemove(SESSION_KEY);
}

// ── MFA pending token (post-password, pre-2FA) ──────────────────────────────
function getMfaPending(): string | null {
  if (memoryMfa) return memoryMfa;
  memoryMfa = storageGet(MFA_PENDING_KEY);
  return memoryMfa;
}

export function setMfaPending(token: string): void {
  memoryMfa = token;
  storageSet(MFA_PENDING_KEY, token);
}

export function clearMfaPending(): void {
  memoryMfa = null;
  storageRemove(MFA_PENDING_KEY);
}

// ── fetch helper ─────────────────────────────────────────────────────────────
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const sessionToken = getSessionToken();
  const mfaPending = getMfaPending();

  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      // Cookie-free fallbacks for embedded/iframe contexts.
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(mfaPending ? { "x-mfa-pending": mfaPending } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const data: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    const payload = data as { error?: string; code?: string } | null;
    // A hard 401 UNAUTHORIZED means the stored session token is dead —
    // forget it so the UI returns to the login screen.
    if (res.status === 401 && payload?.code === "UNAUTHORIZED") {
      clearSessionToken();
      clearMfaPending();
    }
    const err = new Error(
      payload?.error ?? `Request failed (${res.status})`
    ) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = payload?.code;
    throw err;
  }

  // Capture tokens the auth endpoints hand back in the body.
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.sessionToken === "string" && d.sessionToken.length > 0) {
      setSessionToken(d.sessionToken);
      clearMfaPending(); // 2FA completed — pending proof is spent
    }
    if (typeof d.mfaToken === "string" && d.mfaToken.length > 0) {
      setMfaPending(d.mfaToken);
    }
  }

  return data as T;
}

/** Build a query string from a filter object (skips empty values). */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
