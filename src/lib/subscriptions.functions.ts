import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminSubscription {
  id: string;
  userId: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  planId: string;
  hoursTotal: number | null;
  hoursLeft: number | null;
  startedAt: string;
  validUntil: string;
  status: string;
}

async function assertAdmin(
  supabase: { rpc: (n: string, a: Record<string, unknown>) => any },
  userId: string,
) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

/** SuperAdmin: every player subscription with contact details. */
export const listSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSubscription[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("player_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, name, email, phone").in("id", ids)
      : { data: [] as { id: string; name: string; email: string; phone: string }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      playerName: byId.get(r.user_id)?.name || byId.get(r.user_id)?.email || "—",
      playerEmail: byId.get(r.user_id)?.email || "—",
      playerPhone: byId.get(r.user_id)?.phone || "—",
      planId: r.plan_id,
      hoursTotal: r.hours_total,
      hoursLeft: r.hours_left,
      startedAt: r.started_at,
      validUntil: r.valid_until,
      status: r.status,
    }));
  });

/** SuperAdmin: set the remaining hours of a subscription (fraud correction). */
export const setSubscriptionHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscriptionId: string; hoursLeft: number }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("player_subscriptions")
      .select("id, hours_total, hours_left")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub) return { ok: false, error: "notFound" };
    if (sub.hours_left === null) return { ok: false, error: "unlimited" };
    const max = sub.hours_total ?? sub.hours_left;
    const next = Math.max(0, Math.min(Math.floor(data.hoursLeft), max));
    const { error } = await supabaseAdmin
      .from("player_subscriptions")
      .update({ hours_left: next })
      .eq("id", data.subscriptionId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** SuperAdmin: cancel a subscription and zero out its remaining hours. */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("player_subscriptions")
      .update({ status: "cancelled", hours_left: 0 })
      .eq("id", data.subscriptionId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
