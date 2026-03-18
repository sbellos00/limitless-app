import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'
import { THEME_LEVELS, getThemeForXp, useTheme } from '../theme.jsx'
import {
  LevelBackground, LevelDivider, LevelSectionHeader, LevelCard,
  LevelButton, getLevelNavStyle, LevelStatRow, LevelCharacterHeader,
  LevelBadge, LevelProgressBar,
} from './mf-levels.jsx'
import { SwissHomeScreen, SwissStatsScreen, SwissTrainScreen } from './mf-swiss.jsx'
import { AnimeHomeScreen, AnimeStatsScreen, AnimeTrainScreen } from './mf-anime.jsx'
import { FilmHomeScreen, FilmStatsScreen, FilmTrainScreen } from './mf-film.jsx'
import { InkHomeScreen, InkStatsScreen, InkTrainScreen } from './mf-ink.jsx'
import { ConstructivistHomeScreen, ConstructivistStatsScreen, ConstructivistTrainScreen } from './mf-constructivist.jsx'
import { ScandinavianHomeScreen, ScandinavianStatsScreen, ScandinavianTrainScreen } from './mf-scandinavian.jsx'
import { EditorialHomeScreen, EditorialStatsScreen, EditorialTrainScreen } from './mf-editorial.jsx'
import { CosmicHomeScreen, CosmicStatsScreen, CosmicTrainScreen } from './mf-cosmic.jsx'
import CheckInScreen from './CheckInScreen.jsx'
import {
  CATEGORIES, SKILLS, ALL_SKILL_IDS, PRACTICES, PRACTICE_PHASES, PRACTICE_MAP,
  XP_PRESETS, CHECKIN_XP, PRIMARY_XP_RATIO, SECONDARY_XP_RATIO,
  PSYCHEDELIC_MULTIPLIER, STREAK_BONUSES, getStreakMultiplier, getStreakLabel,
  SKILL_TIERS, getSkillTier, getSkillTierProgress, getSkillRating, getOverallRating,
  applySkillDecay, computeSkillXp, computeCategoryXp, getTotalXp,
} from '../data/mental-fitness.js'

const SCREEN_MAP = {
  anime:      { Home: AnimeHomeScreen, Stats: AnimeStatsScreen, Train: AnimeTrainScreen },
  film:       { Home: FilmHomeScreen, Stats: FilmStatsScreen, Train: FilmTrainScreen },
  ink:        { Home: InkHomeScreen, Stats: InkStatsScreen, Train: InkTrainScreen },
  'war-room': { Home: ConstructivistHomeScreen, Stats: ConstructivistStatsScreen, Train: ConstructivistTrainScreen },
  mountain:   { Home: SwissHomeScreen, Stats: SwissStatsScreen, Train: SwissTrainScreen },
  snow:       { Home: ScandinavianHomeScreen, Stats: ScandinavianStatsScreen, Train: ScandinavianTrainScreen },
  knight:     { Home: EditorialHomeScreen, Stats: EditorialStatsScreen, Train: EditorialTrainScreen },
  cosmic:     { Home: CosmicHomeScreen, Stats: CosmicStatsScreen, Train: CosmicTrainScreen },
}

// ── Backward-compat: reconstruct PHASES from new data for theme screen imports ──

const PHASES = PRACTICE_PHASES.map(phase => ({
  ...phase,
  practices: PRACTICES.filter(p => p.phase === phase.id),
}))

const TOTAL_PRACTICES = PRACTICES.length

// ── Level System ─────────────────────────────────────────────────────────────

const LEVELS = THEME_LEVELS.map(t => ({
  name: t.name, short: t.short, minXp: t.minXp, glow: t.glow,
  color: t.accent, accent: t.accentAlt,
}))

const LEVEL_IMAGES = {
  0: ['/levels/1/1.jpg', '/levels/1/2.jpg', '/levels/1/3.jpg', '/levels/1/4.jpg', '/levels/1/5.jpg', '/levels/1/6.jpg', '/levels/1/7.png'],
  1: ['/levels/2/1.jpg'],
  2: ['/levels/3/neo-ready-to-fight.jpg'],
  3: ['/levels/4/1.png'],
  4: ['/levels/5/1.png'],
  5: ['/levels/6/neo-stopping-bullets.jpg'],
  6: ['/levels/7/1.png'],
  7: ['/levels/8/Eternal.png'],
}

function getProgressImage(levelIdx, progressPct) {
  const images = LEVEL_IMAGES[levelIdx]
  if (!images || !images.length) return null
  const idx = Math.min(Math.floor((progressPct / 100) * images.length), images.length - 1)
  return images[idx]
}

function getSessionXp(session) {
  // New format: xpAwarded is set directly
  if (session.xpAwarded != null) return session.xpAwarded || 0
  // Legacy format: minutes * depth multiplier
  const DEPTH_MULT = [1, 1.5, 2]
  const mult = DEPTH_MULT[(session.depth || 1) - 1] || 1
  return Math.round((session.durationMin || 0) * mult)
}

function getLevel(xp) {
  let level = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.minXp) level = l
  const idx = LEVELS.indexOf(level)
  return { ...level, next: LEVELS[idx + 1] || null, idx }
}

function getLevelIdx(xp) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) idx = i
  }
  return idx + 1 // 1-based for XP preset gating
}

// ── SKILL_AXES — category-based for spider/hexagram charts ──────────────────

const SKILL_AXES = CATEGORIES.map(c => ({
  name: c.name,
  color: c.color,
  practices: PRACTICES.filter(p => c.skills.includes(p.primarySkill)).map(p => p.id),
}))

// ── Persistence (server-backed) ──────────────────────────────────────────────

function migrateSession(s) {
  // Already migrated
  if (s.xpAwarded != null) return s
  // Legacy: convert duration*depth to xpAwarded, add skill info
  const DEPTH_MULT = [1, 1.5, 2]
  const mult = DEPTH_MULT[(s.depth || 1) - 1] || 1
  const xpAwarded = Math.round((s.durationMin || 0) * mult)
  const practice = PRACTICE_MAP[s.practiceId]
  return {
    ...s,
    practiceName: practice?.name || s.practiceId,
    isCustom: false,
    primarySkill: practice?.primarySkill || null,
    secondarySkill: practice?.secondarySkill || null,
    xpAwarded,
  }
}

import { getCurrentUserId } from './MFApp.jsx'

function userHeaders() {
  const uid = getCurrentUserId()
  const h = { 'Content-Type': 'application/json' }
  if (uid) h['X-User-Id'] = uid
  return h
}

function cacheMfXp(sessions) {
  const xp = sessions.reduce((s, sess) => s + getSessionXp(sess), 0)
  localStorage.setItem('limitless_mf_xp', String(xp))
  return xp
}

