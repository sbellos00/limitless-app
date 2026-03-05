# Limitless System — Full Documentation

**Last updated:** 2026-03-05
**Built by:** Stratos
**Repo:** github.com/stratosokaramanis-droid/limitless-app

---

## 1. What This Is

Limitless is a personal daily operating system for Stef. It structures the entire day — morning ritual, pre-creative check-in, deep work sessions, night routine, bed routine — and tracks state across sleep, nutrition, dopamine, mood, mental development, and inner work.

The system has three layers:

1. **A React PWA** — accessed from Stef's phone via Cloudflare tunnel
2. **AI agents on Telegram** — 6 specialized agents, each with a distinct role and personality
3. **An Express file server** — the single write authority that bridges everything

There is no traditional database. The backend is a set of **shared JSON files** on the local machine. The file server is the only thing that reads from and writes to these files. Both the app and the agents go through the file server API.

---

## 2. Architecture

```
                      ┌─────────────────────────────────┐
                      │         STEF'S PHONE             │
                      │                                  │
                      │  ┌────────────────┐              │
                      │  │  Limitless App │              │
                      │  │  (React PWA)   │              │
                      │  └───────┬────────┘              │
                      │          │ Cloudflare tunnel      │
                      └──────────┼───────────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │   React Dev Server (Vite)      │
                    │   localhost:3002               │
                    │   Proxy: /api/* → :3001        │
                    └────────────┬──────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │   EXPRESS FILE SERVER          │
                    │   localhost:3001               │
                    │   ★ SINGLE WRITE AUTHORITY ★   │
                    │   All reads and writes go here │
                    └────────────┬──────────────────┘
                                 │ reads/writes
                    ┌────────────▼──────────────────┐
                    │   SHARED DATA LAYER            │
                    │   ~/.openclaw/data/shared/     │
                    └────────────┬──────────────────┘
                                 │ via curl to :3001
   ┌──────┬────────┬──────┬──────┼──────┬──────┐
   │      │        │      │      │      │      │
 Faith  Ruby   Forge   Luna   Void  Pulse  Stratos
  🕊️    💎     ⚡      🌙     🪞    📊     🤙
```

### The Golden Rule

**The file server is the only thing that touches the data files.**

- The app calls `POST /api/<endpoint>` through the Vite proxy → file server writes
- Agents call `curl -X POST http://localhost:3001/<endpoint>` → file server writes
- Agents call `curl http://localhost:3001/<endpoint>` to read
- Nothing writes to `~/.openclaw/data/shared/` directly. Ever.

This prevents race conditions, ensures day-reset logic always runs, preserves historical archives, and validates all input through field whitelists.

---

## 3. The Agents

All agents run inside **OpenClaw** (AI gateway daemon). Each has its own Telegram bot, workspace, and personality defined in `SOUL.md`.

### Agent Summary

| Agent | ID | Bot | Model | Role |
|-------|-----|-----|-------|------|
| 🕊️ Faith | `faith` | — | claude-opus-4-6 | Morning ritual + pre-creative block check-in (dual mode) |
| 💎 Ruby | `ruby` | — | claude-opus-4-6 | Daytime: meals, key decisions, dopamine, screenshots, general chat |
| ⚡ Forge | `work-session` | `@limitless_forge_bot` | gpt-5.2 | Work session start/end → scores + votes |
| 🌙 Luna | `night-routine` | `@limitless_luna_bot` | claude-opus-4-6 | Night routine + planning + anytime vote translation |
| 🪞 Void | `vf-game` | — | claude-opus-4-6 | VF Game — inner work mirror, key decisions |
| 📊 Pulse | `limitless-state` | `@limitless_pulse_bot` | gpt-5.2 | Screenshot extraction → data + votes |
| 🤙 Stratos | `stratos` | `@OStratosOKaramanisBot` | claude-sonnet-4-6 | Builder/engine. Not part of daily loop. |

