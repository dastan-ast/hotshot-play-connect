/**
 * HotShot Play — mock database schemas + seed data.
 * Tables: users, clubs, pc_zones, bookings, subscriptions, qr_sessions, payments
 */

export type Role = "player" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  city: string;
  balanceKzt: number;
  passHoursLeft: number;
  avatarInitials: string;
}

export type ZoneType = "Standard" | "VIP" | "PS5" | "Bootcamp";

export interface PcZone {
  id: string;
  clubId: string;
  name: string;
  type: ZoneType;
  seats: number;
  pricePerHour: number;
  specs: string;
}

export type ClubStatus = "pending" | "active" | "trial" | "suspended";

export interface Club {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviews: number;
  openFrom: string;
  openTo: string;
  fromPrice: number;
  cover: string;
  /** relative coords on the mock map, 0..100 */
  mapX: number;
  mapY: number;
  ownerId: string;
  plan: "Trial" | "Start" | "Pro" | "Network";
  trialEndsAt: string;
  saasFeeKzt: number;
  terminals: number;
  occupancy: number;
  status: ClubStatus;
  appliedAt?: string;
  photos: string[];
}

export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface Booking {
  id: string;
  /** short human-readable check-in code, e.g. HP-4821 */
  code: string;
  userId: string;
  clubId: string;
  zoneId: string;
  seatNo: number;
  date: string;
  startTime: string;
  hours: number;
  totalKzt: number;
  paidWith: PaymentMethod;
  status: BookingStatus;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  scope: "universal" | "club";
  clubId?: string;
  hours: number;
  hoursLeft: number;
  priceKzt: number;
  validUntil: string;
  status: "active" | "expired";
}

export interface QrSession {
  id: string;
  userId: string;
  clubId: string;
  bookingId?: string;
  code: string;
  startedAt: string;
  endedAt?: string;
  minutes: number;
  status: "open" | "closed";
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
  kind: "topup" | "booking" | "pass" | "saas";
  label: string;
  amountKzt: number;
  method: PaymentMethod;
  createdAt: string;
  status: "succeeded" | "pending" | "failed";
}

export const users: User[] = [
  {
    id: "u1",
    name: "Dastan Y.",
    email: "dastan@hotshot.kz",
    phone: "+7 701 555 12 12",
    role: "player",
    city: "Astana",
    balanceKzt: 12400,
    passHoursLeft: 18,
    avatarInitials: "DY",
  },
  {
    id: "u2",
    name: "Aigerim K.",
    email: "owner@cyberdome.kz",
    phone: "+7 702 118 44 90",
    role: "owner",
    city: "Astana",
    balanceKzt: 0,
    passHoursLeft: 0,
    avatarInitials: "AK",
  },
  {
    id: "u3",
    name: "Platform Admin",
    email: "admin@hotshot.play",
    phone: "+7 700 000 00 01",
    role: "admin",
    city: "Astana",
    balanceKzt: 0,
    passHoursLeft: 0,
    avatarInitials: "HS",
  },
];

