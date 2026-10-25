import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pricingSchema, type Pricing } from "./pricing";

export const listPricing = createServerFn({ method: "GET" }).handler(async (): Promise<Pricing[]> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Не удалось загрузить цены");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("subscription_pricing").select("plan_id,base_price_kzt,discount_percent,promotion_enabled,promotion_start,promotion_end");
  if (error) throw new Error("Не удалось загрузить цены");
  return (data ?? []).map((row) => pricingSchema.parse(row));
});

export const savePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Pricing) => pricingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Только суперадмин может менять цены");
    const { error } = await context.supabase.from("subscription_pricing").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error("Не удалось сохранить цену");
    return { ok: true };
  });