### Agent Personalities

- **Faith** — calm, warm, present. A little playful when it calls for it. Meets you exactly where you are. Draws from Tolle, Rubin, Clarke, and Stef's own beliefs. Never therapy-speak.
- **Ruby** — casual, attentive friend. Listens more than she talks. Catches patterns. Logs things naturally without making it feel clinical. Your connective tissue between blocks.
- **Forge** — direct. No warmup. "Session 1. What are we building?" A training partner, not a cheerleader. Honest scores, no softening.
- **Luna** — calm, honest, unhurried. Reflects on the full day. Guides the close. Translates anything you tell her into votes, anytime.
- **Void** — the mirror. Minimal. Precise. One question at a time. Sits with discomfort. Makes the conviction scores meaningful by exploring first.
- **Pulse** — pure sensor. Extracts numbers from screenshots, stores them, moves on. No commentary.

### Agent Knowledge Files

**Faith:**
- `knowledge/power-of-now.md` — Tolle. For overthinking, anxiety, scatter.
- `knowledge/the-creative-act.md` — Rubin. For creative block, resistance.
- `knowledge/katie-clarke-40-minutes.md` — Clarke framework. For fear, self-doubt.
- `knowledge/katie-clarke-video-game.md` — Clarke levels. For feeling stuck.
- `knowledge/beliefs.md` — Stef's own beliefs. For reflection.

**Void:**
- `knowledge/life-is-a-video-game-summary.md` — Core Katie Clarke framework.
- `knowledge/life-is-a-video-game-full.md` — Full transcript reference.

### Agent Read/Write Matrix

| Agent | Reads | Writes |
|-------|-------|--------|
| Faith | `/morning-state` (to detect check-in type) | `/morning-state`, `/creative-state`, `/sleep-data`, `/votes`, `/events` |
| Ruby | — | `/nutrition`, `/key-decisions`, `/dopamine/*`, `/boss-encounters`, `/sleep-data`, `/fitmind-data`, `/events` |
| Forge | `/work-sessions`, `/morning-state`, `/creative-state` | `/work-sessions/start`, `/work-sessions/end`, `/votes`, `/events`, `/midday-checkin` |
| Luna | `/morning-state`, `/creative-state`, `/work-sessions`, `/votes`, `/night-routine` | `/night-routine`, `/votes`, `/events` |
| Void | `/vf-game`, `/key-decisions`, `/votes`, `/boss-encounters` | `/vf-game`, `/key-decisions`, `/boss-encounters`, `/votes` |
| Pulse | — | `/sleep-data`, `/fitmind-data`, `/votes`, `/events` |

---

## 4. How a Full Day Works

### Morning — Faith (dual mode)

Faith detects what kind of check-in is needed by reading `GET /morning-state`:
- If `date` is NOT today → **Morning Check-In**
- If `date` IS today → **Pre-Creative Block Check-In**

**Morning Check-In:**
1. Greets warmly. Asks how he's feeling, how he slept.
2. Shares a quote calibrated to his mood (from knowledge files).
3. Sends him toward reading (The Creative Act or Power of Now).
4. Links to the app.
5. Writes: `/morning-state` (energy, clarity, emotional state, morning score) + `/sleep-data` (if sleep mentioned) + `/votes` + `/events`.

**Pre-Creative Block Check-In:**
1. Quick energy read after morning routine.
2. Sets intention for the creative block.
3. One line to send him in.
4. Writes: `/creative-state` + `/events`.

### Daytime — Ruby

Ruby is always available. No structured check-in — she's just there.

She logs:
- **Meals** → `/nutrition` (estimates nutrition score 1-10)
- **Key decisions** → `/key-decisions` (with type + multiplier: resist 3x, persist 2x, face-boss 5x, etc.)
- **Dopamine events** → `/dopamine/overstimulation` or `/dopamine/farm-start/end`
- **Screenshots** → extracts Sleep Cycle, FitMind, or screen time data via vision
- **Boss encounters** → `/boss-encounters`
- **Notable moments** → `/events`

