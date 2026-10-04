/**
 * Skyora — production preflight check
 * Run before going live (or after any deploy change):
 *
 *   bun scripts/preflight.ts
 *
 * Validates the environment the same way the app reads it (bun auto-loads
 * .env). Exit code 0 = ready, 1 = at least one FAIL that must be fixed.
 * WARN items are strongly recommended but do not block.
 */

import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type Status = "PASS" | "WARN" | "FAIL";

interface Row {
  status: Status;
  check: string;
  detail: string;
}

const TEST_TURNSTILE_KEYS = [
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
];

function maskSecret(v: string | undefined, visible = 4): string {
  if (!v) return "(not set)";
  if (v.length <= visible) return "•".repeat(v.length);
  return `${v.slice(0, visible)}…••••`;
}

function isHex64(v: string | undefined): boolean {
  return typeof v === "string" && /^[0-9a-f]{64}$/i.test(v.trim());
}

async function main() {
  const rows: Row[] = [];
  const isProd = process.env.NODE_ENV === "production";

  // ── 1. Runtime ────────────────────────────────────────────────────────────
  rows.push({
    status: "PASS",
    check: "Runtime",
    detail: `bun ${process.versions.bun ?? "?"} · node-compat ${process.versions.node} · NODE_ENV=${process.env.NODE_ENV || "(unset)"}`,
  });

  // ── 2. Database ───────────────────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    rows.push({ status: "FAIL", check: "DATABASE_URL", detail: "not set — the app cannot reach a database" });
  } else if (dbUrl.startsWith("file:")) {
    const rel = dbUrl.replace(/^file:/, "");
    const abs = rel.startsWith("/")
      ? rel
      : resolve(process.cwd(), rel.replace(/^\.\//, ""));
    const exists = existsSync(abs);
    rows.push({
      status: exists ? "PASS" : "FAIL",
      check: "DATABASE_URL (SQLite)",
      detail: `${abs} — ${exists ? `found (${Math.round(statSync(abs).size / 1024)} KB)` : "FILE MISSING (run: bun run db:push)"}`,
    });
  } else {
    rows.push({
      status: "PASS",
      check: "DATABASE_URL (remote)",
      detail: `${dbUrl.replace(/\/\/[^@]*@/, "//•••@")} — connectivity verified below`,
    });
  }

  let db: PrismaClient | null = null;
  try {
    db = new PrismaClient();
    await db.$queryRaw`SELECT 1`;
    const users = await db.user.count();
    const activeStaff = await db.user.count({ where: { isActive: true } });
    const enquiries = await db.enquiry.count();
    const courses = await db.course.count();
    rows.push({
      status: "PASS",
      check: "Database reachable",
      detail: `users=${users} (active ${activeStaff}) · enquiries=${enquiries} · courses=${courses}`,
    });

    // ── 3. Seed passwords must have been changed ────────────────────────────
    const seeds = await db.user.findMany({
      where: { email: { in: ["admin@skyora.edu.in", "counsellor@skyora.edu.in"] } },
    });
    for (const u of seeds) {
      const stillDefault = await bcrypt.compare("ChangeMe@12345", u.passwordHash);
      rows.push({
        status: stillDefault || !u.isActive ? "FAIL" : "PASS",
        check: `Password changed — ${u.email}`,
        detail: stillDefault
          ? "STILL the seeded default (ChangeMe@12345) — sign in once and set a real password before going live"
          : u.isActive
            ? "changed from seed ✓"
            : "account is deactivated",
      });
      rows.push({
        status: u.mustChangePassword ? "PASS" : "WARN",
        check: `Forced first-login change — ${u.email}`,
        detail: u.mustChangePassword
          ? "will be forced to set a new password at first sign-in"
          : "mustChangePassword already cleared — ensure this was intentional",
      });
    }
  } catch (err) {
    rows.push({
      status: "FAIL",
      check: "Database reachable",
      detail: `connection failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  } finally {
    await db?.$disconnect();
  }

  // ── 4. AUTH_SECRET ────────────────────────────────────────────────────────
  const authSecret = process.env.AUTH_SECRET?.trim();
  rows.push({
    status: isHex64(authSecret) ? "PASS" : isProd ? "FAIL" : "WARN",
    check: "AUTH_SECRET",
    detail: isHex64(authSecret)
      ? `${maskSecret(authSecret)} (64 hex chars ✓)`
      : `${authSecret ? "set but NOT 64 hex chars" : "not set"} — generate with: openssl rand -hex 32${isProd ? "" : " (dev-tolerable, production-required)"}`,
  });

  // ── 5. Turnstile (anti-bot) ───────────────────────────────────────────────
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  const usingTestKeys =
    !siteKey || !secretKey || TEST_TURNSTILE_KEYS.includes(siteKey) || TEST_TURNSTILE_KEYS.includes(secretKey);
  rows.push({
    status: usingTestKeys ? (isProd ? "FAIL" : "WARN") : "PASS",
    check: "Cloudflare Turnstile",
    detail: usingTestKeys
      ? `TEST/missing keys in use (${maskSecret(siteKey)} / ${maskSecret(secretKey)}) — real enquiry form is NOT protected from bots. Get a pair: https://dash.cloudflare.com/?to=/:account/turnstile`
      : `real key pair configured (${maskSecret(siteKey)} / ${maskSecret(secretKey)})`,
  });

  // ── 6. SMTP (optional) ────────────────────────────────────────────────────
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT?.trim();
  rows.push({
    status: smtpHost && smtpPort ? "PASS" : "WARN",
    check: "SMTP (follow-up digest email)",
    detail: smtpHost && smtpPort
      ? `host=${smtpHost} port=${smtpPort} secure=${process.env.SMTP_SECURE === "true" ? "465/true" : "587/false"}${process.env.SMTP_USER ? " auth=✓" : " auth=(none)"}`
      : "not configured — daily follow-up digest will be printed to the server console instead of emailed",
  });

  // ── 7. Reminder schedule ──────────────────────────────────────────────────
  const h = Number(process.env.REMINDER_HOUR ?? 9);
  const m = Number(process.env.REMINDER_MINUTE ?? 0);
  const tz = process.env.REMINDER_TZ ?? "Asia/Calcutta";
  rows.push({
    status: h >= 0 && h <= 23 && m >= 0 && m <= 59 ? "PASS" : "FAIL",
    check: "Reminder schedule",
    detail: `daily at ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} (${tz})`,
  });

  // ── Report ────────────────────────────────────────────────────────────────
  const fails = rows.filter((r) => r.status === "FAIL");
  const warns = rows.filter((r) => r.status === "WARN");
  const icon: Record<Status, string> = { PASS: "✓", WARN: "▲", FAIL: "✗" };

  console.log("\n┌─ SKYORA PRODUCTION PREFLIGHT " + "─".repeat(46));
  for (const r of rows) {
    const line = `│ ${icon[r.status]} ${r.status.padEnd(4)} ${r.check}`;
    console.log(line);
    console.log(`│         ${r.detail}`);
  }
  console.log("└" + "─".repeat(77));
  console.log(
    `\nResult: ${rows.length - fails.length - warns.length} pass · ${warns.length} warn · ${fails.length} fail\n`,
  );

  if (fails.length > 0) {
    console.log("✗ NOT READY — fix the FAIL items above, then re-run this script.\n");
    process.exit(1);
  }
  if (warns.length > 0) {
    console.log("▲ Ready with warnings — review the ▲ items; they degrade protection or convenience, not correctness.\n");
    process.exit(0);
  }
  console.log("✓ ALL CLEAR — environment is production-ready.\n");
  process.exit(0);
}

void main();
