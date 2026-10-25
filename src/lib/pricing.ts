import { z } from "zod";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "./mock-db";

export const pricingSchema = z.object({
  plan_id: z.enum(["sub3", "sub5", "sub30", "subInf"]),
  base_price_kzt: z.number().int().positive().max(10000000),
  discount_percent: z.number().int().min(0).max(99),
  promotion_enabled: z.boolean(),
  promotion_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  promotion_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).refine((p) => !p.promotion_start || !p.promotion_end || p.promotion_start <= p.promotion_end, {
  message: "Дата окончания должна быть не раньше даты начала",
});
export type Pricing = z.infer<typeof pricingSchema>;
export type PricedPlan = SubscriptionPlan & { basePriceKzt: number; discountPercent: number };
export const pricingDefaults = (): Pricing[] => SUBSCRIPTION_PLANS.map((p) => ({
  plan_id: p.id as Pricing["plan_id"], base_price_kzt: p.priceKzt,
  discount_percent: 0, promotion_enabled: false, promotion_start: null, promotion_end: null,
}));
export const pricingDay = (now = new Date()) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit",
}).format(now);
export function pricePlan(plan: SubscriptionPlan, pricing?: Pricing, day = pricingDay()): PricedPlan {
  const basePriceKzt = pricing?.base_price_kzt ?? plan.priceKzt;
  const active = pricing?.promotion_enabled && (!pricing.promotion_start || day >= pricing.promotion_start)
    && (!pricing.promotion_end || day <= pricing.promotion_end);
  const discountPercent = active ? pricing.discount_percent : 0;
  return { ...plan, basePriceKzt, discountPercent, priceKzt: Math.max(1, Math.round(basePriceKzt * (100 - discountPercent) / 100)) };
}