# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint checks
```

## Architecture

Next.js 16 App Router trading dashboard that imports TradingView CSV exports, matches orders into trades, and displays performance analytics. Single-page client-rendered app with API route handlers and an embedded SQLite database.

### Tech Stack
- **Next.js 16** with App Router, React 19, TypeScript (strict mode)
- **sql.js** (pure JS SQLite, no native bindings) + **Drizzle ORM** for persistence
- **Tailwind CSS v4** (dark theme), **Recharts** for charts, **lucide-react** for icons
- **PapaParse** for CSV parsing

### Data Flow
CSV upload → PapaParse → `processCSV()` inserts into `orders` table → `matchTrades()` pairs entry/exit orders by `position_id` into `trades` table → `saveDb()` writes `trading.db` to disk → client fetches `/api/stats` and `/api/trades` to render dashboard.

### Key Directories
- `src/app/api/` — Route handlers: `upload/`, `stats/`, `trades/`, `clear/`
- `src/components/` — Client components: `FileUpload`, `StatsCard`, `TradesTable`, `PnLChart`, `SymbolStats`
- `src/lib/db.ts` — Singleton SQLite init, table creation, file persistence via `sql.js` export
- `src/lib/schema.ts` — Drizzle ORM schema (tables: `orders`, `trades`, `imports`)
- `src/lib/tradeProcessor.ts` — CSV parsing, order insertion, trade matching logic, stats calculation

### Database
SQLite stored at `trading.db` in project root. Three tables:
- **orders** — Raw CSV data keyed by `order_id`, grouped by `position_id`
- **trades** — Matched entry/exit pairs with computed P&L, duration, exit type
- **imports** — Tracks upload sessions

The database is loaded into memory via `sql.js` on server start and written back to disk after mutations. No migrations — tables are auto-created if missing.

### Path Aliases
`@/*` maps to `./src/*` (configured in tsconfig.json).
