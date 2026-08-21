import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import {
  bookings as seedBookings,
  clubs as seedClubs,
  payments as seedPayments,
  pcZones as seedZones,
  qrSessions as seedQr,
  seats as seedSeats,
  subscriptions as seedSubs,
  makeBookingCode,
  users,
  type Booking,
  type Club,
  type ClubStatus,
  type Payment,
  type PcZone,
  type Seat,
  type ZoneType,
  type User,
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
  seats: Seat[];
  allUsers: User[];
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
  addZone: (clubId: string, input: { name: string; type: ZoneType; pricePerHour: number; specs: string; seats: number }) => void;
  removeZone: (zoneId: string) => void;
  addSeats: (zoneId: string, count: number) => void;
  updateSeat: (seatId: string, patch: Partial<Seat>) => void;
  removeSeat: (seatId: string) => void;
  addClub: (input: { name: string; city: string; address: string; ownerId: string; fromPrice: number }) => Club;
  assignOwner: (clubId: string, ownerId: string) => void;
  setClubPlan: (clubId: string, plan: Club["plan"], feeKzt: number) => void;
  addOwner: (input: { name: string; email: string; phone: string; city: string }) => User;
  findBookingByCode: (code: string) => Booking | undefined;
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
  const [seats, setSeats] = useState<Seat[]>(seedSeats);
  const [allUsers, setAllUsers] = useState<User[]>(users);
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
      seats,
      allUsers,
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
      addZone: (clubId, input) => {
        const zoneId = id("z");
        const zone: PcZone = { id: zoneId, clubId, ...input };
        setZones((prev) => [...prev, zone]);
        setSeats((prev) => [
          ...prev,
          ...Array.from({ length: input.seats }, (_, i) => ({
            id: `${zoneId}-s${i + 1}`,
            zoneId,
            clubId,
            no: i + 1,
            label: `${input.type === "PS5" ? "PS" : "PC"}-${String(i + 1).padStart(2, "0")}`,
            specs: input.specs,
            status: "ok" as const,
          })),
        ]);
      },
      removeZone: (zoneId) => {
        setZones((prev) => prev.filter((z) => z.id !== zoneId));
        setSeats((prev) => prev.filter((s) => s.zoneId !== zoneId));
      },
      addSeats: (zoneId, count) => {
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) return;
        const existing = seats.filter((s) => s.zoneId === zoneId);
        const start = existing.reduce((m, s) => Math.max(m, s.no), 0);
        const added: Seat[] = Array.from({ length: count }, (_, i) => ({
          id: id("st"),
          zoneId,
          clubId: zone.clubId,
          no: start + i + 1,
          label: `${zone.type === "PS5" ? "PS" : "PC"}-${String(start + i + 1).padStart(2, "0")}`,
          specs: zone.specs,
          status: "ok",
        }));
        setSeats((prev) => [...prev, ...added]);
        setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, seats: existing.length + count } : z)));
      },
      updateSeat: (seatId, patch) => setSeats((prev) => prev.map((s) => (s.id === seatId ? { ...s, ...patch } : s))),
      removeSeat: (seatId) => {
        const target = seats.find((s) => s.id === seatId);
        setSeats((prev) => prev.filter((s) => s.id !== seatId));
        if (target) {
          setZones((prev) =>
            prev.map((z) => (z.id === target.zoneId ? { ...z, seats: Math.max(0, z.seats - 1) } : z)),
          );
        }
      },
      addClub: (input) => {
        const club: Club = {
          id: id("c"),
          name: input.name,
          city: input.city,
          address: input.address,
          rating: 0,
          reviews: 0,
          openFrom: "10:00",
          openTo: "02:00",
          fromPrice: input.fromPrice,
          cover: "linear-gradient(135deg, oklch(0.5 0.22 300), oklch(0.55 0.18 220))",
          mapX: 20 + Math.floor(Math.random() * 60),
          mapY: 20 + Math.floor(Math.random() * 60),
          ownerId: input.ownerId,
          plan: "Trial",
          trialEndsAt: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
          saasFeeKzt: 29000,
          terminals: 0,
          occupancy: 0,
          status: "trial",
          photos: [],
        };
        setClubs((prev) => [...prev, club]);
        return club;
      },
      assignOwner: (clubId, ownerId) =>
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, ownerId } : c))),
      setClubPlan: (clubId, plan, feeKzt) =>
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, plan, saasFeeKzt: feeKzt } : c))),
      addOwner: (input) => {
        const owner: User = {
          id: id("u"),
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: "owner",
          city: input.city,
          balanceKzt: 0,
          passHoursLeft: 0,
          avatarInitials: input.name.slice(0, 2).toUpperCase(),
        };
        setAllUsers((prev) => [...prev, owner]);
        return owner;
      },
      findBookingByCode: (code) =>
        bookings.find((b) => b.code.toUpperCase() === code.trim().toUpperCase()),
    }),
    [role, setRole, user, clubs, zones, seats, allUsers, bookings, subscriptions, qrSessions, payments, passHours, balance],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
