import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, Tag } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { kzt, SUBSCRIPTION_PLANS } from "@/lib/mock-db";
import { pricingDefaults, pricingSchema, pricePlan, type Pricing } from "@/lib/pricing";
import { pricingQuery } from "@/lib/pricing-query";
import { savePricing } from "@/lib/pricing.functions";
import { useI18n } from "@/lib/i18n";

export function PricingSettings() {
  const query = useQuery(pricingQuery);
  if (query.isPending) return <p className="text-muted-foreground">Загрузка цен…</p>;
  if (query.isError) return <Button variant="secondary" onClick={() => query.refetch()}>Повторить загрузку цен</Button>;
  return <section className="space-y-4">
    <h2 className="font-display flex items-center gap-2 text-xl font-bold"><Tag className="size-5 text-accent" />Цены и акции</h2>
    <div className="grid gap-4 sm:grid-cols-2">{pricingDefaults().map((fallback) => {
      const row = query.data.find((r) => r.plan_id === fallback.plan_id) ?? fallback;
      return <PricingEditor key={`${row.plan_id}-${JSON.stringify(row)}`} initial={row} />;
    })}</div>
  </section>;
}

function PricingEditor({ initial }: { initial: Pricing }) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const save = useServerFn(savePricing);
  const { t } = useI18n();
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === initial.plan_id);
  if (!plan) return null;
  const preview = pricePlan(plan, draft);
  const field = (name: string) => `${initial.plan_id}-${name}`;
  return <form className="neon-panel space-y-4 p-5" onSubmit={async (event) => {
    event.preventDefault();
    const parsed = pricingSchema.safeParse(draft);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Проверьте цену и скидку"); return; }
    setBusy(true);
    try { await save({ data: parsed.data }); await client.invalidateQueries({ queryKey: pricingQuery.queryKey }); toast.success("Цена и акция сохранены"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось сохранить"); }
    finally { setBusy(false); }
  }}>
    <h3 className="font-display text-lg font-bold">{t(`plan.${plan.id}.name`)}</h3>
    <div className="space-y-2"><Label htmlFor={field("price")}>Цена абонемента, ₸</Label>
      <Input id={field("price")} type="number" min="1" max="10000000" step="1" required value={draft.base_price_kzt} onChange={(e) => setDraft({ ...draft, base_price_kzt: Number(e.target.value) })} /></div>
    <div className="flex items-center justify-between gap-3"><Label htmlFor={field("enabled")}>Акционная скидка</Label>
      <Switch id={field("enabled")} checked={draft.promotion_enabled} onCheckedChange={(enabled) => setDraft({ ...draft, promotion_enabled: enabled })} /></div>
    <div className="space-y-2"><Label htmlFor={field("discount")}>Скидка, %</Label>
      <Input id={field("discount")} type="number" min="0" max="99" step="1" required disabled={!draft.promotion_enabled} value={draft.discount_percent} onChange={(e) => setDraft({ ...draft, discount_percent: Number(e.target.value) })} /></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor={field("start")}>Начало акции</Label><Input id={field("start")} type="date" disabled={!draft.promotion_enabled} value={draft.promotion_start ?? ""} onChange={(e) => setDraft({ ...draft, promotion_start: e.target.value || null })} /></div>
      <div className="space-y-2"><Label htmlFor={field("end")}>Окончание акции</Label><Input id={field("end")} type="date" min={draft.promotion_start ?? undefined} disabled={!draft.promotion_enabled} value={draft.promotion_end ?? ""} onChange={(e) => setDraft({ ...draft, promotion_end: e.target.value || null })} /></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-sm">Цена сейчас: <strong className="text-accent">{kzt(preview.priceKzt)}</strong></p>
      <Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Сохранение…" : "Сохранить"}</Button></div>
  </form>;
}