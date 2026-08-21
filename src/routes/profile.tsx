import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode, Play, Square, Ticket, Wallet, History, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { kzt, pcZones } from "@/lib/mock-db";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — HotShot Play" },
      { name: "description", content: "Your gaming hours, active bookings, QR check-in pass, payment history and reviews on HotShot Play." },
      { property: "og:title", content: "My Profile — HotShot Play" },
      { property: "og:description", content: "Track gaming hours, bookings and QR sessions across partner clubs." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, clubs, bookings, payments, qrSessions, passHours, balance, startSession, stopSession } = useStore();
  const openSession = qrSessions.find((s) => s.status === "open");
  const [code, setCode] = useState(openSession?.code ?? "HSP-••••-KZ");

  const clubName = (id: string) => clubs.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <section className="neon-panel flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/20 text-lg font-extrabold neon-glow">
          {user.avatarInitials}
        </span>
        <div>
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email} · {user.city}</p>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={Ticket} label="Pass hours" value={`${passHours}h`} />
          <Stat icon={Wallet} label="Wallet" value={kzt(balance)} />
          <Stat icon={History} label="Sessions" value={String(qrSessions.length)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="neon-panel p-5 text-center">
          <h2 className="font-bold">Digital pass · QR check-in</h2>
          <p className="mt-1 text-xs text-muted-foreground">Scan at the club entrance to start or stop your session</p>
          <div className="mx-auto mt-5 grid size-48 place-items-center rounded-2xl border border-primary/40 bg-secondary/50 neon-glow">
            <QrCode className="size-32 text-primary" />
          </div>
          <p className="mt-3 font-mono text-sm tracking-widest text-accent">{code}</p>
          <Badge variant="secondary" className="mt-2">{openSession ? "Session running" : "Idle"}</Badge>
          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1"
              disabled={!!openSession}
              onClick={() => {
                const s = startSession(clubs[0]!.id, bookings.find((b) => b.status === "upcoming")?.id);
                setCode(s.code);
                toast.success("Session started — clock is running");
              }}
            >
              <Play className="size-4" /> Start
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={!openSession}
              onClick={() => {
                stopSession(openSession!.id);
                toast.success("Session stopped — hours deducted");
              }}
            >
              <Square className="size-4" /> Stop
            </Button>
          </div>
        </section>

        <section className="neon-panel p-5">
          <Tabs defaultValue="bookings">
            <TabsList className="mb-4">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{clubName(b.clubId)}</p>
                    <Badge variant={b.status === "upcoming" ? "default" : "secondary"} className="capitalize">{b.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pcZones.find((z) => z.id === b.zoneId)?.name} · seat #{b.seatNo} · {b.date} {b.startTime} · {b.hours}h
                  </p>
                  <p className="mt-1 text-sm">{b.totalKzt ? kzt(b.totalKzt) : "Paid with HotShot Pass"} · {String(b.paidWith)}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="payments" className="space-y-2">
              {payments.filter((p) => p.userId === "u1").map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.createdAt} · {p.method}</p>
                  </div>
                  <span className="font-bold text-accent">{kzt(p.amountKzt)}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="sessions" className="space-y-2">
              {qrSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-mono">{s.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {clubName(s.clubId)} · {s.startedAt}{s.endedAt ? ` → ${s.endedAt}` : ""}
                    </p>
                  </div>
                  <Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-3">
              {[
                { club: "Pixel Arena", rating: 5, text: "Fast PCs, comfy chairs, great pass value." },
                { club: "CyberDome Astana", rating: 4, text: "VIP zone is worth it, a bit noisy on weekends." },
              ].map((r) => (
                <div key={r.club} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.club}</p>
                    <span className="flex items-center gap-1 text-accent text-sm">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
