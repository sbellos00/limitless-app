// Migrate Stef's real FitMind history to Railway
// Run: node scripts/migrate-stef-history.js

const BASE_URL = 'https://limitless-app-production.up.railway.app'
const USER_ID = '00000000-0000-0000-0000-000000000001'

const LEVEL_THRESHOLDS = [0, 300, 1000, 3000, 6000, 11000, 18000, 28000]
const LEVEL_RATES = [0.7, 0.81, 0.93, 1.04, 1.16, 1.27, 1.39, 1.5]
const TIER_THRESHOLDS = [0, 100, 500, 1500, 5000, 10000]
const TIER_RATES = [0.7, 0.86, 1.02, 1.18, 1.34, 1.5]

function getLevelIdx(xp) {
  let idx = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) idx = i
  }
  return idx
}

function getTierIdx(xp) {
  let idx = 0
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (xp >= TIER_THRESHOLDS[i]) idx = i
  }
  return idx
}

function computeBaseXp(durationMin, levelIdx, skillTierIdx) {
  const rate = (LEVEL_RATES[levelIdx] + TIER_RATES[skillTierIdx]) / 2
  return Math.round(durationMin * rate)
}

// All sessions in rough chronological order
// Sessions without specific dates spread across Feb 16 - Feb 28
// Workout 1/3 = March 1, Workout 18/3 = March 18
const SESSIONS = [
  // ── Earlier sessions (spread Feb 16 - Feb 28) ──
  { name: 'Self-Inquiry A',      id: 'self-inquiry-a',       dur: 15,   primary: 'inner-exploration',  secondary: 'emotional-awareness', date: '2026-02-16T08:00:00Z' },
  { name: 'Resting in Awareness', id: 'resting-in-awareness', dur: 14,   primary: 'natural-awareness',  secondary: null,                  date: '2026-02-16T09:00:00Z' },
  { name: 'Escaping VR',         id: 'escaping-vr',          dur: 7,    primary: 'natural-flow',       secondary: 'nondual-awareness',   date: '2026-02-16T10:00:00Z' },
  { name: 'Good Vibes B',        id: 'good-vibes-b',         dur: 19,   primary: 'good-traits',        secondary: 'blissful-presence',   date: '2026-02-16T11:00:00Z' },
  { name: 'Releasing',           id: 'releasing',            dur: 6,    primary: 'emotional-awareness', secondary: 'mindset',             date: '2026-02-17T08:00:00Z' },
  { name: 'Hero Training',       id: 'hero-training',        dur: 8,    primary: 'mindset',            secondary: 'visualization',       date: '2026-02-17T09:00:00Z' },
  { name: 'Mind-Body Sync',      id: 'mind-body-sync',       dur: 10.5, primary: 'body-awareness',     secondary: 'focused-attention',   date: '2026-02-17T10:00:00Z' },
  { name: 'Coming Alive',        id: 'coming-alive',         dur: 7,    primary: 'body-awareness',     secondary: 'blissful-presence',   date: '2026-02-18T08:00:00Z' },
  { name: 'Unlimited',           id: 'unlimited',            dur: 6,    primary: 'inner-exploration',  secondary: 'mindset',             date: '2026-02-18T09:00:00Z' },
  { name: 'Stoic Meditation A',  id: 'stoic-meditation-a',   dur: 16,   primary: 'mindset',            secondary: null,                  date: '2026-02-18T10:00:00Z' },
  { name: 'Stoic Meditation B',  id: 'stoic-meditation-b',   dur: 14,   primary: 'mindset',            secondary: null,                  date: '2026-02-19T08:00:00Z' },
  { name: 'Stoic Meditation C',  id: 'stoic-meditation-c',   dur: 10,   primary: 'mindset',            secondary: null,                  date: '2026-02-19T09:00:00Z' },
  { name: 'Entering Jhana',      id: 'entering-jhana',       dur: 30,   primary: 'blissful-presence',  secondary: 'focused-attention',   date: '2026-02-19T10:00:00Z' },
  { name: 'Aware Jhanas',        id: 'aware-jhanas',         dur: 60,   primary: 'blissful-presence',  secondary: 'natural-awareness',   date: '2026-02-20T08:00:00Z' },
  { name: 'Toward the Roar',     id: 'toward-the-roar',      dur: 5.5,  primary: 'mindset',            secondary: 'emotional-awareness', date: '2026-02-20T09:00:00Z' },
  { name: 'Fresh View',          id: 'fresh-view',           dur: 7,    primary: 'mindset',            secondary: 'meta-awareness',      date: '2026-02-20T10:00:00Z' },
  { name: 'Pointing the Mind',   id: 'pointing-the-mind',    dur: 9,    primary: 'mindset',            secondary: null,                  date: '2026-02-21T08:00:00Z' },
  { name: 'Inner Child',         id: 'inner-child',          dur: 4,    primary: 'emotional-awareness', secondary: 'mindset',            date: '2026-02-21T09:00:00Z' },
  { name: 'Wanting This',        id: 'wanting-this',         dur: 11.5, primary: 'mindset',            secondary: 'emotional-awareness', date: '2026-02-21T10:00:00Z' },
  { name: 'Seeing Links',        id: 'seeing-links',         dur: 7,    primary: 'inner-exploration',  secondary: 'meta-awareness',      date: '2026-02-22T08:00:00Z' },
  { name: 'Flexible Awareness',  id: 'flexible-awareness',   dur: 10.5, primary: 'meta-awareness',     secondary: null,                  date: '2026-02-22T09:00:00Z' },
  { name: 'Open Awareness',      id: 'open-awareness',       dur: 11,   primary: 'meta-awareness',     secondary: 'natural-awareness',   date: '2026-02-22T10:00:00Z' },
  { name: 'Non-Self',            id: 'non-self',             dur: 12,   primary: 'blissful-presence',  secondary: 'inner-exploration',   date: '2026-02-23T08:00:00Z' },
  { name: 'Many Rounds',         id: 'many-rounds',          dur: 13.5, primary: 'emotional-awareness', secondary: 'inner-exploration',  date: '2026-02-23T09:00:00Z' },
  { name: 'People',              id: 'people',               dur: 12.5, primary: 'emotional-awareness', secondary: 'inner-exploration',  date: '2026-02-23T10:00:00Z' },
  { name: 'Jumbo Head',          id: 'jumbo-head',           dur: 9,    primary: 'natural-awareness',  secondary: 'body-awareness',      date: '2026-02-24T08:00:00Z' },
  { name: 'Noting A',            id: 'noting-a',             dur: 12,   primary: 'meta-awareness',     secondary: null,                  date: '2026-02-24T09:00:00Z' },
  { name: 'Noting B',            id: 'noting-b',             dur: 12,   primary: 'meta-awareness',     secondary: null,                  date: '2026-02-24T10:00:00Z' },
  { name: 'Forgive Yourself',    id: 'forgive-yourself',     dur: 15,   primary: 'good-traits',        secondary: 'emotional-awareness', date: '2026-02-25T08:00:00Z' },
  { name: 'Insights',            id: 'insights',             dur: 30,   primary: 'meta-awareness',     secondary: 'blissful-presence',   date: '2026-02-25T09:00:00Z' },
  { name: 'Drop It',             id: 'drop-it',              dur: 2,    primary: 'natural-flow',       secondary: null,                  date: '2026-02-25T10:00:00Z' },
  { name: 'Mobile Zen',          id: 'mobile-zen',           dur: 13,   primary: 'blissful-presence',  secondary: 'body-awareness',      date: '2026-02-26T08:00:00Z' },
  { name: 'Heroic Release',      id: 'heroic-release',       dur: 13.5, primary: 'blissful-presence',  secondary: 'emotional-awareness', date: '2026-02-26T09:00:00Z' },
  { name: 'Shift into Awareness', id: 'shift-into-awareness', dur: 12.5, primary: 'natural-awareness', secondary: null,                  date: '2026-02-27T08:00:00Z' },
  { name: 'Shifting Gears',      id: 'shifting-gears',       dur: 5,    primary: 'natural-flow',       secondary: 'meta-awareness',      date: '2026-02-27T09:00:00Z' },
  { name: 'Becoming the Space',  id: 'becoming-the-space',   dur: 14,   primary: 'nondual-awareness',  secondary: 'natural-awareness',   date: '2026-02-27T10:00:00Z' },
  { name: 'Skull Shining Breath', id: 'skull-shining-breath', dur: 5,   primary: 'breath-control',     secondary: 'body-awareness',      date: '2026-02-28T08:00:00Z' },

  // ── Workout March 1 ──
  { name: 'Body Scan A',         id: 'body-scan-a',          dur: 11,   primary: 'body-awareness',     secondary: 'focused-attention',   date: '2026-03-01T08:00:00Z' },
  { name: 'Breath Focus C',      id: 'breath-focus-c',       dur: 10.5, primary: 'focused-attention',  secondary: 'breath-control',      date: '2026-03-01T09:00:00Z' },
  { name: 'Beyond Thought A',    id: 'beyond-thought-a',     dur: 11.5, primary: 'nondual-awareness',  secondary: 'natural-awareness',   date: '2026-03-01T10:00:00Z' },

  // ── Workout March 18 ──
  { name: 'Mind Only',           id: 'mind-only',            dur: 16,   primary: 'nondual-awareness',  secondary: 'natural-awareness',   date: '2026-03-18T08:00:00Z' },
  { name: 'Yoga Nidra A',        id: 'yoga-nidra-a',         dur: 15.5, primary: 'body-awareness',     secondary: 'transcendence',       date: '2026-03-18T09:00:00Z' },
  { name: 'Self-Inquiry A',      id: 'self-inquiry-a',       dur: 15,   primary: 'inner-exploration',  secondary: 'emotional-awareness', date: '2026-03-18T10:00:00Z' },
]

