# Skyora Group of Institutes — Website + Secure Admin

Production-grade marketing site and lead-management admin portal for Skyora Group of
Institutes (Aviation & IT training). Neo-brutalist design, hash-routed SPA front-end,
fully server-validated API, and a hardened admin (RBAC, 2FA, audit trail).

---

## Feature overview

### Public site (`/`)
- **Hash-routed SPA** — Home, Courses, Achievements, Placements, About, Contact
- Live content from the API (courses / achievements / open vacancies) — admin edits
  reflect instantly
- **Enquiry form** with Cloudflare Turnstile anti-bot, honeypot trap, per-IP rate
  limiting and Zod validation
- WhatsApp deep links everywhere (floating button, navbar, footer, contact, home CTA)
  — every click is audited with page context
- Responsive (360 px → 1440 px+), reduced-motion support, sticky footer, accessible
  (semantic landmarks, ARIA, keyboard navigation)

### Admin portal (`/#/admin`)
- Dashboard: enquiry stats, 7-day chart, status breakdown, follow-up reminders card
  (SUPER_ADMIN)
- Enquiries: search / filters / date range, detail drawer (status, assignment,
  follow-up timeline, WhatsApp deep link, SUPER_ADMIN delete), **Excel export**,
  **CSV bulk import** with per-row skip reasons
- Courses / Vacancies / Achievements CRUD (role-gated)
- Users management (SUPER_ADMIN only)
- **Audit logs** (SUPER_ADMIN only): every security-relevant event, filterable,
  colour-coded

### Security architecture
| Control | Detail |
| --- | --- |
| Passwords | bcrypt (cost 12), forced change on first login / after reset |
| Sessions | Opaque 256-bit tokens, SHA-256 hashed at rest, httpOnly + SameSite=Strict cookies, server-side rotation on login |
| TOTP 2FA | **Optional for every account (SUPER_ADMIN included)** — one-click enable from the Security page (RFC-6238, otplib), QR enrolment, 10 single-use recovery codes (SHA-256 hashed), password-confirmed opt-out. Accounts with 2FA on get an authenticator-code challenge after the password step |
| Login lockout | 5 failed attempts (email+IP) → 15-minute lock |
| Enquiry anti-spam | Cloudflare Turnstile (server-side siteverify, fail-closed) + honeypot + 3 per IP / 10 min |
| Rate limits | CSV import 5/user/hour, WhatsApp tracking 30/IP/min |
| RBAC | Server-side on every route; ADMIN sees masked phone/email in lists; 403 on all SUPER_ADMIN endpoints |
| Headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| Audit trail | Login success/fail, password changes, MFA lifecycle, exports, imports, deletes, status changes, reminder runs, WhatsApp clicks |
| Validation | Zod schemas on every route (body, query, params) |

---

## Tech stack

Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (New York) ·
Framer Motion · Prisma ORM (SQLite dev / Postgres-ready) · bcryptjs · otplib ·
qrcode · nodemailer · node-cron · ExcelJS · Zod

---

## Quick start

```bash
bun install          # or npm install / pnpm install
cp .env.example .env # then edit values (see below)
bun run db:push      # create/sync the SQLite database
bun run dev          # http://localhost:3000
```

Seed accounts (created via `prisma/seed.ts`, **change the passwords immediately**):

| Role | Email | Password |
| --- | --- | --- |
| SUPER_ADMIN | `admin@skyora.edu.in` | `ChangeMe@12345` |
| ADMIN | `counsellor@skyora.edu.in` | `ChangeMe@12345` |

- Public site: `/`
- Admin portal: `/#/admin` (also via the **ADMIN LOGIN** button in the site footer)
- First login forces a password change for both seeded accounts. 2FA is
  **off by default and optional** — enable it anytime under
  **Security → Enable 2FA** (QR → authenticator app → recovery codes),
  disable it again from the same page.

### Production readiness

| Command | Purpose |
| --- | --- |
| `bun run preflight` | One-command go/no-go production check (env, secrets, Turnstile keys, SMTP, seeded-password sweep) |
| `bun run db:backup <db> [dir]` | Timestamped + gzipped SQLite snapshot, 30-day retention |
| `docs/DEPLOYMENT.md` | Full VPS/Caddy/Cloudflare deployment guide — env setup, systemd, backups, updates, troubleshooting |

### Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server on port 3000 |
| `bun run lint` | ESLint |
| `bun run db:push` | Sync `prisma/schema.prisma` to the database |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run build` / `bun run start` | Production build / serve |

---

## Environment variables

Copy `.env.example` → `.env` and fill in:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `file:./db/custom.db` for SQLite. Use a Postgres URL in production (and switch `provider` in `prisma/schema.prisma`) |
| `AUTH_SECRET` | ✅ (prod) | 64 hex chars — `openssl rand -hex 32`. Signs MFA challenges |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ (prod) | From the Cloudflare dashboard. The bundled value is Cloudflare's **TEST** key (always passes — does NOT stop bots) |
| `TURNSTILE_SECRET_KEY` | ✅ (prod) | Matching server key. Unset → verification passes through (dev mode) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | — | Optional. Without them the daily digest is logged to the console instead of emailed |
| `REMINDER_HOUR` / `REMINDER_MINUTE` / `REMINDER_TZ` | — | Digest schedule (default 09:00 Asia/Calcutta) |
| `REMINDER_TO` | — | Optional comma-separated digest recipients (default: all active staff) |

> **Never ship the Turnstile TEST keys to production.** Get real keys at
> <https://dash.cloudflare.com/?to=/:account/turnstile>.

---

## CSV import format (admin → Enquiries → Import CSV)

Header row required, column order flexible:

```csv
name,phone,email,course,message
Aarav Sharma,+91 98765 43210,aarav@example.com,Cabin Crew Training,Weekend batch
Priya Nair,+91 91234 56789,,,Asked for fee details
```

- `name` and `phone` are required; `email`, `course`, `message` optional
- `course` must match an **active** course title or slug (case-insensitive)
- Duplicate phone numbers (already in the system or repeated in the file) are skipped
- Invalid rows are skipped with a per-row reason; up to 500 rows / 500 KB per file
- Every import is audited (`ENQUIRY_IMPORT`)

---

## Follow-up reminder digest

A daily email (or console log when SMTP is unset) lists every open enquiry whose
latest next-action is due today or overdue, grouped by urgency. Recipients: all
active staff accounts, or `REMINDER_TO`. Schedule: `REMINDER_HOUR:REMINDER_MINUTE`
in `REMINDER_TZ`. SUPER_ADMIN can trigger it manually from the dashboard card
(**Send now**) or via `POST /api/reminders`.

---

## Deployment notes

- **Recommended**: Vercel (`vercel.json` included) or any Node host (`bun run build && bun run start`)
- **Database**: SQLite works for a single-node deployment only. On serverless
  (Vercel), switch Prisma to PostgreSQL/Neon/Supabase and update `DATABASE_URL`
- Set **all** required env vars in the host dashboard; rotate `AUTH_SECRET` if it
  ever leaks
- Point your domain + Cloudflare in front of the deployment — Turnstile needs real
  keys and the site needs HTTPS for HSTS to matter
- `robots.txt` already disallows `/admin`
- **Before go-live**: change both seeded passwords, keep recovery codes safe
  (shown once during 2FA enrolment)

## Project structure

```
src/
  app/
    api/            # REST API (auth, enquiry, enquiries(+import/export), courses,
                    # vacancies, achievements, users, audit-logs, reminders,
                    # track/whatsapp, public/content)
    layout.tsx      # fonts + toaster
    page.tsx        # hash-route SPA shell (public site + #/admin)
  components/
    public/         # marketing site sections, enquiry form, Turnstile widget
    admin/          # admin app: login, MFA, password, dashboard, enquiries,
                    # drawer, CRUD views, users, audit logs, reminders, import
  lib/              # auth, validators (Zod), rate-limit, turnstile, audit,
                    # csv, mailer, reminders, reminder-cron, masking, types
  middleware.ts     # security headers + API cookie fast-fail
  instrumentation.ts# starts the daily reminder cron (Node runtime)
  config/site.config.ts  # single source of truth for institute info/links
prisma/             # schema.prisma + seed.ts
public/robots.txt   # crawl rules (Disallow /admin)
```
