import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { sounds } from '../utils/sounds'
import { haptics } from '../utils/haptics'
import { AppleBorderGradient } from './check-ins/AppleBorderGradient'
import MagicRings from './check-ins/MagicRings'
import MetaBalls from './check-ins/MetaBalls'
import ElectricBorder from './check-ins/ElectricBorder'
import ShapeBlur from './check-ins/ShapeBlur'

// ── Shared flow hook ─────────────────────────────────────────────────────────
// ready → playing (animation) → completing (fade out) → done

function useCheckInFlow(onDone, checkIn, duration = 1800) {
  const [phase, setPhase] = useState('ready')

  const handleBegin = useCallback(() => {
    setPhase('playing')
    haptics.success()
    sounds.tap()

    setTimeout(() => {
      setPhase('completing')
      sounds.complete()
      setTimeout(() => onDone(checkIn), 600)
    }, duration)
  }, [onDone, checkIn, duration])

  return { phase, handleBegin }
}

// ── Ready screen (shared) ────────────────────────────────────────────────────

function ReadyScreen({ checkIn, onBegin, onBack, theme }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8"
      style={{ background: '#0a0a0a' }}>
      <motion.div className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-[10px] uppercase tracking-[0.3em] mb-4"
          style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}>
          Check-In
        </p>
        <h2 className="text-[22px] font-light leading-snug mb-12"
          style={{ color: theme?.text || 'white', fontFamily: theme?.fontHeader }}>
          {checkIn.label}
        </h2>
        <motion.button
          onClick={onBegin}
          className="px-10 py-3.5 rounded-2xl text-[14px] font-medium active:scale-[0.97] transition-transform"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: theme?.text || 'white',
            fontFamily: theme?.fontBody,
          }}
          whileTap={{ scale: 0.95 }}
        >
          Begin
        </motion.button>
        <button
          onClick={onBack}
          className="mt-8 text-[12px] transition-opacity active:opacity-50"
          style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}
        >
          Cancel
        </button>
      </motion.div>
    </div>
  )
}

// ── Mind — Apple Border Gradient ─────────────────────────────────────────────

function MindCheckIn({ checkIn, onDone, onBack, theme }) {
  const { phase, handleBegin } = useCheckInFlow(onDone, checkIn, 2200)

  if (phase === 'ready') return <ReadyScreen checkIn={checkIn} onBegin={handleBegin} onBack={onBack} theme={theme} />

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <AppleBorderGradient preview={true} intensity="xl" />
      </motion.div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <motion.p
          className="text-[13px] uppercase tracking-[0.4em]"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: theme?.fontBody }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.2, times: [0, 0.2, 0.7, 1] }}
        >
          Checking in...
        </motion.p>
      </div>
    </motion.div>
  )
}

// ── Energy — MetaBalls float then get absorbed to center ─────────────────────

function EnergyCheckIn({ checkIn, onDone, onBack, theme }) {
  const [phase, setPhase] = useState('ready')
  const color = theme?.accent || '#60A5FA'

  const handleBegin = useCallback(() => {
    setPhase('playing')
    haptics.success()
    sounds.tap()
    setTimeout(() => {
      setPhase('completing')
      sounds.complete()
      setTimeout(() => onDone(checkIn), 600)
    }, 2500)
  }, [onDone, checkIn])

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* MetaBalls: float freely during ready, converge to center during playing */}
      <div className="absolute inset-0">
        <MetaBalls
          color={color}
          speed={0.4}
          enableMouseInteraction={false}
          ballCount={14}
          animationSize={28}
          cursorBallSize={2}
          cursorBallColor={color}
          enableTransparency={true}
          clumpFactor={1.2}
          attractToCenter={phase === 'playing' || phase === 'completing'}
        />
      </div>

      {/* UI overlay — only during ready phase */}
      {phase === 'ready' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
          <motion.div className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-[10px] uppercase tracking-[0.3em] mb-4"
              style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}>
              Check-In
            </p>
            <h2 className="text-[22px] font-light leading-snug mb-12"
              style={{ color: theme?.text || 'white', fontFamily: theme?.fontHeader }}>
              {checkIn.label}
            </h2>
            <motion.button
              onClick={handleBegin}
              className="px-10 py-3.5 rounded-2xl text-[14px] font-medium active:scale-[0.97] transition-transform"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: theme?.text || 'white',
                fontFamily: theme?.fontBody,
              }}
              whileTap={{ scale: 0.95 }}
            >
              Begin
            </motion.button>
            <button onClick={onBack}
              className="mt-8 text-[12px] transition-opacity active:opacity-50"
              style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}>
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ── Body Scan — Magic Rings ──────────────────────────────────────────────────

function BodyScanCheckIn({ checkIn, onDone, onBack, theme }) {
  const { phase, handleBegin } = useCheckInFlow(onDone, checkIn, 2500)
  const color = theme?.accent || '#60A5FA'
  const colorTwo = theme?.accentAlt || color

  if (phase === 'ready') return <ReadyScreen checkIn={checkIn} onBegin={handleBegin} onBack={onBack} theme={theme} />

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <MagicRings
          color={color}
          colorTwo={colorTwo}
          ringCount={5}
          speed={0.8}
          baseRadius={0.2}
          radiusStep={0.08}
          opacity={0.9}
          clickBurst={false}
        />
      </motion.div>
    </motion.div>
  )
}

