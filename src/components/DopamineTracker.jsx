import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { haptics } from '../utils/haptics.js'
import { sounds } from '../utils/sounds.js'

const OVERSTIM_TYPES = [
  { type: 'sugar', emoji: '🍬', label: 'Sugar' },
  { type: 'alcohol', emoji: '🍺', label: 'Alcohol' },
  { type: 'sr', emoji: '💦', label: 'SR' },
  { type: 'social-media', emoji: '📱', label: 'Social Media' },
  { type: 'gaming', emoji: '🎮', label: 'Gaming' },
  { type: 'streaming', emoji: '📺', label: 'Streaming' },
  { type: 'caffeine', emoji: '☕', label: 'Caffeine' },
]

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function NetScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? '#30D158' : score >= 4 ? '#FF9F0A' : '#FF453A'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/30">Dopamine Balance</span>
        <span className="text-[15px] font-bold tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

export default function DopamineTracker() {
  const [data, setData] = useState(null)
  const [farming, setFarming] = useState(false)
  const [farmSessionId, setFarmSessionId] = useState(null)
  const [farmElapsed, setFarmElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/dopamine')
      if (r.ok) setData(await r.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Farming timer
  useEffect(() => {
    if (!farming) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setFarmElapsed(e => e + 1)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [farming])

  const startFarm = async () => {
    try {
      const r = await fetch('/api/dopamine/farm-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const d = await r.json()
      if (d.ok) {
        setFarmSessionId(d.sessionId)
        setFarming(true)
        setFarmElapsed(0)
        haptics.tap()
      }
    } catch {}
  }

  const endFarm = async () => {
    if (!farmSessionId) return
    try {
      const r = await fetch('/api/dopamine/farm-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: farmSessionId })
      })
      const d = await r.json()
      if (d.ok) {
        setFarming(false)
        setFarmSessionId(null)
        haptics.success()
        sounds.complete()
        fetchData()
      }
    } catch {}
  }

  const logOverstim = async (type) => {
    haptics.tap()
    try {
      await fetch('/api/dopamine/overstimulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      fetchData()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  const netScore = data?.netScore ?? 5
  const totalFarmMin = data?.farming?.totalMinutes ?? 0
  const totalFarmPts = data?.farming?.totalPoints ?? 0
  const totalOverstim = data?.overstimulation?.totalEvents ?? 0

  return (
    <div className="flex flex-1 flex-col px-6 py-6 gap-6">
      <p className="text-[13px] font-semibold uppercase tracking-widest text-white/20">
        Dopamine
      </p>

      {/* Net Score */}
      <NetScoreBar score={netScore} />

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-white/[0.04] px-4 py-3 text-center">
          <span className="block text-[20px] font-bold text-green-400 tabular-nums">{totalFarmPts}</span>
          <span className="block text-[11px] text-white/25">Farm pts</span>
        </div>
        <div className="flex-1 rounded-xl bg-white/[0.04] px-4 py-3 text-center">
          <span className="block text-[20px] font-bold text-white/60 tabular-nums">{totalFarmMin}m</span>
          <span className="block text-[11px] text-white/25">Unstimulated</span>
        </div>
        <div className="flex-1 rounded-xl bg-white/[0.04] px-4 py-3 text-center">
          <span className="block text-[20px] font-bold text-red-400 tabular-nums">{totalOverstim}</span>
          <span className="block text-[11px] text-white/25">Overstim</span>
        </div>
      </div>

      {/* Farming section */}
      <div className="rounded-2xl bg-white/[0.04] p-5">
        <p className="text-[13px] font-medium text-white/40 mb-3">🌿 Dopamine Farming</p>

        <AnimatePresence mode="wait">
          {farming ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4">
              <span className="text-[48px] font-bold tabular-nums text-purple-300/80">
                {formatTimer(farmElapsed)}
              </span>
              <p className="text-[13px] text-white/25">Unstimulated time accumulating...</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={endFarm}
                className="w-full rounded-xl bg-purple-500/20 px-5 py-3 text-[15px] font-semibold text-purple-300">
                End Farm
              </motion.button>
            </motion.div>
          ) : (
            <motion.button key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              whileTap={{ scale: 0.97 }} onClick={startFarm}
              className="w-full rounded-xl bg-white/[0.06] px-5 py-4 text-[15px] font-medium text-white/60">
              Start Farming
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Overstimulation logging */}
      <div>
        <p className="text-[13px] font-medium text-white/40 mb-3">⚡ Quick Log</p>
        <div className="grid grid-cols-4 gap-2">
          {OVERSTIM_TYPES.map(({ type, emoji, label }) => (
            <motion.button key={type} whileTap={{ scale: 0.93 }} onClick={() => logOverstim(type)}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.04] px-2 py-3 active:bg-red-500/10">
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] text-white/30">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today's log */}
      {data?.overstimulation?.events?.length > 0 && (
        <div>
          <p className="text-[13px] font-medium text-white/25 mb-2">Today's events</p>
          <div className="space-y-1">
            {data.overstimulation.events.slice().reverse().map((evt) => {
              const def = OVERSTIM_TYPES.find(t => t.type === evt.type)
              const time = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={evt.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className="text-sm">{def?.emoji || '⚡'}</span>
                  <span className="text-[13px] text-white/40">{def?.label || evt.type}</span>
                  <span className="ml-auto text-[12px] text-white/20">{time}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
