// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Editorial Luxury — Kinfolk / Monocle / Cereal Magazine
// Level 7: Ascended / The Knight
//
// High-craft print design translated to screen. Serif/sans-serif interplay.
// Double-line rules. Pull-quote typography. Drop caps. Corner ornaments.
// Canvas grain. Warm cream on dark brown. Curated, never cluttered.
//
// References:
//   · Kinfolk magazine layouts
//   · Monocle's information hierarchy
//   · Cereal's negative space and type scale
//   · Classical editorial conventions: double rules, drop caps, pull-quotes
//
// Rules:
//   · Double-line rules (two 0.5px lines, 3-4px gap) as primary dividers
//   · Playfair Display italic for pull-quote level names
//   · Drop cap / oversized initial letter on section titles
//   · Thin-line corner ornaments (L-shaped or diamond marks)
//   · Canvas grain texture overlay
//   · Serif headers (Playfair Display) + sans-serif body (system-ui)
//   · 10px border-radius on cards, 6px on small elements
//   · Warm palette: #e8e0d0 text, #a09a90 accent, #141311 bg
//   · Generous line-height (1.6+), comfortable reading
//   · Smooth dignified transitions (0.25-0.35s ease)
//   · Asymmetric stat layouts: large serif left, small sans right
//   · Session history formatted like a magazine table of contents
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

const CREAM = '#e8e0d0'
const CREAM_60 = 'rgba(232,224,208,0.60)'
const CREAM_30 = 'rgba(232,224,208,0.30)'
const CREAM_15 = 'rgba(232,224,208,0.15)'
const CREAM_08 = 'rgba(232,224,208,0.08)'
const CREAM_04 = 'rgba(232,224,208,0.04)'
const WARM_ACCENT = '#a09a90'
const SERIF = "'Playfair Display', 'Georgia', serif"
const SANS = "system-ui, sans-serif"

const TRANSITION = { duration: 0.3, ease: 'easeInOut' }


// ── Structural Primitives ────────────────────────────────────────────────────

/** Signature double-line rule: two 0.5px lines separated by 3px */
function DoubleRule() {
  return (
    <div className="w-full" style={{ padding: '0' }}>
      <div style={{ borderTop: `0.5px solid ${CREAM_08}` }} />
      <div style={{ height: '3px' }} />
      <div style={{ borderTop: `0.5px solid ${CREAM_08}` }} />
    </div>
  )
}

/** Thin-line L-shaped corner ornaments at card corners */
function CornerOrnaments({ size = 12, color = CREAM_15 }) {
  const style = { position: 'absolute', pointerEvents: 'none' }
  const line = { stroke: color, strokeWidth: 0.5, fill: 'none' }
  const mkCorner = (cls, d) => (
    <svg className={`absolute ${cls}`} width={size} height={size} style={style}>
      <path d={d} {...line} />
    </svg>
  )
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {mkCorner('top-2 left-2', `M0,${size * 0.6} L0,0 L${size * 0.6},0`)}
      {mkCorner('top-2 right-2', `M${size * 0.4},0 L${size},0 L${size},${size * 0.6}`)}
      {mkCorner('bottom-2 left-2', `M0,${size * 0.4} L0,${size} L${size * 0.6},${size}`)}
      {mkCorner('bottom-2 right-2', `M${size * 0.4},${size} L${size},${size} L${size},${size * 0.4}`)}
    </div>
  )
}

/** Small diamond ornament for inline decoration */
function DiamondMark({ color = CREAM_15, size = 5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className="inline-block mx-2" style={{ verticalAlign: 'middle' }}>
      <path d="M5,0 L10,5 L5,10 L0,5 Z" fill={color} />
    </svg>
  )
}

/** Canvas grain overlay — subtle, referencing high-quality print paper */
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'overlay',
        opacity: 0.5,
      }}
    />
  )
}