async function migrate() {
  // Track running state for XP computation
  let totalXp = 0
  const skillXp = {}

  console.log(`Migrating ${SESSIONS.length} sessions to ${BASE_URL}`)
  console.log(`User: ${USER_ID} (Stef)`)
  console.log('')

  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i]

    // Current level and skill tier
    const levelIdx = getLevelIdx(totalXp)
    const primarySkillXp = skillXp[s.primary] || 0
    const tierIdx = getTierIdx(primarySkillXp)

    // Compute base XP
    const baseXp = computeBaseXp(s.dur, levelIdx, tierIdx)

    // Build session
    const session = {
      id: `migrate-stef-${i}-${s.id}`,
      timestamp: s.date,
      practiceId: s.id,
      practiceName: s.name,
      primarySkill: s.primary,
      secondarySkill: s.secondary,
      xpAwarded: baseXp,
      baseXp: baseXp,
      multiplier: 1,
    }

    // POST to Railway
    const res = await fetch(`${BASE_URL}/mf-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
      body: JSON.stringify(session),
    })
    const data = await res.json()

    // Update running totals
    totalXp += baseXp
    if (s.primary) {
      skillXp[s.primary] = (skillXp[s.primary] || 0) + Math.round(baseXp * 0.8)
    }
    if (s.secondary) {
      skillXp[s.secondary] = (skillXp[s.secondary] || 0) + Math.round(baseXp * 0.2)
    }

    const lvlName = ['Awakened','Practitioner','Adept','Warrior','Master','Legend','Ascended','Eternal'][levelIdx]
    const status = data.ok ? 'OK' : data.error || 'FAIL'
    console.log(`  ${String(i+1).padStart(2)}. ${s.name.padEnd(24)} ${s.dur.toString().padStart(5)} min → ${String(baseXp).padStart(3)} XP  (total: ${totalXp}, ${lvlName})  [${status}]`)
  }

  console.log('')
  console.log('── Done ──')
  console.log(`Total XP: ${totalXp}`)
  console.log(`Level: ${getLevelIdx(totalXp) + 1} ${['Awakened','Practitioner','Adept','Warrior','Master','Legend','Ascended','Eternal'][getLevelIdx(totalXp)]}`)
  console.log(`Sessions: ${SESSIONS.length}`)
  console.log('')

  // Verify
  const stats = await fetch(`${BASE_URL}/mf-stats`, {
    headers: { 'X-User-Id': USER_ID },
  }).then(r => r.json())
  console.log('── Verified from server ──')
  console.log(`Total XP: ${stats.totalXp}`)
  console.log(`Level: ${stats.levelIdx + 1} ${stats.levelName}`)
  console.log(`Sessions: ${stats.totalSessions}`)
}

migrate().catch(console.error)
