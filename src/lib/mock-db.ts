/**
 * HotShot Play — mock database schemas + seed data.
 * MVP model: general halls only (no zones), subscription-hour bookings,
 * code-based check-in. Tables: users, clubs, reviews, bookings,
 * subscription_plans, user_subscriptions, payments.
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
  /** Real geo coordinates for the map. */
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

// ---------------- Users (5 demo roles) ----------------

export const users: User[] = [
  {
    id: "u1",
    name: "Dastan Y.",
    email: "dastan@hotshot.kz",
    phone: "+7 701 555 12 12",
    role: "player",
    city: "Astana",
    avatarInitials: "DY",
  },
  {
    id: "u5",
    name: "Aruzhan M.",
    email: "aruzhan@hotshot.kz",
    phone: "+7 707 222 33 44",
    role: "player",
    city: "Astana",
    avatarInitials: "AM",
  },
  {
    id: "u4",
    name: "Erlan S.",
    email: "staff@cyberdome.kz",
    phone: "+7 701 900 80 70",
    role: "clubAdmin",
    city: "Astana",
    avatarInitials: "ES",
    clubId: "c1",
  },
  {
    id: "u2",
    name: "Aigerim K.",
    email: "owner@cyberdome.kz",
    phone: "+7 702 118 44 90",
    role: "owner",
    city: "Astana",
    avatarInitials: "AK",
  },
  {
    id: "u3",
    name: "Platform Admin",
    email: "admin@hotshot.play",
    phone: "+7 700 000 00 01",
    role: "admin",
    city: "Astana",
    avatarInitials: "HS",
  },
];

/** Demo credentials for the mocked multi-role login. */
export const demoAccounts = [
  { email: "dastan@hotshot.kz", password: "player", role: "player" as Role },
  { email: "staff@cyberdome.kz", password: "staff", role: "clubAdmin" as Role },
  { email: "owner@cyberdome.kz", password: "owner", role: "owner" as Role },
  { email: "admin@hotshot.play", password: "admin", role: "admin" as Role },
];

// ---------------- Clubs (Astana, real coordinates) ----------------

export const clubs: Club[] = [
  {
    id: "c1",
    name: "CyberDome Astana",
    city: "Astana",
    address: "пр. Мангилик Ел 55",
    phone: "+7 7172 55 01 01",
    lat: 51.0905,
    lng: 71.3982,
    rating: 4.8,
    reviewsCount: 412,
    openFrom: "10:00",
    openTo: "06:00",
    pricePerHour: 700,
    totalSeats: 60,
    specs: "i5-12400F · RTX 4060 · 165Hz",
    description:
      "Флагманский киберклуб на левом берегу: 60 машин, турнирная зона и кафе.",
    cover: "linear-gradient(135deg, oklch(0.5 0.22 300), oklch(0.55 0.18 220))",
    ownerId: "u2",
    status: "active",
  },
  {
    id: "c2",
    name: "NeonBox Esports",
    city: "Astana",
    address: "ул. Кабанбай батыра 13",
    phone: "+7 7172 13 13 13",
    lat: 51.1283,
    lng: 71.4306,
    rating: 4.6,
    reviewsCount: 288,
    openFrom: "00:00",
    openTo: "24:00",
    pricePerHour: 550,
    totalSeats: 32,
    specs: "i5-11400F · RTX 3050 · 144Hz",
    description: "Круглосуточный клуб в центре с быстрым интернетом и стрим-кабиной.",
    cover: "linear-gradient(135deg, oklch(0.52 0.2 200), oklch(0.45 0.2 320))",
    ownerId: "u2",
    status: "active",
  },
  {
    id: "c3",
    name: "Pixel Arena",
    city: "Astana",
    address: "ул. Сыганак 29",
    phone: "+7 7172 29 29 29",
    lat: 51.1235,
    lng: 71.4045,
    rating: 4.4,
    reviewsCount: 173,
    openFrom: "09:00",
    openTo: "03:00",
    pricePerHour: 500,
    totalSeats: 24,
    specs: "Ryzen 5 5600 · RTX 3060 · 144Hz",
    description: "Уютный зал рядом с Байтереком — низкие цены и тихие утренние часы.",
    cover: "linear-gradient(135deg, oklch(0.5 0.19 160), oklch(0.48 0.2 270))",
    ownerId: "u2",
    status: "active",
  },
  {
    id: "c4",
    name: "Colizeum Left Bank",
    city: "Astana",
    address: "ул. Достык 5",
    phone: "+7 7172 05 05 05",
    lat: 51.1185,
    lng: 71.4668,
    rating: 4.7,
    reviewsCount: 502,
    openFrom: "00:00",
    openTo: "24:00",
    pricePerHour: 800,
    totalSeats: 90,
    specs: "i5-13400F · RTX 4060 Ti · 180Hz",
    description: "Крупнейший зал сети: 90 мест, киберспортивная сцена и дисконт ночью.",
    cover: "linear-gradient(135deg, oklch(0.48 0.22 350), oklch(0.5 0.2 250))",
    ownerId: "u2",
    status: "active",
  },
  {
    id: "c5",
    name: "GG Station",
    city: "Astana",
    address: "пр. Тауелсиздик 21",
    phone: "+7 7172 21 21 21",
    lat: 51.1432,
    lng: 71.4193,
    rating: 0,
    reviewsCount: 0,
    openFrom: "10:00",
    openTo: "02:00",
    pricePerHour: 450,
    totalSeats: 28,
    specs: "Ryzen 5 · RTX 3050 · 144Hz",
    description: "Новый клуб, заявка на подключение к платформе.",
    cover: "linear-gradient(135deg, oklch(0.5 0.2 30), oklch(0.45 0.2 300))",
    ownerId: "u2",
    status: "pending",
    appliedAt: "2026-08-18",
  },
  {
    id: "c6",
    name: "Nomad Cyber",
    city: "Astana",
    address: "ул. Туран 18",
    phone: "+7 7172 18 18 18",
    lat: 51.1045,
    lng: 71.4415,
    rating: 0,
    reviewsCount: 0,
    openFrom: "00:00",
    openTo: "24:00",
    pricePerHour: 600,
    totalSeats: 45,
    specs: "i5-12400F · RTX 3060 · 165Hz",
    description: "Заявка от нового круглосуточного клуба на набережной.",
    cover: "linear-gradient(135deg, oklch(0.5 0.22 260), oklch(0.5 0.18 180))",
    ownerId: "u2",
    status: "pending",
    appliedAt: "2026-08-20",
  },
];

