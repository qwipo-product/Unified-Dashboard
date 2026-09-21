import type { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "./utils";

/**
 * Lightweight, opinionated table primitives that bake in the canonical
 * Qwipo table styling so every list page looks identical without each
 * developer having to re-style their `<th>` / `<td>` from scratch.
 *
 * Usage mirrors the existing raw `<table>` markup — just swap the tags:
 *
 *   <DataTable>
 *     <DataTableHead>
 *       <DataTableRow>
 *         <DataTableHeader>SKU Code</DataTableHeader>
 *         <DataTableHeader align="right">MRP</DataTableHeader>
 *       </DataTableRow>
 *     </DataTableHead>
 *     <DataTableBody>
 *       <DataTableRow>
 *         <DataTableCell>180000005</DataTableCell>
 *         <DataTableCell align="right">₹2,500</DataTableCell>
 *       </DataTableRow>
 *     </DataTableBody>
 *   </DataTable>
 */

export function DataTable({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-gray-50 border-b border-gray-200", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function DataTableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-gray-100", className)} {...props}>
      {children}
    </tbody>
  );
}

interface DataTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Disable the default hover background (e.g. for empty-state rows). */
  noHover?: boolean;
}

export function DataTableRow({
  className,
  noHover,
  children,
  ...props
}: DataTableRowProps) {
  return (
    <tr
      className={cn(
        !noHover && "hover:bg-gray-50 transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface AlignProps {
  align?: "left" | "center" | "right";
}

const ALIGN_CLASS: Record<NonNullable<AlignProps["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

interface DataTableHeaderProps
  extends Omit<ThHTMLAttributes<HTMLTableCellElement>, "align">,
    AlignProps {}

export function DataTableHeader({
  className,
  align = "left",
  children,
  ...props
}: DataTableHeaderProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600",
        ALIGN_CLASS[align],
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

interface DataTableCellProps
  extends Omit<TdHTMLAttributes<HTMLTableCellElement>, "align">,
    AlignProps {}

export function DataTableCell({
  className,
  align = "left",
  children,
  ...props
}: DataTableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-gray-900 align-middle",
        ALIGN_CLASS[align],
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

interface DataTableEmptyProps {
  /** Number of columns to span — usually equal to the table's column count. */
  colSpan: number;
  children: ReactNode;
}

/**
 * Convenience row used to slot the EmptyState component into a table
 * body without breaking the column layout. Strips padding so the
 * EmptyState fills the cell cleanly.
 */
export function DataTableEmpty({ colSpan, children }: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        {children}
      </td>
    </tr>
  );
}
