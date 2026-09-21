import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Repeat,
  Store,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { ChartCard } from "@/components/dashboard/chart-card";
import { IndiaMap } from "@/components/dashboard/india-map";
import { RankTable } from "@/components/dashboard/rank-table";
import { CHART_PALETTE, AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE, SEMANTIC } from "@/components/dashboard/palette";
import { makeRange, rangeLabel, type DateRange } from "@/lib/date-range";
import { compact, inrCompact, num, pct } from "@/lib/format";
import { downloadCsvSections } from "@/lib/export";
import {
  RETAILER_SEGMENTS,
  citiesOf,
  deltaFor,
  rand,
  randIn,
  retailerNameOf,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

export function Retailers() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [segment, setSegment] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);

  const segFactor = segment === "all" ? 1 : 0.08 + randIn(`segshare:${segment}`, 0.08, 0.4);
  const seed = `ret:${segment}`;

  const data = useMemo(() => {
    const registered = Math.round(2_10_000 * segFactor);
    const newRetailers = totalFor(`${seed}:new`, range, 260 * segFactor);
    const active = Math.round(registered * randIn(`${seed}:active`, 0.28, 0.36));
    const inactive = registered - active;
    const churnRisk = Math.round(active * randIn(`${seed}:churn`, 0.09, 0.14));
    const repeatRate = randIn(`${seed}:repeat`, 58, 74);
    const avgOrders = randIn(`${seed}:avgorders`, 3.2, 6.8);
    const arpu = randIn(`${seed}:arpu`, 9_500, 16_500);

    const growthTrend = trend(`${seed}:trend`, range, [
      { name: "New retailers", dailyBase: 260 * segFactor, noise: 0.25 },
      { name: "Churned", dailyBase: 70 * segFactor, growth: 0.1, noise: 0.3 },
    ]);
    const segments = weightedSplit("ret:segments", 2_10_000, [
      { name: RETAILER_SEGMENTS[0], weight: 52 },
      { name: RETAILER_SEGMENTS[1], weight: 14 },
      { name: RETAILER_SEGMENTS[2], weight: 9 },
      { name: RETAILER_SEGMENTS[3], weight: 12 },
      { name: RETAILER_SEGMENTS[4], weight: 6 },
      { name: RETAILER_SEGMENTS[5], weight: 7 },
    ]);
    const states = stateSplit(`${seed}:states`, active);
    const topRetailers = Array.from({ length: 12 }, (_, i) => {
      const st = states[Math.floor(rand(`${seed}:tr:${i}`) * 6)].name;
      return {
        name: retailerNameOf(i + 100),
        city: citiesOf(st)[i % citiesOf(st).length],
        state: st,
        gmv: Math.round(randIn(`${seed}:trg:${i}`, 4_00_000, 32_00_000) * (1 - i * 0.055)),
        orders: Math.round(randIn(`${seed}:tro:${i}`, 40, 400)),
        active: rand(`${seed}:tra:${i}`) > 0.12,
      };
    }).sort((a, b) => b.gmv - a.gmv);
    return { registered, newRetailers, active, inactive, churnRisk, repeatRate, avgOrders, arpu, growthTrend, segments, states, topRetailers };
  }, [range, seed, segFactor]);

  const exportReport = () =>
    downloadCsvSections(`qwipo-retailers-${range.preset}`, [
      {
        title: `Retailers — ${segment === "all" ? "All segments" : segment} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Registered retailers", value: data.registered },
          { metric: "New in period", value: data.newRetailers },
          { metric: "Active", value: data.active },
          { metric: "Inactive", value: data.inactive },
          { metric: "Churn risk", value: data.churnRisk },
        ],
      },
      { title: "Active retailers by state", rows: data.states.map((s) => ({ state: s.name, retailers: s.value })) },
      { title: "Top retailers", rows: data.topRetailers.map((r) => ({ retailer: r.name, city: r.city, state: r.state, gmv: r.gmv, orders: r.orders })) },
    ]);

  return (
    <DashboardPage
      title="Retailers"
      description="Buyer network health — acquisition, activity and retention"
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="All segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All segments</SelectItem>
            {RETAILER_SEGMENTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <KpiTile icon={Store} label="Registered" value={compact(data.registered)} delta={deltaFor(`${seed}:r`, range)} tone="primary" />
        <KpiTile icon={UserPlus} label="New in period" value={compact(data.newRetailers)} delta={deltaFor(`${seed}:n`, range)} tone="success" />
        <KpiTile icon={UserCheck} label="Active" value={compact(data.active)} delta={deltaFor(`${seed}:a`, range)} tone="cyan" />
        <KpiTile icon={UserMinus} label="Inactive" value={compact(data.inactive)} delta={deltaFor(`${seed}:i`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={AlertTriangle} label="Churn risk" value={compact(data.churnRisk)} delta={deltaFor(`${seed}:c`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={Repeat} label="Repeat rate" value={pct(data.repeatRate)} delta={deltaFor(`${seed}:rr`, range)} tone="accent" />
        <KpiTile icon={Users} label="Avg orders / retailer" value={data.avgOrders.toFixed(1)} delta={deltaFor(`${seed}:ao`, range)} tone="neutral" />
        <KpiTile icon={Wallet} label="Revenue / retailer" value={inrCompact(data.arpu)} delta={deltaFor(`${seed}:ar`, range)} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="New vs churned retailers" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.growthTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Line type="monotone" dataKey="New retailers" stroke={SEMANTIC.success} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Churned" stroke={SEMANTIC.danger} strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Retailer segments" subtitle="Registered base by type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.segments} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
                {data.segments.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Retailers"]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Active retailers by state"
          subtitle="Click a state to highlight"
          className="lg:col-span-2"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={compact}
            metricLabel="Active retailers"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <ChartCard title="Top states" subtitle="Active retailers" bodyClassName="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.states.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Retailers"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                {data.states.slice(0, 10).map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEMANTIC.primary}
                    opacity={entry.name === mapState ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <RankTable
        title="Top retailers by purchase value"
        subtitle={rangeLabel(range)}
        rows={data.topRetailers}
        rowKey={(r) => r.name + r.city}
        maxHeightClassName="max-h-96"
        columns={[
          {
            key: "name",
            header: "Retailer",
            render: (r, i) => (
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 text-right text-xs text-gray-400">{i + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-[11px] text-gray-500">{r.city}, {r.state}</div>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <StatusBadge tone={r.active ? "success" : "neutral"} size="sm">
                {r.active ? "Active" : "Dormant"}
              </StatusBadge>
            ),
          },
          { key: "orders", header: "Orders", align: "right", render: (r) => num(r.orders) },
          { key: "gmv", header: "Purchase value", align: "right", render: (r) => inrCompact(r.gmv) },
        ]}
      />
    </DashboardPage>
  );
}
