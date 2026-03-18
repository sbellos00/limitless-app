// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Matrix: Combat — Tactical HUD
// Level 3: Adept
//
// Neo has graduated from the training dojo. Dual guns. Lobby scene.
// The green terminal has evolved into a weaponized targeting system.
// Tactical HUD overlays, weapons inventory, targeting reticles, ammo bars.
//
// Rules:
//   · Darker black background (#080808)
//   · Brighter neon green (#39ff14) — more aggressive than Level 2
//   · Red accent (#ff003c) for threat indicators — used SPARINGLY
//   · HexGrid canvas background (slowly rotating tactical overlay)
//   · Horizontal scanlines (2px gap, thicker, more aggressive)
//   · Targeting crosshair SVG decorations on cards
//   · Corner brackets ┌ ┐ └ ┘ on card edges
//   · Segmented ammo-style XP progress bar
//   · Status tags: [ARMED], [TARGET_LOCKED], [WEAPONS_HOT]
//   · Sharp corners everywhere — borderRadius: 0
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

const BG = '#080808'
const BG_CARD = '#0c0c0c'
const GREEN = '#39ff14'
const GREEN_DIM = '#2bcc10'
const GREEN_DARK = '#0a3300'
const GREEN_BORDER = 'rgba(57,255,20,0.15)'
const GREEN_GLOW = 'rgba(57,255,20,0.25)'
const GREEN_FILL = 'rgba(57,255,20,0.06)'
const RED = '#ff003c'
const RED_DIM = 'rgba(255,0,60,0.6)'
const RED_BORDER = 'rgba(255,0,60,0.15)'
const TEXT = '#39ff14'
const TEXT_DIM = 'rgba(57,255,20,0.55)'
const TEXT_MUTED = 'rgba(57,255,20,0.25)'
const FONT = "'JetBrains Mono', 'Courier New', monospace"
const FONT_HEADER = "'Share Tech Mono', 'JetBrains Mono', monospace"
const GLOW = `0 0 8px ${GREEN_GLOW}`
const GLOW_STRONG = `0 0 12px rgba(57,255,20,0.4), 0 0 24px rgba(57,255,20,0.15)`
const GLOW_RED = `0 0 6px rgba(255,0,60,0.4)`
const SPRING = { type: 'spring', stiffness: 300, damping: 24 }
const SPRING_FAST = { type: 'spring', stiffness: 400, damping: 20 }

// Phase accent colors — tactical green spectrum
const PHASE_COLORS = ['#39ff14', '#2edd11', '#33ff66', '#20ff88', '#55ffaa', '#39ff44']

function phaseGreen(index) {
  return PHASE_COLORS[index % PHASE_COLORS.length]
}


// ── HexGrid Canvas Background ────────────────────────────────────────────────

function HexGrid({ height = 600, opacity = 0.12 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = 320
    const H = height
    canvas.width = W
    canvas.height = H

    const HEX_SIZE = 30
    const HEX_H = HEX_SIZE * Math.sqrt(3)
    const HEX_W = HEX_SIZE * 2

    function drawHex(cx, cy) {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const x = cx + HEX_SIZE * Math.cos(angle)
        const y = cy + HEX_SIZE * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H)

      const driftX = Math.sin(t * 0.0003) * 5
      const driftY = Math.cos(t * 0.00025) * 3

      ctx.strokeStyle = GREEN
      ctx.lineWidth = 0.5

      const cols = Math.ceil(W / (HEX_W * 0.75)) + 2
      const rows = Math.ceil(H / HEX_H) + 2

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * HEX_W * 0.75 + driftX
          const y = row * HEX_H + (col % 2 === 0 ? 0 : HEX_H * 0.5) + driftY

          // Distance from center for opacity falloff
          const dx = x - W / 2
          const dy = y - H / 2
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = Math.sqrt(W * W + H * H) * 0.5
          const falloff = Math.max(0.02, 1 - (dist / maxDist) * 0.7)

          ctx.globalAlpha = 0.04 * falloff + Math.sin(t * 0.001 + col * 0.3 + row * 0.2) * 0.01
          drawHex(x, y)
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(draw)
    }

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


// ── Scanlines Overlay (horizontal, thicker) ──────────────────────────────────

function Scanlines() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.025) 3px, rgba(57,255,20,0.025) 5px)',
        mixBlendMode: 'overlay',
      }}
    />
  )
}


