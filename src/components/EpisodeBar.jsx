import { motion } from 'framer-motion'

export default function EpisodeBar({ episode }) {
  if (!episode?.number) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 px-4 py-1.5 bg-white/[0.02]"
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/15">
        Ep. {episode.number}
      </span>
      {episode.title && (
        <>
          <span className="text-white/10">—</span>
          <span className="text-[11px] text-white/20 truncate max-w-[200px]">
            {episode.title}
          </span>
        </>
      )}
    </motion.div>
  )
}
