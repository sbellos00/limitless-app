// ─── Mental Fitness Skill System ─────────────────────────────────────────────
// 19 skills grouped into 8 categories. Each practice maps to a primary skill
// (80% XP) and optional secondary skill (20% XP). Categories feed the Hexagram.

export const CATEGORIES = [
  { id: 'focus', name: 'Focus', color: '#60A5FA', skills: ['focused-attention', 'meta-awareness', 'deep-work'] },
  { id: 'nonduality', name: 'Nonduality', color: '#A78BFA', skills: ['natural-flow', 'natural-awareness', 'nondual-awareness'] },
  { id: 'somatic', name: 'Somatic', color: '#34D399', skills: ['breath-control', 'body-awareness'] },
  { id: 'emotional', name: 'Emotional', color: '#F472B6', skills: ['blissful-presence', 'emotional-awareness'] },
  { id: 'mental-conditioning', name: 'Mental Conditioning', color: '#FBBF24', skills: ['good-traits', 'mindset'] },
  { id: 'stamina', name: 'Stamina', color: '#EF4444', skills: ['mental-endurance'] },
  { id: 'manifestation', name: 'Manifestation', color: '#818CF8', skills: ['visualization', 'subconscious-programming'] },
  { id: 'psychonautics', name: 'Psychonautics', color: '#2DD4BF', skills: ['transcendence', 'inner-exploration', 'lucid-dreaming'] },
]

export const SKILLS = {
  'focused-attention':      { name: 'Focused Attention',      category: 'focus' },
  'meta-awareness':         { name: 'Meta Awareness',         category: 'focus' },
  'deep-work':              { name: 'Deep Work',              category: 'focus' },
  'natural-flow':           { name: 'Natural Flow',           category: 'nonduality' },
  'natural-awareness':      { name: 'Natural Awareness',      category: 'nonduality' },
  'nondual-awareness':      { name: 'Nondual Awareness',      category: 'nonduality' },
  'breath-control':         { name: 'Breath Control',         category: 'somatic' },
  'body-awareness':         { name: 'Body Awareness',         category: 'somatic' },
  'blissful-presence':      { name: 'Blissful Presence',      category: 'emotional' },
  'emotional-awareness':    { name: 'Emotional Awareness',    category: 'emotional' },
  'good-traits':            { name: 'Good Traits',            category: 'mental-conditioning' },
  'mindset':                { name: 'Mindset',                category: 'mental-conditioning' },
  'mental-endurance':       { name: 'Mental Endurance',       category: 'stamina' },
  'visualization':          { name: 'Visualization',          category: 'manifestation' },
  'subconscious-programming': { name: 'Subconscious Programming', category: 'manifestation' },
  'transcendence':          { name: 'Transcendence',          category: 'psychonautics' },
  'inner-exploration':      { name: 'Inner Exploration',      category: 'psychonautics' },
  'lucid-dreaming':         { name: 'Lucid Dreaming',         category: 'psychonautics' },
}

// All skill IDs for iteration
export const ALL_SKILL_IDS = Object.keys(SKILLS)

// ─── XP Presets ──────────────────────────────────────────────────────────────
// Unlock higher presets as you level up. Check-ins award a flat 2 XP to global total.

export const XP_PRESETS = [
  { value: 5,  label: 'Light',   minLevel: 1 },
  { value: 10, label: 'Medium',  minLevel: 1 },
  { value: 20, label: 'Heavy',   minLevel: 3 },
  { value: 30, label: 'Intense', minLevel: 5 },
]

export const CHECKIN_XP = 2

// XP split ratios
export const PRIMARY_XP_RATIO = 0.8
export const SECONDARY_XP_RATIO = 0.2

// Psychedelics training multiplier
export const PSYCHEDELIC_MULTIPLIER = 10

// ─── Streak Bonuses ─────────────────────────────────────────────────────────

