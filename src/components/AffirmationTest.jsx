import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import AffirmationConviction from './AffirmationConviction.jsx'
import AffirmationResistance from './AffirmationResistance.jsx'
import FuzzyText from './FuzzyText.jsx'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'

const CONVICTION_LETTERS = 'CONVICTION'.split('')

// ── Conviction Intro ────────────────────────────────────────────────────────

function ConvictionIntro({ onStart }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute left-1/2 bottom-0 w-[1px] -translate-x-1/2 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)' }}
        initial={{ height: 0 }}
        animate={{ height: '70vh' }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex items-baseline tracking-[0.25em]">
          {CONVICTION_LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              className="text-[32px] font-extralight text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        <motion.div
          className="mt-6 h-[1px] bg-white/10"
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
        />

        <motion.p
          className="mt-6 max-w-[240px] text-center text-[13px] leading-[1.7] font-light text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
        >
          The longer you hold, the deeper it becomes yours.
        </motion.p>
      </div>

      <motion.div
        className="px-8 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { sounds.phaseTransition(); haptics.tap(); onStart() }}
          className="w-full rounded-2xl border border-white/10 py-[16px] text-[13px] font-medium tracking-widest uppercase text-white/50"
        >
          Begin
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Resistance Intro ────────────────────────────────────────────────────────

function ResistanceIntro({ onStart }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-white select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FuzzyText
            fontSize="clamp(2rem, 10vw, 3.5rem)"
            fontWeight={900}
            fontFamily="'Playfair Display', serif"
            color="#000"
            baseIntensity={0.3}
            hoverIntensity={0.6}
            enableHover
            fuzzRange={25}
            direction="both"
            letterSpacing={4}
          >
            RESISTANCE
          </FuzzyText>
        </motion.div>

        <motion.p
          className="mt-4 max-w-[240px] text-center text-[13px] leading-[1.7] font-light text-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Name the friction. Each tap is honest.
        </motion.p>
      </div>

      <motion.div
        className="px-8 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { sounds.phaseTransition(); haptics.tap(); onStart() }}
          className="w-full rounded-2xl border border-black/10 py-[16px] text-[13px] font-medium tracking-widest uppercase text-black/50"
        >
          Begin
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Main Flow ───────────────────────────────────────────────────────────────

export default function AffirmationTest({ affirmations, onSave, onBack }) {
  const [phase, setPhase] = useState('conviction-intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState({})
  const [saving, setSaving] = useState(false)

  const total = affirmations?.length || 0
  const current = affirmations?.[currentIndex]

  const handleComplete = (score) => {
    const mode = phase === 'conviction' ? 'conviction' : 'resistance'
    setResults((prev) => ({
      ...prev,
      [current.index]: { ...prev[current.index], [mode]: score }
    }))

    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    } else if (phase === 'conviction') {
      sounds.phaseTransition()
      haptics.tap()
      setPhase('resistance-intro')
      setCurrentIndex(0)
    } else {
      sounds.complete()
      haptics.success()
      setPhase('done')
    }
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSave?.(results)
    } catch {
      // parent handles errors
    } finally {
      setSaving(false)
    }
  }

  if (!affirmations || total === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <span className="text-[13px] text-white/30">No affirmations loaded</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={onBack}
        className="fixed top-0 right-0 z-[60] flex h-12 w-12 items-center justify-center text-[18px] font-light"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <span className="text-white/40 mix-blend-difference">✕</span>
      </button>

      <AnimatePresence mode="wait">
        {phase === 'conviction-intro' && (
          <ConvictionIntro key="ci" onStart={() => setPhase('conviction')} />
        )}
        {phase === 'conviction' && current && (
          <AffirmationConviction
            key={`c-${current.index}`}
            affirmation={current}
            onComplete={handleComplete}
          />
        )}
        {phase === 'resistance-intro' && (
          <ResistanceIntro key="ri" onStart={() => setPhase('resistance')} />
        )}
        {phase === 'resistance' && current && (
          <AffirmationResistance
            key={`r-${current.index}`}
            affirmation={current}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>

      {phase === 'done' && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-1 flex-col px-6 pb-10 overflow-y-auto">
            <div className="pt-16">
              <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-white/25">
                Complete
              </p>
              <h1 className="mt-2 text-[24px] font-semibold text-white">
                Check-in done
              </h1>
            </div>

            <div className="mt-8 space-y-3">
              {affirmations.map((aff) => {
                const r = results[aff.index]
                return (
                  <div key={aff.index} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-[13px] text-white/70 leading-relaxed">{aff.text}</p>
                    <div className="mt-2 flex gap-3 text-[12px]">
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 tabular-nums text-white/50">
                        C {r?.conviction != null ? r.conviction.toFixed(1) : '—'}
                      </span>
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 tabular-nums text-white/50">
                        R {r?.resistance != null ? r.resistance : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-auto pt-8">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-white/[0.08] py-[18px] text-[15px] font-semibold text-white"
              >
                {saving ? 'Saving…' : 'Save Check-in'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
