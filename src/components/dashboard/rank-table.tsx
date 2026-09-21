import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/components/ui/utils";

export interface RankColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T, index: number) => ReactNode;
}

interface RankTableProps<T> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  columns: RankColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Cap the visible height; the table scrolls with a sticky header. */
  maxHeightClassName?: string;
  className?: string;
}

/** Card + dense table for "top N" leaderboards used across dashboards. */
export function RankTable<T>({
  title,
  subtitle,
  action,
  columns,
  rows,
  rowKey,
  maxHeightClassName = "max-h-80",
  className,
}: RankTableProps<T>) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action && <div className="ml-3 shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn("overflow-auto", maxHeightClassName)}>
          <Table>
            <TableHeader className="sticky top-0 z-[1] bg-white">
              <TableRow>
                {columns.map((c) => (
                  <TableHead
                    key={c.key}
                    className={cn(
                      "text-[10px] uppercase tracking-wider text-gray-500",
                      c.align === "right" && "text-right",
                    )}
                  >
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={rowKey(row, i)}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn("py-2.5 text-sm", c.align === "right" && "text-right tabular-nums")}
                    >
                      {c.render(row, i)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
