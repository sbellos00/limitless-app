const BASE_URL = 'https://limitless-app-production.up.railway.app'
const USER_ID = '00000000-0000-0000-0000-000000000002'
const LEVEL_THRESHOLDS = [0, 300, 1000, 3000, 6000, 11000, 18000, 28000]
const LEVEL_RATES = [0.7, 0.81, 0.93, 1.04, 1.16, 1.27, 1.39, 1.5]
const TIER_THRESHOLDS = [0, 100, 500, 1500, 5000, 10000]
const TIER_RATES = [0.7, 0.86, 1.02, 1.18, 1.34, 1.5]

function getLevelIdx(xp) { let i=0; for(let j=0;j<LEVEL_THRESHOLDS.length;j++) if(xp>=LEVEL_THRESHOLDS[j]) i=j; return i }
function getTierIdx(xp) { let i=0; for(let j=0;j<TIER_THRESHOLDS.length;j++) if(xp>=TIER_THRESHOLDS[j]) i=j; return i }
const LVLNAMES = ['Awakened','Practitioner','Adept','Warrior','Master','Legend','Ascended','Eternal']

async function run() {
  const stats = await fetch(BASE_URL+'/mf-stats', {headers:{'X-User-Id':USER_ID}}).then(r=>r.json())
  let totalXp = stats.totalXp
  const skillXpMap = {}
  for (const [k,v] of Object.entries(stats.skillTiers)) skillXpMap[k] = v.xp
  console.log('Starting: ' + totalXp + ' XP (' + stats.levelName + '), ' + stats.totalSessions + ' sessions')
  console.log('')

  const sessions = [
    { name: 'Self-Inquiry A',       id: 'self-inquiry-a',        dur: 15,   primary: 'inner-exploration',   secondary: 'emotional-awareness', date: '2026-02-16T08:00:00Z' },
    { name: 'Resting in Awareness', id: 'resting-in-awareness',  dur: 14,   primary: 'natural-awareness',   secondary: null,                  date: '2026-02-16T09:00:00Z' },
    { name: 'Escaping VR',          id: 'escaping-vr',           dur: 7,    primary: 'natural-flow',        secondary: 'nondual-awareness',   date: '2026-02-16T10:00:00Z' },
    { name: 'Good Vibes B',         id: 'good-vibes-b',          dur: 19,   primary: 'good-traits',         secondary: 'blissful-presence',   date: '2026-02-16T11:00:00Z' },
    { name: 'Releasing',            id: 'releasing',             dur: 6,    primary: 'emotional-awareness', secondary: 'mindset',             date: '2026-02-17T08:00:00Z' },
    { name: 'Hero Training',        id: 'hero-training',         dur: 8,    primary: 'mindset',             secondary: 'visualization',       date: '2026-02-17T09:00:00Z' },
    { name: 'Mind-Body Sync',       id: 'mind-body-sync',        dur: 10.5, primary: 'body-awareness',      secondary: 'focused-attention',   date: '2026-02-17T10:00:00Z' },
    { name: 'Coming Alive',         id: 'coming-alive',          dur: 7,    primary: 'body-awareness',      secondary: 'blissful-presence',   date: '2026-02-18T08:00:00Z' },
    { name: 'Unlimited',            id: 'unlimited',             dur: 6,    primary: 'inner-exploration',   secondary: 'mindset',             date: '2026-02-18T09:00:00Z' },
    { name: 'Stoic Meditation A',   id: 'stoic-meditation-a',    dur: 16,   primary: 'mindset',             secondary: null,                  date: '2026-02-18T10:00:00Z' },
    { name: 'Stoic Meditation B',   id: 'stoic-meditation-b',    dur: 14,   primary: 'mindset',             secondary: null,                  date: '2026-02-19T08:00:00Z' },
    { name: 'Stoic Meditation C',   id: 'stoic-meditation-c',    dur: 10,   primary: 'mindset',             secondary: null,                  date: '2026-02-19T09:00:00Z' },
    { name: 'Entering Jhana',       id: 'entering-jhana',        dur: 30,   primary: 'blissful-presence',   secondary: 'focused-attention',   date: '2026-02-19T10:00:00Z' },
    { name: 'Aware Jhanas',         id: 'aware-jhanas',          dur: 60,   primary: 'blissful-presence',   secondary: 'natural-awareness',   date: '2026-02-20T08:00:00Z' },
    { name: 'Toward the Roar',      id: 'toward-the-roar',       dur: 5.5,  primary: 'mindset',             secondary: 'emotional-awareness', date: '2026-02-20T09:00:00Z' },
    { name: 'Fresh View',           id: 'fresh-view',            dur: 7,    primary: 'mindset',             secondary: 'meta-awareness',      date: '2026-02-20T10:00:00Z' },
    { name: 'Pointing the Mind',    id: 'pointing-the-mind',     dur: 9,    primary: 'mindset',             secondary: null,                  date: '2026-02-21T08:00:00Z' },
    { name: 'Inner Child',          id: 'inner-child',           dur: 4,    primary: 'emotional-awareness', secondary: 'mindset',             date: '2026-02-21T09:00:00Z' },
    { name: 'Wanting This',         id: 'wanting-this',          dur: 11.5, primary: 'mindset',             secondary: 'emotional-awareness', date: '2026-02-21T10:00:00Z' },
    { name: 'Seeing Links',         id: 'seeing-links',          dur: 7,    primary: 'inner-exploration',   secondary: 'meta-awareness',      date: '2026-02-22T08:00:00Z' },
    { name: 'Flexible Awareness',   id: 'flexible-awareness',    dur: 10.5, primary: 'meta-awareness',      secondary: null,                  date: '2026-02-22T09:00:00Z' },
    { name: 'Open Awareness',       id: 'open-awareness',        dur: 11,   primary: 'meta-awareness',      secondary: 'natural-awareness',   date: '2026-02-22T10:00:00Z' },
    { name: 'Non-Self',             id: 'non-self',              dur: 12,   primary: 'blissful-presence',   secondary: 'inner-exploration',   date: '2026-02-23T08:00:00Z' },
    { name: 'Many Rounds',          id: 'many-rounds',           dur: 13.5, primary: 'emotional-awareness', secondary: 'inner-exploration',   date: '2026-02-23T09:00:00Z' },
    { name: 'People',               id: 'people',                dur: 12.5, primary: 'emotional-awareness', secondary: 'inner-exploration',   date: '2026-02-23T10:00:00Z' },
    { name: 'Jumbo Head',           id: 'jumbo-head',            dur: 9,    primary: 'natural-awareness',   secondary: 'body-awareness',      date: '2026-02-24T08:00:00Z' },
    { name: 'Noting A',             id: 'noting-a',              dur: 12,   primary: 'meta-awareness',      secondary: null,                  date: '2026-02-24T09:00:00Z' },
    { name: 'Noting B',             id: 'noting-b',              dur: 12,   primary: 'meta-awareness',      secondary: null,                  date: '2026-02-24T10:00:00Z' },
    { name: 'Forgive Yourself',     id: 'forgive-yourself',      dur: 15,   primary: 'good-traits',         secondary: 'emotional-awareness', date: '2026-02-25T08:00:00Z' },
    { name: 'Insights',             id: 'insights',              dur: 30,   primary: 'meta-awareness',      secondary: 'blissful-presence',   date: '2026-02-25T09:00:00Z' },
    { name: 'Drop It',              id: 'drop-it',               dur: 2,    primary: 'natural-flow',        secondary: null,                  date: '2026-02-25T10:00:00Z' },
    { name: 'Mobile Zen',           id: 'mobile-zen',            dur: 13,   primary: 'blissful-presence',   secondary: 'body-awareness',      date: '2026-02-26T08:00:00Z' },
    { name: 'Heroic Release',       id: 'heroic-release',        dur: 13.5, primary: 'blissful-presence',   secondary: 'emotional-awareness', date: '2026-02-26T09:00:00Z' },
    { name: 'Shift into Awareness', id: 'shift-into-awareness',  dur: 12.5, primary: 'natural-awareness',   secondary: null,                  date: '2026-02-27T08:00:00Z' },
    { name: 'Shifting Gears',       id: 'shifting-gears',        dur: 5,    primary: 'natural-flow',        secondary: 'meta-awareness',      date: '2026-02-27T09:00:00Z' },
    { name: 'Becoming the Space',   id: 'becoming-the-space',    dur: 14,   primary: 'nondual-awareness',   secondary: 'natural-awareness',   date: '2026-02-27T10:00:00Z' },
    { name: 'Skull Shining Breath', id: 'skull-shining-breath',  dur: 5,    primary: 'breath-control',      secondary: 'body-awareness',      date: '2026-02-28T08:00:00Z' },
    { name: 'Body Scan A',          id: 'body-scan-a',           dur: 11,   primary: 'body-awareness',      secondary: 'focused-attention',   date: '2026-03-01T08:00:00Z' },
    { name: 'Breath Focus C',       id: 'breath-focus-c',        dur: 10.5, primary: 'focused-attention',   secondary: 'breath-control',      date: '2026-03-01T09:00:00Z' },
    { name: 'Beyond Thought A',     id: 'beyond-thought-a',      dur: 11.5, primary: 'nondual-awareness',   secondary: 'natural-awareness',   date: '2026-03-01T10:00:00Z' },
    { name: 'Mind Only',            id: 'mind-only',             dur: 16,   primary: 'nondual-awareness',   secondary: 'natural-awareness',   date: '2026-03-18T08:00:00Z' },
    { name: 'Yoga Nidra A',         id: 'yoga-nidra-a',          dur: 15.5, primary: 'body-awareness',      secondary: 'transcendence',       date: '2026-03-18T09:00:00Z' },
    { name: 'Self-Inquiry A',       id: 'self-inquiry-a',        dur: 15,   primary: 'inner-exploration',   secondary: 'emotional-awareness', date: '2026-03-18T10:00:00Z' },
  ]

  console.log('Migrating ' + sessions.length + ' sessions for John')
  console.log('')

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const levelIdx = getLevelIdx(totalXp)
    const primarySkillXp = skillXpMap[s.primary] || 0
    const tierIdx = getTierIdx(primarySkillXp)
    const rate = (LEVEL_RATES[levelIdx] + TIER_RATES[tierIdx]) / 2
    const baseXp = Math.round(s.dur * rate)

    const session = {
      id: 'migrate-john-' + i + '-' + s.id,
      timestamp: s.date,
      practiceId: s.id,
      practiceName: s.name,
      primarySkill: s.primary,
      secondarySkill: s.secondary,
      xpAwarded: baseXp,
      baseXp: baseXp,
      multiplier: 1,
    }

    const res = await fetch(BASE_URL+'/mf-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
      body: JSON.stringify(session),
    })
    const data = await res.json()

    totalXp += baseXp
    if (s.primary) skillXpMap[s.primary] = (skillXpMap[s.primary] || 0) + Math.round(baseXp * 0.8)
    if (s.secondary) skillXpMap[s.secondary] = (skillXpMap[s.secondary] || 0) + Math.round(baseXp * 0.2)

    console.log('  ' + String(i+1).padStart(2) + '. ' + s.name.padEnd(24) + String(s.dur).padStart(5) + ' min -> ' + String(baseXp).padStart(3) + ' XP  (total: ' + totalXp + ', ' + LVLNAMES[getLevelIdx(totalXp)] + ')  [' + (data.ok?'OK':'FAIL') + ']')
  }

  console.log('')
  const final = await fetch(BASE_URL+'/mf-stats', {headers:{'X-User-Id':USER_ID}}).then(r=>r.json())
  console.log('Final: Level ' + (final.levelIdx+1) + ' ' + final.levelName + ' | ' + final.totalXp + ' XP | ' + final.totalSessions + ' sessions')
  console.log('')
  console.log('Skills:')
  Object.entries(final.skillTiers).filter(([k,v])=>v.xp>0).sort((a,b)=>b[1].xp-a[1].xp).forEach(([k,v])=>
    console.log('  '+k.padEnd(28)+v.tierName.padEnd(12)+String(v.xp).padStart(5)+' xp'))
}
run().catch(console.error)