async function fetchMfData() {
  try {
    const res = await fetch('/api/mf-sessions', { headers: userHeaders() })
    if (!res.ok) throw new Error('Failed to load')
    const data = await res.json()
    data.sessions = (data.sessions || []).filter(s => s.practiceId).map(migrateSession)
    data.customPractices = data.customPractices || []
    return data
  } catch {
    return { sessions: [], customPractices: [] }
  }
}

async function postSession(session) {
  await fetch('/api/mf-sessions', {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify(session),
  })
}

async function postCustomPractice(practice) {
  await fetch('/api/mf-custom-practices', {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify(practice),
  })
}

function getDateKey(d) { return new Date(d).toLocaleDateString('en-CA') }

function getStreak(sessions) {
  // Exclude check-ins — only real practice sessions count toward streak
  const real = sessions.filter(s => !s.practiceId?.startsWith('checkin-'))
  if (!real.length) return 0
  const days = [...new Set(real.map(s => getDateKey(s.timestamp)))].sort().reverse()
  let streak = 0, expected = getDateKey(new Date())
  for (const day of days) {
    if (day === expected) {
      streak++
      const d = new Date(expected); d.setDate(d.getDate() - 1); expected = getDateKey(d)
    } else if (day < expected) break
  }
  return streak
}

// ── Stats Hook ──────────────────────────────────────────────────────────────

function useStats(sessions) {
  return useMemo(() => {
    // Check-ins contribute XP but don't count as sessions
    const real = sessions.filter(s => !s.practiceId?.startsWith('checkin-'))
    const totalXp = sessions.reduce((s, sess) => s + getSessionXp(sess), 0)
    const totalMin = real.reduce((s, sess) => s + (sess.durationMin || 0), 0)
    const totalHours = totalMin / 60
    const level = getLevel(totalXp)
    const streak = getStreak(sessions)

    const practiceCounts = {}
    for (const s of real) practiceCounts[s.practiceId] = (practiceCounts[s.practiceId] || 0) + 1

    const phaseStats = PHASES.map(phase => {
      const pIds = new Set(phase.practices.map(p => p.id))
      const tried = new Set(sessions.filter(s => pIds.has(s.practiceId)).map(s => s.practiceId))
      return { ...phase, triedCount: tried.size, pct: Math.round((tried.size / phase.practices.length) * 100) }
    })

    let currentPhaseIdx = phaseStats.findIndex(p => p.pct < 100)
    if (currentPhaseIdx === -1) currentPhaseIdx = phaseStats.length - 1

    const uniquePractices = new Set(real.map(s => s.practiceId)).size

    // Skill & category XP (with decay applied)
    const rawSkillXp = computeSkillXp(sessions)
    const skillXp = applySkillDecay(rawSkillXp, sessions)
    const categoryXp = computeCategoryXp(skillXp)

    // Streak multiplier info
    const streakMultiplier = getStreakMultiplier(streak)
    const streakLabel = getStreakLabel(streak)

    const sessionCount = real.length

    return { totalXp, totalMin, totalHours, level, streak, streakMultiplier, streakLabel, practiceCounts, phaseStats, currentPhaseIdx, uniquePractices, skillXp, categoryXp, sessionCount }
  }, [sessions])
}

// ── Brain Visualization ─────────────────────────────────────────────────────

const LEFT_HEMI = 'M86,14 C78,11 36,16 25,42 C15,64 14,88 20,110 C26,130 56,142 76,142 C83,142 86,136 86,128 Z'
const RIGHT_HEMI = 'M94,14 C102,11 144,16 155,42 C165,64 166,88 160,110 C154,130 124,142 104,142 C97,142 94,136 94,128 Z'

const LEFT_FOLDS = [
  'M 80,32 Q 52,28 30,44',
  'M 78,58 Q 46,54 22,68',
  'M 76,84 Q 44,80 18,95',
  'M 78,112 Q 54,108 30,120',
]
const RIGHT_FOLDS = [
  'M 100,32 Q 128,28 150,44',
  'M 102,58 Q 134,54 158,68',
  'M 104,84 Q 136,80 162,95',
  'M 102,112 Q 126,108 150,120',
]

const BRAIN_DOTS = [
  [{ x: 72, y: 48 }, { x: 108, y: 48 }, { x: 70, y: 68 }],
  [
    { x: 58, y: 35 }, { x: 48, y: 55 }, { x: 44, y: 75 }, { x: 52, y: 92 },
    { x: 64, y: 105 }, { x: 74, y: 78 }, { x: 76, y: 58 },
    { x: 122, y: 35 }, { x: 132, y: 55 }, { x: 136, y: 75 }, { x: 128, y: 92 },
    { x: 116, y: 105 }, { x: 106, y: 68 },
  ],
  [
    { x: 42, y: 30 }, { x: 30, y: 55 }, { x: 28, y: 82 }, { x: 35, y: 108 },
    { x: 55, y: 125 }, { x: 68, y: 35 },
    { x: 138, y: 30 }, { x: 150, y: 55 }, { x: 152, y: 82 }, { x: 145, y: 108 },
    { x: 125, y: 125 }, { x: 112, y: 35 },
  ],
  [
    { x: 32, y: 40 }, { x: 22, y: 65 }, { x: 20, y: 92 }, { x: 28, y: 118 },
    { x: 48, y: 135 }, { x: 68, y: 136 }, { x: 80, y: 122 },
    { x: 148, y: 40 }, { x: 158, y: 65 }, { x: 160, y: 92 }, { x: 152, y: 118 },
    { x: 132, y: 135 }, { x: 112, y: 136 }, { x: 100, y: 122 },
  ],
]

function dotState(count, phaseColor) {
  if (count >= 10) return { r: 4, fill: phaseColor, opacity: 1, glow: true }
  if (count >= 5)  return { r: 3.5, fill: phaseColor, opacity: 0.8, glow: false }
  if (count >= 3)  return { r: 3, fill: phaseColor, opacity: 0.6, glow: false }
  if (count >= 1)  return { r: 2.5, fill: phaseColor, opacity: 0.4, glow: false }
  return { r: 2, fill: 'rgba(255,255,255,0.12)', opacity: 0.5, glow: false }
}

