/**
 * Skyora — SQLite to PostgreSQL Data Transfer Script
 *
 * Transfers all application data from the primary SQLite database (db/custom.db)
 * to the target PostgreSQL database (prisma-postgres-bisque-lantern) in strict
 * foreign-key dependency order.
 *
 * Safety features:
 * - Default mode is --dry-run. Writing requires explicit --execute.
 * - In execution mode, strictly requires POSTGRES_MIGRATION_URL.
 * - Validates direct scheme, host (port 5432), and database catalog (/postgres).
 * - Requires explicit resource confirmation (CONFIRM_TARGET_RESOURCE / --confirm-resource).
 * - Reads from SQLite in strict read-only mode ({ readOnly: true }).
 * - Verifies SQLite PRAGMA integrity_check and foreign_key_check.
 * - Confirms exact source row counts (total 443 rows across 8 tables).
 * - Refuses to write if any destination table already contains rows.
 * - Executes all inserts inside a single atomic PostgreSQL transaction.
 * - Masks all secrets, credentials, and personal information in output.
 *
 * Usage:
 *   Dry-run (source inspection only):
 *     npx tsx scripts/migrate-sqlite-to-postgres.ts
 *
 *   Dry-run with destination verification:
 *     $env:POSTGRES_MIGRATION_URL="<DIRECT_URL>"
 *     npx tsx scripts/migrate-sqlite-to-postgres.ts --confirm-resource=prisma-postgres-bisque-lantern
 *
 *   Live execution (requires explicit flag, direct URL, and confirmed resource):
 *     $env:POSTGRES_MIGRATION_URL="<DIRECT_URL>"
 *     npx tsx scripts/migrate-sqlite-to-postgres.ts --execute --confirm-resource=prisma-postgres-bisque-lantern
 */

import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// Expected counts based on Phase 1 & Phase 2 verification
const EXPECTED_SOURCE_COUNTS: Record<string, number> = {
  User: 2,
  Session: 1,
  Course: 8,
  Enquiry: 7,
  FollowUp: 5,
  Achievement: 4,
  Vacancy: 4,
  AuditLog: 412,
};

const EXPECTED_TOTAL_ROWS = 443;
const REQUIRED_RESOURCE_NAME = "prisma-postgres-bisque-lantern";

// ── Helpers for converting SQLite types to PostgreSQL types ─────────────────

