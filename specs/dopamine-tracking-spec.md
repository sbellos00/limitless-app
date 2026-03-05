# Dopamine Tracking — Spec

Last updated: 2026-03-04

---

## What Is It

Track and manage dopamine exposure throughout the day. The goal: reduce overstimulation, increase capacity for sustained focus and natural reward.

## Three Mechanisms

### 1. Phone Usage (Screenshot-Based)
- Send a screenshot of phone screen time to Pulse (existing bot)
- Pulse extracts: total screen time, app breakdown, pickups
- Stored in server, feeds into dopamine pillar score
- Daily check-in: once or twice per day (morning for yesterday, evening for today so far)

### 2. Dopamine Farming (Unstimulated Time)
- You're **earning dopamine points** when you're deliberately unstimulated
- Walking without music, sitting without phone, eating without screens
- Log via app: tap "I'm farming" → timer starts → tap "done" → points earned
- Points scale with duration: 5 min = 1 point, 15 min = 3, 30 min = 7, 60 min = 15
- These are positive votes for the dopamine category

### 3. Quick Overstimulation Logging
- Fast toggles for common dopamine hits:
  - 🍬 Sugar
  - 🍺 Alcohol
  - 💦 SR release
  - 📱 Social media binge (beyond normal use)
  - 🎮 Gaming
  - 📺 YouTube/streaming binge
  - ☕ Excessive caffeine
- Each logs a negative vote for dopamine category
- Optional: add notes
- NO shame, NO judgment in the UI. Just data. The system tracks, you decide.

## UI: Dopamine Tab or Section

### In Home Screen
- Dopamine pillar bar (already in StateTab)
- "Farming" quick-start button
- Today's balance: farming points vs overstimulation events

### Dedicated Screen (accessible from home or State tab)

**Top: Today's Dopamine Balance**
- Visual: scale/balance metaphor
- Left side: farming points (green)
- Right side: overstimulation events (red)
- Net score determines the dopamine pillar value

**Middle: Active Farm Timer**
- When farming: big countdown/countup timer
- Ambient color (deep blue/purple — calm)
- Points accumulating in real-time

**Bottom: Quick Log Grid**
- 2×4 grid of overstimulation buttons (emoji + label)
- Tap to log, confirmation haptic
- Today's log below: timestamped list of events

### History
- Daily dopamine scores over time (chart)
- Farming streaks
- Most common overstimulation triggers (helps identify patterns)

## Data Model

### Server: `dopamine.json` (daily)
```json
{
  "date": "2026-03-04",
  "farming": {
    "sessions": [
      {
        "id": "uuid",
        "startedAt": "ISO",
        "endedAt": "ISO",
        "durationMinutes": 30,
        "points": 7
      }
    ],
    "totalPoints": 7,
    "totalMinutes": 30
  },
  "overstimulation": {
    "events": [
      {
        "id": "uuid",
        "timestamp": "ISO",
        "type": "sugar",
        "notes": ""
      }
    ],
    "totalEvents": 1
  },
  "screenTime": {
    "totalMinutes": null,
    "pickups": null,
    "topApps": [],
    "capturedAt": null
  },
  "netScore": 6
}
```

### Server Endpoints (New)
- `GET /dopamine` — today's data
- `POST /dopamine/farm-start` — start farming session
- `POST /dopamine/farm-end` — end farming session, calculate points
- `POST /dopamine/overstimulation` — log an event
- `POST /dopamine/screen-time` — update from Pulse screenshot processing

### Net Score Calculation
- Start at 5 (neutral)
- +1 per 15 farming points
- -1 per overstimulation event
- -1 per 60 min screen time over threshold (configurable, default 120 min)
- Clamped 0-10
- This feeds directly into the dopamine pillar in StateTab

## Votes Generated
- Farming session completed: +1 positive vote (dopamine), weight = points/5
- Overstimulation logged: -1 negative vote (dopamine)
- Screen time under threshold: +1 positive vote (dopamine) at end of day
- Screen time over threshold: -1 negative vote (dopamine) at end of day

## UI Component
- `src/components/DopamineTracker.jsx`
- Accessible as own section in Rest of Day, or sub-section of State tab

## Open Questions
- Screen time threshold — 2 hours? Configurable per person?
- Farming point curve — linear or exponential reward for longer sessions?
- Should the farming timer have ambient sounds (optional)?
- Integration with phone's actual screen time API (future, requires native app)?