export const clubs: Club[] = [
  {
    id: "c1",
    name: "CyberDome Astana",
    city: "Astana",
    address: "пр. Мангилик Ел 55, Astana",
    rating: 4.8,
    reviews: 412,
    openFrom: "10:00",
    openTo: "06:00",
    fromPrice: 700,
    cover: "linear-gradient(135deg, oklch(0.5 0.22 300), oklch(0.55 0.18 220))",
    mapX: 32,
    mapY: 38,
    ownerId: "u2",
    plan: "Pro",
    trialEndsAt: "2026-05-01",
    saasFeeKzt: 89000,
    terminals: 60,
    occupancy: 78,
    status: "active",
    photos: [],
  },
  {
    id: "c2",
    name: "NeonBox Esports",
    city: "Astana",
    address: "ул. Кабанбай батыра 13, Astana",
    rating: 4.6,
    reviews: 288,
    openFrom: "24/7",
    openTo: "24/7",
    fromPrice: 550,
    cover: "linear-gradient(135deg, oklch(0.52 0.2 200), oklch(0.45 0.2 320))",
    mapX: 58,
    mapY: 24,
    ownerId: "u2",
    plan: "Trial",
    trialEndsAt: "2026-08-28",
    saasFeeKzt: 49000,
    terminals: 32,
    occupancy: 54,
    status: "trial",
    photos: [],
  },
  {
    id: "c3",
    name: "Pixel Arena",
    city: "Astana",
    address: "ул. Сыганак 29, Astana",
    rating: 4.4,
    reviews: 173,
    openFrom: "09:00",
    openTo: "03:00",
    fromPrice: 500,
    cover: "linear-gradient(135deg, oklch(0.5 0.19 160), oklch(0.48 0.2 270))",
    mapX: 72,
    mapY: 62,
    ownerId: "u2",
    plan: "Start",
    trialEndsAt: "2026-02-11",
    saasFeeKzt: 29000,
    terminals: 24,
    occupancy: 41,
    status: "active",
    photos: [],
  },
  {
    id: "c4",
    name: "Colizeum Left Bank",
    city: "Astana",
    address: "ул. Достык 5, Astana",
    rating: 4.7,
    reviews: 502,
    openFrom: "24/7",
    openTo: "24/7",
    fromPrice: 800,
    cover: "linear-gradient(135deg, oklch(0.48 0.22 350), oklch(0.5 0.2 250))",
    mapX: 20,
    mapY: 70,
    ownerId: "u2",
    plan: "Network",
    trialEndsAt: "2025-12-01",
    saasFeeKzt: 149000,
    terminals: 90,
    occupancy: 86,
    status: "active",
    photos: [],
  },
  {
    id: "c5",
    name: "GG Station Karaganda",
    city: "Karaganda",
    address: "пр. Бухар Жырау 41, Karaganda",
    rating: 0,
    reviews: 0,
    openFrom: "10:00",
    openTo: "02:00",
    fromPrice: 450,
    cover: "linear-gradient(135deg, oklch(0.5 0.2 30), oklch(0.45 0.2 300))",
    mapX: 44,
    mapY: 50,
    ownerId: "u2",
    plan: "Trial",
    trialEndsAt: "2026-09-05",
    saasFeeKzt: 29000,
    terminals: 28,
    occupancy: 0,
    status: "pending",
    appliedAt: "2026-08-18",
    photos: [],
  },
  {
    id: "c6",
    name: "Nomad Cyber Almaty",
    city: "Almaty",
    address: "ул. Абая 150, Almaty",
    rating: 0,
    reviews: 0,
    openFrom: "24/7",
    openTo: "24/7",
    fromPrice: 900,
    cover: "linear-gradient(135deg, oklch(0.5 0.22 260), oklch(0.5 0.18 180))",
    mapX: 66,
    mapY: 80,
    ownerId: "u2",
    plan: "Trial",
    trialEndsAt: "2026-09-12",
    saasFeeKzt: 49000,
    terminals: 45,
    occupancy: 0,
    status: "pending",
    appliedAt: "2026-08-20",
    photos: [],
  },
];

/** Demo credentials for the mocked multi-role login. */
export const demoAccounts = [
  { email: "dastan@hotshot.kz", password: "player", role: "player" as Role },
  { email: "owner@cyberdome.kz", password: "owner", role: "owner" as Role },
  { email: "admin@hotshot.play", password: "admin", role: "admin" as Role },
];

export const pcZones: PcZone[] = [
  { id: "z1", clubId: "c1", name: "Standard Hall", type: "Standard", seats: 24, pricePerHour: 700, specs: "i5-12400F · RTX 3060 · 165Hz" },
  { id: "z2", clubId: "c1", name: "VIP Lounge", type: "VIP", seats: 10, pricePerHour: 1400, specs: "i7-13700K · RTX 4070 · 240Hz" },
  { id: "z3", clubId: "c1", name: "PS5 Room", type: "PS5", seats: 6, pricePerHour: 1800, specs: "PS5 · 65\" OLED · DualSense" },
  { id: "z4", clubId: "c2", name: "Main Floor", type: "Standard", seats: 20, pricePerHour: 550, specs: "i5-11400F · RTX 3050 · 144Hz" },
  { id: "z5", clubId: "c2", name: "Bootcamp", type: "Bootcamp", seats: 5, pricePerHour: 1600, specs: "5 seats · coach board · private" },
  { id: "z6", clubId: "c3", name: "Standard", type: "Standard", seats: 18, pricePerHour: 500, specs: "Ryzen 5 · RTX 3060 · 144Hz" },
  { id: "z7", clubId: "c3", name: "VIP", type: "VIP", seats: 6, pricePerHour: 1200, specs: "Ryzen 7 · RTX 4070 · 240Hz" },
  { id: "z8", clubId: "c4", name: "Arena Standard", type: "Standard", seats: 40, pricePerHour: 800, specs: "i5-13400F · RTX 4060 · 180Hz" },
  { id: "z9", clubId: "c4", name: "VIP Cabins", type: "VIP", seats: 12, pricePerHour: 1700, specs: "i9 · RTX 4080 · 360Hz" },
  { id: "z10", clubId: "c4", name: "PS5 Zone", type: "PS5", seats: 8, pricePerHour: 1900, specs: "PS5 Pro · 75\" 4K120" },
];

