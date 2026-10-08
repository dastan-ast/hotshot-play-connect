import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Email failures must never block the application workflow. */
async function trySendEmail(
  name: string,
  to: string,
  templateData: Record<string, unknown>,
  idempotencyKey: string,
) {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail(name, to, { templateData, idempotencyKey });
  } catch (e) {
    console.error(`[club-leads] email '${name}' failed:`, e);
  }
}

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
  // Admins and platform moderators may review leads and payments.
  const { data: isStaff } = await supabase.rpc("is_platform_staff", { _user_id: userId });
  if (!isStaff) throw new Error("Forbidden");
}

/** Public: a club owner submits an application and gets a confirmation email. */
export const submitClubLead = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { clubName: string; email: string; phone: string; city: string; note: string }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const clubName = data.clubName.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const city = data.city.trim() || "Astana";
    if (!clubName || !email || !phone) return { ok: false, error: "missingFields" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("club_leads")
      .insert({ club_name: clubName, email, phone, city, note: data.note.trim() })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };

    await trySendEmail(
      "lead-received",
      email,
      { clubName, city, phone },
      `lead-received-${row?.id ?? email}`,
    );
    return { ok: true };
  });

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

    // Generate the action link ourselves and deliver it through a branded
    // email, so the owner always gets a working link — new account or not.
    let ownerId: string | null = null;
    let actionUrl: string | null = null;

    const invite = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: meta, redirectTo },
    });
    if (invite.data?.user && !invite.error) {
      ownerId = invite.data.user.id;
      actionUrl = invite.data.properties?.action_link ?? null;
    } else {
      // Account already exists (e.g. registered as a player) — reuse it and
      // send a password-setup link instead of a fresh invite.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!existing) return { ok: false, error: invite.error?.message ?? "inviteFailed" };
      ownerId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(ownerId, { user_metadata: meta });
      const recovery = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      actionUrl = recovery.data?.properties?.action_link ?? null;
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

    await trySendEmail(
      "lead-approved",
      email,
      { clubName: lead.club_name, actionUrl },
      `lead-approved-${lead.id}`,
    );

    return { ok: true };
  });

/** SuperAdmin rejects an application with a reason. */
export const rejectClubLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { leadId: string; reason: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reason = data.reason.trim();
    const { data: updated, error } = await supabaseAdmin
      .from("club_leads")
      .update({
        status: "rejected",
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.leadId)
      .select("email, club_name")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };

    if (updated?.email) {
      await trySendEmail(
        "lead-rejected",
        updated.email,
        { clubName: updated.club_name, reason },
        `lead-rejected-${data.leadId}`,
      );
    }
    return { ok: true };
  });