export const STREAK_BONUSES = [
  { days: 3,  multiplier: 1.1,  label: '3d streak' },
  { days: 7,  multiplier: 1.25, label: '7d streak' },
  { days: 14, multiplier: 1.5,  label: '14d streak' },
  { days: 30, multiplier: 2.0,  label: '30d streak' },
]

export function getStreakMultiplier(streak) {
  let mult = 1.0
  for (const b of STREAK_BONUSES) {
    if (streak >= b.days) mult = b.multiplier
  }
  return mult
}

export function getStreakLabel(streak) {
  let label = null
  for (const b of STREAK_BONUSES) {
    if (streak >= b.days) label = b.label
  }
  return label
}

// ─── Skill Tiers ────────────────────────────────────────────────────────────

export const SKILL_TIERS = [
  { name: 'Novice',      minXp: 0,     color: 'rgba(255,255,255,0.3)' },
  { name: 'Developing',  minXp: 100,   color: '#60A5FA' },
  { name: 'Proficient',  minXp: 500,   color: '#34D399' },
  { name: 'Advanced',    minXp: 1500,  color: '#FBBF24' },
  { name: 'Master',      minXp: 5000,  color: '#EF4444' },
  { name: 'Diamond',     minXp: 10000, color: '#B9F2FF' },
]

export function getSkillTier(xp) {
  let tier = SKILL_TIERS[0]
  for (const t of SKILL_TIERS) {
    if (xp >= t.minXp) tier = t
  }
  return tier
}

export function getSkillTierProgress(xp) {
  const tier = getSkillTier(xp)
  const idx = SKILL_TIERS.indexOf(tier)
  const next = SKILL_TIERS[idx + 1]
  if (!next) return { tier, pct: 100, xpToNext: 0 }
  const range = next.minXp - tier.minXp
  const progress = xp - tier.minXp
  return { tier, pct: Math.min((progress / range) * 100, 100), xpToNext: Math.max(next.minXp - xp, 0), next }
}

// ─── Skill Rating (1-99) ────────────────────────────────────────────────────
// Piecewise linear mapping from XP to a 1-99 display rating.
// Tier boundaries map to fixed ratings; interpolate between them.

const RATING_BREAKPOINTS = [
  { xp: 0,     rating: 1 },   // Novice start
  { xp: 100,   rating: 15 },  // Developing
  { xp: 500,   rating: 35 },  // Proficient
  { xp: 1500,  rating: 60 },  // Advanced
  { xp: 5000,  rating: 90 },  // Master
  { xp: 10000, rating: 99 },  // Hard cap
]

export function getSkillRating(xp) {
  if (xp <= 0) return 1
  for (let i = 1; i < RATING_BREAKPOINTS.length; i++) {
    const prev = RATING_BREAKPOINTS[i - 1]
    const curr = RATING_BREAKPOINTS[i]
    if (xp <= curr.xp) {
      const t = (xp - prev.xp) / (curr.xp - prev.xp)
      return Math.round(prev.rating + t * (curr.rating - prev.rating))
    }
  }
  return 99
}

// ─── Skill Decay ────────────────────────────────────────────────────────────
// Skills lose XP if not practiced for extended periods.
// Decay starts after 14 days of no session on that skill.
// Rate: 0.5% of skill XP per day. Floor: 50% of peak XP.

export const DECAY_GRACE_DAYS = 14
export const DECAY_RATE_PER_DAY = 0.005  // 0.5%
export const DECAY_FLOOR_RATIO = 0.5     // never below 50% of peak

