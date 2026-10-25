import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ManagedRole = "player" | "club_admin" | "owner" | "moderator" | "admin";
const ASSIGNABLE = ["player", "club_admin", "owner", "moderator"] as const;

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: ManagedRole;
  blocked: boolean;
  createdAt: string;
}

const RANK: ManagedRole[] = ["admin", "moderator", "owner", "club_admin", "player"];

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** SuperAdmin: list every user with role and block status. */
export const listAllUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, name, email, phone, city, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const banned = new Set<string>();
    for (let page = 1; page < 50; page++) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users ?? [];
      for (const u of users) {
        const until = (u as { banned_until?: string | null }).banned_until;
        if (until && new Date(until) > new Date()) banned.add(u.id);
      }
      if (users.length < 1000) break;
    }
    return (profiles ?? []).map((p) => {
      const mine = (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as ManagedRole);
      const role = RANK.find((r) => mine.includes(r)) ?? "player";
      return {
        id: p.id, name: p.name, email: p.email, phone: p.phone, city: p.city,
        role, blocked: banned.has(p.id), createdAt: p.created_at,
      };
    });
  });

/** SuperAdmin: replace a user's role. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: string }) => {
    if (!(ASSIGNABLE as readonly string[]).includes(d.role)) throw new Error("Недопустимая роль");
    return d as { userId: string; role: (typeof ASSIGNABLE)[number] };
  })
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Нельзя менять собственную роль");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    if ((cur ?? []).some((r) => r.role === "admin")) throw new Error("Роль суперадмина менять нельзя");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** SuperAdmin: block or unblock sign-in for a user. */
export const setUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; blocked: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Нельзя заблокировать себя");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    if ((cur ?? []).some((r) => r.role === "admin")) throw new Error("Суперадмина заблокировать нельзя");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.blocked ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
