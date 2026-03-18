# Mental Fitness System

The mental fitness system is a skill-based meditation and mental training tracker. You log sessions, earn XP split across 19 skills, unlock 8 visual themes as you level up, and watch your skills grow (or decay) over time.

---

## How It Works

1. **Pick a practice** from 51 built-in or your own custom practices
2. **Choose an XP preset** (5/10/20/30) based on session intensity
3. **XP splits** 80% to the primary skill, 20% to the secondary (if any)
4. **Streaks and multipliers** boost XP — consecutive days, psychedelic training (10x)
5. **Total XP unlocks themes** — 8 visual levels from anime to cosmic void
6. **Skills decay** if you don't practice them — use it or lose it

---

## Skills & Categories

19 skills organized into 8 categories. Each practice targets a primary skill and optionally a secondary.

| Category | Color | Skills |
|----------|-------|--------|
| Focus | Blue | Focused Attention, Meta Awareness, Deep Work |
| Nonduality | Purple | Natural Flow, Natural Awareness, Nondual Awareness |
| Somatic | Green | Breath Control, Body Awareness |
| Emotional | Pink | Blissful Presence, Emotional Awareness |
| Mental Conditioning | Yellow | Good Traits, Mindset |
| Stamina | Red | Mental Endurance |
| Manifestation | Indigo | Visualization, Subconscious Programming |
| Psychonautics | Teal | Transcendence, Inner Exploration, Lucid Dreaming |

---

## 51 Built-in Practices

Each practice targets a **primary skill** (80% XP) and optionally a **secondary skill** (20% XP). Skills are grouped into categories. Users can also create unlimited custom practices mapped to any skill.

The 51 built-in practices each map to a skill from the table above. See `src/data/mental-fitness.js` for the complete practice list with skill mappings.

---

## XP System

### Presets
| XP | Label | Unlocked At |
|----|-------|-------------|
| 5 | Light | Level 1 |
| 10 | Medium | Level 1 |
| 20 | Heavy | Level 3 |
| 30 | Intense | Level 5 |

### XP Split
- Primary skill gets **80%** of awarded XP
- Secondary skill gets **20%** (if the practice has one)
- Check-ins award a flat **2 XP** with no skill targeting
- **Manifestation practices only**: custom `skillSplits` with up to 3 skills and custom ratios (e.g. 33/33/33, 50/30/20). When `skillSplits` is present on a session, it overrides the standard 80/20 split. This should not be used for other practice categories.

### Streak Multipliers
| Days | Multiplier |
|------|-----------|
| 3 | 1.1x |
| 7 | 1.25x |
| 14 | 1.5x |
| 30 | 2.0x |

Stacks with the psychedelic training multiplier (10x).

### Skill Decay
- **Grace period**: 14 days of no practice on a skill before decay starts
- **Rate**: 0.5% of skill XP per day (compound)
- **Floor**: Never drops below 50% of peak XP

---

## Skill Tiers & Ratings

### 6 Tiers
| Tier | Min XP | Color |
|------|--------|-------|
| Novice | 0 | Gray |
| Developing | 100 | Blue |
| Proficient | 500 | Green |
| Advanced | 1,500 | Yellow |
| Master | 5,000 | Red |
| Diamond | 10,000 | Ice Blue |

### Rating (1-99)
Each skill gets a 1-99 display rating interpolated from XP:
- 0 XP = 1, 100 XP = 15, 500 XP = 35, 1500 XP = 60, 5000 XP = 90, 10000 XP = 99

### Overall Rating
Root Mean Square (RMS) of all 19 skill ratings. Rewards balanced development — being good at many things scores higher than being great at one.

---

## 8 Levels / Themes

Total XP unlocks visual themes that completely transform the UI:

| Level | Name | XP Required | Aesthetic |
|-------|------|-------------|-----------|
| 1 | Awakened | 0 | Anime cel — bold strokes, bouncy animations |
| 2 | Practitioner | 300 | Warm film grain — classic, earthy tones |
| 3 | Adept | 1,000 | Matrix green — tactical HUD, monospace |
| 4 | Warrior | 3,000 | Command room — sepia, wide cinematic panels |
| 5 | Master | 6,000 | Mountain minimalism — gunmetal, clean lines |
| 6 | Legend | 11,000 | Gold transcendence — code rain, bullet-time |
| 7 | Ascended | 18,000 | Knight editorial — serif, canvas textures |
| 8 | Eternal | 28,000 | Cosmic void — star particles, glass, glow |

