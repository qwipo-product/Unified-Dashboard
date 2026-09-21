import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  IndianRupee,
  Package,
  ShoppingCart,
  Smartphone,
  Store,
  Timer,
  Truck,
  Warehouse,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { ChartCard } from "@/components/dashboard/chart-card";
import { IndiaMap } from "@/components/dashboard/india-map";
import { RankTable } from "@/components/dashboard/rank-table";
import { CHART_PALETTE, AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE, SEMANTIC } from "@/components/dashboard/palette";
import { makeRange, rangeLabel, type DateRange } from "@/lib/date-range";
import { compact, inrCompact, num, pct } from "@/lib/format";
import { downloadCsvSections } from "@/lib/export";
import { useLiveTick } from "@/lib/use-live";
import {
  CHANNELS,
  deltaFor,
  liveValue,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

export function Overview() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const { tick } = useLiveTick(5000);
  const [mapState, setMapState] = useState<string | null>(null);

  const data = useMemo(() => {
    const gmv = totalFor("ov:gmv", range, 7_50_00_000);
    const orders = totalFor("ov:orders", range, 18_000);
    const downloads = totalFor("ov:downloads", range, 1_400);
    const gmvTrend = trend("ov:trend", range, [
      { name: "Revenue", dailyBase: 7_50_00_000 },
      { name: "Orders", dailyBase: 18_000 },
    ]);
    const channelSplit = weightedSplit("ov:channels", orders, [
      { name: CHANNELS[0], weight: 46 },
      { name: CHANNELS[1], weight: 34 },
      { name: CHANNELS[2], weight: 12 },
      { name: CHANNELS[3], weight: 8 },
    ]);
    const states = stateSplit("ov:gmv:states", gmv);
    return { gmv, orders, downloads, gmvTrend, channelSplit, states };
  }, [range]);

  const liveOrders = liveValue("ov:live-orders", 312, tick);
  const activeRetailers = totalFor("ov:active-retailers", range, 2_300);
  const activeVendors = Math.round(4_820 * 0.71);

  const exportReport = () =>
    downloadCsvSections(`qwipo-overview-${range.preset}`, [
      {
        title: `Qwipo overview — ${rangeLabel(range)}`,
        rows: [
          { metric: "Gross merchandise value", value: data.gmv },
          { metric: "Orders", value: data.orders },
          { metric: "Active retailers", value: activeRetailers },
          { metric: "Active vendors", value: activeVendors },
          { metric: "App downloads", value: data.downloads },
        ],
      },
      { title: "Revenue by state", rows: data.states.map((s) => ({ state: s.name, revenue: s.value })) },
      { title: "Orders by channel", rows: data.channelSplit.map((c) => ({ channel: c.name, orders: c.value })) },
    ]);

  const spark = data.gmvTrend.map((p) => p.Revenue as number);

  return (
    <DashboardPage
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <KpiTile
          icon={IndianRupee}
          label="Gross merchandise value"
          value={inrCompact(data.gmv)}
          delta={deltaFor("ov:gmv", range)}
          sub="vs previous period"
          tone="primary"
          spark={spark}
        />
        <KpiTile
          icon={ShoppingCart}
          label="Orders"
          value={compact(data.orders)}
          delta={deltaFor("ov:orders", range)}
          sub="vs previous period"
          tone="success"
        />
        <KpiTile
          icon={Store}
          label="Active retailers"
          value={compact(activeRetailers)}
          delta={deltaFor("ov:retailers", range)}
          sub="ordered in period"
          tone="accent"
        />
        <KpiTile
          icon={Warehouse}
          label="Active vendors"
          value={num(activeVendors)}
          delta={deltaFor("ov:vendors", range)}
          sub="of 4,820 onboarded"
          tone="cyan"
        />
        <KpiTile
          icon={Smartphone}
          label="App downloads"
          value={compact(data.downloads)}
          delta={deltaFor("ov:downloads", range)}
          sub="all apps"
          tone="warning"
        />
        <KpiTile
          icon={Timer}
          label="Orders in flight"
          value={num(liveOrders)}
          sub="right now, live"
          tone="danger"
        />
      </div>

      {/* Trend + channel split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Revenue and orders trend"
          subtitle={rangeLabel(range)}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.gmvTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SEMANTIC.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={SEMANTIC.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis yAxisId="rev" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => inrCompact(v)} width={56} />
              <YAxis yAxisId="ord" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={40} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number, name: string) =>
                  name === "Revenue" ? [inrCompact(value), name] : [num(value), name]
                }
              />
              <Area yAxisId="rev" type="monotone" dataKey="Revenue" stroke={SEMANTIC.primary} strokeWidth={2} fill="url(#ovRev)" />
              <Line yAxisId="ord" type="monotone" dataKey="Orders" stroke={SEMANTIC.success} strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by channel" subtitle="Share of orders in period">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.channelSplit}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
              >
                {data.channelSplit.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Orders"]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Map + top states */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Revenue by state"
          subtitle="Click a state to highlight it across tables"
          className="lg:col-span-2"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={inrCompact}
            metricLabel="Revenue"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <RankTable
          title="Top states"
          subtitle={mapState ? `Highlighting ${mapState}` : "By revenue in period"}
          rows={data.states.slice(0, 10)}
          rowKey={(r) => r.name}
          maxHeightClassName="max-h-[420px]"
          columns={[
            {
              key: "state",
              header: "State",
              render: (r, i) => (
                <span className={r.name === mapState ? "font-semibold text-blue-600" : undefined}>
                  <span className="mr-2 inline-block w-4 text-right text-xs text-gray-400">{i + 1}</span>
                  {r.name}
                </span>
              ),
            },
            { key: "rev", header: "Revenue", align: "right", render: (r) => inrCompact(r.value) },
            {
              key: "share",
              header: "Share",
              align: "right",
              render: (r) => pct((r.value / data.gmv) * 100),
            },
          ]}
        />
      </div>

      {/* Domain shortcuts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/apps", icon: Smartphone, label: "App analytics", stat: `${compact(data.downloads)} downloads`, tone: "bg-amber-50 text-amber-600" },
          { to: "/orders", icon: ShoppingCart, label: "Orders", stat: `${compact(data.orders)} orders`, tone: "bg-emerald-50 text-emerald-600" },
          { to: "/skus", icon: Package, label: "SKUs", stat: "84.2K active SKUs", tone: "bg-blue-50 text-blue-600" },
          { to: "/logistics", icon: Truck, label: "Logistics", stat: `${pct(94.6)} on-time`, tone: "bg-purple-50 text-purple-600" },
        ].map((d) => (
          <Link key={d.to} to={d.to} className="group">
            <Card className="shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-md ${d.tone}`}>
                  <d.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">{d.label}</div>
                  <div className="text-xs text-gray-500">{d.stat}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardPage>
  );
}
