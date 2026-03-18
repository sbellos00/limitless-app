// Master migration script — runs all user data migrations in order
// Usage: node scripts/migrate-all.js [BASE_URL]
// Default: https://limitless-app-production.up.railway.app

const BASE_URL = process.argv[2] || 'https://limitless-app-production.up.railway.app'
const STEF = '00000000-0000-0000-0000-000000000001'
const JOHN = '00000000-0000-0000-0000-000000000002'

const LEVEL_THRESHOLDS = [0, 300, 1000, 3000, 6000, 11000, 18000, 28000]
const LEVEL_RATES = [0.7, 0.81, 0.93, 1.04, 1.16, 1.27, 1.39, 1.5]
const TIER_THRESHOLDS = [0, 100, 500, 1500, 5000, 10000]
const TIER_RATES = [0.7, 0.86, 1.02, 1.18, 1.34, 1.5]
const LVLNAMES = ['Awakened','Practitioner','Adept','Warrior','Master','Legend','Ascended','Eternal']
const PSYCH = 10

function getLevelIdx(xp) { let i=0; for(let j=0;j<LEVEL_THRESHOLDS.length;j++) if(xp>=LEVEL_THRESHOLDS[j]) i=j; return i }
function getTierIdx(xp) { let i=0; for(let j=0;j<TIER_THRESHOLDS.length;j++) if(xp>=TIER_THRESHOLDS[j]) i=j; return i }

// ─── Runner ──────────────────────────────────────────────────────────────────

