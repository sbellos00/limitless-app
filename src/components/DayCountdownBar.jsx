import { motion } from 'framer-motion'

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function DayCountdownBar({ remainingMs, onEndDay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mx-4 mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Day countdown</p>
          <p className="mt-1 text-[20px] font-semibold tabular-nums text-white">
            {formatRemaining(remainingMs)}
          </p>
        </div>
        <button
          type="button"
          onClick={onEndDay}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70"
        >
          End day
        </button>
      </div>
    </motion.div>
  )
}
