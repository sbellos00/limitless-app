// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Swiss Functionalism — International Typographic Style
// Level 5: Master / The Mountaineer
//
// Zürich school. Grid-based. Flush-left. Monochrome. No ornament.
// Josef Müller-Brockmann. Max Bill. Armin Hofmann.
//
// Rules:
//   · Strict modular grid, 24px horizontal margins, 8px vertical rhythm
//   · No border-radius — everything rectangular
//   · No shadows, no glow, no blur — flat
//   · Monochrome with opacity for hierarchy — no color decoration
//   · Extreme type scale contrast (40px ↔ 8px)
//   · Horizontal rules as primary structural element
//   · Section numbering (01, 02, 03…) in margin
//   · Registration/crop marks referencing print production
//   · Flush-left alignment throughout — nothing centered except data viz
//   · Information IS the design
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

const RULE_COLOR = 'rgba(255,255,255,0.08)'

// ── Structural Primitives ────────────────────────────────────────────────────

function Rule() {
  return <div className="w-full" style={{ borderTop: `1px solid ${RULE_COLOR}` }} />
}

function SectionLabel({ number, label, theme }) {
  return (
    <div className="flex items-baseline gap-3">
      {number != null && (
        <span className="text-[9px] tabular-nums" style={{
          color: 'rgba(255,255,255,0.12)',
          fontFamily: "'Outfit', 'Helvetica Neue', sans-serif",
          letterSpacing: '0.15em',
        }}>
          {String(number).padStart(2, '0')}
        </span>
      )}
      <span className="text-[9px] uppercase tracking-[0.3em]"
        style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
        {label}
      </span>
    </div>
  )
}

function CropMarks() {
  const c = 'rgba(255,255,255,0.05)'
  const mk = (cls) => (
    <svg className={`absolute ${cls}`} width="10" height="10">
      <line x1="5" y1="0" x2="5" y2="10" stroke={c} strokeWidth="0.5" />
      <line x1="0" y1="5" x2="10" y2="5" stroke={c} strokeWidth="0.5" />
    </svg>
  )
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {mk('top-3 left-3')}
      {mk('top-3 right-3')}
      {mk('bottom-3 left-3')}
      {mk('bottom-3 right-3')}
    </div>
  )
}


// ── Swiss Bell Curve ─────────────────────────────────────────────────────────
// Clean, precise, no effects — data visualization as Müller-Brockmann would

function SwissBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 280, H = 76
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

      {/* Level ticks — monochrome */}
      {levelTicks.map(l => (
        <g key={l.name}>
          <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 4}
            stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <text x={xS(l.z)} y={baseY + 12}
            fill="rgba(255,255,255,0.15)" fontSize="5" textAnchor="middle"
            fontFamily="'Outfit', sans-serif" letterSpacing="0.05em">
            {l.short}
          </text>
        </g>
      ))}

      {/* Filled area — solid, no gradient */}
      <path d={fillD} fill="rgba(255,255,255,0.04)" />

      {/* Full curve — thin, precise */}
      <path d={fullD} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />

      {/* Filled segment — slightly brighter */}
      <path d={filledLineD} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* User marker — clean vertical */}
      <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
        stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

      {/* User dot — small, precise */}
      <circle cx={userSx} cy={userSy} r="2"
        fill={theme?.text || '#e8e9eb'} opacity="0.5" />
    </svg>
  )
}


// ── Swiss Brain Map ──────────────────────────────────────────────────────────
// Monochrome. No glow. No animation. Geometric precision.

