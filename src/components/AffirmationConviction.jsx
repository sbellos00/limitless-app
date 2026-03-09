import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'

const MAX_SCORE = 10
const TICK_INTERVAL = 250
const TICK_AMOUNT = 0.5

export default function AffirmationConviction({ affirmation, onComplete }) {
  const [score, setScore] = useState(0)
  const [holding, setHolding] = useState(false)
  const [settled, setSettled] = useState(false)
  const intervalRef = useRef(null)
  const scoreRef = useRef(0)
  const holdingRef = useRef(false)

  const progress = useMotionValue(0)

  const bgColor = useTransform(progress, [0, 1], ['#000000', '#ffffff'])
  const textColor = useTransform(progress, [0, 0.499, 0.501, 1], ['#ffffff', '#ffffff', '#000000', '#000000'])
  const mutedColor = useTransform(progress, [0, 0.499, 0.501, 1], [
    'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)',
    'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'
  ])
  const btnBg = useTransform(progress, [0, 0.499, 0.501, 1], [
    'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)',
    'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)'
  ])
  const scoreFaint = useTransform(progress, [0, 0.499, 0.501, 1], [
    'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)',
    'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.12)'
  ])
  const barHeight = useTransform(progress, (v) => `${v * 100}%`)
  const barBg = useTransform(progress, [0, 0.499, 0.501, 1], [
    'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)',
    'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.08)'
  ])
  const glowBg = useTransform(progress, [0, 0.499, 0.501, 1], [
    'radial-gradient(ellipse 80% 50% at 50% 85%, rgba(255,255,255,0.25), transparent)',
    'radial-gradient(ellipse 80% 50% at 50% 85%, rgba(255,255,255,0.25), transparent)',
    'radial-gradient(ellipse 80% 50% at 50% 85%, rgba(0,0,0,0.15), transparent)',
    'radial-gradient(ellipse 80% 50% at 50% 85%, rgba(0,0,0,0.15), transparent)',
  ])

  useEffect(() => {
    animate(progress, score / MAX_SCORE, { type: 'spring', stiffness: 80, damping: 18 })
  }, [score, progress])

  const startHold = useCallback((e) => {
    const y = e.clientY || e.touches?.[0]?.clientY || 0
    if (y < window.innerHeight * 0.45) return
    if (settled || scoreRef.current >= MAX_SCORE) return
    if (holdingRef.current) return

    holdingRef.current = true
    setHolding(true)
    sounds.convictionHold()
    haptics.tap()
    intervalRef.current = setInterval(() => {
      scoreRef.current = Math.min(scoreRef.current + TICK_AMOUNT, MAX_SCORE)
      setScore(scoreRef.current)
      sounds.convictionTick()
      if (scoreRef.current >= MAX_SCORE) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        holdingRef.current = false
        setHolding(false)
        setSettled(true)
        sounds.convictionSettle()
        haptics.success()
      }
    }, TICK_INTERVAL)
  }, [settled])

  const stopHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    if (scoreRef.current > 0) {
      setSettled(true)
      sounds.convictionSettle()
      haptics.tap()
    }
  }, [])

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const adjust = (delta) => {
    const next = Math.min(MAX_SCORE, Math.max(0, scoreRef.current + delta))
    scoreRef.current = next
    setScore(next)
    sounds.tap()
    haptics.tap()
    if (next === 0) setSettled(false)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      onPointerDown={!settled ? startHold : undefined}
      onPointerUp={!settled ? stopHold : undefined}
      onPointerLeave={!settled ? stopHold : undefined}
      onPointerCancel={!settled ? stopHold : undefined}
    >
      {/* Rising bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: barHeight, backgroundColor: barBg }}
      />

      {/* Glow — always mounted, opacity controlled */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: glowBg }}
        animate={holding ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
        transition={holding
          ? { duration: 1, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
        }
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        <motion.p
          className="px-6 pt-16 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: mutedColor }}
        >
          Conviction
        </motion.p>

        {/* Affirmation */}
        <div className="flex flex-1 items-center justify-center px-6">
          <motion.p
            className="max-w-[320px] text-center text-[22px] font-semibold leading-[1.35]"
            style={{ color: textColor }}
            animate={holding
              ? { scale: [1, 1.03, 1], y: [0, -4, 0] }
              : { scale: 1, y: 0 }
            }
            transition={holding
              ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
            }
          >
            {affirmation?.text}
          </motion.p>
        </div>

        {/* Score watermark */}
        <div className="flex justify-center pb-3">
          <motion.span
            className="text-[80px] font-black tabular-nums leading-none"
            style={{ color: scoreFaint }}
            animate={holding
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
            }
            transition={holding
              ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
            }
          >
            {score.toFixed(1)}
          </motion.span>
        </div>

        {/* Bottom */}
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
                  onClick={() => adjust(-0.5)}
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
                  {score.toFixed(1)}
                </motion.span>

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => adjust(0.5)}
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: btnBg }}
                >
                  <motion.span className="text-[22px] font-semibold leading-none" style={{ color: textColor }}>+</motion.span>
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onComplete?.(score)}
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
              animate={holding ? { opacity: 0 } : { opacity: 1 }}
            >
              {score > 0 ? 'Hold to raise conviction' : 'Tap & hold here'}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
