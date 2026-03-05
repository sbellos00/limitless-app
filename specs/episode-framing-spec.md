# Episode Framing — Spec

Last updated: 2026-03-04

---

## What Is It

Each day is an episode of your TV show. Not metaphorically — literally framed that way in the app. This creates narrative momentum. You're not "doing your routine," you're living a chapter in an ongoing story. The system documents it as you go.

## Why It Matters

Stef's own words: "We need something to establish the atmosphere that this is an episode from our TV Show, it's not just another routine day."

Routine kills fire. Narrative feeds it. Same actions, completely different energy when framed as story vs checklist.

## How It Shows Up

### Episode Opening (Start Day)
When you press Start Day, you're not "starting your tracker." You're opening today's episode.

- **Episode number** — auto-incremented. "Episode 47"
- **Episode title** — either auto-generated from yesterday's chapter close OR you write one. "The one where I face the comfort boss." Titles can be updated throughout the day as the theme emerges.
- **Previously on...** — quick recap from yesterday's chapter. 2-3 sentences. Auto-generated from last chapter entry, or from yesterday's VF session highlights.
- **Today's arc** — what's the question/challenge/theme today? Could be pulled from morning check-in with Faith, or set manually. "Can I hold conviction on financial freedom while the doubt keeps showing up?"

### During the Day
- Top bar shows: "Ep. 47 — [title]" subtly
- Key decisions get framed as plot points: "Plot point: Caught the doomscroll urge and redirected"
- Boss encounters = dramatic tension
- The episode title can evolve as the day unfolds

### Episode Close (End Day / VF Game Night Session)
- **Chapter summary** — Void writes this (or auto-generated from day's data). Narrative, not data.
- **Key scenes** — the moments that mattered (key decisions, boss encounters, breakthroughs)
- **Episode rating** — how would you rate this episode? (1-5 stars, or just a vibe: 🔥 fire, 😤 grind, 😶 numb, 💡 breakthrough, 😴 sleepwalk)
- **Preview of next episode** — "Tomorrow: [plan highlights]" — pulled from night planning
- **Credits roll** — playful touch. "Starring: Stef. Directed by: The Universe. Boss appearances: Comfort-seeking (defeated), Impatience (ongoing)."

### Episode Archive
- Scrollable timeline of all episodes
- Each shows: number, title, date, rating, key moments
- Tap to read full chapter narrative
- This IS the documented journey. Over months, you can see the whole arc.

## Data Model

### Server: `episode.json` (daily)
```json
{
  "date": "2026-03-04",
  "number": 47,
  "title": "The one where it started clicking",
  "previouslyOn": "Yesterday you faced the comfort boss and held your ground...",
  "todaysArc": "Can I hold conviction on financial freedom?",
  "plotPoints": [
    {
      "id": "uuid",
      "timestamp": "ISO",
      "description": "Caught doomscroll urge, redirected to work",
      "type": "key-decision"
    }
  ],
  "rating": "🔥",
  "status": "open"
}
```

Chapter narrative lives in `vf-chapters.jsonl` (already built), linked by date.

### Server Endpoints (New)
- `GET /episode` — today's episode
- `POST /episode` — create/update today's episode (title, arc, rating)
- `POST /episode/plot-point` — add a plot point (auto-called when key decisions or boss encounters happen)
- `GET /episodes?limit=N` — episode archive

### Auto-Generation
- Plot points auto-populate from key decisions and boss encounters (server-side: when a key decision or boss encounter is posted, also append to today's episode)
- "Previously on" auto-generated from yesterday's chapter + episode data
- Credits auto-generated from day's data

## UI

### Start Day Screen (Enhanced)
Current Start Day is just a button. Enhance with:
- Episode number + title input
- "Previously on..." card (collapsible)
- "Today's arc" text input
- Start Day button becomes "Begin Episode"

### Persistent Top Bar
- Small, subtle: "Ep. 47" or "Ep. 47 — The one where..."
- Doesn't take space, just ambient awareness

### Episode Close Screen
- After VF Game or End Day
- Shows summary, key scenes, rating selector
- "Next episode preview" from planning
- Credits (fun, optional, toggleable)

### Archive (History Tab evolution)
- Timeline view of episodes
- Filter by rating, search by title
- Tap for full narrative

## Component
- `src/components/EpisodeBar.jsx` — persistent top bar
- Episode open/close integrated into Start Day / End Day flows
- Archive integrated into History tab

## Connection to Existing Systems
- Key decisions → auto plot points
- Boss encounters → auto plot points (dramatic ones)
- VF chapters → episode narrative
- Faith morning check-in → could seed "today's arc"
- Night planning → seeds "next episode preview"

## Open Questions
- Auto-generate titles from AI based on day's data, or always manual?
- Credits: fun feature or too gimmicky?
- Episode numbering: count from day 1 of using the system, or from a meaningful start date?
- Should there be "season" breaks? (e.g., Season 2 starts when you level up in a major way)
