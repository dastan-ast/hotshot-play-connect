import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CreditCard, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { SUBSCRIPTION_PLANS, kzt, type BookingStatus } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RequireRole } from "@/components/RequireRole";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — HotShot Play" },
      { name: "description", content: "Мои брони, абонемент и платежи HotShot Play." },
      { property: "og:title", content: "HotShot Play — профиль игрока" },
      { property: "og:description", content: "Брони, коды входа и абонемент." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilePage,
});

const STATUS_VARIANT: Record<BookingStatus, "default" | "secondary" | "outline" | "destructive"> = {
  upcoming: "default",
  active: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

function ProfilePage() {
  return (
    <RequireRole roles={["player"]}>
      <ProfileInner />
    </RequireRole>
  );
}

function ProfileInner() {
  const { user } = useAuth();
  const { activeSubFor, bookings, payments, clubs, cancelBooking } = useStore();
  const { t } = useI18n();

  if (!user) return null;
  const sub = activeSubFor(user.id);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub?.planId);
  const myBookings = bookings.filter((b) => b.userId === user.id);
  const myPayments = payments.filter((p) => p.userId === user.id);
  const clubName = (id: string) => clubs.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/20 text-lg font-extrabold neon-glow">
          {user.avatarInitials}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.phone}
          </p>
        </div>
      </div>

      {/* Subscription card */}
      <section className="neon-panel p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Ticket className="size-4 text-primary" /> {t("profile.sub")}
        </div>
        {sub ? (
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-primary">{t(`plan.${sub.planId}.name`)}</p>
              <p className="text-xs text-muted-foreground">
                {t("profile.validUntil")} {sub.validUntil}
                {plan ? ` · ${t("profile.cap", { cap: plan.dailyCap })}` : ""}
              </p>
            </div>
            {sub.hoursLeft !== null && sub.hoursTotal !== null ? (
              <div className="min-w-56 flex-1">
                <p className="text-sm">
                  <b className="font-display text-xl text-accent">{sub.hoursLeft}</b>{" "}
                  <span className="text-xs text-muted-foreground">
                    {t("profile.hoursLeft")} / {sub.hoursTotal}
                  </span>
                </p>
                <Progress value={(sub.hoursLeft / sub.hoursTotal) * 100} className="mt-2" />
              </div>
            ) : (
              <p className="font-display text-xl font-bold text-accent">∞ {t("profile.unlimited")}</p>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("profile.noSub")}</p>
            <Button asChild className="neon-glow">
              <Link to="/passes">{t("profile.choose")}</Link>
            </Button>
          </div>
        )}
      </section>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">
            <CalendarClock className="size-4" /> {t("profile.tab.bookings")}
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="size-4" /> {t("profile.tab.payments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4 space-y-3">
          {myBookings.length === 0 && (
            <p className="neon-panel p-8 text-center text-sm text-muted-foreground">
              {t("profile.emptyBookings")}
            </p>
          )}
          {myBookings.map((b) => (
            <div
              key={b.id}
              className="neon-panel flex flex-wrap items-center gap-4 p-4"
            >
              <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("profile.code")}</p>
                <p className="font-display text-sm font-extrabold tracking-widest text-primary">{b.code}</p>
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{clubName(b.clubId)}</p>
                <p className="text-xs text-muted-foreground">
                  {b.date} · {b.startTime} · {b.hours}
                  {t("club.hShort")}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[b.status]}>{t(`booking.${b.status}`)}</Badge>
              {b.status === "upcoming" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    cancelBooking(b.id);
                    toast.success(t("profile.cancelledToast"));
                  }}
                >
                  {t("profile.cancel")}
                </Button>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-3">
          {myPayments.length === 0 && (
            <p className="neon-panel p-8 text-center text-sm text-muted-foreground">
              {t("profile.emptyPayments")}
            </p>
          )}
          {myPayments.map((p) => (
            <div key={p.id} className="neon-panel flex flex-wrap items-center gap-4 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/10">
                <CreditCard className="size-5 text-accent" />
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{p.label.startsWith("plan.") ? t(p.label) : p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {p.createdAt} · {p.method}
                </p>
              </div>
              <p className="font-display font-bold text-accent">{kzt(p.amountKzt)}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
