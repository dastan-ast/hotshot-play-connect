import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DbRole } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Building2, ShieldCheck, Ticket, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { kzt, last7Days, type ClubStatus, type Role } from "@/lib/mock-db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireRole } from "@/components/RequireRole";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Суперадмин — HotShot Play" },
      { name: "description", content: "Модерация клубов, пользователи и выручка платформы HotShot Play." },
      { property: "og:title", content: "HotShot Play — панель суперадмина" },
      { property: "og:description", content: "Заявки клубов, пользователи и аналитика платформы." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AdminPage,
});

const STATUS_VARIANT: Record<ClubStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  active: "default",
  rejected: "outline",
  suspended: "destructive",
};

const ROLE_VARIANT: Record<Role, "default" | "secondary" | "outline" | "destructive"> = {
  player: "secondary",
  clubAdmin: "outline",
  owner: "default",
  admin: "destructive",
};

function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminInner />
    </RequireRole>
  );
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  city: string;
  role: Role;
}

const ROLE_LABEL: Record<DbRole, Role> = {
  player: "player",
  club_admin: "clubAdmin",
  owner: "owner",
  admin: "admin",
};

function AdminInner() {
  const { clubs, payments, setClubStatus, rejectClub, reloadClubs } = useStore();
  const { t } = useI18n();
  const [people, setPeople] = useState<PlatformUser[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    void reloadClubs();
  }, [reloadClubs]);

  useEffect(() => {
    void (async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, name, email, city"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleOf = new Map((roles ?? []).map((r) => [r.user_id, r.role as DbRole]));
      setPeople(
        (profiles ?? []).map((p) => ({
          id: p.id,
          name: p.name || p.email,
          email: p.email,
          city: p.city,
          role: ROLE_LABEL[roleOf.get(p.id) ?? "player"],
        })),
      );
    })();
  }, [clubs]);

  const allUsers = people;
  const userName = (id: string) => people.find((p) => p.id === id)?.name ?? "—";

  const gmvSeries = last7Days().map((d) => ({
    day: d.slice(5),
    revenue: payments
      .filter((p) => p.status === "succeeded" && p.createdAt.slice(0, 10) === d)
      .reduce((sum, p) => sum + p.amountKzt, 0),
  }));

  const pending = clubs.filter((c) => c.status === "pending");
  const activeCount = clubs.filter((c) => c.status === "active").length;
  const gmv = payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amountKzt, 0);

  const kpis = [
    { icon: Building2, label: t("admin.kpi.clubs"), value: String(activeCount) },
    { icon: Users, label: t("admin.kpi.users"), value: String(allUsers.length) },
    { icon: Wallet, label: t("admin.kpi.gmv"), value: kzt(gmv) },
    { icon: Ticket, label: t("admin.kpi.subs"), value: String(payments.length) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="size-6 text-primary" /> {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="neon-panel p-4">
            <kpi.icon className="size-5 text-primary" />
            <p className="font-display mt-2 text-xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="clubs">
        <TabsList>
          <TabsTrigger value="clubs">
            {t("admin.tab.clubs")}
            {pending.length > 0 && (
              <span className="ml-1.5 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview">{t("admin.tab.overview")}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.tab.users")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="neon-panel p-5">
            <p className="text-sm font-semibold">{t("admin.chart")}</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gmvSeries}>
                  <defs>
                    <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [kzt(Number(value)), t("admin.kpi.gmv")]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fill="url(#adminRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="mt-4 space-y-6">
          {/* Applications */}
          <section>
            <h2 className="font-display text-lg font-bold">{t("admin.applications")}</h2>
            {pending.length === 0 ? (
              <p className="neon-panel mt-3 p-6 text-center text-sm text-muted-foreground">{t("admin.noApps")}</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {pending.map((club) => (
                  <div key={club.id} className="neon-panel overflow-hidden">
                    <div className="h-16" style={{ background: club.cover }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{club.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {club.address} · {t("admin.appliedAt")} {club.appliedAt}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("admin.col.owner")}: {userName(club.ownerId)} · {club.totalSeats} {t("home.seats")} ·{" "}
                            {kzt(club.pricePerHour)}
                            {t("home.perHour")}
                          </p>
                        </div>
                        <Badge variant="secondary">{t("status.pending")}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Input
                          value={reasons[club.id] ?? ""}
                          onChange={(e) => setReasons((r) => ({ ...r, [club.id]: e.target.value }))}
                          placeholder={t("admin.rejectReasonPlaceholder")}
                          aria-label={t("admin.rejectReason")}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="neon-glow"
                            onClick={() => {
                              setClubStatus(club.id, "active");
                              toast.success(`${club.name} — ${t("admin.approved")}`);
                            }}
                          >
                            {t("admin.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              rejectClub(club.id, (reasons[club.id] ?? "").trim() || t("admin.rejectReason"));
                              toast.success(`${club.name} — ${t("admin.rejected")}`);
                            }}
                          >
                            {t("admin.reject")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* All clubs */}
          <section className="neon-panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">{t("admin.col.club")}</th>
                  <th className="p-3">{t("admin.col.owner")}</th>
                  <th className="p-3">{t("admin.col.price")}</th>
                  <th className="p-3">{t("admin.col.seats")}</th>
                  <th className="p-3">{t("admin.col.rating")}</th>
                  <th className="p-3">{t("admin.col.status")}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr key={club.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{club.name}</p>
                      <p className="text-xs text-muted-foreground">{club.address}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{userName(club.ownerId)}</td>
                    <td className="p-3">{kzt(club.pricePerHour)}</td>
                    <td className="p-3">{club.totalSeats}</td>
                    <td className="p-3">{club.rating > 0 ? club.rating.toFixed(1) : "—"}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[club.status]}>{t(`status.${club.status}`)}</Badge>
                    </td>
                    <td className="p-3">
                      {club.status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setClubStatus(club.id, "suspended");
                            toast.success(`${club.name} ${t("admin.statusUpdated")}`);
                          }}
                        >
                          {t("admin.suspend")}
                        </Button>
                      )}
                      {(club.status === "suspended" || club.status === "rejected") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setClubStatus(club.id, "active");
                            toast.success(`${club.name} ${t("admin.statusUpdated")}`);
                          }}
                        >
                          {t("admin.restore")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="neon-panel overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">{t("admin.col.name")}</th>
                  <th className="p-3">{t("admin.col.email")}</th>
                  <th className="p-3">{t("admin.col.role")}</th>
                  <th className="p-3">{t("admin.col.city")}</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3">
                      <span className="mr-2 inline-grid size-7 place-items-center rounded-lg bg-primary/20 align-middle text-[10px] font-bold">
                        {u.name.slice(0, 2).toUpperCase()}
                      </span>
                      {u.name}
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Badge variant={ROLE_VARIANT[u.role]}>{t(`role.${u.role}`)}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