function toDate(val: unknown, fieldName: string): Date {
  if (val == null) {
    throw new Error(`Non-nullable date field "${fieldName}" received null or undefined`);
  }
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  const d = new Date(String(val));
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date value "${val}" for field "${fieldName}"`);
  }
  return d;
}

function toNullableDate(val: unknown): Date | null {
  if (val == null) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  const d = new Date(String(val));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toBoolean(val: unknown, defaultVal = false): boolean {
  if (val == null) return defaultVal;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  return Boolean(val);
}

function maskUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, "//••••:••••@");
}

// ── Main Migration Function ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isDryRun = !isExecute || args.includes("--dry-run");

  console.log("============================================================");
  console.log(" Skyora SQLite-to-PostgreSQL Data Transfer");
  console.log(` Mode: ${isExecute ? "LIVE EXECUTION (--execute)" : "DRY RUN (read-only verification)"}`);
  console.log("============================================================\n");

  // ── 1. Verify and inspect source SQLite database ──────────────────────────
  const sqliteRelativePath = process.env.SQLITE_DB_PATH || "db/custom.db";
  const sqliteAbsPath = resolve(process.cwd(), sqliteRelativePath);

  if (!existsSync(sqliteAbsPath)) {
    throw new Error(`Primary SQLite database not found at: ${sqliteAbsPath}`);
  }

  console.log(`[Source] Opening SQLite database: ${sqliteRelativePath} (read-only)`);
  const sqlite = new DatabaseSync(sqliteAbsPath, { readOnly: true });

  try {
    // 1.1 PRAGMA checks
    const integrity = sqlite.prepare("PRAGMA integrity_check").all();
    const integrityStatus = integrity.map((r) => Object.values(r)[0]);
    if (integrityStatus.length !== 1 || integrityStatus[0] !== "ok") {
      throw new Error(`SQLite integrity check failed: ${JSON.stringify(integrityStatus)}`);
    }

    const fkViolations = sqlite.prepare("PRAGMA foreign_key_check").all();
    if (fkViolations.length > 0) {
      throw new Error(`SQLite foreign key check failed with ${fkViolations.length} violations`);
    }

    console.log("  ✓ PRAGMA integrity_check: ok");
    console.log("  ✓ PRAGMA foreign_key_check: 0 violations");

    // 1.2 Verify row counts
    const sourceCounts: Record<string, number> = {};
    let totalSourceRows = 0;

    for (const [table, expected] of Object.entries(EXPECTED_SOURCE_COUNTS)) {
      const row = sqlite.prepare(`SELECT count(*) as count FROM "${table}"`).get() as { count: number | bigint };
      const count = Number(row.count);
      sourceCounts[table] = count;
      totalSourceRows += count;

      if (count !== expected) {
        throw new Error(
          `Row count mismatch on table "${table}": expected ${expected}, got ${count}. Aborting transfer for safety.`
        );
      }
    }

    console.log(`  ✓ All 8 application tables match expected counts (total ${totalSourceRows}/${EXPECTED_TOTAL_ROWS} rows)\n`);

    // 1.3 Read and transform all records from SQLite
    console.log("[Source] Extracting and transforming records...");

    // 1. User
    const rawUsers = sqlite.prepare('SELECT * FROM "User" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const users = rawUsers.map((u) => ({
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      passwordHash: String(u.passwordHash),
      role: String(u.role || "ADMIN"),
      isActive: toBoolean(u.isActive, true),
      mustChangePassword: toBoolean(u.mustChangePassword, false),
      totpSecret: u.totpSecret ? String(u.totpSecret) : null,
      totpEnabled: toBoolean(u.totpEnabled, false),
      recoveryCodes: u.recoveryCodes ? String(u.recoveryCodes) : null,
      createdAt: toDate(u.createdAt, "User.createdAt"),
      updatedAt: toDate(u.updatedAt, "User.updatedAt"),
    }));

    // 2. Session
    const rawSessions = sqlite.prepare('SELECT * FROM "Session" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const sessions = rawSessions.map((s) => ({
      id: String(s.id),
      tokenHash: String(s.tokenHash),
      userId: String(s.userId),
      expiresAt: toDate(s.expiresAt, "Session.expiresAt"),
      ip: s.ip ? String(s.ip) : null,
      userAgent: s.userAgent ? String(s.userAgent) : null,
      createdAt: toDate(s.createdAt, "Session.createdAt"),
    }));

    // 3. Course
    const rawCourses = sqlite.prepare('SELECT * FROM "Course" ORDER BY "sortOrder" ASC, "createdAt" ASC').all() as Record<string, unknown>[];
    const courses = rawCourses.map((c) => ({
      id: String(c.id),
      title: String(c.title),
      track: String(c.track),
      slug: String(c.slug),
      duration: String(c.duration),
      description: String(c.description),
      skills: String(c.skills ?? ""),
      jobRoles: String(c.jobRoles ?? ""),
      workplaces: String(c.workplaces ?? ""),
      image: c.image ? String(c.image) : null,
      sortOrder: Number(c.sortOrder ?? 0),
      isActive: toBoolean(c.isActive, true),
      createdAt: toDate(c.createdAt, "Course.createdAt"),
      updatedAt: toDate(c.updatedAt, "Course.updatedAt"),
    }));

    // 4. Enquiry
    const rawEnquiries = sqlite.prepare('SELECT * FROM "Enquiry" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const enquiries = rawEnquiries.map((e) => ({
      id: String(e.id),
      name: String(e.name),
      phone: String(e.phone),
      email: String(e.email),
      courseId: e.courseId ? String(e.courseId) : null,
      source: String(e.source || "website"),
      status: String(e.status || "NEW"),
      message: e.message ? String(e.message) : null,
      assignedToId: e.assignedToId ? String(e.assignedToId) : null,
      createdAt: toDate(e.createdAt, "Enquiry.createdAt"),
      updatedAt: toDate(e.updatedAt, "Enquiry.updatedAt"),
    }));

    // 5. FollowUp
    const rawFollowUps = sqlite.prepare('SELECT * FROM "FollowUp" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const followUps = rawFollowUps.map((f) => ({
      id: String(f.id),
      enquiryId: String(f.enquiryId),
      note: String(f.note),
      nextActionDate: toNullableDate(f.nextActionDate),
      createdById: f.createdById ? String(f.createdById) : null,
      createdAt: toDate(f.createdAt, "FollowUp.createdAt"),
    }));

    // 6. Achievement
    const rawAchievements = sqlite.prepare('SELECT * FROM "Achievement" ORDER BY "date" ASC').all() as Record<string, unknown>[];
    const achievements = rawAchievements.map((a) => ({
      id: String(a.id),
      title: String(a.title),
      description: String(a.description),
      type: String(a.type),
      link: a.link ? String(a.link) : null,
      date: toDate(a.date, "Achievement.date"),
      createdAt: toDate(a.createdAt, "Achievement.createdAt"),
    }));

    // 7. Vacancy
    const rawVacancies = sqlite.prepare('SELECT * FROM "Vacancy" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const vacancies = rawVacancies.map((v) => ({
      id: String(v.id),
      title: String(v.title),
      company: String(v.company),
      location: String(v.location),
      jobType: String(v.jobType),
      description: String(v.description),
      applyLink: String(v.applyLink),
      isOpen: toBoolean(v.isOpen, true),
      createdAt: toDate(v.createdAt, "Vacancy.createdAt"),
    }));

    // 8. AuditLog
    const rawAuditLogs = sqlite.prepare('SELECT * FROM "AuditLog" ORDER BY "createdAt" ASC').all() as Record<string, unknown>[];
    const auditLogs = rawAuditLogs.map((l) => ({
      id: String(l.id),
      userId: l.userId ? String(l.userId) : null,
      action: String(l.action),
      entity: String(l.entity),
      entityId: l.entityId ? String(l.entityId) : null,
      ipAddress: l.ipAddress ? String(l.ipAddress) : null,
      meta: l.meta ? String(l.meta) : null,
      createdAt: toDate(l.createdAt, "AuditLog.createdAt"),
    }));

    console.log(`  ✓ Successfully transformed ${users.length} Users`);
    console.log(`  ✓ Successfully transformed ${sessions.length} Sessions`);
    console.log(`  ✓ Successfully transformed ${courses.length} Courses`);
    console.log(`  ✓ Successfully transformed ${enquiries.length} Enquiries`);
    console.log(`  ✓ Successfully transformed ${followUps.length} FollowUps`);
    console.log(`  ✓ Successfully transformed ${achievements.length} Achievements`);
    console.log(`  ✓ Successfully transformed ${vacancies.length} Vacancies`);
    console.log(`  ✓ Successfully transformed ${auditLogs.length} AuditLogs\n`);

    // ── 2. Check Target PostgreSQL Connection ───────────────────────────────
    const targetUrl = process.env.POSTGRES_MIGRATION_URL?.trim();

    if (!targetUrl) {
      if (isExecute) {
        throw new Error(
          "Execution mode (--execute) strictly requires POSTGRES_MIGRATION_URL to be set in the process environment. Fallback to DATABASE_URL or POSTGRES_URL is disabled for write safety."
        );
      }
      console.log("[Destination] No POSTGRES_MIGRATION_URL supplied in environment.");
      console.log("  To dry-run against the live PostgreSQL database, set POSTGRES_MIGRATION_URL.");
      console.log("\n[Dry-Run Summary] Source validation complete. All 443 records are valid and ready for transfer.");
      return;
    }

    // 2.1 Validate URL scheme, hostname, port, and catalog path without printing credentials
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      throw new Error("Invalid PostgreSQL connection URL format in POSTGRES_MIGRATION_URL.");
    }

    if (parsedUrl.protocol !== "postgres:" && parsedUrl.protocol !== "postgresql:") {
      throw new Error(
        `Invalid protocol "${parsedUrl.protocol}". Direct migration connection must use postgresql:// or postgres://.`
      );
    }

    const host = parsedUrl.hostname.toLowerCase();
    const port = parsedUrl.port || "5432";
    const dbPath = parsedUrl.pathname.replace(/^\//, "");

    if (host.startsWith("pooled.") || host.includes("accelerate.")) {
      throw new Error(
        `Refusing to use pooled host "${host}". Migration requires a direct PostgreSQL connection on port 5432 (e.g. db.prisma.io).`
      );
    }

    if (port !== "5432") {
      throw new Error(
        `Invalid direct port "${port}". Migration requires direct port 5432 (found port ${port}).`
      );
    }

    if (dbPath !== "postgres") {
      throw new Error(
        `Unexpected database catalog path "/${dbPath}". Expected "/postgres".`
      );
    }

    console.log(`[Destination] Validated direct connection parameters:`);
    console.log(`  - Scheme:   ${parsedUrl.protocol.replace(":", "")}`);
    console.log(`  - Host:     ${host} (direct)`);
    console.log(`  - Port:     ${port}`);
    console.log(`  - Database: ${dbPath}`);

    // 2.2 Provenance check: require explicit confirmation of Vercel resource
    const confirmedResource =
      process.env.CONFIRM_TARGET_RESOURCE?.trim() ||
      args.find((a) => a.startsWith("--confirm-resource="))?.split("=")[1]?.trim();

    if (confirmedResource !== REQUIRED_RESOURCE_NAME) {
      throw new Error(
        `Target provenance verification required.\n` +
        `Because the PostgreSQL catalog name ('postgres') on db.prisma.io is generic across Vercel Prisma Postgres instances, ` +
        `you must explicitly confirm that POSTGRES_MIGRATION_URL was freshly obtained from Vercel resource "${REQUIRED_RESOURCE_NAME}".\n` +
        `Provide confirmation by passing:\n` +
        `  --confirm-resource=${REQUIRED_RESOURCE_NAME}\n` +
        `or by setting the environment variable:\n` +
        `  $env:CONFIRM_TARGET_RESOURCE="${REQUIRED_RESOURCE_NAME}"`
      );
    }

    console.log(`  ✓ Provenance confirmed: verified Vercel target "${REQUIRED_RESOURCE_NAME}"`);

    const prisma = new PrismaClient({
      datasources: {
        db: { url: targetUrl },
      },
      log: ["error"],
    });

    try {
      // 2.3 Verify live connection info (database, schema, user - user masked)
      const [connInfo] = (await prisma.$queryRawUnsafe(
        "SELECT current_database() as db, current_schema() as schema, current_user as usr"
      )) as [{ db: string; schema: string; usr: string }];

      if (connInfo.db !== "postgres") {
        throw new Error(
          `Target database verification failed: expected current_database() = 'postgres', got '${connInfo.db}'`
        );
      }
      if (connInfo.schema !== "public") {
        throw new Error(
          `Target schema verification failed: expected current_schema() = 'public', got '${connInfo.schema}'`
        );
      }

      console.log(`  ✓ Database catalog verified: database="${connInfo.db}", schema="${connInfo.schema}", user="••••"`);

      // 2.4 Verify destination application tables exist and are completely empty
      console.log("[Destination] Verifying application tables and current row counts...");
      const destCounts: Record<string, number> = {
        User: await prisma.user.count(),
        Session: await prisma.session.count(),
        Course: await prisma.course.count(),
        Enquiry: await prisma.enquiry.count(),
        FollowUp: await prisma.followUp.count(),
        Achievement: await prisma.achievement.count(),
        Vacancy: await prisma.vacancy.count(),
        AuditLog: await prisma.auditLog.count(),
      };

      let destTotal = 0;
      for (const [tbl, count] of Object.entries(destCounts)) {
        destTotal += count;
        console.log(`  Table ${tbl.padEnd(14)}: ${count} rows`);
      }

      if (destTotal > 0) {
        throw new Error(
          `Refusing to write: Destination PostgreSQL database already contains ${destTotal} rows. Transfer requires an empty destination schema to prevent accidental double-execution or data corruption.`
        );
      }

      console.log("  ✓ Destination is completely clean (0 rows across all 8 tables)\n");

      // ── 3. Execution Phase (only if --execute is explicitly passed) ────────
      if (isDryRun) {
        console.log("============================================================");
        console.log(" DRY RUN COMPLETE — 0 RECORDS INSERTED");
        console.log(" All 443 records were successfully verified and transformed.");
        console.log(" Destination PostgreSQL database is reachable, verified, and empty.");
        console.log(" To perform the live transfer, run:");
        console.log("   npx tsx scripts/migrate-sqlite-to-postgres.ts --execute");
        console.log("============================================================");
        return;
      }

      console.log("[Execution] Starting single atomic PostgreSQL transaction for 443 rows...");

      const startTime = Date.now();
      await prisma.$transaction(
        async (tx) => {
          // 1. User (2 rows)
          console.log(`  Inserting ${users.length} Users...`);
          for (const u of users) {
            await tx.user.create({ data: u });
          }

          // 2. Session (1 row)
          console.log(`  Inserting ${sessions.length} Sessions...`);
          for (const s of sessions) {
            await tx.session.create({ data: s });
          }

          // 3. Course (8 rows)
          console.log(`  Inserting ${courses.length} Courses...`);
          for (const c of courses) {
            await tx.course.create({ data: c });
          }

          // 4. Enquiry (7 rows)
          console.log(`  Inserting ${enquiries.length} Enquiries...`);
          for (const e of enquiries) {
            await tx.enquiry.create({ data: e });
          }

          // 5. FollowUp (5 rows)
          console.log(`  Inserting ${followUps.length} FollowUps...`);
          for (const f of followUps) {
            await tx.followUp.create({ data: f });
          }

          // 6. Achievement (4 rows)
          console.log(`  Inserting ${achievements.length} Achievements...`);
          for (const a of achievements) {
            await tx.achievement.create({ data: a });
          }

          // 7. Vacancy (4 rows)
          console.log(`  Inserting ${vacancies.length} Vacancies...`);
          for (const v of vacancies) {
            await tx.vacancy.create({ data: v });
          }

          // 8. AuditLog (412 rows - batch insert via createMany)
          console.log(`  Inserting ${auditLogs.length} AuditLogs (batch)...`);
          await tx.auditLog.createMany({ data: auditLogs });
        },
        { timeout: 60000, maxWait: 10000 }
      );

      const durationMs = Date.now() - startTime;
      console.log(`\n✓ Transaction committed successfully in ${durationMs}ms!`);

      // Post-transfer verification
      console.log("\n[Verification] Verifying destination row counts post-insert...");
      const postCounts: Record<string, number> = {
        User: await prisma.user.count(),
        Session: await prisma.session.count(),
        Course: await prisma.course.count(),
        Enquiry: await prisma.enquiry.count(),
        FollowUp: await prisma.followUp.count(),
        Achievement: await prisma.achievement.count(),
        Vacancy: await prisma.vacancy.count(),
        AuditLog: await prisma.auditLog.count(),
      };

      let finalDestTotal = 0;
      for (const [tbl, expected] of Object.entries(EXPECTED_SOURCE_COUNTS)) {
        const count = postCounts[tbl];
        finalDestTotal += count;
        const match = count === expected ? "OK" : "MISMATCH";
        console.log(`  Table ${tbl.padEnd(14)}: ${count}/${expected} rows [${match}]`);
        if (count !== expected) {
          throw new Error(`CRITICAL: Post-insert count mismatch on ${tbl}: expected ${expected}, got ${count}`);
        }
      }

      console.log(`\n✓ Total rows transferred: ${finalDestTotal}/${EXPECTED_TOTAL_ROWS}`);
      console.log("============================================================");
      console.log(" DATA TRANSFER COMPLETE & VERIFIED SUCCESSFULLY");
      console.log("============================================================");
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error("\n❌ MIGRATION ERROR:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
