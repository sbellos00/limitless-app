import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const VISIBLE_KEY = 'limitless_bar_visible'

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function DayCountdownBar({ remainingMs, onEndDay }) {
  const [visible, setVisible] = useState(() => {
    const s = localStorage.getItem(VISIBLE_KEY)
    return s === null ? true : s === 'true'
  })

  const show = () => { setVisible(true); localStorage.setItem(VISIBLE_KEY, 'true') }
  const hide = () => { setVisible(false); localStorage.setItem(VISIBLE_KEY, 'false') }

  return (
    <>
      {/* Small trigger button — shown when bar is hidden */}
      <AnimatePresence>
        {!visible && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={show}
            className="fixed left-2 z-[200] flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[13px] text-white/60 backdrop-blur-sm"
            style={{ top: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
          >
            ⏱
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full countdown bar */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{ marginTop: '0.75rem' }}
            className="mx-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Day countdown
                </p>
                <p className="mt-1 text-[20px] font-semibold tabular-nums text-white">
                  {formatRemaining(remainingMs)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={hide}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40"
                >
                  Hide
                </button>
                <button
                  type="button"
                  onClick={onEndDay}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70"
                >
                  End day
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
