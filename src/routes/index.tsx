import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Cpu, Flame, MapPin, Search, Star, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { type Club } from "@/lib/mock-db";
import { gisUrl } from "@/lib/gis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeadShot Play — компьютерные клубы Астаны" },
      {
        name: "description",
        content:
          "Все компьютерные клубы Астаны в одном списке: бронируйте места часами абонемента и заходите по короткому коду.",
      },
      { property: "og:title", content: "HeadShot Play — все клубы в одном списке" },
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

function HomePage() {
  const { clubs } = useStore();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);

  const active = clubs.filter((c) => c.status === "active");
  const filtered = active.filter((c) => {
    const q = query.trim().toLowerCase();
    const matches = !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
    return matches && (!openNowOnly || isOpenNow(c));
  });
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

      {/* Club list */}
      <section>
        <h2 className="font-display mb-4 text-xl font-bold">{t("home.listTitle")}</h2>
        {filtered.length === 0 ? (
          <p className="neon-panel p-8 text-center text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((club) => (
              <div key={club.id} className="neon-panel flex flex-col overflow-hidden">
                <div className="h-20" style={{ background: club.cover }} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold leading-tight">{club.name}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                      <Star className="size-3 fill-accent" /> {club.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" /> {club.city}, {club.address}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><Clock className="mr-1 inline size-3" />{hoursLabel(club, t("home.open247"))}</span>
                    <span><Users className="mr-1 inline size-3" />{club.totalSeats} {t("home.seats")}</span>
                  </div>
                  {club.specs && (
                    <p className="mt-2 line-clamp-2 font-mono text-[11px] text-accent">
                      <Cpu className="mr-1 inline size-3" />{club.specs}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-primary">{t("home.bySub")}</p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Button asChild variant="secondary" size="sm" className="flex-1">
                      <a href={gisUrl(club)} target="_blank" rel="noopener noreferrer">
                        <MapPin className="size-4" /> {t("home.gis")}
                      </a>
                    </Button>
                    <Button asChild size="sm" className="neon-glow flex-1">
                      <Link to="/clubs/$clubId" params={{ clubId: club.id }}>{t("home.book")}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
