import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import Typewriter from './Typewriter.jsx'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'

const SWIPE_THRESHOLD = 50

export default function AffirmationReader({ affirmations: propAffirmations, onClose }) {
  const [fetched, setFetched] = useState(null)

  useEffect(() => {
    if (propAffirmations) return
    fetch('/api/affirmations')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.affirmations) setFetched(data.affirmations) })
      .catch(() => {})
  }, [propAffirmations])

  const affirmations = propAffirmations || fetched
  if (!affirmations || affirmations.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <span className="text-[13px] text-white/30">Loading...</span>
      </div>
    )
  }

  return <AffirmationReaderInner affirmations={affirmations} onClose={onClose} />
}

function AffirmationReaderInner({ affirmations, onClose }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0) // -1 left, 1 right
  const [typed, setTyped] = useState(false)
  const touchRef = useRef({ x: 0, y: 0 })

  const total = affirmations.length
  const current = affirmations[index]

  const isLast = index === affirmations.length - 1

  const go = useCallback((dir) => {
    setDirection(dir)
    setTyped(false)
    setIndex((prev) => {
      const next = prev + dir
      if (next < 0) return 0
      if (next >= total) return total - 1
      if (next === prev) return prev
      sounds.swipe()
      haptics.tap()
      return next
    })
  }, [total])

  const onTouchStart = (e) => {
    const touch = e.touches[0]
    touchRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (e) => {
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchRef.current.x
    const dy = touch.clientY - touchRef.current.y

    // Only swipe if horizontal movement dominates
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) go(-1)  // swipe right = previous
      else go(1)           // swipe left = next
    }
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* X button */}
      <div className="relative z-20 flex justify-end px-4 pt-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center text-[18px] text-white/40"
        >
          ✕
        </button>
      </div>

      {/* Counter */}
      <div className="px-6">
        <p className="text-[11px] tabular-nums text-white/25 tracking-widest">
          {index + 1} / {total}
        </p>
      </div>

      {/* Affirmation */}
      <div className="flex flex-1 items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="max-w-[340px]"
          >
            <Typewriter
              text={current.text}
              typingSpeed={35}
              initialDelay={200}
              className="text-[20px] font-medium leading-[1.5] text-white"
              cursorCharacter="|"
              onComplete={() => setTyped(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Category label */}
      <div className="px-6 pb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/20">
          {current.category?.replace('-', ' ')}
        </p>
      </div>

      {/* Done button on last affirmation after typing completes */}
      {isLast && typed && (
        <motion.div
          className="px-8 pb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="w-full rounded-2xl bg-white/[0.1] py-[16px] text-[14px] font-semibold text-white"
          >
            Done
          </motion.button>
        </motion.div>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pb-10">
        {affirmations.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? 'w-5 bg-white/50' : 'w-1 bg-white/15'
            }`}
          />
        ))}
      </div>
    </motion.div>
  )
}