// ── Senses — ShapeBlur ───────────────────────────────────────────────────────

function SensesCheckIn({ checkIn, onDone, onBack, theme }) {
  const [phase, setPhase] = useState('ready')

  const handleBegin = useCallback(() => {
    setPhase('playing')
    haptics.success()
    sounds.tap()
    setTimeout(() => {
      setPhase('completing')
      sounds.complete()
      setTimeout(() => onDone(checkIn), 600)
    }, 3000)
  }, [onDone, checkIn])

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ShapeBlur: luminous shape drifts through sweep/oscillate/orbit patterns */}
      <div className="absolute inset-0">
        <ShapeBlur
          variation={1}
          shapeSize={1.0}
          roundness={0.5}
          borderSize={0.05}
          circleSize={0.4}
          circleEdge={0.6}
          autoAnimateSpeed={phase === 'ready' ? 0.3 : 0.6}
          autoAnimateRange={phase === 'ready' ? 0.25 : 0.4}
        />
      </div>

      {/* UI overlay — only during ready phase */}
      {phase === 'ready' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
          <motion.div className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-[10px] uppercase tracking-[0.3em] mb-4"
              style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}>
              Check-In
            </p>
            <h2 className="text-[22px] font-light leading-snug mb-12"
              style={{ color: theme?.text || 'white', fontFamily: theme?.fontHeader }}>
              {checkIn.label}
            </h2>
            <motion.button
              onClick={handleBegin}
              className="px-10 py-3.5 rounded-2xl text-[14px] font-medium active:scale-[0.97] transition-transform"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: theme?.text || 'white',
                fontFamily: theme?.fontBody,
              }}
              whileTap={{ scale: 0.95 }}
            >
              Begin
            </motion.button>
            <button onClick={onBack}
              className="mt-8 text-[12px] transition-opacity active:opacity-50"
              style={{ color: theme?.textMuted || 'rgba(255,255,255,0.4)', fontFamily: theme?.fontBody }}>
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ── FitMind — Electric Border ────────────────────────────────────────────────

function FitMindCheckIn({ checkIn, onDone, onBack, theme }) {
  const { phase, handleBegin } = useCheckInFlow(onDone, checkIn, 2000)
  const color = theme?.accent || '#60A5FA'

  if (phase === 'ready') return <ReadyScreen checkIn={checkIn} onBegin={handleBegin} onBack={onBack} theme={theme} />

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ElectricBorder color={color} speed={2} chaos={0.2} borderRadius={24}>
          <div className="px-16 py-10" style={{ background: 'rgba(0,0,0,0.8)', borderRadius: 24 }} />
        </ElectricBorder>
      </motion.div>
    </motion.div>
  )
}

// ── Psych — Liquid Mirror (SVG displacement, no camera) ──────────────────────

function PsychCheckIn({ checkIn, onDone, onBack, theme }) {
  const { phase, handleBegin } = useCheckInFlow(onDone, checkIn, 2500)
  const color = theme?.accent || '#60A5FA'

  if (phase === 'ready') return <ReadyScreen checkIn={checkIn} onBegin={handleBegin} onBack={onBack} theme={theme} />

  return (
    <motion.div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* SVG liquid displacement filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="psych-liquid" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="3" result="noise">
              <animate attributeName="baseFrequency" values="0.015;0.025;0.015" dur="4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="40"
              xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Animated liquid gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ filter: 'url(#psych-liquid)' }}
      >
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 30% 40%, ${color}44 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, ${color}33 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
            linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
          `,
        }} />
      </motion.div>

      {/* Metallic shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.1, 0.3, 0] }}
        transition={{ duration: 2.5, times: [0, 0.2, 0.5, 0.8, 1] }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(255,255,255,0.1) 60%, transparent 100%)',
        }}
      />

      {/* Grain */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay',
      }} />
    </motion.div>
  )
}

// ── Default fallback ─────────────────────────────────────────────────────────

function DefaultCheckIn({ checkIn, onDone, onBack, theme }) {
  const { phase, handleBegin } = useCheckInFlow(onDone, checkIn, 1200)

  if (phase === 'ready') return <ReadyScreen checkIn={checkIn} onBegin={handleBegin} onBack={onBack} theme={theme} />

  return (
    <motion.div
      className="flex-1 min-h-0 flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'completing' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 rounded-full"
        style={{ background: theme?.accent || '#60A5FA' }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 0] }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

// ── Main Switcher ────────────────────────────────────────────────────────────

export default function CheckInScreen({ checkIn, onDone, onBack, theme }) {
  const props = { checkIn, onDone, onBack, theme }

  switch (checkIn.id) {
    case 'mind':      return <MindCheckIn {...props} />
    case 'energy':    return <EnergyCheckIn {...props} />
    case 'body-scan': return <BodyScanCheckIn {...props} />
    case 'senses':    return <SensesCheckIn {...props} />
    case 'fitmind':   return <FitMindCheckIn {...props} />
    case 'psych':     return <PsychCheckIn {...props} />
    default:          return <DefaultCheckIn {...props} />
  }
}
