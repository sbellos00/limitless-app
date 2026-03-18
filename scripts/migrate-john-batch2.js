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

  // Regular sessions
  const sessions = [
    { name: 'Tour Your Mind',      id: 'tour-your-mind',       dur: 5,    primary: 'meta-awareness',      secondary: null,                date: '2026-03-05T08:00:00Z' },
    { name: 'Tranquil Breathing',  id: 'tranquil-breathing',   dur: 6,    primary: 'breath-control',      secondary: 'body-awareness',    date: '2026-03-05T09:00:00Z' },
    { name: 'Inward Focus',        id: 'inward-focus',         dur: 7,    primary: 'focused-attention',   secondary: 'body-awareness',    date: '2026-03-06T08:00:00Z' },
    { name: 'Breath Focus A',      id: 'breath-focus-a',       dur: 8,    primary: 'focused-attention',   secondary: 'breath-control',    date: '2026-03-06T09:00:00Z' },
    { name: 'Finger Switching',    id: 'finger-switching',     dur: 7,    primary: 'focused-attention',   secondary: 'meta-awareness',    date: '2026-03-07T08:00:00Z' },
    { name: 'Breath Focus B',      id: 'breath-focus-b',       dur: 8,    primary: 'focused-attention',   secondary: 'breath-control',    date: '2026-03-07T09:00:00Z' },
    { name: 'Head Switching',      id: 'head-switching',       dur: 8.5,  primary: 'focused-attention',   secondary: 'body-awareness',    date: '2026-03-08T08:00:00Z' },
    { name: 'Body Scan A',         id: 'body-scan-a',          dur: 11,   primary: 'body-awareness',      secondary: 'focused-attention', date: '2026-03-08T09:00:00Z' },
    { name: 'Shift into Awareness', id: 'shift-into-awareness', dur: 12.5, primary: 'natural-awareness',  secondary: null,                date: '2026-03-09T08:00:00Z' },
    { name: 'Jumbo Head',          id: 'jumbo-head',           dur: 9,    primary: 'natural-awareness',   secondary: 'body-awareness',    date: '2026-03-09T09:00:00Z' },
    { name: 'Beyond Thought A',    id: 'beyond-thought-a',     dur: 11.5, primary: 'nondual-awareness',   secondary: 'natural-awareness', date: '2026-03-09T10:00:00Z' },
    { name: 'Just Like Me',        id: 'just-like-me',         dur: 9,    primary: 'good-traits',         secondary: 'emotional-awareness', date: '2026-03-09T11:00:00Z' },
    { name: 'Exemplar',            id: 'exemplar',             dur: 5.5,  primary: 'good-traits',         secondary: 'mindset',           date: '2026-03-09T12:00:00Z' },
    { name: 'NPNNP',               id: 'npnnp',                dur: 30,   primary: 'nondual-awareness',   secondary: 'blissful-presence', date: '2026-03-09T13:00:00Z' },
    { name: 'Pointing the Mind',   id: 'pointing-the-mind',    dur: 9,    primary: 'mindset',             secondary: null,                date: '2026-03-09T14:00:00Z' },
    { name: 'Breaking Chains',     id: 'breaking-chains',      dur: 15.5, primary: 'emotional-awareness', secondary: 'mindset',           date: '2026-03-09T15:00:00Z' },
    { name: 'Neti Neti',           id: 'neti-neti',            dur: 7.5,  primary: 'inner-exploration',   secondary: 'nondual-awareness', date: '2026-03-09T16:00:00Z' },
    { name: 'Unlimited',           id: 'unlimited',            dur: 6,    primary: 'inner-exploration',   secondary: 'mindset',           date: '2026-03-09T17:00:00Z' },
  ]

  console.log('-- Regular sessions (' + sessions.length + ') --')
  console.log('')

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const levelIdx = getLevelIdx(totalXp)
    const tierIdx = getTierIdx(skillXpMap[s.primary] || 0)
    const rate = (LEVEL_RATES[levelIdx] + TIER_RATES[tierIdx]) / 2
    const baseXp = Math.round(s.dur * rate)

    const session = {
      id: 'migrate-john-b2-' + i + '-' + s.id,
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

  // Psychedelic session: 60 min self-guided inner exploration
  console.log('')
  console.log('-- Psychedelic session (10x) --')
  console.log('')

  const PSYCH_MULT = 10
  const levelIdx = getLevelIdx(totalXp)
  const tierIdx = getTierIdx(skillXpMap['inner-exploration'] || 0)
  const rate = (LEVEL_RATES[levelIdx] + TIER_RATES[tierIdx]) / 2
  const baseXp = Math.round(60 * rate)
  const finalXp = Math.round(baseXp * PSYCH_MULT)

  const psychSession = {
    id: 'migrate-john-b2-psych-self-guided-60',
    timestamp: '2026-03-15T08:00:00Z',
    practiceId: 'self-guided-60',
    practiceName: 'Self-Guided (60 min)',
    primarySkill: 'inner-exploration',
    secondarySkill: null,
    xpAwarded: finalXp,
    baseXp: baseXp,
    multiplier: PSYCH_MULT,
  }

  const res = await fetch(BASE_URL+'/mf-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
    body: JSON.stringify(psychSession),
  })
  const data = await res.json()

  totalXp += finalXp
  skillXpMap['inner-exploration'] = (skillXpMap['inner-exploration'] || 0) + Math.round(finalXp * 0.8)

  console.log('  Self-Guided (60 min)        60 min x10 -> ' + String(finalXp).padStart(4) + ' XP  (total: ' + totalXp + ', ' + LVLNAMES[getLevelIdx(totalXp)] + ')  [' + (data.ok?'OK':'FAIL') + ']')

  console.log('')
  const final = await fetch(BASE_URL+'/mf-stats', {headers:{'X-User-Id':USER_ID}}).then(r=>r.json())
  console.log('Final: Level ' + (final.levelIdx+1) + ' ' + final.levelName + ' | ' + final.totalXp + ' XP | ' + final.totalSessions + ' sessions')
  console.log('')
  console.log('Skills:')
  Object.entries(final.skillTiers).filter(([k,v])=>v.xp>0).sort((a,b)=>b[1].xp-a[1].xp).forEach(([k,v])=>
    console.log('  '+k.padEnd(28)+v.tierName.padEnd(12)+String(v.xp).padStart(5)+' xp'))
}
run().catch(console.error)