// ── Targeting Crosshair SVG ──────────────────────────────────────────────────

function Crosshair({ size = 40, color = GREEN, opacity: op = 0.3, style = {} }) {
  const half = size / 2
  const inner = size * 0.15
  const outer = size * 0.45
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ ...style, opacity: op, pointerEvents: 'none' }}>
      {/* Circle */}
      <circle cx={half} cy={half} r={size * 0.35}
        fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {/* Cross lines — extending from inner to outer */}
      <line x1={half} y1={half - outer} x2={half} y2={half - inner}
        stroke={color} strokeWidth="0.8" />
      <line x1={half} y1={half + inner} x2={half} y2={half + outer}
        stroke={color} strokeWidth="0.8" />
      <line x1={half - outer} y1={half} x2={half - inner} y2={half}
        stroke={color} strokeWidth="0.8" />
      <line x1={half + inner} y1={half} x2={half + outer} y2={half}
        stroke={color} strokeWidth="0.8" />
      {/* Center dot */}
      <circle cx={half} cy={half} r="1" fill={color} opacity="0.6" />
    </svg>
  )
}


// ── Tactical Card (corner brackets) ──────────────────────────────────────────

function TacticalCard({ children, style = {}, glow = false, label = null }) {
  return (
    <div
      style={{
        background: BG_CARD,
        border: `1px solid ${GREEN_BORDER}`,
        borderRadius: 0,
        padding: '14px',
        position: 'relative',
        boxShadow: glow ? `0 0 20px rgba(57,255,20,0.08)` : 'none',
        ...style,
      }}
    >
      {/* Corner brackets */}
      <span style={{
        position: 'absolute', top: -1, left: -1,
        color: GREEN, opacity: 0.3, fontSize: '14px',
        fontFamily: FONT, lineHeight: 1, pointerEvents: 'none',
      }}>&#x250C;</span>
      <span style={{
        position: 'absolute', top: -1, right: -1,
        color: GREEN, opacity: 0.3, fontSize: '14px',
        fontFamily: FONT, lineHeight: 1, pointerEvents: 'none',
      }}>&#x2510;</span>
      <span style={{
        position: 'absolute', bottom: -1, left: -1,
        color: GREEN, opacity: 0.3, fontSize: '14px',
        fontFamily: FONT, lineHeight: 1, pointerEvents: 'none',
      }}>&#x2514;</span>
      <span style={{
        position: 'absolute', bottom: -1, right: -1,
        color: GREEN, opacity: 0.3, fontSize: '14px',
        fontFamily: FONT, lineHeight: 1, pointerEvents: 'none',
      }}>&#x2518;</span>

      {/* Optional label in top-right */}
      {label && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          fontFamily: FONT,
          fontSize: '7px',
          color: RED,
          letterSpacing: '0.1em',
          opacity: 0.6,
        }}>
          {label}
        </span>
      )}
      {children}
    </div>
  )
}


// ── Tactical Button ──────────────────────────────────────────────────────────

function TacticalButton({ children, onClick, style = {}, active = false }) {
  return (
    <motion.button
      onClick={() => { haptics.tap(); onClick?.() }}
      className="transition-all"
      style={{
        background: active ? 'rgba(57,255,20,0.12)' : 'transparent',
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
        position: 'relative',
        ...style,
      }}
      whileHover={{ boxShadow: `0 0 12px rgba(57,255,20,0.15)` }}
      whileTap={{ scale: 0.98, opacity: 0.8 }}
    >
      {children}
    </motion.button>
  )
}


