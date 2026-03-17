// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Analog Film / Retrofuturism — 70s Cinema, Bruce Lee Era
// Level 2: Practitioner
//
// 35mm film projection. Sprocket holes. Letterbox bars. Kodak edge markings.
// Warm amber tones. Grain overlay. Vignette. Centered like a cinema screen.
//
// Rules:
//   · Film sprocket holes along both vertical edges
//   · Letterbox bars at top and bottom
//   · Film edge markings ("24A", "KODAK 5247", frame numbers)
//   · Grain overlay via SVG filter
//   · Everything centered — content projected on screen
//   · Character image in a thick "film frame" border
//   · Warm amber (#c97b3a) accent, beige (#d4c4a0) text
//   · Medium border-radius (8-12px)
//   · Compact, dense — like reading a contact sheet
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

const AMBER = '#c97b3a'
const BEIGE = '#d4c4a0'
const DARK = '#1c1c1c'
const RULE_COLOR = 'rgba(201,123,58,0.12)'
const SPROCKET_COLOR = 'rgba(201,123,58,0.08)'
const EDGE_TEXT_COLOR = 'rgba(201,123,58,0.18)'
const FILM_BORDER = 'rgba(201,123,58,0.10)'
const FONT = "'Helvetica Neue', Arial, sans-serif"

// Sprocket hole dimensions
const SPROCKET_W = 4
const SPROCKET_H = 6
const SPROCKET_GAP = 20
const SPROCKET_MARGIN = 8 // distance from edge


// ── Structural Primitives ────────────────────────────────────────────────────

function FilmGrain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] opacity-[0.035]"
      style={{ mixBlendMode: 'overlay' }}>
      <svg width="100%" height="100%">
        <filter id="film-grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain-noise)" />
      </svg>
    </div>
  )
}

function LetterboxBars() {
  return (
    <>
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-[40]"
        style={{ height: 6, background: 'rgba(0,0,0,0.6)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[40]"
        style={{ height: 6, background: 'rgba(0,0,0,0.6)' }} />
    </>
  )
}

function SprocketHoles() {
  // Generate sprocket holes along both edges
  const holes = []
  const count = 60 // enough to fill a long scroll
  for (let i = 0; i < count; i++) {
    const y = 10 + i * SPROCKET_GAP
    // Left sprocket
    holes.push(
      <rect key={`l${i}`}
        x={SPROCKET_MARGIN} y={y}
        width={SPROCKET_W} height={SPROCKET_H}
        rx="1"
        fill={SPROCKET_COLOR}
      />
    )
    // Right sprocket
    holes.push(
      <rect key={`r${i}`}
        x={`calc(100% - ${SPROCKET_MARGIN + SPROCKET_W}px)`}
        y={y}
        width={SPROCKET_W} height={SPROCKET_H}
        rx="1"
        fill={SPROCKET_COLOR}
      />
    )
  }
  return null // SVG calc() not supported — use div-based approach below
}

function SprocketStrip() {
  const count = 60
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(
      <div key={i} style={{
        width: SPROCKET_W,
        height: SPROCKET_H,
        borderRadius: 1,
        background: SPROCKET_COLOR,
        marginBottom: SPROCKET_GAP - SPROCKET_H,
        flexShrink: 0,
      }} />
    )
  }
  return (
    <div className="flex flex-col items-center" style={{ paddingTop: 10 }}>
      {items}
    </div>
  )
}

function FilmEdgeMarkings({ side }) {
  const marks = side === 'left'
    ? ['24', '24A', '25', '25A', '26', '26A', '27', '28', '28A', '29', '30', '31', '32']
    : ['KODAK', '5247', 'SAFETY', 'FILM', '24', 'KODAK', '5247', '25', 'SAFETY', '26', 'FILM', '27', '5247']
  return (
    <div className="flex flex-col items-center" style={{ gap: 52, paddingTop: 30 }}>
      {marks.map((m, i) => (
        <span key={i} style={{
          fontSize: 6,
          fontFamily: FONT,
          color: EDGE_TEXT_COLOR,
          letterSpacing: '0.05em',
          writingMode: side === 'left' ? 'vertical-rl' : 'vertical-lr',
          textOrientation: 'mixed',
          transform: side === 'left' ? 'rotate(180deg)' : 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {m}
        </span>
      ))}
    </div>
  )
}

function FilmFrame({ children }) {
  return (
    <div className="relative flex" style={{ minHeight: '100%' }}>
      {/* Left sprocket strip + edge markings */}
      <div className="flex-shrink-0 flex gap-0.5" style={{ width: 24 }}>
        <SprocketStrip />
        <FilmEdgeMarkings side="left" />
      </div>

      {/* Center content — the "projected" area */}
      <div className="flex-1 min-w-0 relative">
        {/* Vignette overlay */}
        <div className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
          }} />
        {children}
      </div>

      {/* Right sprocket strip + edge markings */}
      <div className="flex-shrink-0 flex gap-0.5" style={{ width: 24 }}>
        <FilmEdgeMarkings side="right" />
        <SprocketStrip />
      </div>
    </div>
  )
}

function Rule() {
  return <div className="w-full" style={{ borderTop: `1px solid ${RULE_COLOR}` }} />
}

function SectionLabel({ number, label, theme }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {number != null && (
        <span className="text-[9px] tabular-nums" style={{
          color: EDGE_TEXT_COLOR,
          fontFamily: FONT,
          letterSpacing: '0.15em',
        }}>
          {String(number).padStart(2, '0')}
        </span>
      )}
      <span className="text-[9px] uppercase tracking-[0.25em]"
        style={{ color: theme?.textMuted || 'rgba(212,196,160,0.28)', fontFamily: FONT }}>
        {label}
      </span>
    </div>
  )
}

