// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Matrix: Transcendence — Level 6: Legend / The One
//
// Neo has TRANSCENDED the Matrix. He doesn't just see green code — he sees
// the golden source code of reality itself. Everything moves in slow motion.
// The UI feels suspended in time, like bullets frozen mid-air. Enlightened,
// calm, powerful, inevitable.
//
// Rules:
//   · Gold digital rain canvas — katakana/digits in amber/gold (not green)
//   · Bullet-time particles — small frozen circles, barely floating
//   · Ripple rings on hero image — concentric force pulses
//   · Warm black bg #0a0808, gold #d4aa5c primary, NO red
//   · No scanlines — Neo has transcended the CRT
//   · Section headers: // BEYOND.THE.CODE, // SOURCE.UNVEILED, // OMNISCIENCE
//   · Cards have warm inner glow, not harsh borders
//   · SLOWER animations — spring stiffness 200, durations 0.6-0.8s
//   · Font: JetBrains Mono / Share Tech Mono
//   · borderRadius: 0 everywhere — sharp, absolute, clean
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import {
  PHASES, LEVELS, TOTAL_PRACTICES, CHECK_INS,
  SKILL_AXES, BRAIN_DOTS, LEFT_HEMI, RIGHT_HEMI, LEFT_FOLDS, RIGHT_FOLDS,
  getSessionXp, getDateKey, erf, getProgressImage,
} from './MentalFitnessTest.jsx'


// ── Design Tokens ────────────────────────────────────────────────────────────

const BG       = '#0a0808'
const CARD_BG  = '#0e0c0a'
const GOLD     = '#d4aa5c'
const GOLD_B   = '#e8c468'
const TEXT     = '#d4aa5c'
const TEXT_B   = '#e8dcc8'
const TEXT_DIM = 'rgba(212,170,92,0.50)'
const TEXT_M   = 'rgba(212,170,92,0.22)'
const BORDER   = 'rgba(212,170,92,0.12)'
const GLOW     = 'rgba(212,170,92,0.25)'

const FONT        = "'JetBrains Mono', 'Courier New', monospace"
const FONT_HEADER = "'Share Tech Mono', 'JetBrains Mono', monospace"

// Bullet-time spring — everything slow, weighty, inevitable
const SPRING = { type: 'spring', stiffness: 200, damping: 28 }
const FADE   = { duration: 0.7, ease: 'easeOut' }

// Katakana + digits + latin for rain
const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFZ'


// ── Gold Digital Rain Canvas ─────────────────────────────────────────────────

function GoldRain({ height = 400, opacity = 0.35 }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width  = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width  = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const W = () => canvas.width / dpr
    const H = () => canvas.height / dpr
    const fontSize = 14
    const cols = () => Math.floor(W() / fontSize)

    if (!stateRef.current) {
      const c = cols()
      stateRef.current = {
        drops: Array.from({ length: c }, () => Math.random() * -50),
      }
    }

    function draw() {
      const w = W(), h = H()
      // Fade trail
      ctx.fillStyle = 'rgba(10, 8, 8, 0.08)'
      ctx.fillRect(0, 0, w, h)

      ctx.font = fontSize + 'px "Courier New", monospace'
      const { drops } = stateRef.current
      const numCols = cols()

      // Resize drops array if needed
      while (drops.length < numCols) drops.push(Math.random() * -50)

      for (let i = 0; i < numCols; i++) {
        const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        // Head character — bright white-gold
        if (y > 0 && y < h) {
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = 0.9
          ctx.fillText(ch, x, y)

          // Trail — gold, fading
          for (let t = 1; t < 8; t++) {
            const ty = y - t * fontSize
            if (ty < 0) break
            const trailCh = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)]
            const a = Math.max(0, 0.6 - t * 0.08)
            // Fade from gold to dark amber
            const r = Math.round(212 - t * 15)
            const g = Math.round(170 - t * 15)
            const b = Math.round(92 - t * 8)
            ctx.fillStyle = `rgb(${Math.max(r,61)},${Math.max(g,46)},${Math.max(b,20)})`
            ctx.globalAlpha = a
            ctx.fillText(trailCh, x, ty)
          }
          ctx.globalAlpha = 1
        }

        // Advance drop
        drops[i] += 0.4 + Math.random() * 0.3
        if (drops[i] * fontSize > h && Math.random() > 0.975) {
          drops[i] = Math.random() * -20
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
      }}
    />
  )
}


