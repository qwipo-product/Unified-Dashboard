import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface ListPaginationProps {
  /** Current page (1-indexed). */
  page: number;
  /** Total number of items across all pages. */
  total: number;
  /** Items rendered per page. Defaults to 10. */
  pageSize?: number;
  /** Called with the new 1-indexed page number on Prev / Next. */
  onPageChange: (page: number) => void;
  /**
   * Singular label for the items being paginated — used in the
   * "Showing 1–10 of 24 sellers" caption. Default `"item"`.
   */
  itemLabel?: string;
  /** Plural override for `itemLabel`. Default = `${itemLabel}s`. */
  itemLabelPlural?: string;
  /**
   * Hide the bar when there's only one page worth of data. Default
   * `false` — pagination is ALWAYS rendered so every list page feels
   * the same shape, even when the data fits in one page (the Previous
   * / Next buttons just disable themselves).
   */
  hideOnSinglePage?: boolean;
  className?: string;
}

/**
 * Standard pagination footer used inside the sticky bottom strip on
 * every list page (Sellers, New Requests, My SKU, Customers, Offers,
 * Orders, …) so the paging UX is identical everywhere: a
 * "Showing N–M of T <items>" caption on the left, a Prev / Next pair
 * with a "Page X of Y" pill on the right.
 *
 * Renders even when there's only one page so every list page has the
 * same visual shape — the Previous / Next buttons just disable
 * themselves. Pass `hideOnSinglePage` to opt out for genuinely tight
 * surfaces.
 */
export function ListPagination({
  page,
  total,
  pageSize = 10,
  onPageChange,
  itemLabel = "item",
  itemLabelPlural,
  hideOnSinglePage = false,
  className,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (hideOnSinglePage && totalPages <= 1) return null;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const plural = itemLabelPlural ?? `${itemLabel}s`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white shrink-0",
        className,
      )}
    >
      <span className="text-xs text-gray-500">
        Showing{" "}
        {total === 0 ? (
          <span className="font-medium text-gray-700">0</span>
        ) : (
          <>
            <span className="font-medium text-gray-700">{startIndex + 1}</span>
            {"–"}
            <span className="font-medium text-gray-700">{endIndex}</span>
          </>
        )}
        {" of "}
        <span className="font-medium text-gray-700">{total}</span>{" "}
        {total === 1 ? itemLabel : plural}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <span className="text-xs text-gray-600 px-2">
          Page <span className="font-medium text-gray-900">{page}</span> of{" "}
          <span className="font-medium text-gray-900">{totalPages}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Tiny helper — slice an array into the current page's window. Keeps
 * the per-page wiring in callers down to two lines:
 *
 *   const pageRows = paginate(filtered, page, 10);
 */
export function paginate<T>(items: T[], page: number, pageSize = 10): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
