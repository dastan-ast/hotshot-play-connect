import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/set-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Пароль владельца клуба — HeadShot Play" },
      { name: "description", content: "Задайте пароль и войдите в кабинет владельца клуба HeadShot Play." },
      { property: "og:title", content: "HeadShot Play — пароль владельца клуба" },
      { property: "og:description", content: "Активация кабинета владельца клуба по приглашению." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  return (
    <div className="mx-auto max-w-md">
      <div className="neon-panel p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/20 neon-glow">
          <KeyRound className="size-6 text-primary" />
        </span>
        <h1 className="font-display mt-4 text-center text-xl font-bold">{t("setPass.title")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {hasSession === false ? t("setPass.noSession") : t("setPass.hint")}
        </p>

        {hasSession !== false && (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (password.length < 6) {
                toast.error(t("auth.weakPassword"));
                return;
              }
              if (password !== repeat) {
                toast.error(t("setPass.mismatch"));
                return;
              }
              setBusy(true);
              const { error } = await supabase.auth.updateUser({ password });
              setBusy(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success(t("setPass.saved"));
              navigate({ to: "/partner" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="np">{t("auth.password")}</Label>
              <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np2">{t("setPass.repeat")}</Label>
              <Input id="np2" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full neon-glow" disabled={busy}>
              {busy ? t("auth.loading") : t("setPass.save")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
