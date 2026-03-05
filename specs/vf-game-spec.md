# VF Game — System Spec (Draft)

Last updated: 2026-03-04

---

## What Is It

The VF Game is the core journey of the Limitless system. It's the process of going from your current reality to your desired reality by gradually reaching the vibrational frequency that allows you to manifest the life you want.

It's structured like a video game. Levels, bosses, chapters. Each day is a chapter. The game is played 24/7 in a dimension parallel to 3D reality. Staying conscious of the game IS the game.

## Theoretical Framework

Based on Katie Clarke's "Life Is A Video Game" + Stef's original VF writings.

- Reality = levels (boxes). You can't enter the next box until you become the minimally viable version of yourself that can enter it.
- You don't need to be ready. Courage to START does the rewiring.
- The path illuminates as you walk it.
- Suffering = being too big for your current level.
- Final boss at each level = your shadow (repressed parts keeping consciousness trapped).
- Bosses are not evil. They're challenges the universe gives you to mold you. They make the game engaging.
- The most dangerous boss move: tricking you into forgetting you're in the game.
- Signals of resistance always present themselves. If you pay attention, they lead you to the fight.
- Courage, honesty, non-resistance = keys to every level transition.
- Identity and frequency FIRST, then aligned action follows.
- You have unlimited lives. Winning is inevitable if you keep playing. The only way to lose is to stop.

## Core Mechanics

### Affirmations (Compass Points)
12 personal affirmations grouped by category (Abundance, Creative Expression, Vision, Trust, Identity, Presence). These are NOT tasks. They're prompts to look inside and notice what's there.

Stored in: `server/data/affirmations.json`

### Resistance Score (UI)
Per affirmation. "How much resistance do you feel toward this being true?" 
- High resistance = you found the boss
- Low resistance = you're past that level
- Zero = this is just your reality now

### Conviction Score (UI)
Per affirmation. Tracked separately from resistance. Both signals matter:
- Low resistance + high conviction = past this level
- Low resistance + low conviction = numb/disconnected (its own signal)
- High resistance + high conviction = you believe it but something is fighting it (most interesting work)
- High resistance + low conviction = the boss is winning right now

### Key Decisions (Anytime)
Micro-moments of choosing the harder right thing over the easier wrong thing. Logged via Void bot anytime during the day.

Types:
- `resist` — resisted urge/addiction/habit (3x multiplier)
- `persist` — kept going when wanted to stop (2x)
- `reframe` — stepped back from negative loop (2x)
- `ground` — breathed through overwhelm/discomfort (2x)
- `face-boss` — confronted a resistance pattern directly (5x)
- `recenter` — checked in and called energy back (2x)

Generates weighted votes in the vote system.

### VF Bosses
Psychological resistance patterns. Not tasks, not action items.
- The urge to numb out
- The voice saying "this isn't working"
- Desire to skip the hard thing
- Comfort-seeking when growth is available
- Self-doubt disguised as "being realistic"
- The boss that makes you forget you're in the game

When faced and overcome = 5x key decision.
Bosses are not evil. They are growth opportunities.

### Composed VF Score
Single daily number composing:
- Resistance scores (inverse — lower resistance = higher score)
- Conviction scores
- Key decisions (total multiplied weight)
- Boss encounters (faced vs avoided)
- Presence score

Formula TBD. This is THE number on the dashboard.

### Chapters (Daily Documentation)
Each day = a chapter. After the night VF session, a chapter entry is written. NOT a data readout. A journal-like narrative capturing the real energy of what happened. The documented journey you can look back on.

## Architecture

### UI (App)
- Resistance + conviction scoring per affirmation (sliders/inputs)
- VF Score display on home screen
- Chapter history / journey timeline
- Night routine cards (letting go, nervous system, alter memories) = app actions, not bot conversation

### Void 🪞 (Telegram Bot)
- Anytime: key decision logging (message it, it acknowledges and logs)
- Night: VF exploration session — the conversation space for when resistance is high and you want to dig into WHY
- Chapter documentation — writes the narrative after the session
- NOT the scoring tool. UI handles measurement. Void handles exploration.

### Server Endpoints (Live)
- `GET /affirmations` — 12 affirmations with categories
- `POST /key-decisions` — log with type + multiplier, generates weighted votes
- `POST /vf-game` — session data (affirmation explorations, presence, boss, closing)
- `POST /boss-encounters` — with `faced` flag, auto-generates 5x key decision
- `GET /key-decisions` — daily review
- `GET /boss-encounters` — history with filters

### Server Endpoints (TODO)
- `POST /vf-scores` — daily resistance + conviction scores from UI
- `GET /vf-score` — composed daily score
- `GET /vf-chapters` — chapter history
- `POST /vf-chapters` — write chapter entry

## Bot Status
- Agent files created: SOUL.md, AGENTS.md, openclaw.yaml, knowledge/
- Telegram bot: NOT CREATED YET (need @BotFather token)
- Not wired into openclaw.json
- Luna: still exists separately, night routine tracking moves to app-only

## Open Questions
- VF Score formula (exact weights)
- Chapter format (how narrative vs structured?)
- How does visualization practice connect? (Stef mentioned it's centered around affirmations)
- Does Luna get retired entirely or kept for anytime vote-logging?
- Night routine breakdown (like morning routine was broken into categories)
