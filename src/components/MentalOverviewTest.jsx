import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { haptics } from '../utils/haptics.js'
import BadgeDetailSheet from './BadgeDetailSheet.jsx'
import {
  getLevelForXp, getChapterForLevel, getLevelProgress,
  CHAPTERS, LEVEL_PERCENTILES, getStreakTier,
} from '../data/levels.js'

// Keys match actual badge slugs from server/data/badges.json
const COLORS = {
  'rdf': '#FF6B6B',
  'frame-control': '#4ECDC4',
  'fearlessness': '#FF9F43',
  'aggression': '#EE5A24',
  'carefreeness': '#7ED6DF',
  'presence': '#B8E994',
  'bias-to-action': '#F8C291',
  'visionary-framing': '#C4B5FD',
}

function getPercentile(level) {
  const topPct = LEVEL_PERCENTILES[level - 1] ?? 50
  return Math.round(100 - topPct)
}

// Chapter (1-5) → bar brightness. Higher level = more vivid color.
function getLevelBrightness(level) {
  const chapter = getChapterForLevel(level)
  return [0.2, 0.38, 0.55, 0.75, 1.0][chapter - 1] || 0.2
}

// ── Sample Data ─────────────────────────────────────────────────────────────

function generateSampleData() {
  const badgeList = [
    { slug: 'rdf', name: 'RDF' },
    { slug: 'frame-control', name: 'Frame Control' },
    { slug: 'fearlessness', name: 'Fearlessness' },
    { slug: 'aggression', name: 'Aggression' },
    { slug: 'carefreeness', name: 'Carefreeness' },
    { slug: 'presence', name: 'Presence' },
    { slug: 'bias-to-action', name: 'Bias to Action' },
    { slug: 'visionary-framing', name: 'Visionary Framing' },
  ]
  // Spread across chapters 1-5 to demonstrate color brightness
  const xpValues = [12000, 4800, 2300, 1100, 520, 220, 60, 25]
  const streaks = [14, 7, 5, 3, 2, 1, 0, 0]

  const badges = badgeList.map(b => ({ ...b, exercises: [] }))
  const progress = {}
  badgeList.forEach((b, i) => {
    progress[b.slug] = { xp: xpValues[i], currentStreak: streaks[i] }
  })

  const missions = {
    active: [
      { missionId: 's1', badgeSlug: 'rdf', title: 'Reality Check', successCriteria: 'Challenge one assumption you hold today', rewardXp: 25, status: 'pending' },
      { missionId: 's2', badgeSlug: 'fearlessness', title: 'Fear Exposure', successCriteria: 'Do one thing that makes you uncomfortable', rewardXp: 30, status: 'pending' },
      { missionId: 's3', badgeSlug: 'presence', title: 'Stillness', successCriteria: '5 minutes of silent sitting, no phone', rewardXp: 20, status: 'pending' },
    ],
    completed: [],
  }
  return { badges, progress, missions }
}

// ── Mini Percentile Chart ───────────────────────────────────────────────────

