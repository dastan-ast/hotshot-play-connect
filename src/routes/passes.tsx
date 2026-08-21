import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/components/PaymentDialog";
import { passPlans, kzt, type PaymentMethod } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { RequireRole } from "@/components/RequireRole";

export const Route = createFileRoute("/passes")({
  head: () => ({
    meta: [
      { title: "HotShot Play Passes — Gaming Hours for Every Club" },
      { name: "description", content: "Buy universal gaming passes valid across all HotShot Play partner computer clubs in Astana, or club-specific packages." },
      { property: "og:title", content: "HotShot Play Passes — Gaming Hours for Every Club" },
      { property: "og:description", content: "Universal gaming hours across partner clubs in Kazakhstan. Pay with Kaspi, Apple Pay, Google Pay or card." },
    ],
  }),
  component: () => (
    <RequireRole roles={["player"]}>
      <PassesPage />
    </RequireRole>
  ),
});

function PassesPage() {
  const { buyPass, topUp, balance, subscriptions } = useStore();
  const { t } = useI18n();
  const [pending, setPending] = useState<(typeof passPlans)[number] | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState(5000);

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <Badge className="mb-3 bg-primary/15 text-primary">{t("passes.badge")}</Badge>
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          {t("passes.title1")} <span className="neon-text">{t("passes.title2")}</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("passes.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {passPlans.map((p) => (
          <div
            key={p.id}
            className={`neon-panel flex flex-col p-5 ${p.highlight ? "neon-glow" : ""}`}
          >
            <div className="flex items-center justify-between">
              <Badge variant={p.scope === "universal" ? "default" : "secondary"} className="capitalize">
                {p.scope}
              </Badge>
              {p.highlight && <Sparkles className="size-4 text-accent" />}
            </div>
            <h3 className="mt-4 text-lg font-bold">{p.name}</h3>
            <p className="mt-1 text-3xl font-extrabold neon-text">{kzt(p.priceKzt)}</p>
            <p className="text-xs text-muted-foreground">{p.hours} {t("passes.hours")} · {Math.round(p.priceKzt / p.hours)} ₸/h</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {perk}
                </li>
              ))}
            </ul>
            <Button className="mt-5" onClick={() => setPending(p)}>
              {t("passes.buy")}
            </Button>
          </div>
        ))}
      </div>

      <div className="neon-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-accent/15 cyan-glow">
            <Wallet className="size-5 text-accent" />
          </span>
          <div>
            <p className="font-semibold">{t("passes.wallet")}</p>
            <p className="text-sm text-muted-foreground">{t("passes.balance")} {kzt(balance)} · {t("passes.walletHint")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-32"
          />
          <Button variant="secondary" onClick={() => setTopUpOpen(true)}>
            {t("passes.topup")}
          </Button>
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold">{t("passes.yourSubs")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((s) => (
              <div key={s.id} className="neon-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.hoursLeft}h {t("passes.left")} {s.hours}h · {t("passes.validUntil")} {s.validUntil}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(s.hoursLeft / s.hours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PaymentDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.name ?? ""}
        amount={pending?.priceKzt ?? 0}
        onConfirm={(method: PaymentMethod) => {
          if (!pending) return;
          buyPass({
            name: pending.name,
            scope: pending.scope,
            hours: pending.hours,
            priceKzt: pending.priceKzt,
            method,
          });
          toast.success(`${pending.name} — ${t("passes.activated")} (+${pending.hours}h)`);
          setPending(null);
        }}
      />

      <PaymentDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        title={t("passes.topupTitle")}
        amount={amount}
        onConfirm={(method) => {
          topUp(amount, method);
          toast.success(`${t("passes.toppedUp")} ${kzt(amount)}`);
          setTopUpOpen(false);
        }}
      />
    </div>
  );
}
