"use client";

/**
 * Small typed fetch helper for client components.
 * Throws an Error with the server's `error` message on non-2xx responses.
 */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const data: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    const payload = data as { error?: string; code?: string } | null;
    const err = new Error(
      payload?.error ?? `Request failed (${res.status})`
    ) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = payload?.code;
    throw err;
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
