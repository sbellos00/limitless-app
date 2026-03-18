// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Matrix — Digital Awakening
// Level 2: Practitioner
//
// Bruce Lee meditating — martial arts meets digital consciousness.
// Green-on-black. Digital rain. Terminal readouts. CRT scanlines.
// Monospace everything. No rounded corners. Phosphor glow.
//
// Rules:
//   · Pure black background (#0a0a0a)
//   · Matrix green (#00ff41) as primary accent
//   · Monospace typography everywhere
//   · Scanline overlay for CRT feel
//   · Text glow (green textShadow)
//   · Sharp corners (borderRadius: 0)
//   · Thin green borders on containers
//   · Digital rain canvas background
//   · Terminal-style data display
//   · Flicker animations on key elements
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

const BG = '#0a0a0a'
const BG_CARD = '#0d0d0d'
const GREEN = '#00ff41'
const GREEN_DIM = '#00cc33'
const GREEN_DARK = '#003300'
const GREEN_BORDER = 'rgba(0,255,65,0.19)'
const GREEN_GLOW = 'rgba(0,255,65,0.25)'
const GREEN_FILL = 'rgba(0,255,65,0.06)'
const TEXT = '#00ff41'
const TEXT_DIM = 'rgba(0,255,65,0.55)'
const TEXT_MUTED = 'rgba(0,255,65,0.25)'
const WHITE_DIM = 'rgba(255,255,255,0.06)'
const FONT = "'JetBrains Mono', 'Courier New', monospace"
const FONT_HEADER = "'Share Tech Mono', 'JetBrains Mono', monospace"
const GLOW = `0 0 8px ${GREEN_GLOW}`
const GLOW_STRONG = `0 0 12px rgba(0,255,65,0.4), 0 0 24px rgba(0,255,65,0.15)`
const SPRING = { type: 'spring', stiffness: 300, damping: 24 }
const SPRING_FAST = { type: 'spring', stiffness: 400, damping: 20 }

// Phase accent colors — all green-shifted for Matrix
const PHASE_COLORS = ['#00ff41', '#00cc66', '#33ff99', '#00ffaa', '#66ffcc', '#00ff88']

function phaseGreen(index) {
  return PHASE_COLORS[index % PHASE_COLORS.length]
}


// ── Scanline Overlay ─────────────────────────────────────────────────────────

function Scanlines() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)',
        mixBlendMode: 'overlay',
      }}
    />
  )
}


// ── Digital Rain Canvas ──────────────────────────────────────────────────────

