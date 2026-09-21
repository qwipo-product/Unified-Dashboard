/**
 * Number formatting per the design system's voice rules: Indian digit
 * grouping for currency, compact lakh/crore forms on tiles.
 */

const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numIn = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function inr(n: number): string {
  return inrFull.format(Math.round(n));
}

/** ₹845 → ₹84.5K → ₹12.4L → ₹1.2Cr */
export function inrCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(abs >= 1e9 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

/** Counts: 845 → 12.4K → 1.2L → 3.4Cr (Indian system above a lakh). */
export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(abs >= 1e8 ? 1 : 2)}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return numIn.format(Math.round(n));
}

export function num(n: number): string {
  return numIn.format(Math.round(n));
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

/** Signed delta for KPI chips: +12.4% / −3.2% */
export function signedPct(n: number): string {
  const s = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${s}${Math.abs(n).toFixed(1)}%`;
}

export function minutes(n: number): string {
  if (n >= 60) {
    const h = Math.floor(n / 60);
    const m = Math.round(n % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(n)}m`;
}
