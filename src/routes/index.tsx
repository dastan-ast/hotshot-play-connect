import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Star, Clock, Search, Gamepad2, Zap, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pcZones, kzt } from "@/lib/mock-db";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HotShot Play — Book Computer Clubs in Astana" },
      {
        name: "description",
        content:
          "Find, compare and book gaming PCs and PS5 seats in Astana computer clubs. Live pricing, universal gaming passes and instant QR check-in.",
      },
      { property: "og:title", content: "HotShot Play — Book Computer Clubs in Astana" },
      { property: "og:description", content: "Aggregator of computer clubs in Kazakhstan: map, seat booking, universal passes and QR check-in." },
    ],
  }),
  component: Index,
});

function Index() {
  const { clubs } = useStore();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(clubs[0]!.id);

  const filtered = useMemo(
    () => clubs.filter((c) => (c.name + c.address).toLowerCase().includes(q.toLowerCase())),
    [clubs, q],
  );
  const active = clubs.find((c) => c.id === selected)!;

  return (
    <div className="space-y-8">
      <section className="neon-panel relative overflow-hidden p-6 sm:p-10">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-accent/15 text-accent">{t("home.badge")}</Badge>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("home.title1")} <span className="neon-text">{t("home.title2")}</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            {t("home.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/passes">{t("home.cta.pass")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/profile">{t("home.cta.qr")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Gamepad2 className="size-4 text-primary" /> {t("home.stat.terminals")}</span>
            <span className="flex items-center gap-2"><Zap className="size-4 text-accent" /> {t("home.stat.instant")}</span>
            <span className="flex items-center gap-2"><Users className="size-4 text-primary" /> {t("home.stat.gamers")}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="neon-panel relative min-h-[420px] overflow-hidden">
          <div className="grid-bg absolute inset-0 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_40%_40%,oklch(0.65_0.24_300/0.14),transparent_70%)]" />
          <div className="absolute left-4 top-4 z-10 rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            {t("home.mapview")}
          </div>
          {clubs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{ left: `${c.mapX}%`, top: `${c.mapY}%` }}
              className={cn(
                "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                selected === c.id
                  ? "border-primary bg-primary text-primary-foreground neon-glow scale-110"
                  : "border-border bg-card/90 text-foreground hover:border-accent",
              )}
            >
              <MapPin className="mr-1 inline size-3" />
              {c.name.split(" ")[0]} · {c.fromPrice}₸
            </button>
          ))}
          <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-border bg-background/90 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.address}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <Star className="mr-1 size-3 text-accent" /> {active.rating}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {pcZones.filter((z) => z.clubId === active.id).map((z) => (
                <span key={z.id} className="rounded-md bg-secondary px-2 py-1">
                  {z.type} · {kzt(z.pricePerHour)}/h
                </span>
              ))}
            </div>
            <Button asChild className="mt-3 w-full" size="sm">
              <Link to="/clubs/$clubId" params={{ clubId: active.id }}>
                {t("home.book")}
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.search")} className="pl-9" />
          </div>
          <div className="space-y-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to="/clubs/$clubId"
                params={{ clubId: c.id }}
                onMouseEnter={() => setSelected(c.id)}
                className="neon-panel flex gap-4 p-3 transition-all hover:neon-glow"
              >
                <div className="h-24 w-28 shrink-0 rounded-xl" style={{ backgroundImage: c.cover }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold">{c.name}</p>
                    <span className="flex items-center gap-1 text-sm text-accent">
                      <Star className="size-3.5" /> {c.rating}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.address}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
                      <Clock className="size-3" /> {c.openFrom === "24/7" ? "24/7" : `${c.openFrom}–${c.openTo}`}
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-1">{t("home.from")} {kzt(c.fromPrice)}/h</span>
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-primary">{c.occupancy}% {t("home.busy")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
