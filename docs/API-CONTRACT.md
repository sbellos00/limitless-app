# Mental Fitness API Contract

Base URL: `https://limitless-app-production.up.railway.app`

## Authentication

Every request MUST include:
- `X-API-Key: <key>` — rejects with 401 if missing or wrong
- `X-User-Id: <uuid>` — identifies the user. Stef: `00000000-0000-0000-0000-000000000001`, John: `00000000-0000-0000-0000-000000000002`

---

## POST /mf-sessions

Log a single mental fitness session.

### Request Headers

```
Content-Type: application/json
X-API-Key: <key>
X-User-Id: <uuid>
```

### Request Body — Field Reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `practiceId` | string | **YES** | — | Practice slug (e.g. `"breath-focus-a"`, `"quantum-shift"`). Only field that causes 400 if missing. |
| `practiceName` | string | no | copies `practiceId` | Human-readable name (e.g. `"Breath Focus A"`) |
| `primarySkill` | string | no | `null` | Skill slug (e.g. `"focused-attention"`). Required for standard practices. Omit for manifestation practices that use `skillSplits`. |
| `secondarySkill` | string/null | no | `null` | Optional second skill. Set to `null` if none. |
| `xpAwarded` | integer | no | `0` | Final XP after all multipliers. This is what gets stored and summed. |
| `baseXp` | integer/null | no | `null` | XP before multipliers. Informational only — not used in calculations. |
| `multiplier` | number/null | no | `null` | Total multiplier applied (e.g. `1`, `1.25`, `10`, `12.5`). Informational only. |
| `skillSplits` | object/null | no | `null` | Custom XP distribution for manifestation practices. Keys are skill slugs, values are ratios that should sum to ~1.0. When present, `primarySkill`/`secondarySkill` are ignored for XP computation. |
| `isCustom` | boolean | no | `false` | Whether this is a user-created custom practice. |
| `id` | string | no | auto-generated UUID | Client-provided ID. If omitted, server generates a UUID. |
| `timestamp` | string (ISO 8601) | no | current server time | When the session occurred. Format: `"2026-03-18T10:00:00Z"` |

### Field Whitelisting

The server runs `pick(body, allowedFields)` — any fields NOT in the list above are silently dropped. Unknown fields do NOT cause errors.

### Validation Rules

- Missing `practiceId` → **400** `{"error": "practiceId required"}`
- Duplicate `id` → **409** `{"error": "Session already exists", "id": "..."}`
- Missing API key → **401** `{"error": "Invalid or missing API key"}`
- All other fields are optional and default to null/0/false

### Success Response

```json
{"ok": true, "id": "generated-or-provided-id"}
```

### Example — Standard Practice

```bash
curl -X POST https://limitless-app-production.up.railway.app/mf-sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
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

Response: `{"ok":true,"id":"a1b2c3d4-..."}`

### Example — Manifestation Practice (custom skillSplits)

```bash
curl -X POST https://limitless-app-production.up.railway.app/mf-sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "practiceId": "quantum-shift",
    "practiceName": "Quantum Shift",
    "xpAwarded": 150,
    "baseXp": 15,
    "multiplier": 10,
    "skillSplits": {
      "visualization": 0.33,
      "inner-exploration": 0.33,
      "subconscious-programming": 0.33
    }
  }'
```

Response: `{"ok":true,"id":"e5f6g7h8-..."}`

---

## GET /mf-stats

Returns the user's current level, XP rates, streak, and all skill tiers. Use this to compute XP before posting a session.

### Request

```bash
curl https://limitless-app-production.up.railway.app/mf-stats \
  -H "X-API-Key: <key>" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"
