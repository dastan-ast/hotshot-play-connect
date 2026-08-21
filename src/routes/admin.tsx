import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, Wallet, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kzt, users } from "@/lib/mock-db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — HotShot Play Platform" },
      { name: "description", content: "Platform-wide control: partner clubs, SaaS plans and trials, gamer accounts and all transactions across HotShot Play." },
      { property: "og:title", content: "Super Admin — HotShot Play Platform" },
      { property: "og:description", content: "Network overview of clubs, subscriptions and payments." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { clubs, payments, subscriptions } = useStore();
  const gmv = payments.reduce((s, p) => s + p.amountKzt, 0);
  const saas = payments.filter((p) => p.kind === "saas").reduce((s, p) => s + p.amountKzt, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Super admin</h1>
        <p className="text-sm text-muted-foreground">Platform overview · Kazakhstan · Astana region</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Partner clubs" value={String(clubs.length)} sub={`${clubs.filter((c) => c.plan === "Trial").length} on trial`} />
        <Kpi icon={Users} label="Registered users" value="1 375" sub="+82 this week" />
        <Kpi icon={Wallet} label="Platform GMV" value={kzt(gmv)} sub={`SaaS MRR ${kzt(saas)}`} />
        <Kpi icon={Percent} label="Take rate" value="12%" sub="on pass redemptions" />
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">Partner clubs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Club</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Terminals</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">SaaS fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clubs.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.address}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={c.plan === "Trial" ? "default" : "secondary"}>{c.plan}</Badge>
                </TableCell>
                <TableCell>{c.terminals}</TableCell>
                <TableCell>{c.occupancy}%</TableCell>
                <TableCell>{c.rating}</TableCell>
                <TableCell className="text-right">{kzt(c.saasFeeKzt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="neon-panel p-5">
          <h2 className="mb-4 font-bold">All transactions</h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.createdAt} · {p.method} · {p.kind}</p>
                </div>
                <span className="font-bold text-accent">{kzt(p.amountKzt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neon-panel p-5">
          <h2 className="mb-4 font-bold">Accounts & passes</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{u.role}</Badge>
              </div>
            ))}
            {subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.scope} · {s.hoursLeft}h left · until {s.validUntil}</p>
                </div>
                <span className="font-bold text-accent">{kzt(s.priceKzt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) {
  return (
    <div className="neon-panel p-5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4 text-primary" />{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-accent">{sub}</p>
    </div>
  );
}
