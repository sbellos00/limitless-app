// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Manga/Anime UI — Level 1: Awakened
//
// Shonen manga energy. Angled panels. Speed lines. Halftone dots.
// Bold borders. Impact frames. Power-level readouts. Bouncy springs.
//
// Fonts: Fredoka One (headers), Nunito (body)
// Accent: #87ceeb sky blue, #e85d8a pink
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import {
  PHASES, LEVELS, TOTAL_PRACTICES, CHECK_INS,
  SKILL_AXES, BRAIN_DOTS, LEFT_HEMI, RIGHT_HEMI, LEFT_FOLDS, RIGHT_FOLDS,
  getSessionXp, getDateKey, erf, getProgressImage,
} from './MentalFitnessTest.jsx'


// ── Design Tokens ────────────────────────────────────────────────────────────

const ACCENT = '#87ceeb'
const ACCENT_ALT = '#e85d8a'
const BORDER = `2px solid ${ACCENT}40`
const BORDER_BOLD = `3px solid ${ACCENT}60`
const RADIUS = '14px'
const RADIUS_SM = '12px'
const SPRING = { type: 'spring', stiffness: 400, damping: 20 }
const SPRING_BOUNCY = { type: 'spring', stiffness: 500, damping: 15 }


// ── Halftone Dot Overlay ─────────────────────────────────────────────────────
// Repeating radial-gradient to simulate manga halftone screening

function HalftoneOverlay({ opacity = 0.04 }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background: `radial-gradient(circle, rgba(255,255,255,${opacity}) 0.5px, transparent 0.5px)`,
        backgroundSize: '4px 4px',
      }}
    />
  )
}


// ── Speed Lines (SVG) ────────────────────────────────────────────────────────
// Radiating thin lines — horizontal burst, full-width section divider

function SpeedLines({ height = 32, color = ACCENT, opacity = 0.12 }) {
  const cx = 160, cy = height / 2
  const lineData = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI - Math.PI / 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      r1: 12 + Math.random() * 8,
      r2: 140 + Math.random() * 20,
      sw: 0.4 + Math.random() * 0.6,
      op: 0.5 + Math.random() * 0.5,
      cos, sin,
    }
  }), [])
  return (
    <svg width="100%" viewBox={`0 0 320 ${height}`} preserveAspectRatio="xMidYMid meet"
      className="overflow-visible">
      {lineData.map((d, i) => (
        <line key={i}
          x1={cx + d.cos * d.r1} y1={cy + d.sin * d.r1}
          x2={cx + d.cos * d.r2} y2={cy + d.sin * d.r2}
          stroke={color} strokeWidth={d.sw} opacity={opacity * d.op}
        />
      ))}
    </svg>
  )
}

// Horizontal speed lines — section separator
function HorizontalSpeedLines({ color = ACCENT, opacity = 0.15 }) {
  const lineData = useMemo(() => Array.from({ length: 14 }, () => ({
    y: 2 + Math.random() * 12,
    x1: Math.random() * 40,
    x2: 280 + Math.random() * 40,
    sw: 0.3 + Math.random() * 0.7,
    op: 0.3 + Math.random() * 0.7,
  })), [])
  return (
    <svg width="100%" viewBox="0 0 320 16" preserveAspectRatio="xMidYMid meet" className="my-1">
      {lineData.map((d, i) => (
        <line key={i} x1={d.x1} y1={d.y} x2={d.x2} y2={d.y}
          stroke={color} strokeWidth={d.sw} opacity={opacity * d.op}
        />
      ))}
    </svg>
  )
}


// ── Impact Frame ─────────────────────────────────────────────────────────────
// Double/triple border effect around key data

function ImpactFrame({ children, color = ACCENT, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-[16px]"
        style={{ border: `3px solid ${color}15` }} />
      <div className="absolute inset-[3px] rounded-[13px]"
        style={{ border: `2px solid ${color}30` }} />
      <div className="relative rounded-[12px] overflow-hidden"
        style={{ border: `2px solid ${color}50` }}>
        {children}
      </div>
    </div>
  )
}


// ── Angled Panel (clip-path polygon) ─────────────────────────────────────────
// Character image clipped to a dynamic diagonal shape