She fills the space between all the structured agents. Pure connective tissue.

### Work Sessions — Forge

Three 90-minute deep work sessions.

**Session start** — DM Forge:
- "Session [N]. What are we building?"
- Extracts focus + evaluation criteria
- POSTs to `/work-sessions/start`

**Session end** — DM Forge:
- "Session done. What happened?"
- Extracts outcomes, scores flow and results
- `outcomeScore` (1-10) + `flowScore` (1-10) → `compositeScore = outcome × 0.6 + flow × 0.4`
- POSTs to `/work-sessions/end` + `/votes` + `/events`

### Anytime — Luna (Vote Translation)

Luna isn't just for the night routine. Message her any time of day — a win, a slip, a weird moment, whatever. She listens, acknowledges, and translates it into votes.

Vote categories: `mental-power`, `creative-vision`, `physical-mastery`, `social-influence`, `strategic-mind`, `emotional-sovereignty`, `relentless-drive`.

### Anytime — Void (Key Decisions + VF Game)

Void handles two things:

**Key decisions (anytime):**
When you face or overcome a resistance pattern — log it. Void acknowledges it with weight, logs via `/key-decisions`, moves on.

**VF Game (user-triggered only):**
End-of-day inner work exploration. For each affirmation, Void asks "sit with this — what comes up?" before asking for a conviction score. Makes the score mean something.

### Night Routine — Luna

Luna opens with one sentence reading the full day from API data. Then guides:
1. Letting Go meditation
2. Nervous system regulation
3. Next-day planning (real dialogue → written plan)
4. Bed: read prompts, affirmations, Alter Memories (negative votes from the day)

---

## 5. The VF Game

User-triggered conviction tracking centered on the 7 badge identity statements. The exploration comes before the score.

### Flow (via Void)

1. Void reads today's key decisions and votes for context.
2. For each affirmation: "Sit with this: *[statement]*. What comes up?"
3. Explores resistance, numbness, openness — asks one question at a time.
4. THEN: asks for conviction score (1-10). Now it means something.
5. Surfaces key decisions as evidence connected to each affirmation.
6. Optional: names and logs boss encounters that surfaced.
7. Brief close.
8. Submits via `POST /vf-game`.

### XP Impact

