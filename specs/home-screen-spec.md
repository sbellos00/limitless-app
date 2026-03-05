# Home Screen / Dashboard — Spec

Last updated: 2026-03-04

---

## Problem

No single view that shows where you stand. You have to navigate to different tabs to piece together your state. Need one screen that tells the whole story at a glance.

## Design Principle

This is the first thing you see when you open the app. It should be **motivating**, not overwhelming. One number tells you the headline. Everything else supports it.

## Layout (Mobile-First)

### Hero: VF Score
- Big number, center screen. Today's composed VF Score (0-10).
- Color gradient based on score: red (0-3) → amber (4-6) → green (7-10)
- Subtle animation — pulses or glows
- Below it: small text showing trend (↑ 0.8 from yesterday, or ↓ 1.2)
- Tap to expand into component breakdown (conviction, resistance, key decisions, boss encounters, presence)

### Section 1: Current State
- 4 pillars from StateTab (Sleep, Dopamine, Mood, Nutrition) as compact bars
- Composite state score next to VF Score — the outer game vs inner game

### Section 2: Today's Key Decisions
- Count + total multiplied weight
- Last key decision logged (description + type icon)
- Quick-add button to log a new one (opens modal)

### Section 3: VF Game Status
- Resistance/conviction heatmap — 12 affirmations as small colored dots or bars
  - Color = resistance level (green=low, red=high)
  - Brightness/opacity = conviction level
- Shows at a glance which affirmations need work
- Tap any to open VF Game at that affirmation

### Section 4: Day Progress
- Timeline showing phases completed: Morning ✓ → Creative → Work → Night → VF Game
- 24h countdown bar (existing DayCountdownBar, but integrated)

### Section 5: Chapter Log
- Latest chapter title + date
- "Chapter 12: The one where it started clicking"
- Tap to see full chapter history (scrollable)

### Section 6: Streak / Consistency
- Days played (VF Game completed)
- Current streak
- Longest streak
- This is NOT "streaks are everything" — it's just data. Votes not streaks.

## Desktop Optimization (Later)

Side-by-side layout:
- Left column: VF Score hero + state pillars + day progress
- Right column: Key decisions feed + affirmation heatmap + chapters
- Full-width bottom: historical charts (VF Score over time, resistance trends per affirmation)

## Data Sources

All data already exists in the server:
- `GET /vf-score` → hero score + components
- `GET /key-decisions` → today's decisions
- `GET /vf-game` → sessions with affirmation scores
- `GET /morning-state` → sleep, dopamine, mood, nutrition
- `GET /vf-chapters?limit=1` → latest chapter

## Component

`src/components/HomeScreen.jsx` — new component, becomes the default view (replaces current DashboardTab or becomes a new tab).

## Navigation

Home icon in BottomNav. This is tab 0 — the landing page.

## Open Questions

- Does this replace DashboardTab entirely or live alongside it?
- Historical charts — how far back? 7 days? 30 days? All time?
- VF Score trend calculation — compare to yesterday? 7-day average?
