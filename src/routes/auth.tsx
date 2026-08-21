import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoAccounts } from "@/lib/mock-db";
import { HOME_BY_ROLE, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HotShot Play" },
      { name: "description", content: "Sign in to HotShot Play as a player, club owner or platform admin to access bookings, dashboards and QR passes." },
      { property: "og:title", content: "Sign in — HotShot Play" },
      { property: "og:description", content: "Multi-role access for gamers, club owners and platform admins." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, isAuthenticated, role } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated && role) navigate({ to: HOME_BY_ROLE[role], replace: true });
  }, [isAuthenticated, role, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      toast.error(t("auth.invalid"));
      return;
    }
    toast.success(t("auth.welcome"));
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <section className="neon-panel p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/20 neon-glow">
          <Flame className="size-6 text-primary" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">{t("auth.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("auth.email")}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="dastan@hotshot.kz" required />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("auth.password")}</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••" required />
          </div>
          <Button type="submit" className="w-full">
            <LogIn className="size-4" /> {t("auth.signin")}
          </Button>
        </form>
      </section>

      <section className="neon-panel p-6">
        <h2 className="font-bold">{t("auth.demo")}</h2>
        <div className="mt-4 space-y-2">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(a.password);
                login(a.email, a.password);
                toast.success(t("auth.welcome"));
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-left text-sm transition-all hover:border-primary/60"
            >
              <div>
                <p className="font-medium capitalize">{t(`role.${a.role}`)}</p>
                <p className="text-xs text-muted-foreground">{a.email} · {a.password}</p>
              </div>
              <span className="text-xs text-accent">{t("auth.signin")}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
