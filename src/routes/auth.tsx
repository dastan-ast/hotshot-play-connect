import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Gamepad2, ClipboardCheck, LayoutDashboard, ShieldCheck, LogIn } from "lucide-react";
import { toast } from "sonner";
import { HOME_BY_ROLE, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { demoAccounts, type Role } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — HotShot Play" },
      { name: "description", content: "Вход для игроков, админов клубов, владельцев и модераторов HotShot Play." },
      { property: "og:title", content: "HotShot Play — вход" },
      { property: "og:description", content: "Один аккаунт для всех ролей платформы." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

const ROLE_ICON: Record<Role, typeof Gamepad2> = {
  player: Gamepad2,
  clubAdmin: ClipboardCheck,
  owner: LayoutDashboard,
  admin: ShieldCheck,
};

function AuthPage() {
  const { login, loginAs } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const go = (role: Role) => navigate({ to: HOME_BY_ROLE[role] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      toast.error(t("auth.invalid"));
      return;
    }
    toast.success(t("auth.welcome"));
    const account = demoAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    go(account?.role ?? "player");
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="neon-panel p-6 sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/20 neon-glow">
          <Flame className="size-6 text-primary" />
        </span>
        <h1 className="font-display mt-4 text-center text-xl font-bold">{t("auth.title")}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("auth.subtitle")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.kz"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full neon-glow">
            <LogIn className="size-4" /> {t("auth.signin")}
          </Button>
        </form>
      </div>

      <div className="neon-panel p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.demo")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {demoAccounts.map((a) => {
            const Icon = ROLE_ICON[a.role];
            return (
              <button
                key={a.email}
                onClick={() => {
                  loginAs(a.role);
                  toast.success(t("auth.welcome"));
                  go(a.role);
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 text-left transition-all hover:border-primary/50 hover:neon-glow"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15">
                  <Icon className="size-4 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`role.${a.role}`)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{a.email}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
