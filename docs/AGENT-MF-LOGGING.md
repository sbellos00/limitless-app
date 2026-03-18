# Agent Spec: Mental Fitness Session Logging

You receive a screenshot from the FitMind app showing a completed meditation session. Your job is to extract the practice name and duration, compute XP, and log it to the Limitless system.

---

## Workflow

1. **Extract** the practice name and duration from the screenshot
2. **Look up** the practice in the mappings below (or in `docs/PRACTICE-MAPPINGS.md` for the full list)
3. **GET /mf-stats** to get the user's current level and skill tiers
4. **Compute base XP** from duration, level rate, and skill tier rate
5. **Apply streak multiplier** if the user has an active streak
6. **POST /mf-sessions** with the computed session data

---

## Step 1: Extract from Screenshot

FitMind screenshots typically show:
- **Practice name** (e.g. "Breath Focus A", "Stoic Meditation B", "Yoga Nidra A")
- **Duration** (e.g. "11 min 30 sec", "15 min", "1 hr")
- Sometimes a **course name** (e.g. "FOUNDATIONS - PART 2", "30 DAYS OF BLISS")

Parse the duration into minutes:
- "11 min 30 sec" → 11.5
- "15 min" → 15
- "1 hr" → 60
- "1 hr 15 min 30 sec" → 75.5

---

## Step 2: Match the Practice

Look up the practice name in `docs/PRACTICE-MAPPINGS.md`. The mapping gives you:
- `id` — the practice slug
- `primarySkill` — main skill (gets 80% XP)
- `secondarySkill` — optional (gets 20% XP)
- `skillSplits` — only for manifestation practices (custom ratios)

If the exact name doesn't match, use fuzzy matching. FitMind may display slightly different names than what's in the mappings. Match by closest name.

If you genuinely cannot find a match, ask the user what skill it should map to, then log it as a custom practice.

### Practice categories quick reference

| FitMind Section | Primary Skill (usually) |
|-----------------|------------------------|
| Breath Mastery | breath-control |
| Focus / Foundations Part 1-2 | focused-attention |
| Mindset / Bulletproof Mindset | mindset |
| Good Traits / Fit Traits | good-traits |
| Inner Exploration | inner-exploration |
| Natural Awareness | natural-awareness |
| Natural Flow | natural-flow |
| 30 Days of Bliss | blissful-presence |
| Combat Training | emotional-awareness / inner-exploration |
| The Deep Path | varies (blissful-presence, focused-attention, mental-endurance) |
| Emotional Stability / Dissolving Cravings | emotional-awareness |
| Endurance Training | mental-endurance |
| Sleep & Dreams | body-awareness or lucid-dreaming |
| Mind-Body | body-awareness |
| Timer (Self-Guided) | see rules below |

### Self-guided timer rules
- Under 45 min: primary is `focused-attention` or `inner-exploration` (ask user or default to `focused-attention`)
- 45 min and over: primary is `mental-endurance`, secondary is `focused-attention`

### Manifestation practices
These use custom `skillSplits` instead of primary/secondary. See `docs/PRACTICE-MAPPINGS.md` for the exact ratios. Always include `skillSplits` in the POST body for these.

---

## Step 3: Get Current Stats

```bash
curl GET /mf-stats
```

Response:
```json
{
  "totalXp": 5482,
  "levelIdx": 3,
  "levelName": "Warrior",
  "levelRate": 1.04,
  "streak": 7,
  "totalSessions": 360,
  "skillTiers": {
    "breath-control": { "xp": 200, "tierIdx": 1, "tierName": "Developing", "rate": 0.86 },
    "focused-attention": { "xp": 851, "tierIdx": 2, "tierName": "Proficient", "rate": 1.02 },
    ...
  }
}
```

You need:
- `levelRate` — the user's overall level rate
- `skillTiers[primarySkill].rate` — the primary skill's tier rate
- `streak` — for the streak multiplier

---

## Step 4: Compute Base XP

```
rate = (levelRate + skillTierRate) / 2
baseXP = round(duration_minutes × rate)
```

**Rate ranges (0.7 to 1.5):**

