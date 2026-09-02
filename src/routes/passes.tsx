import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Flame, Infinity as InfinityIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { SUBSCRIPTION_PLANS, kzt, type SubscriptionPlan } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KaspiPaymentDialog } from "@/components/KaspiPaymentDialog";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/passes")({
  head: () => ({
    meta: [
      { title: "Абонементы — HotShot Play" },
      {
        name: "description",
        content: "Игровые абонементы HotShot Play: 3 часа, 5 часов, 30 часов и Безлимит во всех клубах Астаны.",
      },
      { property: "og:title", content: "HotShot Play — абонементы для игроков" },
      { property: "og:description", content: "Один абонемент — все клубы-партнёры." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PassesPage,
});

function PassesPage() {
  const { user, role } = useAuth();
  const { activeSubFor, latestPaymentFor, submitKaspiReceipt } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [payPlan, setPayPlan] = useState<SubscriptionPlan | null>(null);

  const sub = user && role === "player" ? activeSubFor(user.id) : undefined;
  const lastPayment = user ? latestPaymentFor(user.id) : undefined;

  const startBuy = (plan: SubscriptionPlan) => {
    if (!user || role !== "player") {
      toast.error(t("passes.signin"));
      navigate({ to: "/auth" });
      return;
    }
    setPayPlan(plan);
  };

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Zap className="size-3.5" /> {t("passes.badge")}
        </span>
        <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-5xl">
          {t("passes.title1")} <span className="neon-text">{t("passes.title2")}</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("passes.subtitle")}</p>
      </section>

      {/* Current subscription */}
      {role === "player" && (
        <section className="neon-panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("passes.current")}
          </p>
          {sub ? (
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div>
                <p className="font-display text-2xl font-bold text-primary">{t(`plan.${sub.planId}.name`)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("passes.validUntil")} {sub.validUntil}
                </p>
              </div>
              {sub.hoursLeft !== null && sub.hoursTotal !== null ? (
                <div className="min-w-52 flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {sub.hoursLeft} {t("passes.left")} {sub.hoursTotal} {t("passes.hours")}
                    </span>
                  </div>
                  <Progress value={(sub.hoursLeft / sub.hoursTotal) * 100} className="mt-1.5" />
                </div>
              ) : (
                <span className="flex items-center gap-1.5 text-accent">
                  <InfinityIcon className="size-5" /> {t("passes.unlimited")}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("passes.none")}</p>
          )}
        </section>
      )}

      {role === "player" && lastPayment?.status === "pending" && (
        <section className="neon-panel border-accent/50 p-5 text-sm">
          <p className="font-semibold text-accent">{t("kaspi.pendingTitle")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("kaspi.pendingText")} · {t("kaspi.receipt")}: <b className="text-foreground">{lastPayment.receiptNumber}</b>
          </p>
        </section>
      )}

      {role === "player" && lastPayment?.status === "rejected" && (
        <section className="neon-panel border-destructive/50 p-5 text-sm">
          <p className="font-semibold text-destructive">{t("kaspi.rejectedTitle")}</p>
          <p className="mt-1 text-muted-foreground">{lastPayment.rejectionReason || t("kaspi.rejectedText")}</p>
        </section>
      )}

      {/* Plans */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "neon-panel flex flex-col p-5 transition-transform hover:-translate-y-1",
              plan.highlight && "neon-glow border-primary/60",
            )}
          >
            {plan.highlight && (
              <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary">
                <Flame className="size-3" /> HOT
              </span>
            )}
            <h2 className="font-display text-xl font-bold">{t(`plan.${plan.id}.name`)}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t(`plan.${plan.id}.tag`)}</p>
            <p className="font-display mt-4 text-3xl font-extrabold text-accent">
              {kzt(plan.priceKzt)}
              <span className="text-xs font-medium text-muted-foreground"> {t("passes.month")}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" />
                {plan.hours === null ? t("passes.unlimited") : `${plan.hours} ${t("passes.hours")}`}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" /> {t("passes.perk.clubs")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" /> {t("passes.perk.valid")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" /> {t("passes.perk.cap", { cap: plan.dailyCap })}
              </li>
            </ul>
            <Button
              className={cn("mt-5 w-full", plan.highlight && "neon-glow")}
              variant={plan.highlight ? "default" : "secondary"}
              disabled={lastPayment?.status === "pending"}
              onClick={() => startBuy(plan)}
            >
              {lastPayment?.status === "pending" ? t("kaspi.pendingTitle") : t("passes.buy")}
            </Button>

          </div>
        ))}
      </section>

      {payPlan && (
        <KaspiPaymentDialog
          open={!!payPlan}
          onOpenChange={(open) => !open && setPayPlan(null)}
          title={t(`plan.${payPlan.id}.name`)}
          amount={payPlan.priceKzt}
          onSubmit={async (receiptNumber) => {
            const res = await submitKaspiReceipt(payPlan.id, receiptNumber);
            if (res.ok) {
              setPayPlan(null);
              toast.success(t("kaspi.submitted"));
            } else {
              toast.error(res.error === "alreadyPending" ? t("kaspi.alreadyPending") : t("kaspi.failed"));
            }
          }}
        />
      )}

    </div>
  );
}
