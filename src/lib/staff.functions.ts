import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
}

/** Caller must own the club (or be a platform admin). */
async function assertClubAccess(
  supabase: { from: (t: string) => any; rpc: (n: string, a: Record<string, unknown>) => any },
  userId: string,
  clubId: string,
) {
  const { data: club } = await supabase.from("clubs").select("id, owner_id").eq("id", clubId).maybeSingle();
  if (club?.owner_id === userId) return;
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listClubStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string }) => input)
  .handler(async ({ data, context }): Promise<StaffMember[]> => {
    await assertClubAccess(context.supabase as never, context.userId, data.clubId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("club_staff")
      .select("id, user_id")
      .eq("club_id", data.clubId);
    const ids = (rows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name, email").in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: byId.get(r.user_id)?.name ?? "—",
      email: byId.get(r.user_id)?.email ?? "—",
    }));
  });

export const addClubStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string; email: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertClubAccess(context.supabase as never, context.userId, data.clubId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (!profile) return { ok: false, error: "notFound" };

    const { error } = await supabaseAdmin
      .from("club_staff")
      .upsert({ club_id: data.clubId, user_id: profile.id }, { onConflict: "club_id,user_id" });
    if (error) return { ok: false, error: error.message };

    await supabaseAdmin.from("profiles").update({ club_id: data.clubId }).eq("id", profile.id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", profile.id).eq("role", "player");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: profile.id, role: "club_admin" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const removeClubStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clubId: string; userId: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await assertClubAccess(context.supabase as never, context.userId, data.clubId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("club_staff").delete().eq("club_id", data.clubId).eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").update({ club_id: null }).eq("id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "club_admin");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: "player" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

/** Staff/owner/admin marks a booking as no-show: deducts 1 hour from the player's pass. */
export const markBookingNoShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookingId: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const { data: booking } = await context.supabase
      .from("bookings")
      .select("id, club_id, user_id, status")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking) return { ok: false, error: "notFound" };
    const { data: member } = await context.supabase.rpc("is_club_member", {
      _user_id: context.userId,
      _club_id: booking.club_id,
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!member && !isAdmin) return { ok: false, error: "forbidden" };
    if (booking.status !== "upcoming") return { ok: false, error: "status" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated } = await supabaseAdmin
      .from("bookings")
      .update({ status: "no_show" })
      .eq("id", booking.id)
      .eq("status", "upcoming")
      .select("id");
    if (!updated?.length) return { ok: false, error: "status" };

    const { data: sub } = await supabaseAdmin
      .from("player_subscriptions")
      .select("id, hours_left")
      .eq("user_id", booking.user_id)
      .eq("status", "active")
      .not("hours_left", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub && sub.hours_left !== null) {
      await supabaseAdmin
        .from("player_subscriptions")
        .update({ hours_left: Math.max(0, sub.hours_left - 1) })
        .eq("id", sub.id);
    }
    return { ok: true };
  });
