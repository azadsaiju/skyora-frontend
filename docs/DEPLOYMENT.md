# Skyora — Production Deployment Guide

Step-by-step guide to take the finished app from this sandbox to a live
domain. Nothing here is theoretical — every command matches the scripts in
this repository.

---

## 0. What you need before starting

| Item | Where to get it |
| --- | --- |
| A Linux server (VPS) with 1 GB+ RAM | Any provider (Hetzner, DigitalOcean, AWS Lightsail…) |
| A domain | Any registrar |
| Cloudflare account (free) — DNS, SSL, Turnstile | <https://dash.cloudflare.com> |
| SMTP credentials for the digest email (optional) | Your mail provider (e.g. Zoho/Gmail app-password/SES) |

> Deploying to Vercel instead? `vercel.json` is already included — run
> `vercel --prod`, but switch the database from SQLite to Postgres first
> (serverless filesystems are ephemeral). See §8.

---

## 1. Server setup (once)

```bash
# Install bun (runtime) and caddy (reverse proxy)
curl -fsSL https://bun.sh/install | bash
sudo apt update && sudo apt install -y caddy
```

## 2. Get the code + install

```bash
git clone <your-repo-url> /opt/skyora && cd /opt/skyora
bun install
```

## 3. Configure the environment

```bash
cp .env.example .env
nano .env
```

Fill in **at least** these values (`.env.example` documents every variable):

```ini
DATABASE_URL="file:/opt/skyora/db/custom.db"     # absolute path, outside git
AUTH_SECRET="$(openssl rand -hex 32)"            # fresh secret, never reuse
NEXT_PUBLIC_TURNSTILE_SITE_KEY="<real site key>"
TURNSTILE_SECRET_KEY="<real secret key>"
# optional but recommended:
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / SMTP_FROM
REMINDER_HOUR="9"  REMINDER_MINUTE="0"  REMINDER_TZ="Asia/Calcutta"
```

> **Turnstile:** create a Turnstile widget for your domain
> (<https://dash.cloudflare.com/?to=/:account/turnstile>) and copy BOTH keys.
> The keys shipped in `.env.example` are Cloudflare's public TEST pair — they
> always pass and stop nothing. Never go live with them.

## 4. Database + seed

```bash
bun run db:push        # creates db/custom.db with the full schema
bun prisma/seed.ts     # seeds courses, achievements, vacancies + 2 staff accounts
```

## 5. Preflight — one-command go/no-go check

```bash
bun scripts/preflight.ts
```

The script verifies database connectivity, that AUTH_SECRET is a proper
64-hex secret, that Turnstile keys are real (not the test pair), SMTP state,
the reminder schedule — **and that the seeded default passwords have been
changed**. Fix every ✗ FAIL, review the ▲ WARNs, re-run until it is green.

## 6. First login — secure the accounts

1. Open `https://<your-domain>/` → footer → **ADMIN LOGIN**
2. Sign in as `admin@skyora.edu.in` with the seeded password
   (`ChangeMe@12345`) → set a strong private password (forced on first login)
3. Optionally **Security → Enable 2FA** (scan the QR with Google
   Authenticator/Authy — can be disabled again anytime)
4. Sign in as `counsellor@skyora.edu.in` and set its real password
5. Re-run `bun scripts/preflight.ts` → all password checks must be ✓

## 7. Build, run, keep running

```bash
bun run build      # standalone production build
bun run start      # serves on PORT (default 3000), logs → server.log
```

Keep it alive across reboots (systemd unit `/etc/systemd/system/skyora.service`):

```ini
[Unit]
Description=Skyora website + admin
After=network.target

[Service]
WorkingDirectory=/opt/skyora
ExecStart=/root/.bun/bin/bun run start
Restart=always
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now skyora
```

### Caddy reverse proxy (automatic HTTPS)

`/etc/caddy/Caddyfile`:

```caddy
skyora.edu.in {
    reverse_proxy localhost:3000
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}
```

```bash
sudo systemctl reload caddy   # Caddy fetches Let's Encrypt certs automatically
```

### Point the domain

In Cloudflare DNS: `A` record `@` → your server IP (proxy 🟠 on). With the
Caddy setup above you can also run DNS-only (grey) and let Caddy handle TLS —
pick one, never double-proxy TLS.

## 8. Backups (SQLite)

`scripts/backup-db.sh` writes timestamped, gzip-compressed snapshots and
prunes anything older than 30 days:

```bash
sudo scripts/backup-db.sh /opt/skyora/db/custom.db /var/backups/skyora
```

Daily at 02:15 Asia/Calcutta via cron (`crontab -e`):

```cron
15 2 * * * /opt/skyora/scripts/backup-db.sh /opt/skyora/db/custom.db /var/backups/skyora >> /var/log/skyora-backup.log 2>&1
```

## 9. Updating the site later

```bash
cd /opt/skyora
git pull
bun install
bun run db:push       # only when the schema changed
bun run build
sudo systemctl restart skyora
```

## 10. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Admin login loops back to the sign-in screen | Third-party-cookie blocking (some in-app browsers/iframes). The app already sends header-based fallback tokens — clear cookies and retry in a normal tab. |
| "Verification session expired" during 2FA setup | The 15-minute window lapsed — sign in again; the QR refreshes its window each time it is displayed. |
| Enquiry form fails with a captcha error | Turnstile keys don't match the domain, or the TEST pair is blocked — check the widget's domain list in Cloudflare. |
| No digest emails | SMTP not configured (digest goes to the console — check `server.log`), or `REMINDER_TO` unset with no active staff. |
| Preflight fails on the DB | `DATABASE_URL` path wrong or `db:push` not run on this machine. |

---

*Questions this file doesn't answer? Check `README.md` (features, env vars,
CSV import format) and the audit trail in the admin portal.*
