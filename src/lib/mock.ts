/**
 * Deterministic mock data engine.
 *
 * Every number on every dashboard comes from here, seeded by a string key +
 * the selected date range, so filters genuinely change the data and the same
 * filter always shows the same numbers. `tick` (from useLiveTick) adds small
 * live jitter to "right now" metrics.
 *
 * When the real query layer lands, each exported function maps 1:1 to a
 * query — pages don't need to change shape.
 */

import type { DateRange } from "./date-range";
import { rangeDays, rangeKey } from "./date-range";

/* ---------------------------------------------------------------- seeding */

function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic uniform [0,1) for a string key. */
export function rand(key: string): number {
  return mulberry32(hashStr(key))();
}

/** Deterministic value in [lo, hi). */
export function randIn(key: string, lo: number, hi: number): number {
  return lo + rand(key) * (hi - lo);
}

/* ------------------------------------------------------------- geography */

export interface StateInfo {
  /** Must match the `name` in india-map-data.ts */
  name: string;
  /** Short display code for tables/chips. */
  code: string;
  /** Relative business weight — Qwipo is strongest in the South. */
  weight: number;
}

export const STATE_INFO: StateInfo[] = [
  { name: "Telangana", code: "TS", weight: 22 },
  { name: "Andhra Pradesh", code: "AP", weight: 18 },
  { name: "Karnataka", code: "KA", weight: 12 },
  { name: "Tamil Nadu", code: "TN", weight: 9 },
  { name: "Maharashtra", code: "MH", weight: 8 },
  { name: "Gujarat", code: "GJ", weight: 4 },
  { name: "Uttar Pradesh", code: "UP", weight: 3.5 },
  { name: "West Bengal", code: "WB", weight: 3 },
  { name: "Rajasthan", code: "RJ", weight: 2.5 },
  { name: "Madhya Pradesh", code: "MP", weight: 2.5 },
  { name: "Kerala", code: "KL", weight: 2.5 },
  { name: "Delhi", code: "DL", weight: 2.5 },
  { name: "Haryana", code: "HR", weight: 1.8 },
  { name: "Punjab", code: "PB", weight: 1.6 },
  { name: "Bihar", code: "BR", weight: 1.4 },
  { name: "Odisha", code: "OD", weight: 1.4 },
  { name: "Jharkhand", code: "JH", weight: 0.9 },
  { name: "Chhattisgarh", code: "CG", weight: 0.9 },
  { name: "Assam", code: "AS", weight: 0.8 },
  { name: "Uttarakhand", code: "UK", weight: 0.5 },
  { name: "Himachal Pradesh", code: "HP", weight: 0.35 },
  { name: "Goa", code: "GA", weight: 0.35 },
  { name: "Jammu and Kashmir", code: "JK", weight: 0.3 },
  { name: "Tripura", code: "TR", weight: 0.15 },
  { name: "Meghalaya", code: "ML", weight: 0.12 },
  { name: "Manipur", code: "MN", weight: 0.1 },
  { name: "Nagaland", code: "NL", weight: 0.08 },
  { name: "Puducherry", code: "PY", weight: 0.25 },
  { name: "Chandigarh", code: "CH", weight: 0.25 },
  { name: "Arunachal Pradesh", code: "AR", weight: 0.06 },
  { name: "Mizoram", code: "MZ", weight: 0.06 },
  { name: "Sikkim", code: "SK", weight: 0.06 },
  { name: "Ladakh", code: "LA", weight: 0.03 },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN", weight: 0.08 },
  { name: "Andaman and Nicobar Islands", code: "AN", weight: 0.03 },
  { name: "Lakshadweep", code: "LD", weight: 0.01 },
];

const TOTAL_WEIGHT = STATE_INFO.reduce((s, x) => s + x.weight, 0);

