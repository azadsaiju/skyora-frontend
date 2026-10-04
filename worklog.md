---
Task ID: 1
Agent: Z.ai Code (lead)
Task: Foundation — schema, config, security libs, API routes, seed

Work Log:
- Installed exceljs, bcryptjs (+types), server-only
- Rewrote prisma/schema.prisma: User, Session, Enquiry, FollowUp, Course, Achievement, Vacancy, AuditLog (SQLite — enums enforced via Zod)
- bun run db:push — schema synced
- src/config/site.config.ts — central institute config (links, stats, recruiters, testimonials, placements, mentors, whyUs, story)
- src/lib: types.ts (DTOs), validators.ts (Zod schemas + ApiError + handleApiError), auth.ts (bcrypt cost 12, SHA-256-hashed session tokens, httpOnly/SameSite=Strict/Secure cookies, requireAuth/requireSuperAdmin, PASSWORD_CHANGE_REQUIRED gate), rate-limit.ts (enquiry 3/10min sliding window; login 5 fails → 15min lockout per email+IP), audit.ts (logAudit), mask.ts (maskPhone/maskEmail/slugify), enquiry-filters.ts (shared list+export filters), client.ts (typed fetch helper)
- src/middleware.ts — CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy + API cookie fast-fail
- 20 API routes under src/app/api: auth (login/logout/me/change-password), public/content, enquiry (honeypot+ratelimit), dashboard, enquiries (list/detail/PATCH/DELETE/followups/export), courses/vacancies/achievements CRUD, users (SUPER_ADMIN), audit-logs (SUPER_ADMIN)
- RBAC server-side everywhere; enquiry DELETE = SUPER_ADMIN only; ADMIN list views masked phone/email
- prisma/seed.ts run: SUPER_ADMIN admin@skyora.edu.in + ADMIN counsellor@skyora.edu.in (both mustChangePassword=true), 7 courses, 4 achievements, 3 vacancies, 5 enquiries w/ follow-ups
- globals.css: neo-brutalist tokens (cream/ink/pink/blue/orange/cyan, brutal-card, hard shadows, marquee keyframes, scrollbar, dot-grid); layout.tsx: Google Fonts (Archivo Black/Space Grotesk/Inter) + sonner Toaster; page.tsx: hash-route SPA shell; robots.txt Disallow /admin; .env.example

Stage Summary:
- API contract: see src/lib/types.ts (DTOs) + route files. All responses JSON; errors {error, code}.
- Public content: GET /api/public/content → { courses, achievements, vacancies } (no-store, always fresh)
- Auth: POST /api/auth/login {email,password} → {user}; GET /api/auth/me → {user}; POST /api/auth/change-password {currentPassword,newPassword} → {user}; POST /api/auth/logout
- ADMIN = masked list data (server-side); detail always full; DELETE enquiry 403 for ADMIN; /api/users + /api/audit-logs 403 for ADMIN
- next steps: 2-a public UI components (src/components/public), 2-b admin UI (src/components/admin), then Task 3 integration/QA

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: Public site UI — all marketing-site React components (src/components/public) for Skyora

