import type { ReactNode } from "react";
import { cn } from "./utils";

export type StatusTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

interface StatusBadgeProps {
  tone: StatusTone;
  /** Tighter pill — used inside dense table rows. */
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}

/**
 * Single source of truth for status pills (Active / Pending / Rejected /
 * Connected etc.) across both the admin and seller modules. Each tone is
 * mapped to the CANONICAL Tailwind palette so the same status renders the
 * same colour everywhere — no more per-page drift between the same status
 * in two different shades of green.
 *
 * Tones:
 *   success → green   (Active, Approved, Connected, Delivered)
 *   danger  → red     (Inactive, Rejected, Failed, Out of Stock)
 *   warning → amber   (Pending, Low Stock, Awaiting)
 *   info    → blue    (New, In Progress, Brand sync)
 *   neutral → gray    (Draft, Inactive-light, Unknown)
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
};

export function StatusBadge({
  tone,
  size = "md",
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