function DigitalRain({ height = 600, opacity = 0.12 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const columnsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = 320
    const H = height
    canvas.width = W
    canvas.height = H

    const FONT_SIZE = 14
    const COLS = Math.floor(W / FONT_SIZE)

    // Katakana + digits + latin
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    // Initialize drops
    if (columnsRef.current.length !== COLS) {
      columnsRef.current = Array.from({ length: COLS }, () => ({
        y: Math.random() * H / FONT_SIZE,
        speed: 0.3 + Math.random() * 0.7,
        chars: Array.from({ length: Math.ceil(H / FONT_SIZE) + 5 }, () =>
          CHARS[Math.floor(Math.random() * CHARS.length)]
        ),
      }))
    }

    const drops = columnsRef.current

    function draw() {
      ctx.fillStyle = `rgba(10, 10, 10, 0.08)`
      ctx.fillRect(0, 0, W, H)

      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`

      for (let i = 0; i < COLS; i++) {
        const col = drops[i]
        const headY = Math.floor(col.y)

        // Draw trailing characters
        for (let j = 0; j < 16; j++) {
          const row = headY - j
          if (row < 0 || row >= Math.ceil(H / FONT_SIZE)) continue
          const alpha = j === 0 ? 1.0 : Math.max(0.05, (1 - j / 16) * 0.6)
          const color = j === 0 ? '#ffffff' : GREEN
          ctx.fillStyle = color
          ctx.globalAlpha = alpha
          const char = col.chars[(row + col.chars.length) % col.chars.length]
          ctx.fillText(char, i * FONT_SIZE, row * FONT_SIZE)
        }

        col.y += col.speed

        // Occasionally change a character
        if (Math.random() < 0.02) {
          const idx = Math.floor(Math.random() * col.chars.length)
          col.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)]
        }

        // Reset when off screen
        if (col.y * FONT_SIZE > H + 200) {
          col.y = -Math.random() * 10
          col.speed = 0.3 + Math.random() * 0.7
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(draw)
    }

    // Clear canvas first
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)
    animRef.current = requestAnimationFrame(draw)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [height])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${height}px`,
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}


// ── Blinking Cursor ──────────────────────────────────────────────────────────

function Cursor({ color = GREEN }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      style={{ color, fontFamily: FONT }}
    >
      _
    </motion.span>
  )
}


// ── Terminal Line ────────────────────────────────────────────────────────────

function TermLine({ label, value, prefix = '>', labelColor = TEXT_DIM, valueColor = GREEN, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay }}
      style={{
        fontFamily: FONT_HEADER,
        fontSize: '12px',
        lineHeight: '1.8',
        display: 'flex',
        gap: '6px',
      }}
    >
      <span style={{ color: GREEN, opacity: 0.4 }}>{prefix}</span>
      <span style={{ color: labelColor }}>{label}</span>
      <span style={{ color: TEXT_MUTED, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {'·'.repeat(40)}
      </span>
      <span style={{ color: valueColor, textShadow: GLOW, fontWeight: 'bold' }}>{value}</span>
    </motion.div>
  )
}


// ── Matrix Card Container ────────────────────────────────────────────────────

function MatrixCard({ children, style = {}, glow = false }) {
  return (
    <div
      style={{
        background: BG_CARD,
        border: `1px solid ${GREEN_BORDER}`,
        borderRadius: 0,
        padding: '12px',
        position: 'relative',
        boxShadow: glow ? `0 0 20px rgba(0,255,65,0.08)` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}


// ── Matrix Button ────────────────────────────────────────────────────────────

function MatrixButton({ children, onClick, className = '', style = {}, active = false }) {
  return (
    <motion.button
      onClick={() => { haptics.tap(); onClick?.() }}
      className={`transition-all ${className}`}
      style={{
        background: active ? 'rgba(0,255,65,0.12)' : 'transparent',
        color: GREEN,
        border: `1px solid ${active ? GREEN : GREEN_BORDER}`,
        borderRadius: 0,
        fontFamily: FONT_HEADER,
        fontSize: '11px',
        letterSpacing: '0.06em',
        padding: '10px 14px',
        cursor: 'pointer',
        textShadow: GLOW,
        textAlign: 'left',
        ...style,
      }}
      whileHover={{ boxShadow: `0 0 12px rgba(0,255,65,0.15)` }}
      whileTap={{ scale: 0.98, opacity: 0.8 }}
    >
      {children}
    </motion.button>
  )
}


// ── Section Header ───────────────────────────────────────────────────────────

function MatrixHeader({ text, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      style={{
        fontFamily: FONT_HEADER,
        fontSize: '11px',
        color: TEXT_MUTED,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ color: GREEN, opacity: 0.3 }}>{'///'}</span>
      <span>{text}</span>
      <div style={{
        flex: 1,
        height: '1px',
        background: `linear-gradient(to right, ${GREEN_BORDER}, transparent)`,
      }} />
    </motion.div>
  )
}


// ── Bell Curve (Matrix) ──────────────────────────────────────────────────────

function MatrixBellCurve({ sessions, level, totalXp, theme }) {
  if (!sessions.length) return null

  const MEAN = 0, SIGMA = 10000
  const Z_MIN = -3, Z_MAX = 3, STEPS = 120
  const phi = (z) => Math.exp(-0.5 * z * z)
  const userZ = Math.max(Z_MIN, Math.min(Z_MAX, (totalXp - MEAN) / SIGMA))

  const W = 300, H = 120
  const PAD = { top: 12, right: 10, bottom: 28, left: 10 }
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
    <MatrixCard>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines — faint green */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1={PAD.left} y1={yS(phi(0) * g)} x2={W - PAD.right} y2={yS(phi(0) * g)}
            stroke={GREEN} strokeWidth="0.3" opacity="0.1" strokeDasharray="2,4" />
        ))}

        {/* Baseline */}
        <line x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
          stroke={GREEN} strokeWidth="1" opacity="0.2" />

        {/* Level ticks */}
        {levelTicks.map(l => (
          <g key={l.name}>
            <line x1={xS(l.z)} y1={baseY} x2={xS(l.z)} y2={baseY + 6}
              stroke={GREEN} strokeWidth="0.8" opacity="0.2" />
            <text x={xS(l.z)} y={baseY + 16}
              fill={GREEN} fontSize="6" textAnchor="middle" opacity="0.3"
              fontFamily={FONT} letterSpacing="0.05em">
              {l.short}
            </text>
          </g>
        ))}

        {/* Filled area — green glow */}
        <defs>
          <linearGradient id="matrixFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.15" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
          </linearGradient>
          <filter id="greenGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={fillD} fill="url(#matrixFillGrad)" />

        {/* Full curve — dim green */}
        <path d={fullD} fill="none" stroke={GREEN} strokeWidth="0.8" opacity="0.15" />

        {/* Filled segment — bright green with glow */}
        <path d={filledLineD} fill="none" stroke={GREEN} strokeWidth="2"
          strokeLinecap="round" filter="url(#greenGlow)" />

        {/* User marker vertical — glowing */}
        <line x1={userSx} y1={userSy + 4} x2={userSx} y2={baseY}
          stroke={GREEN} strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2" />

        {/* User dot — glowing */}
        <circle cx={userSx} cy={userSy} r="4"
          fill={GREEN} stroke="#ffffff" strokeWidth="1.5" filter="url(#greenGlow)" />
      </svg>
    </MatrixCard>
  )
}


// ── Brain Map (Matrix) ───────────────────────────────────────────────────────

function MatrixBrainMap({ phaseStats, practiceCounts }) {
  return (
    <MatrixCard style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="200" height="165" viewBox="0 0 180 155">
        {/* Circuit board background lines */}
        {[30, 50, 70, 90, 110].map(y => (
          <line key={y} x1="20" y1={y} x2="160" y2={y}
            stroke={GREEN} strokeWidth="0.3" opacity="0.06" strokeDasharray="1,6" />
        ))}
        {[40, 70, 90, 110, 140].map(x => (
          <line key={x} x1={x} y1="15" x2={x} y2="140"
            stroke={GREEN} strokeWidth="0.3" opacity="0.06" strokeDasharray="1,6" />
        ))}

        {/* Hemispheres — green wireframe */}
        <path d={LEFT_HEMI} fill="none" stroke={GREEN} strokeWidth="1" opacity="0.15" />
        <path d={RIGHT_HEMI} fill="none" stroke={GREEN} strokeWidth="1" opacity="0.15" />

        {/* Fold lines — circuit traces */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={GREEN} strokeWidth="0.4" opacity="0.08" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={GREEN} strokeWidth="0.4" opacity="0.08" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke={GREEN} strokeWidth="0.5" opacity="0.1" />

        {/* Practice dots — glowing green nodes */}
        {PHASES.map((phase, pi) =>
          BRAIN_DOTS[pi]?.map((pos, di) => {
            const practice = phase.practices[di]
            if (!practice) return null
            const count = practiceCounts[practice.id] || 0
            const r = count >= 10 ? 5 : count >= 5 ? 4 : count >= 3 ? 3.5 : count >= 1 ? 3 : 2
            const opacity = count >= 10 ? 1 : count >= 5 ? 0.7 : count >= 3 ? 0.5 : count >= 1 ? 0.3 : 0.08

            return (
              <g key={practice.id}>
                {/* Glow halo for mastered */}
                {count >= 5 && (
                  <circle cx={pos.x} cy={pos.y} r={r + 4}
                    fill={GREEN} opacity={0.06} />
                )}
                {/* Connection lines for active nodes */}
                {count >= 3 && di > 0 && BRAIN_DOTS[pi]?.[di - 1] && (
                  <line x1={pos.x} y1={pos.y}
                    x2={BRAIN_DOTS[pi][di - 1].x} y2={BRAIN_DOTS[pi][di - 1].y}
                    stroke={GREEN} strokeWidth="0.5" opacity={0.15} />
                )}
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill={count > 0 ? GREEN : '#111'}
                  opacity={opacity}
                  stroke={count > 0 ? GREEN : 'rgba(0,255,65,0.1)'}
                  strokeWidth={count >= 5 ? 1 : 0.5}
                />
              </g>
            )
          })
        )}
      </svg>
    </MatrixCard>
  )
}


// ── Spider Chart (Matrix) ────────────────────────────────────────────────────

function MatrixSpiderChart({ practiceCounts }) {
  const size = 240
  const cx = size / 2, cy = size / 2
  const R = 76
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
    <MatrixCard style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 260 }}>
        <defs>
          <filter id="spiderGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Guide polygons — green wireframe */}
        {guides.map(g => {
          const pts = angles.map(a => toXY(a, R * g))
          return (
            <polygon key={g}
              points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={GREEN}
              strokeWidth={g === 1 ? '0.8' : '0.4'}
              opacity={g === 1 ? 0.2 : 0.07}
              strokeDasharray={g < 1 ? '2,4' : 'none'}
            />
          )
        })}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={GREEN} strokeWidth="0.5" opacity="0.1" />
          )
        })}

        {/* Data fill — green glow */}
        <polygon points={dataPoly}
          fill={GREEN} fillOpacity="0.06"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter="url(#spiderGlow)" />

        {/* Data points + labels */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 20)
          return (
            <g key={axis.name}>
              {/* Glowing dot */}
              <circle cx={pt.x} cy={pt.y} r="3.5"
                fill={GREEN} stroke="#ffffff" strokeWidth="1"
                filter="url(#spiderGlow)" opacity="0.8" />
              {/* Terminal-style label */}
              <text x={labelPt.x} y={labelPt.y}
                fill={GREEN} fontSize="7.5" textAnchor="middle" dominantBaseline="middle"
                fontFamily={FONT} letterSpacing="0.08em" opacity="0.5">
                {axis.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </MatrixCard>
  )
}


