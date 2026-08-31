import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SUBSCRIPTION_PLANS } from "./mock-db";

export interface PendingPayment {
  id: string;
  userId: string;
  playerName: string;
  playerPhone: string;
  planId: string;
  label: string;
  amountKzt: number;
  receiptNumber: string;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
}

async function assertAdmin(
  supabase: { rpc: (n: string, a: Record<string, unknown>) => any },
  userId: string,
) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Player submits a Kaspi transfer receipt; the payment waits for moderation. */
export const submitKaspiPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planId: string; receiptNumber: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === data.planId);
    if (!plan) return { ok: false, error: "unknownPlan" };
    const receipt = data.receiptNumber.trim();
    if (receipt.length < 3) return { ok: false, error: "receipt" };

    const { data: existing } = await context.supabase
      .from("payments")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) return { ok: false, error: "alreadyPending" };

    const { error } = await context.supabase.from("payments").insert({
      user_id: context.userId,
      kind: "subscription",
      plan_id: plan.id,
      label: `plan.${plan.id}.name`,
      amount_kzt: plan.priceKzt,
      method: "Kaspi Transfer",
      receipt_number: receipt,
      status: "pending",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** SuperAdmin: all payment requests enriched with player contacts. */
export const listPaymentRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PendingPayment[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, name, email, phone").in("id", ids)
      : { data: [] as { id: string; name: string; email: string; phone: string }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      playerName: byId.get(r.user_id)?.name || byId.get(r.user_id)?.email || "—",
      playerPhone: byId.get(r.user_id)?.phone || "—",
      planId: r.plan_id ?? "",
      label: r.label,
      amountKzt: r.amount_kzt,
      receiptNumber: r.receipt_number ?? "",
      status: r.status,
      createdAt: r.created_at,
      rejectionReason: r.rejection_reason ?? null,
    }));
  });

/** SuperAdmin: approve a payment and grant the purchased hours. */
export const approvePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!payment) return { ok: false, error: "notFound" };
    if (payment.status !== "pending") return { ok: false, error: "notPending" };

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === payment.plan_id);
    if (!plan) return { ok: false, error: "unknownPlan" };

    await supabaseAdmin
      .from("player_subscriptions")
      .update({ status: "expired" })
      .eq("user_id", payment.user_id)
      .eq("status", "active");

    const validUntil = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const { error: subError } = await supabaseAdmin.from("player_subscriptions").insert({
      user_id: payment.user_id,
      plan_id: plan.id,
      hours_total: plan.hours,
      hours_left: plan.hours,
      started_at: todayStr(),
      valid_until: validUntil,
      status: "active",
    });
    if (subError) return { ok: false, error: subError.message };

    await supabaseAdmin
      .from("payments")
      .update({
        status: "approved",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", payment.id);

    return { ok: true };
  });

/** SuperAdmin: reject a payment request. */
export const rejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string; reason: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: data.reason.trim() || null,
      })
      .eq("id", data.paymentId)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