export function applySkillDecay(skillXp, sessions) {
  const now = Date.now()
  const DAY_MS = 86400000
  const decayed = { ...skillXp }

  for (const skillId of ALL_SKILL_IDS) {
    const raw = skillXp[skillId] || 0
    if (raw === 0) continue

    // Find most recent session for this skill
    let lastSession = 0
    for (const s of sessions) {
      if (s.primarySkill === skillId || s.secondarySkill === skillId) {
        const ts = new Date(s.timestamp).getTime()
        if (ts > lastSession) lastSession = ts
      }
    }

    if (lastSession === 0) continue // no sessions = no decay (XP was set some other way)

    const daysSince = Math.floor((now - lastSession) / DAY_MS)
    if (daysSince <= DECAY_GRACE_DAYS) continue

    const decayDays = daysSince - DECAY_GRACE_DAYS
    const decayFactor = Math.pow(1 - DECAY_RATE_PER_DAY, decayDays)
    const floor = Math.round(raw * DECAY_FLOOR_RATIO)
    decayed[skillId] = Math.max(Math.round(raw * decayFactor), floor)
  }

  return decayed
}

// ─── Built-in Practices ─────────────────────────────────────────────────────
// 51 practices from the original 4 phases, each mapped to primary + optional secondary skill.

export const PRACTICE_PHASES = [
  {
    id: 'fundamentals', name: 'Fundamentals', kanji: '基',
    desc: 'Breathing & Attention', color: '#60A5FA',
  },
  {
    id: 'concentration', name: 'Concentration', kanji: '集',
    desc: 'Sustained Focus', color: '#F59E0B',
  },
  {
    id: 'metacognition', name: 'Metacognition', kanji: '観',
    desc: 'Observing the Mind', color: '#10B981',
  },
  {
    id: 'deconstruction', name: 'Deconstruction', kanji: '空',
    desc: 'Insight & Non-Dual', color: '#A78BFA',
  },
]

