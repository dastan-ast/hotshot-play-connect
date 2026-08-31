/**
 * HotShot Play — domain types + subscription catalogue.
 * All entities (clubs, bookings, subscriptions, reviews, payments) live in the
 * database; this module only holds shared types, the plan catalogue and helpers.
 */

export type Role = "player" | "clubAdmin" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  city: string;
  avatarInitials: string;
  /** Club assignment for clubAdmin accounts. */
  clubId?: string;
}

export type ClubStatus = "pending" | "active" | "rejected" | "suspended";

export interface Club {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  openFrom: string;
  openTo: string;
  pricePerHour: number;
  totalSeats: number;
  specs: string;
  description: string;
  cover: string;
  ownerId: string;
  status: ClubStatus;
  appliedAt?: string;
  rejectionReason?: string;
}

export interface Review {
  id: string;
  clubId: string;
  userId: string;
  authorName: string;
  rating: number; // 1..5
  text: string;
  createdAt: string;
}

export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface Booking {
  id: string;
  /** short human-readable check-in code, e.g. HP-4821 */
  code: string;
  userId: string;
  clubId: string;
  playerName: string;
  playerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  hours: number;
  status: BookingStatus;
}

/** Player subscription tier (clubs use the software for free). */
export interface SubscriptionPlan {
  id: string;
  /** purchased hours; null = unlimited within the month */
  hours: number | null;
  priceKzt: number;
  /** max hours spendable per day */
  dailyCap: number;
  highlight?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  hoursTotal: number | null;
  hoursLeft: number | null;
  startedAt: string;
  validUntil: string;
  status: "active" | "expired";
}

export type PaymentMethod =
  | "Kaspi QR"
  | "Kaspi Pay"
  | "Apple Pay"
  | "Google Pay"
  | "Visa / Mastercard"
  | "Paybox"
  | "Robokassa";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Kaspi QR",
  "Kaspi Pay",
  "Apple Pay",
  "Google Pay",
  "Visa / Mastercard",
  "Paybox",
  "Robokassa",
];

export interface Payment {
  id: string;
  userId: string;
  kind: "subscription";
  label: string;
  amountKzt: number;
  method: PaymentMethod;
  createdAt: string;
  status: "succeeded" | "pending" | "failed";
}

// ---------------- Subscription catalogue ----------------

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "sub3", hours: 11, priceKzt: 7990, dailyCap: 5 },
  { id: "sub5", hours: 19, priceKzt: 13990, dailyCap: 5 },
  { id: "sub30", hours: 27, priceKzt: 18990, dailyCap: 5, highlight: true },
  { id: "subInf", hours: null, priceKzt: 39999, dailyCap: 5 },
];

/** Generates a short booking code such as "HP-8412". */
export const makeBookingCode = () => `HP-${Math.floor(1000 + Math.random() * 8999)}`;

export const kzt = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

/** Today's date as YYYY-MM-DD (local). */
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Last 7 calendar days (oldest → newest) as YYYY-MM-DD. */
export const last7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
