/**
 * Date-range filtering shared by every dashboard. A range is always a concrete
 * from/to pair plus the preset that produced it, so the mock engine (and later
 * the real query layer) only ever sees dates.
 */

export type RangePreset =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "1y"
  | "all"
  | "custom";

export interface DateRange {
  preset: RangePreset;
  from: Date;
  to: Date;
}

/** Platform launch — the floor for the "All time" preset. */
const LAUNCH_DATE = new Date(2022, 3, 1);

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export function makeRange(preset: RangePreset, from?: Date, to?: Date): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { preset, from: startOfDay(now), to: now };
    case "7d":
      return { preset, from: startOfDay(new Date(now.getTime() - 6 * 864e5)), to: now };
    case "30d":
      return { preset, from: startOfDay(new Date(now.getTime() - 29 * 864e5)), to: now };
    case "90d":
      return { preset, from: startOfDay(new Date(now.getTime() - 89 * 864e5)), to: now };
    case "1y":
      return { preset, from: startOfDay(new Date(now.getTime() - 364 * 864e5)), to: now };
    case "all":
      return { preset, from: LAUNCH_DATE, to: now };
    case "custom":
      return {
        preset,
        from: startOfDay(from ?? new Date(now.getTime() - 6 * 864e5)),
        to: to ?? now,
      };
  }
}

export const RANGE_PRESETS: { preset: RangePreset; label: string }[] = [
  { preset: "today", label: "Today" },
  { preset: "7d", label: "7D" },
  { preset: "30d", label: "30D" },
  { preset: "90d", label: "90D" },
  { preset: "1y", label: "1Y" },
  { preset: "all", label: "All" },
];

/** Whole days covered by the range (minimum 1). */
export function rangeDays(range: DateRange): number {
  return Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 864e5));
}

export function rangeLabel(range: DateRange): string {
  switch (range.preset) {
    case "today":
      return "Today";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "1y":
      return "Last 12 months";
    case "all":
      return "All time";
    case "custom": {
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      return `${fmt(range.from)} – ${fmt(range.to)}`;
    }
  }
}

/** Stable string identity for seeding + memo keys. */
export function rangeKey(range: DateRange): string {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return `${range.preset}:${day(range.from)}:${day(range.to)}`;
}
