import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  Radio,
  RotateCcw,
  ShoppingCart,
  ThumbsUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CANCEL_REASONS,
  CHANNELS,
  citiesOf,
  deltaFor,
  liveValue,
  rand,
  randIn,
  retailerNameOf,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

const LIVE_STATUSES: { label: string; tone: StatusTone }[] = [
  { label: "Placed", tone: "info" },
  { label: "Accepted", tone: "info" },
  { label: "Packed", tone: "warning" },
  { label: "Shipped", tone: "warning" },
  { label: "Delivered", tone: "success" },
  { label: "Cancelled", tone: "danger" },
];

interface LiveOrder {
  id: string;
  retailer: string;
  city: string;
  value: number;
  channel: string;
  status: { label: string; tone: StatusTone };
  at: Date;
}

function makeLiveOrder(n: number): LiveOrder {
  const states = ["Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra"];
  const state = states[Math.floor(rand(`lo:state:${n}`) * states.length)];
  const cities = citiesOf(state);
  // Weight the feed toward fresh statuses — most events are new orders.
  const statusIdx = rand(`lo:status:${n}`) < 0.45 ? 0 : Math.floor(rand(`lo:s2:${n}`) * LIVE_STATUSES.length);
  return {
    id: `QWP-${String(281000 + n).padStart(6, "0")}`,
    retailer: retailerNameOf(n % 60),
    city: cities[Math.floor(rand(`lo:city:${n}`) * cities.length)],
    value: Math.round(randIn(`lo:val:${n}`, 900, 18_000)),
    channel: CHANNELS[Math.floor(rand(`lo:ch:${n}`) * CHANNELS.length)],
    status: LIVE_STATUSES[statusIdx],
    at: new Date(),
  };
}