async function postSession(userId, session) {
  const res = await fetch(`${BASE_URL}/mf-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(session),
  })
  return res.json()
}

async function runStandard(userId, sessions, label) {
  const stats = await fetch(`${BASE_URL}/mf-stats`, { headers: { 'X-User-Id': userId } }).then(r => r.json())
  let totalXp = stats.totalXp
  const skXp = {}
  for (const [k,v] of Object.entries(stats.skillTiers)) skXp[k] = v.xp

  console.log(`\n── ${label} (${sessions.length} sessions) ──`)
  console.log(`  Starting: ${totalXp} XP (${stats.levelName})`)

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const levelIdx = getLevelIdx(totalXp)

    let baseXp, finalXp

    if (s.splits) {
      // Manifestation: average tier rates
      const splitSkills = Object.keys(s.splits)
      const avgTierRate = splitSkills.reduce((sum, sk) => sum + TIER_RATES[getTierIdx(skXp[sk] || 0)], 0) / splitSkills.length
      const rate = (LEVEL_RATES[levelIdx] + avgTierRate) / 2
      baseXp = Math.round(s.dur * rate)
      finalXp = Math.round(baseXp * (s.mult || 1))
    } else {
      // Standard: primary skill tier
      const tierIdx = getTierIdx(skXp[s.primary] || 0)
      const rate = (LEVEL_RATES[levelIdx] + TIER_RATES[tierIdx]) / 2
      baseXp = Math.round(s.dur * rate)
      finalXp = Math.round(baseXp * (s.mult || 1))
    }

    const session = {
      id: s.id,
      timestamp: s.date,
      practiceId: s.pid,
      practiceName: s.name,
      xpAwarded: finalXp,
      baseXp: baseXp,
      multiplier: s.mult || 1,
    }
    if (s.splits) {
      session.skillSplits = s.splits
    } else {
      session.primarySkill = s.primary
      session.secondarySkill = s.secondary || null
    }

    const data = await postSession(userId, session)
    totalXp += finalXp

    // Track skill XP
    if (s.splits) {
      for (const [sk, ratio] of Object.entries(s.splits)) skXp[sk] = (skXp[sk] || 0) + Math.round(finalXp * ratio)
    } else {
      if (s.primary) skXp[s.primary] = (skXp[s.primary] || 0) + Math.round(finalXp * 0.8)
      if (s.secondary) skXp[s.secondary] = (skXp[s.secondary] || 0) + Math.round(finalXp * 0.2)
    }

    const mult = s.mult && s.mult > 1 ? ` x${s.mult}` : ''
    console.log(`  ${String(i+1).padStart(3)}. ${s.name.padEnd(26)} ${String(s.dur).padStart(5)} min${mult.padEnd(4)} -> ${String(finalXp).padStart(4)} XP  (${totalXp} ${LVLNAMES[getLevelIdx(totalXp)]})  [${data.ok?'OK':'FAIL: '+(data.error||'')}]`)
  }

  return totalXp
}

async function printStats(userId, name) {
  const s = await fetch(`${BASE_URL}/mf-stats`, { headers: { 'X-User-Id': userId } }).then(r => r.json())
  console.log(`\n  ${name}: Level ${s.levelIdx+1} ${s.levelName} | ${s.totalXp} XP | ${s.totalSessions} sessions`)
  const active = Object.entries(s.skillTiers).filter(([k,v])=>v.xp>0).sort((a,b)=>b[1].xp-a[1].xp)
  active.forEach(([k,v]) => console.log(`    ${k.padEnd(28)}${v.tierName.padEnd(12)}${String(v.xp).padStart(5)} xp`))
}

// ─── Session Definitions ─────────────────────────────────────────────────────

// Helper: s(id, name, dur, primary, secondary, date, mult)
const S = (id, name, pid, dur, primary, secondary, date, mult) => ({ id, name, pid, dur, primary, secondary, date, mult: mult || 1 })
const M = (id, name, pid, dur, splits, date, mult) => ({ id, name, pid, dur, splits, date, mult: mult || 1 })

// ── STEF: 43 FitMind history sessions ──
const STEF_HISTORY = [
  S('stef-h-01', 'Self-Inquiry A',       'self-inquiry-a',       15,   'inner-exploration',  'emotional-awareness', '2026-02-16T08:00:00Z'),
  S('stef-h-02', 'Resting in Awareness', 'resting-in-awareness', 14,   'natural-awareness',  null,                  '2026-02-16T09:00:00Z'),
  S('stef-h-03', 'Escaping VR',          'escaping-vr',          7,    'natural-flow',       'nondual-awareness',   '2026-02-16T10:00:00Z'),
  S('stef-h-04', 'Good Vibes B',         'good-vibes-b',         19,   'good-traits',        'blissful-presence',   '2026-02-16T11:00:00Z'),
  S('stef-h-05', 'Releasing',            'releasing',            6,    'emotional-awareness','mindset',              '2026-02-17T08:00:00Z'),
  S('stef-h-06', 'Hero Training',        'hero-training',        8,    'mindset',            'visualization',       '2026-02-17T09:00:00Z'),
  S('stef-h-07', 'Mind-Body Sync',       'mind-body-sync',       10.5, 'body-awareness',     'focused-attention',   '2026-02-17T10:00:00Z'),
  S('stef-h-08', 'Coming Alive',         'coming-alive',         7,    'body-awareness',     'blissful-presence',   '2026-02-18T08:00:00Z'),
  S('stef-h-09', 'Unlimited',            'unlimited',            6,    'inner-exploration',  'mindset',             '2026-02-18T09:00:00Z'),
  S('stef-h-10', 'Stoic Meditation A',   'stoic-meditation-a',   16,   'mindset',            null,                  '2026-02-18T10:00:00Z'),
  S('stef-h-11', 'Stoic Meditation B',   'stoic-meditation-b',   14,   'mindset',            null,                  '2026-02-19T08:00:00Z'),
  S('stef-h-12', 'Stoic Meditation C',   'stoic-meditation-c',   10,   'mindset',            null,                  '2026-02-19T09:00:00Z'),
  S('stef-h-13', 'Entering Jhana',       'entering-jhana',       30,   'blissful-presence',  'focused-attention',   '2026-02-19T10:00:00Z'),
  S('stef-h-14', 'Aware Jhanas',         'aware-jhanas',         60,   'blissful-presence',  'natural-awareness',   '2026-02-20T08:00:00Z'),
  S('stef-h-15', 'Toward the Roar',      'toward-the-roar',      5.5,  'mindset',            'emotional-awareness', '2026-02-20T09:00:00Z'),
  S('stef-h-16', 'Fresh View',           'fresh-view',           7,    'mindset',            'meta-awareness',      '2026-02-20T10:00:00Z'),
  S('stef-h-17', 'Pointing the Mind',    'pointing-the-mind',    9,    'mindset',            null,                  '2026-02-21T08:00:00Z'),
  S('stef-h-18', 'Inner Child',          'inner-child',          4,    'emotional-awareness','mindset',              '2026-02-21T09:00:00Z'),
  S('stef-h-19', 'Wanting This',         'wanting-this',         11.5, 'mindset',            'emotional-awareness', '2026-02-21T10:00:00Z'),
  S('stef-h-20', 'Seeing Links',         'seeing-links',         7,    'inner-exploration',  'meta-awareness',      '2026-02-22T08:00:00Z'),
  S('stef-h-21', 'Flexible Awareness',   'flexible-awareness',   10.5, 'meta-awareness',     null,                  '2026-02-22T09:00:00Z'),
  S('stef-h-22', 'Open Awareness',       'open-awareness',       11,   'meta-awareness',     'natural-awareness',   '2026-02-22T10:00:00Z'),
  S('stef-h-23', 'Non-Self',             'non-self',             12,   'blissful-presence',  'inner-exploration',   '2026-02-23T08:00:00Z'),
  S('stef-h-24', 'Many Rounds',          'many-rounds',          13.5, 'emotional-awareness','inner-exploration',   '2026-02-23T09:00:00Z'),
  S('stef-h-25', 'People',               'people',               12.5, 'emotional-awareness','inner-exploration',   '2026-02-23T10:00:00Z'),
  S('stef-h-26', 'Jumbo Head',           'jumbo-head',           9,    'natural-awareness',  'body-awareness',      '2026-02-24T08:00:00Z'),
  S('stef-h-27', 'Noting A',             'noting-a',             12,   'meta-awareness',     null,                  '2026-02-24T09:00:00Z'),
  S('stef-h-28', 'Noting B',             'noting-b',             12,   'meta-awareness',     null,                  '2026-02-24T10:00:00Z'),
  S('stef-h-29', 'Forgive Yourself',     'forgive-yourself',     15,   'good-traits',        'emotional-awareness', '2026-02-25T08:00:00Z'),
  S('stef-h-30', 'Insights',             'insights',             30,   'meta-awareness',     'blissful-presence',   '2026-02-25T09:00:00Z'),
  S('stef-h-31', 'Drop It',              'drop-it',              2,    'natural-flow',       null,                  '2026-02-25T10:00:00Z'),
  S('stef-h-32', 'Mobile Zen',           'mobile-zen',           13,   'blissful-presence',  'body-awareness',      '2026-02-26T08:00:00Z'),
  S('stef-h-33', 'Heroic Release',       'heroic-release',       13.5, 'blissful-presence',  'emotional-awareness', '2026-02-26T09:00:00Z'),
  S('stef-h-34', 'Shift into Awareness', 'shift-into-awareness', 12.5, 'natural-awareness',  null,                  '2026-02-27T08:00:00Z'),
  S('stef-h-35', 'Shifting Gears',       'shifting-gears',       5,    'natural-flow',       'meta-awareness',      '2026-02-27T09:00:00Z'),
  S('stef-h-36', 'Becoming the Space',   'becoming-the-space',   14,   'nondual-awareness',  'natural-awareness',   '2026-02-27T10:00:00Z'),
  S('stef-h-37', 'Skull Shining Breath', 'skull-shining-breath', 5,    'breath-control',     'body-awareness',      '2026-02-28T08:00:00Z'),
  S('stef-h-38', 'Body Scan A',          'body-scan-a',          11,   'body-awareness',     'focused-attention',   '2026-03-01T08:00:00Z'),
  S('stef-h-39', 'Breath Focus C',       'breath-focus-c',       10.5, 'focused-attention',  'breath-control',      '2026-03-01T09:00:00Z'),
  S('stef-h-40', 'Beyond Thought A',     'beyond-thought-a',     11.5, 'nondual-awareness',  'natural-awareness',   '2026-03-01T10:00:00Z'),
  S('stef-h-41', 'Mind Only',            'mind-only',            16,   'nondual-awareness',  'natural-awareness',   '2026-03-18T08:00:00Z'),
  S('stef-h-42', 'Yoga Nidra A',         'yoga-nidra-a',         15.5, 'body-awareness',     'transcendence',       '2026-03-18T09:00:00Z'),
  S('stef-h-43', 'Self-Inquiry A',       'self-inquiry-a',       15,   'inner-exploration',  'emotional-awareness', '2026-03-18T10:00:00Z'),
]

// ── STEF: 40 Foundations + extra sessions ──
const STEF_FOUNDATIONS = [
  S('stef-f-01', 'Tour Your Mind',       'tour-your-mind',        5,    'meta-awareness',      null,                  '2026-02-01T08:00:00Z'),
  S('stef-f-02', 'Tranquil Breathing',   'tranquil-breathing',    6,    'breath-control',      'body-awareness',      '2026-02-01T09:00:00Z'),
  S('stef-f-03', 'Inward Focus',         'inward-focus',          7,    'focused-attention',   'body-awareness',      '2026-02-02T08:00:00Z'),
  S('stef-f-04', 'Breath Focus A',       'breath-focus-a',        8,    'focused-attention',   'breath-control',      '2026-02-02T09:00:00Z'),
  S('stef-f-05', 'Finger Switching',     'finger-switching',      7,    'focused-attention',   'meta-awareness',      '2026-02-03T08:00:00Z'),
  S('stef-f-06', 'Breath Focus B',       'breath-focus-b',        8,    'focused-attention',   'breath-control',      '2026-02-03T09:00:00Z'),
  S('stef-f-07', 'Head Switching',       'head-switching',        8.5,  'focused-attention',   'body-awareness',      '2026-02-04T08:00:00Z'),
  S('stef-f-08', 'Body Scan A',          'body-scan-a',           11,   'body-awareness',      'focused-attention',   '2026-02-04T09:00:00Z'),
  S('stef-f-09', 'Breath Focus C',       'breath-focus-c',        10.5, 'focused-attention',   'breath-control',      '2026-02-05T08:00:00Z'),
  S('stef-f-10', 'Body Scan B',          'body-scan-b',           11.5, 'body-awareness',      'focused-attention',   '2026-02-05T09:00:00Z'),
  S('stef-f-11', 'Breath Focus D',       'breath-focus-d',        10,   'focused-attention',   'breath-control',      '2026-02-06T08:00:00Z'),
  S('stef-f-12', 'Mantra A',             'mantra-a',              10.5, 'focused-attention',   null,                  '2026-02-06T09:00:00Z'),
  S('stef-f-13', 'Breath Focus E',       'breath-focus-e',        10.5, 'focused-attention',   'breath-control',      '2026-02-07T08:00:00Z'),
  S('stef-f-14', 'Mantra B',             'mantra-b',              11,   'focused-attention',   null,                  '2026-02-07T09:00:00Z'),
  S('stef-f-15', 'Flexible Awareness',   'flexible-awareness',    10.5, 'meta-awareness',      null,                  '2026-02-08T08:00:00Z'),
  S('stef-f-16', 'Open Awareness',       'open-awareness',        11,   'meta-awareness',      'natural-awareness',   '2026-02-08T09:00:00Z'),
  S('stef-f-17', 'Noting A',             'noting-a',              12,   'meta-awareness',      null,                  '2026-02-09T08:00:00Z'),
  S('stef-f-18', 'Noting B',             'noting-b',              12,   'meta-awareness',      null,                  '2026-02-09T09:00:00Z'),
  S('stef-f-19', 'Noting Gone',          'noting-gone',           12,   'meta-awareness',      'natural-awareness',   '2026-02-10T08:00:00Z'),
  S('stef-f-20', 'Just Being',           'just-being',            12,   'natural-awareness',   null,                  '2026-02-10T09:00:00Z'),
  S('stef-f-21', 'Good Vibes A',         'good-vibes-a',          13,   'good-traits',         'blissful-presence',   '2026-02-11T08:00:00Z'),
  S('stef-f-22', 'Aware of Awareness',   'aware-of-awareness',    13.5, 'natural-awareness',   'nondual-awareness',   '2026-02-11T09:00:00Z'),
  S('stef-f-23', 'Glimpse',              'glimpse',               13,   'natural-awareness',   'nondual-awareness',   '2026-02-12T08:00:00Z'),
  S('stef-f-24', 'Headless Way',         'headless-way',          14,   'nondual-awareness',   'natural-awareness',   '2026-02-12T09:00:00Z'),
  S('stef-f-25', 'Self-Inquiry A',       'self-inquiry-a',        15,   'inner-exploration',   'emotional-awareness', '2026-02-13T08:00:00Z'),
  S('stef-f-26', 'Yoga Nidra A',         'yoga-nidra-a',          15.5, 'body-awareness',      'transcendence',       '2026-02-13T09:00:00Z'),
  S('stef-f-27', 'Boundless',            'boundless-bliss',       12.5, 'blissful-presence',   'natural-awareness',   '2026-02-14T08:00:00Z'),
  S('stef-f-28', 'Neural Recoding A',    'neural-recoding-a',     13,   'blissful-presence',   'subconscious-programming', '2026-02-14T09:00:00Z'),
  S('stef-f-29', 'Quiet Mind',           'quiet-mind-bliss',      12,   'blissful-presence',   'natural-flow',        '2026-02-14T10:00:00Z'),
  S('stef-f-30', '2 Qs',                 '2-qs',                  9.5,  'inner-exploration',   'emotional-awareness', '2026-02-15T08:00:00Z'),
  S('stef-f-31', 'Shift into Awareness', 'shift-into-awareness',  12.5, 'natural-awareness',   null,                  '2026-02-15T09:00:00Z'),
  S('stef-f-32', 'Jumbo Head',           'jumbo-head',            9,    'natural-awareness',   'body-awareness',      '2026-02-15T10:00:00Z'),
  S('stef-f-33', 'Beyond Thought A',     'beyond-thought-a',      11.5, 'nondual-awareness',   'natural-awareness',   '2026-02-15T11:00:00Z'),
  S('stef-f-34', 'Just Like Me',         'just-like-me',          9,    'good-traits',         'emotional-awareness', '2026-02-15T12:00:00Z'),
  S('stef-f-35', 'Exemplar',             'exemplar',              5.5,  'good-traits',         'mindset',             '2026-02-15T13:00:00Z'),
  S('stef-f-36', 'NPNNP',                'npnnp',                 30,   'nondual-awareness',   'blissful-presence',   '2026-02-15T14:00:00Z'),
  S('stef-f-37', 'Pointing the Mind',    'pointing-the-mind',     9,    'mindset',             null,                  '2026-02-15T15:00:00Z'),
  S('stef-f-38', 'Breaking Chains',      'breaking-chains',       15.5, 'emotional-awareness', 'mindset',             '2026-02-15T16:00:00Z'),
  S('stef-f-39', 'Neti Neti',            'neti-neti',             7.5,  'inner-exploration',   'nondual-awareness',   '2026-02-15T17:00:00Z'),
  S('stef-f-40', 'Unlimited',            'unlimited',             6,    'inner-exploration',   'mindset',             '2026-02-15T18:00:00Z'),
]

// ── STEF: 3 psychedelic sessions ──
const STEF_PSYCHEDELIC = [
  S('stef-p-01', 'Breath Focus E',      'breath-focus-e',     10.5, 'focused-attention', 'breath-control', '2026-03-15T08:00:00Z', PSYCH),
  S('stef-p-02', 'Mantra B',            'mantra-b',           11,   'focused-attention', null,             '2026-03-15T09:00:00Z', PSYCH),
  S('stef-p-03', 'Flexible Awareness',  'flexible-awareness', 10.5, 'meta-awareness',    null,             '2026-03-15T10:00:00Z', PSYCH),
]

// ── STEF: 15 manifestation sessions ──
const STEF_MANIFESTATION = [
  M('stef-m-01', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-10T08:00:00Z'),
  M('stef-m-02', 'Dream Life (OG)',        'dream-life-og',      20, { visualization: 0.40, 'inner-exploration': 0.40, 'emotional-awareness': 0.20 },      '2026-03-10T09:00:00Z'),
  M('stef-m-03', 'Instant Alignment',      'instant-alignment',  12, { 'blissful-presence': 0.80, 'subconscious-programming': 0.20 },                      '2026-03-10T10:00:00Z'),
  M('stef-m-04', 'Forest Visualization',   'forest-visualization',20, { visualization: 0.50, 'inner-exploration': 0.20, transcendence: 0.30 },              '2026-03-10T11:00:00Z'),
  M('stef-m-05', 'Dream Life (Gratitude)', 'dream-life-gratitude',19, { visualization: 0.40, 'inner-exploration': 0.40, 'blissful-presence': 0.20 },        '2026-03-10T12:00:00Z'),
  M('stef-m-06', 'Attract Abundance',      'attract-abundance',  15, { 'subconscious-programming': 1.00 },                                                 '2026-03-10T13:00:00Z'),
  M('stef-m-07', 'Hypnosis',              'hypnosis',           20, { 'subconscious-programming': 0.50, visualization: 0.30, transcendence: 0.20 },         '2026-03-10T14:00:00Z'),
  M('stef-m-08', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-11T08:00:00Z'),
  M('stef-m-09', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-11T09:00:00Z'),
  M('stef-m-10', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-12T08:00:00Z'),
  M('stef-m-11', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-12T09:00:00Z'),
  M('stef-m-12', 'Quantum Shift',          'quantum-shift',      20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-13T08:00:00Z'),
  M('stef-m-13', 'Dream Life (OG)',        'dream-life-og',      20, { visualization: 0.40, 'inner-exploration': 0.40, 'emotional-awareness': 0.20 },      '2026-03-14T08:00:00Z'),
  M('stef-m-14', 'Instant Alignment',      'instant-alignment',  12, { 'blissful-presence': 0.80, 'subconscious-programming': 0.20 },                      '2026-03-14T09:00:00Z'),
  M('stef-m-15', 'Forest Visualization',   'forest-visualization',20, { visualization: 0.50, 'inner-exploration': 0.20, transcendence: 0.30 },              '2026-03-14T10:00:00Z'),
]

// ── STEF: 2 more psychedelic (self-guided + quantum shift) ──
const STEF_PSYCHEDELIC_2 = [
  S('stef-p-04', 'Self-Guided (30 min)', 'self-guided-30', 30, 'inner-exploration', null, '2026-03-15T11:00:00Z', PSYCH),
  M('stef-p-05', 'Quantum Shift',        'quantum-shift',  20, { visualization: 0.33, 'inner-exploration': 0.33, 'subconscious-programming': 0.33 }, '2026-03-15T12:00:00Z', PSYCH),
]

// ── JOHN: same 43 FitMind history ──
const JOHN_HISTORY = STEF_HISTORY.map((s, i) => ({ ...s, id: s.id.replace('stef-h-', 'john-h-') }))

// ── JOHN: same 15 manifestation sessions ──
const JOHN_MANIFESTATION = STEF_MANIFESTATION.map((s, i) => ({ ...s, id: s.id.replace('stef-m-', 'john-m-') }))

// ── JOHN: batch 2 (18 regular + 1 psychedelic) ──
const JOHN_BATCH2 = [
  S('john-b2-01', 'Tour Your Mind',       'tour-your-mind',       5,    'meta-awareness',      null,                '2026-03-05T08:00:00Z'),
  S('john-b2-02', 'Tranquil Breathing',   'tranquil-breathing',   6,    'breath-control',      'body-awareness',    '2026-03-05T09:00:00Z'),
  S('john-b2-03', 'Inward Focus',         'inward-focus',         7,    'focused-attention',   'body-awareness',    '2026-03-06T08:00:00Z'),
  S('john-b2-04', 'Breath Focus A',       'breath-focus-a',       8,    'focused-attention',   'breath-control',    '2026-03-06T09:00:00Z'),
  S('john-b2-05', 'Finger Switching',     'finger-switching',     7,    'focused-attention',   'meta-awareness',    '2026-03-07T08:00:00Z'),
  S('john-b2-06', 'Breath Focus B',       'breath-focus-b',       8,    'focused-attention',   'breath-control',    '2026-03-07T09:00:00Z'),
  S('john-b2-07', 'Head Switching',       'head-switching',       8.5,  'focused-attention',   'body-awareness',    '2026-03-08T08:00:00Z'),
  S('john-b2-08', 'Body Scan A',          'body-scan-a',          11,   'body-awareness',      'focused-attention', '2026-03-08T09:00:00Z'),
  S('john-b2-09', 'Shift into Awareness', 'shift-into-awareness', 12.5, 'natural-awareness',   null,                '2026-03-09T08:00:00Z'),
  S('john-b2-10', 'Jumbo Head',           'jumbo-head',           9,    'natural-awareness',   'body-awareness',    '2026-03-09T09:00:00Z'),
  S('john-b2-11', 'Beyond Thought A',     'beyond-thought-a',     11.5, 'nondual-awareness',   'natural-awareness', '2026-03-09T10:00:00Z'),
  S('john-b2-12', 'Just Like Me',         'just-like-me',         9,    'good-traits',         'emotional-awareness','2026-03-09T11:00:00Z'),
  S('john-b2-13', 'Exemplar',             'exemplar',             5.5,  'good-traits',         'mindset',           '2026-03-09T12:00:00Z'),
  S('john-b2-14', 'NPNNP',                'npnnp',                30,   'nondual-awareness',   'blissful-presence', '2026-03-09T13:00:00Z'),
  S('john-b2-15', 'Pointing the Mind',    'pointing-the-mind',    9,    'mindset',             null,                '2026-03-09T14:00:00Z'),
  S('john-b2-16', 'Breaking Chains',      'breaking-chains',      15.5, 'emotional-awareness', 'mindset',           '2026-03-09T15:00:00Z'),
  S('john-b2-17', 'Neti Neti',            'neti-neti',            7.5,  'inner-exploration',   'nondual-awareness', '2026-03-09T16:00:00Z'),
  S('john-b2-18', 'Unlimited',            'unlimited',            6,    'inner-exploration',   'mindset',           '2026-03-09T17:00:00Z'),
]

const JOHN_PSYCHEDELIC = [
  S('john-p-01', 'Self-Guided (60 min)', 'self-guided-60', 60, 'inner-exploration', null, '2026-03-15T08:00:00Z', PSYCH),
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log('  MENTAL FITNESS DATA MIGRATION')
  console.log('  Target: ' + BASE_URL)
  console.log('='.repeat(60))

  // ── STEF ──
  console.log('\n' + '='.repeat(60))
  console.log('  STEF')
  console.log('='.repeat(60))

  await runStandard(STEF, STEF_FOUNDATIONS, 'Stef: Foundations + Extra (40)')
  await runStandard(STEF, STEF_HISTORY, 'Stef: FitMind History (43)')
  await runStandard(STEF, STEF_PSYCHEDELIC, 'Stef: Psychedelic Sessions (3)')
  await runStandard(STEF, STEF_MANIFESTATION, 'Stef: Manifestation Sessions (15)')
  await runStandard(STEF, STEF_PSYCHEDELIC_2, 'Stef: Psychedelic Sessions 2 (2)')

  await printStats(STEF, 'STEF FINAL')

  // ── JOHN ──
  console.log('\n' + '='.repeat(60))
  console.log('  JOHN')
  console.log('='.repeat(60))

  await runStandard(JOHN, JOHN_MANIFESTATION, 'John: Manifestation Sessions (15)')
  await runStandard(JOHN, JOHN_HISTORY, 'John: FitMind History (43)')
  await runStandard(JOHN, JOHN_BATCH2, 'John: Batch 2 (18)')
  await runStandard(JOHN, JOHN_PSYCHEDELIC, 'John: Psychedelic (1)')

  await printStats(JOHN, 'JOHN FINAL')

  console.log('\n' + '='.repeat(60))
  console.log('  MIGRATION COMPLETE')
  console.log('='.repeat(60))
}

main().catch(console.error)