/** Cities per (major) state for drill-downs. */
export const STATE_CITIES: Record<string, string[]> = {
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad"],
  "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Tirupati", "Rajahmundry", "Nellore"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
  Delhi: ["New Delhi", "Dwarka", "Rohini", "Saket"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
};

const FALLBACK_CITIES = ["District HQ", "Zone A", "Zone B", "Zone C"];

export function citiesOf(state: string): string[] {
  return STATE_CITIES[state] ?? FALLBACK_CITIES;
}

/** Plausible pincodes for a state+index (stable). */
export function pincodeOf(state: string, i: number): string {
  const bases: Record<string, number> = {
    Telangana: 500001, "Andhra Pradesh": 520001, Karnataka: 560001,
    "Tamil Nadu": 600001, Maharashtra: 400001, Gujarat: 380001,
    "Uttar Pradesh": 226001, "West Bengal": 700001, Delhi: 110001,
    Kerala: 682001, Rajasthan: 302001, "Madhya Pradesh": 452001,
  };
  const base = bases[state] ?? 400001 + (hashStr(state) % 400000);
  return String(base + Math.floor(rand(`pin:${state}:${i}`) * 95) + i * 7);
}

/* -------------------------------------------------------------- helpers */

export interface NamedValue {
  name: string;
  value: number;
}

/**
 * Split a total across named parts using given weights, with deterministic
 * per-part wobble so splits differ between metrics.
 */
export function weightedSplit(
  key: string,
  total: number,
  parts: { name: string; weight: number }[],
): NamedValue[] {
  const wobbled = parts.map((p) => ({
    name: p.name,
    w: p.weight * randIn(`${key}:${p.name}`, 0.75, 1.3),
  }));
  const sum = wobbled.reduce((s, p) => s + p.w, 0);
  return wobbled.map((p) => ({ name: p.name, value: Math.round((total * p.w) / sum) }));
}

/** Split a total across all Indian states (sorted descending). */
export function stateSplit(key: string, total: number): NamedValue[] {
  return weightedSplit(key, total, STATE_INFO).sort((a, b) => b.value - a.value);
}

export function toRecord(list: NamedValue[]): Record<string, number> {
  return Object.fromEntries(list.map((x) => [x.name, x.value]));
}

/* ---------------------------------------------------------- time series */

export interface TrendPoint {
  /** Axis label (already formatted for the bucket size). */
  label: string;
  date: Date;
  [series: string]: string | number | Date;
}

type Bucket = "hour" | "day" | "week" | "month";

function bucketFor(range: DateRange): { bucket: Bucket; count: number } {
  const days = rangeDays(range);
  if (days <= 1) return { bucket: "hour", count: Math.max(new Date().getHours() + 1, 6) };
  if (days <= 31) return { bucket: "day", count: days };
  if (days <= 130) return { bucket: "week", count: Math.ceil(days / 7) };
  return { bucket: "month", count: Math.min(48, Math.ceil(days / 30)) };
}

function bucketLabel(bucket: Bucket, d: Date, hourIndex: number): string {
  switch (bucket) {
    case "hour": {
      const h = hourIndex % 24;
      const ampm = h < 12 ? "AM" : "PM";
      const disp = h % 12 === 0 ? 12 : h % 12;
      return `${disp} ${ampm}`;
    }
    case "day":
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    case "week":
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    case "month":
      return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
}

export interface SeriesSpec {
  /** Series (data key) name as it should appear in the chart. */
  name: string;
  /** Average per-DAY value for this metric. */
  dailyBase: number;
  /** Yearly growth factor, e.g. 0.6 = +60% YoY trend. Default 0.45. */
  growth?: number;
  /** 0..1 random noise amplitude. Default 0.18. */
  noise?: number;
}

/**
 * Deterministic multi-series trend for the range. Hourly for "today",
 * daily/weekly/monthly beyond that. Weekday + growth shaped.
 */
export function trend(key: string, range: DateRange, specs: SeriesSpec[]): TrendPoint[] {
  const { bucket, count } = bucketFor(range);
  const rk = rangeKey(range);
  const points: TrendPoint[] = [];
  const bucketDays = bucket === "hour" ? 1 / 24 : bucket === "day" ? 1 : bucket === "week" ? 7 : 30;

  for (let i = 0; i < count; i++) {
    const date =
      bucket === "hour"
        ? new Date(range.from.getTime() + i * 3600e3)
        : new Date(range.from.getTime() + i * bucketDays * 864e5);
    const point: TrendPoint = { label: bucketLabel(bucket, date, i), date };

    for (const s of specs) {
      const growth = s.growth ?? 0.45;
      const noise = s.noise ?? 0.18;
      // Position of this bucket in "years since launch" drives the growth curve.
      const yearsFromNow = (Date.now() - date.getTime()) / (365 * 864e5);
      const growthFactor = Math.pow(1 + growth, -yearsFromNow);
      // Weekly shape: B2B ordering dips on Sundays, peaks Mon/Tue.
      const dow = date.getDay();
      const weekShape = bucket === "hour" || bucket === "week" || bucket === "month"
        ? 1
        : dow === 0 ? 0.55 : dow === 1 || dow === 2 ? 1.15 : 1;
      // Hourly shape: business hours bell.
      const hourShape =
        bucket === "hour"
          ? Math.max(0.08, Math.sin(((i - 5) / 18) * Math.PI))
          : 1;
      const jitter = 1 + (rand(`${key}:${s.name}:${rk}:${i}`) - 0.5) * 2 * noise;
      const value = s.dailyBase * bucketDays * growthFactor * weekShape * hourShape * jitter;
      point[s.name] = Math.max(0, Math.round(value));
    }
    points.push(point);
  }
  return points;
}

/**
 * Period total for a metric: daily base scaled by the range with growth
 * damping for long ranges, plus deterministic wobble.
 */
export function totalFor(key: string, range: DateRange, dailyBase: number): number {
  const days = rangeDays(range);
  const rk = rangeKey(range);
  // For "today" scale by how much of the day has passed.
  const dayFraction =
    range.preset === "today"
      ? Math.max(0.05, (new Date().getHours() + 1) / 24)
      : 1;
  // Longer look-backs include older (smaller) days.
  const growthDamp = days > 60 ? 0.82 : days > 14 ? 0.93 : 1;
  const wobble = randIn(`${key}:${rk}`, 0.9, 1.1);
  return Math.round(dailyBase * days * dayFraction * growthDamp * wobble);
}

/** Previous-period comparison delta in % (deterministic). */
export function deltaFor(key: string, range: DateRange): number {
  const rk = rangeKey(range);
  return Math.round(randIn(`delta:${key}:${rk}`, -18, 32) * 10) / 10;
}

/** A live counter: baseline + smooth oscillation + per-tick jitter. */
export function liveValue(key: string, base: number, tick: number, amplitude = 0.12): number {
  const wave = Math.sin(tick / 3 + rand(key) * 10) * amplitude;
  const jitter = (rand(`${key}:${tick}`) - 0.5) * amplitude;
  return Math.max(0, Math.round(base * (1 + wave + jitter)));
}

/* ------------------------------------------------------- domain catalogs */

export const APPS = [
  "Buyer app (Android)",
  "Buyer app (iOS)",
  "Buyer web / WhatsApp",
  "Paytm mini app",
  "Sales app",
  "Seller store (web)",
] as const;

export const CHANNELS = ["ONDC seller network", "Qwipo 2.0 (JIT)", "WhatsApp store", "Paytm mini app"] as const;

export const ORDER_STATUSES = [
  "Placed",
  "Accepted",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export const CANCEL_REASONS = [
  "Out of stock at seller",
  "Retailer requested cancellation",
  "Credit limit exceeded",
  "Delivery not serviceable",
  "Price mismatch",
  "Duplicate order",
  "Seller SLA breach",
] as const;

export const RETAILER_SEGMENTS = ["Kirana / general", "Supermarket", "Pharmacy", "Hotel / restaurant", "Bakery / cafe", "Others"] as const;

export const VENDOR_TYPES = ["Wholesale distributor", "JIT vendor (2.0)", "Company / brand seller", "Super stockist"] as const;

export const CATEGORIES = [
  "Staples & grains",
  "Edible oils",
  "Snacks & biscuits",
  "Beverages",
  "Personal care",
  "Home care",
  "Dairy & bakery",
  "Spices & masala",
  "Baby care",
  "Confectionery",
] as const;

export const COMPANIES = ["ITC", "HUL", "Britannia", "Parle", "Nestlé", "Marico", "Dabur", "Colgate-Palmolive", "P&G", "Adani Wilmar"] as const;

export const BRANDS = [
  "Aashirvaad", "Sunfeast", "Bingo", "Surf Excel", "Dove", "Good Day", "Parle-G", "Maggi",
  "Saffola", "Parachute", "Real", "Vatika", "Colgate MaxFresh", "Ariel", "Fortune", "Tiger",
] as const;

export const DOWNLOAD_SOURCES = ["Play Store organic", "App Store", "Sales team assisted", "Referral", "WhatsApp campaign", "Paytm discovery", "Field marketing (QR)"] as const;

const SKU_NOUNS = ["Atta 5kg", "Sunflower Oil 1L", "Biscuits 120g", "Noodles 70g", "Detergent 1kg", "Shampoo 340ml", "Toothpaste 150g", "Tea 250g", "Rice 25kg", "Salt 1kg", "Soap 100g x4", "Cold Drink 750ml", "Chips 52g", "Honey 500g", "Ghee 1L"];

export function skuNameOf(i: number): string {
  const brand = BRANDS[i % BRANDS.length];
  const noun = SKU_NOUNS[Math.floor(rand(`skunoun:${i}`) * SKU_NOUNS.length)];
  return `${brand} ${noun}`;
}

const RETAILER_PREFIX = ["Sri", "New", "Royal", "Balaji", "Lakshmi", "Ganesh", "Venkateshwara", "Annapurna", "Metro", "City", "Star", "Om", "Shree", "Deccan", "Krishna"];
const RETAILER_SUFFIX = ["Kirana Store", "Super Market", "General Stores", "Traders", "Provision Store", "Mart", "Departmental Stores", "Enterprises", "Fancy Store", "Agencies"];

export function retailerNameOf(i: number): string {
  const a = RETAILER_PREFIX[Math.floor(rand(`rp:${i}`) * RETAILER_PREFIX.length)];
  const b = RETAILER_SUFFIX[Math.floor(rand(`rs:${i}`) * RETAILER_SUFFIX.length)];
  return `${a} ${b}`;
}

const VENDOR_NAMES = [
  "Sri Venkateshwara Agencies", "Deccan Distributors", "Bharat Wholesale Mart", "Annapurna Enterprises",
  "KLM Trading Co", "Southern Sales Corp", "Vijaya Marketing", "Nandi Agencies", "Krishna Traders",
  "Golconda Distributors", "Coastal Agencies", "Rayalaseema Wholesales", "Metro C&F", "Prime Stockists",
  "Everest Marketing", "Sunrise Distributors", "Godavari Agencies", "Charminar Traders", "Amaravati Sales", "Telugu Traders",
];

export function vendorNameOf(i: number): string {
  return VENDOR_NAMES[i % VENDOR_NAMES.length] + (i >= VENDOR_NAMES.length ? ` ${Math.floor(i / VENDOR_NAMES.length) + 1}` : "");
}
