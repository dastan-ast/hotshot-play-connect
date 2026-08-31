import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, LogIn, MailCheck, UserPlus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { HOME_BY_ROLE, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — HotShot Play" },
      {
        name: "description",
        content: "Регистрация игроков по почте и подача заявки клуба на подключение к HotShot Play.",
      },
      { property: "og:title", content: "HotShot Play — вход и регистрация" },
      { property: "og:description", content: "Один аккаунт для игроков, клубов и владельцев." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, registerPlayer, registerClub, resendConfirmation, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sentKind, setSentKind] = useState<"player" | "club">("player");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("confirmed") === "1") {
      toast.success(t("auth.confirmed"));
    }
  }, [t]);

  useEffect(() => {
    if (user) navigate({ to: HOME_BY_ROLE[user.role] });
  }, [user, navigate]);

  if (sentTo) {
    return (
      <div className="mx-auto max-w-md">
        <div className="neon-panel p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/20 neon-glow">
            <MailCheck className="size-6 text-primary" />
          </span>
          <h1 className="font-display mt-4 text-xl font-bold">{t("auth.checkEmail")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.checkEmailHint", { email: sentTo })}
          </p>
          {sentKind === "club" && (
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.checkEmailClub")}</p>
          )}
          <div className="mt-6 grid gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await resendConfirmation(sentTo);
                setBusy(false);
                if (res.ok) toast.success(t("auth.resent"));
                else toast.error(res.error ?? t("auth.invalid"));
              }}
            >
              {t("auth.resend")}
            </Button>
            <Button variant="ghost" onClick={() => setSentTo(null)}>
              {t("auth.backToSignin")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="neon-panel p-6 sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/20 neon-glow">
          <Flame className="size-6 text-primary" />
        </span>
        <h1 className="font-display mt-4 text-center text-xl font-bold">{t("auth.title")}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("auth.subtitle")}</p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">{t("auth.tab.signin")}</TabsTrigger>
            <TabsTrigger value="player">{t("auth.tab.player")}</TabsTrigger>
            <TabsTrigger value="club">{t("auth.tab.club")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-5">
            <SignInForm
              busy={busy}
              onSubmit={async (email, password) => {
                setBusy(true);
                const res = await login(email, password);
                setBusy(false);
                if (!res.ok) {
                  toast.error(res.error === "unconfirmed" ? t("auth.unconfirmed") : t("auth.invalid"));
                  if (res.error === "unconfirmed") {
                    setSentKind("player");
                    setSentTo(email);
                  }
                  return;
                }
                toast.success(t("auth.welcome"));
              }}
            />
          </TabsContent>

          <TabsContent value="player" className="mt-5">
            <PlayerForm
              busy={busy}
              onSubmit={async (input) => {
                setBusy(true);
                const res = await registerPlayer(input);
                setBusy(false);
                if (!res.ok) {
                  toast.error(res.error ?? t("auth.invalid"));
                  return;
                }
                if (res.needsConfirmation) {
                  setSentKind("player");
                  setSentTo(input.email);
                } else {
                  toast.success(t("auth.welcome"));
                }
              }}
            />
          </TabsContent>

          <TabsContent value="club" className="mt-5">
            <ClubForm
              busy={busy}
              onSubmit={async (input) => {
                setBusy(true);
                const res = await registerClub(input);
                setBusy(false);
                if (!res.ok) {
                  toast.error(res.error ?? t("auth.invalid"));
                  return;
                }
                setSentKind("club");
                setSentTo(input.email);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

function SignInForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(email, password);
      }}
    >
      <Field id="email" label={t("auth.email")} type="email" value={email} onChange={setEmail} placeholder="you@example.kz" />
      <Field id="password" label={t("auth.password")} type="password" value={password} onChange={setPassword} placeholder="••••••" />
      <Button type="submit" className="w-full neon-glow" disabled={busy}>
        <LogIn className="size-4" /> {busy ? t("auth.loading") : t("auth.signin")}
      </Button>
    </form>
  );
}

function PlayerForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: { name: string; email: string; password: string; phone: string; city: string }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", city: "Astana" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.password.length < 6) {
          toast.error(t("auth.weakPassword"));
          return;
        }
        void onSubmit(form);
      }}
    >
      <p className="text-xs text-muted-foreground">{t("auth.playerHint")}</p>
      <Field id="p-name" label={t("auth.name")} value={form.name} onChange={set("name")} placeholder="Dastan Y." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-phone" label={t("auth.phone")} value={form.phone} onChange={set("phone")} placeholder="+7 701 000 00 00" />
        <Field id="p-city" label={t("auth.city")} value={form.city} onChange={set("city")} placeholder="Astana" />
      </div>
      <Field id="p-email" label={t("auth.email")} type="email" value={form.email} onChange={set("email")} placeholder="you@example.kz" />
      <Field id="p-pass" label={t("auth.password")} type="password" value={form.password} onChange={set("password")} placeholder="••••••" />
      <Button type="submit" className="w-full neon-glow" disabled={busy}>
        <UserPlus className="size-4" /> {busy ? t("auth.loading") : t("auth.register")}
      </Button>
    </form>
  );
}

function ClubForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    club: {
      name: string;
      city: string;
      address: string;
      phone: string;
      openFrom: string;
      openTo: string;
      pricePerHour: number;
      totalSeats: number;
      specs: string;
      description: string;
    };
  }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [owner, setOwner] = useState({ name: "", email: "", password: "", phone: "" });
  const [club, setClub] = useState({
    name: "",
    city: "Astana",
    address: "",
    phone: "",
    openFrom: "10:00",
    openTo: "02:00",
    pricePerHour: 700,
    totalSeats: 30,
    specs: "",
    description: "",
  });
  const setO = (k: keyof typeof owner) => (v: string) => setOwner((f) => ({ ...f, [k]: v }));
  const setC = (k: keyof typeof club) => (v: string) =>
    setClub((f) => ({ ...f, [k]: k === "pricePerHour" || k === "totalSeats" ? Number(v) || 0 : v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (owner.password.length < 6) {
          toast.error(t("auth.weakPassword"));
          return;
        }
        void onSubmit({ ...owner, club });
      }}
    >
      <p className="text-xs text-muted-foreground">{t("auth.clubHint")}</p>
      <Field id="o-name" label={t("auth.name")} value={owner.name} onChange={setO("name")} placeholder="Aigerim K." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="o-email" label={t("auth.email")} type="email" value={owner.email} onChange={setO("email")} placeholder="owner@club.kz" />
        <Field id="o-phone" label={t("auth.phone")} value={owner.phone} onChange={setO("phone")} placeholder="+7 702 000 00 00" />
      </div>
      <Field id="o-pass" label={t("auth.password")} type="password" value={owner.password} onChange={setO("password")} placeholder="••••••" />

      <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.clubSection")}</p>
      <Field id="c-name" label={t("auth.clubName")} value={club.name} onChange={setC("name")} placeholder="CyberDome" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-city" label={t("auth.city")} value={club.city} onChange={setC("city")} placeholder="Astana" />
        <Field id="c-phone" label={t("auth.phone")} value={club.phone} onChange={setC("phone")} placeholder="+7 7172 00 00 00" />
      </div>
      <Field id="c-address" label={t("auth.address")} value={club.address} onChange={setC("address")} placeholder="пр. Мангилик Ел 55" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-from" label={t("auth.openFrom")} value={club.openFrom} onChange={setC("openFrom")} placeholder="10:00" />
        <Field id="c-to" label={t("auth.openTo")} value={club.openTo} onChange={setC("openTo")} placeholder="02:00" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-seats" label={t("auth.seats")} type="number" value={String(club.totalSeats)} onChange={setC("totalSeats")} />
        <Field id="c-price" label={t("auth.price")} type="number" value={String(club.pricePerHour)} onChange={setC("pricePerHour")} />
      </div>
      <Field id="c-specs" label={t("auth.specs")} value={club.specs} onChange={setC("specs")} placeholder="i5-12400F · RTX 4060 · 165Hz" />
      <div className="space-y-1.5">
        <Label htmlFor="c-desc">{t("auth.desc")}</Label>
        <Textarea id="c-desc" value={club.description} onChange={(e) => setC("description")(e.target.value)} rows={3} />
      </div>

      <Button type="submit" className="w-full neon-glow" disabled={busy}>
        <Building2 className="size-4" /> {busy ? t("auth.loading") : t("auth.registerClub")}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