export const PRACTICES = [
  // ── Fundamentals ──
  { id: 'tranquil-breathing', name: 'Tranquil Breathing', desc: 'Diaphragmatic breathing, parasympathetic activation', phase: 'fundamentals', primarySkill: 'breath-control', secondarySkill: null },
  { id: 'meditation-basics', name: 'Meditation Basics', desc: 'Posture, breath awareness, returning attention', phase: 'fundamentals', primarySkill: 'focused-attention', secondarySkill: null },
  { id: 'finger-switching', name: 'Finger Switching', desc: 'Alternate awareness between fingers for cognitive flexibility', phase: 'fundamentals', primarySkill: 'focused-attention', secondarySkill: 'meta-awareness' },

  // ── Concentration ──
  { id: 'breath-focus-a', name: 'Breath Focus A', desc: 'Continuous attention on the breath', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'breath-control' },
  { id: 'breath-focus-b', name: 'Breath Focus B', desc: 'Narrowing the aperture of attention', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'breath-control' },
  { id: 'breath-focus-c', name: 'Breath Focus C', desc: 'Counting breaths with precision', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'breath-control' },
  { id: 'breath-focus-d', name: 'Breath Focus D', desc: 'Sustaining focus without counting', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'breath-control' },
  { id: 'breath-focus-e', name: 'Breath Focus E', desc: 'Whole-body breath awareness', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'breath-control' },
  { id: 'head-switching', name: 'Head Switching', desc: 'Alternate attention between head regions', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: 'body-awareness' },
  { id: 'body-scan-a', name: 'Body Scan A', desc: 'Sequential body awareness for interoception', phase: 'concentration', primarySkill: 'body-awareness', secondarySkill: null },
  { id: 'body-scan-b', name: 'Body Scan B', desc: 'Rapid full-body sweep', phase: 'concentration', primarySkill: 'body-awareness', secondarySkill: null },
  { id: 'repeated-phrase-a', name: 'Repeated Phrase A', desc: 'Mantra repetition for sustained concentration', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: null },
  { id: 'repeated-phrase-b', name: 'Repeated Phrase B', desc: 'Silent deepening mantra', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: null },
  { id: 'pointing', name: 'Pointing the Mind', desc: 'Direct attention like a laser', phase: 'concentration', primarySkill: 'focused-attention', secondarySkill: null },
  { id: 'mind-body-sync', name: 'Mind-Body Sync', desc: 'Synchronise mental attention with physical movement', phase: 'concentration', primarySkill: 'body-awareness', secondarySkill: 'focused-attention' },
  { id: 'alternate-nostril', name: 'Alternate Nostril', desc: 'Pranayama to balance the nervous system', phase: 'concentration', primarySkill: 'breath-control', secondarySkill: null },

  // ── Metacognition ──
  { id: 'flexible-awareness', name: 'Flexible Awareness', desc: 'Shift attention smoothly between objects', phase: 'metacognition', primarySkill: 'meta-awareness', secondarySkill: null },
  { id: 'noting-a', name: 'Noting A', desc: 'Label thoughts, sensations, emotions', phase: 'metacognition', primarySkill: 'meta-awareness', secondarySkill: null },
  { id: 'noting-b', name: 'Noting B', desc: 'Faster noting with minimal labels', phase: 'metacognition', primarySkill: 'meta-awareness', secondarySkill: null },
  { id: 'noting-c', name: 'Noting C', desc: 'Noting without verbalizing', phase: 'metacognition', primarySkill: 'meta-awareness', secondarySkill: null },
  { id: 'noting-gone', name: 'Noting Gone', desc: 'Notice when experiences disappear', phase: 'metacognition', primarySkill: 'meta-awareness', secondarySkill: 'natural-awareness' },
  { id: 'just-being', name: 'Just Being', desc: 'Open awareness without a specific object', phase: 'metacognition', primarySkill: 'natural-awareness', secondarySkill: null },
  { id: 'emotional-priming', name: 'Emotional Priming', desc: 'Cultivate positive emotional states intentionally', phase: 'metacognition', primarySkill: 'blissful-presence', secondarySkill: null },
  { id: 'glimpse', name: 'Glimpse', desc: 'Brief glimpses into non-dual awareness', phase: 'metacognition', primarySkill: 'nondual-awareness', secondarySkill: null },
  { id: 'shift-awareness', name: 'Shift into Awareness', desc: 'Turn attention back on itself', phase: 'metacognition', primarySkill: 'natural-awareness', secondarySkill: null },
  { id: 'good-vibes', name: 'Good Vibes', desc: 'Loving-kindness, compassion and goodwill', phase: 'metacognition', primarySkill: 'blissful-presence', secondarySkill: 'good-traits' },
  { id: 'forgiveness', name: 'Forgiveness', desc: 'Release resentment through guided reflection', phase: 'metacognition', primarySkill: 'emotional-awareness', secondarySkill: 'good-traits' },
  { id: 'best-self', name: 'Best Self', desc: 'Envision and embody your ideal qualities', phase: 'metacognition', primarySkill: 'mindset', secondarySkill: 'visualization' },

  // ── Deconstruction ──
  { id: 'aware-of-awareness', name: 'Aware of Awareness', desc: 'Direct attention to awareness itself', phase: 'deconstruction', primarySkill: 'natural-awareness', secondarySkill: null },
  { id: 'headless-way', name: 'Headless Way', desc: 'Deconstruct the sense of a separate self', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: null },
  { id: 'self-inquiry-a', name: 'Self-Inquiry A', desc: 'Who am I? — Ramana Maharshi', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: 'inner-exploration' },
  { id: 'self-inquiry-b', name: 'Self-Inquiry B', desc: 'What is aware? — direct pointing', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: 'inner-exploration' },
  { id: 'self-inquiry-c', name: 'Self-Inquiry C', desc: 'Before thought — the gap', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: 'inner-exploration' },
  { id: 'self-inquiry-d', name: 'Self-Inquiry D', desc: 'Advanced inquiry — the witness dissolves', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: 'inner-exploration' },
  { id: 'actualism', name: 'Actualism', desc: 'Non-dual awareness with cognitive inquiry', phase: 'deconstruction', primarySkill: 'nondual-awareness', secondarySkill: null },
  { id: 'great-seal', name: 'Great Seal', desc: 'Mahamudra — rest in the natural state', phase: 'deconstruction', primarySkill: 'natural-flow', secondarySkill: null },
  { id: 'yoga-nidra', name: 'Yoga Nidra', desc: 'Deep relaxation through body and energy layers', phase: 'deconstruction', primarySkill: 'body-awareness', secondarySkill: 'transcendence' },
  { id: 'deep-sleep', name: 'Deep Sleep', desc: 'Guided relaxation for conscious sleep', phase: 'deconstruction', primarySkill: 'body-awareness', secondarySkill: null },
  { id: 'lucid-dream', name: 'Lucid Dream', desc: 'Techniques for dream awareness', phase: 'deconstruction', primarySkill: 'lucid-dreaming', secondarySkill: null },
  { id: 'dream-yoga', name: 'Dream Yoga', desc: 'Tibetan dream practice preparation', phase: 'deconstruction', primarySkill: 'lucid-dreaming', secondarySkill: 'transcendence' },
  { id: 'stoic-meditation', name: 'Stoic Meditation', desc: 'Premeditatio malorum — rehearse difficulties', phase: 'deconstruction', primarySkill: 'mindset', secondarySkill: 'mental-endurance' },
  { id: 'mortality', name: 'Mortality', desc: 'Contemplation of death to foster gratitude', phase: 'deconstruction', primarySkill: 'inner-exploration', secondarySkill: null },

  // ── Stamina ──
  { id: 'endurance-sit', name: 'Endurance Sit', desc: 'Extended meditation pushing past discomfort', phase: 'concentration', primarySkill: 'mental-endurance', secondarySkill: 'focused-attention' },
  { id: 'discomfort-training', name: 'Discomfort Training', desc: 'Deliberately sit with physical or mental discomfort', phase: 'concentration', primarySkill: 'mental-endurance', secondarySkill: 'body-awareness' },

  // ── Manifestation ──
  { id: 'guided-visualization', name: 'Guided Visualization', desc: 'Vivid mental imagery of goals and outcomes', phase: 'metacognition', primarySkill: 'visualization', secondarySkill: null },
  { id: 'future-self', name: 'Future Self', desc: 'Embody and communicate with your ideal future self', phase: 'metacognition', primarySkill: 'visualization', secondarySkill: 'mindset' },
  { id: 'affirmation-programming', name: 'Affirmation Programming', desc: 'Repetitive subconscious belief installation', phase: 'metacognition', primarySkill: 'subconscious-programming', secondarySkill: null },
  { id: 'sleep-programming', name: 'Sleep Programming', desc: 'Hypnagogic state intention setting', phase: 'deconstruction', primarySkill: 'subconscious-programming', secondarySkill: 'visualization' },
]

