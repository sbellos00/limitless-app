# CLAUDE.md — Limitless App

## What This Is

Personal daily operating system for Stef. Tracks the full day: morning ritual, creative blocks, deep work sessions, night routine, mental badges, VF inner game, votes, dopamine, nutrition, sleep. Built by Stratos.

## Architecture

```
React PWA (port 3002) → Vite proxy /api/* → Express file server (port 3001) → JSON files (~/.openclaw/data/shared/)
                                                                              ↑
                                                            6 Telegram AI agents (via OpenClaw) call curl to :3001
```

- **Frontend**: Vite + React 18 + Tailwind CSS + Framer Motion
- **Server**: Single Express file (`server/index.js`, ~1550 lines) — the SINGLE WRITE AUTHORITY for all data
- **Data**: Flat JSON files in `~/.openclaw/data/shared/`. No database (yet — SQLite migration planned, see `server/SQLITE_MIGRATION.md`)
- **Agents**: 6 Telegram bots via OpenClaw gateway. Each has a SOUL.md personality file in `agents/*/SOUL.md`

The file server is the only thing that touches data files. The app goes through the Vite proxy. Agents use curl to localhost:3001. Nothing writes directly to the data dir.

## Stack & Commands

```bash
npm run dev:all    # Start Vite (3002) + Express file server (3001) concurrently
npm run dev        # Vite only
npm run server     # Express file server only
npm run build      # Production build
bash scripts/test-integrations.sh  # Integration tests (requires server running)
```

Dependencies: react 18, framer-motion, express, cors, @radix-ui/react-slider, tailwindcss 3, vite 5.

## Repo Structure

```
src/                          # React app
  App.jsx                     # Root state, tab routing, server reconciliation
  components/                 # 14+ components (MorningRoutine, WorkSessions, NightRoutine, VFGame, etc.)
  data/                       # Morning/night routine item definitions
  utils/                      # Haptics, sounds
server/
  index.js                    # THE server — all routes, helpers, stubs, XP engine (~1550 lines)
  DATA_SCHEMA.md              # Full schema reference for all JSON data types
  SQLITE_MIGRATION.md         # Migration plan: JSON files → SQLite (better-sqlite3)
  SYSTEM_RESEARCH.md          # Analysis of current data layer problems
  data/                       # Static config: badges.json, missions.json, affirmations.json
agents/
  agents.json                 # Agent config reference (no tokens)
  faith/SOUL.md               # Morning ritual + pre-creative agent
  ruby/SOUL.md                # Daytime: meals, decisions, dopamine, screenshots
  forge/SOUL.md               # Work session start/end
  luna/SOUL.md                # Night routine + anytime vote translation
  void/SOUL.md                # VF Game inner work mirror
  pulse/SOUL.md               # Screenshot extraction → data
faith-knowledge/              # Faith's knowledge files (Tolle, Rubin, Clarke, beliefs)
specs/                        # Feature specs (7 written)
scripts/
  setup-agents.sh             # Install agent workspaces + print openclaw.json config
  test-integrations.sh        # Integration test suite
```

## The 6 Agents

