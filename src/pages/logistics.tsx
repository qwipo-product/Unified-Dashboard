import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertOctagon,
  CheckCircle2,
  Clock3,
  Map as MapIcon,
  PackageCheck,
  Radio,
  Route,
  Truck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { ChartCard } from "@/components/dashboard/chart-card";
import { IndiaMap } from "@/components/dashboard/india-map";
import { RankTable } from "@/components/dashboard/rank-table";
import { CHART_PALETTE, AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE, SEMANTIC } from "@/components/dashboard/palette";
import { makeRange, rangeLabel, type DateRange } from "@/lib/date-range";
import { compact, minutes, num, pct } from "@/lib/format";
import { downloadCsvSections } from "@/lib/export";
import { useLiveTick } from "@/lib/use-live";
import {
  citiesOf,
  deltaFor,
  liveValue,
  rand,
  randIn,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

const FULFILLERS = ["Qwipo 2.0 fleet", "Distributor self-delivery", "3PL partners"] as const;

const TRIP_STATUSES: { label: string; tone: StatusTone }[] = [
  { label: "Loading", tone: "warning" },
  { label: "En route", tone: "info" },
  { label: "Delivering", tone: "info" },
  { label: "Returning", tone: "neutral" },
  { label: "Completed", tone: "success" },
];

export function Logistics() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [fulfiller, setFulfiller] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);
  const { tick } = useLiveTick(5000);

  const fFactor = fulfiller === "all" ? 1 : 0.15 + randIn(`ffshare:${fulfiller}`, 0.15, 0.4);
  const seed = `log:${fulfiller}`;

  const data = useMemo(() => {
    const trips = totalFor(`${seed}:trips`, range, 620 * fFactor);
    const routes = totalFor(`${seed}:routes`, range, 148 * fFactor);
    const delivered = totalFor(`${seed}:delivered`, range, 16_000 * fFactor);
    const failed = Math.round(delivered * randIn(`${seed}:failed`, 0.012, 0.03));
    const onTime = randIn(`${seed}:ontime`, 91, 96.5);
    const avgTat = randIn(`${seed}:tat`, 260, 420);

    const deliveryTrend = trend(`${seed}:trend`, range, [
      { name: FULFILLERS[0], dailyBase: 6_200 * fFactor },
      { name: FULFILLERS[1], dailyBase: 7_400 * fFactor },
      { name: FULFILLERS[2], dailyBase: 2_400 * fFactor, growth: 0.7 },
    ]);
    const fulfillerSplit = weightedSplit(`${seed}:split`, delivered, [
      { name: FULFILLERS[0], weight: 38 },
      { name: FULFILLERS[1], weight: 46 },
      { name: FULFILLERS[2], weight: 16 },
    ]);
    const states = stateSplit(`${seed}:states`, delivered);
    const activeTrips = Array.from({ length: 14 }, (_, i) => {
      const st = states[Math.floor(rand(`${seed}:at:${i}`) * 5)].name;
      const cities = citiesOf(st);
      const status = TRIP_STATUSES[Math.floor(rand(`${seed}:ats:${i}`) * (TRIP_STATUSES.length - 1))];
      return {
        id: `TRIP-${String(48_200 + i * 3)}`,
        route: `${cities[i % cities.length]} beat ${(i % 4) + 1}`,
        state: st,
        fulfiller: FULFILLERS[Math.floor(rand(`${seed}:atf:${i}`) * FULFILLERS.length)],
        orders: Math.round(randIn(`${seed}:ato:${i}`, 18, 85)),
        delivered: 0,
        status,
        etaMin: Math.round(randIn(`${seed}:ate:${i}`, 20, 240)),
      };
    }).map((t) => ({ ...t, delivered: Math.round(t.orders * randIn(`${seed}:atd:${t.id}`, 0.1, 0.9)) }));
    return { trips, routes, delivered, failed, onTime, avgTat, deliveryTrend, fulfillerSplit, states, activeTrips };
  }, [range, seed, fFactor]);

  const liveVehicles = liveValue(`${seed}:vehicles`, 240 * fFactor, tick);
  const outForDelivery = liveValue(`${seed}:ofd`, 1_850 * fFactor, tick);

  const exportReport = () =>
    downloadCsvSections(`qwipo-logistics-${range.preset}`, [
      {
        title: `Logistics — ${fulfiller === "all" ? "All fulfillers" : fulfiller} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Trips", value: data.trips },
          { metric: "Routes created", value: data.routes },
          { metric: "Orders delivered", value: data.delivered },
          { metric: "Failed deliveries", value: data.failed },
          { metric: "On-time %", value: data.onTime.toFixed(1) },
        ],
      },
      { title: "Deliveries by state", rows: data.states.map((s) => ({ state: s.name, deliveries: s.value })) },
      { title: "Deliveries by fulfiller", rows: data.fulfillerSplit.map((f) => ({ fulfiller: f.name, deliveries: f.value })) },
      { title: "Active trips", rows: data.activeTrips.map((t) => ({ trip: t.id, route: t.route, state: t.state, fulfiller: t.fulfiller, orders: t.orders, delivered: t.delivered, status: t.status.label })) },
    ]);

  return (
    <DashboardPage
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={fulfiller} onValueChange={setFulfiller}>
          <SelectTrigger className="h-8 w-52 text-xs">
            <SelectValue placeholder="All fulfillers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fulfillers</SelectItem>
            {FULFILLERS.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <KpiTile icon={Truck} label="Trips" value={compact(data.trips)} delta={deltaFor(`${seed}:t`, range)} tone="primary" />
        <KpiTile icon={Route} label="Routes created" value={compact(data.routes)} delta={deltaFor(`${seed}:r`, range)} tone="cyan" />
        <KpiTile icon={PackageCheck} label="Orders delivered" value={compact(data.delivered)} delta={deltaFor(`${seed}:d`, range)} tone="success" />
        <KpiTile icon={CheckCircle2} label="On-time delivery" value={pct(data.onTime)} delta={deltaFor(`${seed}:ot`, range)} tone="success" />
        <KpiTile icon={Clock3} label="Avg delivery time" value={minutes(data.avgTat)} delta={deltaFor(`${seed}:tt`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={AlertOctagon} label="Failed deliveries" value={num(data.failed)} delta={deltaFor(`${seed}:f`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={Radio} label="Vehicles on road" value={num(liveVehicles)} sub="right now, live" tone="accent" />
        <KpiTile icon={MapIcon} label="Out for delivery" value={num(outForDelivery)} sub="right now, live" tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Deliveries by fulfilment mode" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.deliveryTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Area type="monotone" dataKey={FULFILLERS[0]} stackId="1" stroke={CHART_PALETTE[0]} fill={CHART_PALETTE[0]} fillOpacity={0.4} />
              <Area type="monotone" dataKey={FULFILLERS[1]} stackId="1" stroke={CHART_PALETTE[1]} fill={CHART_PALETTE[1]} fillOpacity={0.4} />
              <Area type="monotone" dataKey={FULFILLERS[2]} stackId="1" stroke={CHART_PALETTE[5]} fill={CHART_PALETTE[5]} fillOpacity={0.4} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4">
          <ChartCard title="Fulfilment share" subtitle="Delivered orders" bodyClassName="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.fulfillerSplit} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {data.fulfillerSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={[CHART_PALETTE[0], CHART_PALETTE[1], CHART_PALETTE[5]][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Orders"]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="On-time performance" subtitle="Against 95% target" bodyClassName="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={[{ name: "On-time", value: data.onTime, fill: data.onTime >= 95 ? SEMANTIC.success : SEMANTIC.warning }]}
                innerRadius="70%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={8} />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 22, fontWeight: 600, fill: "var(--foreground)" }}>
                  {pct(data.onTime)}
                </text>
                <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>
                  on-time
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Deliveries by state"
          subtitle="Click a state to highlight"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={compact}
            metricLabel="Deliveries"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <RankTable
          title="Active trips"
          subtitle="Live route board, refreshing"
          className="lg:col-span-2"
          rows={data.activeTrips.filter((t) => !mapState || t.state === mapState)}
          rowKey={(r) => r.id}
          maxHeightClassName="max-h-[420px]"
          columns={[
            {
              key: "trip",
              header: "Trip",
              render: (r) => (
                <div>
                  <div className="font-mono text-xs text-gray-900">{r.id}</div>
                  <div className="text-[11px] text-gray-500">{r.route} · {r.state}</div>
                </div>
              ),
            },
            { key: "ff", header: "Fulfiller", render: (r) => <span className="text-xs text-gray-600">{r.fulfiller}</span> },
            {
              key: "progress",
              header: "Progress",
              render: (r) => (
                <div className="w-28">
                  <div className="mb-1 flex justify-between text-[10px] text-gray-500">
                    <span>{r.delivered}/{r.orders}</span>
                    <span>{Math.round((r.delivered / r.orders) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-blue-600"
                      style={{ width: `${(r.delivered / r.orders) * 100}%` }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge tone={r.status.tone} size="sm">{r.status.label}</StatusBadge>,
            },
            { key: "eta", header: "ETA", align: "right", render: (r) => minutes(r.etaMin) },
          ]}
        />
      </div>
    </DashboardPage>
  );
}
