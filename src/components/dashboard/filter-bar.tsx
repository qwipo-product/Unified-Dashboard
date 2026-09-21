import { useState, type ReactNode } from "react";
import { CalendarRange, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import {
  RANGE_PRESETS,
  makeRange,
  rangeLabel,
  type DateRange,
} from "@/lib/date-range";
import { LiveIndicator } from "./live-indicator";

interface FilterBarProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  /** Page-specific controls (selects, search) rendered after the presets. */
  children?: ReactNode;
  onExport?: () => void;
  live?: boolean;
}

/**
 * The shared dashboard toolbar: date-range presets + custom range picker on
 * the left, page filters + export on the right. Sticky under the app header
 * per the DS list-page pattern.
 */
export function FilterBar({ range, onRangeChange, children, onExport, live = true }: FilterBarProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [from, setFrom] = useState(() => range.from.toISOString().slice(0, 10));
  const [to, setTo] = useState(() => range.to.toISOString().slice(0, 10));

  const applyCustom = () => {
    const f = new Date(from);
    const t = new Date(to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || f > t) return;
    t.setHours(23, 59, 59, 999);
    onRangeChange(makeRange("custom", f, t));
    setCustomOpen(false);
  };

  return (
    <div className="z-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 md:sticky md:top-0">
      <div className="flex max-w-full items-center overflow-x-auto rounded-full border border-gray-200 bg-gray-50 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RANGE_PRESETS.map(({ preset, label }) => (
          <button
            key={preset}
            type="button"
            onClick={() => onRangeChange(makeRange(preset))}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all",
              range.preset === preset
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            {label}
          </button>
        ))}
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all",
                range.preset === "custom"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Custom
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Custom date range</p>
              <div className="space-y-2">
                <Label htmlFor="range-from" className="text-xs">From</Label>
                <Input
                  id="range-from"
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-to" className="text-xs">To</Label>
                <Input
                  id="range-to"
                  type="date"
                  value={to}
                  min={from}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setCustomOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={applyCustom}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <span className="hidden text-xs text-gray-500 md:inline">{rangeLabel(range)}</span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        {onExport && (
          <Button variant="outline" size="sm" className="h-8" onClick={onExport}>
            <Download className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        )}
        {live && <LiveIndicator />}
      </div>
    </div>
  );
}
