// Night Routine — 4 phases matching server night-routine.json structure
// Each item maps to a nested field: phase.field in the server

const nightRoutine = [
  // ─── Phase 1: Wind Down ─────────────────────────────
  {
    id: 'letting-go',
    title: '🌊 Letting Go',
    description: 'Meditation to release the day\'s tension.',
    phase: 'windDown',
    phaseLabel: 'Wind Down',
    field: 'lettingGoCompleted',
    timestampField: 'lettingGoTimestamp',
    botLink: null,
  },
  {
    id: 'nervous-system',
    title: '🧘 Regulate',
    description: 'Nervous system regulation exercise.',
    phase: 'windDown',
    phaseLabel: 'Wind Down',
    field: 'nervousSystemCompleted',
    timestampField: 'nervousSystemTimestamp',
    botLink: null,
  },
  {
    id: 'body-scan',
    title: '🫧 Body Scan',
    description: 'Full body scan. Optional but powerful.',
    phase: 'windDown',
    phaseLabel: 'Wind Down',
    field: 'bodyScanCompleted',
    timestampField: 'bodyScanTimestamp',
    botLink: null,
  },

  // ─── Phase 2: Reflection ────────────────────────────
  {
    id: 'alter-memories',
    title: '🧠 Alter Memories',
    description: 'Review today\'s negative votes. Acknowledge and reframe.',
    phase: 'reflection',
    phaseLabel: 'Reflection',
    field: 'alterMemoriesCompleted',
    timestampField: 'alterMemoriesTimestamp',
    botLink: null,
  },
  {
    id: 'day-review',
    title: '📝 Day Review',
    description: 'What went well? What didn\'t? Quick mental review.',
    phase: 'reflection',
    phaseLabel: 'Reflection',
    field: 'dayReviewCompleted',
    timestampField: 'dayReviewTimestamp',
    botLink: null,
  },

  // ─── Phase 3: Planning ──────────────────────────────
  {
    id: 'plan-tomorrow',
    title: '📋 Plan Tomorrow',
    description: 'Key priorities, time blocks, what needs protecting.',
    phase: 'planning',
    phaseLabel: 'Planning',
    field: 'planCompleted',
    timestampField: 'planTimestamp',
    botLink: null,
    hasTextInput: true,
    textField: 'planText',
  },
  {
    id: 'finalize-plan',
    title: '✅ Finalize Plan',
    description: 'Confirm or photo of written plan.',
    phase: 'planning',
    phaseLabel: 'Planning',
    field: 'planFinalized',
    timestampField: 'planFinalizedTimestamp',
    botLink: null,
  },

  // ─── Phase 4: Bed Routine ──────────────────────────
  {
    id: 'read-prompts',
    title: '❓ Read Prompts',
    description: 'Review daily prompt questions.',
    phase: 'bed',
    phaseLabel: 'Bed Routine',
    field: 'promptsReviewed',
    timestampField: 'promptsTimestamp',
    botLink: null,
  },
  {
    id: 'vf-game',
    title: '🎮 VF Game',
    description: 'Open the VF Game for tonight\'s exploration.',
    phase: 'bed',
    phaseLabel: 'Bed Routine',
    field: 'vfGameCompleted',
    timestampField: null,
    botLink: 'https://t.me/VoidLimitlessBot',
    botLabel: 'Open Void',
  },
  {
    id: 'visualization',
    title: '🎯 Visualization',
    description: 'Visualize tomorrow. See it clearly.',
    phase: 'bed',
    phaseLabel: 'Bed Routine',
    field: 'visualizationCompleted',
    timestampField: null,
    botLink: null,
  },
  {
    id: 'lights-out',
    title: '🌙 Lights Out',
    description: 'Day is done. Rest well.',
    phase: 'bed',
    phaseLabel: 'Bed Routine',
    field: 'lightsOut',
    timestampField: 'lightsOutTimestamp',
    botLink: null,
  },
]

export default nightRoutine