Work Log:
- Read worklog.md, site.config.ts, types.ts, client.ts, use-hash-route.ts, globals.css, page.tsx, layout.tsx, validators.ts, api/enquiry + api/public/content routes, and shadcn ui primitives (button, badge, select, dialog, tabs, input, label, textarea, skeleton) to lock onto existing contracts and design tokens
- Built shared data layer: use-public-content.ts hook (GET /api/public/content, no-store, cancelled-guard, refetch) + content-state.tsx (inline error state with Retry button — no infinite skeletons anywhere)
- navbar.tsx: sticky bg-cream/95 backdrop-blur border-b-2, logo block, 6 hash-route links with active bg-ink pill (aria-current), WhatsApp CTA, hamburger dropdown (aria-expanded/aria-controls) that closes on link click
- footer.tsx: bg-ink rounded-t-2xl, brand col + socials row (5 circular icon links, aria-labels), quick links, contact col (tel/mailto from siteConfig), bottom bar with privacy note; pb-24 md:pb-8 so floating buttons never cover text; no #/admin link
- floating-buttons.tsx: fixed bottom-right WhatsApp (#16A34A, MessageCircle) + Call (brand-pink, Phone) 56px motion.a buttons, shadow-hard-lg + brutal-hover
- section-heading.tsx: eyebrow dot row, display h2 with `highlight` substring wrapped in text-brand-pink (split on first occurrence), optional description, whileInView fade-up (once)
- marquee.tsx: full-bleed bg-ink strip; recruiters rendered TWICE (copy 2 aria-hidden), each copy `flex gap-4 pr-4` inside w-max animate-marquee so translateX(-50%) loops seamlessly; dot colors cycle siteConfig.stats colors; marquee-hover-pause + marquee-fallback for reduced motion
- stat-cards.tsx: per-card useInView(once, -40px margin) + framer `animate(0, value, 1.6s easeOut)` count-up guarded by started ref (exactly once); useReducedMotion → renders final value immediately instead of counting
- enquiry-form.tsx: controlled form (name/phone/email/course Select/message) with native validation matching server Zod (phone pattern ^[+]?[0-9][0-9\s\-()]{7,15}$, message ≤1000), honeypot `website` input (off-screen, tabIndex -1, aria-hidden), useId-based label/id pairs, POST /api/enquiry via api(), Loader2 submit state, success panel with "Send another enquiry" reset, toast.error(err.message) incl. 429 rate-limit message
- enquiry-dialog.tsx: shadcn Dialog, brutal trigger button (triggerClassName), scrollable content (max-h-[85vh] nice-scrollbar, w capped 480px), DialogTitle + course context line, stays open on success
- home-section.tsx: hero (dot-grid layer, pink/cyan blur blobs, admissions pill, display H1 "CAREERS TAKE FLIGHT AT SKYORA" with FLIGHT pink, staggered 0.12s fade-up on load), StatCards band, RecruiterMarquee, two-track highlights (Aviation blue / IT cyan cards listing 3 courses each, hover rows → #/courses, skeletons/error states), testimonials grid (figure/blockquote + 5 filled stars), black "READY FOR TAKEOFF?" CTA band with white dot grid + WhatsApp/Contact buttons
- courses-section.tsx: brutal Tabs (AVIATION/IT triggers with Plane/Code2 icons, active bg-ink), course cards with track-colored bar, duration Badge (Clock), line-clamp description, 3 syllabus bullets, per-course EnquiryDialog (source `courses:${slug}`, initialCourseId), skeletons + empty-per-track state
- achievements-section.tsx: GitHub banner (siteConfig.links.github, ArrowUpRight hover slide) + achievement grid: type Badge with color map (HACKATHON pink/CERTIFICATION blue/PROJECT orange/PLACEMENT green), date-fns "dd MMM yyyy" date, optional View link; empty + error + skeleton states
- placements-section.tsx: Part A "Recently placed" from siteConfig.placements (initials circle, company + role badge); Part B live "Open Vacancies" (pulsing brand-green dot) from fetched vacancies: jobType label map, MapPin location, line-clamp description, outline Apply Now button (target _blank); friendly empty state with enquire CTA
- about-section.tsx: story in brutal-card with big pink Quote, whyUs grid with colored dots, mentors grid (initials circle, colored-border role Badge, bio)
- contact-section.tsx: "LET'S TALK." display heading, 4 channel cards (WhatsApp/Gmail/Instagram/LinkedIn — all hrefs derived from siteConfig.links incl. gmail address + @instagram handle parsed from config), info panel with promises + tel link, EnquiryForm (source "contact") with toast.success onSuccess + FormSkeleton/ContentError handling
- Self-review: scoped tsc (strict, --noEmit, public folder + deps) → 0 errors; scoped eslint on src/components/public → 0 errors; fixed issues found: union-typed siteConfig placements props (→ explicit interface), tailwind-merge mangling of w-[min(...)] (→ max-w calc classes), shadow-lg beating shadow-hard in cascade inside DialogContent (→ shadow-hard! important), removed willChange from Transition typing, restructured setState-in-effect (react-hooks/set-state-in-effect) in hook + counter to be lint-clean; verified no horizontal-overflow patterns (break-words/min-w-0/overflow-hidden), no hardcoded social/phone URLs (grep-verified), no #/admin link

Stage Summary:
- Created (all "use client", all under src/components/public/):
  - navbar.tsx → Navbar({ route: PublicRoute })
  - footer.tsx → Footer()
  - floating-buttons.tsx → FloatingButtons()
  - section-heading.tsx → SectionHeading({ eyebrow, title, highlight?, description?, align? })
  - marquee.tsx → RecruiterMarquee()
  - stat-cards.tsx → StatCards()
  - enquiry-form.tsx → EnquiryForm({ courses, initialCourseId?, source, onSuccess? })
  - enquiry-dialog.tsx → EnquiryDialog({ courses, initialCourseId?, source, triggerLabel, triggerClassName? })
  - home-section.tsx → HomeSection()
  - courses-section.tsx → CoursesSection()
  - achievements-section.tsx → AchievementsSection()
  - placements-section.tsx → PlacementsSection()
  - about-section.tsx → AboutSection()
  - contact-section.tsx → ContactSection()
- Extra support files (also under src/components/public/, allowed by task constraints):
  - use-public-content.ts → usePublicContent(): { data: PublicContentDTO | null, error: string | null, loading: boolean, refetch() }
  - content-state.tsx → ContentError({ message, onRetry })
- All exports match page.tsx imports exactly; no files outside src/components/public touched
- next steps: Task 2-b admin UI (src/components/admin/admin-app is imported by page.tsx but not yet built), then Task 3 integration/QA

---
Task ID: 2-b
Agent: full-stack-developer
Task: Admin portal UI — neobrutalist React components for login, forced password change, dashboard, enquiries (+detail drawer), courses/vacancies/achievements CRUD, users & audit logs (SUPER_ADMIN-gated)

Work Log:
- Grounded in Task 1 backend: read worklog.md, src/lib/types.ts (DTOs/STATUS_COLORS/ENQUIRY_STATUSES), src/lib/client.ts (api/qs), src/config/site.config.ts, globals.css tokens, shadcn/ui component APIs, and the actual route files (/api/auth/*, /api/enquiries*, /api/users*, /api/courses, /api/vacancies, /api/achievements, /api/audit-logs, validators.ts) to match response shapes + Zod field rules exactly
- Created src/components/admin/admin-ui.tsx — shared kit: AdminPageHeader, AdminStatCard (button-variant for clickable stat cards), StatusBadge (STATUS_COLORS-driven, children override for "NEW × 4" counts), EmptyState, TableSkeleton, ConfirmDeleteDialog (AlertDialog, stays open with spinner during async confirm); plus session-event helpers: notifySessionExpired/notifyPasswordChangeRequired (window CustomEvents consumed by AdminApp), toastApiError (401 → login event, PASSWORD_CHANGE_REQUIRED → password event, else toast server message), validatePassword (8+, letter+number), FIELD_CLASS/SELECT_TRIGGER_CLASS, date helpers (fmtDate/fmtDateShort/fmtDateTime/isDateOverdue)
- login-view.tsx — full-screen dot-grid + brutal-card, show/hide password, POST /api/auth/login, 401/429/403 messages toasted verbatim (lockout text), security footnote + back-to-site link
- change-password-view.tsx — ShieldAlert card, 3 password fields with toggles, inline aria-live validation (≥8 chars, letter+number, confirm match), POST /api/auth/change-password → onDone(user)
- admin-app.tsx — root shell: phase machine loading→login→password→ready via GET /api/auth/me; listens for session-expired / password-change-required events (deduped expiry toast); desktop sticky ink sidebar (role badge, email, View Site, Logout) + mobile sticky top bar with scrollable nav chips; Users + Audit Logs nav ONLY when role === "SUPER_ADMIN"; views keyed to remount
- dashboard-view.tsx — GET /api/dashboard; stat grid (Today's/Overdue follow-ups clickable → enquiries; overdue card pink standout only when >0; New w/ "+N today"; Enrolled; Total; Open Vacancies); framer-motion 7-day bar chart (whileInView, hover pink, count labels); StatusBadge breakdown with counts; skeleton + retry-on-failure
- enquiries-view.tsx — debounced search (350ms), status/course/assignee selects, Due Today + Overdue toggle buttons, from/to date inputs, clear-filters; "Assigned to me" maps "me"→user.id (server treats assignedToId literally); GET /api/enquiries paginated (abortable); Excel export via window.location.href with same filters (no paging); desktop table (hidden md:block, overflow-x-auto nice-scrollbar) + mobile card list (md:hidden); row click opens drawer; ADMIN sees "values are masked" note; pagination footer
- enquiry-drawer.tsx — Sheet side=right w-[min(520px,100vw)]; GET /api/enquiries/[id] (stale-guarded skeleton, 404 → toast+close); tel:/mailto: links, source badge, created/updated, message quote; WhatsApp button (wa.me deep link, aria-label); status Select (PATCH {status}, colored dots from STATUS_COLORS) + assignment Select (SUPER_ADMIN only — fetches /api/users, active users, PATCH {assignedToId|null}); ADMIN masking note; follow-up timeline (sorted desc, next-action pills turn pink when overdue, "by X · date") + add form (POST followups, optional date, refetches detail); SUPER_ADMIN-only danger zone → ConfirmDeleteDialog → DELETE → close + refresh
- vacancies-view.tsx / achievements-view.tsx / courses-view.tsx — full CRUD per contract: desktop table vs mobile cards (vacancies), responsive card grid (achievements, Trophy empty state), track-grouped sections AVIATION(Plane/blue)+IT(Code2/cyan) (courses); open/active Switch toggles PATCH inline with toasts; add/edit dialogs with inline client validation mirroring Zod (title/desc/duration/link http(s)/date YYYY-MM-DD/syllabus one-per-line); deletes via ConfirmDeleteDialog (course delete note: "enquiries are detached, not deleted"); job-type and achievement-type color-coded badges
- users-view.tsx — SUPER_ADMIN only; table+cards with role badges (SUPER_ADMIN pink / ADMIN blue), active Switch (disabled on own row), mustChangePassword flag badge, created date; Add User dialog (name/email/temp password/role → POST, account flagged must change at first login); Reset Password dialog (client rules + confirm → PATCH {password} → "must change it at next login"); no delete UI anywhere; server 400s (self/last-super deactivation) surfaced via toastApiError
- audit-logs-view.tsx — SUPER_ADMIN only; debounced action/entity filters (uppercased for SQLite contains), GET /api/audit-logs paginated (20/page, abortable); color-family action badges (failed red > login green > export blue > delete pink > create cyan > update/change/reset/activate orange > gray); entity ID/IP mono truncated with title tooltips; meta w-48 truncate + title; empty state + pagination
- Self-review pass: all files "use client"; no alert()/confirm() (AlertDialog confirms); no unused imports (fixed drawer's sonner import + EmptyState, rebuilt vacancies dialog Select trigger); hooks-order safe (all hooks before early returns in AdminApp); exhaustive-deps handled (useCallback/abort controllers/one scoped eslint-disable in drawer); no edits outside src/components/admin (worklog excepted); lint/build/tsc NOT run per instructions
Stage Summary:
- Files created (12, all in /home/z/my-project/src/components/admin/): admin-ui.tsx (exports AdminPageHeader, AdminStatCard, StatusBadge, EmptyState, TableSkeleton, ConfirmDeleteDialog, toastApiError, validatePassword, notifySessionExpired, notifyPasswordChangeRequired, SESSION_EXPIRED_EVENT, PASSWORD_CHANGE_REQUIRED_EVENT, FIELD_CLASS, SELECT_TRIGGER_CLASS, fmtDate, fmtDateShort, fmtDateTime, isDateOverdue), login-view.tsx (LoginView), change-password-view.tsx (ChangePasswordView), admin-app.tsx (AdminApp — page.tsx should render <AdminApp /> from "@/components/admin/admin-app"), dashboard-view.tsx (DashboardView), enquiries-view.tsx (EnquiriesView), enquiry-drawer.tsx (EnquiryDrawer), vacancies-view.tsx (VacanciesView), achievements-view.tsx (AchievementsView), courses-view.tsx (CoursesView), users-view.tsx (UsersView), audit-logs-view.tsx (AuditLogsView)
- Integration notes for Task 3: src/app/page.tsx must render <AdminApp /> (public site + admin coexistence strategy is the integrator's call); ADMIN list masking is server-side and rendered as-is; drawer PATCH merges assignedTo without email (display uses name only); export uses current filters minus paging; date-fns v4 + framer-motion v12 + sonner (Toaster already mounted in root layout) are the only new runtime deps used

---
Task ID: 3
Agent: Z.ai Code (lead)
Task: Integration QA — lint/typecheck, functional API tests, browser verification, fixes, pristine-state restore

Work Log:
- bunx tsc --noEmit: fixed duplicate NextResponse import in src/lib/validators.ts → project source 100% type-clean (only pre-existing sandbox examples/skills errors remain, not part of the app)
- bun run lint: removed unused eslint-disable in enquiry-drawer.tsx → 0 errors, 1 acceptable warning (Google Fonts link false positive in App Router)
- curl API test suite (30 checks): login 401/200 + cookie HttpOnly/SameSite=Strict; ADMIN list masked (91••••••••23) vs SUPER full; ADMIN 403 on DELETE enquiry, /api/users, /api/audit-logs; no-cookie 401; enquiry 201/400/honeypot-silent-drop/429 rate limit; export = valid "Microsoft Excel 2007+" bytes; audit trail (LOGIN_FAILED/SUCCESS, STATUS_CHANGE, FOLLOWUP_CREATE, EXPORT, PASSWORD_CHANGE, LOGOUT); login lockout after 5 fails → 429 even with correct password; logout invalidates session server-side; security headers (CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy); full CRUD cycles for vacancies/achievements/courses
- agent-browser E2E: home hero + counters settle at 500+/20+/1200+/40+ (once-only), marquee loops, courses tabs + Enquire Now dialog with pre-selected course, public enquiry submitted → saved with source "courses:cabin-crew-training" → visible in admin, admin login → FORCED password change → dashboard, enquiries table + drawer (status PATCH, follow-up timeline, WhatsApp button, SUPER_ADMIN-only delete via confirm dialog), Excel export 200 from browser session, audit logs view, users view, 360px mobile pass (no overflow-x anywhere, footer cleared of floating buttons)
- Fixes applied: (1) SheetTitle added to enquiry-drawer loading state (Radix a11y warning), (2) footer pb-24→pb-40 so floating WhatsApp/Call buttons never cover footer text on mobile, (3) overdue dashboard card bg-brand-pink! important — brutal-card-sm utility was overriding the pink bg leaving white-on-white text
- Restored pristine seed state: Ishita=NEW, Fatima=FOLLOWUP, both accounts ChangeMe@12345 + mustChangePassword=true, sessions cleared; test enquiries deleted (one deleted via the UI delete flow as an E2E check)

Stage Summary:
- ALL acceptance criteria verified: neo-brutalist responsive public site; enquiry → DB → admin instantly; valid .xlsx export with filters; ADMIN 403 on delete/user/audit endpoints even via direct API; lockout + export audit entries work; social links all from site.config.ts; admin edits reflect on public site (no-store content API); lint + tsc clean
- Admin access: #/admin in the URL; seeded creds admin@skyora.edu.in / counsellor@skyora.edu.in (both ChangeMe@12345, forced change on first login)
- Remaining false-positive warning: next/font no-page-custom-font (App Router loads layout <head> globally — harmless)

---
Task ID: 3-b
Agent: Z.ai Code (lead)
Task: Session-resume re-verification — confirm environment still healthy after context restart

Work Log:
- Confirmed dev server running on :3000 (GET / 200); EADDRINUSE in dev.log is a stale duplicate-start artifact, serving instance unaffected
- DB intact (db/custom.db); GET /api/public/content returns seeded 7-course catalogue
- agent-browser E2E re-check: public home renders (hero/stats/marquee/two tracks/testimonials/CTA/footer), zero console errors; #/admin login form renders; admin@skyora.edu.in + ChangeMe@12345 login → forced "SET A NEW PASSWORD" gate; password changed → dashboard + enquiries view render with 5 seeded rows, filters and export present; logout
- Restored pristine seed state: both users passwordHash=ChangeMe@12345 (bcrypt 12) + mustChangePassword=true; sessions cleared (logout invalidated first session; 2 curl-test sessions deleted after)
- bun run lint: 0 errors, 1 known false-positive warning (no-page-custom-font, App Router layout — harmless)

Stage Summary:
- Project remains complete and verified after session restart; no code changes required
- Access: Preview Panel on / ; admin via #/admin (admin@skyora.edu.in / counsellor@skyora.edu.in, both ChangeMe@12345, forced change on first login)
- Next: user to send follow-up Prompt 1 (design refinements) when ready

---
Task ID: 4
Agent: Z.ai Code (lead)
Task: Phase A — Design refinements (Prompts 1–4): hero clamp, count-once stats, marquee spec, 3-breakpoint mobile audit

Work Log:
- Prompt 1: hero h1 switched from breakpoint sizes (text-5xl…xl:text-8xl) to exact clamp → text-[clamp(3rem,8vw,7rem)]; pink highlight word, staggered fade-in (0.12s) and shadow-displacement hover (brutal-hover) were already compliant — verified, no change
- Prompt 2: stat cards already useInView(once) + count 0→value with fire-once ref; added tabular-nums to the number line to stop digit jitter during count; browser-verified value settles at 500+ and does NOT re-run on scroll re-entry
- Prompt 3: marquee verified compliant as built — 30s linear infinite, translateX(-50%) double-copy loop, hover pause, reduced-motion fallback (animation:none + horizontal scroller)
- Prompt 4 (mobile audit 360/768/1280): programmatic overflow sweep of all 6 public routes × 3 viewports → 0px horizontal overflow everywhere; measured h1 computed sizes 48px@360 / 61.44px@768 (8vw) / clamp verified; footer privacy note vs floating buttons → 0px vertical overlap (20px clear gap, no blocking); hamburger opens/closes at 360; marquee duration 30s confirmed via computed style; screenshots reviewed at 360 hero/footer + 1280 hero/courses; zero console/page errors
- bun run lint: 0 errors (same single known false-positive font warning); project tsc: 0 errors in src/

Stage Summary:
- Files changed: src/components/public/home-section.tsx (hero clamp), src/components/public/stat-cards.tsx (tabular-nums)
- Phase A complete; next phase = B (security hardening): Prompt 5 Turnstile + per-IP enquiry rate limit, Prompt 6 TOTP 2FA for SUPER_ADMIN, Prompt 7 security self-audit table (+diff)

---
Task ID: 5
Agent: Z.ai Code (lead)
Task: Phase B — Security hardening (Prompts 5–7): Turnstile, TOTP 2FA, security self-audit

Work Log:
- Prompt 5 (Turnstile): installed nothing new (fetch-based siteverify); src/lib/turnstile.ts verifies tokens against Cloudflare siteverify (fail-closed on network error, pass-through when TURNSTILE_SECRET_KEY unset); src/components/public/turnstile-widget.tsx (explicit render, script singleton, expired/error callbacks, renders nothing without NEXT_PUBLIC_TURNSTILE_SITE_KEY); enquiry-form.tsx gates submit until token present, remounts widget per attempt (single-use tokens), 429/403 messages toasted; middleware CSP extended (challenges.cloudflare.com in script/img/connect/frame-src); .env + .env.example wired (dev uses Cloudflare always-pass TEST keys)
- Prompt 6 (TOTP 2FA): installed otplib@13 + qrcode; User table + totpSecret/totpEnabled/recoveryCodes (db:push); auth.ts — HMAC-signed 5-min skyora_mfa cookie (timingSafeEqual), resolveMfaActor (mfa-cookie OR full session for self-enrollment), recovery codes (10× high-entropy, SHA-256 hashed, single-use, normalize+constant-time match); routes: /api/auth/mfa/setup (QR data-URL + otpauth URI + manual secret), /confirm (first code → enable + issue 10 codes + session), /verify (TOTP or recovery code → session, shares 5-fail→15-min lockout with password), /disable (password consent; SUPER_ADMIN → 403 MFA_MANDATORY); login route: SUPER_ADMIN/totpEnabled users get {mfaRequired,mustEnroll} + mfa cookie instead of session; audit actions MFA_CHALLENGE/MFA_SETUP_STARTED/MFA_ENABLED/MFA_DISABLED/MFA_DISABLE_FAILED/MFA_LOGIN_SUCCESS/MFA_CODE_FAILED/RECOVERY_CODE_USED (purple family in audit view); middleware: /api/auth/mfa added to public paths (routes self-enforce); SessionUser.totpEnabled added end-to-end
- Admin UI: mfa-view.tsx (enroll: QR+manual secret → 6-digit confirm → 10 recovery codes shown once with copy + save-confirm checkbox; verify: TOTP/recovery input); security-view.tsx (status card, ADMIN opt-in dialog + disable-with-password dialog, super-admin mandatory note + disabled button); admin-app phase machine extended (login → mfa → password → ready) — FIXED unreachable mfa phase bug (phase==="login" || !user swallowed it); Security nav for all roles
- Prompt 7 (self-audit): findings table in chat report (see conversation), all HIGH/MED items fixed in this phase
- Tests: 19-step curl suite (turnstile 403/201, admin direct login, super mfa-gated login + no-session 401, setup/auth-guards, confirm w/ real TOTP code via otplib, wrong code 400, recovery code single-use, lockout counters, admin opt-in→opt-out, PASSWORD_CHANGE_REQUIRED guard interplay, audit trail shows full MFA lifecycle, super disable 403); browser E2E: public form shows Cloudflare challenge iframe + auto-solves + submits successfully; admin login → MFA verify screen → wrong code toast → TOTP code → dashboard; Security view mandatory state; fixed NextResponse import bug caught by tsc
- lint: 0 errors/1 known font warning; tsc: 0 errors in src/; pristine state restored (both users ChangeMe@12345 + mustChangePassword=true + 2FA wiped, sessions cleared, 2 test enquiries removed, 5 seed enquiries intact)

Stage Summary:
- Files added: src/lib/turnstile.ts, src/components/public/turnstile-widget.tsx, src/components/admin/{mfa-view,security-view}.tsx, src/app/api/auth/mfa/{setup,confirm,verify,disable}/route.ts
- Files changed: auth.ts, validators.ts, types.ts, audit.ts, middleware.ts, enquiry route, login route, enquiry-form.tsx, login-view.tsx, admin-app.tsx, audit-logs-view.tsx, prisma/schema.prisma, .env, .env.example
- Production TODO (user): set REAL Turnstile keys (test keys don't stop bots), AUTH_SECRET, swap SQLite→Postgres if desired
- Next phase = C (features): Prompt 8 CSV import, Prompt 9 follow-up badges + reminders, Prompt 10 WhatsApp deep-link

---
Task ID: 6
Agent: Z.ai Code (lead)
Task: Phase C — Feature completion (Prompts 8–10): CSV import, follow-up reminders + email cron, WhatsApp deep-link audit

Work Log:
- Context note: Phase C code was found fully implemented from the lost-context session (backend + UI + wiring all present); this task re-verified everything end-to-end and confirmed production-readiness — no code changes were required
- Prompt 8 (CSV import): dependency-free RFC-4180 parser (src/lib/csv.ts: quotes, escaped quotes, CRLF, BOM; last-10-digit phone normalization); POST /api/enquiries/import — any active admin, 5 imports/user/hour → 429, ≤500 rows/500KB, flexible header mapping (name*, phone* required; email/course/message optional), course matched by title OR slug (case-insensitive, active only), row-level Zod, de-dup against DB + in-file phones, skipped rows returned with per-row reasons, ENQUIRY_IMPORT audit; ImportCsvDialog (file picker 500KB cap, downloadable template, result panel with skipped-row list, list auto-refresh); Import button in Enquiries header
- Prompt 9 (reminders): src/lib/mailer.ts — optional SMTP (nodemailer cached transport; SMTP_HOST/PORT/SECURE/USER/PASS/FROM; unset → {sent:false, SMTP_NOT_CONFIGURED}); src/lib/reminders.ts — buildReminderDigest (all open enquiries excluding ENROLLED/LOST whose latest next-action ≤ end of today, split dueToday/overdue, assignedTo + course joined) + runReminderJob (HTML+text digest to all active staff or REMINDER_TO override, console fallback when SMTP unset, REMINDER_RUN audit, never throws); src/lib/reminder-cron.ts — node-cron daily at REMINDER_HOUR:REMINDER_MINUTE (default 9:00) in REMINDER_TZ (default Asia/Calcutta), hot-reload guarded; started via src/instrumentation.ts register() (Node runtime only); GET/POST /api/reminders SUPER_ADMIN-only (digest preview / manual send); RemindersCard on dashboard (super admin only, digest list with overdue/today badges, Refresh + Send now with honest SMTP result toasts)
- Prompt 10 (WhatsApp audit): src/lib/track-whatsapp.ts — fire-and-forget client helper (sendBeacon Blob → fetch keepalive fallback, never breaks navigation); POST /api/track/whatsapp — public, 30 events/IP/min → 429, Zod context (1-40 chars slug) + optional enquiryId, attaches staff session when present, WHATSAPP_CLICKED audit rows; wired into floating buttons, navbar, footer, contact section, home CTA (contexts: floating/navbar/footer/contact/home_cta) and admin enquiry drawer (admin_lead with enquiryId)
- audit-logs-view: color families already extended (WHATSAPP green, REMINDER orange, IMPORT cyan, MFA purple from Phase B)
- deps already in package.json: node-cron@4.6, nodemailer@10, @types/node-cron, @types/nodemailer
- Verification — bunx tsc: 0 errors in src/; bun run lint: 0 errors (1 known font false-positive)
- API suite (33/34 + 1 by-design): counsellor login→forced change; import 401 unauth, 400 BAD_HEADER, mixed CSV → 2 imported/3 skipped (duplicate-phone + unknown-course + invalid-phone reasons), title-matched AND slug-matched course rows with source=import, re-import → 0 imported (dedup), imported rows in admin list; reminders 403 for ADMIN both verbs; track 202/400-invalid-context/202-with-enquiryId, 31st/min → 429; super login mfaRequired→setup→confirm (otplib generateSync)→10 recovery codes→password change; GET digest 200 (2 overdue: Arnav 30-Sep, Fatima 3-Oct); POST manual run → mail.sent=false SMTP_NOT_CONFIGURED honest result; audit trail confirmed ENQUIRY_IMPORT + REMINDER_RUN + WHATSAPP_CLICKED + MFA lifecycle; import rate limit 5/hour tripped on 5th import in window → 429 (control working)
- dev.log: "[reminders] daily digest cron scheduled: \"0 9 * * *\" (Asia/Calcutta)" at boot; "[reminders] SMTP not configured — digest for 2 follow-up(s) follows:" on manual runs
- Browser E2E: counsellor login→forced change→Enquiries (Import CSV button); super admin login→QR+manual-key enroll→real TOTP accepted→10 recovery codes (CONTINUE gated on save-confirm checkbox)→forced password change; dashboard RemindersCard "0 due today · 2 overdue" with student rows; Send now → "SMTP is not configured — digest logged to server console" toast; import as super admin → "1 of 2 imported" + skipped row "#3 Dup Rahul — duplicate — this phone number already exists"; imported lead in table with matched course; audit view shows ENQUIRY_IMPORT/REMINDER_RUN/MFA_ENABLED/WHATSAPP_CLICKED badges; live public footer WhatsApp click → new WHATSAPP_CLICKED {"context":"footer"} from ::1 (sendBeacon survives navigation); 360px mobile: 0 horizontal overflow on audit/enquiries/import-dialog/dashboard, RemindersCard renders; 0 console/page errors
- Pristine state restored: source=import rows deleted (5 seed enquiries remain), sessions cleared, both users ChangeMe@12345 + mustChangePassword=true + 2FA wiped (totpSecret/totpEnabled/recoveryCodes reset), ad-hoc test scripts removed

Stage Summary:
- Files (all present & verified): src/lib/{csv,reminders,reminder-cron,mailer,track-whatsapp}.ts, src/instrumentation.ts, src/app/api/enquiries/import/route.ts, src/app/api/reminders/route.ts, src/app/api/track/whatsapp/route.ts, src/components/admin/{import-dialog,reminders-card}.tsx; wiring: enquiries-view (Import button), dashboard-view (RemindersCard), enquiry-drawer + 5 public components (trackWhatsApp)
- New env vars (optional): SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, REMINDER_TO, REMINDER_HOUR, REMINDER_MINUTE, REMINDER_TZ
- Phase C complete; next phase = D: Prompt 11 full QA regression (+diff summary), Prompt 12 deployment prep (env.example/README/vercel.json/robots.txt) — never skip 12

---
Task ID: 7
Agent: Z.ai Code (lead)
Task: Phase D — Prompt 11 (full regression QA + diff summary) and Prompt 12 (deployment prep)

Work Log:
- ENV REGRESSION FOUND & FIXED: the context-loss session had stripped .env down to DATABASE_URL only (no AUTH_SECRET → insecure dev fallback warning; no reminder schedule; no Turnstile keys) and .env.example was missing. Restored .env (AUTH_SECRET from git HEAD, Turnstile DEV TEST key pair, REMINDER_HOUR/MINUTE/TZ) and recreated .env.example as a full production template. Restarted dev server ("Environments: .env", cron scheduled at boot)
- Prompt 11 (full regression): wrote scripts/test-regression.ts — 70 automated API checks across 8 sections: (A) security headers + public content, (B) enquiry Zod/turnstile-403/honeypot-fake-201/429@4th/valid-201-with-token (real Cloudflare siteverify call), (C) login/cookie flags/generic-401/forced-change/list-masking/full-detail/RBAC-403s (DELETE enquiry, users, audit-logs, reminders)/401 no-cookie/export PK bytes, (D) full MFA lifecycle (super mfaRequired+mustEnroll → mfa-cookie-not-a-session → setup → wrong-code-400 → confirm+10 recovery codes → password change → disable 403 MFA_MANDATORY → re-login enrolled → recovery-code login → replay rejected → ADMIN opt-in/opt-out + wrong-password disable), (E) lockout (5 fails → 429 incl. correct password), (F) Phase C (import header/row, whatsapp 202, reminders digest), (G) 10 audit actions present, (H) vacancy CRUD smoke → 70/70 PASS after fixing harness bugs (call-signature mixup sending no bodies; same-site cookie case; /api/users shape; session rotation after recovery-code login; run-unique rate-limit IP buckets; missing required fields in test payloads; self-healing pre-reset + emergency reset on crash)
- Browser E2E (public): 6 routes × 360px sweep → 0px horizontal overflow, 0 console errors; admin login renders; Turnstile widget mounts (challenge iframe present in a11y tree, shadow-DOM hidden from querySelector); full human-path enquiry verified END-TO-END (label-based fills → widget token → POST 201 → row persisted with source=contact → cleaned up); honeypot verified working against automation (agent-browser ref-based fills typed into the off-screen honeypot input → silent fake "Success!" 201 with NO row — the anti-bot caught the bot)
- Prompt 12 (deployment prep): README.md (overview, features, security architecture table, stack, quick start, seeded creds + change-immediately warning, scripts, env var table with Turnstile test-key warning, CSV format spec, reminder digest config, deployment notes incl. SQLite→Postgres on serverless, project structure); vercel.json (framework preset + backup security headers for static assets + no-store on /api/*; valid JSON verified); robots.txt verified (Disallow /admin incl. hash variant); .env.example complete
- Final checks: bun run lint → 0 errors (1 known font false-positive); bunx tsc --noEmit → 0 errors in src/; GET / → 200; pristine state confirmed (5 seed enquiries, 0 sessions, both users ChangeMe@12345 + mustChangePassword=true + 2FA wiped); ad-hoc test scripts removed
- Production TODO (user): real Turnstile keys, real AUTH_SECRET (openssl rand -hex 32), SMTP creds for digest email, SQLite→Postgres if serverless, change seeded passwords, domain + Cloudflare

Stage Summary:
- ALL PHASES COMPLETE (A design, B security, C features, D QA + deployment prep)
- Files added this task: README.md, vercel.json, .env.example (recreated), scripts/test-regression.ts (removed after green run)
- Files restored: .env (full var set)
- Cumulative diff across Phases B–D: +8 lib files (turnstile, csv, mailer, reminders, reminder-cron, track-whatsapp + auth/validators/rate-limit/audit/types extensions), +8 API routes (mfa/setup|confirm|verify|disable, enquiries/import, reminders, track/whatsapp), +4 admin views (mfa-view, security-view, import-dialog, reminders-card) + admin-app phase machine, +1 public component (turnstile-widget) + enquiry-form gating, prisma User + 2FA columns, middleware CSP + mfa paths, .env/.env.example/README/vercel.json
- Next: none — project is launch-ready pending user-side production config

---
Task ID: B-0 (preview panel hotfix)
Agent: Z.ai Code (main)
Task: Fix "preview panel not opening" — site was blocked from iframe embedding by Phase A security headers.

Work Log:
- Diagnosed: dev server + Caddy gateway both serving 200; root cause was `x-frame-options: DENY` + CSP `frame-ancestors 'none'` applied unconditionally in src/middleware.ts (added during Phase A hardening), which blocks the preview panel's cross-origin iframe.
- Fix: made clickjacking headers environment-aware in src/middleware.ts — production keeps `frame-ancestors 'none'` + `X-Frame-Options: DENY`; dev sandbox now serves `frame-ancestors *` and omits X-Frame-Options so the preview panel can embed the site.
- Verified: vercel.json (production deployment) still enforces X-Frame-Options: DENY; middleware hot-reloaded cleanly; site renders in browser with zero console errors; lint 0 errors (1 pre-existing unrelated font warning).

Stage Summary:
- Preview panel embedding unblocked; production clickjacking protection unchanged.
- Files touched: src/middleware.ts only (6-line change).