export function Orders() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [channel, setChannel] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);
  const { tick } = useLiveTick(4000);

  const channelFactor = channel === "all" ? 1 : 0.12 + randIn(`chshare:${channel}`, 0.1, 0.35);
  const seed = `orders:${channel}`;

  const data = useMemo(() => {
    const orders = totalFor(`${seed}:count`, range, 18_000 * channelFactor);
    const gmv = totalFor(`${seed}:gmv`, range, 7_50_00_000 * channelFactor);
    const delivered = Math.round(orders * randIn(`${seed}:del`, 0.86, 0.92));
    const cancelled = Math.round(orders * randIn(`${seed}:can`, 0.045, 0.075));
    const returned = Math.round(orders * randIn(`${seed}:ret`, 0.012, 0.028));
    const accepted = Math.round(orders * randIn(`${seed}:acc`, 0.955, 0.985));

    const statusTrend = trend(`${seed}:trend`, range, [
      { name: "Delivered", dailyBase: 16_000 * channelFactor },
      { name: "In transit", dailyBase: 1_100 * channelFactor, noise: 0.25 },
      { name: "Cancelled", dailyBase: 1_050 * channelFactor, growth: 0.15, noise: 0.3 },
    ]);
    const funnel = [
      { name: "Placed", value: orders },
      { name: "Accepted", value: accepted },
      { name: "Packed", value: Math.round(accepted * 0.985) },
      { name: "Shipped", value: Math.round(accepted * 0.968) },
      { name: "Delivered", value: delivered },
    ];
    const cancelReasons = weightedSplit(`${seed}:reasons`, cancelled,
      CANCEL_REASONS.map((r, i) => ({ name: r, weight: 22 - i * 2.6 })),
    ).sort((a, b) => b.value - a.value);
    const channelSplit = weightedSplit("orders:channels", totalFor("orders:count", range, 18_000), [
      { name: CHANNELS[0], weight: 46 },
      { name: CHANNELS[1], weight: 34 },
      { name: CHANNELS[2], weight: 12 },
      { name: CHANNELS[3], weight: 8 },
    ]);
    const states = stateSplit(`${seed}:states`, orders);
    return { orders, gmv, delivered, cancelled, returned, accepted, statusTrend, funnel, cancelReasons, channelSplit, states };
  }, [range, seed, channelFactor]);

  // Live feed — a new event flows in on most ticks.
  const [feed, setFeed] = useState<LiveOrder[]>(() =>
    Array.from({ length: 8 }, (_, i) => makeLiveOrder(i)),
  );
  const counter = useRef(8);
  useEffect(() => {
    if (tick === 0) return;
    counter.current += 1;
    setFeed((f) => [makeLiveOrder(counter.current), ...f].slice(0, 30));
  }, [tick]);

  const inFlight = liveValue(`${seed}:inflight`, 312 * channelFactor, tick);
  const aov = data.orders > 0 ? data.gmv / data.orders : 0;

  const exportReport = () =>
    downloadCsvSections(`qwipo-orders-${range.preset}`, [
      {
        title: `Orders — ${channel === "all" ? "All channels" : channel} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Orders", value: data.orders },
          { metric: "Order value", value: data.gmv },
          { metric: "Delivered", value: data.delivered },
          { metric: "Cancelled", value: data.cancelled },
          { metric: "Returned", value: data.returned },
        ],
      },
      { title: "Orders by state", rows: data.states.map((s) => ({ state: s.name, orders: s.value })) },
      { title: "Cancellation reasons", rows: data.cancelReasons.map((r) => ({ reason: r.name, orders: r.value })) },
    ]);

  return (
    <DashboardPage
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <KpiTile icon={ShoppingCart} label="Orders" value={compact(data.orders)} delta={deltaFor(`${seed}:o`, range)} tone="primary" />
        <KpiTile icon={CircleDollarSign} label="Order value" value={inrCompact(data.gmv)} delta={deltaFor(`${seed}:g`, range)} tone="success" />
        <KpiTile icon={PackageCheck} label="Avg order value" value={inrCompact(aov)} delta={deltaFor(`${seed}:aov`, range)} tone="cyan" />
        <KpiTile icon={ThumbsUp} label="Acceptance rate" value={pct((data.accepted / Math.max(1, data.orders)) * 100)} delta={deltaFor(`${seed}:ar`, range)} tone="accent" />
        <KpiTile icon={CheckCircle2} label="Delivered" value={compact(data.delivered)} delta={deltaFor(`${seed}:d`, range)} tone="success" />
        <KpiTile icon={Ban} label="Cancelled" value={compact(data.cancelled)} delta={deltaFor(`${seed}:c`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={RotateCcw} label="Returns" value={compact(data.returned)} delta={deltaFor(`${seed}:r`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={Radio} label="In flight" value={num(inFlight)} sub="right now, live" tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Order flow by status" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.statusTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} stackOffset="none">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Area type="monotone" dataKey="Delivered" stackId="1" stroke={SEMANTIC.success} fill={SEMANTIC.success} fillOpacity={0.35} />
              <Area type="monotone" dataKey="In transit" stackId="1" stroke={SEMANTIC.warning} fill={SEMANTIC.warning} fillOpacity={0.35} />
              <Area type="monotone" dataKey="Cancelled" stackId="1" stroke={SEMANTIC.danger} fill={SEMANTIC.danger} fillOpacity={0.35} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Live order feed */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">Live order feed</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">Streaming events, newest first</p>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72">
              <ul className="divide-y divide-gray-100">
                {feed.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-900">{o.id}</span>
                        <StatusBadge tone={o.status.tone} size="sm">{o.status.label}</StatusBadge>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-gray-500">
                        {o.retailer} · {o.city}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium tabular-nums text-gray-900">{inrCompact(o.value)}</div>
                      <div className="text-[10px] text-gray-400">
                        {o.at.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Fulfilment funnel" subtitle="Placed → delivered">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={72} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Orders"]} />
              <Bar dataKey="value" fill={SEMANTIC.primary} radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cancellation reasons" subtitle="Sorted by impact">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.cancelReasons} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={148} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Orders"]} />
              <Bar dataKey="value" fill={SEMANTIC.danger} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by channel" subtitle="All channels, period share">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.channelSplit} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Orders by state"
          subtitle="Click a state to highlight"
          className="lg:col-span-2"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={compact}
            metricLabel="Orders"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <RankTable
          title="Top states"
          subtitle={mapState ? `Highlighting ${mapState}` : "By order volume"}
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
            { key: "orders", header: "Orders", align: "right", render: (r) => num(r.value) },
            { key: "share", header: "Share", align: "right", render: (r) => pct((r.value / Math.max(1, data.orders)) * 100) },
          ]}
        />
      </div>
    </DashboardPage>
  );
}