Each theme defines its own fonts, colors, border styles, animations, and component layouts.

---

## Check-Ins

6 quick micro-exercises that award 2 XP each (no skill targeting):

| Check-In | Animation |
|----------|-----------|
| Check-in with your mind | Glowing border gradient |
| Call Energy back | Floating orbs converge |
| Body Scan | Concentric rings |
| Check in with your senses | Luminous shape blur |
| FitMind Challenge | Electric arc border |
| Psychological Check In | Liquid mirror displacement |

---

## Screens

### Home (Overview)
- Level badge, name, and percentile on bell curve
- XP progress bar to next level
- Brain map (51 practice dots, colored by category)
- Hexagram chart (8 category spider)
- Check-in buttons
- Dev: level preview buttons (seed data)

### Train
- Log Session button (opens practice picker + XP selector)
- Log Psychedelics Training (10x multiplier)
- Streak display
- Check-in buttons
- Recent session history (last 8)

### Stats
- Overall rating (1-99, RMS)
- Summary metrics
- Brain map + hexagram chart
- Full skill breakdown (all 19 skills with rating bars)

---

## API Endpoints

All endpoints are user-scoped via `X-User-Id` header (defaults to Stef).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/mf-sessions` | All sessions + custom practices for user |
| POST | `/api/mf-sessions` | Log a single session |
| POST | `/api/mf-custom-practices` | Create a custom practice |
| POST | `/api/mf-sessions/bulk` | Bulk import (migration/seeding) |

### Session shape
```json
{
  "id": "abc123",
  "timestamp": "2026-03-18T10:00:00Z",
  "practiceId": "tranquil-breathing",
  "practiceName": "Tranquil Breathing",
  "isCustom": false,
  "primarySkill": "breath-control",
  "secondarySkill": null,
  "xpAwarded": 10,
  "baseXp": 10,
  "multiplier": 1,
  "skillSplits": null
}
```

### Custom practice shape
```json
{
  "id": "custom-abc123",
  "name": "Box Breathing 4-4-4-4",
  "primarySkill": "breath-control",
  "secondarySkill": "body-awareness",
  "createdAt": "2026-03-18T10:00:00Z"
}
```

---

## Database Tables

### mf_sessions (append-only)
```
id, user_id, timestamp, practice_id, practice_name, is_custom,
primary_skill, secondary_skill, xp_awarded, base_xp, multiplier,
skill_splits (JSON, manifestation practices only)
```

### mf_custom_practices (persistent)
```
id, user_id, name, primary_skill, secondary_skill, created_at
PK: (user_id, id)
```

---

## File Map

| File | What |
|------|------|
| `src/data/mental-fitness.js` | All constants: skills, categories, practices, XP, tiers, decay |
| `src/theme.jsx` | 8 theme definitions, CSS variables, ThemeProvider |
| `src/components/MentalFitnessTest.jsx` | Main component: state, data loading, 3 screens, log modal |
| `src/components/CheckInScreen.jsx` | 6 check-in animations |
| `src/components/mf-levels.jsx` | Shared UI primitives (cards, buttons, progress bars) |
| `src/components/mf-anime.jsx` | Level 1 theme screens |
| `src/components/mf-film.jsx` | Level 2 theme screens |
| `src/components/mf-ink.jsx` | Level 3 theme screens |
| `src/components/mf-constructivist.jsx` | Level 4 theme screens |
| `src/components/mf-swiss.jsx` | Level 5 theme screens |
| `src/components/mf-scandinavian.jsx` | Level 6 theme screens |
| `src/components/mf-editorial.jsx` | Level 7 theme screens |
| `src/components/mf-cosmic.jsx` | Level 8 theme screens |
| `server/schema.sql` | Table definitions |
| `server/db.js` | Prepared statements + bulk import transaction |
| `server/index.js` | 4 API endpoints |
