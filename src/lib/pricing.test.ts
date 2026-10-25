import { describe, expect, it } from "bun:test";
import { SUBSCRIPTION_PLANS } from "./mock-db";
import { pricePlan, pricingDefaults, pricingSchema, pricingDay } from "./pricing";

const plan = SUBSCRIPTION_PLANS[0];
if (!plan) throw new Error("Missing plan");
const initial = pricingDefaults()[0];
if (!initial) throw new Error("Missing pricing");
describe("Subscription prices and promotions", () => {
  it("uses stored base price", () => expect(pricePlan(plan, { ...initial, base_price_kzt: 10000 }).priceKzt).toBe(10000));
  it("applies an enabled percentage discount", () => expect(pricePlan(plan, { ...initial, promotion_enabled: true, discount_percent: 20 }).priceKzt).toBe(6392));
  it("does not apply disabled discounts", () => expect(pricePlan(plan, { ...initial, discount_percent: 20 }).priceKzt).toBe(7990));
  it("does not apply future promotions", () => expect(pricePlan(plan, { ...initial, promotion_enabled: true, discount_percent: 20, promotion_start: "2026-11-01" }, "2026-10-25").priceKzt).toBe(7990));
  it("does not apply expired promotions", () => expect(pricePlan(plan, { ...initial, promotion_enabled: true, discount_percent: 20, promotion_end: "2026-10-24" }, "2026-10-25").priceKzt).toBe(7990));
  it("includes both start and end dates", () => {
    const pricing = { ...initial, promotion_enabled: true, discount_percent: 20, promotion_start: "2026-10-25", promotion_end: "2026-10-26" };
    expect(pricePlan(plan, pricing, "2026-10-25").priceKzt).toBe(6392);
    expect(pricePlan(plan, pricing, "2026-10-26").priceKzt).toBe(6392);
  });
  it("rounds discounts to whole tenge", () => expect(pricePlan(plan, { ...initial, promotion_enabled: true, discount_percent: 15 }).priceKzt).toBe(6792));
  it("rejects discounts outside 0–99 percent", () => {
    expect(pricingSchema.safeParse({ ...initial, discount_percent: 100 }).success).toBe(false);
    expect(pricingSchema.safeParse({ ...initial, discount_percent: -1 }).success).toBe(false);
  });
  it("rejects nonpositive prices", () => expect(pricingSchema.safeParse({ ...initial, base_price_kzt: 0 }).success).toBe(false));
  it("rejects reversed promotion dates", () => expect(pricingSchema.safeParse({ ...initial, promotion_start: "2026-11-01", promotion_end: "2026-10-25" }).success).toBe(false));
  it("uses Kazakhstan local dates", () => expect(pricingDay(new Date("2026-10-25T20:00:00Z"))).toBe("2026-10-26"));
});