export const bookings: Booking[] = [
  {
    id: "b1",
    code: "HP-4821",
    userId: "u1",
    clubId: "c1",
    zoneId: "z2",
    seatNo: 4,
    date: "2026-08-21",
    startTime: "19:00",
    hours: 3,
    totalKzt: 4200,
    paidWith: "Kaspi QR",
    status: "upcoming",
  },
  {
    id: "b2",
    code: "HP-1097",
    userId: "u1",
    clubId: "c3",
    zoneId: "z6",
    seatNo: 11,
    date: "2026-08-14",
    startTime: "14:00",
    hours: 2,
    totalKzt: 1000,
    paidWith: "HotShot Pass" as unknown as PaymentMethod,
    status: "completed",
  },
];

/** Generates a short booking code such as "HP-8412". */
export const makeBookingCode = () => `HP-${Math.floor(1000 + Math.random() * 8999)}`;

export const subscriptions: Subscription[] = [
  {
    id: "s1",
    userId: "u1",
    name: "HotShot Pass 20h",
    scope: "universal",
    hours: 20,
    hoursLeft: 18,
    priceKzt: 11900,
    validUntil: "2026-09-20",
    status: "active",
  },
];

export const qrSessions: QrSession[] = [
  {
    id: "q1",
    userId: "u1",
    clubId: "c3",
    bookingId: "b2",
    code: "HSP-8842-KZ",
    startedAt: "2026-08-14 14:02",
    endedAt: "2026-08-14 16:04",
    minutes: 122,
    status: "closed",
  },
];

export const payments: Payment[] = [
  { id: "p1", userId: "u1", kind: "pass", label: "HotShot Pass 20h", amountKzt: 11900, method: "Kaspi Pay", createdAt: "2026-08-10 12:31", status: "succeeded" },
  { id: "p2", userId: "u1", kind: "booking", label: "CyberDome · VIP · 3h", amountKzt: 4200, method: "Kaspi QR", createdAt: "2026-08-19 09:14", status: "succeeded" },
  { id: "p3", userId: "u1", kind: "topup", label: "Wallet top-up", amountKzt: 10000, method: "Apple Pay", createdAt: "2026-08-01 21:02", status: "succeeded" },
  { id: "p4", userId: "u2", kind: "saas", label: "CyberDome · Pro plan (Aug)", amountKzt: 89000, method: "Visa / Mastercard", createdAt: "2026-08-01 00:05", status: "succeeded" },
];

export interface PassPlan {
  id: string;
  name: string;
  scope: "universal" | "club";
  hours: number;
  priceKzt: number;
  perks: string[];
  highlight?: boolean;
}

export const passPlans: PassPlan[] = [
  { id: "pp1", name: "Trial Pass", scope: "universal", hours: 5, priceKzt: 3490, perks: ["Any partner club", "Valid 14 days", "Standard zones"] },
  { id: "pp2", name: "HotShot Pass 20h", scope: "universal", hours: 20, priceKzt: 11900, perks: ["Any partner club", "Valid 30 days", "Standard + VIP", "Priority seats"], highlight: true },
  { id: "pp3", name: "Pro Pass 50h", scope: "universal", hours: 50, priceKzt: 26900, perks: ["Any partner club", "Valid 60 days", "All zones incl. PS5", "2 guest hours"] },
  { id: "pp4", name: "CyberDome Club 10h", scope: "club", hours: 10, priceKzt: 5900, perks: ["CyberDome Astana only", "Valid 30 days", "Standard zone"] },
];

export const saasPlans = [
  { id: "sp1", name: "Start", terminals: "up to 25 terminals", priceKzt: 29000, perks: ["Bookings & map listing", "Basic analytics", "QR check-in"] },
  { id: "sp2", name: "Pro", terminals: "26–70 terminals", priceKzt: 89000, perks: ["Everything in Start", "Universal Pass payouts", "Revenue & occupancy analytics", "Promo tools"], highlight: true },
  { id: "sp3", name: "Network", terminals: "70+ / multi-branch", priceKzt: 149000, perks: ["Everything in Pro", "Multi-branch dashboard", "API + priority support"] },
];

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
