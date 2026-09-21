import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Lucide icon that becomes the illustration. */
  icon: LucideIcon;
  /** Short, friendly title — e.g. "No SKUs yet". */
  title: string;
  /** One-sentence subtitle that tells the user what they're seeing. */
  description: string;
  /** Optional CTA — usually a <Button> the user can click to start. */
  action?: ReactNode;
  /**
   * Tighter padding + smaller illustration for in-line / dense
   * placements (e.g., a sidebar widget, a card inside a card). The
   * default is the substantial "fills the empty page" sizing that
   * mirrors <ErrorState size="lg">.
   */
  compact?: boolean;
}

/**
 * Reusable inception-day empty state. Used across every list/table page
 * in both the admin and seller modules so the "no data yet" experience
 * reads consistently and substantially: a soft gradient illustration,
 * a clear title, a one-sentence subtitle, and an optional CTA — all
 * centered inside a generous container that fills its parent's width
 * AND height.
 *
 * Sized to match <ErrorState size="lg"> so the two primitives feel
 * like part of the same family — the empty page in the gallery and the
 * empty page when a real list is empty look like siblings.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={
        compact
          ? "flex flex-col items-center justify-center text-center w-full py-10 px-6"
          : "flex flex-col items-center justify-center text-center w-full h-full min-h-[420px] py-12 px-6"
      }
    >
      {/* Illustration: soft gradient halo + tile with the page's icon */}
      <div className={compact ? "relative mb-5" : "relative mb-7"}>
        <div
          className={
            compact
              ? "absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl blur-2xl opacity-60"
              : "absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl blur-3xl opacity-60"
          }
        />
        <div
          className={
            compact
              ? "w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 ring-1 ring-gray-200 shadow-sm flex items-center justify-center"
              : "w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 ring-1 ring-gray-200 shadow-sm flex items-center justify-center"
          }
        >
          <Icon
            className={
              compact ? "h-10 w-10 text-blue-500" : "h-14 w-14 text-blue-500"
            }
            strokeWidth={1.5}
          />
        </div>
      </div>

      <h3
        className={
          compact
            ? "text-base font-semibold text-gray-900 mb-1"
            : "text-2xl font-semibold text-gray-900 mb-2"
        }
      >
        {title}
      </h3>
      <p
        className={
          compact
            ? "text-sm text-gray-500 max-w-md leading-relaxed"
            : "text-base text-gray-500 max-w-xl leading-relaxed"
        }
      >
        {description}
      </p>

      {action && <div className={compact ? "mt-5" : "mt-7"}>{action}</div>}
    </div>
  );
}
