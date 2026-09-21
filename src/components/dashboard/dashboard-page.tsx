import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "./filter-bar";
import type { DateRange } from "@/lib/date-range";

interface DashboardPageProps {
  title: string;
  description?: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  /** Page-specific filter controls, rendered on the toolbar's right side. */
  filters?: ReactNode;
  onExport?: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
}

/**
 * Standard anatomy for every dashboard tab: PageHeader → sticky FilterBar →
 * scrolling content on the gray canvas. Keeps all eight tabs identical in
 * structure so the TV/wall-mounted view swaps between them seamlessly.
 */
export function DashboardPage({
  title,
  description,
  range,
  onRangeChange,
  filters,
  onExport,
  headerActions,
  children,
}: DashboardPageProps) {
  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <PageHeader title={title} description={description} actions={headerActions} />
      <FilterBar range={range} onRangeChange={onRangeChange} onExport={onExport}>
        {filters}
      </FilterBar>
      <div className="flex-1 space-y-6 p-6">{children}</div>
    </div>
  );
}