function MiniPercentileChart({ disciplines }) {
  if (disciplines.length === 0) return null
  const avgPctl = Math.round(disciplines.reduce((s, d) => s + d.pctl, 0) / disciplines.length)

  return (
    <div className="flex items-end gap-3">
      <div className="flex items-end gap-[3px] h-[52px] flex-1">
        {disciplines.map((d) => (
          <div key={d.slug} className="flex-1 flex flex-col justify-end h-full">
            <motion.div
              className="w-full rounded-t-sm min-h-[2px]"
              style={{ background: d.color, opacity: getLevelBrightness(d.level) }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(d.pctl, 4)}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[28px] font-black tabular-nums text-white/35 leading-none">{avgPctl}</span>
        <p className="text-[8px] text-white/12 uppercase tracking-wider mt-0.5">avg pctl</p>
      </div>
    </div>
  )
}

// ── Percentile Graph ────────────────────────────────────────────────────────

const GRID_MARKS = [0, 25, 50, 75, 100]

function PercentileGraph({ disciplines, onSelect }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-2">Percentile Graph</p>

      {/* Axis labels */}
      <div className="flex ml-[82px] mr-[2px] mb-1">
        {GRID_MARKS.map((v, i) => (
          <span
            key={v}
            className="text-[8px] text-white/10 tabular-nums flex-1"
            style={{ textAlign: i === 0 ? 'left' : i === GRID_MARKS.length - 1 ? 'right' : 'center' }}
          >
            {v}
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {disciplines.map((d, i) => {
          const brightness = getLevelBrightness(d.level)
          return (
            <button
              key={d.slug}
              className="w-full text-left"
              onClick={() => { haptics.tap(); onSelect(d.slug) }}
            >
              <div className="flex items-center gap-0 h-[30px]">
                {/* Badge name — left */}
                <div className="w-[80px] shrink-0 pr-2 flex items-center gap-1.5">
                  <div
                    className="h-[6px] w-[6px] rounded-full shrink-0"
                    style={{ background: d.color, opacity: brightness }}
                  />
                  <span className="text-[10px] text-white/40 font-medium truncate">{d.name}</span>
                </div>

                {/* Bar area */}
                <div className="flex-1 relative h-[12px] flex items-center">
                  {GRID_MARKS.map(v => (
                    <div
                      key={v}
                      className="absolute top-[-4px] bottom-[-4px] w-px"
                      style={{ left: `${v}%`, background: 'rgba(255,255,255,0.025)' }}
                    />
                  ))}
                  <div className="w-full h-full rounded-sm overflow-hidden bg-white/[0.02] relative">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-sm flex items-center justify-end pr-1.5"
                      style={{ background: d.color, opacity: brightness }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(d.pctl, 8)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="text-[8px] font-bold tabular-nums text-white/70 leading-none">{d.pctl}</span>
                    </motion.div>
                  </div>
                </div>

                {/* Archetype — right */}
                <div className="shrink-0 pl-2">
                  <span className="text-[9px] text-white/20 italic whitespace-nowrap">{d.chapterTitle}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Badge Cards (horizontal scroll) ─────────────────────────────────────────

function BadgeCardRow({ disciplines, onSelect }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-2.5">Badges</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 snap-x snap-mandatory pb-1">
        {disciplines.map((d, i) => {
          const brightness = getLevelBrightness(d.level)
          return (
            <button
              key={d.slug}
              className="shrink-0 w-[145px] rounded-2xl px-3 py-3 text-left snap-start"
              style={{
                background: `${d.color}${Math.round(brightness * 12).toString(16).padStart(2, '0')}`,
                border: `1px solid ${d.color}${Math.round(brightness * 20).toString(16).padStart(2, '0')}`,
              }}
              onClick={() => { haptics.tap(); onSelect(d.slug) }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="h-[6px] w-[6px] rounded-full shrink-0"
                  style={{ background: d.color, opacity: brightness }}
                />
                <span className="text-[11px] font-semibold text-white/50 truncate">{d.name}</span>
              </div>
              <p className="text-[10px] italic truncate" style={{ color: d.color, opacity: brightness * 0.6 }}>
                {d.chapterTitle}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-white/20 tabular-nums">Lvl {d.level}</span>
                <span className="text-[9px] text-white/15 tabular-nums">{d.pctl}%ile</span>
              </div>
              <div className="mt-1.5 h-[3px] rounded-full overflow-hidden bg-white/[0.04]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${d.levelPct}%`, background: d.color, opacity: brightness }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Mission Card ────────────────────────────────────────────────────────────

function MissionCard({ mission }) {
  const color = COLORS[mission.badgeSlug] || '#888'
  return (
    <div className="rounded-xl px-3 py-2.5 relative overflow-hidden" style={{ background: `${color}08`, border: `1px solid ${color}10` }}>
      <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: color, opacity: 0.4 }} />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white/50">{mission.title}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums" style={{ background: `${color}12`, color }}>+{mission.rewardXp}</span>
      </div>
      <p className="text-[10px] text-white/20 mt-1 leading-relaxed">{mission.successCriteria}</p>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MentalOverviewTest() {
  const [badges, setBadges] = useState([])
  const [progress, setProgress] = useState({})
  const [missions, setMissions] = useState({ active: [], completed: [] })
  const [badgeDaily, setBadgeDaily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [showMissions, setShowMissions] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [b, p, m, d] = await Promise.all([
        fetch('/api/badges').then(r => r.json()),
        fetch('/api/badge-progress').then(r => r.json()),
        fetch('/api/badge-missions').then(r => r.json()),
        fetch('/api/badge-daily').then(r => r.json()).catch(() => null),
      ])
      setBadges(b.badges || [])
      setProgress(p.badges || {})
      setMissions(m)
      setBadgeDaily(d)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assignMissions = async () => {
    if (assigning) return
    setAssigning(true)
    try {
      await fetch('/api/badge-missions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await fetchAll()
    } catch {} finally { setAssigning(false) }
  }

  const seedSample = () => {
    const { badges: b, progress: p, missions: m } = generateSampleData()
    setBadges(b)
    setProgress(p)
    setMissions(m)
    setLoading(false)
  }

  const clearSample = () => {
    fetchAll()
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  // Compute discipline data with percentiles
  const disciplines = badges.map(b => {
    const xp = progress[b.slug]?.xp || 0
    const streak = progress[b.slug]?.currentStreak || 0
    const level = getLevelForXp(xp)
    const chapter = getChapterForLevel(level)
    const chapterData = CHAPTERS[b.slug]?.[chapter - 1]
    const lp = getLevelProgress(xp, level)
    const pctl = getPercentile(level)
    const color = COLORS[b.slug] || '#888'

    return {
      slug: b.slug, name: b.name, xp, level, pctl, color, streak,
      chapterTitle: chapterData?.title || 'Initiate',
      levelPct: lp.pct, xpToNext: lp.xpToNext,
      streakTier: getStreakTier(streak),
    }
  }).sort((a, b) => b.pctl - a.pctl || b.xp - a.xp)

  const totalXp = disciplines.reduce((s, d) => s + d.xp, 0)
  const avgLevel = disciplines.length > 0
    ? Math.round(disciplines.reduce((s, d) => s + d.level, 0) / disciplines.length)
    : 1
  const pending = missions.active?.filter(m => m.status === 'pending') || []

  // Badge cards sorted weakest first (focus next = first card)
  const cardOrder = [...disciplines].reverse()

  const selectedBadge = selected ? badges.find(b => b.slug === selected) : null

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="px-6 py-5 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Mental Game</p>
            <h1 className="mt-1 text-[22px] font-semibold text-white">Mental Badges</h1>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-bold text-white/40 tabular-nums">Level {avgLevel}</p>
            <p className="text-[10px] text-white/12 tabular-nums">{totalXp.toLocaleString()} XP</p>
          </div>
        </div>

        {/* Hero — Mini Percentile Chart */}
        <MiniPercentileChart disciplines={disciplines} />

        {/* Percentile Graph */}
        <PercentileGraph disciplines={disciplines} onSelect={setSelected} />

        {/* Badge Cards — horizontal scroll, weakest first */}
        <BadgeCardRow disciplines={cardOrder} onSelect={setSelected} />

        {/* Active Missions — collapsible */}
        {pending.length > 0 ? (
          <div>
            <button
              className="flex items-center gap-2 mb-2.5 w-full"
              onClick={() => { haptics.tap(); setShowMissions(p => !p) }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/50">
                Active Missions — {pending.length}
              </span>
              <span className="text-[10px] text-white/15 ml-auto">
                {showMissions ? '▾' : '▸'}
              </span>
            </button>
            <AnimatePresence>
              {showMissions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    {pending.map(m => (
                      <MissionCard key={m.missionId} mission={m} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-2.5">Missions</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={assignMissions}
              disabled={assigning}
              className="w-full rounded-2xl border border-dashed border-white/[0.08] py-3.5 text-[13px] font-medium text-white/30"
            >
              {assigning ? 'Assigning…' : 'Get Today\'s Missions'}
            </motion.button>
          </div>
        )}

        {/* Dev: Seed / Clear */}
        <div className="flex gap-2">
          <button
            onClick={seedSample}
            className="flex-1 py-2 rounded-lg text-[10px] text-white/20 border border-white/[0.04]"
          >
            Seed Sample Data
          </button>
          <button
            onClick={clearSample}
            className="flex-1 py-2 rounded-lg text-[10px] text-white/20 border border-white/[0.04]"
          >
            Reload from API
          </button>
        </div>
      </div>

      {/* Badge Detail Sheet */}
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
