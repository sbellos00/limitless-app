import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import BadgeDetailSheet from './BadgeDetailSheet.jsx'

const TIER_NAMES = ['', 'Initiate', 'Apprentice', 'Warrior', 'Champion', 'Master']
const TIER_XP = [0, 0, 750, 3000, 10000, 30000]
const TIER_COLORS = ['', '#6B7280', '#60A5FA', '#A78BFA', '#F59E0B', '#EF4444']

const DISCIPLINE_COLORS = {
  'reality-distortion-field': '#FF6B6B',
  'frame-control': '#4ECDC4',
  'fearlessness': '#FF9F43',
  'aggression': '#EE5A24',
  'carefreeness': '#7ED6DF',
  'presence': '#B8E994',
  'bias-to-action': '#F8C291',
}

function DisciplineCard({ badge, progress, onSelect }) {
  const xp = progress?.xp || 0
  const tier = progress?.tier || 1
  const streak = progress?.currentStreak || 0
  const nextTier = tier < 5 ? tier + 1 : null
  const nextXp = nextTier ? TIER_XP[nextTier] : null
  const prevXp = TIER_XP[tier]
  const pct = nextXp ? Math.min(((xp - prevXp) / (nextXp - prevXp)) * 100, 100) : 100
  const color = DISCIPLINE_COLORS[badge.slug] || '#888'

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => { haptics.tap(); onSelect?.() }}
      className="flex flex-col rounded-2xl bg-white/[0.03] p-4 text-left relative overflow-hidden"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl" style={{ background: color }} />

      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{badge.emoji || '⚔️'}</span>
        <div className="flex items-center gap-1">
          {streak > 0 && (
            <span className="text-[10px] text-amber-400/60">🔥{streak}</span>
          )}
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: `${TIER_COLORS[tier]}20`, color: TIER_COLORS[tier] }}>
            {TIER_NAMES[tier]}
          </span>
        </div>
      </div>

      <span className="text-[13px] font-semibold text-white/80 mb-1">{badge.name}</span>

      {/* XP bar */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/20">{xp.toLocaleString()} XP</span>
          {nextXp && <span className="text-[10px] text-white/15">{nextXp.toLocaleString()}</span>}
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    </motion.button>
  )
}

function OverallRank({ badges, progress }) {
  if (!badges?.length) return null
  const tiers = badges.map(b => progress?.[b.slug]?.tier || 1)
  const avgTier = tiers.reduce((a, b) => a + b, 0) / tiers.length
  const totalXp = badges.reduce((sum, b) => sum + (progress?.[b.slug]?.xp || 0), 0)

  const rankName = avgTier >= 4.5 ? 'Master' : avgTier >= 3.5 ? 'Champion' : avgTier >= 2.5 ? 'Warrior' : avgTier >= 1.5 ? 'Apprentice' : 'Initiate'
  const rankColor = avgTier >= 4.5 ? '#EF4444' : avgTier >= 3.5 ? '#F59E0B' : avgTier >= 2.5 ? '#A78BFA' : avgTier >= 1.5 ? '#60A5FA' : '#6B7280'

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-5 py-4">
      <div>
        <span className="block text-[11px] uppercase tracking-widest text-white/20">Mental Rank</span>
        <span className="block text-[20px] font-bold mt-0.5" style={{ color: rankColor }}>{rankName}</span>
      </div>
      <div className="text-right">
        <span className="block text-[22px] font-bold tabular-nums text-white/60">{totalXp.toLocaleString()}</span>
        <span className="block text-[11px] text-white/20">Total XP</span>
      </div>
    </div>
  )
}

export default function MentalGame() {
  const [badges, setBadges] = useState([])
  const [progress, setProgress] = useState({})
  const [missions, setMissions] = useState({ active: [], completed: [] })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [badgesR, progressR, missionsR] = await Promise.all([
        fetch('/api/badges').then(r => r.json()),
        fetch('/api/badge-progress').then(r => r.json()),
        fetch('/api/badge-missions').then(r => r.json()),
      ])
      setBadges(badgesR.badges || [])
      setProgress(progressR.badges || {})
      setMissions(missionsR)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  const selectedBadge = selected ? badges.find(b => b.slug === selected) : null

  return (
    <div className="flex flex-1 flex-col px-6 py-6 gap-5 overflow-y-auto">
      <p className="text-[13px] font-semibold uppercase tracking-widest text-white/20">
        Mental Game
      </p>

      {/* Overall rank */}
      <OverallRank badges={badges} progress={progress} />

      {/* Active missions */}
      {missions.active?.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-white/25 mb-2">🎯 Active Missions</p>
          <div className="space-y-2">
            {missions.active.filter(m => m.status === 'pending').slice(0, 3).map(m => (
              <div key={m.missionId} className="rounded-xl bg-amber-500/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/50">{m.title}</span>
                  <span className="text-[10px] text-amber-400/60">+{m.rewardXp} XP</span>
                </div>
                <p className="text-[11px] text-white/20 mt-1">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discipline grid */}
      <div className="grid grid-cols-2 gap-3">
        {badges.map(badge => (
          <DisciplineCard
            key={badge.slug}
            badge={badge}
            progress={progress[badge.slug]}
            onSelect={() => setSelected(badge.slug)}
          />
        ))}
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailSheet
            badge={selectedBadge}
            progress={progress[selectedBadge.slug]}
            missions={missions}
            onClose={() => setSelected(null)}
            onRefresh={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