function FrameNumber({ n }) {
  return (
    <span style={{
      fontSize: 6,
      fontFamily: FONT,
      color: EDGE_TEXT_COLOR,
      letterSpacing: '0.1em',
      userSelect: 'none',
    }}>
      {String(n).padStart(3, '0')}
    </span>
  )
}


// ── Film Bell Curve ──────────────────────────────────────────────────────────
// Warm amber tones, grain texture feel, compact

function FilmBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 260, H = 72
  const PAD = { top: 6, right: 0, bottom: 20, left: 0 }
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

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {/* Baseline */}
      <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
        stroke={RULE_COLOR} strokeWidth="0.5" />

      {/* Level ticks — amber */}
      {levelTicks.map(l => (
        <g key={l.name}>
          <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 4}
            stroke="rgba(201,123,58,0.2)" strokeWidth="0.5" />
          <text x={xS(l.z)} y={baseY + 12}
            fill="rgba(201,123,58,0.2)" fontSize="5" textAnchor="middle"
            fontFamily={FONT} letterSpacing="0.05em">
            {l.short}
          </text>
        </g>
      ))}

      {/* Filled area — warm amber */}
      <path d={fillD} fill="rgba(201,123,58,0.06)" />

      {/* Full curve — warm sepia */}
      <path d={fullD} fill="none" stroke="rgba(201,123,58,0.12)" strokeWidth="0.75" />

      {/* Filled segment — amber highlight */}
      <path d={filledLineD} fill="none" stroke="rgba(201,123,58,0.4)" strokeWidth="1" />

      {/* User marker — warm vertical */}
      <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
        stroke="rgba(201,123,58,0.25)" strokeWidth="0.5" />

      {/* User dot — amber */}
      <circle cx={userSx} cy={userSy} r="2"
        fill={AMBER} opacity="0.6" />
    </svg>
  )
}


// ── Film Brain Map ───────────────────────────────────────────────────────────
// Warm sepia monochrome — no bright colors

