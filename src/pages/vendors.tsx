import { useMemo, useState } from "react";
import {
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
  Building2,
  CheckCircle2,
  Clock,
  Factory,
  Gauge,
  PackageX,
  Truck,
  Warehouse,
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
  VENDOR_TYPES,
  citiesOf,
  deltaFor,
  rand,
  randIn,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  vendorNameOf,
  weightedSplit,
} from "@/lib/mock";

export function Vendors() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [type, setType] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);

  const typeFactor = type === "all" ? 1 : 0.1 + randIn(`vtshare:${type}`, 0.1, 0.4);
  const seed = `ven:${type}`;

  const data = useMemo(() => {
    const total = Math.round(4_820 * typeFactor);
    const active = Math.round(total * randIn(`${seed}:active`, 0.66, 0.76));
    const pending = Math.round(total * randIn(`${seed}:pending`, 0.04, 0.08));
    const newOnboarded = totalFor(`${seed}:new`, range, 6.5 * typeFactor);
    const fillRate = randIn(`${seed}:fill`, 88, 95);
    const slaBreaches = totalFor(`${seed}:sla`, range, 14 * typeFactor);
    const oos = randIn(`${seed}:oos`, 4, 9);

    const onboardTrend = trend(`${seed}:trend`, range, [
      { name: "Wholesale distributors", dailyBase: 2.8 * typeFactor, noise: 0.4 },
      { name: "JIT vendors", dailyBase: 2.2 * typeFactor, noise: 0.4 },
      { name: "Brand sellers", dailyBase: 1.5 * typeFactor, noise: 0.45 },
    ]);
    const typeSplit = weightedSplit("ven:types", 4_820, [
      { name: VENDOR_TYPES[0], weight: 46 },
      { name: VENDOR_TYPES[1], weight: 28 },
      { name: VENDOR_TYPES[2], weight: 18 },
      { name: VENDOR_TYPES[3], weight: 8 },
    ]);
    const fillByType = VENDOR_TYPES.map((t, i) => ({
      name: t,
      value: Math.round(randIn(`ven:fill:${t}`, 84, 97) * 10) / 10,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
    const states = stateSplit(`${seed}:states`, active);
    const topVendors = Array.from({ length: 12 }, (_, i) => {
      const st = states[Math.floor(rand(`${seed}:tv:${i}`) * 6)].name;
      const vt = VENDOR_TYPES[Math.floor(rand(`${seed}:tvt:${i}`) * VENDOR_TYPES.length)];
      return {
        name: vendorNameOf(i),
        city: citiesOf(st)[i % citiesOf(st).length],
        state: st,
        type: vt,
        gmv: Math.round(randIn(`${seed}:tvg:${i}`, 30_00_000, 4_20_00_000) * (1 - i * 0.06)),
        fillRate: Math.round(randIn(`${seed}:tvf:${i}`, 82, 98) * 10) / 10,
        active: rand(`${seed}:tva:${i}`) > 0.1,
      };
    }).sort((a, b) => b.gmv - a.gmv);
    return { total, active, pending, newOnboarded, fillRate, slaBreaches, oos, onboardTrend, typeSplit, fillByType, states, topVendors };
  }, [range, seed, typeFactor]);

  const exportReport = () =>
    downloadCsvSections(`qwipo-vendors-${range.preset}`, [
      {
        title: `Vendors — ${type === "all" ? "All types" : type} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Total vendors", value: data.total },
          { metric: "Active", value: data.active },
          { metric: "Pending onboarding", value: data.pending },
          { metric: "Onboarded in period", value: data.newOnboarded },
          { metric: "Avg fill rate %", value: data.fillRate.toFixed(1) },
          { metric: "SLA breaches", value: data.slaBreaches },
        ],
      },
      { title: "Active vendors by state", rows: data.states.map((s) => ({ state: s.name, vendors: s.value })) },
      { title: "Top vendors", rows: data.topVendors.map((v) => ({ vendor: v.name, type: v.type, city: v.city, state: v.state, gmv: v.gmv, fillRate: v.fillRate })) },
    ]);

  return (
    <DashboardPage
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 w-52 text-xs">
            <SelectValue placeholder="All vendor types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendor types</SelectItem>
            {VENDOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <KpiTile icon={Warehouse} label="Total vendors" value={num(data.total)} delta={deltaFor(`${seed}:t`, range)} tone="primary" />
        <KpiTile icon={CheckCircle2} label="Active" value={num(data.active)} delta={deltaFor(`${seed}:a`, range)} tone="success" />
        <KpiTile icon={Clock} label="Pending onboarding" value={num(data.pending)} delta={deltaFor(`${seed}:p`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={Factory} label="Onboarded in period" value={num(data.newOnboarded)} delta={deltaFor(`${seed}:n`, range)} tone="cyan" />
        <KpiTile icon={Gauge} label="Avg fill rate" value={pct(data.fillRate)} delta={deltaFor(`${seed}:f`, range)} tone="accent" />
        <KpiTile icon={Truck} label="SLA breaches" value={num(data.slaBreaches)} delta={deltaFor(`${seed}:s`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={PackageX} label="Out-of-stock rate" value={pct(data.oos)} delta={deltaFor(`${seed}:o`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={Building2} label="Companies live" value={num(212)} delta={deltaFor(`${seed}:cl`, range)} tone="neutral" sub="across all brands" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Vendor onboarding" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.onboardTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Bar dataKey="Wholesale distributors" stackId="1" fill={CHART_PALETTE[0]} />
              <Bar dataKey="JIT vendors" stackId="1" fill={CHART_PALETTE[1]} />
              <Bar dataKey="Brand sellers" stackId="1" fill={CHART_PALETTE[4]} radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendor mix" subtitle="Network by vendor type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.typeSplit} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
                {data.typeSplit.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Vendors"]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Vendor coverage by state"
          subtitle="Active vendors — click to highlight"
          className="lg:col-span-2"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={num}
            metricLabel="Active vendors"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <ChartCard title="Fill rate by vendor type" subtitle="Ordered vs supplied, period avg" bodyClassName="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.fillByType} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }}>
              <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Fill rate"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                {data.fillByType.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <RankTable
        title="Top vendors by supplied value"
        subtitle={rangeLabel(range)}
        rows={data.topVendors}
        rowKey={(r) => r.name}
        maxHeightClassName="max-h-96"
        columns={[
          {
            key: "name",
            header: "Vendor",
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
          { key: "type", header: "Type", render: (r) => <span className="text-xs text-gray-600">{r.type}</span> },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <StatusBadge tone={r.active ? "success" : "neutral"} size="sm">
                {r.active ? "Active" : "Paused"}
              </StatusBadge>
            ),
          },
          { key: "fill", header: "Fill rate", align: "right", render: (r) => pct(r.fillRate) },
          { key: "gmv", header: "Supplied value", align: "right", render: (r) => inrCompact(r.gmv) },
        ]}
      />
    </DashboardPage>
  );
}
