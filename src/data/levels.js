// ─── 25-Level Progression System ─────────────────────────────────────────────
// Each badge has 25 levels grouped into 5 chapters (5 levels each).
// Levels are derived from XP client-side. Server tiers still work for mission gating:
//   Levels 1-5 = Tier 1, 6-10 = Tier 2, 11-15 = Tier 3, 16-20 = Tier 4, 21-25 = Tier 5

export const LEVEL_THRESHOLDS = [
  0,    25,   60,   100,  150,     // Chapter 1  (Tier 1)
  220,  300,  400,  520,  660,     // Chapter 2  (Tier 2)
  850,  1100, 1400, 1800, 2300,    // Chapter 3  (Tier 3)
  3000, 3800, 4800, 6000, 7500,    // Chapter 4  (Tier 4)
  9500, 12000,15000,20000,30000,   // Chapter 5  (Tier 5)
]

// "Top X%" — lower is more elite.
// Level 1 starts at ~50% — you're already ahead of most people by showing up.
export const LEVEL_PERCENTILES = [
  50, 45, 40, 36, 32,
  27, 23, 19, 16, 13,
  10, 8,  6.5, 5, 3.5,
  2.5, 2, 1.5, 1, 0.7,
  0.5, 0.3, 0.15, 0.08, 0.01,
]

export function getLevelForXp(xp) {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return level
}

export function getChapterForLevel(level) {
  return Math.ceil(level / 5) // 1-5 → ch1, 6-10 → ch2, etc.
}

export function getLevelProgress(xp, level) {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || null
  if (!nextThreshold) return { pct: 100, xpToNext: 0, nextThreshold: null }
  const range = nextThreshold - currentThreshold
  const progress = xp - currentThreshold
  return {
    pct: Math.min((progress / range) * 100, 100),
    xpToNext: Math.max(nextThreshold - xp, 0),
    nextThreshold,
  }
}

// ─── Chapter data per badge ──────────────────────────────────────────────────
// 5 chapters × 8 badges. Each chapter has:
//   title     — your current archetype name
//   subtitle  — narrative line about where you are
//   figures   — longer description for the detail sheet
//   icon      — the single iconic figure for the Player Build Card
//   trait     — short trait label ("the conviction of ___")