function AngledPanel({ src, alt = '', height = 280 }) {
  if (!src) return null
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      {/* Speed lines behind */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 z-0">
        <SpeedLines height={height} opacity={0.18} />
      </div>
      <HalftoneOverlay opacity={0.03} />
      <motion.img
        src={src}
        alt={alt}
        className="relative z-10 w-full h-full object-cover"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 82%, 85% 100%, 0 95%)',
        }}
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING, stiffness: 300 }}
      />
      {/* Diagonal accent stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] z-20"
        style={{
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_ALT})`,
          clipPath: 'polygon(0 0, 85% 0, 83% 100%, 0 100%)',
          opacity: 0.6,
        }}
      />
    </div>
  )
}


// ── Power Level Readout ──────────────────────────────────────────────────────
// Fighting game HUD style — horizontal bar with large number

function PowerReadout({ label, value, max, color = ACCENT, theme }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] uppercase tracking-[0.15em] w-[52px] shrink-0"
        style={{ color: theme?.textMuted, fontFamily: theme?.fontBody, fontWeight: 700 }}>
        {label}
      </span>
      <div className="flex-1 h-[8px] relative overflow-hidden"
        style={{ border: `2px solid ${color}35`, borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: `linear-gradient(90deg, ${color}90, ${color}50)`, borderRadius: '4px' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...SPRING, stiffness: 300 }}
        />
      </div>
      <span className="text-[18px] font-bold tabular-nums w-[50px] text-right shrink-0"
        style={{ color, fontFamily: theme?.fontHeader, lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}


// ── Anime Bell Curve ─────────────────────────────────────────────────────────
// Dramatic styling — speed lines behind, bold stroke, accent color fill

function AnimeBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 300, H = 100
  const PAD = { top: 10, right: 8, bottom: 24, left: 8 }
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

  // Speed line rays behind the curve
  const speedRays = []
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI - Math.PI / 2
    const cos = Math.cos(angle), sin = Math.sin(angle)
    speedRays.push(
      <line key={i}
        x1={userSx + cos * 6} y1={userSy + sin * 6}
        x2={userSx + cos * 50} y2={userSy + sin * 50}
        stroke={ACCENT} strokeWidth="0.3" opacity="0.12" />
    )
  }

  return (
    <ImpactFrame>
      <div className="p-3 relative" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <HalftoneOverlay opacity={0.025} />
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
          className="relative z-10">
          <defs>
            <linearGradient id="anime-bell-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.05" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Speed rays from user position */}
          {speedRays}

          {/* Baseline */}
          <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
            stroke={`${ACCENT}30`} strokeWidth="1" />

          {/* Level ticks */}
          {levelTicks.map(l => (
            <g key={l.name}>
              <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 5}
                stroke={`${ACCENT}40`} strokeWidth="0.8" />
              <text x={xS(l.z)} y={baseY + 14}
                fill={`${ACCENT}60`} fontSize="6" textAnchor="middle"
                fontFamily="'Fredoka One', sans-serif" letterSpacing="0.05em">
                {l.short}
              </text>
            </g>
          ))}

          {/* Filled area */}
          <path d={fillD} fill="url(#anime-bell-fill)" />

          {/* Full curve — bold */}
          <path d={fullD} fill="none" stroke={`${ACCENT}30`} strokeWidth="1.5" />

          {/* Filled segment — accent, bold */}
          <path d={filledLineD} fill="none" stroke={ACCENT} strokeWidth="2.5"
            strokeLinecap="round" />

          {/* User marker vertical */}
          <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
            stroke={ACCENT_ALT} strokeWidth="1" strokeDasharray="2,2" />

          {/* User dot — glowing */}
          <circle cx={userSx} cy={userSy} r="5"
            fill={ACCENT_ALT} opacity="0.25" />
          <circle cx={userSx} cy={userSy} r="3"
            fill={ACCENT_ALT} opacity="0.8" />
        </svg>
      </div>
    </ImpactFrame>
  )
}


// ── Anime Brain Map ──────────────────────────────────────────────────────────
// COLORED dots per phase, glow rings on mastered, animated center pulse

