import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

// ─── Animated Number ─────────────────────────────────────────────────────────

function AnimatedScore({ value, size = 36 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value == null) return
    const start = performance.now()
    const from = 0
    const step = (now) => {
      const pct = Math.min((now - start) / 800, 1)
      const eased = 1 - Math.pow(1 - pct, 3)
      setDisplay(from + (value - from) * eased)
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  if (value == null) return <span className="text-white/20">--</span>
  return <span style={{ fontSize: size }}>{display.toFixed(1)}</span>
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 120 }) {
  const r = (size / 2) - 5
  const circumference = 2 * Math.PI * r
  const pct = score != null ? score / 10 : 0
  const offset = circumference * (1 - pct)
  const color = score == null ? '#333' : score >= 7 ? '#30D158' : score >= 4 ? '#FF9F0A' : '#FF453A'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />
        <motion.circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="block font-bold tabular-nums tracking-tight text-white">
          <AnimatedScore value={score} size={size * 0.28} />
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-widest text-white/20">
          {label}
        </span>
      </div>
    </div>
  )
}

// ─── Pillar Mini Bar ─────────────────────────────────────────────────────────

function PillarMini({ label, score, color }) {
  const pct = score != null ? (score / 10) * 100 : 0
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/25">{label}</span>
        <span className="text-[10px] font-medium tabular-nums text-white/40">
          {score != null ? score.toFixed(1) : '--'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

// ─── Key Decision Card ───────────────────────────────────────────────────────

function KeyDecisionsSummary({ kdData }) {
  if (!kdData?.decisions?.length) {
    return (
      <div className="rounded-xl bg-white/[0.03] px-4 py-3">
        <p className="text-[12px] text-white/20">No key decisions yet today</p>
      </div>
    )
  }
  const latest = kdData.decisions[kdData.decisions.length - 1]
  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/40">⚡ Key Decisions</span>
        <span className="text-[13px] font-bold tabular-nums text-amber-400">
          {kdData.decisions.length} × {kdData.totalMultipliedWeight}w
        </span>
      </div>
      <p className="text-[12px] text-white/25 truncate">Latest: {latest.description}</p>
    </div>
  )
}

// ─── Day Progress ────────────────────────────────────────────────────────────

function DayProgress({ morningState, creativeState, workSessions, nightRoutine }) {
  const phases = [
    { label: 'Morning', done: morningState?.overallMorningScore != null },
    { label: 'Creative', done: creativeState?.creativeOutput != null },
    { label: 'Work', done: (workSessions?.completedSessions || 0) > 0 },
    { label: 'Night', done: nightRoutine?.completedAt != null },
  ]
  return (
    <div className="flex items-center gap-1">
      {phases.map((p, i) => (
        <div key={p.label} className="flex items-center gap-1 flex-1">
          <div className={`h-1.5 flex-1 rounded-full ${p.done ? 'bg-green-500/40' : 'bg-white/[0.04]'}`} />
          {i < phases.length - 1 && <div className="w-0.5" />}
        </div>
      ))}
    </div>
  )
}

// ─── Chapter Preview ─────────────────────────────────────────────────────────

function ChapterPreview({ chapter }) {
  if (!chapter) return null
  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] text-white/20 mb-1">Latest Chapter</p>
      <p className="text-[13px] text-white/50">{chapter.title || `Chapter ${chapter.chapter}`}</p>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const endpoints = {
        vfScore: '/api/vf-score',
        sleepData: '/api/sleep-data',
        morningState: '/api/morning-state',
        creativeState: '/api/creative-state',
        workSessions: '/api/work-sessions',
        nightRoutine: '/api/night-routine',
        keyDecisions: '/api/key-decisions',
        dopamine: '/api/dopamine',
        episode: '/api/episode',
        chapters: '/api/vf-chapters?limit=1',
      }
      const results = {}
      await Promise.allSettled(
        Object.entries(endpoints).map(async ([key, url]) => {
          const r = await fetch(url)
          if (r.ok) results[key] = await r.json()
        })
      )
      setData(results)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 60000)
    return () => clearInterval(id)
  }, [fetchAll])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  const { vfScore, sleepData, morningState, creativeState, workSessions, nightRoutine, keyDecisions, dopamine, episode, chapters } = data

  // Calculate state pillars (same logic as StateTab)
  const sleep = sleepData?.hoursSlept != null ? Math.min(Math.max((sleepData.hoursSlept / 8) * 10 * 0.6 + ((sleepData.sleepScore ?? (sleepData.hoursSlept / 8) * 10) / 10) * 0.4, 0), 10) : null
  const nutrition = creativeState?.nutritionScore ?? null
  const dopa = dopamine?.netScore ?? null
  const mood = morningState?.energyScore ?? null

  const vf = vfScore?.score ?? null
  const latestChapter = Array.isArray(chapters) ? chapters[chapters.length - 1] : null

  return (
    <div className="flex flex-1 flex-col px-6 py-6 gap-5 overflow-y-auto">
      {/* Header */}
      <p className="text-[13px] font-semibold uppercase tracking-widest text-white/20">Home</p>

      {/* Score rings */}
      <div className="flex items-center justify-center gap-6">
        <ScoreRing score={vf} label="VF" size={130} />
        <div className="flex flex-col gap-3">
          <ScoreRing score={sleep != null || nutrition != null || dopa != null || mood != null
            ? [sleep, nutrition, dopa, mood].filter(s => s != null).reduce((a, b) => a + b, 0) / [sleep, nutrition, dopa, mood].filter(s => s != null).length
            : null} label="State" size={80} />
        </div>
      </div>

      {/* State pillars */}
      <div className="flex gap-3">
        <PillarMini label="Sleep" score={sleep} color="#5E9EFF" />
        <PillarMini label="Nutrition" score={nutrition} color="#30D158" />
        <PillarMini label="Dopamine" score={dopa} color="#BF5AF2" />
        <PillarMini label="Mood" score={mood} color="#FF9F0A" />
      </div>

      {/* Day progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/20">Day Progress</span>
          {episode?.number && (
            <span className="text-[11px] text-white/15">Ep. {episode.number}</span>
          )}
        </div>
        <DayProgress morningState={morningState} creativeState={creativeState}
          workSessions={workSessions} nightRoutine={nightRoutine} />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/15">Morning</span>
          <span className="text-[9px] text-white/15">Creative</span>
          <span className="text-[9px] text-white/15">Work</span>
          <span className="text-[9px] text-white/15">Night</span>
        </div>
      </div>

      {/* Key decisions */}
      <KeyDecisionsSummary kdData={keyDecisions} />

      {/* Dopamine quick stats */}
      {dopamine?.date && (
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-green-500/5 px-3 py-2 text-center">
            <span className="block text-[14px] font-bold text-green-400 tabular-nums">{dopamine.farming.totalPoints}</span>
            <span className="block text-[9px] text-white/20">Farm pts</span>
          </div>
          <div className="flex-1 rounded-xl bg-red-500/5 px-3 py-2 text-center">
            <span className="block text-[14px] font-bold text-red-400 tabular-nums">{dopamine.overstimulation.totalEvents}</span>
            <span className="block text-[9px] text-white/20">Overstim</span>
          </div>
          <div className="flex-1 rounded-xl bg-purple-500/5 px-3 py-2 text-center">
            <span className="block text-[14px] font-bold text-purple-300 tabular-nums">{dopamine.netScore}</span>
            <span className="block text-[9px] text-white/20">Net</span>
          </div>
        </div>
      )}

      {/* Latest chapter */}
      <ChapterPreview chapter={latestChapter} />

      {/* Episode arc */}
      {episode?.todaysArc && (
        <div className="rounded-xl bg-white/[0.02] px-4 py-3">
          <p className="text-[11px] text-white/15 mb-1">Today's Arc</p>
          <p className="text-[13px] italic text-white/30">"{episode.todaysArc}"</p>
        </div>
      )}
    </div>
  )
}