| Conviction | Effect |
|-----------|--------|
| ≥ 8 | +10 XP for that badge |
| 4-7 | No change |
| ≤ 3 | -5 XP (can't go below 0) |

### Key Decision Multipliers

| Type | Multiplier | When |
|------|-----------|------|
| `resist` | 3x | Resisted urge/addiction/habit |
| `persist` | 2x | Kept going when wanted to stop |
| `reframe` | 2x | Stepped back from negative loop |
| `ground` | 2x | Breathed through overwhelm |
| `face-boss` | 5x | Confronted a resistance pattern directly |
| `recenter` | 2x | Called energy back |

---

## 6. The Mental Badges System

A skill tree for 7 mental capabilities. Exercises, missions, XP progression, boss encounters.

### The 7 Badges

| Badge | Slug | Identity Statement |
|-------|------|--------------------|
| Reality Distortion Field | `rdf` | "I am someone whose conviction reshapes the environment around me." |
| Frame Control | `frame-control` | "My frame is mine. No one enters it without my permission." |
| Fearlessness | `fearlessness` | "I move toward what scares me. Fear is my compass, not my cage." |
| Aggression | `aggression` | "I refuse to be domesticated. My intensity comes from love for what could be." |
| Carefreeness | `carefreeness` | "I play full out and hold on to nothing. Life is a game I'm winning by enjoying." |
| Presence | `presence` | "I am here. Fully. The present moment is the only place where life actually happens." |
| Bias to Action | `bias-to-action` | "I move. While others plan, I act. Speed is my weapon. Momentum is my fuel." |

### Tier Progression

| Tier | Name | XP Required |
|------|------|-------------|
| 1 | Initiate | 0 |
| 2 | Apprentice | 750 |
| 3 | Practitioner | 3,000 |
| 4 | Adept | 10,000 |
| 5 | Master | 30,000 |

### XP Economy

| Source | XP |
|--------|-----|
| Exercise completed | +5 |
| Mission success | +15 to +100 (scales with tier) |
| Mission fail | +3 to +20 (you tried) |
| VF conviction ≥ 8 | +10 |
| VF conviction ≤ 3 | -5 |
| Boss encounter logged | +25 |

Streak multipliers: 7 days = 1.25x, 14 days = 1.5x, 30 days = 2.0x.

Static definitions: `server/data/badges.json` (35 exercises), `server/data/missions.json` (105 missions).

---

## 7. The File Server

**Location:** `~/limitless-app/server/index.js`
**Port:** 3001
**Start:** `npm run server` or `npm run dev:all`

### Design Principles

1. **Single write authority** — the ONLY process that writes to `~/.openclaw/data/shared/`
2. **Field whitelisting** — every POST endpoint only accepts known fields
3. **Idempotent archiving** — day transition archives yesterday's data exactly once
4. **Request logging** — all POST requests logged with timestamp and field keys
5. **Crash protection** — `uncaughtException` and `unhandledRejection` handlers

### Work Session Actions

When Forge asks "What are we building?", the focus maps to one of 8 defined categories:

**HyperSpace Creative Work** — content, briefs, prototypes, designs, experiments
**Greatness Work** — Game of Greatness missions + development
**Caldera Work** — client work, LinkedIn outreach, onboarding, growth, UpWork
**Side-projects Work** — Limitless, Game of Greatness, UpWork Engine, White Mirror, etc.
**Business Work** — meetings, hiring, market research, pitch decks, investing
**Creative Exploration** — free design, references, mood boarding, intentional rabbit holes
**Admin Work** — email, scheduling, invoicing, systems (CRMs, AI, automations)
**Management Work** — strategy, financials, team syncs, delegation, project review

Full list: `server/data/work-session-actions.md`

### Key Endpoints

#### Read (GET)

| Endpoint | Returns |
|----------|---------|
| `GET /health` | Server status, uptime, data dir |
| `GET /morning-state` | Today's morning check-in (Faith) |
| `GET /creative-state` | Today's pre-creative check-in (Faith) |
| `GET /sleep-data` | Today's sleep data |
| `GET /fitmind-data` | Today's FitMind data |
| `GET /work-sessions` | Today's work sessions (Forge) |
| `GET /votes` | Today's all votes |
| `GET /night-routine` | Tonight's night routine progress |
| `GET /nutrition` | Today's meals (Ruby) |
| `GET /dopamine` | Today's dopamine tracking (Ruby) |
| `GET /key-decisions` | Today's key decisions (Ruby/Void) |
| `GET /boss-encounters` | All boss encounters (append-only) |
| `GET /vf-game` | Today's VF Game sessions (Void) |
| `GET /badge-progress` | Cumulative badge XP and tiers |
| `GET /badge-missions` | Active + completed missions |
| `GET /badge-daily` | Today's badge exercises and attempts |
| `GET /badges` | All badge definitions + exercises |
| `GET /history` | List of archived dates |
| `GET /history/:date` | All files for a specific date |

#### Write (POST)

| Endpoint | Called by |
|----------|----------|
| `POST /morning-state` | Faith |
| `POST /creative-state` | Faith |
| `POST /sleep-data` | Faith, Ruby, Pulse |
| `POST /fitmind-data` | Ruby, Pulse |
| `POST /nutrition` | Ruby, Forge |
| `POST /key-decisions` | Ruby, Void |
| `POST /dopamine/overstimulation` | Ruby |
| `POST /dopamine/farm-start` | Ruby |
| `POST /dopamine/farm-end` | Ruby |
| `POST /dopamine/screen-time` | Ruby, Pulse |
| `POST /boss-encounters` | Ruby, Void, Luna |
| `POST /vf-game` | Void |
| `POST /work-sessions/start` | Forge |
| `POST /work-sessions/end` | Forge |
| `POST /midday-checkin` | Forge |
| `POST /votes` | All agents |
| `POST /events` | All agents |
| `POST /night-routine` | Luna |
| `POST /badge-progress/exercise` | Any agent |
| `POST /badge-missions/assign` | Any agent / user-triggered |
| `POST /badge-missions/complete` | Any agent |

### Day Reset Logic

Every POST handler calls `resetForNewDay(fileName, today)`:
1. Read current file. If `data.date !== today`:
   - Archive all files to `history/YYYY-MM-DD/` (idempotent — skips if exists)
   - Return fresh stub with `date = today`
2. If `data.date === today`: return existing data.

---

## 8. The Shared Data Layer

**Directory:** `~/.openclaw/data/shared/`

Full schema with all fields and types: see `server/DATA_SCHEMA.md`.

### File Overview

| File | Reset | Written by |
|------|-------|-----------|
| `morning-state.json` | Daily | Faith |
| `creative-state.json` | Daily | Faith |
| `sleep-data.json` | Daily | Faith, Ruby, Pulse |
| `fitmind-data.json` | Daily | Ruby, Pulse |
| `work-sessions.json` | Daily | Forge |
| `votes.json` | Daily | All agents |
| `nutrition.json` | Daily | Ruby, Forge |
| `dopamine.json` | Daily | Ruby |
| `night-routine.json` | Daily | Luna |
| `midday-checkin.json` | Daily | Forge |
| `vf-game.json` | Daily | Void |
| `badge-daily.json` | Daily | Badge XP engine |
| `badge-progress.json` | **Persistent** | Badge XP engine |
| `badge-missions.json` | **Persistent** | Badge mission engine |
| `episode.json` | Daily | (episode framing — spec written, not yet live) |
| `events.jsonl` | Append-only | All agents |
| `boss-encounters.jsonl` | Append-only | Ruby, Void, Luna |

---

## 9. The Vote System

Every agent (except Void — votes auto-generated from key decisions) emits votes. Luna reads them for Alter Memories at bedtime.

### Vote Shape

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "action": "Short description",
  "category": "mental-power",
  "polarity": "positive",
  "source": "forge",
  "weight": 1
}
```

### Vote Categories

`mental-power` | `creative-vision` | `physical-mastery` | `social-influence` | `strategic-mind` | `emotional-sovereignty` | `relentless-drive` | `work` | `nutrition`

### Rules

- Neutral = don't store. Only signal.
- Polarity is binary: `positive` or `negative`.
- Luna surfaces all negative votes for the Alter Memories meditation.

---

## 10. The React App

**Stack:** Vite + React 18 + Tailwind CSS + Framer Motion
**Port:** 3002
**Access:** https://the-limitless-system.work

### Tabs

| Tab | Icon | What it shows |
|-----|------|--------------|
| Today / Flow | 🌅 | Morning → creative → work sessions → night → bed (sequential flow) |
| State | 📊 | 4-pillar energy bar (sleep, nutrition, dopamine, mood) |
| Badges | 🏅 | 7 badges, XP bars, tiers, streaks, active missions |
| Stats | ⚡ | Vote breakdown by category, source, timeline |

### App State

- **localStorage** for instant UX. Reconciled against server on mount (server wins on conflict).
- **Daily reset at 3am** — all localStorage state clears.

### Source Files

```
src/
├── App.jsx                   ← root state, tab routing, reconciliation
├── components/
│   ├── BottomNav.jsx
│   ├── MorningRoutine.jsx    ← morning card flow
│   ├── HabitCard.jsx         ← hold-to-confirm, skip
│   ├── CompletionScreen.jsx  ← post-morning summary
│   ├── CreativeBlock.jsx     ← timer
│   ├── WorkSessions.jsx      ← 3×90min sessions, timers, Forge links
│   ├── NightRoutine.jsx      ← night + bed items, Luna links
│   ├── VFGame.jsx            ← VF Game UI (sliders, sessions)
│   ├── StateTab.jsx          ← 4-pillar energy bar
│   ├── BadgesTab.jsx         ← badge progression
│   ├── BadgeDetailSheet.jsx  ← badge detail + missions
│   ├── MentalGame.jsx        ← Mental Game screen
│   ├── HomeScreen.jsx        ← home dashboard
│   ├── DashboardTab.jsx
│   ├── HistoryTab.jsx
│   ├── DopamineTracker.jsx
│   ├── EpisodeBar.jsx        ← episode framing bar
│   └── DayCountdownBar.jsx
├── data/
│   ├── morningRoutine.js     ← the 9 morning items
│   └── nightRoutine.js       ← the 7 night/bed items
server/
├── index.js                  ← the file server
├── DATA_SCHEMA.md            ← full data schema reference
└── data/
    ├── affirmations.json     ← VF Game affirmation statements
    ├── badges.json           ← 7 badge definitions + 35 exercises
    ├── missions.json         ← 105 pre-written missions
    ├── badge-progress.json        ← seeded empty progress (for fresh install)
    └── work-session-actions.md    ← all available work session action types (8 categories)
