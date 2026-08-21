import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, Wallet, Percent, Check, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kzt, revenueSeries, users, type ClubStatus } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { RequireRole } from "@/components/RequireRole";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — HotShot Play Platform" },
      { name: "description", content: "Platform-wide control: partner clubs, club applications, SaaS plans and trials, gamer accounts and all transactions across HotShot Play." },
      { property: "og:title", content: "Super Admin — HotShot Play Platform" },
      { property: "og:description", content: "Network overview of clubs, applications, subscriptions and payments." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <AdminPage />
    </RequireRole>
  ),
});

const STATUS_VARIANT: Record<ClubStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  active: "secondary",
  trial: "default",
  suspended: "destructive",
};

function AdminPage() {
  const { clubs, payments, subscriptions, setClubStatus } = useStore();
  const { t } = useI18n();
  const gmv = payments.reduce((s, p) => s + p.amountKzt, 0);
  const saas = payments.filter((p) => p.kind === "saas").reduce((s, p) => s + p.amountKzt, 0);
  const pending = clubs.filter((c) => c.status === "pending");
  const live = clubs.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label={t("admin.kpi.clubs")} value={String(live.length)} sub={`${clubs.filter((c) => c.status === "trial").length} ${t("admin.kpi.onTrial")}`} />
        <Kpi icon={Users} label={t("admin.kpi.users")} value="1 375" sub={t("admin.kpi.usersSub")} />
        <Kpi icon={Wallet} label={t("admin.kpi.gmv")} value={kzt(gmv)} sub={`${t("admin.kpi.mrr")} ${kzt(saas)}`} />
        <Kpi icon={Percent} label={t("admin.kpi.take")} value="12%" sub={t("admin.kpi.takeSub")} />
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">{t("admin.revenue")}</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="gmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} width={70} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => kzt(v)}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" fill="url(#gmv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">{t("admin.applications")} · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noApps")}</p>
        ) : (
          <div className="space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                <div className="min-w-52">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.address} · {c.terminals} {t("partner.terminalsWord")}</p>
                </div>
                <Badge variant="outline">{t("status.pending")}</Badge>
                <span className="text-xs text-muted-foreground">{t("admin.appliedAt")} {c.appliedAt}</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setClubStatus(c.id, "trial");
                      toast.success(`${c.name} — ${t("admin.approved")}`);
                    }}
                  >
                    <Check className="size-4" /> {t("admin.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setClubStatus(c.id, "suspended");
                      toast(`${c.name} — ${t("admin.rejected")}`);
                    }}
                  >
                    <X className="size-4" /> {t("admin.reject")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">{t("admin.clubs")}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.col.club")}</TableHead>
              <TableHead>{t("admin.col.status")}</TableHead>
              <TableHead>{t("admin.col.plan")}</TableHead>
              <TableHead>{t("admin.col.terminals")}</TableHead>
              <TableHead>{t("admin.col.occupancy")}</TableHead>
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
                  <Badge variant={STATUS_VARIANT[c.status]}>{t(`status.${c.status}`)}</Badge>
                </TableCell>
                <TableCell>{c.plan}</TableCell>
                <TableCell>{c.terminals}</TableCell>
                <TableCell>{c.occupancy}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{kzt(c.saasFeeKzt)}</span>
                    {c.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next: ClubStatus = c.status === "suspended" ? "active" : "suspended";
                          setClubStatus(c.id, next);
                          toast(`${c.name} — ${t(`status.${next}`)}`);
                        }}
                      >
                        {c.status === "suspended" ? t("admin.restore") : t("admin.suspend")}
                      </Button>
                    )}
                  </div>
                </TableCell>
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
                <Badge variant="secondary" className="capitalize">{t(`role.${u.role}`)}</Badge>
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
