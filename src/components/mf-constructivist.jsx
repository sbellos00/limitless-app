// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Russian Constructivism — Rodchenko / El Lissitzky / Malevich
// Level 4: Warrior / The Commander
//
// Bold. Angular. Dense. Propaganda poster meets military command dashboard.
//
// Rules:
//   · DIAGONAL BANNER HEADERS: solid accent fill, ALL CAPS, slightly rotated
//   · CORNER BRACKETS: L-shaped marks at container corners — THE framing device
//   · Thick geometric borders (2-3px) everywhere — nothing borderless
//   · 45deg diagonal scan-line texture overlay via repeating-linear-gradient
//   · Bold geometric shapes as layout accents: circles, triangles, heavy bars
//   · 0px border-radius EVERYWHERE — hard, angular, aggressive
//   · Dense spacing (12-16px), information-packed, every pixel has data
//   · Extreme type scale: headers 48-60px (Bebas Neue ALL CAPS), tiny labels 8px
//   · Gold (#c4a46c) and cream (#ddd5c0) on dark brown (#161412)
//   · Grain overlay, high contrast, no softness
//   · Active: scale-[0.97], quick linear transition (no spring)
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

const ACCENT = '#c4a46c'
const ACCENT_DIM = 'rgba(196,164,108,0.18)'
const ACCENT_FAINT = 'rgba(196,164,108,0.08)'
const BORDER_HEAVY = `2px solid ${ACCENT}`
const BORDER_MEDIUM = `2px solid rgba(196,164,108,0.25)`
const BORDER_LIGHT = `1px solid rgba(196,164,108,0.12)`
const SCAN_LINES = `repeating-linear-gradient(
  45deg,
  transparent,
  transparent 3px,
  rgba(196,164,108,0.015) 3px,
  rgba(196,164,108,0.015) 4px
)`
const GRAIN_OVERLAY = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`


// ── Structural Primitives ────────────────────────────────────────────────────

/** Full-width diagonal banner header — THE constructivist header */
function Banner({ children, theme }) {
  return (
    <div
      className="w-full py-2 px-5 relative overflow-hidden"
      style={{
        background: ACCENT,
        transform: 'rotate(-1.5deg) scale(1.04)',
        transformOrigin: 'center',
      }}
    >
      {/* Scan line texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: SCAN_LINES }} />
      <p
        className="text-[11px] font-bold uppercase tracking-[0.35em] relative z-10"
        style={{
          color: '#161412',
          fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
          letterSpacing: '0.35em',
        }}
      >
        {children}
      </p>
    </div>
  )
}

/** Corner brackets — L-shaped marks at container corners */
function CornerBrackets({ size = 10, thickness = 2, color = ACCENT, opacity = 0.35 }) {
  const s = { position: 'absolute', width: size, height: size, opacity }
  const bdr = `${thickness}px solid ${color}`
  return (
    <>
      <span style={{ ...s, top: 0, left: 0, borderTop: bdr, borderLeft: bdr }} />
      <span style={{ ...s, top: 0, right: 0, borderTop: bdr, borderRight: bdr }} />
      <span style={{ ...s, bottom: 0, left: 0, borderBottom: bdr, borderLeft: bdr }} />
      <span style={{ ...s, bottom: 0, right: 0, borderBottom: bdr, borderRight: bdr }} />
    </>
  )
}

/** Heavy horizontal bar divider */
function HeavyBar({ color = ACCENT, opacity = 0.2, height = 3 }) {
  return <div style={{ height, background: color, opacity, width: '100%' }} />
}

/** Section header with thick left accent bar */
function SectionHeader({ number, label, theme }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div style={{ width: 4, height: 16, background: ACCENT, opacity: 0.5 }} />
      {number != null && (
        <span
          className="text-[9px] tabular-nums font-bold"
          style={{
            color: ACCENT,
            fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
            letterSpacing: '0.15em',
            opacity: 0.6,
          }}
        >
          {String(number).padStart(2, '0')}
        </span>
      )}
      <span
        className="text-[10px] uppercase tracking-[0.25em] font-bold"
        style={{
          color: theme?.textMuted || 'rgba(221,213,192,0.28)',
          fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** Card container with corner brackets and thick border */
function CommandCard({ children, className = '', style = {} }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: BORDER_MEDIUM,
        padding: 12,
        background: ACCENT_FAINT,
        ...style,
      }}
    >
      <CornerBrackets />
      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: SCAN_LINES }} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/** Geometric accent shape — decorative circle */
function AccentCircle({ size = 24, style = {} }) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `2px solid ${ACCENT}`,
        opacity: 0.2,
        ...style,
      }}
    />
  )
}

/** Geometric accent shape — right-pointing triangle */
function AccentTriangle({ size = 12, style = {} }) {
  return (
    <div
      style={{
        width: 0, height: 0,
        borderLeft: `${size}px solid ${ACCENT}`,
        borderTop: `${size * 0.6}px solid transparent`,
        borderBottom: `${size * 0.6}px solid transparent`,
        opacity: 0.25,
        ...style,
      }}
    />
  )
}


// ── Constructivist Bell Curve ────────────────────────────────────────────────
// Bold strokes, high contrast, geometric accent shapes

function ConstructivistBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 280, H = 80
  const PAD = { top: 8, right: 0, bottom: 22, left: 0 }
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
      {/* Baseline — heavy */}
      <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
        stroke={ACCENT} strokeWidth="1.5" opacity="0.2" />

      {/* Level ticks — bold */}
      {levelTicks.map(l => (
        <g key={l.name}>
          <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 6}
            stroke={ACCENT} strokeWidth="1" opacity="0.3" />
          <text x={xS(l.z)} y={baseY + 14}
            fill={ACCENT} fontSize="5.5" textAnchor="middle"
            fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.1em" opacity="0.4">
            {l.short}
          </text>
        </g>
      ))}

      {/* Filled area — gold tinted */}
      <path d={fillD} fill={ACCENT} opacity="0.08" />

      {/* Full curve — bold stroke */}
      <path d={fullD} fill="none" stroke={ACCENT} strokeWidth="1.5" opacity="0.15" />

      {/* Filled segment — bright */}
      <path d={filledLineD} fill="none" stroke={ACCENT} strokeWidth="2" opacity="0.55" />

      {/* User marker — bold vertical line */}
      <line x1={userSx} y1={userSy - 4} x2={userSx} y2={baseY}
        stroke={ACCENT} strokeWidth="1.5" opacity="0.4" />

      {/* User position — geometric diamond */}
      <rect
        x={userSx - 3.5} y={userSy - 3.5} width="7" height="7"
        fill={ACCENT} opacity="0.7"
        transform={`rotate(45 ${userSx} ${userSy})`}
      />
    </svg>
  )
}


// ── Constructivist Brain Map ─────────────────────────────────────────────────
// High-contrast dots, thick outline strokes, aggressive

function ConstructivistBrainMap({ phaseStats, practiceCounts, theme }) {
  const gold = ACCENT

  return (
    <div className="flex justify-center py-2">
      <svg width="180" height="150" viewBox="0 0 180 155">
        {/* Hemispheres — thick stroke, no fill */}
        <path d={LEFT_HEMI} fill="none" stroke={gold} strokeWidth="1.8" opacity="0.2" />
        <path d={RIGHT_HEMI} fill="none" stroke={gold} strokeWidth="1.8" opacity="0.2" />

        {/* Fold lines — visible */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={gold} strokeWidth="0.8" opacity="0.08" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={gold} strokeWidth="0.8" opacity="0.08" />
        ))}

        {/* Central fissure — bold */}
        <line x1="90" y1="16" x2="90" y2="126" stroke={gold} strokeWidth="1" opacity="0.06" />

        {/* Practice dots — gold tones, aggressive sizing */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const r = count >= 10 ? 4.5 : count >= 5 ? 3.5 : count >= 3 ? 3 : count >= 1 ? 2.5 : 1.5
            const opacity = count >= 10 ? 0.8 : count >= 5 ? 0.6 : count >= 3 ? 0.35 : count >= 1 ? 0.2 : 0.06
            // Mastered dots get a square marker
            if (count >= 10) {
              return (
                <rect key={practice.id}
                  x={pos.x - r} y={pos.y - r} width={r * 2} height={r * 2}
                  fill={gold} opacity={opacity}
                  transform={`rotate(45 ${pos.x} ${pos.y})`}
                />
              )
            }
            return (
              <circle key={practice.id}
                cx={pos.x} cy={pos.y} r={r}
                fill={gold} opacity={opacity}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}


// ── Constructivist Spider Chart ──────────────────────────────────────────────
// Bold lines (2px+), solid fill at high opacity, aggressive

function ConstructivistSpiderChart({ practiceCounts, theme }) {
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
        {/* Guide polygons — bold, angular */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={ACCENT} strokeWidth="0.8" opacity="0.1" />
          )
        })}

        {/* Axis lines — thick */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={ACCENT} strokeWidth="0.8" opacity="0.1" />
          )
        })}

        {/* Data fill — aggressive, high opacity */}
        <polygon points={dataPoly}
          fill={ACCENT}
          opacity="0.12"
          stroke={ACCENT}
          strokeWidth="2" strokeOpacity="0.55" />

        {/* Dots + labels — BOLD, uppercase */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 18)
          return (
            <g key={axis.name}>
              {/* Square marker */}
              <rect x={pt.x - 2.5} y={pt.y - 2.5} width="5" height="5"
                fill={ACCENT} opacity="0.6" />
              <text x={labelPt.x} y={labelPt.y}
                fill={ACCENT} fontSize="7" textAnchor="middle" dominantBaseline="middle"
                opacity="0.4" fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.12em"
                fontWeight="bold">
                {axis.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ── Constructivist Discipline Bar ────────────────────────────────────────────
// Thick horizontal bars with heavy borders, angular (0px radius)

function ConstructivistDisciplineBar({ phase, practiceCounts, sessions, theme }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div style={{ borderLeft: `4px solid ${ACCENT}`, borderLeftColor: expanded ? ACCENT : 'rgba(196,164,108,0.2)', paddingLeft: 12 }}>
      <motion.button
        className="w-full text-left"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] font-bold uppercase tracking-[0.15em]"
            style={{
              color: theme?.text || '#ddd5c0',
              fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
            }}>
            {phase.name}
          </span>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tabular-nums font-bold"
              style={{ color: ACCENT, opacity: 0.6, fontFamily: theme?.fontBody }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              {totalSessions} SESS
            </span>
            <span className="text-[9px]"
              style={{
                color: ACCENT,
                display: 'inline-block',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.1s linear',
                opacity: 0.5,
              }}>
              &#9660;
            </span>
          </div>
        </div>

        {/* Progress — thick, angular, no radius */}
        <div className="h-[5px] w-full" style={{ background: ACCENT_FAINT, border: `1px solid rgba(196,164,108,0.1)` }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, background: ACCENT, opacity: 0.35 }} />
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
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
                    style={{ borderBottom: `1px solid rgba(196,164,108,0.06)` }}>
                    <span className="text-[10px] flex-1 min-w-0 truncate"
                      style={{
                        color: count > 0 ? (theme?.textSecondary || 'rgba(221,213,192,0.55)') : (theme?.textMuted || 'rgba(221,213,192,0.28)'),
                        fontFamily: theme?.fontBody,
                        opacity: count > 0 ? 1 : 0.5,
                      }}>
                      {practice.name}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right font-bold"
                      style={{ color: ACCENT, fontFamily: theme?.fontBody, opacity: count > 0 ? 0.6 : 0.2 }}>
                      {count > 0 ? `${count}x` : '--'}
                    </span>
                    <span className="text-[9px] tabular-nums w-[32px] text-right"
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
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ConstructivistHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar relative">
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ backgroundImage: GRAIN_OVERLAY, backgroundSize: '150px' }} />

      {/* ── BANNER: Level Identity ── */}
      <div className="pt-3">
        <Banner theme={theme}>
          MENTAL FITNESS // LEVEL {level.idx + 1}
        </Banner>
      </div>

      {/* Level Name — HUGE, commanding */}
      <div className="px-5 pt-4 pb-2">
        <h1
          className="leading-none uppercase"
          style={{
            color: theme?.text || '#ddd5c0',
            fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
            fontSize: '56px',
            letterSpacing: '0.04em',
          }}
        >
          {level.name}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <AccentTriangle size={8} />
          <span className="text-[9px] uppercase tracking-[0.3em]"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontHeader }}>
            THE COMMANDER BEFORE BATTLE
          </span>
        </div>
      </div>

      {/* Character image — full-width, thick borders top/bottom */}
      {charImage && (
        <div
          className="relative"
          style={{
            borderTop: BORDER_HEAVY,
            borderBottom: BORDER_HEAVY,
          }}
        >
          <img src={charImage} alt=""
            className="w-full object-cover block"
            style={{ maxHeight: '260px' }}
          />
          {/* Scan line overlay on image */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: SCAN_LINES }} />
        </div>
      )}

      <div className="px-4 pt-3">

        {/* ── Stats Grid — heavy-bordered 2x2 ── */}
        <div className="grid grid-cols-2 gap-0" style={{ border: BORDER_MEDIUM }}>
          {[
            { value: totalXp.toLocaleString(), label: 'TOTAL XP' },
            { value: sessions.length, label: 'SESSIONS' },
            { value: streak > 0 ? `${streak}D` : '--', label: 'STREAK' },
            { value: `${uniquePractices}/${TOTAL_PRACTICES}`, label: 'TRIED' },
          ].map((d, i) => (
            <div key={d.label}
              className="py-3 px-3 text-center"
              style={{
                borderRight: i % 2 === 0 ? `1px solid rgba(196,164,108,0.15)` : 'none',
                borderBottom: i < 2 ? `1px solid rgba(196,164,108,0.15)` : 'none',
                background: ACCENT_FAINT,
              }}
            >
              <p className="tabular-nums leading-none"
                style={{
                  color: theme?.text || '#ddd5c0',
                  fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                  fontSize: '26px',
                }}>
                {d.value}
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] mt-1.5 font-bold"
                style={{
                  color: ACCENT,
                  fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                  opacity: 0.5,
                }}>
                {d.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Distribution ── */}
        <div className="mt-3">
          <HeavyBar />
        </div>

        <div className="py-3">
          <SectionHeader number={2} label="DISTRIBUTION" theme={theme} />
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[8px] uppercase tracking-[0.2em]"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontHeader }}>
              PERCENTILE RANK
            </span>
            <span
              className="tabular-nums"
              style={{
                color: ACCENT,
                fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                fontSize: '28px',
                lineHeight: 1,
              }}
            >
              {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
            </span>
          </div>
          <CommandCard>
            <ConstructivistBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
          </CommandCard>
        </div>

        {/* ── Progress to Next Level ── */}
        {level.next && (
          <>
            <HeavyBar />
            <div className="py-3">
              <SectionHeader number={3} label="PROGRESS" theme={theme} />
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[9px] uppercase tracking-[0.15em] font-bold"
                  style={{ color: theme?.textMuted, fontFamily: theme?.fontHeader }}>
                  NEXT: {level.next.name.toUpperCase()}
                </span>
                <span className="text-[10px] tabular-nums font-bold"
                  style={{ color: ACCENT, fontFamily: theme?.fontBody, opacity: 0.7 }}>
                  {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} XP
                </span>
              </div>
              {/* Progress bar — thick, angular, no radius */}
              <div className="h-[6px] w-full" style={{ background: ACCENT_FAINT, border: `1px solid rgba(196,164,108,0.12)` }}>
                <div className="h-full transition-all duration-700"
                  style={{ width: `${lvlProgress}%`, background: ACCENT, opacity: 0.5 }} />
              </div>
            </div>
          </>
        )}

        {/* ── Check-Ins — numbered stack with thick left border ── */}
        <HeavyBar />
        <div className="py-3">
          <SectionHeader number={level.next ? 4 : 3} label="CHECK-INS" theme={theme} />
          <div style={{ borderLeft: `4px solid rgba(196,164,108,0.3)` }}>
            {CHECK_INS.map((ci, i) => (
              <motion.button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-center py-2.5 pl-3"
                style={{
                  borderBottom: i < CHECK_INS.length - 1 ? `1px solid rgba(196,164,108,0.08)` : 'none',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08 }}
              >
                <span className="text-[10px] tabular-nums w-[20px] shrink-0 font-bold"
                  style={{
                    color: ACCENT,
                    fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                    opacity: 0.4,
                  }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[12px] uppercase tracking-[0.05em]"
                  style={{
                    color: theme?.textSecondary || 'rgba(221,213,192,0.55)',
                    fontFamily: theme?.fontBody,
                  }}>
                  {ci.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Level Presets (Dev) ── */}
        <HeavyBar />
        <div className="py-3 pb-6">
          <SectionHeader label="PREVIEW" theme={theme} />
          <div className="flex gap-0" style={{ border: BORDER_MEDIUM }}>
            {LEVELS.map((lvl, i) => (
              <motion.button key={lvl.name} onClick={() => onSeed(i)}
                className="flex-1 py-2.5 text-[8px] font-bold uppercase tracking-wider"
                style={{
                  background: level.idx === i ? ACCENT_DIM : 'transparent',
                  borderRight: i < LEVELS.length - 1 ? `1px solid rgba(196,164,108,0.12)` : 'none',
                  color: level.idx === i ? (theme?.text || '#ddd5c0') : (theme?.textMuted || 'rgba(221,213,192,0.28)'),
                  fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08 }}
              >
                {lvl.short}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ConstructivistStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ backgroundImage: GRAIN_OVERLAY, backgroundSize: '150px' }} />

      {/* Banner header */}
      <div className="pt-3">
        <Banner theme={theme}>INTELLIGENCE REPORT</Banner>
      </div>

      <div className="px-5 pt-4 pb-2">
        <h1
          className="leading-none uppercase"
          style={{
            color: theme?.text || '#ddd5c0',
            fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
            fontSize: '48px',
            letterSpacing: '0.04em',
          }}
        >
          STATISTICS
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <AccentCircle size={10} style={{ opacity: 0.3 }} />
          <span className="text-[8px] uppercase tracking-[0.3em]"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontHeader }}>
            {totalXp.toLocaleString()} XP TOTAL // STREAK {streak > 0 ? `${streak}D` : '--'}
          </span>
        </div>
      </div>

      <div className="px-4 pt-1">

        {/* ── Neural Map ── */}
        <HeavyBar />
        <div className="py-3">
          <SectionHeader number={1} label="NEURAL MAP" theme={theme} />
          <CommandCard>
            <ConstructivistBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
          </CommandCard>
        </div>

        {/* ── Spider Chart ── */}
        <HeavyBar />
        <div className="py-3">
          <SectionHeader number={2} label="SKILL AXES" theme={theme} />
          <CommandCard>
            <ConstructivistSpiderChart practiceCounts={practiceCounts} theme={theme} />
          </CommandCard>
        </div>

        {/* ── Disciplines ── */}
        <HeavyBar />
        <div className="py-3 pb-6">
          <SectionHeader number={3} label="DISCIPLINES" theme={theme} />
          <div className="mt-3 space-y-4">
            {PHASES.map(phase => (
              <ConstructivistDisciplineBar
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
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAIN SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ConstructivistTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ backgroundImage: GRAIN_OVERLAY, backgroundSize: '150px' }} />

      {/* Banner header */}
      <div className="pt-3">
        <Banner theme={theme}>TRAINING PROTOCOL</Banner>
      </div>

      <div className="px-5 pt-4 pb-2">
        <h1
          className="leading-none uppercase"
          style={{
            color: theme?.text || '#ddd5c0',
            fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
            fontSize: '48px',
            letterSpacing: '0.04em',
          }}
        >
          MENTAL FITNESS
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <AccentTriangle size={6} />
          <span className="text-[8px] uppercase tracking-[0.3em]"
            style={{ color: theme?.textMuted, fontFamily: theme?.fontHeader }}>
            LEVEL {level.idx + 1} // {level.name.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-4 pt-1">

        {/* ── Log Session Button — commanding, angular ── */}
        <HeavyBar />
        <div className="py-3">
          <motion.button
            onClick={() => { haptics.tap(); onLog() }}
            className="w-full py-4 uppercase tracking-[0.35em] font-bold relative overflow-hidden"
            style={{
              color: '#161412',
              background: ACCENT,
              border: 'none',
              fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
              fontSize: '14px',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08 }}
          >
            {/* Scan lines on button */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: SCAN_LINES }} />
            <span className="relative z-10">LOG SESSION</span>
          </motion.button>
        </div>

        {/* ── Check-Ins ── */}
        <HeavyBar />
        <div className="py-3">
          <SectionHeader number={2} label="CHECK-INS" theme={theme} />
          <div style={{ borderLeft: `4px solid rgba(196,164,108,0.3)` }}>
            {CHECK_INS.map((ci, i) => (
              <motion.button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-center py-2.5 pl-3"
                style={{
                  borderBottom: i < CHECK_INS.length - 1 ? `1px solid rgba(196,164,108,0.08)` : 'none',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08 }}
              >
                <span className="text-[10px] tabular-nums w-[20px] shrink-0 font-bold"
                  style={{
                    color: ACCENT,
                    fontFamily: theme?.fontHeader || "'Bebas Neue', sans-serif",
                    opacity: 0.4,
                  }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[12px] uppercase tracking-[0.05em]"
                  style={{
                    color: theme?.textSecondary || 'rgba(221,213,192,0.55)',
                    fontFamily: theme?.fontBody,
                  }}>
                  {ci.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Session History — dense tabular data ── */}
        <HeavyBar />
        <div className="py-3 pb-6">
          <SectionHeader number={3} label="RECENT OPERATIONS" theme={theme} />
          {recent.length === 0 ? (
            <p className="text-[11px] uppercase tracking-[0.15em] mt-2 font-bold" style={{ color: ACCENT, opacity: 0.4, fontFamily: theme?.fontHeader }}>NO OPERATIONS LOGGED</p>
          ) : (
            <>

              {/* Column header bar — solid accent fill */}
              <div
                className="flex items-center py-1.5 px-2"
                style={{ background: ACCENT_DIM }}
              >
                <span className="text-[9px] uppercase tracking-[0.15em] w-[52px] shrink-0 font-bold"
                  style={{ color: '#161412', fontFamily: theme?.fontHeader, opacity: 0.7 }}>DATE</span>
                <span className="text-[9px] uppercase tracking-[0.15em] flex-1 font-bold"
                  style={{ color: '#161412', fontFamily: theme?.fontHeader, opacity: 0.7 }}>PRACTICE</span>
                <span className="text-[9px] uppercase tracking-[0.15em] w-[36px] text-right shrink-0 font-bold"
                  style={{ color: '#161412', fontFamily: theme?.fontHeader, opacity: 0.7 }}>XP</span>
                <span className="text-[9px] uppercase tracking-[0.15em] w-[30px] text-right shrink-0 font-bold"
                  style={{ color: '#161412', fontFamily: theme?.fontHeader, opacity: 0.7 }}>MIN</span>
              </div>

              {/* Data rows */}
              {recent.map((sess, rowIdx) => {
                const practice = PHASES.flatMap(p => p.practices).find(p => p.id === sess.practiceId)
                const date = new Date(sess.timestamp)
                const today = getDateKey(new Date())
                const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
                const sessDay = getDateKey(date)
                const label = sessDay === today ? 'TODAY'
                  : sessDay === getDateKey(ydDate) ? 'YDAY'
                  : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

                return (
                  <div key={sess.id} className="flex items-center py-1.5 px-2"
                    style={{
                      borderBottom: `1px solid rgba(196,164,108,0.08)`,
                      background: rowIdx % 2 === 0 ? 'transparent' : ACCENT_FAINT,
                    }}>
                    <span className="text-[10px] w-[52px] shrink-0 tabular-nums font-bold"
                      style={{ color: ACCENT, fontFamily: theme?.fontBody, opacity: 0.5 }}>{label}</span>
                    <span className="text-[10px] flex-1 min-w-0 truncate uppercase"
                      style={{ color: theme?.textSecondary || 'rgba(221,213,192,0.55)', fontFamily: theme?.fontBody }}>
                      {practice?.name || sess.practiceId}
                    </span>
                    <span className="text-[9px] tabular-nums w-[36px] text-right shrink-0 font-bold"
                      style={{ color: ACCENT, fontFamily: theme?.fontBody, opacity: 0.6 }}>
                      +{getSessionXp(sess)}
                    </span>
                    <span className="text-[9px] tabular-nums w-[30px] text-right shrink-0"
                      style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                      {sess.durationMin}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
