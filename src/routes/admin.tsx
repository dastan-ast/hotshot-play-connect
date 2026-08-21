import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Users, Wallet, Percent, Check, X, Plus, UserPlus, Search } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kzt, revenueSeries, saasPlans, type Club, type ClubStatus } from "@/lib/mock-db";
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

const STATUSES: ClubStatus[] = ["pending", "trial", "active", "suspended"];

function AdminPage() {
  const { clubs, payments, subscriptions, allUsers, setClubStatus, addClub, addOwner, assignOwner, setClubPlan, updateClub } = useStore();
  const { t } = useI18n();
  const gmv = payments.reduce((s, p) => s + p.amountKzt, 0);
  const saas = payments.filter((p) => p.kind === "saas").reduce((s, p) => s + p.amountKzt, 0);
  const pending = clubs.filter((c) => c.status === "pending");
  const live = clubs.filter((c) => c.status !== "pending");
  const owners = allUsers.filter((u) => u.role === "owner");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClubStatus | "all">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [clubDraft, setClubDraft] = useState({ name: "", city: "Астана", address: "", ownerId: owners[0]?.id ?? "", fromPrice: 800 });
  const [ownerDraft, setOwnerDraft] = useState({ name: "", email: "", phone: "+7 ", city: "Астана" });

  const filteredClubs = useMemo(
    () =>
      clubs.filter(
        (c) =>
          (statusFilter === "all" || c.status === statusFilter) &&
          (c.name + c.address).toLowerCase().includes(q.toLowerCase()),
      ),
    [clubs, q, statusFilter],
  );

  const ownerName = (id: string) => allUsers.find((u) => u.id === id)?.name ?? "—";

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

      <Tabs defaultValue="overview" className="neon-panel p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t("admin.tab.overview")}</TabsTrigger>
          <TabsTrigger value="clubs">{t("admin.tab.clubs")}</TabsTrigger>
          <TabsTrigger value="owners">{t("admin.tab.owners")}</TabsTrigger>
          <TabsTrigger value="tx">{t("admin.tab.tx")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
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
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} width={70} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                    formatter={(v: number) => kzt(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" fill="url(#gmv)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
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
                      <Button size="sm" onClick={() => { setClubStatus(c.id, "trial"); toast.success(`${c.name} — ${t("admin.approved")}`); }}>
                        <Check className="size-4" /> {t("admin.approve")}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { setClubStatus(c.id, "suspended"); toast(`${c.name} — ${t("admin.rejected")}`); }}>
                        <X className="size-4" /> {t("admin.reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold"><Plus className="size-4 text-primary" />{t("admin.newClub")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label={t("admin.name")} value={clubDraft.name} onChange={(v) => setClubDraft({ ...clubDraft, name: v })} />
              <Field label={t("admin.city")} value={clubDraft.city} onChange={(v) => setClubDraft({ ...clubDraft, city: v })} />
              <Field label={t("admin.address")} value={clubDraft.address} onChange={(v) => setClubDraft({ ...clubDraft, address: v })} />
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("admin.fromPrice")}</Label>
                <Input type="number" value={clubDraft.fromPrice} onChange={(e) => setClubDraft({ ...clubDraft, fromPrice: Number(e.target.value) })} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("admin.owner")}</Label>
                <div className="flex flex-wrap gap-1">
                  {owners.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setClubDraft({ ...clubDraft, ownerId: o.id })}
                      className={`rounded-lg border border-border px-2 py-1.5 text-xs ${clubDraft.ownerId === o.id ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              className="mt-3"
              disabled={!clubDraft.name.trim() || !clubDraft.ownerId}
              onClick={() => {
                const c = addClub({ ...clubDraft, name: clubDraft.name.trim() });
                toast.success(`${c.name} ${t("admin.created")}`);
                setClubDraft({ ...clubDraft, name: "", address: "" });
              }}
            >
              <Plus className="size-4" /> {t("admin.create") === "admin.create" ? t("owner.create") : t("admin.create")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="w-64 pl-9" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg border border-border px-3 py-1.5 text-xs ${statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}
              >
                {s === "all" ? t("admin.filter.all") : t(`status.${s}`)}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.col.club")}</TableHead>
                <TableHead>{t("admin.owner")}</TableHead>
                <TableHead>{t("admin.col.status")}</TableHead>
                <TableHead>{t("admin.col.plan")}</TableHead>
                <TableHead>{t("admin.col.terminals")}</TableHead>
                <TableHead className="text-right">{t("admin.col.fee")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClubs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <button className="text-left" onClick={() => setEditing(editing === c.id ? null : c.id)}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.address}</p>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ownerName(c.ownerId)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{t(`status.${c.status}`)}</Badge></TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>{c.terminals}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{kzt(c.saasFeeKzt)}</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(editing === c.id ? null : c.id)}>{t("admin.edit")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {editing && <ClubEditor club={clubs.find((c) => c.id === editing)!} />}
        </TabsContent>

        <TabsContent value="owners" className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold"><UserPlus className="size-4 text-primary" />{t("admin.newOwner")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t("admin.name")} value={ownerDraft.name} onChange={(v) => setOwnerDraft({ ...ownerDraft, name: v })} />
              <Field label={t("admin.email")} value={ownerDraft.email} onChange={(v) => setOwnerDraft({ ...ownerDraft, email: v })} />
              <Field label={t("admin.phone")} value={ownerDraft.phone} onChange={(v) => setOwnerDraft({ ...ownerDraft, phone: v })} />
              <Field label={t("admin.city")} value={ownerDraft.city} onChange={(v) => setOwnerDraft({ ...ownerDraft, city: v })} />
            </div>
            <Button
              className="mt-3"
              disabled={!ownerDraft.name.trim() || !ownerDraft.email.trim()}
              onClick={() => {
                const o = addOwner({ ...ownerDraft, name: ownerDraft.name.trim() });
                toast.success(`${o.name} ${t("admin.created")}`);
                setOwnerDraft({ ...ownerDraft, name: "", email: "" });
              }}
            >
              <UserPlus className="size-4" /> {t("owner.create")}
            </Button>
          </div>

          <div className="space-y-2">
            {owners.map((o) => {
              const theirs = clubs.filter((c) => c.ownerId === o.id);
              return (
                <div key={o.id} className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.email} · {o.phone} · {o.city}</p>
                    </div>
                    <Badge variant="secondary">{t("role.owner")}</Badge>
                    <span className="text-xs text-muted-foreground">{t("admin.clubsOf")}: {theirs.length}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => {
                        theirs.forEach((c) => setClubStatus(c.id, "suspended"));
                        toast(`${o.name} — ${t("status.suspended")}`);
                      }}
                    >
                      {t("admin.suspendOwner")}
                    </Button>
                  </div>
                  {theirs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {theirs.map((c) => (
                        <span key={c.id} className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
                          {c.name} · {t(`status.${c.status}`)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="mb-3 font-bold">{t("admin.accounts")}</h2>
            <div className="space-y-2">
              {allUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{t(`role.${u.role}`)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tx" className="grid gap-6 lg:grid-cols-2">
          <div>
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
          <div>
            <h2 className="mb-4 font-bold">{t("admin.accounts")}</h2>
            <div className="space-y-2">
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
        </TabsContent>
      </Tabs>
    </div>
  );

  function ClubEditor({ club }: { club: Club }) {
    return (
      <div className="rounded-xl border border-primary/40 bg-card/60 p-4 neon-glow">
        <p className="mb-3 font-semibold">{t("admin.edit")} · {club.name}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("admin.name")} value={club.name} onChange={(v) => updateClub(club.id, { name: v })} />
          <Field label={t("admin.address")} value={club.address} onChange={(v) => updateClub(club.id, { address: v })} />
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("admin.col.status")}</Label>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setClubStatus(club.id, s)}
                  className={`rounded-lg border border-border px-2 py-1.5 text-xs ${club.status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("admin.plan")}</Label>
            <div className="flex flex-wrap gap-1">
              {saasPlans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setClubPlan(club.id, p.name as Club["plan"], p.priceKzt)}
                  className={`rounded-lg border border-border px-2 py-1.5 text-xs ${club.plan === p.name ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5 lg:col-span-2">
            <Label className="text-xs text-muted-foreground">{t("admin.owner")}</Label>
            <div className="flex flex-wrap gap-1">
              {owners.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { assignOwner(club.id, o.id); toast.success(`${club.name} → ${o.name}`); }}
                  className={`rounded-lg border border-border px-2 py-1.5 text-xs ${club.ownerId === o.id ? "border-primary bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button className="mt-3" onClick={() => { setEditing(null); toast.success(t("owner.saved")); }}>{t("admin.save")}</Button>
      </div>
    );
  }
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
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
