# Architecture

## Stack

```
React 18 PWA + Tailwind + Framer Motion
       ↓ (Vite proxy in dev, same server in prod)
Express server (single process)
       ↓
SQLite (better-sqlite3, WAL mode)
       ↑
6 Telegram AI agents via OpenClaw (curl to server)
```

## How It Runs

**Development**: `npm run dev:all` starts Vite on :3002 and Express on :3001. Vite proxies `/api/*` to :3001 (stripping the prefix).

**Production (Railway)**: `npm run build` then `npm start`. Express serves the built frontend from `dist/` and handles API routes. The `/api` prefix is stripped by middleware so routes work in both modes.

## Data Flow

- **Server is the single write authority** — nothing touches SQLite directly
- **Frontend** fetches from `/api/*`, uses optimistic updates + background POST
- **Agents** curl `localhost:3001` (or the Railway URL) with `X-User-Id` header
- **Multi-user**: Every table has `user_id`. Middleware reads `X-User-Id` header, falls back to default user

## Key Conventions

| Pattern | How |
|---------|-----|
| Field whitelisting | `pick(req.body, ALLOWED_FIELDS)` on every POST |
| Case conversion | API: camelCase, DB: snake_case. `rowToApi()` converts |
| Stubs | GETs return default shapes, never 404 |
| Daily data | Keyed by `(user_id, cycle_id)` — one row per cycle |
| Persistent data | Keyed by `(user_id, slug/id)` — spans cycles |
| Append-only logs | Auto-increment or UUID PK, never updated |
| Transactions | `db.transactions.*()` for multi-table writes |
| Timestamps | ISO-8601 strings via `nowIso()` |

## Database

SQLite at `$DATA_DIR/limitless.db` (default: `~/.openclaw/data/shared/limitless.db`).

Schema: `server/schema.sql` — auto-applied on server boot via `CREATE IF NOT EXISTS`.

WAL mode for concurrent reads. Foreign keys enabled.

## Deployment (Railway)

- **Config**: `railway.toml` — nixpacks builder, Node 20, Python + GCC for native deps
- **Build**: `npm install && npm run build`
- **Start**: `npm start` (runs `node server/index.js`)
- **Volume**: Persistent disk at `/data` for SQLite
- **Env var**: `DATA_DIR=/data`
- **Port**: `process.env.PORT` (Railway-assigned)

## Repo Structure

```
src/
  App.jsx                     # Root state, tab routing, server reconciliation
  components/                 # UI components (14+ screens)
  data/                       # Static definitions (routines, mental-fitness skills)
  utils/                      # Haptics, sounds
  theme.jsx                   # 8 visual themes, CSS vars, ThemeProvider
server/
  index.js                    # Express server — all routes (~2200 lines)
  db.js                       # SQLite layer — prepared statements (~600 lines)
  schema.sql                  # Full schema (38 tables)
  data/                       # Static config: badges.json, missions.json, affirmations.json
agents/
  */SOUL.md                   # Agent personality files
docs/
  MENTAL-FITNESS.md           # Mental fitness system docs
  ARCHITECTURE.md             # This file
  DEPLOY.md                   # Deployment guide
  archive/                    # Historical docs
scripts/
  test-mf.sh                  # Mental fitness API test suite
  setup-agents.sh             # Agent workspace setup
  test-integrations.sh        # Integration tests
railway.toml                  # Railway deployment config
CLAUDE.md                     # AI assistant instructions
```

## The 6 Agents

| Agent | Role | Writes To |
|-------|------|-----------|
| Faith | Morning ritual + pre-creative | morning-state, creative-state, sleep-data, votes |
| Ruby | Daytime: meals, decisions, dopamine | nutrition, key-decisions, dopamine, boss-encounters |
| Forge | Work session start/end | work-sessions, votes, midday-checkin |
| Luna | Night routine + vote translation | night-routine, votes |
| Void | VF Game inner work | vf-game, key-decisions, boss-encounters |
| Pulse | Screenshot extraction | sleep-data, fitmind-data, votes |
