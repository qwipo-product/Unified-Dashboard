# Qwipo Unified Dashboard (Command Center)

One management-level dashboard for the entire Qwipo network — ONDC seller
store, Qwipo 2.0 (JIT), buyer apps, sales app, WhatsApp/Paytm channels and
logistics — in a single React + TypeScript web app built on the Qwipo design
system. Works as a desktop web app and as an always-on wall/Android-TV view
(live counters keep refreshing on every tab).

## Run

```bash
npm install
npm run dev        # http://localhost:5180
```

Sign in with any valid Indian mobile number; the demo OTP is **123456**
(see `src/lib/auth-context.tsx` — swap `requestOtp`/`verifyOtp` with the real
auth API).

## Tabs

| Tab | What it answers |
|---|---|
| Overview | Company-wide pulse: GMV, orders, retailers, vendors, downloads, live in-flight orders, revenue map |
| App analytics | Downloads, new/active/inactive users, uninstalls, sources, activation funnel, per-app split, state → pincode drill-down |
| Orders | Order flow by status, live order feed, funnel, cancellation reasons, channel split, state map |
| Retailers | Base growth, active/inactive, churn risk, segments, top retailers, state map |
| Vendors | Wholesalers / JIT vendors / brand sellers, onboarding, fill rate, SLA, coverage map |
| SKUs | Catalog health, top SKUs (ordered/cancelled/revenue), category/brand/company leaders, units by state |
| Logistics | Trips, routes, on-time %, fulfilment mode split (2.0 fleet / distributor self / 3PL), live trip board |
| Sales & revenue | Revenue vs previous period, target attainment, channel/category revenue, state → pincode drill-down |

Every tab shares the same controls: date presets (Today / 7D / 30D / 90D /
1Y / All / custom range), page-specific filters, CSV **Export**, a **Live**
indicator, dark/light theme, and a clickable **India map** (state-wise
choropleth; clicking a state filters the neighbouring drill-down tables).

## Architecture

```
src/
  components/
    app-shell.tsx        ← Qwipo DS shell (sidebar + header), copied from the registry
    ui/                  ← Qwipo DS primitives (shadcn/Radix), copied from the registry
    dashboard/           ← shared dashboard kit built for this app
      dashboard-page.tsx   page anatomy: PageHeader → sticky FilterBar → content
      filter-bar.tsx       date presets + custom range + filters + export + live chip
      kpi-tile.tsx         DS "KPI tile" pattern with delta chip + sparkline
      chart-card.tsx       card wrapper for every recharts chart
      india-map.tsx        state-wise choropleth (tooltip, click-to-drill, legend)
      rank-table.tsx       dense "top N" leaderboard card
      palette.ts           canonical CHART_PALETTE + theme-aware chart styles
  lib/
    mock.ts              ← THE data layer today: seeded, deterministic mock engine
    date-range.ts          range model shared by filters and the engine
    use-live.ts            heartbeat for live counters / feeds
    export.ts              CSV download helpers
    auth-context.tsx       mobile + OTP auth (demo verification)
    india-map-data.ts      generated SVG paths for all 36 states/UTs
  pages/                 ← one file per tab + login
```

### Wiring real data later

Pages never invent numbers — they call `totalFor / trend / stateSplit /
weightedSplit / liveValue` from `src/lib/mock.ts` with a metric key and the
selected `DateRange`. Each of those functions maps 1:1 to a query (SQL /
API endpoint); replace the body, keep the signature, and every dashboard
lights up with production data. `useLiveTick` becomes the polling or
websocket refresh trigger.

### Design system

Tokens come from `@qwipo/tokens` (vendored in `vendor/qwipo-tokens` and
installed via `file:`, keeping the repo self-contained); components were
copied from that repo's registry (`registry/qwipo/ui` + `blocks`). Charts use
the canonical 8-color palette; dark mode is the DS `.dark` re-binding — no
per-page theme code.

The India map was generated from open-source state boundaries
(udit-001/india-maps-data, districts dissolved to states with mapshaper) into
`src/lib/india-map-data.ts` — no runtime geo dependency.
