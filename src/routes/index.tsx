import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Cpu, Flame, MapPin, Search, Star, Users, Ticket } from "lucide-react";
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
      { name: "twitter:card", content: "summary" },
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

const is247 = (c: Club) => c.openFrom === "00:00" && c.openTo === "24:00";

const specTags = (specs: string) =>
  specs.split(/[·,|/]+/).map((x) => x.trim()).filter(Boolean).slice(0, 6);

function isTopHardware(c: Club) {
  const s = c.specs.toLowerCase();
  if (/rtx\s*(40|50)\d\d/.test(s)) return true;
  const hz = [...s.matchAll(/(\d{3})\s*hz/g)].some((m) => Number(m[1]) >= 240);
  const gb = [...s.matchAll(/(\d{2,3})\s*gb/g)].some((m) => Number(m[1]) >= 32);
  return hz || gb;
}

type FilterKey = "open" | "h24" | "top";

function HomePage() {
  const { clubs } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());

  const toggle = (k: FilterKey) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const active = clubs.filter((c) => c.status === "active");
  const filtered = active.filter((c) => {
    const q = query.trim().toLowerCase();
    const matches = !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
    if (!matches) return false;
    if (filters.has("open") && !isOpenNow(c)) return false;
    if (filters.has("h24") && !is247(c)) return false;
    if (filters.has("top") && !isTopHardware(c)) return false;
    return true;
  });
  const totalSeats = active.reduce((s, c) => s + c.totalSeats, 0);

  const chip = (on: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
      on
        ? "border-primary bg-primary/20 text-primary neon-glow"
        : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="size-3.5" /> {t("home.badge")}
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            {t("home.title1")} <span className="neon-text">{t("home.title2")}</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("home.subtitle")}</p>
          <Button asChild className="mt-5 neon-glow"><Link to="/passes"><Ticket className="size-4" />{t("passes.buy")}</Link></Button>
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

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("home.search")} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilters(new Set())} className={chip(filters.size === 0)}>{t("home.all")}</button>
          <button onClick={() => toggle("open")} className={chip(filters.has("open"))}>{t("home.openNow")}</button>
          <button onClick={() => toggle("h24")} className={chip(filters.has("h24"))}>{t("home.f247")}</button>
          <button onClick={() => toggle("top")} className={chip(filters.has("top"))}><Cpu className="mr-1 inline size-3" />{t("home.topHw")}</button>
        </div>
      </div>

      <section>
        <h2 className="font-display mb-4 text-xl font-bold">{t("home.listTitle")}</h2>
        {filtered.length === 0 ? (
          <p className="neon-panel p-8 text-center text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((club) => {
              const open = isOpenNow(club);
              const tags = specTags(club.specs || "");
              const go = () => navigate({ to: "/clubs/$clubId", params: { clubId: club.id } });
              return (
                <div
                  key={club.id}
                  role="link"
                  tabIndex={0}
                  onClick={go}
                  onKeyDown={(e) => { if (e.key === "Enter") go(); }}
                  className="neon-panel group flex cursor-pointer flex-col overflow-hidden transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="relative flex h-28 items-center justify-center" style={{ background: club.cover || undefined }}>
                    {!club.cover && <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20" />}
                    <span className="font-display relative text-5xl font-bold text-foreground/80 drop-shadow">
                      {club.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold backdrop-blur", open ? "bg-primary/80 text-primary-foreground" : "bg-background/80 text-muted-foreground")}>
                        {open ? t("home.openBadge") : t("home.closedBadge")}
                      </span>
                      {is247(club) && <span className="rounded-full bg-accent/80 px-2 py-0.5 text-[11px] font-bold text-accent-foreground backdrop-blur">24/7</span>}
                    </div>
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-accent backdrop-blur">
                      <Star className="size-3 fill-accent" /> {club.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary">{club.name}</h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{club.address || "—"} <span className="text-xs font-normal text-muted-foreground">· {club.city}</span></span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span><Clock className="mr-1 inline size-3" />{hoursLabel(club, t("home.open247"))}</span>
                      <span><Users className="mr-1 inline size-3" />{club.totalSeats} {t("home.seats")}</span>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs font-semibold text-primary">{t("home.bySub")}</p>
                    <div className="mt-auto flex gap-2 pt-4">
                      <Button asChild variant="secondary" size="sm" className="flex-1">
                        <a href={gisUrl(club)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <MapPin className="size-4" /> {t("home.gis")}
                        </a>
                      </Button>
                      <Button size="sm" className="neon-glow flex-1" onClick={(e) => { e.stopPropagation(); go(); }}>
                        {t("home.book")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