// ── Discipline Bars (Matrix Terminal Style) ──────────────────────────────────

function MatrixDisciplineBar({ phase, phaseIndex, practiceCounts, sessions }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(
    sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId)
  )
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  // Build ASCII progress bar
  const barLen = 16
  const filled = Math.round((pct / 100) * barLen)
  const asciiBar = '\u2588'.repeat(filled) + '\u2591'.repeat(barLen - filled)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay: phaseIndex * 0.06 }}
    >
      <button
        className="w-full text-left"
        onClick={() => { setExpanded(!expanded); haptics.tap() }}
        style={{ fontFamily: FONT }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
          <span style={{
            fontSize: '11px',
            color: GREEN,
            textShadow: GLOW,
            letterSpacing: '0.08em',
          }}>
            {phase.name.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '10px', color: TEXT_DIM }}>
              [{tried.size}/{phase.practices.length}]
            </span>
            <span style={{ fontSize: '10px', color: TEXT_MUTED }}>
              {totalSessions}x
            </span>
            <span style={{
              fontSize: '10px',
              color: GREEN,
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
              opacity: 0.5,
            }}>
              v
            </span>
          </div>
        </div>

        {/* ASCII progress bar */}
        <div style={{
          fontSize: '10px',
          color: GREEN,
          opacity: 0.7,
          letterSpacing: '0.5px',
          lineHeight: 1,
        }}>
          <span style={{ opacity: 0.3 }}>[</span>
          <span style={{ textShadow: pct > 0 ? GLOW : 'none' }}>{asciiBar}</span>
          <span style={{ opacity: 0.3 }}>]</span>
          <span style={{ color: TEXT_DIM, marginLeft: '6px', fontSize: '9px' }}>
            {pct}%
          </span>
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
            <div style={{
              paddingTop: '8px',
              paddingBottom: '4px',
              paddingLeft: '8px',
              borderLeft: `1px solid ${GREEN_BORDER}`,
              marginLeft: '2px',
              marginTop: '4px',
            }}>
              {phase.practices.map(practice => {
                const count = practiceCounts[practice.id] || 0
                const practSessions = sessions.filter(s => s.practiceId === practice.id)
                const totalMin = practSessions.reduce((s, sess) => s + (sess.durationMin || 0), 0)
                const miniBar = count >= 10 ? '\u2588\u2588\u2588\u2588' :
                  count >= 5 ? '\u2588\u2588\u2588\u2591' :
                  count >= 3 ? '\u2588\u2588\u2591\u2591' :
                  count >= 1 ? '\u2588\u2591\u2591\u2591' :
                  '\u2591\u2591\u2591\u2591'

                return (
                  <div key={practice.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 0',
                      borderBottom: `1px solid ${GREEN_BORDER}`,
                      fontFamily: FONT,
                      fontSize: '10px',
                    }}
                  >
                    <span style={{
                      color: count > 0 ? GREEN : TEXT_MUTED,
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {count > 0 ? '> ' : '  '}{practice.name}
                    </span>
                    <span style={{
                      color: count > 0 ? GREEN : TEXT_MUTED,
                      opacity: count > 0 ? 0.6 : 0.2,
                      letterSpacing: '1px',
                      fontSize: '8px',
                      flexShrink: 0,
                    }}>
                      {miniBar}
                    </span>
                    <span style={{
                      color: count > 0 ? GREEN : TEXT_MUTED,
                      width: '24px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      {count > 0 ? `${count}x` : '--'}
                    </span>
                    <span style={{
                      color: TEXT_MUTED,
                      width: '30px',
                      textAlign: 'right',
                      flexShrink: 0,
                      fontSize: '9px',
                      opacity: count > 0 ? 0.8 : 0.3,
                    }}>
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

export function NeubrutHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <DigitalRain height={800} opacity={0.1} />

      {/* ── TERMINAL HEADER ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Boot sequence text */}
          <div style={{
            fontFamily: FONT,
            fontSize: '9px',
            color: TEXT_MUTED,
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}>
            SYSTEM://MENTAL_FITNESS/v2.0
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: TEXT_DIM,
                letterSpacing: '0.12em',
              }}>
                {'>'} LEVEL {level.idx + 1}
              </div>
              <h1 style={{
                fontFamily: FONT,
                fontSize: '32px',
                fontWeight: 'bold',
                color: GREEN,
                textShadow: GLOW_STRONG,
                lineHeight: 1,
                marginTop: '4px',
                letterSpacing: '-0.02em',
              }}>
                {level.name}
              </h1>
            </div>

            {/* Flicker status indicator */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: GREEN,
                textShadow: GLOW,
                border: `1px solid ${GREEN_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
              }}
            >
              ONLINE
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── HERO IMAGE ── */}
      <div className="px-5 mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <div style={{
            border: `1px solid ${GREEN_BORDER}`,
            borderRadius: 0,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 0 30px rgba(0,255,65,0.08)`,
          }}>
            <img
              src={charImage || '/images/character.png'}
              alt="Character"
              className="w-full object-cover block"
              style={{
                maxHeight: 280,
                minHeight: 180,
                filter: 'grayscale(0.3) brightness(0.85)',
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            {/* Green overlay tint */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,255,65,0.05) 0%, rgba(0,255,65,0.12) 100%)',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }} />
            {/* Scanline overlay on image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
              pointerEvents: 'none',
            }} />
            {/* Bottom fade */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: `linear-gradient(transparent, ${BG})`,
              pointerEvents: 'none',
            }} />
          </div>
        </motion.div>
      </div>

      {/* ── TERMINAL READOUT ── */}
      <div className="px-5 mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
        >
          <MatrixCard glow>
            <div style={{
              fontFamily: FONT,
              fontSize: '9px',
              color: TEXT_MUTED,
              marginBottom: '8px',
              letterSpacing: '0.12em',
            }}>
              {'>'} STATUS_REPORT <Cursor />
            </div>

            <TermLine label="LEVEL" value={level.name.toUpperCase()} delay={0.2} />
            <TermLine label="TIER" value={level.tier || 'INITIATE'} delay={0.25} />
            <TermLine label="XP" value={totalXp.toLocaleString()} delay={0.3} />
            <TermLine label="STREAK" value={streak > 0 ? `${streak}d` : 'N/A'} delay={0.35} />
            <TermLine label="PRACTICES" value={`${uniquePractices}`} delay={0.4} />
            <TermLine label="SESSIONS" value={String(sessions.length)} delay={0.45} />
          </MatrixCard>
        </motion.div>
      </div>

      {/* ── XP PROGRESS BAR ── */}
      <div className="px-5 mt-4 relative z-10">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontFamily: FONT,
          fontSize: '9px',
        }}>
          <span style={{ color: TEXT_MUTED }}>{totalXp.toLocaleString()} XP</span>
          {level.next && (
            <span style={{ color: TEXT_MUTED }}>
              {level.next.minXp.toLocaleString()} XP // {level.next.name}
            </span>
          )}
        </div>
        <div style={{
          height: '3px',
          width: '100%',
          background: 'rgba(0,255,65,0.08)',
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              position: 'absolute',
              inset: '0 auto 0 0',
              background: GREEN,
              boxShadow: `0 0 8px ${GREEN}, 0 0 16px rgba(0,255,65,0.3)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${lvlProgress}%` }}
            transition={{ ...SPRING, stiffness: 200 }}
          />
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── DISTRIBUTION ── */}
      <div className="px-5 relative z-10">
        <MatrixHeader text="DISTRIBUTION" delay={0.3} />
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <span style={{
            fontFamily: FONT,
            fontSize: '9px',
            color: TEXT_MUTED,
          }}>
            {'>'} PERCENTILE_RANK
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontFamily: FONT,
              fontSize: '24px',
              fontWeight: 'bold',
              color: GREEN,
              textShadow: GLOW_STRONG,
            }}>
              {betterThan < 1 ? betterThan.toFixed(1) : Math.round(betterThan)}%
            </span>
            <span style={{
              fontFamily: FONT,
              fontSize: '8px',
              color: TEXT_MUTED,
              letterSpacing: '0.12em',
            }}>
              PCTL
            </span>
          </div>
        </div>
        <MatrixBellCurve sessions={sessions} level={level} totalXp={totalXp} theme={theme} />
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── CHECK-INS ── */}
      <div className="px-5 relative z-10">
        <MatrixHeader text="CHECK_INS" delay={0.4} />
        <div className="grid grid-cols-2 gap-2">
          {CHECK_INS.map((ci, i) => (
            <motion.button
              key={ci.id}
              onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
              className="text-left transition-all"
              style={{
                background: 'transparent',
                border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 0,
                padding: '10px 12px',
                fontFamily: FONT,
                cursor: 'pointer',
              }}
              whileHover={{ borderColor: GREEN, boxShadow: `0 0 8px rgba(0,255,65,0.1)` }}
              whileTap={{ scale: 0.97, opacity: 0.7 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: 0.4 + i * 0.04 }}
            >
              <span style={{
                fontSize: '8px',
                color: TEXT_MUTED,
                display: 'block',
                marginBottom: '2px',
                letterSpacing: '0.1em',
              }}>
                {'>'} CMD_{String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: '10px',
                color: GREEN,
                display: 'block',
                lineHeight: 1.3,
                textShadow: GLOW,
              }}>
                {ci.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function NeubrutStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <DigitalRain height={400} opacity={0.06} />

      {/* ── TITLE ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            fontFamily: FONT,
            fontSize: '9px',
            color: TEXT_MUTED,
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}>
            SYSTEM://ANALYSIS_MODULE
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: TEXT_DIM,
                letterSpacing: '0.12em',
              }}>
                {'>'} NEURAL_ANALYTICS
              </div>
              <h1 style={{
                fontFamily: FONT,
                fontSize: '32px',
                fontWeight: 'bold',
                color: GREEN,
                textShadow: GLOW_STRONG,
                lineHeight: 1,
                marginTop: '4px',
              }}>
                Statistics
              </h1>
            </div>

            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: GREEN,
                textShadow: GLOW,
                border: `1px solid ${GREEN_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
              }}
            >
              STATS
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── BRAIN MAP ── */}
      <div className="px-5 relative z-10">
        <MatrixHeader text="NEURAL_MAP" />
        <MatrixBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} />

        {/* Phase legend — terminal style */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 12px',
          marginTop: '10px',
          justifyContent: 'center',
        }}>
          {PHASES.map((phase, i) => (
            <div key={phase.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                background: GREEN,
                opacity: 0.3 + (i * 0.1),
              }} />
              <span style={{
                fontFamily: FONT,
                fontSize: '7px',
                color: TEXT_DIM,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {phase.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── SPIDER CHART ── */}
      <div className="px-5 relative z-10">
        <MatrixHeader text="SKILL_VECTORS" />
        <MatrixSpiderChart practiceCounts={practiceCounts} />
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── DISCIPLINE BARS ── */}
      <div className="px-5 pb-8 relative z-10">
        <MatrixHeader text="DISCIPLINES" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PHASES.map((phase, i) => (
            <MatrixDisciplineBar
              key={phase.id}
              phase={phase}
              phaseIndex={i}
              practiceCounts={practiceCounts}
              sessions={sessions}
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

export function NeubrutTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <DigitalRain height={350} opacity={0.05} />

      {/* ── TITLE ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            fontFamily: FONT,
            fontSize: '9px',
            color: TEXT_MUTED,
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}>
            SYSTEM://TRAINING_PROTOCOL
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: TEXT_DIM,
                letterSpacing: '0.12em',
              }}>
                {'>'} MENTAL_FITNESS
              </div>
              <h1 style={{
                fontFamily: FONT,
                fontSize: '32px',
                fontWeight: 'bold',
                color: GREEN,
                textShadow: GLOW_STRONG,
                lineHeight: 1,
                marginTop: '4px',
              }}>
                Training
              </h1>
            </div>

            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: GREEN,
                textShadow: GLOW,
                border: `1px solid ${GREEN_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
              }}
            >
              TRAIN
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── LOG SESSION BUTTON ── */}
      <div className="px-5 mt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_FAST}
        >
          <motion.button
            onClick={() => { haptics.tap(); onLog?.() }}
            className="w-full transition-all"
            style={{
              background: 'rgba(0,255,65,0.08)',
              border: `1px solid ${GREEN}`,
              borderRadius: 0,
              padding: '16px 20px',
              fontFamily: FONT,
              fontSize: '14px',
              fontWeight: 'bold',
              color: GREEN,
              textShadow: GLOW_STRONG,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              boxShadow: `0 0 20px rgba(0,255,65,0.1), inset 0 0 20px rgba(0,255,65,0.03)`,
              textAlign: 'left',
            }}
            whileHover={{
              boxShadow: `0 0 30px rgba(0,255,65,0.2), inset 0 0 30px rgba(0,255,65,0.05)`,
            }}
            whileTap={{ scale: 0.98, opacity: 0.8 }}
          >
            <span style={{ opacity: 0.4, fontSize: '10px', display: 'block', marginBottom: '2px' }}>
              {'>'} EXECUTE
            </span>
            INITIATE_SESSION
          </motion.button>
        </motion.div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── CHECK-INS ── */}
      <div className="px-5 relative z-10">
        <MatrixHeader text="CHECK_INS" />
        <div className="grid grid-cols-2 gap-2">
          {CHECK_INS.map((ci, i) => (
            <motion.button
              key={ci.id}
              onClick={() => { haptics.tap(); onCheckIn?.(ci) }}
              className="text-left transition-all"
              style={{
                background: 'transparent',
                border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 0,
                padding: '10px 12px',
                fontFamily: FONT,
                cursor: 'pointer',
              }}
              whileHover={{ borderColor: GREEN, boxShadow: `0 0 8px rgba(0,255,65,0.1)` }}
              whileTap={{ scale: 0.97, opacity: 0.7 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: i * 0.04 }}
            >
              <span style={{
                fontSize: '8px',
                color: TEXT_MUTED,
                display: 'block',
                marginBottom: '2px',
                letterSpacing: '0.1em',
              }}>
                {'>'} CMD_{String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: '10px',
                color: GREEN,
                display: 'block',
                lineHeight: 1.3,
                textShadow: GLOW,
              }}>
                {ci.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-5 my-4">
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
        }} />
      </div>

      {/* ── SESSION HISTORY ── */}
      <div className="px-5 pb-8 relative z-10">
        <MatrixHeader text="SESSION_LOG" />

        {recent.length > 0 ? (
          <MatrixCard>
            {/* Terminal header */}
            <div style={{
              fontFamily: FONT,
              fontSize: '8px',
              color: TEXT_MUTED,
              letterSpacing: '0.1em',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: `1px solid ${GREEN_BORDER}`,
            }}>
              {'>'} DISPLAYING {recent.length} MOST RECENT <Cursor />
            </div>

            {recent.map((sess, idx) => {
              const practice = PHASES.flatMap(p => p.practices).find(p => p.id === sess.practiceId)
              const date = new Date(sess.timestamp)
              const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
              const today = getDateKey(new Date())
              const ydDate = new Date(); ydDate.setDate(ydDate.getDate() - 1)
              const sessDay = getDateKey(date)
              const dayLabel = sessDay === today ? 'TODAY'
                : sessDay === getDateKey(ydDate) ? 'YDAY'
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
              const xp = getSessionXp(sess)

              return (
                <motion.div
                  key={sess.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING, delay: idx * 0.03 }}
                  style={{
                    fontFamily: FONT,
                    fontSize: '10px',
                    lineHeight: 1.8,
                    display: 'flex',
                    gap: '4px',
                    borderBottom: idx < recent.length - 1 ? `1px solid rgba(0,255,65,0.06)` : 'none',
                    paddingBottom: '2px',
                  }}
                >
                  {/* Timestamp */}
                  <span style={{ color: TEXT_MUTED, flexShrink: 0 }}>
                    [{time}]
                  </span>
                  {/* Day tag */}
                  <span style={{ color: TEXT_MUTED, flexShrink: 0, fontSize: '8px', lineHeight: '18px' }}>
                    {dayLabel}
                  </span>
                  {/* Practice name */}
                  <span style={{
                    color: GREEN,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: GLOW,
                  }}>
                    {practice?.name || sess.practiceId}
                  </span>
                  {/* Duration */}
                  <span style={{ color: TEXT_DIM, flexShrink: 0 }}>
                    {sess.durationMin}m
                  </span>
                  {/* Separator */}
                  <span style={{ color: TEXT_MUTED }}>
                    //
                  </span>
                  {/* XP */}
                  <span style={{
                    color: GREEN,
                    fontWeight: 'bold',
                    textShadow: GLOW,
                    flexShrink: 0,
                  }}>
                    +{xp}xp
                  </span>
                </motion.div>
              )
            })}
          </MatrixCard>
        ) : (
          <MatrixCard>
            <div style={{
              fontFamily: FONT,
              fontSize: '11px',
              color: TEXT_MUTED,
              textAlign: 'center',
              padding: '20px 0',
            }}>
              {'>'} NO_DATA_FOUND<Cursor />
            </div>
          </MatrixCard>
        )}
      </div>
    </div>
  )
}
