import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Star, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentDialog } from "@/components/PaymentDialog";
import { pcZones, kzt, type PaymentMethod } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  const { clubs, addBooking, passHours } = useStore();
  const navigate = useNavigate();
  const club = clubs.find((c) => c.id === clubId);
  const zones = pcZones.filter((z) => z.clubId === clubId);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [seat, setSeat] = useState<number | null>(null);
  const [slot, setSlot] = useState(SLOTS[4]!);
  const [hours, setHours] = useState(2);
  const [checkout, setCheckout] = useState(false);

  if (!club) {
    return (
      <div className="neon-panel p-8 text-center">
        <p className="font-semibold">Club not found</p>
        <Button asChild className="mt-4"><Link to="/">Back to map</Link></Button>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === zoneId)!;
  const total = zone.pricePerHour * hours;

  const confirm = (paidWith: PaymentMethod) => {
    addBooking({
      userId: "u1",
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
    toast.success(`Seat ${seat} booked at ${club.name} · ${slot}`);
    setCheckout(false);
    navigate({ to: "/profile" });
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to map
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
            <Badge variant="secondary"><Star className="mr-1 size-3 text-accent" />{club.rating} · {club.reviews} reviews</Badge>
            <Badge className="bg-primary/15 text-primary">{club.occupancy}% occupied</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="neon-panel space-y-6 p-5">
          <div>
            <h2 className="mb-3 font-bold">Zones</h2>
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
            <h2 className="mb-3 font-bold">Pick a seat · {zone.name}</h2>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {Array.from({ length: zone.seats }, (_, i) => i + 1).map((n) => {
                const taken = takenSeats.includes(n);
                return (
                  <button
                    key={n}
                    disabled={taken}
                    onClick={() => setSeat(n)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg border border-border bg-secondary/50 text-xs font-semibold transition-all",
                      taken && "cursor-not-allowed opacity-30",
                      seat === n && "border-primary bg-primary text-primary-foreground neon-glow",
                    )}
                  >
                    <Monitor className="size-3.5" />
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>■ available</span><span className="opacity-40">■ occupied</span><span className="text-primary">■ selected</span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold">Time slot</h2>
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
          <h2 className="font-bold">Your booking</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Club" value={club.name} />
            <Row label="Zone" value={`${zone.name} (${zone.type})`} />
            <Row label="Seat" value={seat ? `#${seat}` : "not selected"} />
            <Row label="Start" value={`Today, ${slot}`} />
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
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold neon-text">{kzt(total)}</span>
          </div>
          <Button className="w-full" disabled={!seat} onClick={() => setCheckout(true)}>
            {seat ? "Pay & book" : "Select a seat"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            disabled={!seat || passHours < hours}
            onClick={() => confirm("HotShot Pass" as PaymentMethod)}
          >
            Use HotShot Pass ({passHours}h left)
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