// ── Bullet-Time Particles ────────────────────────────────────────────────────

function BulletTimeParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      opacity: 0.04 + Math.random() * 0.08,
      dur: 6 + Math.random() * 6,
      delay: Math.random() * 4,
    })), [])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -2, 0, 2, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: GOLD,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
}


// ── Ripple Ring ──────────────────────────────────────────────────────────────

function RippleRing({ delay = 0 }) {
  return (
    <motion.circle
      cx="50%" cy="50%" r="30%"
      fill="none"
      stroke={GOLD}
      strokeWidth="0.5"
      initial={{ scale: 0.5, opacity: 0.4 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: 'easeOut' }}
      style={{ transformOrigin: 'center' }}
    />
  )
}


// ── Gold Card ────────────────────────────────────────────────────────────────

function GoldCard({ children, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      background: CARD_BG,
      border: `1px solid ${BORDER}`,
      boxShadow: `inset 0 0 20px rgba(212,170,92,0.04), 0 2px 12px rgba(0,0,0,0.3)`,
      borderRadius: 0,
      ...style,
    }}>
      {children}
    </div>
  )
}


// ── Gold Button ──────────────────────────────────────────────────────────────

function GoldButton({ children, onClick, style = {}, active = false }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      style={{
        position: 'relative',
        background: active ? 'rgba(212,170,92,0.08)' : 'transparent',
        border: `1px solid ${active ? 'rgba(212,170,92,0.25)' : BORDER}`,
        borderRadius: 0,
        color: active ? GOLD : TEXT_DIM,
        fontFamily: FONT,
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        ...style,
      }}
    >
      {children}
    </motion.button>
  )
}


// ── Source Line ──────────────────────────────────────────────────────────────

function SourceLine({ label, value, delay = 0 }) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...FADE, delay }}
    >
      <span style={{
        color: TEXT_DIM,
        fontSize: 11,
        fontFamily: FONT,
        letterSpacing: '0.04em',
      }}>
        // {label}
      </span>
      <span style={{
        color: GOLD_B,
        fontSize: 14,
        fontFamily: FONT,
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
    </motion.div>
  )
}


// ── Source Header ────────────────────────────────────────────────────────────

