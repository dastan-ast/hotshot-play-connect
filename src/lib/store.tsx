import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import {
  SUBSCRIPTION_PLANS,
  bookings as seedBookings,
  clubs as seedClubs,
  makeBookingCode,
  payments as seedPayments,
  reviews as seedReviews,
  todayStr,
  userSubscriptions as seedSubs,
  users as seedUsers,
  type Booking,
  type Club,
  type ClubStatus,
  type Payment,
  type PaymentMethod,
  type Review,
  type User,
  type UserSubscription,
} from "./mock-db";

export type BookError = "noSub" | "notEnoughHours" | "dailyCap";

interface Store {
  clubs: Club[];
  allUsers: User[];
  bookings: Booking[];
  subscriptions: UserSubscription[];
  reviews: Review[];
  payments: Payment[];
  activeSubFor: (userId: string) => UserSubscription | undefined;
  usedHoursOn: (userId: string, date: string) => number;
  buySubscription: (planId: string, method: PaymentMethod) => void;
  bookSlot: (input: {
    clubId: string;
    date: string;
    startTime: string;
    hours: number;
  }) => { ok: true; booking: Booking } | { ok: false; error: BookError };
  cancelBooking: (bookingId: string) => void;
  checkInBooking: (bookingId: string) => void;
  completeBooking: (bookingId: string) => void;
  addReview: (clubId: string, rating: number, text: string) => void;
  setClubStatus: (clubId: string, status: ClubStatus) => void;
  removeClub: (clubId: string) => void;
  updateClub: (clubId: string, patch: Partial<Club>) => void;
  findBookingByCode: (code: string) => Booking | undefined;
  userName: (userId: string) => string;
}

const StoreCtx = createContext<Store | null>(null);

const id = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [clubs, setClubs] = useState<Club[]>(seedClubs);
  const [allUsers] = useState<User[]>(seedUsers);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>(seedSubs);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [payments, setPayments] = useState<Payment[]>(seedPayments);

  const value = useMemo<Store>(() => {
    const activeSubFor = (userId: string) =>
      subscriptions.find((s) => s.userId === userId && s.status === "active" && s.validUntil >= todayStr());

    const usedHoursOn = (userId: string, date: string) =>
      bookings
        .filter((b) => b.userId === userId && b.date === date && (b.status === "upcoming" || b.status === "active"))
        .reduce((sum, b) => sum + b.hours, 0);

    return {
      clubs,
      allUsers,
      bookings,
      subscriptions,
      reviews,
      payments,
      activeSubFor,
      usedHoursOn,
      buySubscription: (planId, method) => {
        if (!authUser) return;
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
        if (!plan) return;
        const validUntil = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
        const sub: UserSubscription = {
          id: id("s"),
          userId: authUser.id,
          planId,
          hoursTotal: plan.hours,
          hoursLeft: plan.hours,
          startedAt: todayStr(),
          validUntil,
          status: "active",
        };
        setSubscriptions((prev) => [
          sub,
          ...prev.map((s) => (s.userId === authUser.id && s.status === "active" ? { ...s, status: "expired" as const } : s)),
        ]);
        setPayments((prev) => [
          {
            id: id("p"),
            userId: authUser.id,
            kind: "subscription",
            label: `plan.${planId}.name`,
            amountKzt: plan.priceKzt,
            method,
            createdAt: now(),
            status: "succeeded",
          },
          ...prev,
        ]);
      },
      bookSlot: (input) => {
        if (!authUser) return { ok: false as const, error: "noSub" as const };
        const sub = activeSubFor(authUser.id);
        if (!sub) return { ok: false as const, error: "noSub" as const };
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub.planId);
        const cap = plan?.dailyCap ?? 5;
        if (sub.hoursLeft !== null && input.hours > sub.hoursLeft) {
          return { ok: false as const, error: "notEnoughHours" as const };
        }
        if (usedHoursOn(authUser.id, input.date) + input.hours > cap) {
          return { ok: false as const, error: "dailyCap" as const };
        }
        const booking: Booking = {
          id: id("b"),
          code: makeBookingCode(),
          userId: authUser.id,
          clubId: input.clubId,
          date: input.date,
          startTime: input.startTime,
          hours: input.hours,
          status: "upcoming",
        };
        setBookings((prev) => [booking, ...prev]);
        if (sub.hoursLeft !== null) {
          setSubscriptions((prev) =>
            prev.map((s) => (s.id === sub.id ? { ...s, hoursLeft: Math.max(0, (s.hoursLeft ?? 0) - input.hours) } : s)),
          );
        }
        return { ok: true as const, booking };
      },
      cancelBooking: (bookingId) => {
        const target = bookings.find((b) => b.id === bookingId);
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)));
        if (target && target.status === "upcoming") {
          setSubscriptions((prev) =>
            prev.map((s) =>
              s.userId === target.userId && s.status === "active" && s.hoursLeft !== null
                ? { ...s, hoursLeft: (s.hoursLeft ?? 0) + target.hours }
                : s,
            ),
          );
        }
      },
      checkInBooking: (bookingId) =>
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "active" } : b))),
      completeBooking: (bookingId) =>
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "completed" } : b))),
      addReview: (clubId, rating, text) => {
        if (!authUser) return;
        const review: Review = { id: id("r"), clubId, userId: authUser.id, rating, text, createdAt: now() };
        setReviews((prev) => [review, ...prev]);
        setClubs((prev) =>
          prev.map((c) => {
            if (c.id !== clubId) return c;
            const count = c.reviewsCount + 1;
            const avg = (c.rating * c.reviewsCount + rating) / count;
            return { ...c, reviewsCount: count, rating: Math.round(avg * 10) / 10 };
          }),
        );
      },
      setClubStatus: (clubId, status) =>
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, status } : c))),
      removeClub: (clubId) => setClubs((prev) => prev.filter((c) => c.id !== clubId)),
      updateClub: (clubId, patch) =>
        setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, ...patch } : c))),
      findBookingByCode: (code) =>
        bookings.find((b) => b.code.toUpperCase() === code.trim().toUpperCase()),
      userName: (userId) => allUsers.find((u) => u.id === userId)?.name ?? "—",
    };
  }, [authUser, clubs, allUsers, bookings, subscriptions, reviews, payments]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
