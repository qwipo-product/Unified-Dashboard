import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./ui/utils";

interface ErrorStateProps {
  /** Lucide icon shown in the gradient tile. */
  icon: LucideIcon;
  /** Loud heading — "404. Page Not Found", "Network Error", etc. */
  title: string;
  /**
   * Short paragraph explaining what happened and what the user can
   * do about it. Keep it under two sentences.
   */
  description: string;
  /**
   * Optional small "code" pill — e.g. "404", "500", "ERR_NETWORK".
   * Shown above the title so the screen reads as an error and not just
   * an empty state.
   */
  code?: string;
  /**
   * Tone — controls the gradient + icon colour. Default `"danger"`.
   *   danger  → red    (4xx, 5xx, generic error)
   *   warning → amber  (rate limit, retry)
   *   info    → blue   (maintenance, redirect, no permission)
   *   neutral → gray   (offline, unknown)
   */
  tone?: "danger" | "warning" | "info" | "neutral";
  /** Optional CTA — usually a Button (Reload / Go home / Contact support). */
  action?: ReactNode;
  /** Tighter padding for use inside a Card. */
  compact?: boolean;
  /**
   * Visual size. `"default"` is sized for inline use inside cards and
   * page bodies. `"lg"` bumps the illustration + typography for hero /
   * full-page error pages and the Error Screens demo gallery, where the
   * primitive sits inside a tall, wide container and would look cramped
   * at default size.
   */
  size?: "default" | "lg";
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<ErrorStateProps["tone"]>, {
  blur: string;
  tile: string;
  icon: string;
  code: string;
}> = {
  danger: {
    blur: "from-red-100 via-orange-100 to-pink-100",
    tile: "from-red-50 via-white to-orange-50 ring-red-100",
    icon: "text-red-500",
    code: "bg-red-50 text-red-700 ring-red-200",
  },
  warning: {
    blur: "from-amber-100 via-orange-100 to-yellow-100",
    tile: "from-amber-50 via-white to-yellow-50 ring-amber-100",
    icon: "text-amber-500",
    code: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  info: {
    blur: "from-blue-100 via-indigo-100 to-purple-100",
    tile: "from-blue-50 via-white to-indigo-50 ring-blue-100",
    icon: "text-blue-500",
    code: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  neutral: {
    blur: "from-gray-100 via-slate-100 to-zinc-100",
    tile: "from-gray-50 via-white to-slate-50 ring-gray-200",
    icon: "text-gray-500",
    code: "bg-gray-100 text-gray-700 ring-gray-200",
  },
};

/**
 * Reusable error / 4xx / 5xx state. Pairs with the existing EmptyState
 * primitive (same hierarchy: gradient illustration tile, heading,
 * subtitle, optional CTA) but with tone-specific colours and an
 * optional code pill so an "error" reads visually different from an
 * "empty inbox".
 *
 * The Error Screens demo page uses this to render every supported
 * error variant (404, 500, network, forbidden, maintenance, …).
 */
export function ErrorState({
  icon: Icon,
  title,
  description,
  code,
  tone = "danger",
  action,
  compact = false,
  size = "default",
  className,
}: ErrorStateProps) {
  const tones = TONE_CLASSES[tone];
  const isLg = size === "lg";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center w-full h-full",
        compact ? "py-10 px-6" : isLg ? "py-12 px-6" : "py-16 px-6",
        className,
      )}
    >
      <div className={cn("relative", isLg ? "mb-7" : "mb-5")}>
        <div
          className={cn(
            "absolute inset-0 -z-10 bg-gradient-to-br rounded-3xl opacity-60",
            isLg ? "blur-3xl" : "blur-2xl",
            tones.blur,
          )}
        />
        <div
          className={cn(
            "rounded-2xl bg-gradient-to-br ring-1 shadow-sm flex items-center justify-center",
            isLg ? "w-28 h-28" : "w-20 h-20",
            tones.tile,
          )}
        >
          <Icon
            className={cn(isLg ? "h-14 w-14" : "h-10 w-10", tones.icon)}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {code && (
        <span
          className={cn(
            "inline-flex items-center rounded-full ring-1 ring-inset uppercase tracking-wider font-semibold mb-3",
            isLg ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]",
            tones.code,
          )}
        >
          {code}
        </span>
      )}

      <h3
        className={cn(
          "font-semibold text-gray-900 mb-2",
          isLg ? "text-3xl" : "text-xl",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-gray-500 leading-relaxed",
          isLg ? "text-base max-w-xl" : "text-sm max-w-md",
        )}
      >
        {description}
      </p>

      {action && <div className={cn(isLg ? "mt-7" : "mt-5")}>{action}</div>}
    </div>
  );
}