// ── HUD Line (data readout with [>] prefix) ─────────────────────────────────

function HudLine({ label, value, delay = 0, alert = false }) {
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
      <span style={{ color: alert ? RED : GREEN, opacity: 0.5, flexShrink: 0 }}>[&gt;]</span>
      <span style={{ color: TEXT_DIM }}>{label}</span>
      <span style={{ color: TEXT_MUTED, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {'·'.repeat(40)}
      </span>
      <span style={{
        color: alert ? RED : GREEN,
        textShadow: alert ? GLOW_RED : GLOW,
        fontWeight: 'bold',
      }}>
        {value}
      </span>
    </motion.div>
  )
}


// ── HUD Header (section label with [TARGET] prefix + scan line) ─────────────

function HudHeader({ text, prefix = 'TARGET', delay = 0 }) {
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
      <span style={{ color: RED, opacity: 0.5, fontSize: '10px' }}>[{prefix}]</span>
      <span>{text}</span>
      <div style={{
        flex: 1,
        height: '1px',
        background: `linear-gradient(to right, ${GREEN_BORDER}, transparent)`,
      }} />
    </motion.div>
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


// ── Divider ──────────────────────────────────────────────────────────────────

function HudDivider() {
  return (
    <div className="px-5 my-4">
      <div style={{
        height: '1px',
        background: `linear-gradient(to right, transparent, ${GREEN_BORDER}, transparent)`,
      }} />
    </div>
  )
}


// ── Bell Curve (Tactical) ────────────────────────────────────────────────────

function TacticalBellCurve({ sessions, level, totalXp }) {
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
    <TacticalCard>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines — faint green */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1={PAD.left} y1={yS(phi(0) * g)} x2={W - PAD.right} y2={yS(phi(0) * g)}
            stroke={GREEN} strokeWidth="0.3" opacity="0.08" strokeDasharray="2,4" />
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

        {/* Defs — gradient + glow filter */}
        <defs>
          <linearGradient id="combatFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.18" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
          </linearGradient>
          <filter id="combatGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={fillD} fill="url(#combatFillGrad)" />

        {/* Full curve — dim */}
        <path d={fullD} fill="none" stroke={GREEN} strokeWidth="0.8" opacity="0.12" />

        {/* Filled segment — bright with glow */}
        <path d={filledLineD} fill="none" stroke={GREEN} strokeWidth="2"
          strokeLinecap="round" filter="url(#combatGlow)" />

        {/* User marker vertical — glowing dashed */}
        <line x1={userSx} y1={userSy + 4} x2={userSx} y2={baseY}
          stroke={GREEN} strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2" />

        {/* Crosshair at user position */}
        <circle cx={userSx} cy={userSy} r="6"
          fill="none" stroke={RED} strokeWidth="0.6" opacity="0.4" />
        <line x1={userSx - 10} y1={userSy} x2={userSx - 4} y2={userSy}
          stroke={RED} strokeWidth="0.6" opacity="0.4" />
        <line x1={userSx + 4} y1={userSy} x2={userSx + 10} y2={userSy}
          stroke={RED} strokeWidth="0.6" opacity="0.4" />
        <line x1={userSx} y1={userSy - 10} x2={userSx} y2={userSy - 4}
          stroke={RED} strokeWidth="0.6" opacity="0.4" />
        <line x1={userSx} y1={userSy + 4} x2={userSx} y2={userSy + 10}
          stroke={RED} strokeWidth="0.6" opacity="0.4" />

        {/* User dot — glowing green */}
        <circle cx={userSx} cy={userSy} r="3.5"
          fill={GREEN} stroke="#ffffff" strokeWidth="1.5" filter="url(#combatGlow)" />
      </svg>
    </TacticalCard>
  )
}


// ── Brain Map (Tactical) ─────────────────────────────────────────────────────

function TacticalBrainMap({ phaseStats, practiceCounts }) {
  return (
    <TacticalCard style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="200" height="165" viewBox="0 0 180 155">
        {/* Hex grid background lines */}
        {[30, 50, 70, 90, 110].map(y => (
          <line key={y} x1="20" y1={y} x2="160" y2={y}
            stroke={GREEN} strokeWidth="0.3" opacity="0.05" strokeDasharray="2,6" />
        ))}
        {[40, 70, 90, 110, 140].map(x => (
          <line key={x} x1={x} y1="15" x2={x} y2="140"
            stroke={GREEN} strokeWidth="0.3" opacity="0.05" strokeDasharray="2,6" />
        ))}

        {/* Hemispheres — green wireframe */}
        <path d={LEFT_HEMI} fill="none" stroke={GREEN} strokeWidth="1" opacity="0.15" />
        <path d={RIGHT_HEMI} fill="none" stroke={GREEN} strokeWidth="1" opacity="0.15" />

        {/* Fold lines — circuit traces */}
        {LEFT_FOLDS.map((d, i) => (
          <path key={`lf${i}`} d={d} fill="none" stroke={GREEN} strokeWidth="0.4" opacity="0.07" />
        ))}
        {RIGHT_FOLDS.map((d, i) => (
          <path key={`rf${i}`} d={d} fill="none" stroke={GREEN} strokeWidth="0.4" opacity="0.07" />
        ))}

        {/* Central fissure */}
        <line x1="90" y1="16" x2="90" y2="126" stroke={GREEN} strokeWidth="0.5" opacity="0.1" />

        {/* Center crosshair */}
        <circle cx="90" cy="70" r="8" fill="none" stroke={RED} strokeWidth="0.5" opacity="0.2" />
        <line x1="82" y1="70" x2="86" y2="70" stroke={RED} strokeWidth="0.5" opacity="0.2" />
        <line x1="94" y1="70" x2="98" y2="70" stroke={RED} strokeWidth="0.5" opacity="0.2" />
        <line x1="90" y1="62" x2="90" y2="66" stroke={RED} strokeWidth="0.5" opacity="0.2" />
        <line x1="90" y1="74" x2="90" y2="78" stroke={RED} strokeWidth="0.5" opacity="0.2" />

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
                {/* Targeting ring on high-count nodes */}
                {count >= 10 && (
                  <circle cx={pos.x} cy={pos.y} r={r + 2}
                    fill="none" stroke={RED} strokeWidth="0.4" opacity={0.25} />
                )}
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill={count > 0 ? GREEN : '#111'}
                  opacity={opacity}
                  stroke={count > 0 ? GREEN : 'rgba(57,255,20,0.1)'}
                  strokeWidth={count >= 5 ? 1 : 0.5}
                />
              </g>
            )
          })
        )}
      </svg>
    </TacticalCard>
  )
}