export const CHAPTERS = {
  'rdf': [
    {
      title: 'The Doubter',
      subtitle: 'Everyone starts by questioning if belief alone can move mountains.',
      figures: 'Most people never move past doubt.',
      icon: 'a young dreamer',
      trait: 'conviction',
    },
    {
      title: 'The Believer',
      subtitle: "You're starting to see it — conviction bends reality.",
      figures: 'Where young founders begin their journey.',
      icon: 'young founders',
      trait: 'conviction',
    },
    {
      title: 'The Evangelist',
      subtitle: 'Your certainty is becoming contagious.',
      figures: 'Steve Jobs before Apple. Elon before SpaceX.',
      icon: 'young Steve Jobs',
      trait: 'conviction',
    },
    {
      title: 'The Architect',
      subtitle: "You don't convince — you construct new realities.",
      figures: 'Kanye West. Peter Thiel. Pre-empire builders.',
      icon: 'Kanye West',
      trait: 'conviction',
    },
    {
      title: 'The Reality Bender',
      subtitle: 'Your conviction reshapes the world around you.',
      figures: 'Steve Jobs. Elon Musk. Kanye at peak.',
      icon: 'Steve Jobs',
      trait: 'conviction',
    },
  ],
  'frame-control': [
    {
      title: 'The Reactor',
      subtitle: "You're learning that every interaction has a frame.",
      figures: 'Most people live here — reacting to everyone else\'s frame.',
      icon: 'most people',
      trait: 'frame',
    },
    {
      title: 'The Observer',
      subtitle: "You see the frames now. Others still don't.",
      figures: 'Junior negotiators. First-year law students.',
      icon: 'a law student',
      trait: 'frame',
    },
    {
      title: 'The Holder',
      subtitle: "Your frame doesn't break under pressure.",
      figures: 'Robert Greene. Experienced trial lawyers.',
      icon: 'Robert Greene',
      trait: 'frame',
    },
    {
      title: 'The Commander',
      subtitle: 'You set the frame. Others follow without knowing why.',
      figures: 'Jordan Peterson. High-stakes diplomats.',
      icon: 'Jordan Peterson',
      trait: 'frame',
    },
    {
      title: 'The Sovereign',
      subtitle: 'Your presence defines every room you enter.',
      figures: 'Naval Ravikant. 48 Laws mastery. Unshakeable.',
      icon: 'Naval Ravikant',
      trait: 'frame',
    },
  ],
  'fearlessness': [
    {
      title: 'The Trembler',
      subtitle: "Fear is loud. You're learning to hear it without obeying.",
      figures: 'Most people stay here their entire lives.',
      icon: 'a beginner',
      trait: 'fearlessness',
    },
    {
      title: 'The Confronter',
      subtitle: 'You walk toward what scares you.',
      figures: 'First-time skydivers. Cold approach beginners.',
      icon: 'a skydiver',
      trait: 'fearlessness',
    },
    {
      title: 'The Unflinching',
      subtitle: 'Fear speaks, you listen, then do it anyway.',
      figures: 'Wim Hof. David Goggins pre-ultramarathon.',
      icon: 'David Goggins',
      trait: 'fearlessness',
    },
    {
      title: 'The Fearless',
      subtitle: "What terrifies others is Tuesday for you.",
      figures: 'Kobe Bryant. Navy SEALs. Free solo climbers.',
      icon: 'Kobe Bryant',
      trait: 'fearlessness',
    },
    {
      title: 'The Unkillable',
      subtitle: 'Fear has nothing left to say to you.',
      figures: 'Alex Honnold. Goggins at peak. Kobe in the 4th quarter.',
      icon: 'Alex Honnold',
      trait: 'fearlessness',
    },
  ],
  'aggression': [
    {
      title: 'The Hesitant',
      subtitle: "You're learning that aggression isn't anger — it's intensity.",
      figures: 'Where most people stay — polite, safe, forgettable.',
      icon: 'a polite stranger',
      trait: 'intensity',
    },
    {
      title: 'The Asserter',
      subtitle: "You're starting to take what's yours.",
      figures: 'Junior athletes. First-time entrepreneurs.',
      icon: 'a young athlete',
      trait: 'intensity',
    },
    {
      title: 'The Relentless',
      subtitle: "You don't stop when it hurts. You stop when it's done.",
      figures: 'Early McGregor. Startup founders in the arena.',
      icon: 'early McGregor',
      trait: 'intensity',
    },
    {
      title: 'The Predator',
      subtitle: 'Controlled ferocity. Others feel it before you speak.',
      figures: 'Mike Tyson. Kobe in Mamba mode.',
      icon: 'Mike Tyson',
      trait: 'intensity',
    },
    {
      title: 'The Conqueror',
      subtitle: 'Unstoppable force of will.',
      figures: 'Alexander the Great. Genghis Khan. Pure conquest.',
      icon: 'Alexander the Great',
      trait: 'intensity',
    },
  ],
  'carefreeness': [
    {
      title: 'The Worried',
      subtitle: "You're learning that most concerns are invented prisons.",
      figures: 'Most adults are trapped here.',
      icon: 'most adults',
      trait: 'lightness',
    },
    {
      title: 'The Loosener',
      subtitle: "You're starting to let go. It feels strange and right.",
      figures: 'Surfers. Travelers who sold everything.',
      icon: 'a surfer',
      trait: 'lightness',
    },
    {
      title: 'The Unbothered',
      subtitle: "Others' opinions slide off you like water.",
      figures: 'Jim Carrey post-fame. Tyler Durden energy.',
      icon: 'Jim Carrey',
      trait: 'lightness',
    },
    {
      title: 'The Free',
      subtitle: 'You move through life with terrifying lightness.',
      figures: 'Rumi. Oscar Wilde. Radical non-attachment.',
      icon: 'Oscar Wilde',
      trait: 'lightness',
    },
    {
      title: 'The Untouchable',
      subtitle: 'Nothing sticks. Nothing weighs. Pure freedom.',
      figures: 'Diogenes. The sage who laughs at kings.',
      icon: 'Diogenes',
      trait: 'lightness',
    },
  ],
  'presence': [
    {
      title: 'The Scattered',
      subtitle: 'Your mind is everywhere except here.',
      figures: 'Average phone user: 96 pickups per day.',
      icon: 'an average person',
      trait: 'presence',
    },
    {
      title: 'The Noticer',
      subtitle: "You're catching yourself drifting. That IS presence.",
      figures: 'Beginner meditators. Mindfulness newcomers.',
      icon: 'a meditator',
      trait: 'presence',
    },
    {
      title: 'The Centered',
      subtitle: 'You can hold this moment without reaching for the next.',
      figures: 'Thich Nhat Hanh in his early years.',
      icon: 'Thich Nhat Hanh',
      trait: 'presence',
    },
    {
      title: 'The Still Point',
      subtitle: 'Silence inside, even when the world is loud.',
      figures: 'Eckhart Tolle. Experienced Zen practitioners.',
      icon: 'Eckhart Tolle',
      trait: 'presence',
    },
    {
      title: 'The Witness',
      subtitle: 'Pure awareness. No narrator. Just being.',
      figures: 'Alan Watts. Ramana Maharshi. The unmoving eye.',
      icon: 'Alan Watts',
      trait: 'presence',
    },
  ],
  'bias-to-action': [
    {
      title: 'The Planner',
      subtitle: "You plan more than you do. Everyone starts here.",
      figures: '95% of ideas die in the planning stage.',
      icon: 'a planner',
      trait: 'speed',
    },
    {
      title: 'The Starter',
      subtitle: "You're building the habit of moving before you're ready.",
      figures: 'First-time founders. Junior builders.',
      icon: 'a first-time founder',
      trait: 'speed',
    },
    {
      title: 'The Executor',
      subtitle: 'Think then do. The gap is closing.',
      figures: 'Gary Vee. Prolific creators who never stop shipping.',
      icon: 'Gary Vee',
      trait: 'speed',
    },
    {
      title: 'The Machine',
      subtitle: 'Decision to action in seconds. No committee needed.',
      figures: 'Jeff Bezos. Elon in build mode. Zero hesitation.',
      icon: 'Jeff Bezos',
      trait: 'speed',
    },
    {
      title: 'The Unstoppable',
      subtitle: "You don't plan. You don't hesitate. You move.",
      figures: 'The ones who built empires while others had meetings.',
      icon: 'Elon Musk',
      trait: 'speed',
    },
  ],
  'visionary-framing': [
    {
      title: 'The Sleepwalker',
      subtitle: "You pass remarkable things every day without seeing them.",
      figures: 'Most people never look twice.',
      icon: 'a sleepwalker',
      trait: 'vision',
    },
    {
      title: 'The Noticer',
      subtitle: "You're starting to see what others walk past.",
      figures: 'Junior copywriters. Film students learning to see.',
      icon: 'a film student',
      trait: 'vision',
    },
    {
      title: 'The Framer',
      subtitle: 'You take the ordinary and make it magnetic.',
      figures: 'Great chefs. Architects. Skilled storytellers.',
      icon: 'Jiro Ono',
      trait: 'vision',
    },
    {
      title: 'The Visionary',
      subtitle: 'People see through your eyes and can\'t unsee it.',
      figures: 'Jiro Ono. Wes Anderson. Jonathan Ive.',
      icon: 'Wes Anderson',
      trait: 'vision',
    },
    {
      title: 'The Alchemist',
      subtitle: 'You transmute the mundane into the extraordinary.',
      figures: 'Steve Jobs on stage. Miyazaki. Pure vision.',
      icon: 'Miyazaki',
      trait: 'vision',
    },
  ],
}

