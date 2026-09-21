/**
 * Canonical 8-color chart palette from the design system (§2.1) plus shared
 * recharts styling bound to theme tokens so charts read in light AND dark.
 */
import type { CSSProperties } from "react";

export const CHART_PALETTE = [
  "#2563EB", // 1. Primary — blue 600
  "#16A34A", // 2. Success — green 600
  "#D97706", // 3. Warning — amber 600
  "#DC2626", // 4. Danger — red 600
  "#9333EA", // 5. Accent — purple 600
  "#0891B2", // 6. Cyan 600
  "#C026D3", // 7. Fuchsia 600
  "#4F46E5", // 8. Indigo 600
] as const;

/** Semantic-keyed colors — a series for "Delivered" is green everywhere. */
export const SEMANTIC = {
  primary: "#2563EB",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  accent: "#9333EA",
  cyan: "#0891B2",
  fuchsia: "#C026D3",
  indigo: "#4F46E5",
} as const;

export const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
};

export const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

export const GRID_STROKE = "var(--border)";
