// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cosmic — Total Black Galaxy
// Level 8: Eternal / The Cosmic Shroud
//
// Pure black void. Silver starlight. Frosted glass on nothing.
// The final level — beyond color, beyond form.
//
// Rules:
//   · Every container = frosted glass (backdrop-blur, translucent bg, soft border)
//   · Inner glow via inset box-shadow — faint silver light from within
//   · Orbital ring decorations — thin SVG arcs/circles around key elements
//   · No hard edges — large border-radius, no visible borders
//   · Monochrome palette: silver/white at low opacities on pure black
//   · Generous spacing — elements float like celestial objects
//   · Font: Cormorant Garamond — thin, elegant serif
//   · Everything transparent and layered — glass on glass on void
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import {
  PHASES, LEVELS, TOTAL_PRACTICES, CHECK_INS,
  SKILL_AXES, BRAIN_DOTS, LEFT_HEMI, RIGHT_HEMI, LEFT_FOLDS, RIGHT_FOLDS,
  getSessionXp, getDateKey, erf, getProgressImage,
} from './MentalFitnessTest.jsx'


// ── Design Tokens ────────────────────────────────────────────────────────────

const ACCENT = '#808088'
const TEXT = '#d4d4dc'
const TEXT_MUTED = 'rgba(160, 160, 170, 0.30)'
const FONT = "'Cormorant Garamond', 'Garamond', 'Georgia', serif"
const EASE = [0.4, 0, 0.2, 1]

// Silver at various opacities
const a = (opacity) => `rgba(160, 160, 170, ${opacity})`

// ── Glassmorphism Primitives ─────────────────────────────────────────────────

const glassStyle = {
  background: a(0.04),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${a(0.08)}`,
  borderRadius: '16px',
  boxShadow: `inset 0 1px 1px ${a(0.1)}, inset 0 0 20px ${a(0.03)}`,
}

const glassSmall = {
  ...glassStyle,
  borderRadius: '10px',
}

function GlassCard({ children, className = '', style = {} }) {
  return (
    <div className={className} style={{ ...glassStyle, ...style }}>
      {children}
    </div>
  )
}

function GradientDivider() {
  return (
    <div className="my-6 mx-4" style={{
      height: '1px',
      background: `linear-gradient(90deg, transparent 0%, ${a(0.12)} 50%, transparent 100%)`,
    }} />
  )
}


// ── Orbital Ring SVG ─────────────────────────────────────────────────────────

function OrbitalRing({ size = 200, strokeWidth = 0.5, opacity = 0.15, dashArray, className = '' }) {
  const r = (size / 2) - 2
  return (
    <svg width={size} height={size} className={`absolute pointer-events-none ${className}`}
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={ACCENT} strokeWidth={strokeWidth}
        opacity={opacity}
        strokeDasharray={dashArray}
      />
    </svg>
  )
}

function OrbitalArc({ size = 200, startAngle = 0, endAngle = 270, strokeWidth = 0.5, opacity = 0.12 }) {
  const r = (size / 2) - 2
  const cx = size / 2, cy = size / 2
  const toRad = (deg) => (deg - 90) * Math.PI / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
  const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`

  return (
    <svg width={size} height={size} className="absolute pointer-events-none"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={strokeWidth}
        opacity={opacity} strokeLinecap="round" />
    </svg>
  )
}


// ── Cosmic Bell Curve ────────────────────────────────────────────────────────
// Soft gradient fill, glow at user position

function CosmicBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 280, H = 86
  const PAD = { top: 10, right: 0, bottom: 24, left: 0 }
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

  const levelTicks = LEVELS.filter(l => {
    const z = (l.minXp - MEAN) / SIGMA
    return l.minXp > 0 && z >= Z_MIN && z <= Z_MAX
  }).map(l => ({ ...l, z: (l.minXp - MEAN) / SIGMA }))

  const gradId = 'cosmic-bell-fill'

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Soft gradient fill for the area under the curve */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.12" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0.03" />
        </linearGradient>
        {/* Glow filter for user position */}
        <filter id="cosmic-user-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Baseline — fading gradient */}
      <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
        stroke={a(0.06)} strokeWidth="0.5" />

      {/* Level ticks */}
      {levelTicks.map(l => (
        <g key={l.name}>
          <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 4}
            stroke={a(0.15)} strokeWidth="0.5" />
          <text x={xS(l.z)} y={baseY + 13}
            fill={TEXT} fontSize="5" textAnchor="middle"
            fontFamily={FONT} letterSpacing="0.05em" opacity="0.25">
            {l.short}
          </text>
        </g>
      ))}

      {/* Filled area — soft gradient */}
      <path d={fillD} fill={`url(#${gradId})`} />

      {/* Full curve — ethereal line */}
      <path d={fullD} fill="none" stroke={a(0.1)} strokeWidth="0.75" />

      {/* Filled segment — brighter */}
      <path d={filledLineD} fill="none" stroke={a(0.4)} strokeWidth="1" />

      {/* User vertical line */}
      <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
        stroke={a(0.15)} strokeWidth="0.5" strokeDasharray="2 2" />

      {/* User dot with glow */}
      <circle cx={userSx} cy={userSy} r="3"
        fill={ACCENT} opacity="0.6" filter="url(#cosmic-user-glow)" />
      <circle cx={userSx} cy={userSy} r="1.5"
        fill="#fff" opacity="0.8" />
    </svg>
  )
}


// ── Cosmic Brain Map ─────────────────────────────────────────────────────────
// Dots with glow — mastered dots have animated pulse rings, colored per phase

