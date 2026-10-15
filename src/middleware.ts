import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware:
 *  1. Adds hardened security headers to every response.
 *  2. Fast-fails unauthenticated API calls (defense in depth — every API
 *     route re-verifies the session + role server-side via Prisma).
 *
 * NOTE: Runs on the Edge runtime, so no Prisma here. Session validity and
 * RBAC are enforced inside each API route via `requireAuth`/`requireSuperAdmin`.
 */

const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/mfa", "/api/enquiry", "/api/public", "/api/track"];
const ADMIN_API_PREFIXES = [
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/change-password",
  "/api/dashboard",
  "/api/enquiries",
  "/api/courses",
  "/api/vacancies",
  "/api/achievements",
  "/api/users",
  "/api/audit-logs",
];

function applySecurityHeaders(res: NextResponse, isProd: boolean): NextResponse {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://challenges.cloudflare.com https:",
    `connect-src 'self' https://challenges.cloudflare.com${isProd ? "" : " ws: wss:"}`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Clickjacking protection: strict in production (real domain, no embedding).
    // Relaxed in dev so the sandbox preview panel can embed the site in its iframe.
    isProd ? "frame-ancestors 'none'" : "frame-ancestors *",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  if (isProd) {
    // Legacy clickjacking guard — only set when strict embedding is required.
    // In dev, CSP frame-ancestors governs, keeping the preview panel working.
    res.headers.set("X-Frame-Options", "DENY");
  }
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProd) {
    // HSTS is production-only: sending it from the dev sandbox can poison the
    // visitor's browser cache for the sandbox host (2-year max-age + preload).
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

export function middleware(req: NextRequest): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const { pathname } = req.nextUrl;

  // Health/demo endpoint stays open.
  if (pathname === "/api" || pathname === "/api/") {
    return applySecurityHeaders(NextResponse.next(), isProd);
  }

  // Session proof can arrive two ways: the httpOnly cookie (normal tabs) or
  // the Authorization header (cookie-restricted contexts like third-party
  // iframe preview panels, where browsers drop cookies entirely). Either way,
  // the route handler still re-verifies the credential against the database.
  const hasSessionCookie = Boolean(req.cookies.get("skyora_session")?.value);
  const authHeader = req.headers.get("authorization") ?? "";
  const hasSessionHeader =
    authHeader.toLowerCase().startsWith("bearer ") ||
    Boolean(req.headers.get("x-session-token"));
  const isAdminApi =
    ADMIN_API_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ||
    // any /api/* that is not explicitly public is admin-only
    (pathname.startsWith("/api/") &&
      !PUBLIC_API_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ));

  if (isAdminApi && !hasSessionCookie && !hasSessionHeader) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
      isProd
    );
  }

  return applySecurityHeaders(NextResponse.next(), isProd);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|logo-|icons/|og-image).*)",
  ],
};