// ─── Badge display order + short trait names for the Build Card ──────────────
export const BUILD_ORDER = [
  { slug: 'rdf',               label: 'The conviction of' },
  { slug: 'frame-control',     label: 'The frame of' },
  { slug: 'fearlessness',      label: 'The fearlessness of' },
  { slug: 'aggression',        label: 'The intensity of' },
  { slug: 'presence',          label: 'The presence of' },
  { slug: 'carefreeness',      label: 'The lightness of' },
  { slug: 'bias-to-action',    label: 'The speed of' },
  { slug: 'visionary-framing', label: 'The vision of' },
]

// ─── Visual evolution per chapter ────────────────────────────────────────────
// Controls glow intensity, opacity, and animation feel per chapter tier.

export const CHAPTER_VISUALS = [
  { glowOpacity: 0.04, borderOpacity: 0.08, iconOpacity: 0.5,  bgOpacity: 0.03, breathe: false },
  { glowOpacity: 0.08, borderOpacity: 0.14, iconOpacity: 0.65, bgOpacity: 0.05, breathe: false },
  { glowOpacity: 0.14, borderOpacity: 0.22, iconOpacity: 0.8,  bgOpacity: 0.07, breathe: true  },
  { glowOpacity: 0.22, borderOpacity: 0.30, iconOpacity: 0.9,  bgOpacity: 0.10, breathe: true  },
  { glowOpacity: 0.35, borderOpacity: 0.40, iconOpacity: 1.0,  bgOpacity: 0.14, breathe: true  },
]

// Streak fire thresholds
export const STREAK_TIERS = [
  { days: 0,  label: null,   flame: null },
  { days: 3,  label: 'ember', flame: '🔸' },
  { days: 7,  label: 'spark', flame: '🔥' },
  { days: 14, label: 'blaze', flame: '🔥🔥' },
  { days: 30, label: 'inferno', flame: '🔥🔥🔥' },
]

export function getStreakTier(streak) {
  let result = STREAK_TIERS[0]
  for (const t of STREAK_TIERS) {
    if (streak >= t.days) result = t
  }
  return result
}