function SourceHeader({ text, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...FADE, delay }}
      style={{ marginBottom: 12 }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span style={{
          color: GOLD,
          fontSize: 10,
          fontFamily: FONT_HEADER,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {text}
        </span>
        <div style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, ${GOLD}40, transparent)`,
        }} />
      </div>
    </motion.div>
  )
}


// ── Transcendence Bell Curve ─────────────────────────────────────────────────

function GoldBellCurve({ sessions, level, totalXp }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
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

  const levelTicks = LEVELS.filter(l => {
    const z = (l.minXp - MEAN) / SIGMA
    return l.minXp > 0 && z >= Z_MIN && z <= Z_MAX
  }).map(l => ({ ...l, z: (l.minXp - MEAN) / SIGMA }))

  return (
    <div className="flex justify-center">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 320 }}>
        <defs>
          <linearGradient id="gold-bell-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.20" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
          stroke={`rgba(212,170,92,0.10)`} strokeWidth="0.5" />

        {/* Level ticks */}
        {levelTicks.map(l => (
          <g key={l.name}>
            <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 4}
              stroke="rgba(212,170,92,0.20)" strokeWidth="0.4" />
            <text x={xS(l.z)} y={baseY + 14}
              fill="rgba(212,170,92,0.35)" fontSize="5" textAnchor="middle"
              fontFamily={FONT} fontWeight="400" letterSpacing="0.06em">
              {l.short}
            </text>
          </g>
        ))}

        {/* Filled area */}
        <path d={fillD} fill="url(#gold-bell-fill)" />

        {/* Full curve — dim gold */}
        <path d={fullD} fill="none" stroke="rgba(212,170,92,0.18)" strokeWidth="0.8" />

        {/* Filled segment — bright gold */}
        <path d={filledLineD} fill="none" stroke={GOLD} strokeWidth="1" opacity="0.7" />

        {/* User vertical line */}
        <line x1={userSx} y1={userSy} x2={userSx} y2={baseY}
          stroke={GOLD_B} strokeWidth="0.5" opacity="0.5"
          strokeDasharray="2,2" />

        {/* User dot — gold glow */}
        <circle cx={userSx} cy={userSy} r="5"
          fill={GOLD_B} opacity="0.15" />
        <circle cx={userSx} cy={userSy} r="2.5"
          fill={GOLD_B} opacity="0.8" />
      </svg>
    </div>
  )
}


// ── Transcendence Brain Map ──────────────────────────────────────────────────

function GoldBrainMap({ phaseStats, practiceCounts }) {
  return (
    <div className="flex justify-center" style={{ padding: '12px 0' }}>
      <svg width="200" height="165" viewBox="0 0 180 155">
        <defs>
          <radialGradient id="gold-brain-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212,170,92,0.12)" />
            <stop offset="60%" stopColor="rgba(212,170,92,0.03)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Hemispheres — gold wireframe */}
        <path d={LEFT_HEMI} fill="url(#gold-brain-glow)" />
        <path d={LEFT_HEMI} fill="none" stroke="rgba(212,170,92,0.15)" strokeWidth="0.8" />
        <path d={RIGHT_HEMI} fill="url(#gold-brain-glow)" />
        <path d={RIGHT_HEMI} fill="none" stroke="rgba(212,170,92,0.15)" strokeWidth="0.8" />

        {/* Fold lines — gold, subtle */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke="rgba(212,170,92,0.06)" strokeWidth="0.4" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke="rgba(212,170,92,0.06)" strokeWidth="0.4" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke="rgba(212,170,92,0.06)" strokeWidth="0.4" />

        {/* Slow center pulse */}
        <motion.circle
          cx={90} cy={55} r={4}
          fill="rgba(212,170,92,0.4)"
          animate={{ opacity: [0.15, 0.5, 0.15], r: [4, 7, 4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Practice dots — gold spectrum */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const mastered = count >= 10
            const r = count >= 10 ? 4 : count >= 5 ? 3.5 : count >= 3 ? 3 : count >= 1 ? 2.5 : 1.8
            const opacity = count >= 10 ? 0.85 : count >= 5 ? 0.55 : count >= 3 ? 0.35 : count >= 1 ? 0.2 : 0.06

            return (
              <g key={practice.id}>
                {mastered && (
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={8}
                    fill="none" stroke={GOLD_B} strokeWidth="0.8"
                    animate={{ opacity: [0.1, 0.35, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <motion.circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={count > 0 ? GOLD : 'rgba(212,170,92,0.12)'}
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


// ── Transcendence Spider Chart ───────────────────────────────────────────────

function GoldSpiderChart({ practiceCounts }) {
  const size = 240
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
    <div className="flex justify-center" style={{ padding: '8px 0' }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 280 }}>
        <defs>
          <linearGradient id="spider-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.14" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Guide polygons — gold grid */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(212,170,92,0.08)" strokeWidth="0.5" />
          )
        })}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="rgba(212,170,92,0.08)" strokeWidth="0.5" />
          )
        })}

        {/* Data fill — gold */}
        <polygon points={dataPoly}
          fill="url(#spider-gold)"
          stroke={GOLD}
          strokeWidth="0.8"
          opacity="0.7" />

        {/* Data points — bright gold */}
        {dataPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="2.5"
            fill={GOLD_B} opacity="0.6" />
        ))}

        {/* Labels */}
        {SKILL_AXES.map((axis, i) => {
          const labelPt = toXY(angles[i], R + 22)
          return (
            <text key={axis.name} x={labelPt.x} y={labelPt.y}
              fill={GOLD} fontSize="6" textAnchor="middle" dominantBaseline="middle"
              opacity="0.4" fontFamily={FONT} fontWeight="400" letterSpacing="0.06em">
              {axis.name.toUpperCase()}
            </text>
          )
        })}
      </svg>
    </div>
  )
}


// ── Discipline Bar ───────────────────────────────────────────────────────────

function GoldDisciplineBar({ phase, practiceCounts, sessions }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId))
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  return (
    <div>
      <motion.button
        className="w-full text-left"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
        whileTap={{ scale: 0.98 }}
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{
            color: GOLD,
            fontSize: 12,
            fontFamily: FONT,
            letterSpacing: '0.04em',
          }}>
            // {phase.name}
          </span>
          <div className="flex items-center" style={{ gap: 14 }}>
            <span style={{ color: GOLD_B, fontSize: 11, fontFamily: FONT }}>
              {tried.size}/{phase.practices.length}
            </span>
            <span style={{ color: TEXT_DIM, fontSize: 11, fontFamily: FONT }}>
              {totalSessions} sess
            </span>
            <motion.span
              style={{ color: TEXT_DIM, fontSize: 10 }}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ▾
            </motion.span>
          </div>
        </div>

        {/* Progress bar — smooth gold */}
        <div style={{
          width: '100%',
          height: 3,
          background: 'rgba(212,170,92,0.06)',
          overflow: 'hidden',
          borderRadius: 0,
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD_B})`,
              opacity: 0.6,
            }}
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <GoldCard style={{ marginTop: 8, padding: '12px 16px' }}>
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                return (
                  <div key={practice.id}
                    className="flex items-center justify-between"
                    style={{ padding: '6px 0' }}>
                    <span style={{
                      color: GOLD,
                      opacity: count > 0 ? 0.6 : 0.2,
                      fontSize: 11,
                      fontFamily: FONT,
                      flex: 1,
                    }}>
                      {practice.name}
                    </span>
                    <span style={{
                      color: GOLD_B,
                      opacity: count > 0 ? 0.6 : 0.15,
                      fontSize: 10,
                      fontFamily: FONT,
                      width: 32,
                      textAlign: 'right',
                    }}>
                      {count > 0 ? `${count}x` : '--'}
                    </span>
                    <span style={{
                      color: TEXT_DIM,
                      fontSize: 10,
                      fontFamily: FONT,
                      width: 40,
                      textAlign: 'right',
                      opacity: count > 0 ? 1 : 0.3,
                    }}>
                      {count > 0 ? `${totalMin}m` : ''}
                    </span>
                  </div>
                )
              })}
            </GoldCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ScandinavianHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
      style={{ position: 'relative', background: BG }}>

      {/* Gold digital rain background */}
      <GoldRain opacity={0.30} />
      <BulletTimeParticles />

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        <div style={{ height: 32 }} />

        {/* System path header */}
        <div style={{ padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{
                color: TEXT_M,
                fontSize: 9,
                fontFamily: FONT,
                letterSpacing: '0.08em',
              }}>
                SOURCE://MENTAL_FITNESS/TRANSCENDED
              </span>
              <motion.span
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  color: GOLD_B,
                  fontSize: 9,
                  fontFamily: FONT,
                  letterSpacing: '0.1em',
                }}
              >
                TRANSCENDED
              </motion.span>
            </div>
          </motion.div>

          {/* Level name — large gold with glow */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...FADE, delay: 0.1 }}
            style={{
              color: GOLD_B,
              fontSize: 32,
              fontWeight: 400,
              fontFamily: FONT_HEADER,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              textShadow: `0 0 30px ${GLOW}, 0 0 60px rgba(212,170,92,0.10)`,
              marginBottom: 4,
            }}
          >
            {level.name}
          </motion.h1>
          <span style={{
            color: TEXT_DIM,
            fontSize: 10,
            fontFamily: FONT,
            letterSpacing: '0.12em',
          }}>
            // LEVEL.{level.idx + 1}
          </span>
        </div>

        <div style={{ height: 20 }} />

        {/* Hero image with gold overlay + ripple rings */}
        {charImage && (
          <div style={{ padding: '0 20px' }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 0 }}
            >
              <img
                src={charImage}
                alt=""
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  display: 'block',
                  filter: 'sepia(0.3) saturate(0.8) brightness(0.85)',
                }}
              />
              {/* Gold tint overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(212,170,92,0.08) 0%, rgba(212,170,92,0.02) 50%, transparent 100%)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }} />
              {/* Ripple rings SVG overlay */}
              <svg style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none',
              }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <RippleRing delay={0} />
                <RippleRing delay={1} />
                <RippleRing delay={2} />
              </svg>
              {/* Bottom fade */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                background: `linear-gradient(0deg, ${BG}, transparent)`,
                pointerEvents: 'none',
              }} />
            </motion.div>
          </div>
        )}

        <div style={{ height: 20 }} />

        {/* Status readout card */}
        <div style={{ padding: '0 20px' }}>
          <SourceHeader text="// BEYOND.THE.CODE" delay={0.1} />
          <GoldCard style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SourceLine label="XP" value={totalXp.toLocaleString()} delay={0.15} />
              <SourceLine label="SESSIONS" value={sessions.length} delay={0.20} />
              <SourceLine label="STREAK" value={streak > 0 ? `${streak} days` : '\u2014'} delay={0.25} />
              <SourceLine label="PRACTICES" value={`${uniquePractices}`} delay={0.30} />
            </div>
          </GoldCard>
        </div>

        <div style={{ height: 24 }} />

        {/* XP progress bar — smooth gold with outer glow */}
        {level.next && (
          <div style={{ padding: '0 20px' }}>
            <GoldCard style={{ padding: '16px 20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <span style={{
                  color: TEXT_DIM,
                  fontSize: 10,
                  fontFamily: FONT,
                  letterSpacing: '0.08em',
                }}>
                  // PROGRESS
                </span>
                <span style={{
                  color: TEXT_DIM,
                  fontSize: 10,
                  fontFamily: FONT,
                }}>
                  {totalXp.toLocaleString()} / {level.next.minXp.toLocaleString()}
                </span>
              </div>

              {/* Smooth gold bar with outer glow */}
              <div style={{
                width: '100%',
                height: 5,
                background: 'rgba(212,170,92,0.06)',
                overflow: 'hidden',
                borderRadius: 0,
                position: 'relative',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${lvlProgress}%` }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${GOLD}, ${GOLD_B})`,
                    boxShadow: `0 0 8px ${GLOW}, 0 0 16px rgba(212,170,92,0.12)`,
                  }}
                />
              </div>

              <p style={{
                color: TEXT_M,
                fontSize: 10,
                fontFamily: FONT,
                letterSpacing: '0.06em',
                marginTop: 8,
                textAlign: 'right',
              }}>
                // NEXT: {level.next.name}
              </p>
            </GoldCard>
          </div>
        )}

        <div style={{ height: 24 }} />

        {/* Bell curve — distribution */}
        <div style={{ padding: '0 20px' }}>
          <GoldCard style={{ padding: '16px 12px 12px' }}>
            <div className="flex items-center justify-between" style={{ padding: '0 12px', marginBottom: 12 }}>
              <span style={{
                color: TEXT_DIM,
                fontSize: 10,
                fontFamily: FONT,
                letterSpacing: '0.08em',
              }}>
                // DISTRIBUTION
              </span>
              <span style={{
                color: GOLD_B,
                fontSize: 16,
                fontFamily: FONT_HEADER,
              }}>
                {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
              </span>
            </div>
            <GoldBellCurve sessions={sessions} level={level} totalXp={totalXp} />
          </GoldCard>
        </div>

        <div style={{ height: 24 }} />

        {/* Check-in buttons — 2-column grid */}
        <div style={{ padding: '0 20px' }}>
          <SourceHeader text="// AWARENESS.POINTS" delay={0.2} />
          <div className="grid grid-cols-2" style={{ gap: 6 }}>
            {CHECK_INS.map((ci, i) => (
              <motion.div
                key={ci.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...FADE, delay: 0.1 + i * 0.04 }}
              >
                <GoldButton
                  onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                  style={{
                    width: '100%',
                    padding: '14px 8px',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ color: GOLD, opacity: 0.6, fontSize: 11, fontFamily: FONT }}>
                    {ci.label}
                  </span>
                </GoldButton>
              </motion.div>
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

export function ScandinavianStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
      style={{ position: 'relative', background: BG }}>

      <GoldRain opacity={0.20} />
      <BulletTimeParticles />

      <div style={{ position: 'relative', zIndex: 1 }}>

        <div style={{ height: 32 }} />

        {/* Title */}
        <div style={{ padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={SPRING}
          >
            <span style={{
              color: TEXT_M,
              fontSize: 9,
              fontFamily: FONT,
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 4,
            }}>
              SOURCE://ANALYTICS
            </span>
            <h1 style={{
              color: GOLD_B,
              fontSize: 28,
              fontWeight: 400,
              fontFamily: FONT_HEADER,
              letterSpacing: '0.04em',
              textShadow: `0 0 20px ${GLOW}`,
            }}>
              // SOURCE.UNVEILED
            </h1>
          </motion.div>
        </div>

        <div style={{ height: 24 }} />

        {/* Brain Map */}
        <div style={{ padding: '0 20px' }}>
          <SourceHeader text="// NEURAL.TOPOLOGY" delay={0.1} />
          <GoldCard style={{ padding: '12px' }}>
            <GoldBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} />
          </GoldCard>

          {/* Phase legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {PHASES.map(phase => (
              <div key={phase.id} className="flex items-center gap-1">
                <div style={{
                  width: 5, height: 5,
                  background: GOLD,
                  opacity: 0.5,
                  borderRadius: 0,
                }} />
                <span style={{
                  color: TEXT_DIM,
                  fontSize: 8,
                  fontFamily: FONT,
                  letterSpacing: '0.06em',
                }}>
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 24 }} />

        {/* Spider Chart */}
        <div style={{ padding: '0 20px' }}>
          <SourceHeader text="// SKILL.MATRIX" delay={0.15} />
          <GoldCard style={{ padding: '12px' }}>
            <GoldSpiderChart practiceCounts={practiceCounts} />
          </GoldCard>
        </div>

        <div style={{ height: 24 }} />

        {/* Disciplines — expandable bars */}
        <div style={{ padding: '0 20px', paddingBottom: 64 }}>
          <SourceHeader text="// DISCIPLINE.MAP" delay={0.2} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PHASES.map((phase) => (
              <GoldDisciplineBar
                key={phase.id}
                phase={phase}
                practiceCounts={practiceCounts}
                sessions={sessions}
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

export function ScandinavianTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
      style={{ position: 'relative', background: BG }}>

      <GoldRain opacity={0.20} />
      <BulletTimeParticles />

      <div style={{ position: 'relative', zIndex: 1 }}>

        <div style={{ height: 32 }} />

        {/* Title */}
        <div style={{ padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={SPRING}
          >
            <span style={{
              color: TEXT_M,
              fontSize: 9,
              fontFamily: FONT,
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 4,
            }}>
              SOURCE://TRAINING
            </span>
            <h1 style={{
              color: GOLD_B,
              fontSize: 28,
              fontWeight: 400,
              fontFamily: FONT_HEADER,
              letterSpacing: '0.04em',
              textShadow: `0 0 20px ${GLOW}`,
            }}>
              // OMNISCIENCE
            </h1>
          </motion.div>
        </div>

        <div style={{ height: 24 }} />

        {/* Log session button — TRANSCEND */}
        <div style={{ padding: '0 20px' }}>
          <motion.button
            onClick={() => { haptics.tap(); onLog() }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
            style={{
              width: '100%',
              padding: '18px 32px',
              background: 'rgba(212,170,92,0.06)',
              border: `1px solid rgba(212,170,92,0.20)`,
              borderRadius: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Inner glow pulse */}
            <motion.div
              animate={{
                boxShadow: [
                  'inset 0 0 12px rgba(212,170,92,0.0)',
                  'inset 0 0 20px rgba(212,170,92,0.08)',
                  'inset 0 0 12px rgba(212,170,92,0.0)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
            <span style={{
              color: GOLD_B,
              fontSize: 14,
              fontFamily: FONT_HEADER,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: `0 0 12px ${GLOW}`,
              position: 'relative',
              zIndex: 1,
            }}>
              TRANSCEND
            </span>
          </motion.button>
        </div>

        <div style={{ height: 24 }} />

        {/* Check-ins */}
        <div style={{ padding: '0 20px' }}>
          <SourceHeader text="// AWARENESS.POINTS" delay={0.1} />
          <div className="grid grid-cols-2" style={{ gap: 6 }}>
            {CHECK_INS.map((ci, i) => (
              <motion.div
                key={ci.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...FADE, delay: 0.1 + i * 0.04 }}
              >
                <GoldButton
                  onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
                  style={{
                    width: '100%',
                    padding: '14px 8px',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ color: GOLD, opacity: 0.6, fontSize: 11, fontFamily: FONT }}>
                    {ci.label}
                  </span>
                </GoldButton>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ height: 24 }} />

        {/* Session history */}
        {recent.length === 0 ? (
          <div style={{ padding: '0 20px', paddingBottom: 64 }}>
            <GoldCard style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{
                color: TEXT_DIM,
                fontSize: 12,
                fontFamily: FONT,
                letterSpacing: '0.04em',
              }}>
                // AWAITING.TRANSCENDENCE
              </p>
              <p style={{
                color: TEXT_M,
                fontSize: 10,
                fontFamily: FONT,
                marginTop: 6,
              }}>
                the source code awaits your first session
              </p>
            </GoldCard>
          </div>
        ) : (
          <div style={{ padding: '0 20px', paddingBottom: 64 }}>
            <SourceHeader text="// RECENT.SESSIONS" delay={0.15} />

            <GoldCard style={{ padding: '8px 16px' }}>
              {/* Column headers */}
              <div className="flex items-center"
                style={{
                  padding: '6px 0',
                  borderBottom: `1px solid ${BORDER}`,
                  marginBottom: 4,
                }}>
                <span style={{ color: TEXT_M, fontSize: 8, fontFamily: FONT, width: 48, letterSpacing: '0.1em' }}>
                  DATE
                </span>
                <span style={{ color: TEXT_M, fontSize: 8, fontFamily: FONT, flex: 1, letterSpacing: '0.1em' }}>
                  PRACTICE
                </span>
                <span style={{ color: TEXT_M, fontSize: 8, fontFamily: FONT, width: 36, textAlign: 'right', letterSpacing: '0.1em' }}>
                  XP
                </span>
                <span style={{ color: TEXT_M, fontSize: 8, fontFamily: FONT, width: 30, textAlign: 'right', letterSpacing: '0.1em' }}>
                  MIN
                </span>
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
                  <motion.div
                    key={sess.id}
                    className="flex items-center"
                    style={{
                      padding: '8px 0',
                      borderBottom: idx < recent.length - 1 ? `1px solid rgba(212,170,92,0.05)` : 'none',
                    }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...FADE, delay: idx * 0.03 }}
                  >
                    <span style={{
                      color: TEXT_DIM,
                      fontSize: 10,
                      fontFamily: FONT,
                      width: 48,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      color: GOLD,
                      opacity: 0.7,
                      fontSize: 10,
                      fontFamily: FONT,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {practice?.name || sess.practiceId}
                    </span>
                    <span style={{
                      color: GOLD_B,
                      fontSize: 10,
                      fontFamily: FONT,
                      width: 36,
                      textAlign: 'right',
                    }}>
                      +{getSessionXp(sess)}
                    </span>
                    <span style={{
                      color: TEXT_DIM,
                      fontSize: 9,
                      fontFamily: FONT,
                      width: 30,
                      textAlign: 'right',
                    }}>
                      {sess.durationMin}m
                    </span>
                  </motion.div>
                )
              })}
            </GoldCard>
          </div>
        )}

      </div>
    </div>
  )
}
