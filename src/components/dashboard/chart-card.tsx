import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Chart region height — defaults to the DS full-card h-72. */
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

/** Card wrapper for every chart: consistent header anatomy + fixed height. */
export function ChartCard({
  title,
  subtitle,
  action,
  bodyClassName,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action && <div className="ml-3 shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn("h-72", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