/** Section label with drop-cap initial and small-caps rest */
function SectionTitle({ children, number }) {
  const text = String(children)
  const initial = text[0]
  const rest = text.slice(1)

  return (
    <div className="flex items-baseline gap-3">
      {number != null && (
        <span className="text-[9px] tabular-nums" style={{
          color: CREAM_15,
          fontFamily: SANS,
          letterSpacing: '0.1em',
        }}>
          {String(number).padStart(2, '0')}
        </span>
      )}
      <div className="flex items-baseline">
        <span style={{
          fontFamily: SERIF,
          fontSize: '24px',
          lineHeight: 1,
          color: CREAM,
          fontWeight: 400,
        }}>
          {initial}
        </span>
        <span style={{
          fontFamily: SANS,
          fontSize: '9px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: CREAM_30,
          marginLeft: '2px',
        }}>
          {rest}
        </span>
      </div>
    </div>
  )
}

/** Pull-quote: large italic serif — the signature editorial element */
function PullQuote({ children, caption }) {
  return (
    <div style={{ lineHeight: 1.1 }}>
      <h1 style={{
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: '40px',
        fontWeight: 400,
        color: CREAM,
        letterSpacing: '-0.01em',
      }}>
        {children}
      </h1>
      {caption && (
        <p className="mt-2" style={{
          fontFamily: SANS,
          fontSize: '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: CREAM_30,
        }}>
          {caption}
        </p>
      )}
    </div>
  )
}

/** Asymmetric stat: large serif number left, small sans label right */
function AsymStat({ value, label, divider = true }) {
  return (
    <div className="flex items-baseline gap-3" style={divider ? { borderLeft: `0.5px solid ${CREAM_08}`, paddingLeft: '12px' } : {}}>
      <span style={{
        fontFamily: SERIF,
        fontSize: '28px',
        fontWeight: 400,
        color: CREAM,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: SANS,
        fontSize: '9px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: CREAM_30,
      }}>
        {label}
      </span>
    </div>
  )
}


// ── Editorial Bell Curve ─────────────────────────────────────────────────────
// Classical line art: thin precise lines, ornamental tick marks, serif labels

function EditorialBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 280, H = 86
  const PAD = { top: 10, right: 4, bottom: 24, left: 4 }
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
      {/* Baseline — double line */}
      <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
        stroke={CREAM_08} strokeWidth="0.5" />
      <line x1={PAD.left} y1={baseY + 3} x2={W - PAD.right} y2={baseY + 3}
        stroke={CREAM_08} strokeWidth="0.5" />

      {/* Ornamental tick marks at level boundaries — serif labels */}
      {levelTicks.map(l => (
        <g key={l.name}>
          <line x1={xS(l.z)} y1={baseY - 2} x2={xS(l.z)} y2={baseY + 6}
            stroke={CREAM_15} strokeWidth="0.5" />
          <text x={xS(l.z)} y={baseY + 16}
            fill={CREAM_15} fontSize="5" textAnchor="middle"
            fontFamily={SERIF} letterSpacing="0.02em" fontStyle="italic">
            {l.short}
          </text>
        </g>
      ))}

      {/* Filled area — warm, subtle */}
      <path d={fillD} fill={CREAM_04} />

      {/* Full curve — thin classical line */}
      <path d={fullD} fill="none" stroke={CREAM_08} strokeWidth="0.75" />

      {/* Filled segment line — warm cream */}
      <path d={filledLineD} fill="none" stroke={CREAM_30} strokeWidth="1" />

      {/* User drop line — fine vertical */}
      <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
        stroke={CREAM_15} strokeWidth="0.5" strokeDasharray="2,2" />

      {/* User marker — small diamond instead of circle */}
      <path
        d={`M${userSx},${userSy - 3} L${userSx + 3},${userSy} L${userSx},${userSy + 3} L${userSx - 3},${userSy} Z`}
        fill={CREAM} opacity="0.5"
      />
    </svg>
  )
}


