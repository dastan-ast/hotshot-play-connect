import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Clock, Flame, MapPin, Search, Star, Users, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { kzt, type Club } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ClubMap = lazy(() => import("@/components/ClubMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HotShot Play — карта компьютерных клубов Астаны" },
      {
        name: "description",
        content:
          "Все компьютерные клубы Астаны на одной карте: бронируйте места часами абонемента и заходите по короткому коду.",
      },
      { property: "og:title", content: "HotShot Play — все клубы на одной карте" },
      {
        property: "og:description",
        content: "Найдите клуб, выберите время и забронируйте место за секунды.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

function isOpenNow(club: Club) {
  if (club.openFrom === "00:00" && club.openTo === "24:00") return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh = 0, fm = 0] = club.openFrom.split(":").map(Number);
  const [th = 0, tm = 0] = club.openTo.split(":").map(Number);
  const from = fh * 60 + fm;
  const to = th * 60 + tm;
  return to > from ? cur >= from && cur < to : cur >= from || cur < to;
}

const hoursLabel = (club: Club, open247: string) =>
  club.openFrom === "00:00" && club.openTo === "24:00" ? open247 : `${club.openFrom}–${club.openTo}`;

function MapSkeleton() {
  return <div className="grid-bg h-full w-full animate-pulse bg-card/60" />;
}

function HomePage() {
  const { clubs } = useStore();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = clubs.filter((c) => c.status === "active");
  const filtered = active.filter((c) => {
    const q = query.trim().toLowerCase();
    const matches = !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
    return matches && (!openNowOnly || isOpenNow(c));
  });
  const selected = filtered.find((c) => c.id === selectedId) ?? null;
  const totalSeats = active.reduce((s, c) => s + c.totalSeats, 0);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="size-3.5" /> {t("home.badge")}
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            {t("home.title1")} <span className="neon-text">{t("home.title2")}</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("home.subtitle")}</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="font-display text-2xl font-bold text-primary">{active.length}</p>
            <p className="text-xs text-muted-foreground">{t("home.stat.clubs")}</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-accent">{totalSeats}</p>
            <p className="text-xs text-muted-foreground">{t("home.stat.seats")}</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-foreground">1 375</p>
            <p className="text-xs text-muted-foreground">{t("home.stat.players")}</p>
          </div>
        </div>
      </section>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.search")}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-xl border border-border bg-card/70 p-1 text-xs font-semibold">
          <button
            onClick={() => setOpenNowOnly(false)}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              !openNowOnly ? "bg-primary/20 text-primary neon-glow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("home.all")}
          </button>
          <button
            onClick={() => setOpenNowOnly(true)}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              openNowOnly ? "bg-primary/20 text-primary neon-glow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("home.openNow")}
          </button>
        </div>
      </div>

      {/* Interactive map */}
      <section className="neon-panel relative overflow-hidden">
        <div className="pointer-events-none absolute left-4 top-4 z-[800] rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          {t("home.mapHint")}
        </div>
        <div className="h-[380px] sm:h-[480px] lg:h-[540px]">
          {mounted ? (
            <Suspense fallback={<MapSkeleton />}>
              <ClubMap clubs={filtered} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          ) : (
            <MapSkeleton />
          )}
        </div>

        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[800] sm:left-4 sm:right-auto sm:w-[380px]">
            <div className="neon-panel overflow-hidden !rounded-2xl">
              <div className="h-16" style={{ background: selected.cover }} />
              <div className="relative p-4 pt-0">
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                  className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg border border-border bg-background/80 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
                <h3 className="font-display text-lg font-bold">{selected.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {selected.address}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1 text-accent">
                    <Star className="size-3.5 fill-accent" /> {selected.rating.toFixed(1)}
                    <span className="text-muted-foreground">· {selected.reviewsCount} {t("home.reviews")}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" /> {hoursLabel(selected, t("home.open247"))}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="size-3.5" /> {selected.totalSeats} {t("home.seats")}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <b className="font-display text-lg text-primary">{kzt(selected.pricePerHour)}</b>
                    <span className="text-xs text-muted-foreground"> {t("home.perHour")}</span>
                  </p>
                  <Button asChild className="neon-glow">
                    <Link to="/clubs/$clubId" params={{ clubId: selected.id }}>
                      {t("home.book")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Club list */}
      <section>
        <h2 className="font-display mb-4 text-xl font-bold">{t("home.listTitle")}</h2>
        {filtered.length === 0 ? (
          <p className="neon-panel p-8 text-center text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((club) => (
              <button
                key={club.id}
                onClick={() => {
                  setSelectedId(club.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "neon-panel group overflow-hidden text-left transition-transform hover:-translate-y-1",
                  selectedId === club.id && "cyan-glow border-accent/60",
                )}
              >
                <div className="h-24" style={{ background: club.cover }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-bold leading-tight">{club.name}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                      <Star className="size-3 fill-accent" /> {club.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" /> {club.address}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      <Clock className="mr-1 inline size-3" />
                      {hoursLabel(club, t("home.open247"))}
                    </span>
                    <span className="font-semibold text-primary">
                      {t("home.from")} {kzt(club.pricePerHour)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
