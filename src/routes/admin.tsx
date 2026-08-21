import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, Wallet, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kzt, users } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const gmv = payments.reduce((s, p) => s + p.amountKzt, 0);
  const saas = payments.filter((p) => p.kind === "saas").reduce((s, p) => s + p.amountKzt, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label={t("admin.kpi.clubs")} value={String(clubs.length)} sub={`${clubs.filter((c) => c.plan === "Trial").length} ${t("admin.kpi.onTrial")}`} />
        <Kpi icon={Users} label={t("admin.kpi.users")} value="1 375" sub={t("admin.kpi.usersSub")} />
        <Kpi icon={Wallet} label={t("admin.kpi.gmv")} value={kzt(gmv)} sub={`${t("admin.kpi.mrr")} ${kzt(saas)}`} />
        <Kpi icon={Percent} label={t("admin.kpi.take")} value="12%" sub={t("admin.kpi.takeSub")} />
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">{t("admin.clubs")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.col.club")}</TableHead>
              <TableHead>{t("admin.col.plan")}</TableHead>
              <TableHead>{t("admin.col.terminals")}</TableHead>
              <TableHead>{t("admin.col.occupancy")}</TableHead>
              <TableHead>{t("admin.col.rating")}</TableHead>
              <TableHead className="text-right">{t("admin.col.fee")}</TableHead>
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
          <h2 className="mb-4 font-bold">{t("admin.tx")}</h2>
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
          <h2 className="mb-4 font-bold">{t("admin.accounts")}</h2>
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
                  <p className="text-xs text-muted-foreground capitalize">{s.scope} · {s.hoursLeft}{t("admin.hoursLeft")} {s.validUntil}</p>
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
