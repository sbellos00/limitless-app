import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import BadgeDetailSheet from './BadgeDetailSheet.jsx'

const TIER_NAMES = ['', 'Initiate', 'Apprentice', 'Practitioner', 'Adept', 'Master']
const TIER_XP = [0, 0, 750, 3000, 10000, 30000]

function BadgeCard({ badge, progress, onSelect }) {
  const xp = progress?.xp || 0
  const tier = progress?.tier || 1
  const streak = progress?.currentStreak || 0
  const nextTier = tier < 5 ? tier + 1 : null
  const nextXp = nextTier ? TIER_XP[nextTier] : null
  const prevXp = TIER_XP[tier]
  const progressPct = nextXp ? Math.min(((xp - prevXp) / (nextXp - prevXp)) * 100, 100) : 100

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl bg-white/[0.03]"
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* Header */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.tap()
          onSelect?.()
        }}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
          <span className="text-[20px]">{badge.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-white truncate">{badge.name}</span>
            {streak >= 7 && (
              <span className="text-[11px] font-medium text-amber-400/80">{streak}d</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="text-[11px] font-medium text-white/25">{TIER_NAMES[tier]}</span>
            <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full bg-white/20"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-white/20">{xp}</span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  )
}

export default function BadgesTab() {
  const [badges, setBadges] = useState(null)
  const [progress, setProgress] = useState(null)
  const [missions, setMissions] = useState(null)
  const [badgeDaily, setBadgeDaily] = useState(null)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/badges').then((r) => r.ok ? r.json() : null),
      fetch('/api/badge-progress').then((r) => r.ok ? r.json() : null),
      fetch('/api/badge-missions').then((r) => r.ok ? r.json() : null),
      fetch('/api/badge-daily').then((r) => r.ok ? r.json() : null),
    ])
      .then(([b, p, m, d]) => {
        if (b) setBadges(b)
        if (p) setProgress(p)
        if (m) setMissions(m)
        if (d) setBadgeDaily(d)
        if (!b) setError(true)
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-[15px] text-white/25">
        Could not load badges.
      </div>
    )
  }

  if (!badges) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  const totalXp = badges.badges.reduce((sum, b) => sum + (progress?.badges?.[b.slug]?.xp || 0), 0)
  const avgTier = badges.badges.reduce((sum, b) => sum + (progress?.badges?.[b.slug]?.tier || 1), 0) / badges.badges.length
  const activeMissions = missions?.active?.filter((m) => m.status === 'pending').length || 0

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[28px] font-bold tracking-tight">Badges</h1>
        <div className="mt-2 flex items-center gap-3 text-[13px] text-white/25">
          <span>{totalXp} XP</span>
          <span className="h-1 w-1 rounded-full bg-white/10" />
          <span>Tier {avgTier.toFixed(1)}</span>
          <span className="h-1 w-1 rounded-full bg-white/10" />
          <span>{activeMissions} active</span>
        </div>
      </div>

      {/* Badge list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-2">
        {badges.badges.map((badge) => (
          <BadgeCard
            key={badge.slug}
            badge={badge}
            progress={progress?.badges?.[badge.slug]}
            onSelect={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      <BadgeDetailSheet
        badge={selectedBadge}
        progress={progress?.badges?.[selectedBadge?.slug]}
        missions={missions}
        badgeDaily={badgeDaily}
        onClose={() => setSelectedBadge(null)}
        onExerciseDone={() => {
          fetch('/api/badge-daily').then((r) => r.ok ? r.json() : null).then((d) => d && setBadgeDaily(d))
          fetch('/api/badge-progress').then((r) => r.ok ? r.json() : null).then((p) => p && setProgress(p))
        }}
        onMissionComplete={() => {
          fetch('/api/badge-missions').then((r) => r.ok ? r.json() : null).then((m) => m && setMissions(m))
          fetch('/api/badge-progress').then((r) => r.ok ? r.json() : null).then((p) => p && setProgress(p))
        }}
        onMissionsAssigned={() => {
          fetch('/api/badge-missions').then((r) => r.ok ? r.json() : null).then((m) => m && setMissions(m))
        }}
      />
    </div>
  )
}
