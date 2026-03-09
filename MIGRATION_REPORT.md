# Migration Report: Calendar Dates → Day Cycles

**Branch:** `redesign`
**Date:** 2026-03-09

## Overview

The runtime codebase (server, DB layer, frontend) has been migrated from calendar-date-based daily data (`YYYY-MM-DD` strings, `todayStr()`, `3am` resets) to a **cycle-based system** where a "day" is defined by `POST /day-cycle/start` and ends via `POST /day-cycle/end` or auto-expiry after 24 hours. No timezone dependencies remain in the runtime path.

The old migration script (`migrate-to-sqlite.js`) was **not updated** — it still references the old date-keyed schema. It has been removed from `package.json` since the data was nuked and the DB will be recreated fresh by the server on boot.

---

## Files Changed

### Backend (3 runtime files + 4 housekeeping)

| File | What Changed |
|------|-------------|
| `server/schema.sql` | Every daily table: `date TEXT` → `cycle_id TEXT REFERENCES day_cycles(id)`. Added `day_cycles` table. `badge_progress.last_activity_date` → `last_cycle_number`. |
| `server/db.js` | ~35 prepared statements: `WHERE date = ?` → `WHERE cycle_id = ?`, `ON CONFLICT(user_id, date)` → `ON CONFLICT(user_id, cycle_id)`. Added 6 `dayCycle*` statements. |
| `server/index.js` | Eliminated `todayStr()`. Added `getActiveCycleId()` (with 24h auto-expire), `getOrCreateCycleId()`, `getCycleNumber()`. 4 new endpoints. All stubs: `date: null` → `cycleId: null`. All routes use cycle lookup. History routes now `/history/:cycleId`. |
| `package.json` | Removed `migrate` script (points to dead code). |
| `server/DATA_SCHEMA.md` | Marked OUTDATED/ARCHIVED. |
| `server/SQLITE_MIGRATION.md` | Marked OUTDATED/ARCHIVED. |
| `server/SYSTEM_RESEARCH.md` | Marked OUTDATED/ARCHIVED. |

### Frontend (8 files)

| File | What Changed |
|------|-------------|
| `src/App.jsx` | Removed 3am reset logic. Added `cycleId`/`cycleStart` to STORAGE_KEYS. `handleStartDay` calls `POST /day-cycle/start` — no local-only fallback (if server is down, day doesn't start). `doEndDay` calls `POST /day-cycle/end`. Mount reconciles via `GET /day-cycle`. `clearDayState()` clears VF cycle keys too. |
| `src/components/VFGame.jsx` | 3 localStorage keys renamed: `limitless_vf_completed_date` → `limitless_vf_completed_cycle`, `limitless_vf_penalty_date` → `limitless_vf_penalty_cycle`, `limitless_vf_skipped` stores cycle ID. Penalty check reads `limitless_cycle_id` + `limitless_cycle_start` instead of `limitless_day_start`. |
| `src/components/HomeScreen.jsx` | `dopamine?.date` → `dopamine?.cycleId` |
| `src/components/MorningRoutine.jsx` | Removed `toISOString().slice(0,10)`. Check `d?.cycleId` instead of `d?.date === today`. |
| `src/components/NightRoutine.jsx` | `data.date !== today` guard → `!data.cycleId` |
| `src/components/WorkSessions.jsx` | `data.date !== today` guard → `!data.cycleId` |
| `src/components/DashboardTab.jsx` | Same as MorningRoutine — `d?.cycleId` check. |
| `src/components/HistoryTab.jsx` | Full rewrite: state uses cycle objects `{id, cycleNumber, startedAt}` instead of date strings. Trend bar iterates cycles. API calls use `/history/:cycleId/...`. Labels format from `startedAt` timestamps. Empty state text updated (removed "3am" reference). |

---

## Audit Results

| Layer | Status | Details |
|-------|--------|---------|
| `schema.sql` | Clean | 0 `date` columns in daily tables. All 23+ use `cycle_id` FK. |
| `db.js` | Clean | 0 `@date` params. 0 `WHERE date =`. 82 `cycle_id` references. |
| `server/index.js` | Clean | 0 `todayStr()`. 0 `.toISOString().slice(0,10)`. All stubs use `cycleId`. |
| `src/` (all files) | Clean | 0 date-string generation. 0 old localStorage keys. 0 `data.date` checks. |
| `migrate-to-sqlite.js` | Dead code | Still uses old `date` columns. Removed from `package.json`. Not updated — would need a rewrite if ever needed again. |

---

## Database Status

The old `limitless.db` (date-keyed schema) was moved to `limitless.db.old-date-schema`. The server will create a fresh DB with the cycle-based schema on next boot.

---

## New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/day-cycle` | Returns active cycle for the user (or `{active: false}`) |
| `GET` | `/day-cycles` | Returns all cycles for the user |
| `POST` | `/day-cycle/start` | Creates a new cycle, returns `{ok: true, cycle: {...}}` |
| `POST` | `/day-cycle/end` | Ends the active cycle |

---

## Key Server Helpers

```js
// Returns the active cycle ID or null. Auto-expires cycles older than 24h.
getActiveCycleId(userId)

// Returns active cycle ID or creates a new one (backwards-compatible for agents).
getOrCreateCycleId(userId)

// Returns the cycle_number for streak calculations.
getCycleNumber(userId, cycleId)
```

---

## How to Verify Manually

### 1. Start the app
The old DB has been removed. The server will create a fresh one on boot.

```bash
npm run dev:all
```

### 2. Test the day cycle flow
- Open the app — no day should be active
- Press **Start Day** — should call `POST /api/day-cycle/start` and show the countdown bar
- Check `localStorage` in DevTools: should see `limitless_cycle_id` (a UUID) and `limitless_cycle_start` (a timestamp)
- Refresh the page — should reconcile via `GET /api/day-cycle` and restore the active cycle

### 3. Test data scoping
- Navigate to each tab (Home, Focus, Mental, Dopamine) — data should load or show empty stubs
- Log a dopamine farming session or overstimulation — check the Home screen shows the dopamine meters
- Do the VF Game — after saving, `limitless_vf_completed_cycle` should appear in localStorage with the cycle ID (not a date)

### 4. Test day end
- Press **End Day** — should call `POST /api/day-cycle/end`, clear all localStorage keys, and reset to morning routine
- All VF cycle keys should be gone from localStorage

### 5. Test History tab
- After completing at least one cycle, the History tab should show cycle entries with dates derived from `startedAt` timestamps
- Clicking a cycle should load its vote/sleep/morning/work data

### 6. Test server-authority
- Kill the server, try pressing Start Day — should fail silently (no local-only cycle created)
- Restart the server — app should show no active day until you explicitly start one

### 7. Test agent compatibility
- Agent POST requests should auto-create a cycle via `getOrCreateCycleId()` if none exists
- Check the server console for proper cycle creation logs

---

## Known Limitations

- **`migrate-to-sqlite.js`**: Dead code — still references old `date` columns. Would need a full rewrite to work with cycle-based schema. Removed from `package.json` but file kept in repo for reference.
- **DevPanel presets**: Manipulate localStorage directly. They use correct key names but don't create server-side cycles. Intentional — dev presets are for frontend-only state simulation.
- **Old localStorage keys**: If a browser had `limitless_vf_completed_date` / `limitless_vf_penalty_date` from before, they'll be ignored. They won't cause bugs, just sit unused.
- **CLAUDE.md**: Still references old date-based architecture in some spots. Should be updated separately.
