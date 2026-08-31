import { createFileRoute } from "@tanstack/react-router";

const DEMO_EMAILS = [
  "dastan@hotshot.kz",
  "staff@cyberdome.kz",
  "owner@cyberdome.kz",
  "admin@hotshot.play",
];

export const Route = createFileRoute("/api/public/cleanup-demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOVABLE_CRON_SECRET"];
        if (!secret || request.headers.get("x-cleanup-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const removed: string[] = [];
        for (const u of list?.users ?? []) {
          if (u.email && DEMO_EMAILS.includes(u.email.toLowerCase())) {
            await supabaseAdmin.auth.admin.deleteUser(u.id);
            removed.push(u.email);
          }
        }
        return Response.json({ removed });
      },
    },
  },
});