// ── Spider Chart (Tactical) ──────────────────────────────────────────────────

function TacticalSpiderChart({ practiceCounts }) {
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
    <TacticalCard style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 260 }}>
        <defs>
          <filter id="combatSpiderGlow">
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
              opacity={g === 1 ? 0.2 : 0.06}
              strokeDasharray={g < 1 ? '2,4' : 'none'}
            />
          )
        })}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const end = toXY(a, R)
          return (
            <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={GREEN} strokeWidth="0.5" opacity="0.08" />
          )
        })}

        {/* Center crosshair */}
        <circle cx={cx} cy={cy} r="6" fill="none" stroke={RED} strokeWidth="0.4" opacity="0.2" />
        <line x1={cx - 10} y1={cy} x2={cx - 4} y2={cy} stroke={RED} strokeWidth="0.4" opacity="0.2" />
        <line x1={cx + 4} y1={cy} x2={cx + 10} y2={cy} stroke={RED} strokeWidth="0.4" opacity="0.2" />
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy - 4} stroke={RED} strokeWidth="0.4" opacity="0.2" />
        <line x1={cx} y1={cy + 4} x2={cx} y2={cy + 10} stroke={RED} strokeWidth="0.4" opacity="0.2" />

        {/* Data fill — green glow */}
        <polygon points={dataPoly}
          fill={GREEN} fillOpacity="0.06"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter="url(#combatSpiderGlow)" />

        {/* Data points + labels */}
        {SKILL_AXES.map((axis, i) => {
          const pt = dataPoints[i]
          const labelPt = toXY(angles[i], R + 20)
          return (
            <g key={axis.name}>
              {/* Glowing dot */}
              <circle cx={pt.x} cy={pt.y} r="3.5"
                fill={GREEN} stroke="#ffffff" strokeWidth="1"
                filter="url(#combatSpiderGlow)" opacity="0.8" />
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
    </TacticalCard>
  )
}


// ── Discipline Bars (Tactical Style) ─────────────────────────────────────────

function TacticalDisciplineBar({ phase, phaseIndex, practiceCounts, sessions }) {
  const [expanded, setExpanded] = useState(false)
  const tried = new Set(
    sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).map(s => s.practiceId)
  )
  const pct = Math.round((tried.size / phase.practices.length) * 100)
  const totalSessions = sessions.filter(s => phase.practices.some(p => p.id === s.practiceId)).length

  // Build segmented ammo bar
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
              color: RED,
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
              opacity: 0.5,
            }}>
              v
            </span>
          </div>
        </div>

        {/* Ammo-style progress bar */}
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
          <span style={{ color: pct === 100 ? RED : TEXT_DIM, marginLeft: '6px', fontSize: '9px' }}>
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
                const miniBar = count >= 10 ? '\u2588\u2588\u2588\u2588'
                  : count >= 5 ? '\u2588\u2588\u2588\u2591'
                  : count >= 3 ? '\u2588\u2588\u2591\u2591'
                  : count >= 1 ? '\u2588\u2591\u2591\u2591'
                  : '\u2591\u2591\u2591\u2591'

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
                      {count > 0 ? '[>] ' : '    '}{practice.name}
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

