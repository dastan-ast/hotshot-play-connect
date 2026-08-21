import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import {
  bookings as seedBookings,
  clubs as seedClubs,
  payments as seedPayments,
  pcZones as seedZones,
  qrSessions as seedQr,
  subscriptions as seedSubs,
  makeBookingCode,
  users,
  type Booking,
  type Club,
  type ClubStatus,
  type Payment,
  type PcZone,
  type PaymentMethod,
  type QrSession,
  type Role,
  type Subscription,
} from "./mock-db";

interface Store {
  role: Role;
  setRole: (r: Role) => void;
  user: (typeof users)[number];
  clubs: Club[];
  zones: PcZone[];
  bookings: Booking[];
  subscriptions: Subscription[];
  qrSessions: QrSession[];
  payments: Payment[];
  passHours: number;
  balance: number;
  addBooking: (b: Omit<Booking, "id" | "code">) => Booking;
  checkInBooking: (bookingId: string) => void;
  buyPass: (input: { name: string; scope: "universal" | "club"; clubId?: string; hours: number; priceKzt: number; method: PaymentMethod }) => void;
  topUp: (amount: number, method: PaymentMethod) => void;
  paySaas: (clubId: string, plan: Club["plan"], amount: number, method: PaymentMethod) => void;
  startSession: (clubId: string, bookingId?: string) => QrSession;
  stopSession: (sessionId: string) => void;
  updateClub: (clubId: string, patch: Partial<Club>) => void;
  updateZone: (zoneId: string, patch: Partial<PcZone>) => void;
  setClubStatus: (clubId: string, status: ClubStatus) => void;
}

const StoreCtx = createContext<Store | null>(null);

const id = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user: authUser, loginAs } = useAuth();
  const role: Role = authUser?.role ?? "player";
  const setRole = loginAs;
  const [clubs, setClubs] = useState<Club[]>(seedClubs);
  const [zones, setZones] = useState<PcZone[]>(seedZones);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(seedSubs);
  const [qrSessions, setQrSessions] = useState<QrSession[]>(seedQr);
  const [payments, setPayments] = useState<Payment[]>(seedPayments);
  const [passHours, setPassHours] = useState(18);
  const [balance, setBalance] = useState(12400);

  const user = authUser ?? users.find((u) => u.role === role) ?? users[0]!;

  const value = useMemo<Store>(
    () => ({
      role,
      setRole,
      user,
      clubs,
      zones,
      bookings,
      subscriptions,
      qrSessions,
      payments,
      passHours,
      balance,
      addBooking: (b) => {
        const booking: Booking = { ...b, id: id("b"), code: makeBookingCode() };
        setBookings((prev) => [booking, ...prev]);
        if (String(b.paidWith) === "HotShot Pass") {
          setPassHours((h) => Math.max(0, h - b.hours));
          setSubscriptions((prev) =>
            prev.map((s, i) => (i === 0 ? { ...s, hoursLeft: Math.max(0, s.hoursLeft - b.hours) } : s)),
          );
        } else {
          setPayments((prev) => [
            {
              id: id("p"),
              userId: "u1",
              kind: "booking",
              label: `${clubs.find((c) => c.id === b.clubId)?.name} · seat ${b.seatNo} · ${b.hours}h`,
              amountKzt: b.totalKzt,
              method: b.paidWith,
              createdAt: now(),
              status: "succeeded",
            },
            ...prev,
          ]);
        }
        return booking;
      },
      checkInBooking: (bookingId) =>
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "active" } : b))),
      buyPass: ({ name, scope, clubId, hours, priceKzt, method }) => {
        setSubscriptions((prev) => [
          {
            id: id("s"),
            userId: "u1",
            name,
            scope,
            ...(clubId ? { clubId } : {}),
            hours,
            hoursLeft: hours,
            priceKzt,
            validUntil: "2026-10-01",
            status: "active",
          },
          ...prev,
        ]);
        setPassHours((h) => h + hours);
        setPayments((prev) => [
          { id: id("p"), userId: "u1", kind: "pass", label: name, amountKzt: priceKzt, method, createdAt: now(), status: "succeeded" },
          ...prev,
        ]);
      },
      topUp: (amount, method) => {
        setBalance((b) => b + amount);
        setPayments((prev) => [
          { id: id("p"), userId: "u1", kind: "topup", label: "Wallet top-up", amountKzt: amount, method, createdAt: now(), status: "succeeded" },
          ...prev,
        ]);
      },
      paySaas: (clubId, plan, amount, method) => {
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, plan, saasFeeKzt: amount } : c)));
        setPayments((prev) => [
          {
            id: id("p"),
            userId: "u2",
            kind: "saas",
            label: `${clubs.find((c) => c.id === clubId)?.name} · ${plan} plan`,
            amountKzt: amount,
            method,
            createdAt: now(),
            status: "succeeded",
          },
          ...prev,
        ]);
      },
      startSession: (clubId, bookingId) => {
        const session: QrSession = {
          id: id("q"),
          userId: "u1",
          clubId,
          ...(bookingId ? { bookingId } : {}),
          code: `HSP-${Math.floor(1000 + Math.random() * 8999)}-KZ`,
          startedAt: now(),
          minutes: 0,
          status: "open",
        };
        setQrSessions((prev) => [session, ...prev]);
        if (bookingId) {
          setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "active" } : b)));
        }
        return session;
      },
      stopSession: (sessionId) => {
        setQrSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, status: "closed", endedAt: now(), minutes: s.minutes || 60 } : s,
          ),
        );
        setBookings((prev) => prev.map((b) => (b.status === "active" ? { ...b, status: "completed" } : b)));
      },
      updateClub: (clubId, patch) => setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, ...patch } : c))),
      updateZone: (zoneId, patch) => setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...patch } : z))),
      setClubStatus: (clubId, status) =>
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, status } : c))),
    }),
    [role, setRole, user, clubs, zones, bookings, subscriptions, qrSessions, payments, passHours, balance],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
