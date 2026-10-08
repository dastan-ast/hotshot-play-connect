import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Clock, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { kzt, type Booking } from "@/lib/mock-db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const PLAYED_STATUSES: Booking["status"][] = ["active", "completed"];

export const fmtMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} ч ${m.toString().padStart(2, "0")} мин`;
};

type Period = "this" | "last" | "all";

const monthKey = (offset: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
};

export const inPeriod = (date: string, p: Period) =>
  p === "all" ? true : date.startsWith(monthKey(p === "this" ? 0 : -1));

export function AdminPayoutReport() {
  const { clubs, bookings, updateClub } = useStore();
  const [period, setPeriod] = useState<Period>("this");
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const rows = useMemo(
    () =>
      clubs
        .map((c) => {
          const list = bookings.filter(
            (b) => b.clubId === c.id && PLAYED_STATUSES.includes(b.status) && inPeriod(b.date, period),
          );
          const minutes = list.reduce((s, b) => s + b.hours * 60, 0);
          const rate = c.payoutRatePerHour ?? 600;
          return { club: c, list, minutes, rate, payout: Math.round((minutes / 60) * rate) };
        })
        .sort((a, b) => b.minutes - a.minutes),
    [clubs, bookings, period],
  );

  const totalMin = rows.reduce((s, r) => s + r.minutes, 0);
  const totalPay = rows.reduce((s, r) => s + r.payout, 0);

  const saveRate = async (clubId: string, name: string) => {
    const v = Number(editing[clubId]);
    if (!Number.isFinite(v) || v < 0) {
      toast.error("Введите корректную ставку");
      return;
    }
    if (!window.confirm(`Изменить ставку для «${name}» на ${kzt(v)} за час?`)) return;
    await updateClub(clubId, { payoutRatePerHour: Math.round(v) });
    setEditing((e) => {
      const n = { ...e };
      delete n[clubId];
      return n;
    });
    toast.success("Ставка утверждена");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["this", "Этот месяц"],
          ["last", "Прошлый месяц"],
          ["all", "Всё время"],
        ] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={period === k ? "default" : "outline"} onClick={() => setPeriod(k)}>
            {l}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="neon-panel p-4">
          <Clock className="size-5 text-primary" />
          <p className="font-display mt-2 text-xl font-bold">{fmtMinutes(totalMin)}</p>
          <p className="text-xs text-muted-foreground">Сыграно во всех клубах ({totalMin} мин)</p>
        </div>
        <div className="neon-panel p-4">
          <Wallet className="size-5 text-primary" />
          <p className="font-display mt-2 text-xl font-bold">{kzt(totalPay)}</p>
          <p className="text-xs text-muted-foreground">Итого к выплате владельцам</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Учитываются только подтверждённые визиты (персонал нажал «Зашёл»). Нажмите на клуб, чтобы увидеть все сессии.
      </p>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.club.id} className="neon-panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => setOpen(open === r.club.id ? null : r.club.id)}
              >
                {open === r.club.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.club.city} · {r.list.length} визитов · {fmtMinutes(r.minutes)}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={editing[r.club.id] ?? String(r.rate)}
                  onChange={(e) => setEditing((s) => ({ ...s, [r.club.id]: e.target.value }))}
                />
                <span className="text-xs text-muted-foreground">₸/ч</span>
                {editing[r.club.id] !== undefined && Number(editing[r.club.id]) !== r.rate && (
                  <Button size="sm" onClick={() => saveRate(r.club.id, r.club.name)}>
                    Утвердить
                  </Button>
                )}
              </div>
              <Badge className="text-sm">{kzt(r.payout)}</Badge>
            </div>
            {open === r.club.id && (
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {r.list.length === 0 && <p className="text-muted-foreground">Нет подтверждённых сессий за период</p>}
                {r.list.map((b) => (
                  <div key={b.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {b.date} {b.startTime} · {b.playerName} · {b.code}
                    </span>
                    <span className="text-muted-foreground">
                      {b.hours * 60} мин · {kzt(b.hours * r.rate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
