import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Map, Ticket, User, LayoutDashboard, ShieldCheck, LogIn, LogOut, ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LANGS, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/mock-db";

type NavItem = { to: string; label: string; icon: typeof Map };

const NAV: Record<Role | "guest", NavItem[]> = {
  guest: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/auth", label: "auth.signin", icon: LogIn },
  ],
  player: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/passes", label: "nav.subs", icon: Ticket },
    { to: "/profile", label: "nav.profile", icon: User },
  ],
  clubAdmin: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/staff", label: "nav.staff", icon: ClipboardCheck },
  ],
  owner: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/partner", label: "nav.partner", icon: LayoutDashboard },
  ],
  admin: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/admin", label: "nav.admin", icon: ShieldCheck },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { activeSubFor } = useStore();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = NAV[role ?? "guest"];
  const sub = role === "player" && user ? activeSubFor(user.id) : undefined;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl neon-glow bg-primary/20">
              <Flame className="size-5 text-primary" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              HotShot<span className="neon-text"> Play</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary text-foreground",
                )}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {role === "player" && (
              <div className="hidden items-center gap-3 rounded-xl border border-border bg-card/70 px-3 py-1.5 text-xs lg:flex">
                <span className="text-muted-foreground">
                  {t("shell.hoursLeft")}{" "}
                  <b className="text-accent">{sub ? (sub.hoursLeft === null ? "∞" : `${sub.hoursLeft}h`) : "0h"}</b>
                </span>
              </div>
            )}

            <div
              className="flex rounded-xl border border-border bg-card/70 p-1 text-xs font-semibold"
              role="group"
              aria-label={t("lang.label")}
            >
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={cn(
                    "rounded-lg px-2 py-1.5 transition-all",
                    lang === l.code
                      ? "bg-accent text-accent-foreground cyan-glow"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold leading-tight">{user?.name}</p>
                  <p className="text-[11px] capitalize text-muted-foreground">{t(`role.${role}`)}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/20 text-xs font-extrabold neon-glow">
                  {user?.avatarInitials}
                </span>
                <Button size="sm" variant="secondary" onClick={logout} aria-label={t("auth.signout")}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">{t("auth.signout")}</span>
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link to="/auth">
                  <LogIn className="size-4" /> {t("auth.signin")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium",
                  pathname === item.to ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
