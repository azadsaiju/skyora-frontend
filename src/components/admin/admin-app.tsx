"use client";

/**
 * AdminApp — root shell for the Skyora admin portal.
 * Handles the auth phase machine (loading → login → password → ready),
 * desktop sidebar + mobile top bar navigation, role-gated nav items
 * (Users + Audit Logs only for SUPER_ADMIN) and global session events.
 */

import * as React from "react";
import {
  Briefcase,
  ExternalLink,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  ScrollText,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api, clearSessionToken, clearMfaPending } from "@/lib/client";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PASSWORD_CHANGE_REQUIRED_EVENT,
  SESSION_EXPIRED_EVENT,
} from "@/components/admin/admin-ui";
import { LoginView } from "@/components/admin/login-view";
import { ChangePasswordView } from "@/components/admin/change-password-view";
import { MfaView } from "@/components/admin/mfa-view";
import { SecurityView } from "@/components/admin/security-view";
import { DashboardView } from "@/components/admin/dashboard-view";
import { EnquiriesView } from "@/components/admin/enquiries-view";
import { CoursesView } from "@/components/admin/courses-view";
import { VacanciesView } from "@/components/admin/vacancies-view";
import { AchievementsView } from "@/components/admin/achievements-view";
import { UsersView } from "@/components/admin/users-view";
import { AuditLogsView } from "@/components/admin/audit-logs-view";

type AdminView =
  | "dashboard"
  | "enquiries"
  | "courses"
  | "vacancies"
  | "achievements"
  | "security"
  | "users"
  | "audit";

type Phase = "loading" | "login" | "mfa" | "password" | "ready";

const NAV_ITEMS: { id: AdminView; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "enquiries", label: "Enquiries", icon: Inbox },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "vacancies", label: "Vacancies", icon: Briefcase },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const SUPER_NAV_ITEMS: { id: AdminView; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
];