// Index by ID for fast lookup
export const PRACTICE_MAP = Object.fromEntries(PRACTICES.map(p => [p.id, p]))

// Category lookup by skill
export const SKILL_TO_CATEGORY = Object.fromEntries(
  CATEGORIES.flatMap(c => c.skills.map(s => [s, c.id]))
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function computeSkillXp(sessions) {
  const xp = Object.fromEntries(ALL_SKILL_IDS.map(id => [id, 0]))
  for (const s of sessions) {
    if (!s.primarySkill || !s.xpAwarded) continue
    const primary = Math.round(s.xpAwarded * PRIMARY_XP_RATIO)
    const secondary = s.secondarySkill ? Math.round(s.xpAwarded * SECONDARY_XP_RATIO) : 0
    if (xp[s.primarySkill] !== undefined) xp[s.primarySkill] += primary
    if (s.secondarySkill && xp[s.secondarySkill] !== undefined) xp[s.secondarySkill] += secondary
  }
  return xp
}

export function computeCategoryXp(skillXp) {
  return Object.fromEntries(
    CATEGORIES.map(c => [c.id, c.skills.reduce((sum, sk) => sum + (skillXp[sk] || 0), 0)])
  )
}

export function getTotalXp(sessions) {
  return sessions.reduce((sum, s) => sum + (s.xpAwarded || 0), 0)
}