// ── Editorial Brain Map ──────────────────────────────────────────────────────
// Fine strokes, subtle fills, classical color palette

function EditorialBrainMap({ phaseStats, practiceCounts, theme }) {
  return (
    <div className="flex justify-center py-3">
      <svg width="180" height="150" viewBox="0 0 180 155">
        {/* Hemispheres — fine elegant strokes */}
        <path d={LEFT_HEMI} fill={CREAM_04} stroke={CREAM_08} strokeWidth="0.6" />
        <path d={RIGHT_HEMI} fill={CREAM_04} stroke={CREAM_08} strokeWidth="0.6" />

        {/* Fold lines — barely there */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={CREAM_04} strokeWidth="0.4" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={CREAM_04} strokeWidth="0.4" />
        ))}

        {/* Central fissure — fine dashed line */}
        <line x1="90" y1="16" x2="90" y2="126"
          stroke={CREAM_04} strokeWidth="0.4" strokeDasharray="3,3" />

        {/* Practice dots — warm cream, opacity = mastery */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const r = count >= 10 ? 3.5 : count >= 5 ? 3 : count >= 3 ? 2.5 : count >= 1 ? 2 : 1.5
            const opacity = count >= 10 ? 0.55 : count >= 5 ? 0.4 : count >= 3 ? 0.25 : count >= 1 ? 0.15 : 0.04
            return (
              <circle key={practice.id}
                cx={pos.x} cy={pos.y} r={r}
                fill={CREAM} opacity={opacity}
              />
            )
          })
        )}

        {/* Hemisphere labels — serif italic */}
        <text x="55" y="148" fill={CREAM_15} fontSize="6"
          fontFamily={SERIF} fontStyle="italic" textAnchor="middle">
          L
        </text>
        <text x="125" y="148" fill={CREAM_15} fontSize="6"
          fontFamily={SERIF} fontStyle="italic" textAnchor="middle">
          R
        </text>
      </svg>
    </div>
  )
}


// ── Editorial Spider Chart ───────────────────────────────────────────────────
// Thin elegant lines, serif labels, classical proportions

