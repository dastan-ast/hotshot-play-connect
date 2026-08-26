import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  MapPin,
  Phone,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { SUBSCRIPTION_PLANS, kzt, todayStr, type Booking, type Club } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/clubs/$clubId")({
  head: () => ({
    meta: [
      { title: "Клуб — HotShot Play" },
      { name: "description", content: "Бронирование игровых мест, отзывы и цены клуба." },
      { property: "og:title", content: "HotShot Play — бронирование клуба" },
      { property: "og:description", content: "Выберите дату и время, оплатите часами абонемента." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ClubPage,
});

function dateValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function ClubPage() {
  const { clubId } = Route.useParams();
  const { clubs, reviews, userName } = useStore();
  const { t } = useI18n();
  const club = clubs.find((c) => c.id === clubId);

  if (!club || club.status !== "active") {
    return (
      <div className="neon-panel mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">{t("club.notfound")}</h1>
        <Button asChild className="mt-4">
          <Link to="/">{t("club.back")}</Link>
        </Button>
      </div>
    );
  }

  const clubReviews = reviews.filter((r) => r.clubId === club.id);
  const is247 = club.openFrom === "00:00" && club.openTo === "24:00";

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("club.back")}
      </Link>

      {/* Club header */}
      <div className="neon-panel overflow-hidden">
        <div className="h-36 sm:h-48" style={{ background: club.cover }} />
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{club.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {club.address}, {club.city}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <Stars value={club.rating} />
                <b>{club.rating.toFixed(1)}</b>
                <span className="text-muted-foreground">· {club.reviewsCount} {t("club.reviews")}</span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" /> {is247 ? t("home.open247") : `${club.openFrom}–${club.openTo}`}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" /> {club.totalSeats} {t("club.seats")}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-4" /> {club.phone}
              </span>
            </div>
          </div>
          <div className="neon-panel cyan-glow !rounded-2xl px-5 py-4 text-center">
            <p className="font-display text-2xl font-bold text-accent">{kzt(club.pricePerHour)}</p>
            <p className="text-xs text-muted-foreground">{t("club.perHour")}</p>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("club.about")}</p>
          <p className="mt-1 text-sm">{club.description}</p>
          <p className="mt-2 font-mono text-xs text-accent">{club.specs}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Reviews */}
        <section className="neon-panel p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">{t("club.reviewTitle")}</h2>
          <ReviewForm club={club} />
          <div className="mt-5 space-y-4">
            {clubReviews.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("club.noReviews")}</p>
            )}
            {clubReviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-xs font-bold">
                      {userName(r.userId).slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{userName(r.userId)}</p>
                      <p className="text-[11px] text-muted-foreground">{r.createdAt}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} size="size-3.5" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Booking */}
        <BookingCard club={club} />
      </div>
    </div>
  );
}

function ReviewForm({ club }: { club: Club }) {
  const { addReview } = useStore();
  const { user, role } = useAuth();
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  if (!user || role !== "player") {
    return <p className="mt-3 text-sm text-muted-foreground">{t("club.reviewSignin")}</p>;
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
      <p className="text-sm font-semibold">{t("club.reviewAdd")}</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setRating(i)} aria-label={`${i}`}>
            <Star className={cn("size-6 transition-colors", i <= rating ? "fill-accent text-accent" : "text-muted-foreground/40 hover:text-accent")} />
          </button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("club.reviewPh")}
        className="mt-3"
        rows={3}
      />
      <Button
        className="mt-3"
        disabled={!text.trim()}
        onClick={() => {
          addReview(club.id, rating, text.trim());
          setText("");
          setRating(5);
          toast.success(t("club.reviewDone"));
        }}
      >
        {t("club.reviewSend")}
      </Button>
    </div>
  );
}

