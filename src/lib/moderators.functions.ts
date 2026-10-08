import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Moderator {
  userId: string;
  name: string;
  email: string;
  since: string;
}

async function assertSuperAdmin(
  supabase: { rpc: (n: string, a: Record<string, unknown>) => any },
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** SuperAdmin: list platform moderators. */
export const listModerators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Moderator[]> => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "moderator");
    const ids = (rows ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name, email").in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({
      userId: r.user_id,
      name: byId.get(r.user_id)?.name || byId.get(r.user_id)?.email || "—",
      email: byId.get(r.user_id)?.email || "",
      since: r.created_at.slice(0, 10),
    }));
  });

/** SuperAdmin: grant moderator role to a registered user by email. */
export const addModerator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const email = data.email.trim().toLowerCase();
    if (!email) return { ok: false, error: "missing" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (!profile) return { ok: false, error: "notFound" };
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", profile.id);
    const list = (roles ?? []).map((r) => r.role as string);
    if (list.includes("admin")) return { ok: false, error: "isAdmin" };
    if (list.includes("moderator")) return { ok: false, error: "already" };
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: profile.id, role: "moderator" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** SuperAdmin: revoke moderator role. */
export const removeModerator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "moderator");
    return { ok: true };
  });