function EditorialSpiderChart({ practiceCounts, theme }) {
  const size = 230
  const cx = size / 2, cy = size / 2
  const R = 70
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
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 240 }}>
        {/* Guide polygons — fine dashed lines */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={CREAM_04} strokeWidth="0.5"
              strokeDasharray={g < 1 ? '2,3' : 'none'} />
          )
        })}

        {/* Axis lines — fine */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={CREAM_04} strokeWidth="0.5" />
          )
        })}

        {/* Data fill — warm translucent */}
        <polygon points={dataPoly}
          fill={CREAM_04}
          stroke={CREAM_30}
          strokeWidth="0.8" />

        {/* Dots — small diamonds + serif italic labels */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 18)
          return (
            <g key={axis.name}>
              <path
                d={`M${pt.x},${pt.y - 2} L${pt.x + 2},${pt.y} L${pt.x},${pt.y + 2} L${pt.x - 2},${pt.y} Z`}
                fill={CREAM} opacity="0.35"
              />
              <text x={labelPt.x} y={labelPt.y}
                fill={CREAM} fontSize="6.5" textAnchor="middle" dominantBaseline="middle"
                opacity="0.2" fontFamily={SERIF} fontStyle="italic" letterSpacing="0.02em">
                {axis.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ── Editorial Discipline Bar ─────────────────────────────────────────────────
// Slender, elegant bars. Expanding reveals formatted like magazine footnotes.

function EditorialDisciplineBar({ phase, practiceCounts, sessions, theme }) {
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
          <span style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: '14px',
            color: CREAM,
            opacity: 0.7,
          }}>
            {phase.name}
          </span>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tabular-nums" style={{ color: CREAM_30, fontFamily: SANS }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums" style={{ color: CREAM_30, fontFamily: SANS }}>
              {totalSessions} sess
            </span>
            <span className="text-[9px]" style={{
              color: CREAM_30,
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}>
              &#9662;
            </span>
          </div>
        </div>

        {/* Progress bar — slender, rounded editorial */}
        <div className="w-full" style={{
          height: '2px',
          background: CREAM_04,
          borderRadius: '1px',
        }}>
          <div className="h-full transition-all" style={{
            width: `${pct}%`,
            background: CREAM,
            opacity: 0.2,
            borderRadius: '1px',
            transitionDuration: '0.7s',
          }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Footnote-style expanded content */}
            <div className="pt-3 pb-2" style={{ paddingLeft: '12px', borderLeft: `0.5px solid ${CREAM_08}` }}>
              {phase.practices.map((practice, idx) => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                return (
                  <div key={practice.id} className="flex items-baseline py-3"
                    style={idx < phase.practices.length - 1 ? { borderBottom: `0.5px solid ${CREAM_04}` } : {}}>
                    <span className="text-[8px] tabular-nums w-[16px] shrink-0" style={{
                      color: CREAM_15,
                      fontFamily: SANS,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 min-w-0 truncate" style={{
                      fontFamily: count > 0 ? SERIF : SANS,
                      fontStyle: count > 0 ? 'italic' : 'normal',
                      fontSize: '11px',
                      color: count > 0 ? CREAM_60 : CREAM_30,
                      opacity: count > 0 ? 1 : 0.6,
                    }}>
                      {practice.name}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right shrink-0"
                      style={{ color: CREAM_30, fontFamily: SANS }}>
                      {count > 0 ? `${count}\u00d7` : '\u2014'}
                    </span>
                    <span className="text-[9px] tabular-nums w-[32px] text-right shrink-0"
                      style={{ color: CREAM_30, fontFamily: SANS, opacity: count > 0 ? 1 : 0.3 }}>
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

export function EditorialHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
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
      <GrainOverlay />
      <CornerOrnaments />

      {/* 01 — Level Identity: Pull-Quote */}
      <div className="px-6 pt-8 pb-2">
        <p style={{
          fontFamily: SANS,
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: CREAM_30,
          marginBottom: '6px',
        }}>
          Level {level.idx + 1}
        </p>
        <PullQuote caption={`The ${level.name}`}>
          {level.name}
        </PullQuote>
      </div>

      {/* Character — editorial cropping with thin border and caption */}
      {charImage && (
        <div className="mx-6 mt-4 mb-2 relative">
          <div style={{
            border: `1px solid ${CREAM_08}`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <img src={charImage} alt=""
              className="w-full object-cover block"
              style={{ maxHeight: '260px' }}
            />
          </div>
          <p className="mt-2 text-right" style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: '10px',
            color: CREAM_15,
            letterSpacing: '0.02em',
          }}>
            Level {level.idx + 1 < 10 ? ['I','II','III','IV','V','VI','VII','VIII'][level.idx] : level.idx + 1}
            {' \u00b7 '}
            The {level.name}
          </p>
        </div>
      )}

      <div className="px-6">
        <div className="mt-4"><DoubleRule /></div>

        {/* 02 — Asymmetric Stats */}
        <div className="py-6">
          <SectionTitle number={2}>Overview</SectionTitle>
          <div className="mt-4 flex flex-wrap gap-y-4">
            <div className="w-1/2">
              <AsymStat value={totalXp.toLocaleString()} label="XP" divider={false} />
            </div>
            <div className="w-1/2">
              <AsymStat value={sessions.length} label="Sessions" />
            </div>
            <div className="w-1/2">
              <AsymStat value={streak > 0 ? `${streak}d` : '\u2014'} label="Streak" divider={false} />
            </div>
            <div className="w-1/2">
              <AsymStat value={uniquePractices} label="Tried" />
            </div>
          </div>
        </div>

        <DoubleRule />

        {/* 03 — Distribution */}
        <div className="py-6">
          <div className="flex items-baseline justify-between">
            <SectionTitle number={3}>Distribution</SectionTitle>
            <div className="flex items-baseline gap-2">
              <span style={{
                fontFamily: SERIF,
                fontSize: '22px',
                color: CREAM,
                fontWeight: 400,
              }}>
                {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
              </span>
              <span style={{
                fontFamily: SANS,
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: CREAM_30,
              }}>
                Percentile
              </span>
            </div>
          </div>
          <div className="mt-4">
            <EditorialBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
          </div>
        </div>

        <DoubleRule />

        {/* 04 — Progress to Next */}
        {level.next && (
          <>
            <div className="py-6">
              <div className="flex items-baseline justify-between mb-4">
                <SectionTitle number={4}>Progress</SectionTitle>
                <span className="text-[10px] tabular-nums" style={{ color: CREAM_30, fontFamily: SANS }}>
                  {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} xp
                </span>
              </div>
              {/* Progress bar — elegant, warm */}
              <div className="w-full" style={{
                height: '3px',
                background: CREAM_04,
                borderRadius: '1.5px',
              }}>
                <div className="h-full transition-all" style={{
                  width: `${lvlProgress}%`,
                  background: CREAM,
                  opacity: 0.2,
                  borderRadius: '1.5px',
                  transitionDuration: '0.7s',
                }} />
              </div>
              <p className="mt-3" style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: '12px',
                color: CREAM_30,
              }}>
                Next: {level.next.name}
              </p>
            </div>
            <DoubleRule />
          </>
        )}

        {/* 05 — Check-Ins */}
        <div className="py-6">
          <SectionTitle number={level.next ? 5 : 4}>Check-Ins</SectionTitle>
          <div className="mt-4">
            {CHECK_INS.map((ci, i) => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-baseline py-3 transition-opacity active:opacity-50"
                style={i < CHECK_INS.length - 1 ? { borderBottom: `0.5px solid ${CREAM_04}` } : {}}
              >
                <span className="text-[9px] tabular-nums w-[24px] shrink-0" style={{
                  color: CREAM_15,
                  fontFamily: SANS,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: CREAM_60,
                  lineHeight: 1.5,
                }}>
                  {ci.label}
                </span>
              </button>
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

export function EditorialStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <GrainOverlay />
      <CornerOrnaments />

      <div className="px-6 pt-8">
        <p style={{
          fontFamily: SANS,
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: CREAM_30,
          marginBottom: '6px',
        }}>
          Mental Fitness
        </p>
        <PullQuote>Statistics</PullQuote>
      </div>

      <div className="px-6">
        <div className="mt-5"><DoubleRule /></div>

        {/* 02 — Brain Map */}
        <div className="py-5">
          <SectionTitle number={2}>Neural Map</SectionTitle>
          <EditorialBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
        </div>

        <DoubleRule />

        {/* 03 — Spider Chart */}
        <div className="py-5">
          <SectionTitle number={3}>Skill Axes</SectionTitle>
          <EditorialSpiderChart practiceCounts={practiceCounts} theme={theme} />
        </div>

        <DoubleRule />

        {/* 04 — Disciplines */}
        <div className="py-5 pb-8">
          <SectionTitle number={4}>Disciplines</SectionTitle>
          <div className="mt-5 space-y-6">
            {PHASES.map((phase, i) => (
              <div key={phase.id}>
                <EditorialDisciplineBar
                  phase={phase}
                  practiceCounts={practiceCounts}
                  sessions={sessions}
                  theme={theme}
                />
                {i < PHASES.length - 1 && (
                  <div className="mt-5 flex items-center justify-center">
                    <DiamondMark color={CREAM_08} size={4} />
                  </div>
                )}
              </div>
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

export function EditorialTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <GrainOverlay />
      <CornerOrnaments />

      <div className="px-6 pt-8">
        <p style={{
          fontFamily: SANS,
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: CREAM_30,
          marginBottom: '6px',
        }}>
          Training
        </p>
        <PullQuote>Mental Fitness</PullQuote>
      </div>

      <div className="px-6">
        <div className="mt-5"><DoubleRule /></div>

        {/* 02 — Log Session */}
        <div className="py-6">
          <button
            onClick={() => { haptics.tap(); onLog() }}
            className="w-full py-4 transition-all active:opacity-60"
            style={{
              color: CREAM,
              border: `0.5px solid ${CREAM_15}`,
              background: 'transparent',
              borderRadius: '10px',
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: '14px',
              letterSpacing: '0.03em',
            }}>
            Log Session
          </button>
        </div>

        <DoubleRule />

        {/* 03 — Check-Ins */}
        <div className="py-6">
          <SectionTitle number={3}>Check-Ins</SectionTitle>
          <div className="mt-4">
            {CHECK_INS.map((ci, i) => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-baseline py-3 transition-opacity active:opacity-50"
                style={i < CHECK_INS.length - 1 ? { borderBottom: `0.5px solid ${CREAM_04}` } : {}}
              >
                <span className="text-[9px] tabular-nums w-[24px] shrink-0" style={{
                  color: CREAM_15,
                  fontFamily: SANS,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: CREAM_60,
                  lineHeight: 1.5,
                }}>
                  {ci.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <DoubleRule />

        {/* 04 — Session History — magazine table of contents style */}
        <div className="py-6 pb-8">
          <SectionTitle number={4}>Recent Sessions</SectionTitle>
          {recent.length === 0 ? (
            <p className="mt-4" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(232,224,208,0.3)' }}>No sessions recorded</p>
          ) : (
            <>
            {/* TOC-style column headers */}
            <div className="flex items-baseline mt-4 pb-2">
              <span className="w-[52px] shrink-0" style={{
                fontFamily: SANS,
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: CREAM_15,
              }}>Date</span>
              <span className="flex-1" style={{
                fontFamily: SANS,
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: CREAM_15,
              }}>Practice</span>
              <span className="w-[36px] text-right shrink-0" style={{
                fontFamily: SANS,
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: CREAM_15,
              }}>XP</span>
              <span className="w-[30px] text-right shrink-0" style={{
                fontFamily: SANS,
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: CREAM_15,
              }}>Min</span>
            </div>

            {/* Double rule under headers */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ borderTop: `0.5px solid ${CREAM_08}` }} />
              <div style={{ height: '2px' }} />
              <div style={{ borderTop: `0.5px solid ${CREAM_08}` }} />
            </div>

            {recent.map(sess => {
              const practice = PHASES.flatMap(p => p.practices).find(p => p.id === sess.practiceId)
              const date = new Date(sess.timestamp)
              const today = getDateKey(new Date())
              const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
              const sessDay = getDateKey(date)
              const label = sessDay === today ? 'Today'
                : sessDay === getDateKey(ydDate) ? 'Yday'
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div key={sess.id} className="flex items-baseline py-2"
                  style={{ borderBottom: `0.5px solid ${CREAM_04}` }}>
                  <span className="w-[52px] shrink-0 tabular-nums" style={{
                    fontFamily: SANS,
                    fontSize: '10px',
                    color: CREAM_30,
                  }}>{label}</span>
                  <span className="flex-1 min-w-0 truncate" style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontSize: '11px',
                    color: CREAM_60,
                  }}>
                    {practice?.name || sess.practiceId}
                  </span>
                  <span className="tabular-nums w-[36px] text-right shrink-0" style={{
                    fontFamily: SANS,
                    fontSize: '9px',
                    color: CREAM_30,
                  }}>
                    +{getSessionXp(sess)}
                  </span>
                  <span className="tabular-nums w-[30px] text-right shrink-0" style={{
                    fontFamily: SANS,
                    fontSize: '9px',
                    color: CREAM_30,
                  }}>
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
