import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ClubLead {
  id: string;
  clubName: string;
  email: string;
  phone: string;
  city: string;
  note: string;
  status: string;
  rejectionReason: string | null;
  clubId: string | null;
  createdAt: string;
}

async function assertAdmin(
  supabase: { rpc: (n: string, a: Record<string, unknown>) => any },
  userId: string,
) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

/** SuperAdmin: every club application, newest first. */
export const listClubLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClubLead[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("club_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    return (data ?? []).map((r) => ({
      id: r.id,
      clubName: r.club_name,
      email: r.email,
      phone: r.phone,
      city: r.city,
      note: r.note,
      status: r.status,
      rejectionReason: r.rejection_reason,
      clubId: r.club_id,
      createdAt: r.created_at,
    }));
  });

/**
 * SuperAdmin approves an application: an owner account is invited by email,
 * and an empty club card is created for them to complete after signing in.
 */
export const approveClubLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { leadId: string; origin: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lead } = await supabaseAdmin
      .from("club_leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();
    if (!lead) return { ok: false, error: "notFound" };
    if (lead.status === "approved") return { ok: false, error: "alreadyApproved" };

    const email = lead.email.trim().toLowerCase();
    const meta = { name: lead.club_name, phone: lead.phone, city: lead.city, role: "owner" };
    const redirectTo = `${data.origin.replace(/\/$/, "")}/set-password`;

    let ownerId: string | null = null;
    const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: meta,
      redirectTo,
    });
    if (invited.data?.user) {
      ownerId = invited.data.user.id;
    } else {
      // Account already exists (e.g. registered as a player) — reuse it and
      // send a password-setup link instead of a fresh invite.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!existing) return { ok: false, error: invited.error?.message ?? "inviteFailed" };
      ownerId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(ownerId, { user_metadata: meta });
      await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
    }

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: ownerId, name: lead.club_name, email, phone: lead.phone, city: lead.city },
        { onConflict: "id" },
      );
    await supabaseAdmin.from("user_roles").insert({ user_id: ownerId, role: "owner" }).select();

    let clubId = lead.club_id;
    if (!clubId) {
      const { data: ownClub } = await supabaseAdmin
        .from("clubs")
        .select("id")
        .eq("owner_id", ownerId)
        .limit(1);
      clubId = ownClub?.[0]?.id ?? null;
    }
    if (!clubId) {
      const { data: created, error } = await supabaseAdmin
        .from("clubs")
        .insert({
          name: lead.club_name,
          city: lead.city,
          phone: lead.phone,
          owner_id: ownerId,
          status: "active",
        })
        .select("id")
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      clubId = created?.id ?? null;
    } else {
      await supabaseAdmin.from("clubs").update({ status: "active" }).eq("id", clubId);
    }

    await supabaseAdmin
      .from("club_leads")
      .update({
        status: "approved",
        owner_id: ownerId,
        club_id: clubId,
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    return { ok: true };
  });

/** SuperAdmin rejects an application with a reason. */
export const rejectClubLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { leadId: string; reason: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("club_leads")
      .update({
        status: "rejected",
        rejection_reason: data.reason.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
