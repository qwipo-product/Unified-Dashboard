import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  CheckCircle2,
  CircleOff,
  Package,
  PackagePlus,
  PackageX,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  BRANDS,
  CATEGORIES,
  COMPANIES,
  deltaFor,
  rand,
  randIn,
  skuNameOf,
  stateSplit,
  toRecord,
  totalFor,
  trend,
  weightedSplit,
} from "@/lib/mock";

export function Skus() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [mapState, setMapState] = useState<string | null>(null);

  const catFactor = category === "all" ? 1 : 0.06 + randIn(`catshare:${category}`, 0.05, 0.22);
  const seed = `sku:${category}`;

  const data = useMemo(() => {
    const totalSkus = Math.round(1_12_000 * catFactor);
    const active = Math.round(totalSkus * randIn(`${seed}:active`, 0.72, 0.79));
    const inactive = totalSkus - active;
    const onboarded = totalFor(`${seed}:onboarded`, range, 180 * catFactor);
    const oos = Math.round(active * randIn(`${seed}:oos`, 0.05, 0.09));
    const unitsSold = totalFor(`${seed}:units`, range, 96_000 * catFactor);

    const onboardTrend = trend(`${seed}:trend`, range, [
      { name: "SKUs onboarded", dailyBase: 180 * catFactor, noise: 0.3 },
      { name: "Deactivated", dailyBase: 40 * catFactor, growth: 0.1, noise: 0.35 },
    ]);
    const categoryShare = weightedSplit("sku:cats", totalFor("sku:units", range, 96_000),
      CATEGORIES.map((c, i) => ({ name: c, weight: 20 - i * 1.5 })),
    ).sort((a, b) => b.value - a.value);
    const topBrands = weightedSplit(`${seed}:brands`, unitsSold,
      BRANDS.slice(0, 10).map((b, i) => ({ name: b, weight: 16 - i })),
    ).sort((a, b) => b.value - a.value).slice(0, 8);
    const topCompanies = weightedSplit(`${seed}:companies`, unitsSold,
      COMPANIES.map((c, i) => ({ name: c, weight: 15 - i })),
    ).sort((a, b) => b.value - a.value).slice(0, 8);

    const topSkus = Array.from({ length: 25 }, (_, i) => {
      const ordered = Math.round(randIn(`${seed}:so:${i}`, 2_000, 42_000) * (1 - i * 0.03));
      const cancelled = Math.round(ordered * randIn(`${seed}:sc:${i}`, 0.02, 0.09));
      return {
        sku: skuNameOf(i),
        code: `SKU-${String(10_000 + i * 37)}`,
        category: CATEGORIES[Math.floor(rand(`${seed}:scat:${i}`) * CATEGORIES.length)],
        ordered,
        cancelled,
        revenue: Math.round(ordered * randIn(`${seed}:sr:${i}`, 80, 900)),
        inStock: rand(`${seed}:ss:${i}`) > 0.08,
      };
    }).sort((a, b) => b.ordered - a.ordered);

    const states = stateSplit(`${seed}:states`, unitsSold);
    return { totalSkus, active, inactive, onboarded, oos, unitsSold, onboardTrend, categoryShare, topBrands, topCompanies, topSkus, states };
  }, [range, seed, catFactor]);

  const filteredSkus = useMemo(() => {
    if (!query.trim()) return data.topSkus;
    const q = query.toLowerCase();
    return data.topSkus.filter(
      (s) => s.sku.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [data.topSkus, query]);

  const exportReport = () =>
    downloadCsvSections(`qwipo-skus-${range.preset}`, [
      {
        title: `SKUs — ${category === "all" ? "All categories" : category} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Total SKUs", value: data.totalSkus },
          { metric: "Active", value: data.active },
          { metric: "Inactive", value: data.inactive },
          { metric: "Onboarded in period", value: data.onboarded },
          { metric: "Out of stock", value: data.oos },
          { metric: "Units sold", value: data.unitsSold },
        ],
      },
      { title: "Top SKUs", rows: data.topSkus.map((s) => ({ sku: s.sku, code: s.code, category: s.category, ordered: s.ordered, cancelled: s.cancelled, revenue: s.revenue })) },
      { title: "Category share (units)", rows: data.categoryShare.map((c) => ({ category: c.name, units: c.value })) },
      { title: "Units by state", rows: data.states.map((s) => ({ state: s.name, units: s.value })) },
    ]);

  return (
    <DashboardPage
      title="SKUs"
      description="Central catalog health and movement across companies and brands"
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile icon={Package} label="Total SKUs" value={compact(data.totalSkus)} delta={deltaFor(`${seed}:t`, range)} tone="primary" />
        <KpiTile icon={CheckCircle2} label="Active" value={compact(data.active)} delta={deltaFor(`${seed}:a`, range)} tone="success" />
        <KpiTile icon={CircleOff} label="Inactive" value={compact(data.inactive)} delta={deltaFor(`${seed}:i`, range)} positiveIsGood={false} tone="neutral" />
        <KpiTile icon={PackagePlus} label="Onboarded in period" value={compact(data.onboarded)} delta={deltaFor(`${seed}:n`, range)} tone="cyan" />
        <KpiTile icon={PackageX} label="Out of stock" value={compact(data.oos)} delta={deltaFor(`${seed}:o`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={Boxes} label="Units sold" value={compact(data.unitsSold)} delta={deltaFor(`${seed}:u`, range)} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Catalog movement" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.onboardTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Line type="monotone" dataKey="SKUs onboarded" stroke={SEMANTIC.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Deactivated" stroke={SEMANTIC.danger} strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category share" subtitle="Units sold, sorted descending">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryShare.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Units"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {data.categoryShare.slice(0, 8).map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top brands" subtitle="Units sold in period">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topBrands} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Units"]} />
              <Bar dataKey="value" fill={SEMANTIC.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top companies" subtitle="Units sold in period">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topCompanies} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Units"]} />
              <Bar dataKey="value" fill={SEMANTIC.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Units sold by state"
          subtitle="Where the selected catalog moves"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={compact}
            metricLabel="Units"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <RankTable
          title="Top SKUs"
          subtitle="Ordered, cancelled and revenue per SKU"
          className="lg:col-span-2"
          rows={filteredSkus.slice(0, 25)}
          rowKey={(r) => r.code}
          maxHeightClassName="max-h-[420px]"
          action={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SKU, code, category"
                className="h-8 w-56 pl-8 text-xs"
              />
            </div>
          }
          columns={[
            {
              key: "sku",
              header: "SKU",
              render: (r, i) => (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 text-right text-xs text-gray-400">{i + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{r.sku}</div>
                    <div className="font-mono text-[10px] text-gray-500">{r.code} · {r.category}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "stock",
              header: "Stock",
              render: (r) => (
                <StatusBadge tone={r.inStock ? "success" : "danger"} size="sm">
                  {r.inStock ? "In stock" : "Out of stock"}
                </StatusBadge>
              ),
            },
            { key: "ordered", header: "Ordered", align: "right", render: (r) => num(r.ordered) },
            {
              key: "cancelled",
              header: "Cancelled",
              align: "right",
              render: (r) => (
                <span className="text-red-600">
                  {num(r.cancelled)}{" "}
                  <span className="text-[10px] text-gray-400">({pct((r.cancelled / Math.max(1, r.ordered)) * 100)})</span>
                </span>
              ),
            },
            { key: "revenue", header: "Revenue", align: "right", render: (r) => inrCompact(r.revenue) },
          ]}
        />
      </div>

      {data.topSkus.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium">{data.topSkus[0].sku}</span> is the top mover
            {mapState ? ` — strongest in ${mapState}` : ` — strongest in ${data.states[0]?.name}`} for {rangeLabel(range).toLowerCase()}.
          </span>
        </div>
      )}
    </DashboardPage>
  );
}