export function InkHomeScreen({ sessions, stats, onSeed, onCheckIn, theme }) {
  const { level, streak, totalXp, phaseStats, uniquePractices } = stats

  const lvlProgress = level.next
    ? Math.min(((totalXp - level.minXp) / (level.next.minXp - level.minXp)) * 100, 100)
    : 100

  const betterThan = sessions.length > 0
    ? Math.min(99.9, Math.max(50, 0.5 * (1 + erf((totalXp) / (3000 * Math.SQRT2))) * 100))
    : 50

  const charImage = getProgressImage(level.idx, lvlProgress)

  // Segmented ammo bar (20 segments)
  const ammoSegments = useMemo(() => {
    const total = 20
    const filled = Math.round((lvlProgress / 100) * total)
    return Array.from({ length: total }, (_, i) => i < filled)
  }, [lvlProgress])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <HexGrid height={800} opacity={0.1} />

      {/* ── TERMINAL HEADER ── */}
      <div className="px-5 pt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* System path */}
          <div style={{
            fontFamily: FONT,
            fontSize: '9px',
            color: TEXT_MUTED,
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}>
            COMBAT://MENTAL_FITNESS/v3.0
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

            {/* ARMED status — blinking RED */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: RED,
                textShadow: GLOW_RED,
                border: `1px solid ${RED_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: RED,
                display: 'inline-block',
                boxShadow: GLOW_RED,
              }} />
              ARMED
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
            boxShadow: `0 0 30px rgba(57,255,20,0.08)`,
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
              background: 'linear-gradient(180deg, rgba(57,255,20,0.05) 0%, rgba(57,255,20,0.12) 100%)',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }} />
            {/* Scanline overlay on image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 5px)',
              pointerEvents: 'none',
            }} />
            {/* Crosshair overlay centered on image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <Crosshair size={80} color={RED} opacity={0.2} />
            </div>
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

      {/* ── STATUS READOUT ── */}
      <div className="px-5 mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
        >
          <TacticalCard glow label="SYS_STATUS">
            <div style={{
              fontFamily: FONT,
              fontSize: '9px',
              color: TEXT_MUTED,
              marginBottom: '8px',
              letterSpacing: '0.12em',
            }}>
              [&gt;] SYSTEM_STATUS <Cursor />
            </div>

            <HudLine label="LEVEL" value={level.name.toUpperCase()} delay={0.2} />
            <HudLine label="TIER" value={level.tier || 'INITIATE'} delay={0.25} />
            <HudLine label="XP" value={totalXp.toLocaleString()} delay={0.3} />
            <HudLine label="STREAK" value={streak > 0 ? `${streak}d` : 'N/A'} delay={0.35} alert={streak === 0} />
            <HudLine label="PRACTICES" value={`${uniquePractices}`} delay={0.4} />
            <HudLine label="SESSIONS" value={String(sessions.length)} delay={0.45} />
          </TacticalCard>
        </motion.div>
      </div>

      {/* ── SEGMENTED AMMO XP BAR ── */}
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
        {/* Segmented ammo bar */}
        <div style={{
          display: 'flex',
          gap: '2px',
          width: '100%',
        }}>
          {ammoSegments.map((filled, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '6px',
                background: filled
                  ? GREEN
                  : 'rgba(57,255,20,0.06)',
                boxShadow: filled
                  ? `0 0 4px ${GREEN}, 0 0 8px rgba(57,255,20,0.2)`
                  : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            />
          ))}
        </div>
        <div style={{
          fontFamily: FONT,
          fontSize: '8px',
          color: TEXT_MUTED,
          marginTop: '3px',
          letterSpacing: '0.1em',
        }}>
          [MAG] {Math.round(lvlProgress)}% LOADED
        </div>
      </div>

      <HudDivider />

      {/* ── DISTRIBUTION ── */}
      <div className="px-5 relative z-10">
        <HudHeader text="THREAT_DISTRIBUTION" prefix="LOCKED" delay={0.3} />
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
            [&gt;] PERCENTILE_RANK
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
        <TacticalBellCurve sessions={sessions} level={level} totalXp={totalXp} />
      </div>

      <HudDivider />

      {/* ── CHECK-INS ── */}
      <div className="px-5 relative z-10">
        <HudHeader text="TACTICAL_OPS" prefix="TARGET" delay={0.4} />
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
                position: 'relative',
              }}
              whileHover={{ borderColor: GREEN, boxShadow: `0 0 8px rgba(57,255,20,0.1)` }}
              whileTap={{ scale: 0.97, opacity: 0.7 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: 0.4 + i * 0.04 }}
            >
              <span style={{
                fontSize: '8px',
                color: RED,
                display: 'block',
                marginBottom: '2px',
                letterSpacing: '0.1em',
                opacity: 0.5,
              }}>
                TGT_{String(i + 1).padStart(2, '0')}
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

    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function InkStatsScreen({ sessions, stats, theme }) {
  const { level, totalXp, practiceCounts, phaseStats, streak } = stats

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <HexGrid height={400} opacity={0.06} />

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
            COMBAT://ANALYSIS_MODULE
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: TEXT_DIM,
                letterSpacing: '0.12em',
              }}>
                [&gt;] COMBAT_ANALYTICS
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
                color: RED,
                textShadow: GLOW_RED,
                border: `1px solid ${RED_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: RED,
                display: 'inline-block',
              }} />
              SCAN
            </motion.div>
          </div>
        </motion.div>
      </div>

      <HudDivider />

      {/* ── BRAIN MAP ── */}
      <div className="px-5 relative z-10">
        <HudHeader text="NEURAL_MAP" prefix="LOCKED" />
        <TacticalBrainMap phaseStats={phaseStats} practiceCounts={practiceCounts} />

        {/* Phase legend — tactical style */}
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

      <HudDivider />

      {/* ── SPIDER CHART ── */}
      <div className="px-5 relative z-10">
        <HudHeader text="WEAPONS_ARRAY" prefix="TARGET" />
        <TacticalSpiderChart practiceCounts={practiceCounts} />
      </div>

      <HudDivider />

      {/* ── DISCIPLINE BARS ── */}
      <div className="px-5 pb-8 relative z-10">
        <HudHeader text="ARSENAL" prefix="ARMED" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PHASES.map((phase, i) => (
            <TacticalDisciplineBar
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

export function InkTrainScreen({ data, stats, onLog, onCheckIn, theme }) {
  const { sessions } = data
  const { level } = stats
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative"
      style={{ background: BG }}>

      <Scanlines />
      <HexGrid height={350} opacity={0.05} />

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
            COMBAT://TRAINING_PROTOCOL
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: TEXT_DIM,
                letterSpacing: '0.12em',
              }}>
                [&gt;] WEAPONS_HOT
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
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: RED,
                textShadow: GLOW_RED,
                border: `1px solid ${RED_BORDER}`,
                padding: '3px 8px',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: RED,
                display: 'inline-block',
              }} />
              LIVE
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── ENGAGE TARGET BUTTON ── */}
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
              background: 'rgba(57,255,20,0.08)',
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
              boxShadow: `0 0 20px rgba(57,255,20,0.1), inset 0 0 20px rgba(57,255,20,0.03)`,
              textAlign: 'left',
              position: 'relative',
            }}
            whileHover={{
              boxShadow: `0 0 30px rgba(57,255,20,0.2), inset 0 0 30px rgba(57,255,20,0.05)`,
            }}
            whileTap={{ scale: 0.98, opacity: 0.8 }}
          >
            <span style={{ opacity: 0.4, fontSize: '10px', display: 'block', marginBottom: '2px', color: RED }}>
              [ARMED] FIRE_WHEN_READY
            </span>
            ENGAGE_TARGET
            {/* Crosshair decoration */}
            <span style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <Crosshair size={24} color={RED} opacity={0.3} />
            </span>
          </motion.button>
        </motion.div>
      </div>

      <HudDivider />

      {/* ── CHECK-INS ── */}
      <div className="px-5 relative z-10">
        <HudHeader text="TACTICAL_OPS" prefix="TARGET" />
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
              whileHover={{ borderColor: GREEN, boxShadow: `0 0 8px rgba(57,255,20,0.1)` }}
              whileTap={{ scale: 0.97, opacity: 0.7 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_FAST, delay: i * 0.04 }}
            >
              <span style={{
                fontSize: '8px',
                color: RED,
                display: 'block',
                marginBottom: '2px',
                letterSpacing: '0.1em',
                opacity: 0.5,
              }}>
                TGT_{String(i + 1).padStart(2, '0')}
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

      <HudDivider />

      {/* ── SESSION HISTORY ── */}
      <div className="px-5 pb-8 relative z-10">
        <HudHeader text="ENGAGEMENT_LOG" prefix="INTEL" />

        {recent.length > 0 ? (
          <TacticalCard>
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
              [&gt;] DISPLAYING {recent.length} TARGETS_ACQUIRED <Cursor />
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
                    borderBottom: idx < recent.length - 1 ? `1px solid rgba(57,255,20,0.06)` : 'none',
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
                  <span style={{ color: RED, opacity: 0.4 }}>
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
          </TacticalCard>
        ) : (
          <TacticalCard>
            <div style={{
              fontFamily: FONT,
              fontSize: '11px',
              color: TEXT_MUTED,
              textAlign: 'center',
              padding: '20px 0',
            }}>
              [NO_TARGETS_ACQUIRED]<Cursor />
            </div>
          </TacticalCard>
        )}
      </div>
    </div>
  )
}
