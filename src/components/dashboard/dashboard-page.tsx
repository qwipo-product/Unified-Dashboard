import type { ReactNode } from "react";
import { FilterBar } from "./filter-bar";
import type { DateRange } from "@/lib/date-range";

interface DashboardPageProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  /** Page-specific filter controls, rendered on the toolbar's right side. */
  filters?: ReactNode;
  onExport?: () => void;
  children: ReactNode;
}

/**
 * Standard anatomy for every dashboard tab: sticky FilterBar → scrolling
 * content on the gray canvas. The page name lives in the app-shell header,
 * so tabs carry no in-page heading of their own. Keeping all eight tabs
 * identical in structure lets the TV/wall-mounted view swap between them
 * seamlessly.
 */
export function DashboardPage({
  range,
  onRangeChange,
  filters,
  onExport,
  children,
}: DashboardPageProps) {
  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <FilterBar range={range} onRangeChange={onRangeChange} onExport={onExport}>
        {filters}
      </FilterBar>
      <div className="flex-1 space-y-6 p-6">{children}</div>
    </div>
  );
}