```

### Response

```json
{
  "totalXp": 1638,
  "levelIdx": 2,
  "levelName": "Adept",
  "levelRate": 0.93,
  "streak": 1,
  "totalSessions": 103,
  "skillTiers": {
    "focused-attention": {"xp": 208, "tierIdx": 1, "tierName": "Developing", "rate": 0.86},
    "meta-awareness": {"xp": 145, "tierIdx": 1, "tierName": "Developing", "rate": 0.86},
    "deep-work": {"xp": 0, "tierIdx": 0, "tierName": "Novice", "rate": 0.7},
    ...
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalXp` | integer | Sum of all `xpAwarded` across all sessions |
| `levelIdx` | integer (0-7) | Current level index |
| `levelName` | string | Level name: Awakened, Practitioner, Adept, Warrior, Master, Legend, Ascended, Eternal |
| `levelRate` | number | XP rate for this level (0.7–1.5) |
| `streak` | integer | Consecutive days with at least one non-checkin session |
| `totalSessions` | integer | Count of non-checkin sessions |
| `skillTiers` | object | Map of all 18 skill slugs to `{xp, tierIdx, tierName, rate}` |

---

## GET /mf-sessions

Returns ALL sessions and custom practices for the user.

### Request

```bash
curl https://limitless-app-production.up.railway.app/mf-sessions \
  -H "X-API-Key: <key>" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"
```

### Response

```json
{
  "sessions": [
    {
      "id": "stef-f-01",
      "timestamp": "2026-02-01T08:00:00Z",
      "practiceId": "tour-your-mind",
      "practiceName": "Tour Your Mind",
      "isCustom": false,
      "primarySkill": "meta-awareness",
      "secondarySkill": null,
      "xpAwarded": 4,
      "baseXp": 4,
      "multiplier": 1,
      "skillSplits": null
    }
  ],
  "customPractices": [
    {
      "id": "custom-abc123",
      "name": "Box Breathing",
      "primarySkill": "breath-control",
      "secondarySkill": null,
      "createdAt": "2026-03-18T10:00:00Z"
    }
  ]
}
```

Sessions are ordered by timestamp ascending. Use this to verify a session was stored after posting.

---

## Deduplication

- **Unique key**: The `id` field is the primary key. Two sessions with the same `id` cannot coexist regardless of user.
- **Duplicate POST**: Returns **409** `{"error": "Session already exists", "id": "..."}`. The original session is NOT modified.
- **No idempotency key**: If you omit `id`, the server generates a new UUID every time — so repeated POSTs without `id` will create duplicate sessions.
- **Recommendation**: Always generate a deterministic `id` client-side (e.g. `"agent-stef-2026-03-18T10:00:00Z-breath-focus-a"`) so retries are safe.

---

## XP Computation Reference

The agent should compute XP before posting. The server stores whatever `xpAwarded` you send — it does NOT recompute.

### Formula

```
rate = (levelRate + skillTierRate) / 2
baseXP = round(duration_minutes × rate)
finalXP = round(baseXP × streakMultiplier × psychedelicMultiplier)
```

### Streak Multipliers

| Streak | Multiplier |
|--------|-----------|
| 0-2 days | 1.0 |
| 3-6 days | 1.1 |
| 7-13 days | 1.25 |
| 14-29 days | 1.5 |
| 30+ days | 2.0 |

Psychedelic multiplier: 10 (only when user explicitly says so).

### For manifestation practices (skillSplits)

Average the tier rates of all skills in the splits:
```
avgTierRate = sum(rate for each skill in splits) / count
rate = (levelRate + avgTierRate) / 2
```

---

## Valid Skill Slugs (18 total)

```
focused-attention, meta-awareness, deep-work,
natural-flow, natural-awareness, nondual-awareness,
breath-control, body-awareness,
blissful-presence, emotional-awareness,
good-traits, mindset,
mental-endurance,
visualization, subconscious-programming,
transcendence, inner-exploration, lucid-dreaming
```

---

## Error Responses

| Status | Cause | Body |
|--------|-------|------|
| 400 | Missing `practiceId` | `{"error": "practiceId required"}` |
| 401 | Missing/wrong API key | `{"error": "Invalid or missing API key"}` |
| 409 | Duplicate session `id` | `{"error": "Session already exists", "id": "..."}` |
| 200 | Success | `{"ok": true, "id": "..."}` |

Unknown fields in the body are silently ignored (not an error). Partial records (e.g. missing `primarySkill`) are accepted — the field stores as `null`.

---

## Verification After Logging

After a successful POST, verify the session exists:

```bash
curl GET /mf-sessions -H "X-API-Key: <key>" -H "X-User-Id: <uuid>" | jq '.sessions[-1]'
```

The last session (by timestamp) should match what you posted.

---

## Source Code

The authoritative backend code is in `server/index.js`:
- `pick()` function: line ~205
- `POST /mf-sessions`: line ~1072
- `GET /mf-sessions`: line ~941
- `GET /mf-stats`: line ~1005
- Schema: `server/schema.sql` — `mf_sessions` table