function SwissBrainMap({ phaseStats, practiceCounts, theme }) {
  const textColor = theme?.text || '#e8e9eb'

  return (
    <div className="flex justify-center py-2">
      <svg width="180" height="150" viewBox="0 0 180 155">
        {/* Hemispheres — stroke only, no fill */}
        <path d={LEFT_HEMI} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        <path d={RIGHT_HEMI} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

        {/* Fold lines */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

        {/* Practice dots — all monochrome, opacity = mastery */}
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
                fill={textColor} opacity={opacity}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}


// ── Swiss Spider Chart ───────────────────────────────────────────────────────
// Single color. Geometric grid. No rainbow.

function SwissSpiderChart({ practiceCounts, theme }) {
  const size = 220
  const cx = size / 2, cy = size / 2
  const R = 68
  const n = SKILL_AXES.length
  const textColor = theme?.text || '#e8e9eb'

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
        {/* Guide polygons — monochrome */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          )
        })}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          )
        })}

        {/* Data fill — monochrome */}
        <polygon points={dataPoly}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.8" />

        {/* Dots + labels — single color, uppercase */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 16)
          return (
            <g key={axis.name}>
              <circle cx={pt.x} cy={pt.y} r="1.8" fill={textColor} opacity="0.35" />
              <text x={labelPt.x} y={labelPt.y}
                fill={textColor} fontSize="6" textAnchor="middle" dominantBaseline="middle"
                opacity="0.2" fontFamily="'Outfit', sans-serif" letterSpacing="0.08em">
                {axis.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ── Swiss Discipline Bar ─────────────────────────────────────────────────────

function SwissDisciplineBar({ phase, practiceCounts, sessions, theme }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div>
      <motion.button
        className="w-full text-left active:opacity-70"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.08 }}
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[12px] font-medium tracking-wide"
            style={{ color: theme?.text, opacity: 0.65, fontFamily: theme?.fontBody }}>
            {phase.name}
          </span>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span className="text-[10px] tabular-nums"
              style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
              {totalSessions} sess
            </span>
            <span className="text-[11px]"
              style={{
                color: theme?.textMuted,
                display: 'inline-block',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
                opacity: 0.7,
              }}>
              ▾
            </span>
          </div>
        </div>

        {/* Progress — rectangular, no radius */}
        <div className="h-[3px] w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, background: theme?.text || '#e8e9eb', opacity: 0.18 }} />
        </div>
      </motion.button>

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
                    className="flex items-center py-1.5"
                    style={{ borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                    <span className="text-[10px] flex-1 min-w-0 truncate"
                      style={{
                        color: count > 0 ? theme?.textSecondary : theme?.textMuted,
                        fontFamily: theme?.fontBody,
                        opacity: count > 0 ? 1 : 0.5,
                      }}>
                      {practice.name}
                    </span>
                    <span className="text-[9px] tabular-nums w-[28px] text-right"
                      style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                      {count > 0 ? `${count}×` : '—'}
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

export function SwissHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
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
      <CropMarks />

      {/* 01 — Level Identity */}
      <div className="px-6 pt-6">
        <SectionLabel number={1} label={`Level ${level.idx + 1}`} theme={theme} />
        <h1 className="text-[40px] font-bold leading-none mt-1 tracking-tight"
          style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
          {level.name}
        </h1>
      </div>

      {/* Character — full bleed, no radius */}
      {charImage && (
        <div className="mt-4">
          <img src={charImage} alt=""
            className="w-full object-cover block"
            style={{ maxHeight: '280px' }}
          />
        </div>
      )}

      <div className="px-6">
        <Rule />

        {/* 02 — Data Grid */}
        <div className="py-5">
          <SectionLabel number={2} label="Overview" theme={theme} />
          <div className="grid grid-cols-4 gap-4 mt-3">
            {[
              { value: totalXp.toLocaleString(), label: 'XP' },
              { value: sessions.length, label: 'Sessions' },
              { value: streak > 0 ? `${streak}d` : '—', label: 'Streak' },
              { value: `${uniquePractices}/${TOTAL_PRACTICES}`, label: 'Tried' },
            ].map(d => (
              <div key={d.label}>
                <p className="text-[24px] font-semibold tabular-nums leading-none"
                  style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
                  {d.value}
                </p>
                <p className="text-[8px] uppercase tracking-[0.25em] mt-1.5"
                  style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                  {d.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Rule />

        {/* 03 — Distribution */}
        <div className="py-5">
          <div className="flex items-baseline justify-between">
            <SectionLabel number={3} label="Distribution" theme={theme} />
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-semibold tabular-nums"
                style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
                {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
              </span>
              <span className="text-[8px] uppercase tracking-[0.25em]"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                Percentile
              </span>
            </div>
          </div>
          <div className="mt-3">
            <SwissBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
          </div>
        </div>

        <Rule />

        {/* 04 — Progress to Next */}
        {level.next && (
          <>
            <div className="py-5">
              <div className="flex items-baseline justify-between mb-3">
                <SectionLabel number={4} label="Progress" theme={theme} />
                <span className="text-[10px] tabular-nums"
                  style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                  {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()} xp
                </span>
              </div>
              {/* Progress bar — rectangular, no radius, no glow */}
              <div className="h-[4px] w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full transition-all duration-700"
                  style={{ width: `${lvlProgress}%`, background: theme?.text || '#e8e9eb', opacity: 0.18 }} />
              </div>
              <p className="text-[9px] mt-2 uppercase tracking-[0.2em]"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
                Next: {level.next.name}
              </p>
            </div>
            <Rule />
          </>
        )}

        {/* 05 — Check-Ins */}
        <div className="py-5">
          <SectionLabel number={level.next ? 5 : 4} label="Check-Ins" theme={theme} />
          <div className="mt-3">
            {CHECK_INS.map((ci, i) => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-center py-2.5 transition-opacity active:opacity-50"
                style={i < CHECK_INS.length - 1 ? { borderBottom: '0.5px solid rgba(255,255,255,0.04)' } : {}}
              >
                <span className="text-[9px] tabular-nums w-[20px] shrink-0"
                  style={{ color: 'rgba(255,255,255,0.1)', fontFamily: theme?.fontBody }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[12px]"
                  style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>
                  {ci.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Rule />

        {/* Dev: Level Presets */}
        <div className="py-5 pb-8">
          <SectionLabel label="Preview" theme={theme} />
          <div className="flex gap-1 mt-2">
            {LEVELS.map((lvl, i) => (
              <button key={lvl.name} onClick={() => onSeed(i)}
                className="flex-1 py-2 text-[8px] font-medium uppercase tracking-wider transition-all"
                style={{
                  background: level.idx === i ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: `1px solid ${level.idx === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  color: level.idx === i ? (theme?.text) : (theme?.textMuted),
                  fontFamily: theme?.fontBody,
                }}>
                {lvl.short}
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

export function SwissStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <CropMarks />

      <div className="px-6 pt-6">
        <SectionLabel number={1} label="Progress" theme={theme} />
        <h1 className="text-[40px] font-bold leading-none mt-1 tracking-tight"
          style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
          Statistics
        </h1>
      </div>

      <div className="px-6">
        <div className="mt-5"><Rule /></div>

        {/* 02 — Brain Map */}
        <div className="py-4">
          <SectionLabel number={2} label="Neural Map" theme={theme} />
          <SwissBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} theme={theme} />
        </div>

        <Rule />

        {/* 03 — Spider Chart */}
        <div className="py-4">
          <SectionLabel number={3} label="Skill Axes" theme={theme} />
          <SwissSpiderChart practiceCounts={practiceCounts} theme={theme} />
        </div>

        <Rule />

        {/* 04 — Disciplines */}
        <div className="py-5 pb-8">
          <SectionLabel number={4} label="Disciplines" theme={theme} />
          <div className="mt-4 space-y-5">
            {PHASES.map(phase => (
              <SwissDisciplineBar
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

export function SwissTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <CropMarks />

      <div className="px-6 pt-6">
        <SectionLabel number={1} label="Training" theme={theme} />
        <h1 className="text-[40px] font-bold leading-none mt-1 tracking-tight"
          style={{ color: theme?.text, fontFamily: theme?.fontBody }}>
          Mental Fitness
        </h1>
      </div>

      <div className="px-6">
        <div className="mt-5"><Rule /></div>

        {/* 02 — Log Session */}
        <div className="py-5">
          <button
            onClick={() => { haptics.tap(); onLog() }}
            className="w-full py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium transition-all active:opacity-60"
            style={{
              color: theme?.text,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              fontFamily: theme?.fontBody,
            }}>
            Log Session
          </button>
        </div>

        <Rule />

        {/* 03 — Check-Ins */}
        <div className="py-5">
          <SectionLabel number={3} label="Check-Ins" theme={theme} />
          <div className="mt-3">
            {CHECK_INS.map((ci, i) => (
              <button
                key={ci.id}
                onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                className="w-full text-left flex items-center py-2.5 transition-opacity active:opacity-50"
                style={i < CHECK_INS.length - 1 ? { borderBottom: '0.5px solid rgba(255,255,255,0.04)' } : {}}
              >
                <span className="text-[9px] tabular-nums w-[20px] shrink-0"
                  style={{ color: 'rgba(255,255,255,0.1)', fontFamily: theme?.fontBody }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[12px]"
                  style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>
                  {ci.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Rule />

        {/* 04 — Session History */}
        <div className="py-5 pb-8">
          <SectionLabel number={4} label="Recent" theme={theme} />
          {recent.length === 0 ? (
            <p className="text-[10px] uppercase tracking-[0.2em] mt-3" style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>No sessions recorded</p>
          ) : (
            <>
            {/* Column headers */}
            <div className="flex items-center mt-3 pb-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[8px] uppercase tracking-[0.2em] w-[52px] shrink-0"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Date</span>
              <span className="text-[8px] uppercase tracking-[0.2em] flex-1"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Practice</span>
              <span className="text-[8px] uppercase tracking-[0.2em] w-[36px] text-right shrink-0"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>XP</span>
              <span className="text-[8px] uppercase tracking-[0.2em] w-[30px] text-right shrink-0"
                style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>Min</span>
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
                <div key={sess.id} className="flex items-center py-2.5"
                  style={{ borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] w-[52px] shrink-0 tabular-nums"
                    style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>{label}</span>
                  <span className="text-[10px] flex-1 min-w-0 truncate"
                    style={{ color: theme?.textSecondary, fontFamily: theme?.fontBody }}>
                    {practice?.name || sess.practiceId}
                  </span>
                  <span className="text-[9px] tabular-nums w-[36px] text-right shrink-0"
                    style={{ color: theme?.textMuted, fontFamily: theme?.fontBody }}>
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
