> **OUTDATED** — This doc describes the old JSON-file / date-keyed architecture. The system now uses SQLite with cycle-based keys (`cycle_id` FK to `day_cycles`). See `schema.sql` for the current source of truth.

# Limitless System — Data Schema (ARCHIVED)

All runtime data lives in `~/.openclaw/data/shared/` (configurable via `DATA_DIR` env var).
Each file resets daily (keyed by `date: YYYY-MM-DD`) except JSONL files which are append-only.

---

## morning-state.json
Faith writes this at the end of the morning check-in.

```json
{
  "date": "YYYY-MM-DD",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "energyScore": 7,           // 1-10
  "mentalClarity": 8,         // 1-10
  "emotionalState": "rested", // grounded | rested | scattered | fired-up | low-but-clear | flat | etc
  "insights": [],             // string[]
  "dayPriority": null,        // string | null
  "resistanceNoted": null,    // boolean | null
  "resistanceDescription": null, // string | null
  "overallMorningScore": 8,   // 1-10
  "rawNotes": "..."           // free-form summary of conversation
}
```

---

## creative-state.json
Faith writes this at the end of the pre-creative block check-in.

```json
{
  "date": "YYYY-MM-DD",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "activities": [],           // string[]
  "energyScore": null,        // 1-10
  "creativeOutput": null,     // string | null
  "insights": [],             // string[]
  "nutrition": {
    "logged": false,
    "meal": null,
    "notes": ""
  },
  "nutritionScore": null,     // 1-10 | null
  "dopamineQuality": null,    // string | null
  "moodShift": null,          // description of energy shift since morning
  "rawNotes": ""
}
```

---

## sleep-data.json
Written by Faith (manual) or Ruby/Pulse (screenshot extraction).

```json
{
  "date": "YYYY-MM-DD",
  "createdAt": "ISO-8601",
  "source": "manual",         // "manual" | "sleep-cycle"
  "hoursSlept": 8,            // number
  "quality": "good",          // "good" | "great" | "decent" | "poor"
  "sleepScore": null,         // number | null (from Sleep Cycle app)
  "wakeUpMood": "groggy",     // "rested" | "tired" | "groggy" | "energized"
  "notes": "...",
  "rawExtracted": {}          // raw data from screenshot extraction
}
```

---

## work-sessions.json
Forge writes this on session start/end.

```json
{
  "date": "YYYY-MM-DD",
  "sessions": [
    {
      "id": 1,                      // session number (1, 2, 3)
      "startedAt": "ISO-8601",
      "endedAt": "ISO-8601",
      "durationMinutes": 90,
      "focus": "...",               // what was being worked on
      "evaluationCriteria": "...",  // how success was defined upfront
      "outcomes": "...",            // what actually happened
      "outcomeScore": 7,            // 1-10
      "flowScore": 8,               // 1-10
      "compositeScore": 7.4,        // outcomeScore*0.6 + flowScore*0.4
      "meal": null,                 // string | null
      "nutritionScore": null,       // 1-10 | null
      "notes": ""
    }
  ],
  "totalSessions": 3,
  "completedSessions": 1,
  "lunchBreakLogged": false,
  "lunchMeal": null,
  "lunchNutritionScore": null
}
```

---

## night-routine.json
Luna writes this throughout the night routine.

```json
{
  "date": "YYYY-MM-DD",
  "startedAt": "ISO-8601",
  "completedAt": null,
  "windDown": {
    "lettingGoCompleted": false,
    "lettingGoTimestamp": null,
    "nervousSystemCompleted": false,
    "nervousSystemTimestamp": null,
    "bodyScanCompleted": false,
    "bodyScanTimestamp": null
  },
  "reflection": {
    "alterMemoriesCompleted": false,
    "alterMemoriesTimestamp": null,
    "dayReviewCompleted": false,
    "dayReviewTimestamp": null
  },
  "planning": {
    "planCompleted": false,
    "planTimestamp": null,
    "planText": "",
    "planFinalized": false,
    "planFinalizedTimestamp": null
  },
  "bed": {
    "promptsReviewed": false,
    "promptsTimestamp": null,
    "vfGameCompleted": false,
    "visualizationCompleted": false,
    "affirmationsReviewed": false,
    "affirmationsTimestamp": null,
    "alterMemoriesCompleted": false,
    "alterMemoriesTimestamp": null
  }
}
```

