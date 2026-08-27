import { createFileRoute } from "@tanstack/react-router";

/**
 * Idempotently creates the four demo accounts used by the one-click role
 * buttons on /auth. Demo credentials are intentionally public for this MVP
 * showcase; production data should not live on these accounts.
 */
const DEMO = [
  { email: "dastan@hotshot.kz", password: "player123", name: "Dastan Y.", phone: "+7 701 555 12 12", role: "player" },
  { email: "staff@cyberdome.kz", password: "staff123", name: "Erlan S.", phone: "+7 701 900 80 70", role: "club_admin", clubId: "c1" },
  { email: "owner@cyberdome.kz", password: "owner123", name: "Aigerim K.", phone: "+7 702 118 44 90", role: "owner" },
  { email: "admin@hotshot.play", password: "admin123", name: "Platform Admin", phone: "+7 700 000 00 01", role: "admin" },
] as const;

export const Route = createFileRoute("/api/public/seed-demo")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const byEmail = new Map((list?.users ?? []).map((u) => [u.email?.toLowerCase() ?? "", u.id]));

        let ownerId: string | null = null;

        for (const demo of DEMO) {
          let userId = byEmail.get(demo.email) ?? null;
          if (!userId) {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
              email: demo.email,
              password: demo.password,
              email_confirm: true,
              user_metadata: { name: demo.name, phone: demo.phone, city: "Astana" },
            });
            if (error) {
              console.error("seed-demo createUser", demo.email, error.message);
              continue;
            }
            userId = data.user?.id ?? null;
          }
          if (!userId) continue;
          if (demo.role === "owner") ownerId = userId;

          await supabaseAdmin.from("profiles").upsert({
            id: userId,
            name: demo.name,
            email: demo.email,
            phone: demo.phone,
            city: "Astana",
            club_id: "clubId" in demo ? demo.clubId : null,
          });
          await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: demo.role });
        }

        if (ownerId) {
          await supabaseAdmin.from("clubs").update({ owner_id: ownerId }).is("owner_id", null);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