export function AdminApp() {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [view, setView] = React.useState<AdminView>("dashboard");
  const [mfaEnroll, setMfaEnroll] = React.useState(false);
  const lastExpiredToastRef = React.useRef(0);

  // Restore the session cookie on mount.
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ user: SessionUser }>("/api/auth/me");
        setUser(res.user);
        setPhase(res.user.mustChangePassword ? "password" : "ready");
      } catch (err) {
        const e = err as Error & { status?: number };
        if (e.status !== 401) {
          toast.error(e.message || "Could not verify your session.");
        }
        setPhase("login");
      }
    })();
  }, []);

  // Global session events fired by the shared api-error helper.
  React.useEffect(() => {
    function onSessionExpired() {
      setUser(null);
      setView("dashboard");
      setPhase("login");
      const now = Date.now();
      if (now - lastExpiredToastRef.current > 2000) {
        lastExpiredToastRef.current = now;
        toast.error("Session expired — please sign in again.");
      }
    }
    function onPasswordChangeRequired() {
      setPhase((p) => (p === "login" ? p : "password"));
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    window.addEventListener(
      PASSWORD_CHANGE_REQUIRED_EVENT,
      onPasswordChangeRequired
    );
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      window.removeEventListener(
        PASSWORD_CHANGE_REQUIRED_EVENT,
        onPasswordChangeRequired
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie/token may already be gone — sign out locally regardless.
    }
    clearSessionToken();
    clearMfaPending();
    toast.success("Signed out");
    setUser(null);
    setView("dashboard");
    setPhase("login");
  }

  if (phase === "loading") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream"
        role="status"
        aria-label="Loading admin portal"
      >
        <span className="flex size-16 animate-pulse items-center justify-center rounded-xl border-2 border-ink bg-ink font-display text-2xl text-white shadow-hard">
          S
        </span>
        <p className="font-display text-lg uppercase tracking-wide">
          Skyora Admin
        </p>
        <Loader2
          className="size-4 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (phase === "login") {
    return (
      <LoginView
        onSuccess={(u) => {
          setUser(u);
          setPhase(u.mustChangePassword ? "password" : "ready");
        }}
        onMfaRequired={(mustEnroll) => {
          setMfaEnroll(mustEnroll);
          setPhase("mfa");
        }}
      />
    );
  }

  // MFA challenge: no session exists yet (user is intentionally still null).
  if (phase === "mfa") {
    return (
      <MfaView
        mustEnroll={mfaEnroll}
        onAuthenticated={(u) => {
          setUser(u);
          setPhase(u.mustChangePassword ? "password" : "ready");
        }}
        onExpired={() => {
          setPhase("login");
        }}
      />
    );
  }

  if (!user) {
    return (
      <LoginView
        onSuccess={(u) => {
          setUser(u);
          setPhase(u.mustChangePassword ? "password" : "ready");
        }}
        onMfaRequired={(mustEnroll) => {
          setMfaEnroll(mustEnroll);
          setPhase("mfa");
        }}
      />
    );
  }

  if (phase === "password") {
    return (
      <ChangePasswordView
        user={user}
        onDone={(u) => {
          setUser(u);
          setPhase("ready");
        }}
      />
    );
  }

  const isSuper = user.role === "SUPER_ADMIN";
  const chipItems = isSuper ? [...NAV_ITEMS, ...SUPER_NAV_ITEMS] : NAV_ITEMS;

  function renderView(u: SessionUser, v: AdminView): React.ReactNode {
    switch (v) {
      case "dashboard":
        return (
          <DashboardView
            key="dashboard"
            user={u}
            onOpenEnquiries={() => setView("enquiries")}
            onOpenSecurity={() => setView("security")}
          />
        );
      case "enquiries":
        return <EnquiriesView key="enquiries" user={u} />;
      case "courses":
        return <CoursesView key="courses" />;
      case "vacancies":
        return <VacanciesView key="vacancies" />;
      case "achievements":
        return <AchievementsView key="achievements" />;
      case "security":
        return <SecurityView key="security" user={u} onUserUpdate={setUser} />;
      case "users":
        return u.role === "SUPER_ADMIN" ? (
          <UsersView key="users" user={u} />
        ) : null;
      case "audit":
        return u.role === "SUPER_ADMIN" ? (
          <AuditLogsView key="audit" />
        ) : null;
    }
  }

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-ink text-white md:hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-white/30 bg-white font-display text-base text-ink"
              aria-hidden="true"
            >
              S
            </span>
            <span className="truncate font-display text-sm uppercase tracking-wide">
              Skyora Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleLogout()}
            className="text-white hover:bg-white/10 hover:text-white"
            aria-label="Log out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <nav
          aria-label="Admin sections"
          className="nice-scrollbar flex gap-2 overflow-x-auto px-4 pb-3"
        >
          {chipItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg border-2 px-3 py-1.5 font-grotesk text-xs font-bold transition-colors",
                view === item.id
                  ? "border-white bg-white text-ink"
                  : "border-white/30 text-white/80 hover:bg-white/10"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside
        aria-label="Admin navigation"
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-ink bg-ink p-4 text-white md:flex"
      >
        <div className="flex items-center gap-2.5 px-1 pb-4">
          <span
            className="flex size-10 items-center justify-center rounded-lg border-2 border-white/30 bg-white font-display text-lg text-ink"
            aria-hidden="true"
          >
            S
          </span>
          <div>
            <p className="font-display text-sm uppercase leading-none">
              Skyora
            </p>
            <p className="mt-1 font-grotesk text-[10px] font-bold uppercase tracking-widest text-white/60">
              Admin Portal
            </p>
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-grotesk text-sm font-bold transition-colors hover:bg-white/10",
                view === item.id ? "bg-white text-ink" : "text-white/80"
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          ))}
          {isSuper ? (
            <>
              <div
                className="my-2 border-t border-white/20"
                aria-hidden="true"
              />
              {SUPER_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  aria-current={view === item.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-grotesk text-sm font-bold transition-colors hover:bg-white/10",
                    view === item.id ? "bg-white text-ink" : "text-white/80"
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </>
          ) : null}
        </nav>

        <div className="space-y-3 border-t border-white/20 pt-4">
          <div className="min-w-0 px-1">
            <Badge
              className={cn(
                "border-2 border-white/40 font-grotesk",
                isSuper
                  ? "bg-brand-pink text-white"
                  : "bg-brand-cyan text-ink"
              )}
            >
              {isSuper ? "SUPER ADMIN" : "ADMIN"}
            </Badge>
            <p
              className="mt-1.5 truncate font-grotesk text-xs text-white/70"
              title={user.email}
            >
              {user.email}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="justify-start border-2 border-white/40 bg-transparent font-grotesk font-bold text-white hover:bg-white/10 hover:text-white"
          >
            <a href="/">
              <ExternalLink className="size-4" aria-hidden="true" />
              View Site
            </a>
          </Button>
          <Button
            onClick={() => void handleLogout()}
            className="justify-start bg-brand-pink font-grotesk font-bold text-white hover:bg-brand-pink/90"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main id="main-content" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <div key={view}>{renderView(user, view)}</div>
        </div>
      </main>
    </div>
  );
}