function BookingCard({ club }: { club: Club }) {
  const { activeSubFor, usedHoursOn, bookSlot } = useStore();
  const { user, role } = useAuth();
  const { t, locale } = useI18n();
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState<string | null>(null);
  const [hours, setHours] = useState(2);
  const [done, setDone] = useState<Booking | null>(null);

  const isPlayer = !!user && role === "player";
  const sub = isPlayer && user ? activeSubFor(user.id) : undefined;
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub?.planId);
  const cap = plan?.dailyCap ?? 5;

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          value: dateValue(d),
          label: new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }).format(d),
        };
      }),
    [locale],
  );

  const slots = useMemo(() => {
    const startHour = club.openFrom === "00:00" ? 9 : Number.parseInt(club.openFrom, 10);
    const nowHour = new Date().getHours();
    return Array.from({ length: 24 - startHour }, (_, i) => startHour + i)
      .filter((h) => date !== todayStr() || h > nowHour)
      .map((h) => `${String(h).padStart(2, "0")}:00`);
  }, [club.openFrom, date]);

  const usedToday = isPlayer && user ? usedHoursOn(user.id, date) : 0;
  const maxHours = Math.max(1, Math.min(5, cap - usedToday));
  const hoursLeftAfter = sub && sub.hoursLeft !== null ? sub.hoursLeft - hours : null;

  const book = () => {
    if (!time) return;
    const res = bookSlot({ clubId: club.id, date, startTime: time, hours });
    if (res.ok) {
      setDone(res.booking);
    } else if (res.error === "dailyCap") {
      toast.error(t("club.err.cap", { cap }));
    } else if (res.error === "notEnoughHours") {
      toast.error(t("club.err.hours"));
    } else {
      toast.error(t("club.err.noSub"));
    }
  };

  return (
    <aside className="neon-panel h-fit p-5 sm:p-6 lg:sticky lg:top-24">
      {done ? (
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 cyan-glow">
            <Check className="size-7 text-accent" />
          </span>
          <h2 className="font-display mt-4 text-xl font-bold">{t("club.confirmTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("club.confirmHint")}</p>
          <div className="neon-panel neon-glow mt-5 !rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("club.code")}</p>
            <p className="font-display neon-text mt-1 text-4xl font-extrabold tracking-widest">{done.code}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {club.name} · {done.date} · {done.startTime} · {done.hours}
              {t("club.hShort")}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(done.code);
                toast.success(t("club.copied"));
              }}
            >
              <Copy className="size-4" /> {t("club.copy")}
            </Button>
            <Button asChild>
              <Link to="/profile">{t("club.myBookings")}</Link>
            </Button>
            <Button variant="ghost" onClick={() => setDone(null)}>
              {t("club.bookAnother")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-display flex items-center gap-2 text-lg font-bold">
            <Ticket className="size-5 text-primary" /> {t("club.book.title")}
          </h2>

          {!isPlayer ? (
            <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              {t("club.signinToBook")}
              <Button asChild className="mt-3 w-full">
                <Link to="/auth">{t("auth.signin")}</Link>
              </Button>
            </div>
          ) : !sub ? (
            <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              {t("club.noSub")}
              <Button asChild className="mt-3 w-full neon-glow">
                <Link to="/passes">{t("club.buySub")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs">
                <span className="font-semibold text-accent">
                  {t(`plan.${sub.planId}.name`)} · {sub.hoursLeft === null ? "∞" : sub.hoursLeft} {t("club.subLeft")}
                </span>
                <span className="text-muted-foreground">{t("club.capNote", { cap })}</span>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("club.date")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {days.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDate(d.value)}
                      className={cn(
                        "rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-medium capitalize transition-all",
                        date === d.value && "border-primary/60 text-primary neon-glow",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("club.time")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTime(s)}
                      className={cn(
                        "rounded-lg border border-border bg-card/60 px-2.5 py-1.5 font-mono text-xs transition-all",
                        time === s && "border-primary/60 text-primary neon-glow",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("club.duration")}
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: maxHours }, (_, i) => i + 1).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      className={cn(
                        "flex-1 rounded-lg border border-border bg-card/60 py-2 text-sm font-semibold transition-all",
                        hours === h && "border-primary/60 text-primary neon-glow",
                      )}
                    >
                      {h}
                      {t("club.hShort")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">
                  {hours}
                  {t("club.hShort")} · {date} {time ?? ""}
                </span>
                {hoursLeftAfter !== null && (
                  <span className="text-xs text-muted-foreground">
                    → {hoursLeftAfter}
                    {t("club.hShort")} {t("club.subLeft")}
                  </span>
                )}
              </div>

              <Button className="w-full neon-glow" size="lg" disabled={!time} onClick={book}>
                {t("club.bookBtn")}
              </Button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