---

## votes.json
Any agent can write votes. Luna reads them for the alter memories / vote summary.

```json
{
  "date": "YYYY-MM-DD",
  "votes": [
    {
      "id": "uuid",
      "timestamp": "ISO-8601",
      "action": "Short description of what happened",
      "category": "mental-power", // see categories below
      "polarity": "positive",     // "positive" | "negative"
      "source": "forge",          // which agent wrote it
      "weight": 1                 // multiplier (1 = standard, 2-5 = key decisions)
    }
  ]
}
```

**Vote categories:**
- `mental-power` — conviction, frame control, presence, mental toughness
- `creative-vision` — creative output, taste, originality, creative courage
- `physical-mastery` — training, nutrition, sleep discipline, energy management
- `social-influence` — communication, leadership, social courage, connection
- `strategic-mind` — planning, execution, decision-making, pattern recognition
- `emotional-sovereignty` — emotional regulation, self-awareness, inner peace
- `relentless-drive` — discipline, consistency, work ethic, bias to action
- `work` — general work output (Forge)
- `nutrition` — food quality (Forge, Ruby, Faith)

---

## nutrition.json
Ruby and Forge write meals here.

```json
{
  "date": "YYYY-MM-DD",
  "meals": [
    {
      "id": "uuid",
      "timestamp": "ISO-8601",
      "meal": "chicken, rice, broccoli",
      "time": "lunch",              // "breakfast" | "lunch" | "dinner" | "snack"
      "nutritionScore": 8,          // 1-10
      "notes": ""
    }
  ],
  "averageScore": 7.5,
  "totalMeals": 2
}
```

---

## dopamine.json
Ruby and Pulse write here.

```json
{
  "date": "YYYY-MM-DD",
  "farming": {
    "sessions": [
      {
        "id": "uuid",
        "startedAt": "ISO-8601",
        "endedAt": "ISO-8601",
        "durationMinutes": 20
      }
    ],
    "totalPoints": 0,
    "totalMinutes": 0
  },
  "overstimulation": {
    "events": [
      {
        "id": "uuid",
        "timestamp": "ISO-8601",
        "type": "streaming",        // sugar | alcohol | social-media | gaming | streaming | caffeine | sr
        "notes": ""
      }
    ],
    "totalEvents": 0
  },
  "screenTime": {
    "totalMinutes": null,
    "pickups": null,
    "topApps": [
      { "name": "YouTube", "minutes": 60 }
    ],
    "capturedAt": null
  },
  "netScore": 5                     // computed composite score
}
```

---

## vf-game.json
Void (and Luna during night VF) write sessions here.

```json
{
  "date": "YYYY-MM-DD",
  "sessions": [
    {
      "id": "uuid",
      "timestamp": "ISO-8601",
      "presenceScore": 8,           // 1-10
      "bossEncountered": null,      // string description | null
      "keyDecisionsLinked": [],     // string[] of key decision IDs
      "closing": "",               // what landed at end of session
      "notes": "",
      "affirmations": [
        {
          "index": 0,              // affirmation index from affirmations.json
          "convictionScore": 7,    // 1-10
          "exploration": "...",    // what came up during exploration
          "resistance": "..."      // any resistance noted
        }
      ]
    }
  ]
}
```

---

## fitmind-data.json
Pulse or Ruby write after FitMind screenshot.

```json
{
  "date": "YYYY-MM-DD",
  "createdAt": "ISO-8601",
  "source": "fitmind",        // "fitmind" | "manual"
  "workoutCompleted": true,
  "duration": 15,             // minutes
  "type": "meditation",       // string
  "score": 85,                // app score if available
  "notes": ""
}
```

