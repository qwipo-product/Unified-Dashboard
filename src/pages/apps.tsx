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
  Activity,
  Download,
  Radio,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
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
import { compact, num, pct } from "@/lib/format";
import { downloadCsvSections } from "@/lib/export";
import { useLiveTick } from "@/lib/use-live";
import {
  APPS,
  DOWNLOAD_SOURCES,
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

export function Apps() {
  const [range, setRange] = useState<DateRange>(() => makeRange("30d"));
  const [app, setApp] = useState<string>("all");
  const [mapState, setMapState] = useState<string | null>(null);
  const { tick } = useLiveTick(4000);

  // App filter scales every metric — "all" is the sum of the fleet.
  const appFactor = app === "all" ? 1 : 0.1 + randIn(`appshare:${app}`, 0.05, 0.3);
  const seed = `apps:${app}`;

  const data = useMemo(() => {
    const downloads = totalFor(`${seed}:downloads`, range, 1_400 * appFactor);
    const newUsers = Math.round(downloads * randIn(`${seed}:signup`, 0.62, 0.74));
    const uninstalls = Math.round(downloads * randIn(`${seed}:uninstall`, 0.16, 0.24));
    const activeUsers = totalFor(`${seed}:active`, range, 2_600 * appFactor);
    const inactiveUsers = Math.round(activeUsers * randIn(`${seed}:inactive`, 0.55, 0.8));
    const firstOrders = Math.round(newUsers * randIn(`${seed}:conv`, 0.38, 0.52));

    const trendData = trend(`${seed}:trend`, range, [
      { name: "Downloads", dailyBase: 1_400 * appFactor },
      { name: "Uninstalls", dailyBase: 290 * appFactor, growth: 0.2 },
    ]);
    const activeTrend = trend(`${seed}:active-trend`, range, [
      { name: "Active users", dailyBase: 2_600 * appFactor, growth: 0.5, noise: 0.1 },
      { name: "New users", dailyBase: 950 * appFactor, noise: 0.22 },
    ]);
    const sources = weightedSplit(`${seed}:sources`, downloads, [
      { name: DOWNLOAD_SOURCES[0], weight: 30 },
      { name: DOWNLOAD_SOURCES[1], weight: 7 },
      { name: DOWNLOAD_SOURCES[2], weight: 26 },
      { name: DOWNLOAD_SOURCES[3], weight: 12 },
      { name: DOWNLOAD_SOURCES[4], weight: 11 },
      { name: DOWNLOAD_SOURCES[5], weight: 6 },
      { name: DOWNLOAD_SOURCES[6], weight: 8 },
    ]);
    const perApp = weightedSplit("apps:per-app", totalFor("apps:downloads", range, 1_400), [
      { name: APPS[0], weight: 46 },
      { name: APPS[1], weight: 9 },
      { name: APPS[2], weight: 16 },
      { name: APPS[3], weight: 7 },
      { name: APPS[4], weight: 12 },
      { name: APPS[5], weight: 10 },
    ]);
    const funnel = [
      { name: "Downloads", value: downloads },
      { name: "Signups", value: newUsers },
      { name: "KYC verified", value: Math.round(newUsers * 0.81) },
      { name: "First order", value: firstOrders },
    ];
    const states = stateSplit(`${seed}:states`, downloads);
    return { downloads, newUsers, uninstalls, activeUsers, inactiveUsers, firstOrders, trendData, activeTrend, sources, perApp, funnel, states };
  }, [range, seed, appFactor]);

  // State drill-down: top pincodes for the selected state (or the top state).
  const drillState = mapState ?? data.states[0]?.name ?? "Telangana";
  const pincodes = useMemo(() => {
    const stateTotal = data.states.find((s) => s.name === drillState)?.value ?? 0;
    const cities = citiesOf(drillState);
    return weightedSplit(`${seed}:pins:${drillState}`, stateTotal,
      Array.from({ length: 8 }, (_, i) => ({ name: pincodeOf(drillState, i), weight: 10 - i })),
    ).map((p, i) => ({
      pincode: p.name,
      area: cities[i % cities.length],
      downloads: p.value,
      active: Math.round(p.value * randIn(`${seed}:pa:${p.name}`, 1.4, 2.4)),
      uninstalls: Math.round(p.value * randIn(`${seed}:pu:${p.name}`, 0.12, 0.28)),
    }));
  }, [data.states, drillState, seed]);

  const liveNow = liveValue(`${seed}:live`, 4_150 * appFactor, tick);
  const conversion = data.downloads > 0 ? (data.firstOrders / data.newUsers) * 100 : 0;
  const dauMau = randIn(`${seed}:daumau`, 24, 38);

  const exportReport = () =>
    downloadCsvSections(`qwipo-app-analytics-${range.preset}`, [
      {
        title: `App analytics — ${app === "all" ? "All apps" : app} — ${rangeLabel(range)}`,
        rows: [
          { metric: "Downloads", value: data.downloads },
          { metric: "New users", value: data.newUsers },
          { metric: "Active users", value: data.activeUsers },
          { metric: "Inactive users", value: data.inactiveUsers },
          { metric: "Uninstalls", value: data.uninstalls },
          { metric: "First orders", value: data.firstOrders },
        ],
      },
      { title: "Downloads by state", rows: data.states.map((s) => ({ state: s.name, downloads: s.value })) },
      { title: "Download sources", rows: data.sources.map((s) => ({ source: s.name, downloads: s.value })) },
      { title: `Top pincodes — ${drillState}`, rows: pincodes },
    ]);

  return (
    <DashboardPage
      range={range}
      onRangeChange={setRange}
      onExport={exportReport}
      filters={
        <Select value={app} onValueChange={setApp}>
          <SelectTrigger className="h-8 w-52 text-xs">
            <SelectValue placeholder="All apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All apps</SelectItem>
            {APPS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        <KpiTile icon={Download} label="Downloads" value={compact(data.downloads)} delta={deltaFor(`${seed}:d`, range)} tone="primary" />
        <KpiTile icon={UserPlus} label="New users" value={compact(data.newUsers)} delta={deltaFor(`${seed}:n`, range)} tone="success" />
        <KpiTile icon={UserCheck} label="Active users" value={compact(data.activeUsers)} delta={deltaFor(`${seed}:a`, range)} tone="cyan" />
        <KpiTile icon={UserMinus} label="Inactive users" value={compact(data.inactiveUsers)} delta={deltaFor(`${seed}:i`, range)} positiveIsGood={false} tone="warning" />
        <KpiTile icon={Trash2} label="Uninstalls" value={compact(data.uninstalls)} delta={deltaFor(`${seed}:u`, range)} positiveIsGood={false} tone="danger" />
        <KpiTile icon={Radio} label="Users online" value={num(liveNow)} sub="right now, live" tone="success" />
        <KpiTile icon={Activity} label="DAU / MAU" value={pct(dauMau)} delta={deltaFor(`${seed}:dm`, range)} tone="accent" />
        <KpiTile icon={Users} label="Download → order" value={pct(conversion)} delta={deltaFor(`${seed}:c`, range)} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Downloads vs uninstalls" subtitle={rangeLabel(range)} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Line type="monotone" dataKey="Downloads" stroke={SEMANTIC.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Uninstalls" stroke={SEMANTIC.danger} strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Download sources" subtitle="Where installs come from">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.sources} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
                {data.sources.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Downloads"]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Active vs new users" subtitle={rangeLabel(range)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.activeTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => num(v)} />
              <Line type="monotone" dataKey="Active users" stroke={SEMANTIC.success} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="New users" stroke={SEMANTIC.accent} strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Downloads by app" subtitle="Fleet split for the period">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.perApp} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} width={124} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Downloads"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.perApp.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activation funnel" subtitle="Download → first order">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v)} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [num(v), "Users"]} />
              <Bar dataKey="value" fill={SEMANTIC.primary} radius={[0, 4, 4, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Downloads by state"
          subtitle="Click a state to drill into its pincodes"
          className="lg:col-span-2"
          bodyClassName="h-[420px]"
        >
          <IndiaMap
            data={toRecord(data.states)}
            format={compact}
            metricLabel="Downloads"
            selected={mapState}
            onSelect={setMapState}
          />
        </ChartCard>

        <RankTable
          title={`Top pincodes — ${drillState}`}
          subtitle="Downloads, active users and uninstalls"
          rows={pincodes}
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
            { key: "dl", header: "Downloads", align: "right", render: (r) => num(r.downloads) },
            { key: "act", header: "Active", align: "right", render: (r) => num(r.active) },
            {
              key: "un",
              header: "Uninstalls",
              align: "right",
              render: (r) => <span className="text-red-600">{num(r.uninstalls)}</span>,
            },
          ]}
        />
      </div>
    </DashboardPage>
  );
}
