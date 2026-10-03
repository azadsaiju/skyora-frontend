import "server-only";

/**
 * Cloudflare Turnstile server-side verification (Prompt 5).
 * When TURNSTILE_SECRET_KEY is not configured (local dev without anti-bot),
 * verification passes-through so the app remains usable — production MUST
 * set both NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // anti-bot not configured in this environment
  if (!token || !token.trim()) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token.trim(),
          remoteip: ip,
        }).toString(),
        cache: "no-store",
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Network failure talking to Cloudflare → fail closed.
    return false;
  }
}
