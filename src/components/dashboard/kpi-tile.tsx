import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";
import { signedPct } from "@/lib/format";

export type KpiToneName = "primary" | "success" | "warning" | "danger" | "accent" | "neutral" | "cyan";

const TONES: Record<KpiToneName, string> = {
  primary: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  accent: "bg-purple-50 text-purple-600",
  cyan: "bg-cyan-50 text-cyan-600",
  neutral: "bg-gray-100 text-gray-600",
};

export interface KpiTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Period-over-period % change. */
  delta?: number;
  /** Set false when a rising number is bad (uninstalls, cancellations). */
  positiveIsGood?: boolean;
  /** One-line context under the number ("vs previous 30 days"). */
  sub?: string;
  tone?: KpiToneName;
  /** Tiny inline trend, ~12–24 values. */
  spark?: number[];
  className?: string;
}

/** Design-system "KPI tile" pattern: icon + small label → big number → chips. */
export function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  positiveIsGood = true,
  sub,
  tone = "primary",
  spark,
  className,
}: KpiTileProps) {
  const deltaGood = delta !== undefined && (positiveIsGood ? delta >= 0 : delta <= 0);
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", TONES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-gray-600 truncate">{label}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-2xl font-semibold text-gray-900 tabular-nums truncate">
              {value}
            </div>
            <div className="mt-1 flex items-center gap-1.5 min-h-4">
              {delta !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    deltaGood ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {delta >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {signedPct(delta)}
                </span>
              )}
              {sub && <span className="text-[11px] text-gray-500 truncate">{sub}</span>}
            </div>
          </div>
          {spark && spark.length > 1 && <Sparkline values={spark} good={deltaGood} />}
        </div>
      </CardContent>
    </Card>
  );
}

function Sparkline({ values, good }: { values: number[]; good: boolean }) {
  const w = 72;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={good ? "#16A34A" : "#DC2626"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