function AnimeBrainMap({ phaseStats, practiceCounts, theme }) {
  return (
    <div className="flex justify-center py-2">
      <svg width="200" height="165" viewBox="0 0 180 155">
        <defs>
          <radialGradient id="anime-brain-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${ACCENT}20`} />
            <stop offset="60%" stopColor={`${ACCENT}06`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Hemisphere fills */}
        <path d={LEFT_HEMI} fill="url(#anime-brain-glow)" />
        <path d={LEFT_HEMI} fill="none" stroke={`${ACCENT}30`} strokeWidth="1.5" />
        <path d={RIGHT_HEMI} fill="url(#anime-brain-glow)" />
        <path d={RIGHT_HEMI} fill="none" stroke={`${ACCENT}30`} strokeWidth="1.5" />

        {/* Fold lines */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={`${ACCENT}10`} strokeWidth="0.6" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={`${ACCENT}10`} strokeWidth="0.6" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke={`${ACCENT}08`} strokeWidth="0.5" />

        {/* Animated center pulse */}
        <motion.circle
          cx={90} cy={55} r={4}
          fill={`${ACCENT}50`}
          animate={{ opacity: [0.2, 0.6, 0.2], r: [4, 7, 4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Practice dots — colored per phase */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const mastered = count >= 10
            const r = count >= 10 ? 4 : count >= 5 ? 3.5 : count >= 3 ? 3 : count >= 1 ? 2.5 : 1.8
            const opacity = count >= 10 ? 1 : count >= 5 ? 0.75 : count >= 3 ? 0.55 : count >= 1 ? 0.35 : 0.12

            return (
              <g key={practice.id}>
                {/* Mastered glow ring */}
                {mastered && (
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={8}
                    fill="none" stroke={phase.color} strokeWidth="1.2"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <motion.circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={count > 0 ? phase.color : 'rgba(255,255,255,0.15)'}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity, scale: 1 }}
                  transition={{ ...SPRING, delay: pi * 0.08 + di * 0.02 }}
                />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}


// ── Anime Spider Chart ───────────────────────────────────────────────────────
// Colored per axis, bold lines, accent nodes

function AnimeSpiderChart({ practiceCounts, theme }) {
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
  const dataPoints = scores.map((score, i) => toXY(angles[i], Math.max((score / 100) * R, 4)))
  const dataPoly = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <ImpactFrame>
      <div className="p-3 relative" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <HalftoneOverlay opacity={0.02} />
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 260 }}>
            {/* Guide polygons */}
            {guides.map(g => {
              const pts = angles.map(a => toXY(a, R * g))
              return (
                <polygon key={g}
                  points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke={`${ACCENT}12`} strokeWidth="0.8" />
              )
            })}

            {/* Axis lines — colored per axis */}
            {angles.map((a, i) => {
              const end = toXY(a, R)
              return (
                <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
                  stroke={`${SKILL_AXES[i].color}25`} strokeWidth="0.8" />
              )
            })}

            {/* Data fill — accent */}
            <polygon points={dataPoly}
              fill={`${ACCENT}12`}
              stroke={ACCENT}
              strokeWidth="1.8"
              strokeLinejoin="round" />

            {/* Data points — colored per axis, bold */}
            {SKILL_AXES.map((axis, i) => {
              const pt = dataPoints[i]
              const labelPt = toXY(angles[i], R + 18)
              return (
                <g key={axis.name}>
                  <circle cx={pt.x} cy={pt.y} r="3.5"
                    fill={axis.color} opacity="0.85"
                    stroke={axis.color} strokeWidth="1.5" strokeOpacity="0.3" />
                  <text x={labelPt.x} y={labelPt.y}
                    fill={axis.color} fontSize="7.5" textAnchor="middle" dominantBaseline="middle"
                    opacity="0.7" fontFamily="'Fredoka One', sans-serif" fontWeight="400">
                    {axis.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </ImpactFrame>
  )
}


// ── Anime Discipline Bars ────────────────────────────────────────────────────
// Horizontal "power bars" with bold borders, phase colors

function AnimeDisciplineBar({ phase, practiceCounts, sessions, theme }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(
    sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId)
  )
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPRING}
    >
      <button
        className="w-full text-left active:scale-[0.98] transition-transform"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: phase.color, fontFamily: theme?.fontHeader }}>
              {phase.kanji}
            </span>
            <span className="text-[13px] font-bold"
              style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
              {phase.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tabular-nums"
              style={{ color: phase.color, fontFamily: theme?.fontBody }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              {totalSessions} sess
            </span>
            <motion.span
              className="text-[10px]"
              style={{ color: theme?.textMuted }}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▾
            </motion.span>
          </div>
        </div>

        {/* Power bar with bold border */}
        <div className="h-[10px] w-full relative overflow-hidden"
          style={{
            border: `2px solid ${phase.color}40`,
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.3)',
          }}>
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{
              background: `linear-gradient(90deg, ${phase.color}80, ${phase.color}40)`,
              borderRadius: '4px',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ ...SPRING, stiffness: 300 }}
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
            <div className="pt-3 pb-1 pl-1">
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                const barPct = count >= 10 ? 100 : count >= 5 ? 75 : count >= 3 ? 50 : count >= 1 ? 25 : 0
                return (
                  <div key={practice.id}
                    className="flex items-center gap-2 py-1.5"
                    style={{ borderBottom: `1px solid ${phase.color}10` }}>
                    <span className="text-[12px] flex-1 min-w-0 truncate"
                      style={{
                        color: count > 0 ? theme?.textSecondary : theme?.textMuted,
                        fontFamily: theme?.fontBody,
                        fontWeight: count > 0 ? 600 : 400,
                      }}>
                      {practice.name}
                    </span>
                    <div className="w-[28px] h-[4px] shrink-0 overflow-hidden"
                      style={{
                        border: `1px solid ${phase.color}20`,
                        borderRadius: '3px',
                        background: 'rgba(0,0,0,0.2)',
                      }}>
                      {barPct > 0 && (
                        <div className="h-full" style={{
                          width: `${barPct}%`,
                          background: phase.color,
                          opacity: count >= 10 ? 0.8 : 0.4,
                          borderRadius: '2px',
                        }} />
                      )}
                    </div>
                    <span className="text-[9px] tabular-nums w-[22px] text-right shrink-0"
                      style={{ color: count > 0 ? phase.color : theme?.textMuted, fontFamily: theme?.fontBody }}>
                      {count > 0 ? `${count}x` : '--'}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right shrink-0"
                      style={{ color: theme?.textMuted, fontFamily: theme?.fontBody, opacity: count > 0 ? 1 : 0.3 }}>
                      {count > 0 ? `${totalMin}m` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AnimeHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <HalftoneOverlay opacity={0.03} />

      {/* ── TITLE BANNER ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={SPRING_BOUNCY}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold"
            style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
            Level {level.idx + 1}
          </span>
          <h1 className="text-[36px] font-bold leading-none mt-0.5"
            style={{ color: theme?.text, fontFamily: theme?.fontHeader }}>
            {level.name}
          </h1>
        </motion.div>
      </div>

      {/* ── CHARACTER PANEL (angled clip-path) ── */}
      <div className="mt-3">
        <AngledPanel src={charImage} height={260} />
      </div>

      {/* ── POWER LEVEL READOUTS ── */}
      <div className="px-5 mt-4 relative z-10">
        <motion.div
          className="p-4 relative overflow-hidden"
          style={{
            border: BORDER_BOLD,
            borderRadius: RADIUS,
            background: 'rgba(135,206,235,0.04)',
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING}
        >
          <HalftoneOverlay opacity={0.02} />
          <div className="relative z-10 space-y-3">
            <PowerReadout label="XP" value={totalXp} max={level.next?.minXp || totalXp || 1} color={ACCENT} theme={theme} />
          </div>
          {/* Stats row */}
          <div className="relative z-10 flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(135,206,235,0.08)' }}>
            <div className="text-center">
              <span className="text-[14px] font-bold block" style={{ color: ACCENT_ALT, fontFamily: theme?.fontHeader }}>{sessions.length}</span>
              <span className="text-[7px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: theme?.fontBody }}>Sessions</span>
            </div>
            <div className="text-center">
              <span className="text-[14px] font-bold block" style={{ color: '#10B981', fontFamily: theme?.fontHeader }}>{streak > 0 ? `${streak}d` : '\u2014'}</span>
              <span className="text-[7px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: theme?.fontBody }}>Streak</span>
            </div>
            <div className="text-center">
              <span className="text-[14px] font-bold block" style={{ color: '#F59E0B', fontFamily: theme?.fontHeader }}>{uniquePractices}</span>
              <span className="text-[7px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: theme?.fontBody }}>Tried</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines />
      </div>

      {/* ── DISTRIBUTION ── */}
      <div className="px-5 mt-2 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold"
            style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
            Distribution
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-bold tabular-nums"
              style={{ color: ACCENT_ALT, fontFamily: theme?.fontHeader }}>
              {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em]"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              PERCENTILE
            </span>
          </div>
        </div>
        <AnimeBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines color={ACCENT_ALT} />
      </div>

      {/* ── PROGRESS TO NEXT ── */}
      {level.next && (
        <div className="px-5 mt-2 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold"
              style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
              Next Level
            </span>
            <span className="text-[11px] tabular-nums font-bold"
              style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>
              {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} xp
            </span>
          </div>
          <div className="h-[12px] w-full relative overflow-hidden"
            style={{
              border: `2px solid ${ACCENT}40`,
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
            }}>
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_ALT})`,
                borderRadius: '6px',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${lvlProgress}%` }}
              transition={{ ...SPRING, stiffness: 300 }}
            />
          </div>
          <p className="text-[10px] mt-1.5 font-bold uppercase tracking-[0.1em]"
            style={{ color: ACCENT_ALT, fontFamily: theme?.fontBody }}>
            Next: {level.next.name}
          </p>
        </div>
      )}

      <div className="px-5 mt-3">
        <HorizontalSpeedLines />
      </div>

      {/* ── CHECK-INS (chunky 2-column grid) ── */}
      <div className="px-5 mt-2 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-3"
          style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
          Check-Ins
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CHECK_INS.map((ci, i) => (
            <motion.button
              key={ci.id}
              onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
              className="text-left px-3 py-3 transition-transform"
              style={{
                border: `2px solid ${ACCENT}25`,
                borderRadius: RADIUS_SM,
                background: 'rgba(135,206,235,0.04)',
                fontFamily: theme?.fontBody,
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_BOUNCY, delay: i * 0.05 }}
            >
              <span className="text-[9px] font-bold tabular-nums block mb-0.5"
                style={{ color: ACCENT, opacity: 0.5 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-semibold block leading-tight"
                style={{ color: theme?.textSecondary }}>
                {ci.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines color={ACCENT_ALT} />
      </div>

      {/* ── DEV: Level Presets ── */}
      <div className="px-5 mt-2 pb-8 relative z-10">
        <span className="text-[9px] uppercase tracking-[0.15em] font-bold block mb-2"
          style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
          Preview
        </span>
        <div className="flex gap-1.5">
          {LEVELS.map((lvl, i) => (
            <motion.button
              key={lvl.name}
              onClick={() => onSeed(i)}
              className="flex-1 py-2.5 text-[8px] font-bold uppercase tracking-wider transition-transform"
              style={{
                background: level.idx === i ? `${ACCENT}18` : 'transparent',
                border: level.idx === i ? `2px solid ${ACCENT}50` : `2px solid ${ACCENT}15`,
                borderRadius: RADIUS_SM,
                color: level.idx === i ? ACCENT : theme?.textMuted,
                fontFamily: theme?.fontBody,
              }}
              whileTap={{ scale: 0.93 }}
            >
              {lvl.short}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AnimeStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <HalftoneOverlay opacity={0.03} />

      {/* ── TITLE ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={SPRING_BOUNCY}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold"
            style={{ color: ACCENT_ALT, fontFamily: theme?.fontBody }}>
            Power Analysis
          </span>
          <h1 className="text-[36px] font-bold leading-none mt-0.5"
            style={{ color: theme?.text, fontFamily: theme?.fontHeader }}>
            Statistics
          </h1>
        </motion.div>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines />
      </div>

      {/* ── BRAIN MAP ── */}
      <div className="px-5 mt-2 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-1"
          style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
          Neural Map
        </span>
        <ImpactFrame color={ACCENT}>
          <div className="p-2 relative" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <HalftoneOverlay opacity={0.02} />
            <AnimeBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
          </div>
        </ImpactFrame>
        {/* Phase legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
          {PHASES.map(phase => (
            <div key={phase.id} className="flex items-center gap-1">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: phase.color }} />
              <span className="text-[8px] font-bold uppercase tracking-wide"
                style={{ color: phase.color, opacity: 0.6, fontFamily: theme?.fontBody }}>
                {phase.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines color={ACCENT_ALT} />
      </div>

      {/* ── SPIDER CHART ── */}
      <div className="px-5 mt-2 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-2"
          style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
          Skill Axes
        </span>
        <AnimeSpiderChart practiceCounts={practiceCounts} theme={theme} />
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines />
      </div>

      {/* ── DISCIPLINE POWER BARS ── */}
      <div className="px-5 mt-2 pb-8 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-3"
          style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
          Disciplines
        </span>
        <div className="space-y-4">
          {PHASES.map((phase, i) => (
            <AnimeDisciplineBar
              key={phase.id}
              phase={phase}
              practiceCounts={practiceCounts}
              sessions={sessions}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAIN SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AnimeTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <HalftoneOverlay opacity={0.03} />

      {/* ── TITLE ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ x: 12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={SPRING_BOUNCY}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold"
            style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
            Training
          </span>
          <h1 className="text-[36px] font-bold leading-none mt-0.5"
            style={{ color: theme?.text, fontFamily: theme?.fontHeader }}>
            Mental Fitness
          </h1>
        </motion.div>
      </div>

      <div className="px-5 mt-4 relative z-10">
        {/* ── LOG SESSION BUTTON ── */}
        <motion.button
          onClick={() => { haptics.tap(); onLog() }}
          className="w-full py-4 relative overflow-hidden active:scale-[0.95] transition-transform"
          style={{
            border: BORDER_BOLD,
            borderRadius: RADIUS,
            background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT_ALT}10)`,
            fontFamily: theme?.fontHeader,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_BOUNCY}
        >
          <HalftoneOverlay opacity={0.03} />
          {/* Speed lines inside button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <SpeedLines height={56} opacity={0.15} />
          </div>
          <span className="relative z-10 text-[14px] uppercase tracking-[0.2em] font-bold"
            style={{ color: ACCENT }}>
            Log Session
          </span>
        </motion.button>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines />
      </div>

      {/* ── CHECK-INS (chunky 2-column grid) ── */}
      <div className="px-5 mt-2 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-3"
          style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
          Check-Ins
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CHECK_INS.map((ci, i) => (
            <motion.button
              key={ci.id}
              onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
              className="text-left px-3 py-3 transition-transform"
              style={{
                border: `2px solid ${ACCENT}25`,
                borderRadius: RADIUS_SM,
                background: 'rgba(135,206,235,0.04)',
                fontFamily: theme?.fontBody,
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_BOUNCY, delay: i * 0.05 }}
            >
              <span className="text-[9px] font-bold tabular-nums block mb-0.5"
                style={{ color: ACCENT, opacity: 0.5 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-semibold block leading-tight"
                style={{ color: theme?.textSecondary }}>
                {ci.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        <HorizontalSpeedLines color={ACCENT_ALT} />
      </div>

      {/* ── SESSION HISTORY ── */}
      {recent.length === 0 ? (
        <div className="px-5 mt-2 pb-8 relative z-10">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-2"
            style={{ color: ACCENT, fontFamily: theme?.fontBody }}>Recent Sessions</span>
          <p className="text-[12px]" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>No sessions yet</p>
        </div>
      ) : (
        <div className="px-5 mt-2 pb-8 relative z-10">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold block mb-2"
            style={{ color: ACCENT, fontFamily: theme?.fontBody }}>
            Recent Sessions
          </span>

          <ImpactFrame>
            <div className="p-3 relative" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <HalftoneOverlay opacity={0.02} />

              {/* Column headers */}
              <div className="flex items-center pb-2 mb-1 relative z-10"
                style={{ borderBottom: `2px solid ${ACCENT}20` }}>
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold w-[48px] shrink-0"
                  style={{ color: ACCENT, fontFamily: theme?.fontBody }}>Date</span>
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold flex-1"
                  style={{ color: ACCENT, fontFamily: theme?.fontBody }}>Practice</span>
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold w-[36px] text-right shrink-0"
                  style={{ color: ACCENT_ALT, fontFamily: theme?.fontBody }}>XP</span>
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold w-[30px] text-right shrink-0"
                  style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Min</span>
              </div>

              {recent.map((sess, idx) => {
                const practice = PHASES.flatMap(p => p.practices).find(p => p.id === sess.practiceId)
                const phase = PHASES.find(ph => ph.practices.some(p => p.id === sess.practiceId))
                const date = new Date(sess.timestamp)
                const today = getDateKey(new Date())
                const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
                const sessDay = getDateKey(date)
                const label = sessDay === today ? 'Today'
                  : sessDay === getDateKey(ydDate) ? 'Yday'
                  : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                return (
                  <motion.div
                    key={sess.id}
                    className="flex items-center py-1.5 relative z-10"
                    style={{ borderBottom: `1px solid ${ACCENT}08` }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: idx * 0.03 }}
                  >
                    <span className="text-[10px] w-[48px] shrink-0 tabular-nums font-semibold"
                      style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>{label}</span>
                    <span className="text-[10px] flex-1 min-w-0 truncate font-semibold"
                      style={{ color: phase?.color || theme?.textSecondary, fontFamily: theme?.fontBody }}>
                      {practice?.name || sess.practiceId}
                    </span>
                    <span className="text-[10px] tabular-nums w-[36px] text-right shrink-0 font-bold"
                      style={{ color: ACCENT_ALT, fontFamily: theme?.fontBody }}>
                      +{getSessionXp(sess)}
                    </span>
                    <span className="text-[9px] tabular-nums w-[30px] text-right shrink-0"
                      style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                      {sess.durationMin}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </ImpactFrame>
        </div>
      )}
    </div>
  )
}