function BrainMap({ phaseStats, practiceCounts, streak, levelColor, levelGlow }) {
  const overallPct = phaseStats.reduce((s, p) => s + p.pct, 0) / phaseStats.length
  const glowR = Math.max(overallPct * 0.6, 10)

  return (
    <div className="flex justify-center py-2">
      <svg width="200" height="165" viewBox="0 0 180 155">
        <defs>
          <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${levelColor}${Math.round(levelGlow * 255).toString(16).padStart(2, '0')}`} />
            <stop offset={`${glowR}%`} stopColor={`${levelColor}08`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <path d={LEFT_HEMI} fill="url(#brain-glow)" />
        <path d={LEFT_HEMI} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
        <path d={RIGHT_HEMI} fill="url(#brain-glow)" />
        <path d={RIGHT_HEMI} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
        ))}
        <line x1="90" y1="16" x2="90" y2="126" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <motion.circle
          cx={90} cy={55} r={3}
          fill={`${levelColor}40`}
          animate={streak > 0 ? { opacity: [0.12, 0.35, 0.12], r: [3, 5, 3] } : {}}
          transition={streak > 0 ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
        />
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            // Color by category instead of phase
            const cat = practice.primarySkill && CATEGORIES.find(c => c.skills.includes(practice.primarySkill))
            const dotColor = cat?.color || phase.color
            const ds = dotState(count, dotColor)
            return (
              <g key={practice.id}>
                {ds.glow && (
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={7}
                    fill="none" stroke={dotColor} strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={ds.r}
                  fill={ds.fill}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: ds.opacity }}
                  transition={{ duration: 0.5, delay: pi * 0.1 + di * 0.02 }}
                />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}

// ── Bell Curve Percentile Graph ──────────────────────────────────────────────

function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const t = 1 / (1 + p * Math.abs(x))
  return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x))
}

function ProgressGraph({ sessions, level, totalXp }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 150
  const phi = (z) => Math.exp(-0.5 * z * z)

  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 280, H = 90
  const PAD = { top: 10, right: 12, bottom: 26, left: 12 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const xS = (z) => PAD.left + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * plotW
  const yS = (v) => PAD.top + plotH * (1 - v)
  const baseY = yS(0)

  const pts = []
  for (let i = 0; i <= STEPS; i++) {
    const z = Z_MIN + (i / STEPS) * (Z_MAX - Z_MIN)
    pts.push({ z, sx: xS(z), sy: yS(phi(z)) })
  }

  const fullD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx},${p.sy}`).join(' ')

  const userSx = xS(userZ)
  const userSy = yS(phi(userZ))
  const filled = pts.filter(p => p.z <= userZ)
  filled.push({ sx: userSx, sy: userSy })

  let fillD = `M ${xS(Z_MIN)},${baseY}`
  for (const p of filled) fillD += ` L ${p.sx},${p.sy}`
  fillD += ` L ${userSx},${baseY} Z`

  const filledLineD = filled.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx},${p.sy}`).join(' ')

  const accentColor = level.next?.color || level.color

  const levelTicks = LEVELS.filter(l => {
    const z = (l.minXp - MEAN) / SIGMA
    return l.minXp > 0 && z >= Z_MIN && z <= Z_MAX
  }).map(l => ({ ...l, z: (l.minXp - MEAN) / SIGMA }))

  return (
    <div>
      <div className="flex justify-center">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bell-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.03" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          {levelTicks.map(l => (
            <g key={l.name}>
              <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 4}
                stroke={l.color} strokeWidth="0.8" opacity="0.4" />
              <text x={xS(l.z)} y={baseY + 12}
                fill={l.color} fontSize="5" textAnchor="middle" opacity="0.45"
                fontFamily="system-ui">
                {l.short}
              </text>
            </g>
          ))}
          <path d={fillD} fill="url(#bell-fill)" />
          <path d={fullD} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <path d={filledLineD} fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />
          <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
            stroke={accentColor} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.35" />
          <circle cx={userSx} cy={userSy} r="5" fill={accentColor} opacity="0.12" />
          <motion.circle cx={userSx} cy={userSy} r="2.5" fill={accentColor}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        </svg>
      </div>
    </div>
  )
}

// ── Hexagram Chart (8 categories) ───────────────────────────────────────────

function HexagramChart({ categoryXp, levelColor }) {
  const size = 230
  const cx = size / 2, cy = size / 2
  const R = 74
  const n = CATEGORIES.length

  const angles = CATEGORIES.map((_, i) => (Math.PI * 2 * i / n) - Math.PI / 2)
  const toXY = (angle, r) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  })

  // Absolute scale: category XP mapped against fixed reference (5000 = full radius)
  // Uses sqrt to make early progress visible while still rewarding high XP
  const REF_XP = 5000
  const scores = CATEGORIES.map(c => {
    const xp = categoryXp[c.id] || 0
    if (xp === 0) return 0
    return Math.min(Math.round(Math.sqrt(xp / REF_XP) * 100), 100)
  })

  const guides = [0.25, 0.5, 0.75, 1]
  const dataPoints = scores.map((score, i) => toXY(angles[i], Math.max((score / 100) * R, 3)))
  const dataPoly = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="flex justify-center py-1">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 250 }}>
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          )
        })}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          )
        })}
        <polygon points={dataPoly}
          fill={`${levelColor}10`}
          stroke={`${levelColor}50`}
          strokeWidth="1.2" />
        {CATEGORIES.map((cat, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 16)
          return (
            <g key={cat.id}>
              <circle cx={pt.x} cy={pt.y} r="2.5" fill={cat.color} opacity="0.7" />
              <text x={labelPt.x} y={labelPt.y}
                fill={cat.color} fontSize="7" textAnchor="middle" dominantBaseline="middle"
                opacity="0.55" fontFamily="system-ui" fontWeight="500">
                {cat.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Spider Chart (backward compat for theme screens) ────────────────────────

function SpiderChart({ practiceCounts, levelColor }) {
  const size = 230
  const cx = size / 2, cy = size / 2
  const R = 74
  const n = SKILL_AXES.length

  const angles = SKILL_AXES.map((_, i) => (Math.PI * 2 * i / n) - Math.PI / 2)
  const toXY = (angle, r) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  })

  const scores = SKILL_AXES.map(axis => {
    const total = axis.practices.reduce((s, pid) => {
      const count = practiceCounts[pid] || 0
      return s + Math.min(count / 10, 1)
    }, 0)
    return Math.round((total / Math.max(axis.practices.length, 1)) * 100)
  })

  const guides = [0.25, 0.5, 0.75, 1]
  const dataPoints = scores.map((score, i) => toXY(angles[i], Math.max((score / 100) * R, 3)))
  const dataPoly = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="flex justify-center py-1">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 250 }}>
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          )
        })}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          )
        })}
        <polygon points={dataPoly}
          fill={`${levelColor}10`}
          stroke={`${levelColor}50`}
          strokeWidth="1.2" />
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 16)
          return (
            <g key={axis.name}>
              <circle cx={pt.x} cy={pt.y} r="2.5" fill={axis.color} opacity="0.7" />
              <text x={labelPt.x} y={labelPt.y}
                fill={axis.color} fontSize="7" textAnchor="middle" dominantBaseline="middle"
                opacity="0.55" fontFamily="system-ui" fontWeight="500">
                {axis.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Skill Tag ───────────────────────────────────────────────────────────────

function SkillTag({ skillId, size = 'sm' }) {
  const skill = SKILLS[skillId]
  if (!skill) return null
  const cat = CATEGORIES.find(c => c.id === skill.category)
  const fontSize = size === 'sm' ? '8px' : '9px'
  const py = size === 'sm' ? '1px' : '2px'
  return (
    <span className="inline-flex items-center rounded-full px-1.5 shrink-0"
      style={{ background: `${cat?.color || '#888'}15`, border: `0.5px solid ${cat?.color || '#888'}20`, fontSize, paddingTop: py, paddingBottom: py, color: cat?.color || '#888' }}>
      {skill.name}
    </span>
  )
}

// ── Check-In Definitions ─────────────────────────────────────────────────────

const CHECK_INS = [
  { id: 'mind', label: 'Check-in with your mind' },
  { id: 'energy', label: 'Call Energy back' },
  { id: 'body-scan', label: 'Body Scan' },
  { id: 'senses', label: 'Check in with your senses' },
  { id: 'psych', label: 'Psychological Check In' },
  { id: 'fitmind', label: 'FitMind Challenge' },
]

// Legacy compat — old depth labels
const DEPTH_LEVELS = [
  { value: 1, kanji: '浅', label: 'Light' },
  { value: 2, kanji: '中', label: 'Steady' },
  { value: 3, kanji: '深', label: 'Deep' },
]

function CheckInButtons({ theme, color, onCheckIn }) {
  const special = theme?.special || 'anime'
  const radius = special === 'war-room' ? '0px' : special === 'ink' ? '4px' : special === 'snow' ? '8px' : theme?.radiusSm || '12px'

  return (
    <div className="grid grid-cols-2 gap-2">
      {CHECK_INS.map(ci => (
        <button
          key={ci.id}
          onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
          className="flex items-center gap-2.5 px-3 py-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: `${color}06`,
            border: `1px solid ${color}0C`,
            borderRadius: radius,
            fontFamily: theme?.fontBody,
          }}
        >
          <span className="text-[11px] leading-tight" style={{ color: theme?.textSecondary }}>{ci.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Overview Screen ──────────────────────────────────────────────────────────

function OverviewScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices, categoryXp, sessionCount } = stats
  const special = theme?.special || 'anime'

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const MEAN = 0, SIGMA = 10000
  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp - MEAN) / (SIGMA * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <LevelCharacterHeader special={special} color={level.color} theme={theme} charImage={charImage} glow={level.glow} />

      <div className={`relative ${special === 'snow' ? '-mt-12 mx-4 mb-6' : special === 'war-room' ? '-mt-16 mx-3 mb-4' : '-mt-20 mx-4 mb-5'}`}>
        <LevelCard special={special} color={level.color} theme={theme} glow={level.glow}>
          <div className={`relative ${special === 'snow' ? 'px-5 pt-5 pb-4' : special === 'war-room' ? 'px-4 pt-4 pb-3' : 'px-4 pt-4 pb-4'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative shrink-0">
                <LevelBadge special={special} color={level.color} theme={theme} levelIdx={level.idx} glow={level.glow} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.25em] font-medium mb-0.5"
                  style={{ color: level.color, opacity: 0.6, fontFamily: theme?.fontBody }}>
                  Level {level.idx + 1}
                </p>
                <p className="text-[22px] font-bold leading-tight tracking-tight"
                  style={{ color: theme?.text || '#fff', opacity: 0.9, fontFamily: theme?.fontHeader }}>
                  {level.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[20px] font-black tabular-nums" style={{ color: level.accent, fontFamily: theme?.fontHeader }}>
                  {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
                </p>
                <p className="text-[7px] uppercase tracking-widest" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>percentile</p>
              </div>
            </div>

            <ProgressGraph sessions={sessions} level={level} totalXp={totalXp} />

            {level.next && (
              <div className="mb-3 mt-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[8px] uppercase tracking-widest" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                    Next: <span style={{ color: level.next.color, opacity: 0.6 }}>{level.next.name}</span>
                  </span>
                  <span className="text-[8px] tabular-nums" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                    {totalXp.toLocaleString()} xp
                    <span style={{ opacity: 0.4 }}> / </span>
                    <span style={{ color: level.next.color, opacity: 0.5 }}>{level.next.minXp.toLocaleString()}</span>
                  </span>
                </div>
                <LevelProgressBar special={special} color={level.color} nextColor={level.next?.color} progress={lvlProgress} theme={theme} />
              </div>
            )}

            <LevelStatRow special={special} color={level.color} theme={theme} stats={[
              { label: 'Sessions', value: sessionCount },
              { label: 'Streak', value: streak > 0 ? `${streak}d` : '\u2014' },
              { label: 'XP', value: totalXp.toLocaleString() },
              { label: 'Tried', value: uniquePractices },
            ]} />
          </div>
        </LevelCard>
      </div>

      {/* Hexagram */}
      <div className={`${special === 'snow' ? 'px-6 pb-4' : 'px-4 pb-3'}`}>
        <p className="text-[9px] uppercase tracking-[0.2em] mb-1"
          style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
          Skill Map
        </p>
        <HexagramChart categoryXp={categoryXp} levelColor={level.color} />
      </div>

      <LevelDivider special={special} color={level.color} />

      {/* Check-In Buttons */}
      <div className={`${special === 'snow' ? 'px-6 pb-6' : 'px-4 pb-5'}`}>
        <p className="text-[9px] uppercase tracking-[0.2em] mb-3"
          style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
          Quick Check-Ins
        </p>
        <CheckInButtons theme={theme} color={level.color} onCheckIn={onCheckIn} />
      </div>

    </div>
  )
}