| Overall Level | Rate | | Skill Tier | Rate |
|---------------|------|-|------------|------|
| 1 Awakened | 0.70 | | Novice (0 xp) | 0.70 |
| 2 Practitioner | 0.81 | | Developing (100) | 0.86 |
| 3 Adept | 0.93 | | Proficient (500) | 1.02 |
| 4 Warrior | 1.04 | | Advanced (1500) | 1.18 |
| 5 Master | 1.16 | | Master (5000) | 1.34 |
| 6 Legend | 1.27 | | Diamond (10000) | 1.50 |
| 7 Ascended | 1.39 | | | |
| 8 Eternal | 1.50 | | | |

**For standard practices (primary + optional secondary):**
Use the primary skill's tier rate.

**For manifestation practices (skillSplits):**
Average the tier rates of all skills in the split:
```
avgTierRate = sum(tierRate for each skill in splits) / number of skills
rate = (levelRate + avgTierRate) / 2
baseXP = round(duration_minutes × rate)
```

**Example:**
- User is Level 4 Warrior (rate 1.04)
- Practice: Breath Focus A, 15 min
- Primary skill: focused-attention, Proficient (rate 1.02)
- Combined rate: (1.04 + 1.02) / 2 = 1.03
- Base XP: round(15 × 1.03) = **15 XP**

---

## Step 5: Apply Streak Multiplier

| Streak Days | Multiplier |
|-------------|-----------|
| < 3 | 1.0x (no bonus) |
| 3-6 | 1.1x |
| 7-13 | 1.25x |
| 14-29 | 1.5x |
| 30+ | 2.0x |

```
finalXP = round(baseXP × streakMultiplier)
```

Note: Check-ins do NOT count toward the streak. Only real practice sessions do.

---

## Step 6: POST the Session

### Standard practice:
```bash
curl -X POST /mf-sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "practiceId": "breath-focus-a",
    "practiceName": "Breath Focus A",
    "primarySkill": "focused-attention",
    "secondarySkill": "breath-control",
    "xpAwarded": 19,
    "baseXp": 15,
    "multiplier": 1.25
  }'
```

### Manifestation practice (custom splits):
```bash
curl -X POST /mf-sessions \
  -H 'Content-Type: application/json' \
  -d '{
    "practiceId": "quantum-shift",
    "practiceName": "Quantum Shift",
    "xpAwarded": 21,
    "baseXp": 16,
    "multiplier": 1.25,
    "skillSplits": {
      "visualization": 0.33,
      "inner-exploration": 0.33,
      "subconscious-programming": 0.33
    }
  }'
```

### Response:
```json
{ "ok": true, "id": "generated-uuid" }
```

---

## Complete Example

**Screenshot shows:** "Stoic Meditation A — 16 min"

1. **Match:** Stoic Meditation A → `stoic-meditation-a`, primary: `mindset`, no secondary
2. **GET /mf-stats:** levelIdx 3 (Warrior, rate 1.04), mindset tier: Developing (rate 0.86), streak: 12
3. **Compute:** rate = (1.04 + 0.86) / 2 = 0.95 → base = round(16 × 0.95) = **15 XP**
4. **Streak:** 12 days → 1.25x → final = round(15 × 1.25) = **19 XP**
5. **POST:**
```json
{
  "practiceId": "stoic-meditation-a",
  "practiceName": "Stoic Meditation A",
  "primarySkill": "mindset",
  "xpAwarded": 19,
  "baseXp": 15,
  "multiplier": 1.25
}
```

---

## Edge Cases

- **Unknown practice:** Ask the user what skill it maps to. Log with the user-provided skill.
- **Multiple sessions in one screenshot:** Log each separately.
- **Psychedelic training:** User will tell you explicitly. Apply 10x multiplier on top of everything: `finalXP = round(baseXP × streakMultiplier × 10)`
- **Session already logged:** The API returns 409. Don't retry — the session was already recorded.
- **No duration visible:** Ask the user. Don't guess.

---

## API Reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/mf-stats` | Current level, rates, skill tiers, streak |
| GET | `/mf-sessions` | All sessions + custom practices |
| POST | `/mf-sessions` | Log a session |
| POST | `/mf-custom-practices` | Create a custom practice |
| POST | `/mf-sessions/bulk` | Bulk import sessions |

All endpoints accept `X-User-Id` header (defaults to Stef if omitted).

---

## Key Files

- `docs/PRACTICE-MAPPINGS.md` — Full practice → skill mappings (175 practices)
- `docs/MENTAL-FITNESS.md` — System overview, all skills/categories/tiers
- `src/data/mental-fitness.js` — Source of truth for constants and formulas