function FilmBrainMap({ phaseStats, practiceCounts, theme }) {
  return (
    <div className="flex justify-center py-2">
      <svg width="180" height="150" viewBox="0 0 180 155">
        {/* Hemispheres — warm amber stroke */}
        <path d={LEFT_HEMI} fill="none" stroke="rgba(201,123,58,0.1)" strokeWidth="0.8" />
        <path d={RIGHT_HEMI} fill="none" stroke="rgba(201,123,58,0.1)" strokeWidth="0.8" />

        {/* Fold lines — faint sepia */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke="rgba(201,123,58,0.04)" strokeWidth="0.5" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke="rgba(201,123,58,0.04)" strokeWidth="0.5" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke="rgba(201,123,58,0.03)" strokeWidth="0.5" />

        {/* Practice dots — amber monochrome, opacity = mastery */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const r = count >= 10 ? 3.5 : count >= 5 ? 3 : count >= 3 ? 2.5 : count >= 1 ? 2 : 1.5
            const opacity = count >= 10 ? 0.55 : count >= 5 ? 0.4 : count >= 3 ? 0.25 : count >= 1 ? 0.15 : 0.05
            return (
              <circle key={practice.id}
                cx={pos.x} cy={pos.y} r={r}
                fill={AMBER} opacity={opacity}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}


// ── Film Spider Chart ────────────────────────────────────────────────────────
// Warm amber monochrome, thin lines

function FilmSpiderChart({ practiceCounts, theme }) {
  const size = 220
  const cx = size / 2, cy = size / 2
  const R = 68
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
    <div className="flex justify-center py-1">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 240 }}>
        {/* Guide polygons — warm sepia */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(201,123,58,0.06)" strokeWidth="0.5" />
          )
        })}

        {/* Axis lines — warm */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="rgba(201,123,58,0.06)" strokeWidth="0.5" />
          )
        })}

        {/* Data fill — amber */}
        <polygon points={dataPoly}
          fill="rgba(201,123,58,0.05)"
          stroke="rgba(201,123,58,0.3)"
          strokeWidth="0.8" />

        {/* Dots + labels — amber monochrome */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 16)
          return (
            <g key={axis.name}>
              <circle cx={pt.x} cy={pt.y} r="1.8" fill={AMBER} opacity="0.4" />
              <text x={labelPt.x} y={labelPt.y}
                fill={BEIGE} fontSize="6" textAnchor="middle" dominantBaseline="middle"
                opacity="0.22" fontFamily={FONT} letterSpacing="0.08em">
                {axis.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ── Film Discipline Bar ──────────────────────────────────────────────────────
// Film-strip style horizontal bars

function FilmDisciplineBar({ phase, practiceCounts, sessions, theme }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div>
      <button
        className="w-full"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
      >
        <div className="flex items-baseline justify-center gap-6 mb-2">
          <span className="text-[12px] font-medium tracking-wide text-center"
            style={{ color: BEIGE, opacity: 0.6, fontFamily: FONT }}>
            {phase.name}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: FONT }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: FONT }}>
              {totalSessions} sess
            </span>
            <span className="text-[9px]"
              style={{
                color: theme?.textMuted,
                display: 'inline-block',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}>
              ▾
            </span>
          </div>
        </div>

        {/* Progress — film-strip style with rounded ends */}
        <div className="h-[3px] w-full" style={{ background: 'rgba(201,123,58,0.06)', borderRadius: 2 }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, background: AMBER, opacity: 0.25, borderRadius: 2 }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1">
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                return (
                  <div key={practice.id}
                    className="flex items-center justify-center py-1.5"
                    style={{ borderBottom: '0.5px solid rgba(201,123,58,0.05)' }}>
                    <span className="text-[10px] flex-1 min-w-0 truncate text-center"
                      style={{
                        color: count > 0 ? theme?.textSecondary : theme?.textMuted,
                        fontFamily: FONT,
                        opacity: count > 0 ? 1 : 0.5,
                      }}>
                      {practice.name}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right"
                      style={{ color: theme?.textMuted, fontFamily: FONT }}>
                      {count > 0 ? `${count}×` : '—'}
                    </span>
                    <span className="text-[9px] tabular-nums w-[32px] text-right"
                      style={{ color: theme?.textMuted, fontFamily: FONT, opacity: count > 0 ? 1 : 0.3 }}>
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

export function FilmHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
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
      <FilmGrain />
      <LetterboxBars />

      <FilmFrame>
        <div className="relative z-[2]">
          {/* 01 — Level Identity */}
          <div className="pt-5 pb-3 text-center">
            <SectionLabel number={1} label={`Level ${level.idx + 1}`} theme={theme} />
            <h1 className="text-[36px] font-bold leading-none mt-1 tracking-tight text-center"
              style={{ color: BEIGE, fontFamily: FONT }}>
              {level.name}
            </h1>
          </div>

          {/* Character — film frame border */}
          {charImage && (
            <div className="flex justify-center px-4 pb-4">
              <div style={{
                border: `7px solid ${DARK}`,
                borderRadius: 10,
                boxShadow: `0 0 0 1px rgba(201,123,58,0.15), inset 0 0 0 1px rgba(201,123,58,0.08)`,
                overflow: 'hidden',
                maxWidth: 280,
                width: '100%',
                position: 'relative',
              }}>
                {/* Frame number overlay */}
                <div className="absolute top-1 right-2 z-10">
                  <FrameNumber n={24} />
                </div>
                <img src={charImage} alt=""
                  className="w-full object-cover block"
                  style={{ maxHeight: 260, borderRadius: 3 }}
                />
              </div>
            </div>
          )}

          <div className="px-3">
            <Rule />

            {/* 02 — Data Slate (clapperboard style) */}
            <div className="py-4">
              <SectionLabel number={2} label="Overview" theme={theme} />
              <div className="mt-3 mx-auto" style={{
                maxWidth: 280,
                background: 'rgba(201,123,58,0.04)',
                border: `1px solid ${FILM_BORDER}`,
                borderRadius: 10,
                padding: '12px 16px',
              }}>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: totalXp.toLocaleString(), label: 'XP' },
                    { value: sessions.length, label: 'Sessions' },
                    { value: streak > 0 ? `${streak}d` : '—', label: 'Streak' },
                    { value: `${uniquePractices}/${TOTAL_PRACTICES}`, label: 'Tried' },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-[20px] font-semibold tabular-nums leading-none"
                        style={{ color: BEIGE, fontFamily: FONT }}>
                        {d.value}
                      </p>
                      <p className="text-[7px] uppercase tracking-[0.2em] mt-1.5"
                        style={{ color: theme?.textMuted, fontFamily: FONT }}>
                        {d.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Rule />

            {/* 03 — Distribution */}
            <div className="py-4 text-center">
              <div className="flex items-baseline justify-center gap-4">
                <SectionLabel number={3} label="Distribution" theme={theme} />
                <div className="flex items-baseline gap-2">
                  <span className="text-[20px] font-semibold tabular-nums"
                    style={{ color: BEIGE, fontFamily: FONT }}>
                    {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
                  </span>
                  <span className="text-[7px] uppercase tracking-[0.2em]"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>
                    Percentile
                  </span>
                </div>
              </div>
              <div className="mt-3 mx-auto" style={{ maxWidth: 280 }}>
                <FilmBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
              </div>
            </div>

            <Rule />

            {/* 04 — Progress to Next */}
            {level.next && (
              <>
                <div className="py-4 text-center">
                  <div className="flex items-baseline justify-center gap-4 mb-3">
                    <SectionLabel number={4} label="Progress" theme={theme} />
                    <span className="text-[10px] tabular-nums"
                      style={{ color: theme?.textMuted, fontFamily: FONT }}>
                      {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} xp
                    </span>
                  </div>
                  {/* Progress bar — rounded, warm */}
                  <div className="mx-auto" style={{ maxWidth: 260 }}>
                    <div className="h-[4px] w-full" style={{ background: 'rgba(201,123,58,0.08)', borderRadius: 2 }}>
                      <div className="h-full transition-all duration-700"
                        style={{ width: `${lvlProgress}%`, background: AMBER, opacity: 0.3, borderRadius: 2 }} />
                    </div>
                  </div>
                  <p className="text-[9px] mt-2 uppercase tracking-[0.2em]"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>
                    Next: {level.next.name}
                  </p>
                </div>
                <Rule />
              </>
            )}

            {/* 05 — Check-Ins */}
            <div className="py-4">
              <SectionLabel number={level.next ? 5 : 4} label="Check-Ins" theme={theme} />
              <div className="mt-3 mx-auto" style={{ maxWidth: 280 }}>
                {CHECK_INS.map((ci, i) => (
                  <button
                    key={ci.id}
                    onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                    className="w-full text-center flex items-center justify-center py-2.5 transition-opacity active:opacity-50"
                    style={i < CHECK_INS.length - 1 ? { borderBottom: '0.5px solid rgba(201,123,58,0.06)' } : {}}
                  >
                    <span className="text-[9px] tabular-nums w-[20px] shrink-0 text-right mr-2"
                      style={{ color: EDGE_TEXT_COLOR, fontFamily: FONT }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px]"
                      style={{ color: theme?.textSecondary, fontFamily: FONT }}>
                      {ci.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Rule />

            {/* Dev: Level Presets */}
            <div className="py-4 pb-8">
              <SectionLabel label="Preview" theme={theme} />
              <div className="flex gap-1 mt-2 mx-auto" style={{ maxWidth: 300 }}>
                {LEVELS.map((lvl, i) => (
                  <button key={lvl.name} onClick={() => onSeed(i)}
                    className="flex-1 py-2 text-[8px] font-medium uppercase tracking-wider transition-all"
                    style={{
                      background: level.idx === i ? 'rgba(201,123,58,0.1)' : 'transparent',
                      border: `1px solid ${level.idx === i ? 'rgba(201,123,58,0.2)' : 'rgba(201,123,58,0.06)'}`,
                      borderRadius: 8,
                      color: level.idx === i ? BEIGE : (theme?.textMuted),
                      fontFamily: FONT,
                    }}>
                    {lvl.short}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FilmFrame>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FilmStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <FilmGrain />
      <LetterboxBars />

      <FilmFrame>
        <div className="relative z-[2]">
          {/* Title */}
          <div className="pt-5 pb-3 text-center">
            <SectionLabel number={1} label="Progress" theme={theme} />
            <h1 className="text-[36px] font-bold leading-none mt-1 tracking-tight text-center"
              style={{ color: BEIGE, fontFamily: FONT }}>
              Statistics
            </h1>
          </div>

          <div className="px-3">
            <Rule />

            {/* 02 — Brain Map */}
            <div className="py-3">
              <SectionLabel number={2} label="Neural Map" theme={theme} />
              <FilmBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
            </div>

            <Rule />

            {/* 03 — Spider Chart */}
            <div className="py-3">
              <SectionLabel number={3} label="Skill Axes" theme={theme} />
              <FilmSpiderChart practiceCounts={practiceCounts} theme={theme} />
            </div>

            <Rule />

            {/* 04 — Disciplines */}
            <div className="py-4 pb-8">
              <SectionLabel number={4} label="Disciplines" theme={theme} />
              <div className="mt-4 space-y-5 mx-auto" style={{ maxWidth: 300 }}>
                {PHASES.map(phase => (
                  <FilmDisciplineBar
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
        </div>
      </FilmFrame>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAIN SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FilmTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <FilmGrain />
      <LetterboxBars />

      <FilmFrame>
        <div className="relative z-[2]">
          {/* Title */}
          <div className="pt-5 pb-3 text-center">
            <SectionLabel number={1} label="Training" theme={theme} />
            <h1 className="text-[36px] font-bold leading-none mt-1 tracking-tight text-center"
              style={{ color: BEIGE, fontFamily: FONT }}>
              Mental Fitness
            </h1>
          </div>

          <div className="px-3">
            <Rule />

            {/* 02 — Log Session */}
            <div className="py-4 text-center">
              <button
                onClick={() => { haptics.tap(); onLog() }}
                className="py-3 text-[11px] uppercase tracking-[0.25em] font-medium transition-all active:opacity-60 mx-auto"
                style={{
                  color: BEIGE,
                  border: `1px solid rgba(201,123,58,0.2)`,
                  borderRadius: 10,
                  background: 'rgba(201,123,58,0.04)',
                  fontFamily: FONT,
                  width: '100%',
                  maxWidth: 280,
                  display: 'block',
                }}>
                Log Session
              </button>
            </div>

            <Rule />

            {/* 03 — Check-Ins */}
            <div className="py-4">
              <SectionLabel number={3} label="Check-Ins" theme={theme} />
              <div className="mt-3 mx-auto" style={{ maxWidth: 280 }}>
                {CHECK_INS.map((ci, i) => (
                  <button
                    key={ci.id}
                    onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                    className="w-full text-center flex items-center justify-center py-2.5 transition-opacity active:opacity-50"
                    style={i < CHECK_INS.length - 1 ? { borderBottom: '0.5px solid rgba(201,123,58,0.06)' } : {}}
                  >
                    <span className="text-[9px] tabular-nums w-[20px] shrink-0 text-right mr-2"
                      style={{ color: EDGE_TEXT_COLOR, fontFamily: FONT }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px]"
                      style={{ color: theme?.textSecondary, fontFamily: FONT }}>
                      {ci.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Rule />

            {/* 04 — Session History — "credits roll" style */}
            {recent.length > 0 && (
              <div className="py-4 pb-8">
                <SectionLabel number={4} label="Recent" theme={theme} />

                {/* Column headers — centered */}
                <div className="flex items-center mt-3 pb-2 mx-auto"
                  style={{ maxWidth: 300, borderBottom: `1px solid ${RULE_COLOR}` }}>
                  <span className="text-[7px] uppercase tracking-[0.15em] w-[48px] shrink-0 text-center"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>Date</span>
                  <span className="text-[7px] uppercase tracking-[0.15em] flex-1 text-center"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>Practice</span>
                  <span className="text-[7px] uppercase tracking-[0.15em] w-[32px] text-right shrink-0"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>XP</span>
                  <span className="text-[7px] uppercase tracking-[0.15em] w-[28px] text-right shrink-0"
                    style={{ color: theme?.textMuted, fontFamily: FONT }}>Min</span>
                </div>

                <div className="mx-auto" style={{ maxWidth: 300 }}>
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
                      <div key={sess.id} className="flex items-center py-1.5"
                        style={{ borderBottom: '0.5px solid rgba(201,123,58,0.05)' }}>
                        <span className="text-[10px] w-[48px] shrink-0 tabular-nums text-center"
                          style={{ color: theme?.textMuted, fontFamily: FONT }}>{label}</span>
                        <span className="text-[10px] flex-1 min-w-0 truncate text-center"
                          style={{ color: theme?.textSecondary, fontFamily: FONT }}>
                          {practice?.name || sess.practiceId}
                        </span>
                        <span className="text-[9px] tabular-nums w-[32px] text-right shrink-0"
                          style={{ color: theme?.textMuted, fontFamily: FONT }}>
                          +{getSessionXp(sess)}
                        </span>
                        <span className="text-[9px] tabular-nums w-[28px] text-right shrink-0"
                          style={{ color: theme?.textMuted, fontFamily: FONT }}>
                          {sess.durationMin}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </FilmFrame>
    </div>
  )
}