```

---

## 11. Infrastructure

### Running the System

```bash
# Start OpenClaw (all agents)
openclaw gateway start

# Start app + file server
cd ~/limitless-app
npm run dev:all
# → App: http://localhost:3002
# → File server: http://localhost:3001
```

### Integration Tests

```bash
cd ~/limitless-app
npm run server &
bash scripts/test-integrations.sh
# 89/89 passing
```

### Historical Snapshots

When a new day triggers a reset, yesterday's data is archived:

```
~/.openclaw/data/shared/history/
├── 2026-03-04/
│   ├── morning-state.json
│   ├── votes.json
│   └── ... (all daily files)
```

Queryable via `GET /history`, `GET /history/:date`, `GET /history/:date/:file`.

### Cloudflare Tunnel

`the-limitless-system.work` → `localhost:3002`

Three things must be running:
1. `npm run dev:all` (app :3002 + file server :3001)
2. `openclaw gateway start`
3. `cloudflared` systemd service

### OpenClaw Config

Config: `~/.openclaw/openclaw.json` (chmod 600, never in git)

Each agent has:
- Entry in `agents.list` with `id`, `name`, `workspace`, `model`, `identity`
- Entry in `channels.telegram.accounts` with bot token + allowFrom

Account key in `accounts` maps directly to the `agentId` it routes to.

See `agents/agents.json` for the config reference (tokens excluded).
See `DEPLOY.md` for full setup instructions.

---

## 12. Repo Structure

```
limitless-app/
├── README.md               ← brief intro
├── DOCS.md                 ← this file
├── MANUAL.md               ← user-facing how-to
├── DEPLOY.md               ← deployment guide (zero to running)
├── PLAN.md                 ← dev roadmap + open questions
├── agents/
│   ├── agents.json         ← agent config reference
│   ├── faith/SOUL.md
│   ├── ruby/SOUL.md
│   ├── forge/SOUL.md
│   ├── luna/SOUL.md
│   ├── pulse/SOUL.md
│   ├── void/SOUL.md
│   └── void/knowledge/     ← Katie Clarke framework files
├── faith-knowledge/        ← Faith's knowledge files (Tolle, Rubin, Clarke, beliefs)
├── specs/                  ← feature specs (7 written)
│   ├── daytime-agent-spec.md
│   ├── dopamine-tracking-spec.md
│   ├── episode-framing-spec.md
│   ├── home-screen-spec.md
│   ├── mental-game-spec.md
│   ├── night-routine-rebuild-spec.md
│   └── vf-game-spec.md
├── scripts/
│   ├── setup-agents.sh     ← installs agent workspaces + prints openclaw.json snippets
│   └── test-integrations.sh
├── server/
│   ├── index.js
│   ├── DATA_SCHEMA.md      ← full data schema
│   └── data/               ← static config (badges, missions, affirmations)
└── src/                    ← React app
```

---

## 13. Build Status

| Component | Status |
|-----------|--------|
| Express file server (all endpoints, validation, archiving) | ✅ |
| Shared data layer (16 files + 2 append-only) | ✅ |
| Faith agent (dual-mode: morning + pre-creative) | ✅ |
| Ruby agent (daytime: meals, key decisions, dopamine, screenshots) | ✅ |
| Forge agent (work sessions → scores + votes) | ✅ |
| Luna agent (night routine + anytime vote translation) | ✅ |
| Void agent (VF Game mirror + key decisions) | ✅ |
| Pulse agent (screenshot extraction → data + votes) | ✅ |
| All 6 Telegram bots wired | ✅ |
| App: morning routine cards | ✅ |
| App: creative block view | ✅ |
| App: work sessions (3×90min, timers) | ✅ |
| App: night + bed routine (hold-to-confirm, Luna links) | ✅ |
| App: State tab (4 pillars + composite) | ✅ |
| App: Badges tab (7 badges, XP, tiers, streaks, missions) | ✅ |
| App: Stats tab (vote breakdown, timeline, source) | ✅ |
| App: VF Game UI (sliders, multi-session, resistance + conviction) | ✅ |
| Mental Badges: 7 badges, 35 exercises, 105 missions | ✅ |
| Mental Badges: XP engine (exercises, missions, streaks, multipliers) | ✅ |
| Mental Badges: Tier progression (5 tiers, 30K XP cap) | ✅ |
| VF Game: conviction tracking + vote generation | ✅ |
| VF Game: XP impact (bonus/penalty by conviction score) | ✅ |
| Key Decisions: type system + multipliers | ✅ |
| Boss encounters: logging + XP reward (+25) | ✅ |
| Historical snapshots + /history endpoints | ✅ |
| Integration tests (89/89) | ✅ |
| Cloudflare tunnel (the-limitless-system.work) | ✅ |
| Agent SOUL.md files in repo | ✅ |
| Agent knowledge files in repo | ✅ |
| DATA_SCHEMA.md | ✅ |
| DEPLOY.md | ✅ |
| Session reset at 3am | ✅ |
| Episode framing (spec written) | 🔲 |
| Home screen dashboard (spec written) | 🔲 |
| Mental Game screen (spec written) | 🔲 |
| Night routine rebuild (spec written) | 🔲 |
| Multi-user support | 🔲 |
| Desktop dashboard | 🔲 |

---

## 14. Key File Reference

| File | Purpose |
|------|---------|
| `~/.openclaw/openclaw.json` | OpenClaw config — agents, bots, auth (never in git) |
| `~/.openclaw/data/shared/` | Live data directory |
| `~/.openclaw/data/shared/history/` | Daily archives |
| `~/.openclaw/agents/*/workspace/SOUL.md` | Agent personalities + operating instructions |
| `~/limitless-app/server/index.js` | The file server |
| `~/limitless-app/server/DATA_SCHEMA.md` | Full data schema reference |
| `~/limitless-app/server/data/badges.json` | Badge definitions + exercises (static) |
| `~/limitless-app/server/data/missions.json` | 105 pre-written missions (static) |
| `~/limitless-app/server/data/affirmations.json` | VF Game affirmation statements (static) |
| `~/limitless-app/agents/agents.json` | Agent config reference (tokens excluded) |
| `~/limitless-app/DEPLOY.md` | Full deployment guide |
| `~/limitless-app/PLAN.md` | Dev roadmap |
