import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Star, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/components/PaymentDialog";
import { kzt, type PaymentMethod } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/clubs/$clubId")({
  head: () => ({
    meta: [
      { title: "Club booking — HotShot Play" },
      { name: "description", content: "Pick your zone, seat and time slot in a HotShot Play partner computer club and pay with Kaspi, card or your universal pass." },
      { property: "og:title", content: "Club booking — HotShot Play" },
      { property: "og:description", content: "Zone, seat and time-slot booking for computer clubs in Astana." },
    ],
  }),
  component: ClubPage,
});

const SLOTS = ["12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "22:00", "00:00"];
const takenSeats = [2, 5, 9, 14, 21];

function ClubPage() {
  const { clubId } = Route.useParams();
  const { clubs, zones: allZones, seats: allSeats, user, addBooking, passHours } = useStore();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const club = clubs.find((c) => c.id === clubId);
  const zones = allZones.filter((z) => z.clubId === clubId);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [seat, setSeat] = useState<number | null>(null);
  const [slot, setSlot] = useState(SLOTS[4]!);
  const [hours, setHours] = useState(2);
  const [checkout, setCheckout] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [confirmed, setConfirmed] = useState<{ seat: number; slot: string; hours: number; total: number; method: string; code: string } | null>(null);

  if (!club) {
    return (
      <div className="neon-panel p-8 text-center">
        <p className="font-semibold">{t("club.notfound")}</p>
        <Button asChild className="mt-4"><Link to="/">{t("club.back")}</Link></Button>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === zoneId)!;
  const zoneSeats = allSeats.filter((st) => st.zoneId === zone?.id);
  const total = zone.pricePerHour * hours;

  const confirm = (paidWith: PaymentMethod) => {
    const guest = !isAuthenticated;
    const booking = addBooking({
      ...(guest ? { guestName: guestName.trim(), guestPhone: guestPhone.trim() } : { userId: user.id }),
      clubId: club.id,
      zoneId: zone.id,
      seatNo: seat ?? 1,
      date: "2026-08-21",
      startTime: slot,
      hours,
      totalKzt: String(paidWith) === "HotShot Pass" ? 0 : total,
      paidWith,
      status: "upcoming",
    });
    toast.success(`${t("club.booked")}: #${seat} · ${club.name} · ${slot}`);
    setCheckout(false);
    setConfirmed({
      seat: seat ?? 1,
      slot,
      hours,
      total: String(paidWith) === "HotShot Pass" ? 0 : total,
      method: String(paidWith),
      code: booking.code,
    });
  };

  if (confirmed) {
    return (
      <div className="neon-panel mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/20 neon-glow">
          <CheckCircle2 className="size-8 text-primary" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">{t("club.confirmTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("club.confirmHint")}</p>
        <div className="mx-auto mt-6 w-fit rounded-2xl border border-primary/50 bg-secondary/50 px-8 py-4 neon-glow">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("booking.code")}</p>
          <p className="mt-1 font-mono text-3xl font-extrabold tracking-widest neon-text">{confirmed.code}</p>
        </div>
        <dl className="mt-6 space-y-2 text-left text-sm">
          <Row label={t("club.club")} value={club.name} />
          <Row label={t("club.zone")} value={zone.name} />
          <Row label={t("club.seat")} value={`#${confirmed.seat}`} />
          <Row label={t("club.start")} value={`${t("club.today")}, ${confirmed.slot} · ${confirmed.hours}h`} />
          <Row label={t("club.total")} value={confirmed.total ? `${kzt(confirmed.total)} · ${confirmed.method}` : confirmed.method} />
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate({ to: "/profile" })}>{t("club.viewQr")}</Button>
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard?.writeText(confirmed.code);
              toast.success(t("wiz.copied"));
            }}
          >
            {t("wiz.copy")}
          </Button>
          <Button variant="secondary" onClick={() => { setConfirmed(null); setSeat(null); }}>{t("club.bookAnother")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("club.back")}
      </Link>

      <section className="neon-panel overflow-hidden">
        <div className="h-36 w-full sm:h-48" style={{ backgroundImage: club.cover }} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h1 className="text-2xl font-extrabold">{club.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {club.address}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary"><Star className="mr-1 size-3 text-accent" />{club.rating} · {club.reviews} {t("club.reviews")}</Badge>
            <Badge className="bg-primary/15 text-primary">{club.occupancy}% {t("club.occupied")}</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="neon-panel space-y-6 p-5">
          <div>
            <h2 className="mb-3 font-bold">{t("club.zones")}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => { setZoneId(z.id); setSeat(null); }}
                  className={cn(
                    "rounded-xl border border-border bg-card/60 p-3 text-left transition-all",
                    zoneId === z.id && "border-primary/60 neon-glow",
                  )}
                >
                  <p className="text-sm font-semibold">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.specs}</p>
                  <p className="mt-2 text-sm font-bold neon-text">{kzt(z.pricePerHour)}/h</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold">{t("club.pickseat")} · {zone.name}</h2>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {zoneSeats.map((st) => {
                const taken = takenSeats.includes(st.no) || st.status !== "ok";
                return (
                  <button
                    key={st.id}
                    disabled={taken}
                    title={`${st.label} · ${st.specs}`}
                    onClick={() => setSeat(st.no)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg border border-border bg-secondary/50 text-xs font-semibold transition-all",
                      taken && "cursor-not-allowed opacity-30",
                      seat === st.no && "border-primary bg-primary text-primary-foreground neon-glow",
                    )}
                  >
                    <Monitor className="size-3.5" />
                    {st.no}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>■ {t("club.available")}</span><span className="opacity-40">■ {t("club.occupiedSeat")}</span><span className="text-primary">■ {t("club.selected")}</span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold">{t("club.timeslot")}</h2>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-lg border border-border px-3 py-2 text-sm transition-all",
                    slot === s && "border-primary bg-primary text-primary-foreground neon-glow",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="neon-panel h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="font-bold">{t("club.booking")}</h2>
          <dl className="space-y-2 text-sm">
            <Row label={t("club.club")} value={club.name} />
            <Row label={t("club.zone")} value={`${zone.name} (${zone.type})`} />
            <Row label={t("club.seat")} value={seat ? `#${seat}` : t("club.notSelected")} />
            <Row label={t("club.start")} value={`${t("club.today")}, ${slot}`} />
          </dl>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 5].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={cn(
                  "flex-1 rounded-lg border border-border py-2 text-sm transition-all",
                  hours === h && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {h}h
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">{t("club.total")}</span>
            <span className="text-xl font-extrabold neon-text">{kzt(total)}</span>
          </div>
          {isAuthenticated ? (
            <Button className="w-full" disabled={!seat} onClick={() => setCheckout(true)}>
              {seat ? t("club.pay") : t("club.selectSeat")}
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-card/60 p-3">
              <div>
                <p className="text-sm font-semibold">{t("wiz.guestTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("wiz.guestHint")}</p>
              </div>
              <Input placeholder={t("wiz.name")} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              <Input placeholder={t("wiz.phone")} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
              <Button
                className="w-full"
                disabled={!seat}
                onClick={() => {
                  if (!guestName.trim() || !guestPhone.trim()) {
                    toast.error(t("wiz.needContacts"));
                    return;
                  }
                  setCheckout(true);
                }}
              >
                {seat ? t("wiz.guestPay") : t("club.selectSeat")}
              </Button>
              <Link to="/auth" className="block text-center text-xs text-muted-foreground underline">
                {t("auth.signin")}
              </Link>
            </div>
          )}
          <Button
            variant="secondary"
            className="w-full"
            disabled={!isAuthenticated || !seat || passHours < hours}
            onClick={() => confirm("HotShot Pass" as PaymentMethod)}
          >
            {t("club.usePass")} ({passHours}h)
          </Button>
        </aside>
      </div>

      <PaymentDialog
        open={checkout}
        onOpenChange={setCheckout}
        title={`${club.name} · seat ${seat} · ${hours}h`}
        amount={total}
        onConfirm={confirm}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