| Agent | Role | Reads | Writes |
|-------|------|-------|--------|
| Faith | Morning + pre-creative check-in | morning-state | morning-state, creative-state, sleep-data, votes, events |
| Ruby | Daytime: meals, decisions, dopamine, screenshots | — | nutrition, key-decisions, dopamine/*, boss-encounters, sleep-data, fitmind-data, events |
| Forge | Work session start/end | work-sessions, morning-state, creative-state | work-sessions/*, votes, events, midday-checkin |
| Luna | Night routine + anytime vote translation | morning-state, creative-state, work-sessions, votes, night-routine | night-routine, votes, events |
| Void | VF Game — inner work mirror, key decisions | vf-game, key-decisions, votes, boss-encounters | vf-game, key-decisions, boss-encounters, votes |
| Pulse | Screenshot extraction → data + votes | — | sleep-data, fitmind-data, votes, events |

## Server Data Layer

All runtime data in `~/.openclaw/data/shared/`. Three categories:

1. **Daily files** (reset when date changes): morning-state, creative-state, sleep-data, fitmind-data, work-sessions, votes, nutrition, dopamine, night-routine, midday-checkin, vf-game, badge-daily, episode, key-decisions, morning-block-log, creative-block-log
2. **Persistent files** (survive across days): badge-progress.json, badge-missions.json
3. **Append-only logs** (JSONL): events.jsonl, boss-encounters.jsonl, vf-chapters.jsonl

Day reset: first POST of a new day triggers `archiveDay()` → copies all daily files to `history/YYYY-MM-DD/`, then returns a fresh stub.

Every data type has a hardcoded stub in the STUBS object in server/index.js. GETs always return the stub shape, never 404.

## Key Server Patterns

- `resetForNewDay(name, today)` — archive + reset on date change
- `pick(req.body, ALLOWED_FIELDS)` — field whitelisting on every POST
- `readJson(name)` / `writeJson(name, data)` — sync file I/O
- `readPersistent(name)` / `writePersistent(name, data)` — for badge-progress, badge-missions
- Multi-file routes (key-decisions, boss-encounters, vf-game, badge-progress/exercise, nutrition, dopamine/*) write to 2-3 files — no atomicity guarantee currently
- XP engine: `getTierForXp`, `getStreakMultiplier`, `applyXp`, `updateStreak`

## Frontend Patterns

- No API client layer — every component fetches directly from `/api/*`
- localStorage for instant UX, reconciled against server on mount (server wins)
- Daily reset at 3am clears localStorage
- Components expect specific nested JSON shapes from GETs (documented in DATA_SCHEMA.md)
- Tailwind for styling, Framer Motion for animations, Radix for sliders

## Vote System

Atomic unit of the system. Every agent emits votes. Categories: `mental-power`, `creative-vision`, `physical-mastery`, `social-influence`, `strategic-mind`, `emotional-sovereignty`, `relentless-drive`, `work`, `nutrition`. Polarity: `positive` or `negative` (never neutral). Luna reads all negative votes for the Alter Memories bedtime meditation.

## Mental Badges (7)

rdf, frame-control, fearlessness, aggression, carefreeness, presence, bias-to-action. Each has XP, tiers (Initiate → Master), exercises, missions. Static defs in server/data/badges.json and missions.json.

## Important Rules

- **Never commit tokens** — `~/.openclaw/openclaw.json` contains bot tokens and API keys, never in repo
- **File server is the single write authority** — nothing writes to data dir directly
- **Field whitelisting** — every POST only accepts known camelCase fields via `pick()`
- **camelCase everywhere in API** — server stubs, request bodies, and responses all use camelCase
- **Stubs guarantee shape** — GETs always return valid objects even when empty
- **Port 3001 never public** — always accessed through Vite proxy or localhost curl from agents
- **Daily reset at 3am** — both app localStorage and server day-change logic

## Planned: SQLite Migration

The next major server change is migrating from JSON files to SQLite (`better-sqlite3`). See `server/SQLITE_MIGRATION.md` for full schema, migration script, and route-by-route transformation guide. Key points:
- `better-sqlite3` is synchronous — matches current sync file I/O pattern
- Frontend doesn't change — GET response shapes stay identical
- Eliminates: archiveDay, pruneHistory, resetForNewDay, JSONL parsing
- Enables: cross-day analytics, ACID transactions, proper SQL queries
- DB file: `~/.openclaw/data/shared/limitless.db`

## Documentation Map

| File | What |
|------|------|
| DOCS.md | Full system documentation (architecture, agents, day flow, all endpoints) |
| MANUAL.md | User-facing how-to guide |
| PLAN.md | Dev roadmap + open questions |
| DEPLOY.md | Zero-to-running deployment guide |
| server/DATA_SCHEMA.md | Every JSON data type with field types and examples |
| server/SYSTEM_RESEARCH.md | Analysis of current data layer problems |
| server/SQLITE_MIGRATION.md | Full SQLite migration plan with schema + code |