// ---------------- Reviews ----------------

export const reviews: Review[] = [
  { id: "r1", clubId: "c1", userId: "u1", rating: 5, text: "Топовые машины, ноль задержек. Ресепшен принимает код за секунды.", createdAt: "2026-08-15 21:40" },
  { id: "r2", clubId: "c1", userId: "u5", rating: 4, text: "Всё отлично, но вечером в пятницу шумно.", createdAt: "2026-08-12 18:02" },
  { id: "r3", clubId: "c2", userId: "u5", rating: 5, text: "Работают 24/7 — спасли перед турниром.", createdAt: "2026-08-10 03:12" },
  { id: "r4", clubId: "c3", userId: "u1", rating: 4, text: "Дёшево и спокойно, идеально для утренних каток.", createdAt: "2026-08-08 11:25" },
  { id: "r5", clubId: "c4", userId: "u5", rating: 5, text: "Огромный зал, всегда есть свободные места.", createdAt: "2026-08-05 22:48" },
];

// ---------------- Subscriptions ----------------

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "sub3", hours: 11, priceKzt: 7990, dailyCap: 5 },
  { id: "sub5", hours: 19, priceKzt: 13990, dailyCap: 5 },
  { id: "sub30", hours: 27, priceKzt: 18990, dailyCap: 5, highlight: true },
  { id: "subInf", hours: null, priceKzt: 39999, dailyCap: 5 },
];

export const userSubscriptions: UserSubscription[] = [
  {
    id: "s1",
    userId: "u1",
    planId: "sub30",
    hoursTotal: 30,
    hoursLeft: 22,
    startedAt: "2026-08-16",
    validUntil: "2026-09-15",
    status: "active",
  },
];

// ---------------- Bookings ----------------

/** Generates a short booking code such as "HP-8412". */
export const makeBookingCode = () => `HP-${Math.floor(1000 + Math.random() * 8999)}`;

export const bookings: Booking[] = [
  { id: "b1", code: "HP-4821", userId: "u1", clubId: "c1", date: "2026-08-26", startTime: "19:00", hours: 3, status: "upcoming" },
  { id: "b2", code: "HP-1097", userId: "u5", clubId: "c1", date: "2026-08-26", startTime: "18:00", hours: 2, status: "upcoming" },
  { id: "b3", code: "HP-3358", userId: "u1", clubId: "c2", date: "2026-08-26", startTime: "20:00", hours: 2, status: "active" },
  { id: "b4", code: "HP-7743", userId: "u1", clubId: "c3", date: "2026-08-14", startTime: "14:00", hours: 2, status: "completed" },
  { id: "b5", code: "HP-2210", userId: "u5", clubId: "c4", date: "2026-08-20", startTime: "16:00", hours: 4, status: "completed" },
];

// ---------------- Payments ----------------

export const payments: Payment[] = [
  { id: "p1", userId: "u1", kind: "subscription", label: "30 Hours Package", amountKzt: 19999, method: "Kaspi Pay", createdAt: "2026-08-16 12:31", status: "succeeded" },
  { id: "p2", userId: "u5", kind: "subscription", label: "5 Hours Package", amountKzt: 2699, method: "Apple Pay", createdAt: "2026-08-18 09:14", status: "succeeded" },
];

// ---------------- Analytics series (mock) ----------------

export const revenueSeries = [
  { day: "Mon", revenue: 210000, bookings: 62 },
  { day: "Tue", revenue: 184000, bookings: 55 },
  { day: "Wed", revenue: 235000, bookings: 71 },
  { day: "Thu", revenue: 268000, bookings: 80 },
  { day: "Fri", revenue: 412000, bookings: 124 },
  { day: "Sat", revenue: 486000, bookings: 141 },
  { day: "Sun", revenue: 398000, bookings: 118 },
];

export const kzt = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

/** Today's date as YYYY-MM-DD (local). */
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
