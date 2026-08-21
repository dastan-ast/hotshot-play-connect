import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Map, Ticket, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { kzt } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { LANGS, useI18n } from "@/lib/i18n";

const NAV = {
  player: [
    { to: "/", label: "nav.map", icon: Map },
    { to: "/passes", label: "nav.passes", icon: Ticket },
    { to: "/profile", label: "nav.profile", icon: User },
  ],
  owner: [{ to: "/partner", label: "nav.partner", icon: LayoutDashboard }],
  admin: [{ to: "/admin", label: "nav.admin", icon: ShieldCheck }],
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { role, setRole, passHours, balance } = useStore();
  const { t, lang, setLang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = NAV[role];

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl neon-glow bg-primary/20">
              <Flame className="size-5 text-primary" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
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
                  {t("shell.pass")} <b className="text-accent">{passHours}h</b>
                </span>
                <span className="text-muted-foreground">
                  {t("shell.wallet")} <b className="text-foreground">{kzt(balance)}</b>
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

            <div className="flex rounded-xl border border-border bg-card/70 p-1 text-xs font-medium">
              {(["player", "owner", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 transition-all",
                    role === r ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`role.${r}`)}
                </button>
              ))}
            </div>
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
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