function CosmicBrainMap({ phaseStats, practiceCounts, theme }) {
  return (
    <div className="flex justify-center py-3">
      <svg width="190" height="160" viewBox="0 0 180 155">
        <defs>
          <filter id="cosmic-dot-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hemispheres — very soft stroke */}
        <path d={LEFT_HEMI} fill="none" stroke={a(0.06)} strokeWidth="0.8" />
        <path d={RIGHT_HEMI} fill="none" stroke={a(0.06)} strokeWidth="0.8" />

        {/* Fold lines */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={a(0.03)} strokeWidth="0.5" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={a(0.03)} strokeWidth="0.5" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke={a(0.02)} strokeWidth="0.5" />

        {/* Practice dots — colored per phase, glow on mastery */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const mastered = count >= 10
            const r = mastered ? 3.5 : count >= 5 ? 3 : count >= 3 ? 2.5 : count >= 1 ? 2 : 1.5
            const opacity = mastered ? 0.7 : count >= 5 ? 0.5 : count >= 3 ? 0.3 : count >= 1 ? 0.18 : 0.06
            const dotColor = count >= 1 ? phase.color : ACCENT

            return (
              <g key={practice.id}>
                {/* Glow on mastered dots */}
                {mastered && (
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={7}
                    fill="none" stroke={phase.color} strokeWidth="0.8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={dotColor} opacity={opacity}
                  filter={mastered ? 'url(#cosmic-dot-glow)' : undefined}
                />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}


// ── Cosmic Spider Chart ──────────────────────────────────────────────────────
// Soft lines with glow, gradient data polygon, constellation-like connections

function CosmicSpiderChart({ practiceCounts, theme }) {
  const size = 230
  const cx = size / 2, cy = size / 2
  const R = 72
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
    return Math.round((total / axis.practices.length) * 100)
  })

  const guides = [0.25, 0.5, 0.75, 1]
  const dataPoints = scores.map((score, i) => toXY(angles[i], Math.max((score / 100) * R, 3)))
  const dataPoly = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="flex justify-center py-2">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 250 }}>
        <defs>
          <linearGradient id="cosmic-spider-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.1" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.03" />
          </linearGradient>
          <filter id="cosmic-spider-glow">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Guide polygons — soft, barely visible */}
        {guides.map(g => {
          const pts = angles.map(aa => toXY(aa, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={a(0.04)} strokeWidth="0.5" />
          )
        })}

        {/* Axis lines — constellation threads */}
        {angles.map((aa, i) => {
          const end = toXY(aa, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={a(0.05)} strokeWidth="0.5" />
          )
        })}

        {/* Glow layer behind data polygon */}
        <polygon points={dataPoly}
          fill={a(0.06)}
          stroke={a(0.3)}
          strokeWidth="1.5"
          filter="url(#cosmic-spider-glow)" />

        {/* Data polygon — gradient fill */}
        <polygon points={dataPoly}
          fill="url(#cosmic-spider-fill)"
          stroke={a(0.35)}
          strokeWidth="0.8" />

        {/* Dots + labels */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 18)
          return (
            <g key={axis.name}>
              {/* Dot with glow */}
              <circle cx={pt.x} cy={pt.y} r="2" fill={ACCENT} opacity="0.5"
                filter="url(#cosmic-spider-glow)" />
              <circle cx={pt.x} cy={pt.y} r="1.2" fill="#fff" opacity="0.6" />
              <text x={labelPt.x} y={labelPt.y}
                fill={TEXT} fontSize="6.5" textAnchor="middle" dominantBaseline="middle"
                opacity="0.3" fontFamily={FONT} letterSpacing="0.06em">
                {axis.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ── Cosmic Discipline Bar ────────────────────────────────────────────────────

function CosmicDisciplineBar({ phase, practiceCounts, sessions, theme }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div>
      <button
        className="w-full text-left"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
      >
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[13px] tracking-wide"
            style={{ color: TEXT, opacity: 0.7, fontFamily: FONT }}>
            {phase.name}
          </span>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tabular-nums"
              style={{ color: TEXT_MUTED, fontFamily: FONT }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums"
              style={{ color: TEXT_MUTED, fontFamily: FONT }}>
              {totalSessions} sess
            </span>
            <span className="text-[9px]"
              style={{
                color: TEXT_MUTED,
                display: 'inline-block',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
              ▾
            </span>
          </div>
        </div>

        {/* Glass-style progress bar with inner glow fill */}
        <div className="h-[5px] overflow-hidden" style={{
          borderRadius: '10px',
          background: a(0.04),
          boxShadow: `inset 0 0 4px ${a(0.03)}`,
        }}>
          <div className="h-full transition-all duration-700" style={{
            width: `${pct}%`,
            borderRadius: '10px',
            background: `linear-gradient(90deg, ${a(0.15)}, ${a(0.3)})`,
            boxShadow: `0 0 8px ${a(0.15)}, inset 0 0 4px ${a(0.1)}`,
          }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1">
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                return (
                  <div key={practice.id}
                    className="flex items-center py-1.5"
                    style={{
                      borderBottom: `0.5px solid ${a(0.04)}`,
                    }}>
                    {/* Tiny glow dot */}
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mr-2" style={{
                      background: count > 0 ? ACCENT : a(0.1),
                      opacity: count > 0 ? 0.5 : 0.3,
                      boxShadow: count > 0 ? `0 0 4px ${a(0.3)}` : 'none',
                    }} />
                    <span className="text-[10px] flex-1 min-w-0 truncate"
                      style={{
                        color: count > 0 ? TEXT : TEXT_MUTED,
                        fontFamily: FONT,
                        opacity: count > 0 ? 0.8 : 0.5,
                      }}>
                      {practice.name}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right"
                      style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                      {count > 0 ? `${count}x` : '\u2014'}
                    </span>
                    <span className="text-[9px] tabular-nums w-[32px] text-right"
                      style={{ color: TEXT_MUTED, fontFamily: FONT, opacity: count > 0 ? 1 : 0.3 }}>
                      {count > 0 ? `${totalMin}m` : ''}
                    </span>
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CosmicHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {/* ── Level Identity ── */}
      <div className="px-6 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-[0.35em] mb-1"
          style={{ color: TEXT_MUTED, fontFamily: FONT }}>
          Level {level.idx + 1}
        </p>
        <h1 className="text-[38px] font-light leading-none tracking-wide"
          style={{ color: TEXT, fontFamily: FONT }}>
          {level.name}
        </h1>
      </div>

      {/* ── Character with Orbital Ring ── */}
      {charImage && (
        <div className="relative flex justify-center my-6 overflow-hidden">
          <div className="relative">
            <img src={charImage} alt=""
              className="block object-cover"
              style={{
                maxHeight: '260px',
                borderRadius: '16px',
                opacity: 0.9,
                boxShadow: `0 0 40px ${a(0.08)}, inset 0 0 20px ${a(0.05)}`,
              }}
            />
            {/* Outer orbital ring */}
            <OrbitalRing size={300} strokeWidth={0.5} opacity={0.1}
              dashArray="4 8" />
            {/* Inner orbital arc */}
            <OrbitalArc size={280} startAngle={30} endAngle={210}
              strokeWidth={0.4} opacity={0.08} />
          </div>
        </div>
      )}

      <div className="px-5 space-y-0">
        {/* ── Overview Stats — floating glass panels ── */}
        <GlassCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-4"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Overview
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: totalXp.toLocaleString(), label: 'Total XP' },
              { value: sessions.length, label: 'Sessions' },
              { value: streak > 0 ? `${streak}d` : '\u2014', label: 'Streak' },
              { value: uniquePractices, label: 'Practices' },
            ].map(d => (
              <div key={d.label} className="p-3" style={{
                ...glassSmall,
                background: a(0.03),
              }}>
                <p className="text-[22px] font-light tabular-nums leading-none"
                  style={{ color: TEXT, fontFamily: FONT }}>
                  {d.value}
                </p>
                <p className="text-[8px] uppercase tracking-[0.2em] mt-2"
                  style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                  {d.label}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GradientDivider />

        {/* ── Distribution ── */}
        <GlassCard className="p-5">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.3em]"
              style={{ color: TEXT_MUTED, fontFamily: FONT }}>
              Distribution
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-light tabular-nums"
                style={{ color: TEXT, fontFamily: FONT }}>
                {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em]"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                Percentile
              </span>
            </div>
          </div>
          <CosmicBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
        </GlassCard>

        <GradientDivider />

        {/* ── Progress to Next Level ── */}
        {level.next && (
          <>
            <GlassCard className="p-5">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[9px] uppercase tracking-[0.3em]"
                  style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                  Progress
                </p>
                <span className="text-[10px] tabular-nums"
                  style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                  {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} xp
                </span>
              </div>
              {/* Glass progress bar */}
              <div className="h-[5px] overflow-hidden" style={{
                borderRadius: '10px',
                background: a(0.04),
                boxShadow: `inset 0 0 4px ${a(0.03)}`,
              }}>
                <motion.div
                  className="h-full"
                  style={{
                    borderRadius: '10px',
                    background: `linear-gradient(90deg, ${a(0.15)}, ${a(0.35)})`,
                    boxShadow: `0 0 12px ${a(0.2)}, inset 0 0 4px ${a(0.15)}`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${lvlProgress}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                />
              </div>
              <p className="text-[10px] mt-3 tracking-wide"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                Next: {level.next.name}
              </p>
            </GlassCard>
            <GradientDivider />
          </>
        )}

        {/* ── Check-Ins ── */}
        <GlassCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-4"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Check-Ins
          </p>
          <div className="flex flex-wrap gap-2">
            {CHECK_INS.map(ci => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="px-4 py-2.5 transition-all active:scale-95"
                style={{
                  ...glassSmall,
                  background: a(0.03),
                  cursor: 'pointer',
                }}
              >
                <span className="text-[11px]"
                  style={{ color: TEXT, opacity: 0.6, fontFamily: FONT }}>
                  {ci.label}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CosmicStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-[0.35em] mb-1"
          style={{ color: TEXT_MUTED, fontFamily: FONT }}>
          Progress
        </p>
        <h1 className="text-[38px] font-light leading-none tracking-wide"
          style={{ color: TEXT, fontFamily: FONT }}>
          Statistics
        </h1>
      </div>

      <div className="px-5 pt-4 space-y-0">
        {/* ── Brain Map ── */}
        <GlassCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-2"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Neural Map
          </p>
          <CosmicBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
        </GlassCard>

        <GradientDivider />

        {/* ── Spider Chart ── */}
        <GlassCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-2"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Skill Axes
          </p>
          <CosmicSpiderChart practiceCounts={practiceCounts} theme={theme} />
        </GlassCard>

        <GradientDivider />

        {/* ── Disciplines ── */}
        <GlassCard className="p-5 pb-4">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-5"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Disciplines
          </p>
          <div className="space-y-5">
            {PHASES.map(phase => (
              <CosmicDisciplineBar
                key={phase.id}
                phase={phase}
                practiceCounts={practiceCounts}
                sessions={sessions}
                theme={theme}
              />
            ))}
          </div>
        </GlassCard>

        <div className="h-8" />
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAIN SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CosmicTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-[0.35em] mb-1"
          style={{ color: TEXT_MUTED, fontFamily: FONT }}>
          Training
        </p>
        <h1 className="text-[38px] font-light leading-none tracking-wide"
          style={{ color: TEXT, fontFamily: FONT }}>
          Mental Fitness
        </h1>
      </div>

      <div className="px-5 pt-4 space-y-0">
        {/* ── Log Session Button ── */}
        <button
          onClick={() => { haptics.tap(); onLog() }}
          className="w-full py-4 transition-all active:scale-[0.98]"
          style={{
            ...glassStyle,
            background: a(0.06),
            cursor: 'pointer',
            fontFamily: FONT,
            color: TEXT,
            fontSize: '12px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            boxShadow: `inset 0 1px 1px ${a(0.12)}, inset 0 0 24px ${a(0.04)}, 0 0 20px ${a(0.06)}`,
          }}
        >
          Log Session
        </button>

        <GradientDivider />

        {/* ── Check-Ins ── */}
        <GlassCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] mb-4"
            style={{ color: TEXT_MUTED, fontFamily: FONT }}>
            Check-Ins
          </p>
          <div className="flex flex-wrap gap-2">
            {CHECK_INS.map(ci => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="px-4 py-2.5 transition-all active:scale-95"
                style={{
                  ...glassSmall,
                  background: a(0.03),
                  cursor: 'pointer',
                }}
              >
                <span className="text-[11px]"
                  style={{ color: TEXT, opacity: 0.6, fontFamily: FONT }}>
                  {ci.label}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GradientDivider />

        {/* ── Session History ── */}
        <GlassCard className="p-5 pb-4">
          {recent.length === 0 ? (
            <p className="text-[11px]" style={{ color: TEXT_MUTED, fontFamily: FONT, opacity: 0.6 }}>No sessions yet</p>
          ) : (
            <>
            <p className="text-[9px] uppercase tracking-[0.3em] mb-4"
              style={{ color: TEXT_MUTED, fontFamily: FONT }}>
              Recent Sessions
            </p>

            {/* Column headers */}
            <div className="flex items-center pb-2 mb-1"
              style={{
                borderBottom: `1px solid ${a(0.06)}`,
              }}>
              <span className="text-[9px] uppercase tracking-[0.2em] w-[50px] shrink-0"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>Date</span>
              <span className="text-[9px] uppercase tracking-[0.2em] flex-1"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>Practice</span>
              <span className="text-[9px] uppercase tracking-[0.2em] w-[34px] text-right shrink-0"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>XP</span>
              <span className="text-[9px] uppercase tracking-[0.2em] w-[28px] text-right shrink-0"
                style={{ color: TEXT_MUTED, fontFamily: FONT }}>Min</span>
            </div>

            {recent.map((sess, idx) => {
              const practice = PHASES.flatMap(p => p.practices).find(p => p.id === sess.practiceId)
              const date = new Date(sess.timestamp)
              const today = getDateKey(new Date())
              const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
              const sessDay = getDateKey(date)
              const label = sessDay === today ? 'Today'
                : sessDay === getDateKey(ydDate) ? 'Yday'
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div key={sess.id} className="flex items-center py-2"
                  style={{
                    borderBottom: idx < recent.length - 1
                      ? `0.5px solid ${a(0.04)}`
                      : 'none',
                  }}>
                  <span className="text-[10px] w-[50px] shrink-0 tabular-nums"
                    style={{ color: TEXT_MUTED, fontFamily: FONT }}>{label}</span>
                  <span className="text-[10px] flex-1 min-w-0 truncate"
                    style={{ color: TEXT, opacity: 0.6, fontFamily: FONT }}>
                    {practice?.name || sess.practiceId}
                  </span>
                  <span className="text-[9px] tabular-nums w-[34px] text-right shrink-0"
                    style={{ color: ACCENT, opacity: 0.4, fontFamily: FONT }}>
                    +{getSessionXp(sess)}
                  </span>
                  <span className="text-[9px] tabular-nums w-[28px] text-right shrink-0"
                    style={{ color: TEXT_MUTED, fontFamily: FONT }}>
                    {sess.durationMin}
                  </span>
                </div>
              )
            })}
            </>
          )}
        </GlassCard>

        <div className="h-8" />
      </div>
    </div>
  )
}
