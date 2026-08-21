import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Activity, CalendarCheck, Cpu, AlertTriangle, Check, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentDialog } from "@/components/PaymentDialog";
import { revenueSeries, saasPlans, kzt, users } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { RequireRole } from "@/components/RequireRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner Dashboard — HotShot Play for Clubs" },
      { name: "description", content: "Club owner dashboard: occupancy, revenue analytics, zone and pricing management, plus SaaS subscription billing with a 7-day free trial." },
      { property: "og:title", content: "Partner Dashboard — HotShot Play for Clubs" },
      { property: "og:description", content: "Analytics, pricing and SaaS billing for computer clubs on HotShot Play." },
    ],
  }),
  component: () => (
    <RequireRole roles={["owner", "admin"]}>
      <PartnerPage />
    </RequireRole>
  ),
});

const daysLeft = (iso: string) => {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return diff;
};

function PartnerPage() {
  const { clubs, zones: allZones, bookings, payments, updateClub, updateZone, paySaas, checkInBooking } = useStore();
  const { t } = useI18n();
  const [clubId, setClubId] = useState(clubs[0]!.id);
  const club = clubs.find((c) => c.id === clubId)!;
  const zones = allZones.filter((z) => z.clubId === clubId);
  const clubBookings = bookings.filter((b) => b.clubId === clubId);
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = clubBookings.filter((b) => b.date === today && b.status !== "cancelled");
  const guest = (userId: string) => users.find((u) => u.id === userId);
  const trialDays = daysLeft(club.trialEndsAt);
  const [planPending, setPlanPending] = useState<(typeof saasPlans)[number] | null>(null);
  const weekRevenue = revenueSeries.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t("partner.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("partner.subtitle")}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {clubs.map((c) => (
            <button
              key={c.id}
              onClick={() => setClubId(c.id)}
              className={`rounded-lg border border-border px-3 py-2 text-sm transition-all ${clubId === c.id ? "border-primary bg-primary text-primary-foreground neon-glow" : "bg-card/60 text-muted-foreground"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="neon-panel flex flex-wrap items-center gap-4 border-accent/40 p-4 cyan-glow">
        <AlertTriangle className="size-5 shrink-0 text-accent" />
        <div className="text-sm">
          <p className="font-bold">
            {t("partner.sub.title")}: {club.plan} · {t(`status.${club.status}`)}
          </p>
          <p className="text-muted-foreground">
            {club.plan === "Trial"
              ? trialDays > 0
                ? `${t("partner.sub.daysLeft")}: ${trialDays} · ${t("partner.trialEnds")} ${club.trialEndsAt}`
                : `${t("partner.sub.expired")} · ${club.trialEndsAt}`
              : `${kzt(club.saasFeeKzt)}${t("partner.perMonth")} · ${t("partner.trialEnds")} ${club.trialEndsAt}`}
          </p>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setPlanPending(saasPlans.find((p) => p.name === club.plan) ?? saasPlans[1]!)}>
          {t("partner.sub.payNow")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Activity} label={t("partner.kpi.occupancy")} value={`${club.occupancy}%`} sub={`+6% ${t("partner.kpi.vsWeek")}`} />
        <Kpi icon={TrendingUp} label={t("partner.kpi.revenue")} value={kzt(weekRevenue)} sub={`+18% ${t("partner.kpi.vsWeek")}`} />
        <Kpi icon={CalendarCheck} label={t("partner.kpi.bookings")} value={String(bookings.filter((b) => b.clubId === clubId).length + 27)} sub={t("partner.kpi.viaPass")} />
        <Kpi icon={Cpu} label={t("partner.kpi.terminals")} value={String(club.terminals)} sub={`${zones.length} ${t("partner.kpi.zones")}`} />
      </div>

      <div className="neon-panel p-5">
        <h2 className="mb-4 font-bold">{t("partner.chart")}</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v: number) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => kzt(v)}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Tabs defaultValue="incoming" className="neon-panel p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="incoming">{t("partner.tab.incoming")}</TabsTrigger>
          <TabsTrigger value="bookings">{t("partner.tab.bookings")}</TabsTrigger>
          <TabsTrigger value="zones">{t("partner.tab.zones")}</TabsTrigger>
          <TabsTrigger value="club">{t("partner.tab.club")}</TabsTrigger>
          <TabsTrigger value="billing">{t("partner.tab.billing")}</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partner.bk.guest")}</TableHead>
                <TableHead>{t("partner.bk.phone")}</TableHead>
                <TableHead>{t("partner.bk.code")}</TableHead>
                <TableHead>{t("partner.bk.zone")}</TableHead>
                <TableHead>{t("partner.bk.time")}</TableHead>
                <TableHead>{t("partner.bk.status")}</TableHead>
                <TableHead className="text-right">{t("partner.bk.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">{t("partner.bk.todayEmpty")}</TableCell>
                </TableRow>
              )}
              {todayBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{(b.userId ? guest(b.userId)?.name : b.guestName) ?? b.guestName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{(b.userId ? guest(b.userId)?.phone : b.guestPhone) ?? b.guestPhone ?? "—"}</TableCell>
                  <TableCell className="font-mono font-bold tracking-widest text-accent">{b.code}</TableCell>
                  <TableCell>{allZones.find((z) => z.id === b.zoneId)?.name ?? "—"} · #{b.seatNo}</TableCell>
                  <TableCell>{b.startTime} · {b.hours}h</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "upcoming" ? "secondary" : "default"}>{t(`booking.${b.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "upcoming" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          checkInBooking(b.id);
                          toast.success(`${b.code} · ${t("partner.bk.checkedin")}`);
                        }}
                      >
                        <UserCheck className="size-4" /> {t("partner.bk.checkin")}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("partner.bk.checkedin")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="bookings">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partner.bk.zone")}</TableHead>
                <TableHead>{t("partner.bk.seat")}</TableHead>
                <TableHead>{t("partner.bk.code")}</TableHead>
                <TableHead>{t("partner.bk.when")}</TableHead>
                <TableHead>{t("partner.bk.hours")}</TableHead>
                <TableHead>{t("partner.bk.status")}</TableHead>
                <TableHead className="text-right">{t("partner.bk.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">{t("partner.bk.empty")}</TableCell>
                </TableRow>
              )}
              {clubBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{allZones.find((z) => z.id === b.zoneId)?.name ?? "—"}</TableCell>
                  <TableCell>#{b.seatNo}</TableCell>
                  <TableCell className="font-mono text-accent">{b.code}</TableCell>
                  <TableCell>{b.date} · {b.startTime}</TableCell>
                  <TableCell>{b.hours}h</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "active" ? "default" : "secondary"}>{t(`booking.${b.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{kzt(b.totalKzt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="zones">
          <ClubBuilder clubId={clubId} />
        </TabsContent>


        <TabsContent value="club" className="grid max-w-xl gap-4">
          <Field label={t("partner.clubName")} value={club.name} onChange={(v) => updateClub(club.id, { name: v })} />
          <Field label={t("partner.address")} value={club.address} onChange={(v) => updateClub(club.id, { address: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("partner.opens")} value={club.openFrom} onChange={(v) => updateClub(club.id, { openFrom: v })} />
            <Field label={t("partner.closes")} value={club.openTo} onChange={(v) => updateClub(club.id, { openTo: v })} />
          </div>
          <Field label={t("partner.cover")} value={club.cover} onChange={(v) => updateClub(club.id, { cover: v })} />
          <div className="h-24 w-full rounded-xl border border-border" style={{ backgroundImage: club.cover }} />
          <Field
            label={t("partner.photos")}
            value={club.photos.join(", ")}
            onChange={(v) => updateClub(club.id, { photos: v.split(",").map((x) => x.trim()).filter(Boolean) })}
          />
          <Button className="w-fit" onClick={() => toast.success(t("partner.profileSaved"))}>{t("partner.saveChanges")}</Button>
        </TabsContent>

        <TabsContent value="billing" className="space-y-5">
          <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
            {t("partner.currentPlan")}: <b>{club.plan}</b> · {kzt(club.saasFeeKzt)}{t("partner.perMonth")} · {club.terminals} {t("partner.terminalsWord")}
            {club.plan === "Trial" && <span className="text-accent"> · {t("partner.trialEnds")} {club.trialEndsAt}</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {saasPlans.map((p) => (
              <div key={p.id} className={`neon-panel p-5 ${p.highlight ? "neon-glow" : ""}`}>
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.terminals}</p>
                <p className="mt-3 text-2xl font-extrabold neon-text">{kzt(p.priceKzt)}<span className="text-sm text-muted-foreground">{t("partner.mo")}</span></p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" />{perk}</li>
                  ))}
                </ul>
                <Button className="mt-4 w-full" variant={club.plan === p.name ? "secondary" : "default"} onClick={() => setPlanPending(p)}>
                  {club.plan === p.name ? "Renew" : "Switch plan"}
                </Button>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 font-bold">{t("partner.invoices")}</h3>
            <div className="space-y-2">
              {payments.filter((p) => p.kind === "saas").map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.createdAt} · {p.method}</p>
                  </div>
                  <span className="font-bold text-accent">{kzt(p.amountKzt)}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentDialog
        open={!!planPending}
        onOpenChange={(o) => !o && setPlanPending(null)}
        title={`${planPending?.name} ${t("partner.planMonthly")}`}
        amount={planPending?.priceKzt ?? 0}
        onConfirm={(method) => {
          if (!planPending) return;
          paySaas(club.id, planPending.name as typeof club.plan, planPending.priceKzt, method);
          toast.success(`${club.name}: ${planPending.name} ${t("partner.planSwitched")}`);
          setPlanPending(null);
        }}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Activity; label: string; value: string; sub: string }) {
  return (
    <div className="neon-panel p-5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4 text-primary" />{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-accent">{sub}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
