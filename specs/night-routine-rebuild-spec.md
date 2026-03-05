# Night Routine Rebuild — Spec

Last updated: 2026-03-04

---

## Problem

Current night routine is a flat list of checkboxes. No structure, no phases, no flow. Morning routine got broken into phases (mind training, shower, etc.) and it works well. Night needs the same treatment.

## Design Principle

Night routine actions are **app UI cards** — not bot conversations. Luna handled both tracking AND conversation before. Now: app handles tracking, Void handles inner work conversation. Luna may be retired or repurposed.

## Phases

### Phase 1: Wind Down
- **Letting Go meditation** — hold to complete (existing)
- **Nervous system regulation** — hold to complete (existing)
- **Body scan** — optional, hold to complete

### Phase 2: Reflection
- **Alter Memories** — surfaces today's negative votes grouped by category. Tap each to acknowledge/reframe. This is review, not deep work (deep work happens in Void).
- **Day review** — quick: what went well, what didn't. Could be a text input or just a mental exercise with a checkoff.

### Phase 3: Planning
- **Plan tomorrow** — text input. Key priorities, time blocks, what needs protecting. This is the one conversational element — could open Void or just be a text field that saves to server.
- **Finalize plan** — confirm/photo of written plan

### Phase 4: Bed Routine
- **Read prompts** — review daily prompt questions (existing)
- **VF Game** — link to the VF Game (own section, but reminder card here)
- **Visualization** — link to visualization practice
- **Lights out** — final checkoff, timestamps the end of day

## Data Model

Same as current `night-routine.json` but expanded:

```json
{
  "date": "2026-03-04",
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
    "lightsOut": false,
    "lightsOutTimestamp": null
  }
}
```

## UI

Same card-by-card flow as morning routine. Phase label at top, progress dots, hold-to-complete buttons. Each phase transitions to the next.

## Server

Update `night-routine` stub and POST handler to use the new nested structure. Maintain backwards compat for history.

## Votes

- Completing all wind-down items: +1 positive vote (discipline)
- Completing reflection: +1 positive vote (mental-power)
- Plan finalized: +1 positive vote (discipline)
- Lights out before a target time (configurable): +1 positive vote (discipline)
- Skipping any phase entirely: -1 negative vote per skipped phase

## Open Questions

- Should the plan text go to Void for a conversation, or just save to server?
- Target bedtime for the lights-out bonus vote?
- Do we keep Luna at all, or fully retire her?
