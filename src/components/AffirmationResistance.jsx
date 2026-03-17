import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'

const MAX_SCORE = 10
const SETTLE_DELAY = 1500

// Generate a wobbly ellipse path (hand-drawn feel)
function wobbleOrbitPath(cx, cy, rx, ry, seed) {
  const points = 60
  const parts = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    // Deterministic wobble from seed
    const wobble = Math.sin(angle * 3 + seed * 7) * 4 + Math.cos(angle * 5 + seed * 3) * 3
    const x = cx + (rx + wobble) * Math.cos(angle)
    const y = cy + (ry + wobble * 0.7) * Math.sin(angle)
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

export default function AffirmationResistance({ affirmation, onComplete }) {
  const [score, setScore] = useState(0)
  const [settled, setSettled] = useState(false)
  const [tapFlash, setTapFlash] = useState(0)
  const settleTimer = useRef(null)

  const progress = useMotionValue(0)

  // Background darkens smoothly (intended feel)
  const bgColor = useTransform(progress, [0, 1], ['#ffffff', '#1a1a1a'])
  // UI elements flip between score 5 (0.5) and 6 (0.6) — never on an integer tap
  const FLIP = [0, 0.549, 0.551, 1]
  const textColor = useTransform(progress, FLIP, ['#000000', '#000000', '#ffffff', '#ffffff'])
  const mutedColor = useTransform(progress, FLIP, [
    'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)',
    'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)'
  ])
  const btnBg = useTransform(progress, FLIP, [
    'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)',
    'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'
  ])
  const scoreFaint = useTransform(progress, FLIP, [
    'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.12)',
    'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'
  ])
  const orbitStroke = useTransform(progress, FLIP, [
    'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)',
    'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.45)'
  ])
  const flashBg = useTransform(progress, FLIP, [
    'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15), transparent 60%)',
    'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15), transparent 60%)',
    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 60%)',
    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 60%)',
  ])

  // Pre-generate 10 orbit paths with different sizes and wobble seeds
  const orbits = useMemo(() => {
    const cx = 200
    const cy = 200
    return Array.from({ length: MAX_SCORE }, (_, i) => {
      const t = (i + 1) / MAX_SCORE
      const rx = 30 + t * 160
      const ry = 25 + t * 150
      return wobbleOrbitPath(cx, cy, rx, ry, i)
    })
  }, [])

  useEffect(() => {
    animate(progress, score / MAX_SCORE, { type: 'spring', stiffness: 80, damping: 18 })
  }, [score, progress])

  useEffect(() => {
    return () => { if (settleTimer.current) clearTimeout(settleTimer.current) }
  }, [])

  const resetSettleTimer = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      setSettled(true)
      sounds.resistanceSettle()
    }, SETTLE_DELAY)
  }

  const handleTap = (e) => {
    if (settled) return
    const y = e.clientY || 0
    if (y < window.innerHeight * 0.3) return

    const next = Math.min(score + 1, MAX_SCORE)
    setScore(next)
    setTapFlash((f) => f + 1)
    sounds.resistanceTap()
    haptics.tap()

    if (next >= MAX_SCORE) {
      if (settleTimer.current) clearTimeout(settleTimer.current)
      setSettled(true)
      sounds.resistanceSettle()
      haptics.heavy()
    } else {
      resetSettleTimer()
    }
  }

  const adjust = (delta) => {
    const next = Math.min(MAX_SCORE, Math.max(0, score + delta))
    setScore(next)
    sounds.tap()
    haptics.tap()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      onClick={!settled ? handleTap : undefined}
    >
      {/* Orbits SVG — centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg
          viewBox="0 0 400 400"
          className="w-[min(90vw,90vh)] h-[min(90vw,90vh)]"
          style={{ opacity: 0.9 }}
        >
          {orbits.map((path, i) => (
            <motion.path
              key={i}
              d={path}
              fill="none"
              style={{ stroke: orbitStroke }}
              strokeWidth={3.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                i < score
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                pathLength: { duration: 0.5, ease: 'easeOut' },
                opacity: { duration: 0.2 },
              }}
            />
          ))}
        </motion.svg>
      </div>

      {/* Tap flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: flashBg }}
        key={tapFlash}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        <motion.p
          className="px-6 pt-16 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: mutedColor }}
        >
          Resistance
        </motion.p>

        <div className="flex flex-1 items-center justify-center px-6">
          <motion.p
            className="max-w-[320px] text-center text-[22px] font-semibold leading-[1.35]"
            style={{ color: textColor }}
            key={tapFlash}
            initial={{ scale: 1.04, x: tapFlash % 2 === 0 ? 6 : -6 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {affirmation?.text}
          </motion.p>
        </div>

        <div className="flex justify-center pb-3">
          <motion.span
            className="text-[80px] font-black tabular-nums leading-none"
            style={{ color: scoreFaint }}
            key={`s-${score}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {score}
          </motion.span>
        </div>

        <div className="px-6 pb-12">
          {settled ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="flex items-center gap-5">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); adjust(-1) }}
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: btnBg }}
                >
                  <motion.span className="text-[22px] font-semibold leading-none" style={{ color: textColor }}>-</motion.span>
                </motion.button>

                <motion.span
                  className="text-[32px] font-bold tabular-nums min-w-[90px] text-center"
                  style={{ color: textColor }}
                  key={score}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {score}
                </motion.span>

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); adjust(1) }}
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: btnBg }}
                >
                  <motion.span className="text-[22px] font-semibold leading-none" style={{ color: textColor }}>+</motion.span>
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={(e) => { e.stopPropagation(); onComplete?.(score) }}
                className="w-full rounded-2xl py-[18px] text-[15px] font-semibold"
                style={{ backgroundColor: btnBg, color: textColor }}
              >
                Continue
              </motion.button>
            </motion.div>
          ) : (
            <motion.p
              className="text-center text-[13px] pb-2"
              style={{ color: mutedColor }}
            >
              Tap to add resistance
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
