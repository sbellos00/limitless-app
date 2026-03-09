import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { haptics } from '../utils/haptics.js'
import {
  getLevelForXp, getChapterForLevel, getLevelProgress,
  LEVEL_PERCENTILES, CHAPTERS, CHAPTER_VISUALS, getStreakTier,
} from '../data/levels.js'

const DISCIPLINE_COLORS = {
  'reality-distortion-field': '#FF6B6B',
  'frame-control': '#4ECDC4',
  'fearlessness': '#FF9F43',
  'aggression': '#EE5A24',
  'carefreeness': '#7ED6DF',
  'presence': '#B8E994',
  'bias-to-action': '#F8C291',
  'visionary-framing': '#C4B5FD',
}

function DisciplineGlyph({ slug, size = 28 }) {
  const c = DISCIPLINE_COLORS[slug] || '#888'
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (slug) {
    case 'reality-distortion-field': return <svg {...p}><path d="M12 5l7 7-7 7-7-7z" /><circle cx="12" cy="12" r="2.5" fill={c} fillOpacity="0.15" /></svg>
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

function HoldButton({ label, duration = 1000, onComplete, tone = 'emerald', className = '' }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const holdingRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!holding) {
      setProgress(0)
      holdingRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    holdingRef.current = true
    const start = Date.now()
    const tick = () => {
      if (!holdingRef.current) return
      const elapsed = Date.now() - start
      const pct = Math.min(elapsed / duration, 1)
      setProgress(pct)
      if (pct >= 1) {
        setHolding(false)
        holdingRef.current = false
        haptics.success()
        onComplete?.()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [holding, duration, onComplete])

  const cancel = () => {
    holdingRef.current = false
    setHolding(false)
    setProgress(0)
  }

  const tones = {
    emerald: { bg: 'rgba(52, 211, 153, 0.12)', fill: 'rgba(52, 211, 153, 0.45)' },
    rose: { bg: 'rgba(244, 63, 94, 0.1)', fill: 'rgba(244, 63, 94, 0.35)' },
    slate: { bg: 'rgba(148, 163, 184, 0.1)', fill: 'rgba(148, 163, 184, 0.3)' },
  }
  const toneSet = tones[tone] || tones.emerald

  return (
    <motion.button
      whileTap={!holding ? { scale: 0.97 } : undefined}
      onPointerDown={() => { haptics.tap(); setHolding(true) }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={`relative overflow-hidden rounded-xl px-4 py-2 text-[12px] font-semibold text-white/90 ${className}`}
      style={{ background: toneSet.bg }}
      animate={holding ? { scale: [0.98, 1.02, 0.98] } : { scale: 1 }}
      transition={holding ? { repeat: Infinity, duration: 0.6 } : {}}
    >
      <div
        className="absolute inset-0"
        style={{ width: `${progress * 100}%`, transition: 'none', background: toneSet.fill }}
      />
      <span className="relative">{holding ? 'Holding...' : label}</span>
    </motion.button>
  )
}

function XPFlash({ value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="pointer-events-none absolute right-8 top-6 z-20 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1 text-[12px] font-semibold text-emerald-200"
    >
      +{value} XP
    </motion.div>
  )
}

// ─── Chapter Journey (visual timeline in detail sheet) ──────────────────────

function ChapterJourney({ badge, level }) {
  const chapters = CHAPTERS[badge.slug] || []
  const currentChapter = getChapterForLevel(level)
  const color = DISCIPLINE_COLORS[badge.slug] || '#888'

  return (
    <div className="space-y-0">
      {chapters.map((ch, i) => {
        const chNum = i + 1
        const isComplete = currentChapter > chNum
        const isCurrent = currentChapter === chNum
        const isLocked = currentChapter < chNum
        const levelsInChapter = 5
        const chapterStartLevel = (chNum - 1) * 5 + 1
        const chapterEndLevel = chNum * 5
        const levelsComplete = isComplete ? 5 : isCurrent ? level - chapterStartLevel + 1 : 0

        return (
          <div key={chNum} className="flex gap-3">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div
                className="h-3 w-3 rounded-full shrink-0 mt-1"
                style={{
                  background: isLocked ? 'rgba(255,255,255,0.06)' : color,
                  opacity: isComplete ? 1 : isCurrent ? 0.7 : 0.15,
                  boxShadow: isCurrent ? `0 0 8px ${color}50` : 'none',
                }}
              />
              {i < 4 && (
                <div
                  className="w-[1px] flex-1 min-h-[24px]"
                  style={{
                    background: isComplete ? `${color}40` : 'rgba(255,255,255,0.04)',
                  }}
                />
              )}
            </div>

            {/* Chapter content */}
            <div className={`pb-3 ${isLocked ? 'opacity-25' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-semibold ${isCurrent ? 'text-white/90' : 'text-white/50'}`}>
                  {ch.title}
                </span>
                <span className="text-[9px] text-white/15 tabular-nums">
                  Lvl {chapterStartLevel}-{chapterEndLevel}
                </span>
                {isComplete && (
                  <span className="text-[9px] text-emerald-400/50 font-semibold">COMPLETE</span>
                )}
              </div>
              {(isCurrent || isComplete) && (
                <p className="text-[11px] text-white/25 mt-0.5 leading-relaxed">{ch.figures}</p>
              )}
              {isCurrent && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {Array.from({ length: levelsInChapter }).map((_, li) => (
                    <div
                      key={li}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        background: li < levelsComplete ? color : 'rgba(255,255,255,0.06)',
                        opacity: li < levelsComplete ? 0.6 : 1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Sheet ─────────────────────────────────────────────────────────────

export default function BadgeDetailSheet({
  badge,
  progress,
  missions,
  badgeDaily,
  onClose,
  onExerciseDone,
  onMissionComplete,
  onMissionsAssigned,
}) {
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [localDone, setLocalDone] = useState(() => new Set())
  const [xpFlash, setXpFlash] = useState(null)
  const [postingExercise, setPostingExercise] = useState(null)
  const [postingMission, setPostingMission] = useState(false)

  const dragControls = useDragControls()

  useEffect(() => {
    if (!badge) return
    setExpandedExercise(null)
    setLocalDone(new Set())
    setXpFlash(null)
  }, [badge?.slug])

  const activeMission = useMemo(() => {
    if (!badge) return null
    return missions?.active?.find((m) => m.badgeSlug === badge.slug && m.status === 'pending') || null
  }, [badge, missions])

  const doneToday = useMemo(() => {
    const set = new Set()
    if (badgeDaily?.exercises?.length) {
      for (const item of badgeDaily.exercises) {
        if (badge && item.badgeSlug === badge.slug) set.add(String(item.exerciseId))
      }
    }
    return set
  }, [badge, badgeDaily])

  const xp = progress?.xp || 0
  const streak = progress?.currentStreak || 0
  const color = DISCIPLINE_COLORS[badge?.slug] || '#888'

  const level = getLevelForXp(xp)
  const chapter = getChapterForLevel(level)
  const chapterData = CHAPTERS[badge?.slug]?.[chapter - 1]
  const percentile = LEVEL_PERCENTILES[level - 1]
  const { pct, xpToNext } = getLevelProgress(xp, level)
  const visuals = CHAPTER_VISUALS[chapter - 1]

  const streakTier = getStreakTier(streak)
  let multiplier = null
  if (streak >= 30) multiplier = '2.0x'
  else if (streak >= 14) multiplier = '1.5x'
  else if (streak >= 7) multiplier = '1.25x'

  const handleExercise = async (exerciseId) => {
    if (postingExercise) return
    setPostingExercise(exerciseId)
    try {
      const res = await fetch('/api/badge-progress/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeSlug: badge.slug, exerciseId })
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setLocalDone((prev) => new Set(prev).add(String(exerciseId)))
      if (data?.xpGained) {
        setXpFlash(data.xpGained)
        setTimeout(() => setXpFlash(null), 1800)
      }
      onExerciseDone?.()
    } catch {
      haptics.heavy()
    } finally {
      setPostingExercise(null)
    }
  }

  const handleMission = async (success) => {
    if (!activeMission || postingMission) return
    setPostingMission(true)
    try {
      const res = await fetch('/api/badge-missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: activeMission.missionId, success, notes: '' })
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      if (data?.xpAwarded) {
        setXpFlash(data.xpAwarded)
        setTimeout(() => setXpFlash(null), 1800)
      }
      onMissionComplete?.()
    } catch {
      haptics.heavy()
    } finally {
      setPostingMission(false)
    }
  }

  const assignMission = async () => {
    if (postingMission) return
    setPostingMission(true)
    try {
      const res = await fetch('/api/badge-missions/assign', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      await res.json()
      onMissionsAssigned?.()
    } catch {
      haptics.heavy()
    } finally {
      setPostingMission(false)
    }
  }

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose?.()
            }}
            className="relative w-full max-w-2xl rounded-t-[32px] border border-white/10 bg-[#0B0B0D]"
            style={{ height: '92vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            {/* Drag handle */}
            <div
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => dragControls.start(e)}
              className="absolute inset-x-0 top-0 flex h-10 cursor-grab items-center justify-center active:cursor-grabbing"
            >
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-4 z-10 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] text-white/60"
            >
              ✕
            </button>

            <AnimatePresence>{xpFlash && <XPFlash value={xpFlash} />}</AnimatePresence>

            {/* Scrollable content */}
            <div className="h-full overflow-y-auto no-scrollbar px-6 pb-10 pt-10">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: `${color}${Math.round(visuals.iconOpacity * 0.2 * 255).toString(16).padStart(2, '0')}`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <DisciplineGlyph slug={badge.slug} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-semibold text-white">{badge.name}</h2>
                  <p className="mt-0.5 text-[17px] font-bold" style={{ color, opacity: 0.7 }}>
                    {chapterData?.title || 'Initiate'}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                      Lvl {level}
                    </span>
                    <span className="text-[11px] text-white/30 tabular-nums">
                      Top {percentile < 1 ? percentile + '%' : Math.round(percentile) + '%'}
                    </span>
                    {streak > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        {streakTier.flame && <span className="text-[10px]">{streakTier.flame}</span>}
                        <span className="font-medium">{streak}d</span>
                        {multiplier && (
                          <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                            {multiplier}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Narrative + figures */}
              <div className="mt-4 rounded-2xl p-4" style={{ background: `${color}06`, border: `1px solid ${color}0C` }}>
                <p className="text-[13px] text-white/40 italic leading-relaxed">
                  {chapterData?.subtitle}
                </p>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color, opacity: 0.4 }}>
                  {chapterData?.figures}
                </p>
              </div>

              {/* Level progress */}
              <div className="mt-4 rounded-2xl bg-white/[0.04] p-4">
                <div className="flex items-center justify-between text-[12px] text-white/40">
                  <span>{xp.toLocaleString()} XP</span>
                  <span>Level {level} / 25</span>
                </div>
                <div className="mt-2 h-[9px] rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}80, ${color})`,
                      boxShadow: chapter >= 3 ? `0 0 8px ${color}40` : 'none',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-2 text-[12px] text-white/25">
                  {xpToNext > 0 ? `${xpToNext} XP to Level ${level + 1}` : 'Max level reached'}
                </div>
              </div>

              {/* Chapter Journey */}
              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/15 mb-4">Your Journey</p>
                <ChapterJourney badge={badge} level={level} />
              </div>

              {/* Exercises */}
              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/15">Exercises</p>
                <div className="mt-3 space-y-3">
                  {badge.exercises?.map((exercise) => {
                    const isDone = doneToday.has(String(exercise.id)) || localDone.has(String(exercise.id))
                    const isExpanded = expandedExercise === exercise.id
                    return (
                      <div key={exercise.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-white/80">{exercise.title}</span>
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                +{exercise.xp || 5} XP
                              </span>
                            </div>
                            <button
                              className="mt-2 w-full text-left"
                              onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                            >
                              <div
                                className="overflow-hidden"
                                style={{
                                  maxHeight: isExpanded ? '300px' : '2.5rem',
                                  transition: 'max-height 0.25s ease',
                                }}
                              >
                                <p className="text-[12px] leading-relaxed text-white/35">{exercise.description}</p>
                              </div>
                              {!isExpanded && (
                                <span className="mt-1 block text-[10px] text-white/20">tap to expand</span>
                              )}
                            </button>
                          </div>
                          <div className="flex shrink-0 items-center pt-0.5">
                            {isDone ? (
                              <span className="text-[16px] text-white/30">✓</span>
                            ) : (
                              <HoldButton
                                label="Done"
                                duration={1200}
                                onComplete={() => handleExercise(exercise.id)}
                                className={postingExercise === exercise.id ? 'opacity-60' : ''}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mission */}
              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/15">Today&apos;s Mission</p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  {activeMission ? (
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{activeMission.title}</h3>
                      <p className="mt-2 text-[13px] text-white/40 leading-relaxed">{activeMission.description}</p>
                      <p className="mt-2 text-[12px] text-white/25 leading-relaxed">{activeMission.successCriteria}</p>
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-white/20">
                        <span>Success: <span className="text-emerald-400/50">+{activeMission.rewardXp} XP</span></span>
                        <span>Fail: <span className="text-white/30">+{activeMission.failXp} XP</span></span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <HoldButton label="Done" duration={1000} onComplete={() => handleMission(true)} />
                        <HoldButton label="Failed" duration={1000} onComplete={() => handleMission(false)} tone="rose" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] text-white/35">No mission assigned yet.</p>
                      <button
                        onClick={assignMission}
                        className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white/80"
                        disabled={postingMission}
                      >
                        {postingMission ? 'Assigning...' : 'Get Today\'s Missions'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