// ── Train Screen ─────────────────────────────────────────────────────────────

function TrainScreen({ data, stats, onLog, onLogPsychedelic, onCheckIn, theme }) {
  const { sessions } = data
  const { level, streak, streakMultiplier, streakLabel } = stats
  const special = theme?.special || 'anime'

  const recent = [...sessions].reverse().slice(0, 8)

  const sessRowStyle = (color) => {
    switch (special) {
      case 'anime': return { background: `${color}08`, borderRadius: '12px', border: `1px solid ${color}12` }
      case 'film': return { borderBottom: `1px solid ${color}08`, borderRadius: '0' }
      case 'ink': return { borderBottom: `0.5px solid ${color}06`, borderRadius: '0' }
      case 'war-room': return { background: `${color}04`, borderRadius: '0', borderLeft: `2px solid ${color}20` }
      case 'mountain': return { background: `${color}04`, borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
      case 'snow': return { borderRadius: '0' }
      case 'knight': return { background: `${color}03`, borderRadius: '8px' }
      case 'cosmic': return { background: `${color}04`, borderRadius: '12px', boxShadow: `inset 0 0 8px ${color}04` }
      default: return { background: `${color}04`, borderRadius: '8px' }
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className={`${special === 'snow' ? 'px-6 py-8 space-y-6' : 'px-4 py-5 space-y-5'}`}>
        <LevelSectionHeader special={special} color={level.color} label="Training" title="Mental Fitness" theme={theme} />

        <LevelButton special={special} color={level.color} theme={theme}
          onClick={() => { haptics.tap(); onLog() }}>
          + Log Session
        </LevelButton>

        <LevelButton special={special} color="#A78BFA" theme={theme}
          onClick={() => { haptics.tap(); onLogPsychedelic() }}>
          + Log Psychedelics Training
        </LevelButton>

        {/* Streak info */}
        {streak > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px]" style={{ color: level.color, fontFamily: theme?.fontBody }}>
              {streak}d streak
            </span>
            {streakMultiplier > 1 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: `${level.color}15`, color: level.color, fontFamily: theme?.fontBody }}>
                {streakMultiplier}x XP
              </span>
            )}
          </div>
        )}

        {/* Check-Ins */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] mb-3"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
            Check-Ins
          </p>
          <CheckInButtons theme={theme} color={level.color} onCheckIn={onCheckIn} />
        </div>

        <LevelDivider special={special} color={level.color} />

        {/* Session History */}
        {recent.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-2"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              Recent Sessions
            </p>
            <div className={special === 'snow' ? 'space-y-2' : 'space-y-0.5'}>
              {recent.map(sess => {
                const practice = PRACTICE_MAP[sess.practiceId]
                const date = new Date(sess.timestamp)
                const today = getDateKey(new Date())
                const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
                const sessDay = getDateKey(date)
                const label = sessDay === today ? 'Today'
                  : sessDay === getDateKey(ydDate) ? 'Yesterday'
                  : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                return (
                  <div key={sess.id} className="flex items-center gap-2 px-2 py-1.5"
                    style={sessRowStyle(level.color)}>
                    <span className="text-[10px] w-[52px] shrink-0" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>{label}</span>
                    <div className="flex-1 min-w-0 truncate">
                      <span className="text-[11px]" style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>
                        {sess.practiceName || practice?.name || sess.practiceId}
                      </span>
                    </div>
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: level.color, opacity: 0.5, fontFamily: theme?.fontBody }}>
                      +{getSessionXp(sess)} xp
                    </span>
                    {sess.primarySkill && <SkillTag skillId={sess.primarySkill} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Skill Breakdown (for Stats screen) ──────────────────────────────────────

function SkillBreakdown({ skillXp, theme }) {
  return (
    <div className="space-y-2">
      {CATEGORIES.map(cat => (
        cat.skills.map(sk => {
          const xp = skillXp[sk] || 0
          const tier = getSkillTier(xp)
          const rating = getSkillRating(xp)
          const barPct = ((rating - 1) / 98) * 100

          return (
            <div key={sk} className="flex items-center gap-2.5">
              {/* Category dot */}
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color, opacity: 0.6 }} />
              {/* Skill name */}
              <span className="text-[12px] flex-1 min-w-0 truncate"
                style={{ color: xp > 0 ? theme?.textSecondary : theme?.textMuted, fontFamily: theme?.fontBody }}>
                {SKILLS[sk].name}
              </span>
              {/* Rating bar */}
              <div className="w-[64px] h-[5px] rounded-full overflow-hidden shrink-0"
                style={{ background: `${cat.color}12` }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${barPct}%`, background: tier.color, opacity: 0.7 }} />
              </div>
              {/* Rating number */}
              <span className="text-[14px] font-bold tabular-nums w-[24px] text-right shrink-0"
                style={{ color: tier.color, fontFamily: theme?.fontHeader }}>
                {rating}
              </span>
            </div>
          )
        })
      ))}
    </div>
  )
}

// ── Discipline Bar (phase-based, backward compat) ───────────────────────────

function DisciplineBar({ phase, practiceCounts, sessions, theme, color }) {
  const [expanded, setExpanded] = useState(false)

  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div>
      <button
        className="w-full text-left transition-all active:scale-[0.99]"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
      >
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-[14px]" style={{ color: phase.color, opacity: 0.6, fontFamily: theme?.fontHeader || 'serif' }}>
            {phase.kanji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold" style={{ color: phase.color, opacity: 0.8, fontFamily: theme?.fontHeader }}>
                {phase.name}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                {tried.size}/{phase.practices.length} · {totalSessions} sess
              </span>
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={theme?.textMuted || 'rgba(255,255,255,0.3)'} strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: `${phase.color}10` }}>
          <motion.div className="h-full rounded-full"
            style={{ background: phase.color, opacity: 0.6 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1 pl-7">
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                return (
                  <div key={practice.id} className="flex items-center gap-2 py-1"
                    style={{ borderBottom: `0.5px solid ${phase.color}08` }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: count > 0 ? phase.color : (theme?.textMuted || 'rgba(255,255,255,0.15)'), opacity: count > 0 ? 0.6 : 0.3 }} />
                    <span className="text-[10px] flex-1 min-w-0 truncate"
                      style={{ color: count > 0 ? theme?.textSecondary : theme?.textMuted, fontFamily: theme?.fontBody }}>
                      {practice.name}
                    </span>
                    {practice.primarySkill && <SkillTag skillId={practice.primarySkill} />}
                    {count > 0 ? (
                      <span className="text-[9px] tabular-nums shrink-0"
                        style={{ color: phase.color, opacity: 0.5, fontFamily: theme?.fontBody }}>
                        {count}×
                      </span>
                    ) : (
                      <span className="text-[9px] shrink-0"
                        style={{ color: theme?.textMuted, opacity: 0.4, fontFamily: theme?.fontBody }}>{'\u2014'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Stats Screen ─────────────────────────────────────────────────────────────

function StatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak, uniquePractices, skillXp, categoryXp, sessionCount } = stats
  const special = theme?.special || 'anime'
  const overall = getOverallRating(skillXp)
  const overallTier = getSkillTier(0) // just for color — use rating-based color
  const overallColor = overall >= 90 ? '#B9F2FF' : overall >= 60 ? '#EF4444' : overall >= 35 ? '#FBBF24' : overall >= 15 ? '#34D399' : overall >= 5 ? '#60A5FA' : 'rgba(255,255,255,0.3)'

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className={`${special === 'snow' ? 'px-6 py-8 space-y-6' : 'px-4 py-5 space-y-5'}`}>
        <div className="flex items-center justify-between">
          <LevelSectionHeader special={special} color={level.color} label="Progress" title="Statistics" theme={theme} />
          <div className="text-right mt-2">
            <span className="text-[24px] font-black tabular-nums" style={{ color: overallColor, fontFamily: theme?.fontHeader }}>{overall}</span>
            <p className="text-[7px] uppercase tracking-widest" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Overall</p>
          </div>
        </div>

        {/* Summary metrics — single subtle line */}
        <div className="flex items-center justify-between" style={{ opacity: 0.8 }}>
          {[
            { label: 'Sessions', value: sessionCount },
            { label: 'XP', value: totalXp.toLocaleString() },
            { label: 'Streak', value: streak > 0 ? `${streak}d` : '\u2014' },
            { label: 'Tried', value: uniquePractices },
          ].map(s => (
            <div key={s.label} className="text-center">
              <span className="text-[12px] font-semibold block tabular-nums"
                style={{ color: theme?.textSecondary, fontFamily: theme?.fontHeader }}>{s.value}</span>
              <span className="text-[8px] uppercase tracking-widest"
                style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Brain Map */}
        <BrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} streak={streak}
          levelColor={level.color} levelGlow={level.glow} />

        <LevelDivider special={special} color={level.color} />

        {/* Hexagram */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
            Category Hexagram
          </p>
          <HexagramChart categoryXp={categoryXp} levelColor={level.color} />
        </div>

        <LevelDivider special={special} color={level.color} />

        {/* Skill Breakdown */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
            Skill Breakdown
          </p>
          <SkillBreakdown skillXp={skillXp} theme={theme} color={level.color} />
        </div>

      </div>
    </div>
  )
}

// ── Bottom Nav ──────────────────────────────────────────────────────────────

function MFBottomNav({ screen, onNavigate, onLogout, color, theme }) {
  const special = theme?.special || 'anime'
  const tabs = [
    { id: 'overview', label: 'Home',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    { id: 'train', label: 'Train',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
    },
    { id: 'stats', label: 'Stats',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
    },
  ]

  const navStyle = getLevelNavStyle(special, color, theme)

  const indicator = () => {
    switch (special) {
      case 'anime': return <motion.div layoutId="mf-nav-indicator" className="absolute top-0 h-[3px] w-12 rounded-full" style={{ background: color }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} />
      case 'war-room': return <motion.div layoutId="mf-nav-indicator" className="absolute top-0 h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
      case 'ink': return <motion.div layoutId="mf-nav-indicator" className="absolute bottom-1 h-px w-6" style={{ background: `${color}30` }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
      case 'cosmic': return <motion.div layoutId="mf-nav-indicator" className="absolute top-0 h-[2px] w-10 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
      case 'snow': return <motion.div layoutId="mf-nav-indicator" className="absolute top-0 h-[1px] w-8" style={{ background: `${color}30` }} transition={{ duration: 0.3 }} />
      default: return <motion.div layoutId="mf-nav-indicator" className="absolute top-0 h-[2px] w-10 rounded-full" style={{ background: color }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
    }
  }

  return (
    <div className="shrink-0 flex relative" style={navStyle}>
      <button
        onClick={() => { haptics.tap(); onLogout?.() }}
        className="flex flex-col items-center justify-center gap-1 px-4 py-3"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme?.textMuted || 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span className="text-[8px] uppercase tracking-widest" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Exit</span>
      </button>
      {tabs.map(t => {
        const active = screen === t.id
        return (
          <button
            key={t.id}
            onClick={() => { haptics.tap(); onNavigate(t.id) }}
            className="flex-1 py-3 flex flex-col items-center gap-1 relative"
          >
            <span style={{ color: active ? color : (theme?.textMuted || 'rgba(255,255,255,0.2)') }}>
              {t.icon}
            </span>
            <span className="text-[8px] uppercase tracking-widest"
              style={{ color: active ? color : (theme?.textMuted || 'rgba(255,255,255,0.15)'), opacity: active ? 0.9 : 0.6, fontFamily: theme?.fontBody }}>
              {t.label}
            </span>
            {active && indicator()}
          </button>
        )
      })}
    </div>
  )
}

// ── Custom Practice Modal ───────────────────────────────────────────────────

function CustomPracticeModal({ onSave, onClose, theme }) {
  const [name, setName] = useState('')
  const [primarySkill, setPrimarySkill] = useState('')
  const [secondarySkill, setSecondarySkill] = useState('')
  const special = theme?.special || 'anime'
  const elRadius = special === 'war-room' ? '0px' : special === 'ink' ? '2px' : theme?.radiusSm || '12px'

  const canSave = name.trim() && primarySkill

  const handleSave = () => {
    if (!canSave) return
    onSave({
      id: 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      primarySkill,
      secondarySkill: secondarySkill || null,
      createdAt: new Date().toISOString(),
    })
    sounds.complete()
    haptics.success()
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: elRadius,
    color: theme?.text || '#fff',
    fontFamily: theme?.fontBody,
    fontSize: '12px',
    padding: '10px 12px',
    width: '100%',
    outline: 'none',
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md pb-8"
        style={{ background: theme?.bg || '#0e0e1a', borderRadius: '20px 20px 0 0', border: `1px solid ${theme?.cardBorder || 'rgba(255,255,255,0.08)'}` }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[14px] font-semibold" style={{ color: theme?.text, fontFamily: theme?.fontHeader }}>
              New Custom Practice
            </p>
            <button onClick={onClose} className="text-[12px]" style={{ color: theme?.textSecondary }}>Cancel</button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Name</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Box Breathing 4-4-4-4"
              className="w-full px-3 py-2.5 text-[12px] outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: elRadius,
                color: theme?.text || '#fff',
                fontFamily: theme?.fontBody,
              }}
            />
          </div>

          {/* Primary Skill */}
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              Primary Skill <span style={{ opacity: 0.5 }}>(80% XP)</span>
            </p>
            <select value={primarySkill} onChange={e => { setPrimarySkill(e.target.value); if (e.target.value === secondarySkill) setSecondarySkill('') }}
              style={selectStyle}>
              <option value="">Select skill...</option>
              {CATEGORIES.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.skills.map(sk => (
                    <option key={sk} value={sk}>{SKILLS[sk].name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Secondary Skill */}
          <div className="mb-6">
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              Secondary Skill <span style={{ opacity: 0.5 }}>(20% XP, optional)</span>
            </p>
            <select value={secondarySkill} onChange={e => setSecondarySkill(e.target.value)}
              style={selectStyle}>
              <option value="">None</option>
              {CATEGORIES.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.skills.filter(sk => sk !== primarySkill).map(sk => (
                    <option key={sk} value={sk}>{SKILLS[sk].name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <LevelButton special={special} color={theme?.accent || '#60A5FA'} theme={theme}
            onClick={handleSave} disabled={!canSave}>
            Save Practice
          </LevelButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Log Session View ────────────────────────────────────────────────────────

function LogSession({ onSave, onBack, theme, customPractices, totalXp, onCreateCustom, multiplier = 1, multiplierLabel = null, streak = 0 }) {
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedPractice, setSelectedPractice] = useState(null)
  const [selectedXp, setSelectedXp] = useState(5)
  const [saving, setSaving] = useState(false)

  const currentLevel = getLevelIdx(totalXp)
  const special = theme?.special || 'anime'
  const streakMult = getStreakMultiplier(streak)
  const totalMultiplier = multiplier * streakMult

  // Tabs: 8 categories + custom
  const tabs = [
    ...CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, color: c.color, idx: i })),
    { id: 'custom', name: 'Custom', color: theme?.accent || '#60A5FA', idx: CATEGORIES.length },
  ]
  const activeTab = tabs[selectedTab] || tabs[0]
  const isCustomTab = selectedTab === CATEGORIES.length

  // Available XP presets based on current level
  const availablePresets = XP_PRESETS.map(p => ({ ...p, locked: currentLevel < p.minLevel }))

  // Practices for the selected category (by primary skill)
  const practicesToShow = isCustomTab
    ? customPractices
    : PRACTICES.filter(p => {
        const cat = CATEGORIES[selectedTab]
        return cat && cat.skills.includes(p.primarySkill)
      })

  // Determine if selected practice is custom or built-in
  const isCustomPractice = selectedPractice?.startsWith('custom-')
  const practiceInfo = isCustomPractice
    ? customPractices.find(p => p.id === selectedPractice)
    : PRACTICE_MAP[selectedPractice]

  const handleSave = () => {
    if (!selectedPractice || !practiceInfo || saving) return
    setSaving(true)
    const finalXp = Math.round(selectedXp * totalMultiplier)
    const session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      practiceId: selectedPractice,
      practiceName: practiceInfo.name,
      isCustom: isCustomPractice,
      primarySkill: practiceInfo.primarySkill,
      secondarySkill: practiceInfo.secondarySkill || null,
      xpAwarded: finalXp,
      baseXp: selectedXp,
      multiplier: totalMultiplier,
    }
    onSave(session)
    sounds.complete()
    haptics.success()
  }

  const elRadius = special === 'war-room' ? '0px' : special === 'ink' ? '2px' : special === 'mountain' ? '6px' : special === 'snow' ? '6px' : theme?.radiusSm || '12px'

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className={`${special === 'snow' ? 'px-8 py-8' : 'px-6 py-5'} flex-1 min-h-0 flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <LevelSectionHeader special={special} color={multiplierLabel ? '#A78BFA' : activeTab.color}
            label="Training" title={multiplierLabel || 'Log Session'} theme={theme} />
          <button onClick={onBack} className="text-[13px]" style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>Cancel</button>
        </div>

        {/* Category tabs (scrollable) */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              className="shrink-0 px-3 py-2 text-center transition-all"
              style={{
                background: t.idx === selectedTab ? `${t.color}15` : 'rgba(255,255,255,0.02)',
                border: `${special === 'anime' ? '2px' : '1px'} solid ${t.idx === selectedTab ? t.color + '25' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: elRadius,
              }}
              onClick={() => { setSelectedTab(t.idx); setSelectedPractice(null); haptics.tap() }}
            >
              <span className="text-[10px] whitespace-nowrap" style={{
                color: t.idx === selectedTab ? t.color : (theme?.textMuted || 'rgba(255,255,255,0.25)'),
                fontFamily: theme?.fontBody,
                fontWeight: t.idx === selectedTab ? 600 : 400,
              }}>
                {t.id === 'custom' ? '+ Custom' : t.name}
              </span>
            </button>
          ))}
        </div>

        {/* Add Custom Practice button (when on custom tab) */}
        {isCustomTab && (
          <button
            className="w-full mb-3 py-2.5 text-[11px] transition-all active:scale-[0.98]"
            style={{
              background: `${theme?.accent || '#60A5FA'}08`,
              border: `1px dashed ${theme?.accent || '#60A5FA'}25`,
              borderRadius: elRadius,
              color: theme?.accent || '#60A5FA',
              fontFamily: theme?.fontBody,
            }}
            onClick={() => { onCreateCustom(); haptics.tap() }}
          >
            + Add Custom Practice
          </button>
        )}

        {/* Practice list */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mb-4">
          <div className={special === 'snow' ? 'space-y-2' : 'space-y-1'}>
            {practicesToShow.length === 0 && isCustomTab && (
              <p className="text-[11px] text-center py-8" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                No custom practices yet. Tap + to add one.
              </p>
            )}
            {practicesToShow.map(practice => {
              const isSelected = selectedPractice === practice.id
              return (
                <button
                  key={practice.id}
                  className="w-full text-left px-3 py-2.5 transition-all"
                  style={{
                    background: isSelected ? `${activeTab.color}12` : 'transparent',
                    border: `${special === 'anime' ? '2px' : '1px'} solid ${isSelected ? activeTab.color + '20' : 'transparent'}`,
                    borderRadius: elRadius,
                  }}
                  onClick={() => { setSelectedPractice(practice.id); haptics.tap() }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium flex-1 min-w-0"
                      style={{ color: isSelected ? activeTab.color : (theme?.textSecondary || 'rgba(255,255,255,0.5)'), opacity: isSelected ? 0.8 : 1, fontFamily: theme?.fontBody }}>
                      {practice.name}
                    </span>
                    {practice.primarySkill && <SkillTag skillId={practice.primarySkill} />}
                    {practice.secondarySkill && <SkillTag skillId={practice.secondarySkill} />}
                  </div>
                  {practice.desc && (
                    <p className="text-[9px] mt-0.5" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>{practice.desc}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* XP Preset selector */}
        <div className="mb-6">
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>XP Award</p>
          <div className="flex gap-2">
            {availablePresets.map(preset => (
              <button
                key={preset.value}
                className="flex-1 py-3 text-center transition-all relative"
                disabled={preset.locked}
                style={{
                  background: !preset.locked && preset.value === selectedXp ? `${theme?.accent || '#60A5FA'}12` : 'rgba(255,255,255,0.02)',
                  border: `${special === 'anime' ? '2px' : '1px'} solid ${!preset.locked && preset.value === selectedXp ? (theme?.accent || '#60A5FA') + '20' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: elRadius,
                  opacity: preset.locked ? 0.35 : 1,
                }}
                onClick={() => { if (!preset.locked) { setSelectedXp(preset.value); haptics.tap() } }}
              >
                <span className="text-[14px] font-bold block" style={{
                  color: !preset.locked && preset.value === selectedXp ? (theme?.accent || '#60A5FA') : (theme?.textMuted || 'rgba(255,255,255,0.25)'),
                  fontFamily: theme?.fontHeader,
                }}>
                  {preset.value}
                </span>
                <span className="text-[8px] uppercase tracking-wider mt-0.5 block"
                  style={{ color: !preset.locked && preset.value === selectedXp ? (theme?.accent || '#60A5FA') : (theme?.textMuted || 'rgba(255,255,255,0.25)'), opacity: 0.6, fontFamily: theme?.fontBody }}>
                  {preset.label}
                </span>
                {preset.locked && (
                  <span className="text-[7px] absolute -bottom-0.5 left-1/2 -translate-x-1/2"
                    style={{ color: theme?.textMuted, opacity: 0.5, fontFamily: theme?.fontBody }}>
                    Lv{preset.minLevel}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Multiplier display */}
        {totalMultiplier > 1 && (
          <div className="mb-2 flex items-center gap-2 text-[9px]" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
            <span style={{ color: multiplierLabel ? '#A78BFA' : theme?.accent }}>
              {multiplierLabel && `${multiplier}x psychedelics`}
              {multiplierLabel && streakMult > 1 && ' + '}
              {streakMult > 1 && `${streakMult}x streak`}
              {' = '}{totalMultiplier}x total
            </span>
            <span style={{ opacity: 0.5 }}>({selectedXp} base {'\u2192'} {Math.round(selectedXp * totalMultiplier)} XP)</span>
          </div>
        )}

        {/* XP distribution preview */}
        {selectedPractice && practiceInfo && (
          <div className="mb-4 flex items-center gap-2 flex-wrap text-[9px]" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
            <span>XP split:</span>
            {practiceInfo.primarySkill && (
              <span style={{ color: CATEGORIES.find(c => c.skills.includes(practiceInfo.primarySkill))?.color }}>
                {SKILLS[practiceInfo.primarySkill]?.name} +{Math.round(selectedXp * totalMultiplier * PRIMARY_XP_RATIO)}
              </span>
            )}
            {practiceInfo.secondarySkill && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: CATEGORIES.find(c => c.skills.includes(practiceInfo.secondarySkill))?.color }}>
                  {SKILLS[practiceInfo.secondarySkill]?.name} +{Math.round(selectedXp * totalMultiplier * SECONDARY_XP_RATIO)}
                </span>
              </>
            )}
          </div>
        )}

        {/* Save */}
        <LevelButton special={special} color={activeTab.color} theme={theme}
          onClick={handleSave} disabled={!selectedPractice || !practiceInfo || saving}>
          {saving ? 'Saving\u2026' : 'Save Session'}
        </LevelButton>
      </div>
    </div>
  )
}

// ── Named exports for level-specific screen implementations ──────────────────
export {
  PHASES, LEVELS, TOTAL_PRACTICES, CHECK_INS, DEPTH_LEVELS,
  SKILL_AXES, BRAIN_DOTS, LEFT_HEMI, RIGHT_HEMI, LEFT_FOLDS, RIGHT_FOLDS,
  getSessionXp, getDateKey, erf, getProgressImage,
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function MentalFitnessTest({ onLogout }) {
  const { setMfXp } = useTheme()
  const [screen, setScreen] = useState('overview')
  const [logging, setLogging] = useState(false)       // false | 'normal' | 'psychedelic'
  const [activeCheckIn, setActiveCheckIn] = useState(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [data, setData] = useState({ sessions: [], customPractices: [] })
  const [loading, setLoading] = useState(true)
  const stats = useStats(data.sessions)
  const { level } = stats

  // Load from server on mount, with one-time localStorage migration
  useEffect(() => {
    (async () => {
      const serverData = await fetchMfData()

      setData(serverData)
      const xp = cacheMfXp(serverData.sessions)
      setMfXp(xp)
      setLoading(false)
    })()
  }, [])

  const theme = useMemo(() => {
    const xp = data.sessions.reduce((s, sess) => s + getSessionXp(sess), 0)
    return getThemeForXp(xp)
  }, [data.sessions])

  const totalXp = useMemo(() => data.sessions.reduce((s, sess) => s + getSessionXp(sess), 0), [data.sessions])

  const handleSave = useCallback((session) => {
    setData(prev => {
      const next = { ...prev, sessions: [...prev.sessions, session] }
      setMfXp(cacheMfXp(next.sessions))
      return next
    })
    setLogging(false)
    postSession(session).catch(e => console.error('Failed to save mf session:', e))
  }, [])

  const handleCreateCustom = useCallback((practice) => {
    setData(prev => ({
      ...prev,
      customPractices: [...(prev.customPractices || []), practice]
    }))
    setShowCustomModal(false)
    postCustomPractice(practice).catch(e => console.error('Failed to save custom practice:', e))
  }, [])

  const [xpReward, setXpReward] = useState(null)

  const handleCheckInDone = useCallback((checkIn) => {
    setActiveCheckIn(null)
    // Check-in awards flat 2 XP to global total (no skill targeting)
    const session = {
      id: 'checkin-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      practiceId: `checkin-${checkIn.id}`,
      practiceName: checkIn.label,
      isCustom: false,
      primarySkill: null,
      secondarySkill: null,
      xpAwarded: CHECKIN_XP,
    }
    setData(prev => {
      const next = { ...prev, sessions: [...prev.sessions, session] }
      setMfXp(cacheMfXp(next.sessions))
      return next
    })
    postSession(session).catch(e => console.error('Failed to save checkin session:', e))
    setXpReward({ id: checkIn.id, amount: CHECKIN_XP })
    setTimeout(() => setXpReward(null), 1500)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  // Full-screen check-in overlay
  if (activeCheckIn) {
    return (
      <motion.div
        className="flex-1 min-h-0 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <CheckInScreen checkIn={activeCheckIn} onDone={handleCheckInDone} onBack={() => setActiveCheckIn(null)} theme={theme} />
      </motion.div>
    )
  }

  // Full-screen log session overlay
  if (logging) {
    const isPsychedelic = logging === 'psychedelic'
    return (
      <motion.div
        className="flex-1 min-h-0 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <LevelBackground special={theme.special} />
        <LogSession
          onSave={handleSave}
          onBack={() => setLogging(false)}
          theme={theme}
          customPractices={data.customPractices || []}
          totalXp={totalXp}
          onCreateCustom={() => setShowCustomModal(true)}
          multiplier={isPsychedelic ? PSYCHEDELIC_MULTIPLIER : 1}
          multiplierLabel={isPsychedelic ? 'Psychedelics Training' : null}
          streak={stats.streak}
        />
        <AnimatePresence>
          {showCustomModal && (
            <CustomPracticeModal
              onSave={handleCreateCustom}
              onClose={() => setShowCustomModal(false)}
              theme={theme}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <LevelBackground special={theme.special} />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="flex-1 min-h-0 flex flex-col relative z-[2]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {(() => {
            const screens = SCREEN_MAP[theme.special]
            return (
              <>
                {screen === 'overview' && (screens
                  ? <screens.Home sessions={data.sessions} stats={stats} onCheckIn={setActiveCheckIn} theme={theme} />
                  : <OverviewScreen sessions={data.sessions} stats={stats} onCheckIn={setActiveCheckIn} theme={theme} />
                )}
                {screen === 'train' && <TrainScreen data={data} stats={stats} onLog={() => setLogging('normal')} onLogPsychedelic={() => setLogging('psychedelic')} onCheckIn={setActiveCheckIn} theme={theme} />}
                {screen === 'stats' && <StatsScreen sessions={data.sessions} stats={stats} theme={theme} />}
              </>
            )
          })()}
        </motion.div>
      </AnimatePresence>

      {/* XP reward pop animation after check-in */}
      <AnimatePresence>
        {xpReward && (
          <motion.div
            key="xp-reward"
            className="absolute z-50 pointer-events-none"
            style={{ left: '50%', bottom: '40%' }}
            initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.5, 1.3, 1.1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            <span className="text-[18px] font-bold drop-shadow-lg"
              style={{ color: theme?.accent || '#60A5FA', fontFamily: theme?.fontHeader }}>
              +{xpReward.amount} XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <MFBottomNav screen={screen} onNavigate={setScreen} onLogout={onLogout} color={level.color} theme={theme} />
    </div>
  )
}
