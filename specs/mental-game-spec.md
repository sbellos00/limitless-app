# Mental Game Screen — Spec

Last updated: 2026-03-04

---

## What Is It

The Mental Game is a mental martial art. It's the FitMind-connected part of the system — the disciplined training of mental skills. This isn't the reflective inner work of the VF Game. This is **active training**. Drills, exercises, progression.

## Design Principle

**Dopamine-rich.** This screen should make you WANT to train. Think game UI, not meditation app. XP bars, level indicators, unlockable exercises, visual progression. The martial art metaphor should be felt in the design.

## Core Concept

Mental skills are trainable like physical skills. Each skill has:
- A progression path (beginner → advanced)
- Specific exercises/drills
- Measurable improvement over time
- Connection to real-life application (VF Game bosses, key decisions)

## Mental Skills (from existing badge system, evolved)

The 7 badges become 7 **disciplines** of the mental martial art:

1. **Reality Distortion Field (RDF)** — shaping perception, belief manipulation
2. **Frame Control** — maintaining your frame under pressure
3. **Fearlessness** — acting despite fear
4. **Aggression** — channeled intensity, bias toward action
5. **Carefreeness** — non-attachment, lightness
6. **Presence** — awareness, staying in the moment
7. **Bias to Action** — overcoming analysis paralysis

Each discipline has:
- Current level (1-5: Initiate → Apprentice → Warrior → Champion → Master)
- XP bar showing progress to next level
- Exercises unlocked at each level
- Missions that connect to real-world application

## FitMind Integration

FitMind screenshots get processed by Pulse. The Mental Game screen shows:
- FitMind streak
- Minutes trained today
- Which mental skills FitMind exercises map to
- FitMind progress feeding into discipline XP

## Screen Layout

### Header
- "Mental Game" title with martial art energy
- Overall mental rank (average across 7 disciplines)
- Today's training time

### Discipline Grid
- 7 cards in a grid (2 columns + 1)
- Each card shows: emoji, name, level, XP bar
- Tap to expand into discipline detail

### Discipline Detail (Sheet/Modal)
- Full XP progress
- Current level with tier name
- Available exercises (list)
- Completed missions
- Next unlock preview
- "Train" button → opens exercise

### Exercise Flow
- Timer-based or completion-based
- Guided instructions
- XP awarded on completion
- Haptic feedback + sound on level-up

### Daily Training Summary
- Bottom section
- What you trained today
- XP gained
- Any level-ups

## Data

Existing data:
- `badge-progress.json` → persistent XP, levels, streaks per discipline
- `badges.json` → discipline definitions, XP rules
- `missions.json` → 105 missions across 7 disciplines
- `badge-daily.json` → daily tracking

New data needed:
- Exercise completion log (when, which exercise, duration, XP)
- FitMind → discipline mapping

## Server Endpoints (Existing)
- `GET /badges` → all badge data with progress
- `POST /badges/:slug/xp` → award XP
- `GET /badge-missions` → mission data
- `POST /badge-missions/:id/complete` → complete a mission

## UI Component

`src/components/MentalGame.jsx` — replaces or evolves BadgesTab.

## Design Notes

- Dark theme but with COLOR. Each discipline gets an accent color.
- XP bars should feel satisfying to fill
- Level-up moments should feel like an achievement (confetti, sound, haptic)
- The grid should feel like a character skill tree
- NOT a list of checkboxes. This is a GAME screen.

## Connection to VF Game

- Facing a VF boss that maps to a discipline → bonus XP for that discipline
- Key decisions that map to a discipline → XP
- High resistance on an affirmation that connects to a discipline → suggested exercises

## Open Questions

- Exercise content — do we write these ourselves or pull from FitMind?
- How exactly does FitMind data map to the 7 disciplines?
- Should exercises be timed (5 min meditation) or task-based (do this in real life)?
- Sound design — what does a level-up sound like?
