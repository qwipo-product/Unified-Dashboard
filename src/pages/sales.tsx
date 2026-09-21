import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CircleDollarSign,
  Percent,
  Radio,
  ShoppingCart,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CATEGORIES,
  CHANNELS,
  citiesOf,
  deltaFor,
  liveValue,
  pincodeOf,
  randIn,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

export function Sales() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [channel, setChannel] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);
  const { tick } = useLiveTick(4000);

  const chFactor = channel === "all" ? 1 : 0.12 + randIn(`salesch:${channel}`, 0.1, 0.35);
  const seed = `sales:${channel}`;

  const data = useMemo(() => {
    const revenue = totalFor(`${seed}:rev`, range, 7_50_00_000 * chFactor);
    const orders = totalFor(`${seed}:orders`, range, 18_000 * chFactor);
    const margin = randIn(`${seed}:margin`, 6.5, 11.5);
    const target = revenue * randIn(`${seed}:target`, 1.02, 1.35);

    const revTrend = trend(`${seed}:trend`, range, [
      { name: "This period", dailyBase: 7_50_00_000 * chFactor },
      { name: "Previous period", dailyBase: 6_40_00_000 * chFactor, noise: 0.15 },
    ]);
    const byChannel = trend(`${seed}:bychannel`, range, [
      { name: CHANNELS[0], dailyBase: 3_45_00_000 },
      { name: CHANNELS[1], dailyBase: 2_55_00_000, growth: 0.7 },
      { name: CHANNELS[2], dailyBase: 90_00_000 },
      { name: CHANNELS[3], dailyBase: 60_00_000 },
    ]);
    const byCategory = weightedSplit(`${seed}:cats`, revenue,
      CATEGORIES.map((c, i) => ({ name: c, weight: 20 - i * 1.5 })),
    ).sort((a, b) => b.value - a.value).slice(0, 8);
    const states = stateSplit(`${seed}:states`, revenue);

    const drill = mapState ?? states[0]?.name ?? "Telangana";
    const stateTotal = states.find((s) => s.name === drill)?.value ?? 0;
    const cities = citiesOf(drill);
    const topPincodes = weightedSplit(`${seed}:pins:${drill}`, stateTotal,
      Array.from({ length: 10 }, (_, i) => ({ name: pincodeOf(drill, i), weight: 12 - i })),
    ).map((p, i) => ({
      pincode: p.name,
      area: cities[i % cities.length],
      revenue: p.value,
      orders: Math.round(p.value / randIn(`${seed}:paov:${p.name}`, 3_200, 5_600)),
    }));
    return { revenue, orders, margin, target, revTrend, byChannel, byCategory, states, topPincodes, drill };
  }, [range, seed, chFactor, mapState]);

  const liveToday = liveValue(`${seed}:today`, 7_50_00_000 * chFactor * ((new Date().getHours() + 1) / 24), tick, 0.05);
  const aov = data.orders > 0 ? data.revenue / data.orders : 0;
  const attainment = Math.min(100, (data.revenue / data.target) * 100);

  const exportReport = () =>
    downloadCsvSections(`qwipo-sales-${range.preset}`, [
      {
        title: `Sales — ${channel === "all" ? "All channels" : channel} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Revenue", value: data.revenue },
          { metric: "Orders", value: data.orders },
          { metric: "Avg order value", value: Math.round(aov) },
          { metric: "Gross margin %", value: data.margin.toFixed(1) },
          { metric: "Target attainment %", value: attainment.toFixed(1) },
        ],
      },
      { title: "Revenue by state", rows: data.states.map((s) => ({ state: s.name, revenue: s.value })) },
      { title: "Revenue by category", rows: data.byCategory.map((c) => ({ category: c.name, revenue: c.value })) },
      { title: `Top pincodes — ${data.drill}`, rows: data.topPincodes },
    ]);

  return (
    <DashboardPage
      title="Sales & revenue"
      description="Revenue performance across the country, by channel and category"
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile icon={CircleDollarSign} label="Revenue" value={inrCompact(data.revenue)} delta={deltaFor(`${seed}:r`, range)} tone="primary" spark={data.revTrend.map((p) => p["This period"] as number)} />
        <KpiTile icon={Radio} label="Revenue today" value={inrCompact(liveToday)} sub="right now, live" tone="success" />
        <KpiTile icon={ShoppingCart} label="Orders" value={compact(data.orders)} delta={deltaFor(`${seed}:o`, range)} tone="cyan" />
        <KpiTile icon={Wallet} label="Avg order value" value={inrCompact(aov)} delta={deltaFor(`${seed}:a`, range)} tone="accent" />
        <KpiTile icon={Percent} label="Gross margin" value={pct(data.margin)} delta={deltaFor(`${seed}:m`, range)} tone="warning" />
        <KpiTile icon={TrendingUp} label="Run-rate vs last period" value={pct(100 + deltaFor(`${seed}:rrate`, range), 0)} delta={deltaFor(`${seed}:rr2`, range)} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue vs previous period" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => inrCompact(v)} width={64} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => inrCompact(v)} />
              <Line type="monotone" dataKey="This period" stroke={SEMANTIC.primary} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Previous period" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Target attainment" subtitle="Period revenue vs plan">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={[{ name: "Attainment", value: attainment, fill: attainment >= 90 ? SEMANTIC.success : attainment >= 70 ? SEMANTIC.warning : SEMANTIC.danger }]}
              innerRadius="68%"
              outerRadius="95%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={8} />
              <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 26, fontWeight: 600, fill: "var(--foreground)" }}>
                {pct(attainment, 0)}
              </text>
              <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>
                of {inrCompact(data.target)} plan
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue by channel" subtitle="Stacked over the period">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byChannel} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => inrCompact(v)} width={64} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => inrCompact(v)} />
              {CHANNELS.map((c, i) => (
                <Bar key={c} dataKey={c} stackId="1" fill={CHART_PALETTE[i]} radius={i === CHANNELS.length - 1 ? [3, 3, 0, 0] : undefined} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by category" subtitle="Top categories, sorted">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byCategory} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => inrCompact(v)} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [inrCompact(v), "Revenue"]} />
              <Bar dataKey="value" fill={SEMANTIC.primary} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Revenue by state"
          subtitle="Click a state to drill into pincodes"
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
          title={`Top pincodes — ${data.drill}`}
          subtitle="Revenue and orders"
          rows={data.topPincodes}
          rowKey={(r) => r.pincode}
          maxHeightClassName="max-h-[420px]"
          columns={[
            {
              key: "pin",
              header: "Pincode",
              render: (r) => (
                <div>
                  <div className="font-mono text-xs text-gray-900">{r.pincode}</div>
                  <div className="text-[11px] text-gray-500">{r.area}</div>
                </div>
              ),
            },
            { key: "orders", header: "Orders", align: "right", render: (r) => num(r.orders) },
            { key: "rev", header: "Revenue", align: "right", render: (r) => inrCompact(r.revenue) },
          ]}
        />
      </div>
    </DashboardPage>
  );
}
