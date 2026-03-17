import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { haptics } from '../utils/haptics.js'
import BadgeDetailSheet from './BadgeDetailSheet.jsx'
import {
  getLevelForXp, getChapterForLevel, getLevelProgress,
  LEVEL_THRESHOLDS, LEVEL_PERCENTILES, CHAPTERS, CHAPTER_VISUALS,
  getStreakTier, BUILD_ORDER,
} from '../data/levels.js'

const DISCIPLINE_COLORS = {
  'rdf': '#FF6B6B',
  'frame-control': '#4ECDC4',
  'fearlessness': '#FF9F43',
  'aggression': '#EE5A24',
  'carefreeness': '#7ED6DF',
  'presence': '#B8E994',
  'bias-to-action': '#F8C291',
  'visionary-framing': '#C4B5FD',
}

// SVG glyph icons
function DisciplineGlyph({ slug, size = 22, color }) {
  const c = color || DISCIPLINE_COLORS[slug] || '#888'
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (slug) {
    case 'rdf': return <svg {...p}><path d="M12 5l7 7-7 7-7-7z" /><circle cx="12" cy="12" r="2.5" fill={c} fillOpacity="0.15" /></svg>
    case 'frame-control': return <svg {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></svg>
    case 'fearlessness': return <svg {...p}><path d="M12 2v16M8 6l4-4 4 4M7 22h10" /></svg>
    case 'aggression': return <svg {...p}><path d="M12 22c-2-3-8-7-8-13a8 8 0 0116 0c0 6-6 10-8 13z" /></svg>
    case 'carefreeness': return <svg {...p}><path d="M2 12c3-4 6-5 10-5s7 1 10 5" /><path d="M2 17c3-4 6-5 10-5s7 1 10 5" /></svg>
    case 'presence': return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg>
    case 'bias-to-action': return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
    case 'visionary-framing': return <svg {...p}><circle cx="12" cy="5" r="3" /><path d="M5 22l7-12 7 12" /></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>
  }
}

// ─── Streak Fire Visual ─────────────────────────────────────────────────────

function StreakFire({ streak, color }) {
  const tier = getStreakTier(streak)
  if (!tier.label || streak === 0) return null

  const intensity = streak >= 30 ? 1.0 : streak >= 14 ? 0.7 : streak >= 7 ? 0.5 : 0.3

  return (
    <div className="flex items-center gap-1">
      <motion.div
        className="relative flex items-center"
        animate={streak >= 7 ? {
          filter: [`brightness(1)`, `brightness(1.3)`, `brightness(1)`],
        } : undefined}
        transition={streak >= 7 ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        {/* Glow behind flame */}
        {streak >= 7 && (
          <div
            className="absolute inset-0 rounded-full blur-md"
            style={{
              background: color,
              opacity: intensity * 0.3,
              transform: 'scale(2)',
            }}
          />
        )}
        <span className="relative text-[11px]">{tier.flame}</span>
      </motion.div>
      <span
        className="text-[10px] font-bold tabular-nums"
        style={{ color, opacity: 0.5 + intensity * 0.3 }}
      >
        {streak}d
      </span>
    </div>
  )
}

// ─── Mission Card (expandable) ──────────────────────────────────────────────

function MissionCard({ mission }) {
  const [expanded, setExpanded] = useState(false)
  const color = DISCIPLINE_COLORS[mission.badgeSlug] || '#888'

  return (
    <motion.button
      className="w-full rounded-2xl px-4 py-3.5 relative overflow-hidden text-left"
      style={{
        background: `linear-gradient(160deg, ${color}0C 0%, rgba(0,0,0,0.4) 100%)`,
        border: `1px solid ${color}18`,
      }}
      onClick={() => { haptics.tap(); setExpanded(!expanded) }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Left accent */}
      <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: color, opacity: 0.5 }} />

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-white/75">{mission.title}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: `${color}15`, color }}
        >
          +{mission.rewardXp} XP
        </span>
      </div>

      <p className="text-[11px] text-white/50 leading-relaxed">{mission.successCriteria}</p>

      {/* Expanded detail */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          <p className="text-[12px] text-white/55 leading-relaxed">{mission.description}</p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-white/35">
            <span>Fail: +{mission.failXp} XP</span>
            <span>·</span>
            <span>Min tier: {mission.minTier}</span>
          </div>
        </div>
      </motion.div>

      {!expanded && (
        <span className="mt-1.5 block text-[9px] text-white/30">tap for details</span>
      )}
    </motion.button>
  )
}

// ─── Discipline Story Card ──────────────────────────────────────────────────

function DisciplineStoryCard({ badge, progress, hasMission, onSelect }) {
  const xp = progress?.xp || 0
  const streak = progress?.currentStreak || 0
  const color = DISCIPLINE_COLORS[badge.slug] || '#888'

  const level = getLevelForXp(xp)
  const chapter = getChapterForLevel(level)
  const chapterData = CHAPTERS[badge.slug]?.[chapter - 1]
  const percentile = LEVEL_PERCENTILES[level - 1]
  const { pct, xpToNext } = getLevelProgress(xp, level)
  const visuals = CHAPTER_VISUALS[chapter - 1]

  const nextLevel = level < 25 ? level + 1 : null
  const nextChapter = nextLevel ? getChapterForLevel(nextLevel) : null
  const isChapterEdge = nextChapter && nextChapter !== chapter
  const nextChapterData = isChapterEdge ? CHAPTERS[badge.slug]?.[nextChapter - 1] : null

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { haptics.tap(); onSelect?.() }}
      className="flex flex-col rounded-2xl p-4 pb-3.5 text-left relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${color}${Math.round(visuals.bgOpacity * 255).toString(16).padStart(2, '0')} 0%, rgba(0,0,0,0.45) 100%)`,
        border: `1px solid ${color}${Math.round(visuals.borderOpacity * 255).toString(16).padStart(2, '0')}`,
        boxShadow: `0 0 ${chapter >= 3 ? 30 : 0}px ${color}${Math.round(visuals.glowOpacity * 255).toString(16).padStart(2, '0')}`,
      }}
    >
      {/* Top accent line — brighter at higher chapters */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}${Math.round(visuals.borderOpacity * 1.5 * 255).toString(16).padStart(2, '0')}, transparent)` }}
      />

      {/* Breathing glow for chapter 3+ */}
      {visuals.breathe && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [visuals.glowOpacity * 0.3, visuals.glowOpacity * 0.8, visuals.glowOpacity * 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }}
        />
      )}

      {/* Mission pulse */}
      {hasMission && (
        <motion.div
          className="absolute top-3 right-3 h-2 w-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Header: icon + streak */}
      <div className="flex items-start justify-between mb-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: `${color}${Math.round(visuals.iconOpacity * 0.2 * 255).toString(16).padStart(2, '0')}`,
            border: `1px solid ${color}${Math.round(visuals.iconOpacity * 0.15 * 255).toString(16).padStart(2, '0')}`,
          }}
        >
          <DisciplineGlyph slug={badge.slug} size={20} color={color} />
        </div>
        <StreakFire streak={streak} color={color} />
      </div>

      {/* Chapter title — the hero element */}
      <p className="text-[16px] font-bold text-white/90 leading-tight">
        {chapterData?.title || 'Initiate'}
      </p>

      {/* Badge name */}
      <p className="text-[11px] text-white/50 mt-0.5">{badge.name}</p>

      {/* Level + percentile */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[11px] font-semibold tabular-nums" style={{ color, opacity: 0.7 }}>
          Lvl {level}
        </span>
        <span className="text-[9px] text-white/35">·</span>
        <span className="text-[10px] text-white/45 tabular-nums">
          Top {percentile < 1 ? percentile + '%' : Math.round(percentile) + '%'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${color}0C` }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}70, ${color})`,
              boxShadow: chapter >= 3 ? `0 0 8px ${color}40` : `0 0 4px ${color}20`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-white/40 tabular-nums">{xp.toLocaleString()} XP</span>
          {xpToNext > 0 ? (
            <span className="text-[9px] text-white/30 tabular-nums">
              {xpToNext} to Lvl {level + 1}
            </span>
          ) : (
            <span className="text-[9px] font-bold" style={{ color }}>MAX</span>
          )}
        </div>
      </div>

      {/* Narrative line */}
      <p className="text-[10px] text-white/40 mt-2 leading-relaxed italic">
        {chapterData?.subtitle || ''}
      </p>

      {/* Next chapter teaser — shown when within 1 level of chapter boundary */}
      {isChapterEdge && nextChapterData && (
        <div
          className="mt-2 pt-2 border-t"
          style={{ borderColor: `${color}10` }}
        >
          <p className="text-[9px] text-white/30">
            <span style={{ color, opacity: 0.6 }}>Next:</span>{' '}
            <span className="font-semibold text-white/45">{nextChapterData.title}</span>
          </p>
        </div>
      )}
    </motion.button>
  )
}

// ─── Player Build Card ──────────────────────────────────────────────────────

function PlayerBuildCard({ badges, progress, dailyXp }) {
  if (!badges?.length) return null

  const totalXp = badges.reduce((sum, b) => sum + (progress?.[b.slug]?.xp || 0), 0)

  // Build the trait lines from BUILD_ORDER
  const traitLines = BUILD_ORDER.map(({ slug, label }) => {
    const xp = progress?.[slug]?.xp || 0
    const level = getLevelForXp(xp)
    const chapter = getChapterForLevel(level)
    const chapterData = CHAPTERS[slug]?.[chapter - 1]
    const color = DISCIPLINE_COLORS[slug] || '#888'
    const visuals = CHAPTER_VISUALS[chapter - 1]
    return { slug, label, icon: chapterData?.icon || '—', level, chapter, color, visuals }
  })

  // Find the strongest and weakest for visual emphasis
  const levels = traitLines.map(t => t.level)
  const maxLevel = Math.max(...levels)
  const minLevel = Math.min(...levels)

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Subtle multi-color ambient glow from strongest traits */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {traitLines.filter(t => t.chapter >= 3).map(t => (
          <div
            key={t.slug}
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at center, ${t.color}10 0%, transparent 70%)` }}
          />
        ))}
      </div>

      <div
        className="relative rounded-2xl p-5 pb-4"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">Your Build</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-[18px] font-black tabular-nums text-white/60">{totalXp.toLocaleString()}</span>
              <span className="text-[10px] text-white/30">XP</span>
            </div>
          </div>
          {dailyXp > 0 && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] font-semibold text-emerald-400/70 tabular-nums"
            >
              +{dailyXp} today
            </motion.span>
          )}
        </div>

        {/* Trait lines */}
        <div className="space-y-2">
          {traitLines.map((trait) => {
            const isStrongest = trait.level === maxLevel && maxLevel > 1
            const isWeakest = trait.level === minLevel && minLevel < maxLevel
            const iconOpacity = 0.35 + (trait.chapter / 5) * 0.65 // 0.55 to 1.0

            return (
              <motion.div
                key={trait.slug}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 relative overflow-hidden"
                style={{
                  background: `${trait.color}${isStrongest ? '0C' : '05'}`,
                  border: `1px solid ${trait.color}${isStrongest ? '18' : '08'}`,
                }}
                initial={false}
                animate={trait.chapter >= 4 ? {
                  boxShadow: [
                    `0 0 0px ${trait.color}00`,
                    `0 0 12px ${trait.color}12`,
                    `0 0 0px ${trait.color}00`,
                  ],
                } : undefined}
                transition={trait.chapter >= 4 ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
              >
                {/* Trait label */}
                <span className="text-[11px] text-white/45 shrink-0 w-[105px]">
                  {trait.label}
                </span>

                {/* Icon name — the hero */}
                <span
                  className="text-[13px] font-semibold flex-1 truncate"
                  style={{ color: trait.color, opacity: iconOpacity }}
                >
                  {trait.icon}
                </span>

                {/* Level pip */}
                <span className="text-[9px] text-white/40 tabular-nums shrink-0">
                  {trait.level}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Active Missions ────────────────────────────────────────────────────────

function ActiveMissions({ missions }) {
  const pending = missions?.active?.filter(m => m.status === 'pending') || []
  if (pending.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-amber-400"
          animate={{
            opacity: [0.4, 1, 0.4],
            boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 6px rgba(251,191,36,0.4)', '0 0 0px rgba(251,191,36,0)'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
          Active Missions
        </p>
        <span className="text-[10px] text-white/35 tabular-nums ml-auto">{pending.length} pending</span>
      </div>
      <div className="space-y-2">
        {pending.map(m => (
          <MissionCard key={m.missionId} mission={m} />
        ))}
      </div>
    </div>
  )
}

// ─── Training Log ───────────────────────────────────────────────────────────

function DailyTraining({ badgeDaily }) {
  const exercises = badgeDaily?.exercises || []
  const missions = badgeDaily?.missionsAttempted || []
  const totalXp = [...exercises, ...missions].reduce((sum, e) => sum + (e.xpGained || 0), 0)

  if (exercises.length === 0 && missions.length === 0) {
    return (
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.03] px-4 py-5 text-center">
        <p className="text-[13px] text-white/40">No training yet today</p>
        <p className="text-[11px] text-white/30 mt-1">Select a discipline to begin</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/30">Training Log</span>
        <span className="text-[12px] font-bold text-emerald-400/70 tabular-nums">+{totalXp} XP</span>
      </div>
      <div className="space-y-1.5">
        {exercises.map((ex, i) => {
          const color = DISCIPLINE_COLORS[ex.badgeSlug] || '#888'
          const time = new Date(ex.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={i} className="flex items-center gap-2.5 text-[11px] rounded-lg px-3 py-1.5 bg-white/[0.02]">
              <span className="w-10 text-white/40 tabular-nums">{time}</span>
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-white/40 flex-1 truncate">{ex.exerciseId?.replace(/-/g, ' ')}</span>
              <span className="text-emerald-400/60 tabular-nums">+{ex.xpGained}</span>
            </div>
          )
        })}
        {missions.map((m, i) => {
          const color = DISCIPLINE_COLORS[m.badgeSlug] || '#888'
          const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={`m${i}`} className="flex items-center gap-2.5 text-[11px] rounded-lg px-3 py-1.5 bg-white/[0.02]">
              <span className="w-10 text-white/40 tabular-nums">{time}</span>
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-white/40 flex-1 truncate">Mission {m.success ? 'completed' : 'failed'}</span>
              <span className={`tabular-nums ${m.success ? 'text-emerald-400/60' : 'text-white/30'}`}>+{m.xpGained}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function MentalGame() {
  const [badges, setBadges] = useState([])
  const [progress, setProgress] = useState({})
  const [missions, setMissions] = useState({ active: [], completed: [] })
  const [badgeDaily, setBadgeDaily] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [badgesR, progressR, missionsR, dailyR] = await Promise.all([
        fetch('/api/badges').then(r => r.json()),
        fetch('/api/badge-progress').then(r => r.json()),
        fetch('/api/badge-missions').then(r => r.json()),
        fetch('/api/badge-daily').then(r => r.json()).catch(() => null),
      ])
      setBadges(badgesR.badges || [])
      setProgress(progressR.badges || {})
      setMissions(missionsR)
      setBadgeDaily(dailyR)
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
  const pendingMissions = missions.active?.filter(m => m.status === 'pending') || []
  const missionSlugs = new Set(pendingMissions.map(m => m.badgeSlug))
  const dailyXp = [...(badgeDaily?.exercises || []), ...(badgeDaily?.missionsAttempted || [])].reduce((s, e) => s + (e.xpGained || 0), 0)

  return (
    <div className="flex flex-1 flex-col px-6 py-5 gap-6 overflow-y-auto no-scrollbar">
      {/* Player Build Card */}
      <PlayerBuildCard badges={badges} progress={progress} dailyXp={dailyXp} />

      {/* Decorative divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Active Missions — prominent, above disciplines */}
      <ActiveMissions missions={missions} />

      {/* Disciplines — story cards, single column */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">Disciplines</p>
        <div className="space-y-3">
          {badges.map((badge) => (
            <DisciplineStoryCard
              key={badge.slug}
              badge={badge}
              progress={progress[badge.slug]}
              hasMission={missionSlugs.has(badge.slug)}
              onSelect={() => setSelected(badge.slug)}
            />
          ))}
        </div>
      </div>

      {/* Training Log */}
      <DailyTraining badgeDaily={badgeDaily} />

      {/* Detail Sheet */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailSheet
            badge={selectedBadge}
            progress={progress[selectedBadge.slug]}
            missions={missions}
            badgeDaily={badgeDaily}
            onClose={() => setSelected(null)}
            onExerciseDone={fetchAll}
            onMissionComplete={fetchAll}
            onMissionsAssigned={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
