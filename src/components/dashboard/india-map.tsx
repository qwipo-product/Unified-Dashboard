import { useMemo, useRef, useState } from "react";
import { INDIA_MAP_VIEWBOX, INDIA_STATES } from "@/lib/india-map-data";
import { cn } from "@/components/ui/utils";

interface IndiaMapProps {
  /** Metric value per state name (missing states render as zero). */
  data: Record<string, number>;
  /** Formats the value in the tooltip / legend. */
  format?: (n: number) => string;
  metricLabel?: string;
  selected?: string | null;
  onSelect?: (state: string | null) => void;
  className?: string;
}

/**
 * India choropleth, state-wise. Click a state to drill down (pages react to
 * `onSelect` by filtering their pincode/city tables). Fill intensity scales
 * with the metric; the brand blue works on both themes.
 */
export function IndiaMap({
  data,
  format = (n) => n.toLocaleString("en-IN"),
  metricLabel = "Value",
  selected,
  onSelect,
  className,
}: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);

  const max = useMemo(() => {
    const values = Object.values(data);
    return values.length ? Math.max(...values) : 0;
  }, [data]);

  // Sqrt scale keeps mid-size states visible next to the dominant ones.
  const intensity = (v: number) => (max > 0 ? Math.sqrt(v / max) : 0);

  const handleMove = (e: React.MouseEvent, name: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      <svg
        viewBox={INDIA_MAP_VIEWBOX}
        className="h-full w-full"
        role="img"
        aria-label={`India map showing ${metricLabel} by state`}
      >
        {INDIA_STATES.map((s) => {
          const value = data[s.name] ?? 0;
          const t = intensity(value);
          const isSelected = selected === s.name;
          const isHover = hover?.name === s.name;
          return (
            <path
              key={s.name}
              d={s.d}
              fill="#2563EB"
              fillOpacity={0.06 + t * 0.86}
              stroke={isSelected ? "var(--foreground)" : "var(--background)"}
              strokeWidth={isSelected ? 1.6 : isHover ? 1.2 : 0.6}
              className="cursor-pointer transition-[fill-opacity] duration-150"
              onMouseMove={(e) => handleMove(e, s.name)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(isSelected ? null : s.name)}
            />
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: Math.min(hover.x + 12, (containerRef.current?.clientWidth ?? 300) - 150),
            top: hover.y - 8,
          }}
        >
          <div className="font-medium text-gray-900">{hover.name}</div>
          <div className="text-gray-600">
            {metricLabel}: <span className="font-medium tabular-nums">{format(data[hover.name] ?? 0)}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-1 left-1 flex items-center gap-1.5 text-[10px] text-gray-500">
        <span>Low</span>
        <span
          className="h-1.5 w-20 rounded-full"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, #2563EB 8%, transparent), #2563EB)",
          }}
        />
        <span>High</span>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect?.(null)}
            className="ml-2 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
          >
            {selected} ✕
          </button>
        )}
      </div>
    </div>
  );
}