---

## badge-progress.json
Written by the badge XP engine. Persistent (not daily reset).

```json
{
  "lastUpdated": "ISO-8601",
  "badges": {
    "rdf": {
      "tier": 1,                    // 1-5
      "tierName": "Initiate",       // Initiate | Practitioner | Adept | Expert | Master
      "xp": 210,
      "exercisesCompleted": 14,
      "missionsCompleted": 2,
      "missionsFailed": 0,
      "bossEncounters": 0,
      "currentStreak": 1,
      "longestStreak": 1,
      "lastActivityDate": "YYYY-MM-DD"
    }
    // ... one entry per badge slug
  }
}
```

**Badge slugs:** `rdf` | `frame-control` | `fearlessness` | `aggression` | `carefreeness` | `presence` | `bias-to-action`

---

## badge-missions.json
Active missions assigned for the day.

```json
{
  "lastAssigned": "YYYY-MM-DD",
  "active": [
    {
      "missionId": "fear-t1-wrong-in-public",
      "badgeSlug": "fearlessness",
      "title": "Wrong in Public",
      "description": "...",
      "successCriteria": "...",
      "rewardXp": 15,
      "failXp": 3,
      "minTier": 1,
      "assignedAt": "ISO-8601",
      "status": "pending",          // "pending" | "completed" | "failed"
      "completedAt": null,
      "xpAwarded": 0
    }
  ]
}
```

---

## badge-daily.json
Daily exercise and mission log (resets each day).

```json
{
  "date": "YYYY-MM-DD",
  "exercises": [
    {
      "badgeSlug": "rdf",
      "exerciseId": "rdf-taste-training",
      "timestamp": "ISO-8601",
      "xpGained": 5
    }
  ],
  "missionsAttempted": [
    {
      "missionId": "...",
      "badgeSlug": "...",
      "success": true,
      "xpGained": 15,
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

## morning-block-log.json / creative-block-log.json
Simple progress logs for the morning and creative blocks.

```json
{
  "date": "YYYY-MM-DD",
  "startedAt": "ISO-8601",
  "completedAt": null,
  "items": [
    { "id": "item-id", "status": "done", "timestamp": "ISO-8601" }
  ],
  "completedCount": 2,
  "skippedCount": 0
}
```

---

## midday-checkin.json

```json
{
  "date": "YYYY-MM-DD",
  "triggeredAt": "ISO-8601",
  "energyScore": 7,           // 1-10
  "notes": "...",
  "rawNotes": ""
}
```

---

## episode.json
Episode framing — the narrative layer on the day.

```json
{
  "date": "YYYY-MM-DD",
  "number": null,             // episode number
  "title": "",
  "previouslyOn": "",         // recap of yesterday
  "todaysArc": "",            // the narrative arc for today
  "plotPoints": [],           // string[] — key moments
  "rating": null,             // 1-10
  "status": "open"            // "open" | "closed"
}
```

---

## JSONL files (append-only, not daily reset)

### events.jsonl
```json
{ "timestamp": "ISO-8601", "source": "forge", "type": "session_completed", "payload": { ... } }
```
Event types: `morning_completed` | `creative_block_started` | `session_completed` | `state_updated` | `notable`

### boss-encounters.jsonl
```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "type": "conversation",     // "conversation" | "text" | "image"
  "title": "The Avoidance Loop",
  "content": "Full description of the resistance pattern",
  "faced": true,
  "badgeSlug": "fearlessness" // optional
}
```

---

## Static config files (in `server/data/`, versioned in repo)

- `affirmations.json` — VF Game affirmation statements (array of strings)
- `badges.json` — Badge definitions: slugs, names, tiers, exercises, missions
- `missions.json` — Full mission list with XP values
- `badge-progress.json` — Seeded with empty progress on fresh install
