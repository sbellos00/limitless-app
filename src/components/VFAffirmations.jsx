import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import AffirmationTest from './AffirmationTest.jsx'
import AffirmationReader from './AffirmationReader.jsx'
import { sounds } from '../utils/sounds.js'
import { haptics } from '../utils/haptics.js'

const SCHEDULE = [
  'After mind training',
  'Before deep work',
  'After deep work #2',
  'Before bed',
]

const READ_KEY = 'limitless_vf_read_cycle'

export default function VFAffirmations() {
  const [view, setView] = useState('hub')
  const [affirmations, setAffirmations] = useState([])
  const [sessions, setSessions] = useState([])
  const [vfScore, setVfScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [readDone, setReadDone] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [affData, gameData, scoreData] = await Promise.all([
        fetch('/api/affirmations').then(r => r.json()),
        fetch('/api/vf-game').then(r => r.json()),
        fetch('/api/vf-score').then(r => r.json()),
      ])
      setAffirmations(affData.affirmations || [])
      setSessions(gameData.sessions || [])
      setVfScore(scoreData)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const cycleId = localStorage.getItem('limitless_cycle_id')
    const readCycle = localStorage.getItem(READ_KEY)
    setReadDone(!!cycleId && readCycle === cycleId)
  }, [])

  const handleReadClose = () => {
    const cycleId = localStorage.getItem('limitless_cycle_id')
    if (cycleId) {
      localStorage.setItem(READ_KEY, cycleId)
      setReadDone(true)
    }
    setView('hub')
  }

  const handleCheckinSave = async (results) => {
    const payload = affirmations.map(aff => ({
      index: aff.index,
      convictionScore: results[aff.index]?.conviction ?? 0,
      resistanceScore: results[aff.index]?.resistance ?? 0,
      exploration: '',
      resistance: ''
    }))

    await fetch('/api/vf-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presenceScore: null, affirmations: payload })
    })

    const cycleId = localStorage.getItem('limitless_cycle_id')
    if (cycleId) localStorage.setItem('limitless_vf_completed_cycle', cycleId)

    await fetchData()
    sounds.complete()
    setView('hub')
  }

  // ── Overlays ────────────────────────────────────────────────────────────

  if (view === 'read') {
    return <AffirmationReader affirmations={affirmations} onClose={handleReadClose} />
  }

  if (view === 'checkin') {
    return (
      <AffirmationTest
        affirmations={affirmations}
        onSave={handleCheckinSave}
        onBack={() => setView('hub')}
      />
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  // ── Hub ─────────────────────────────────────────────────────────────────

  const score = vfScore?.score ?? null
  const comp = vfScore?.components
  const count = sessions.length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="px-6 py-5 space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Inner Work</p>
          <h1 className="mt-1 text-[22px] font-semibold text-white">VF Affirmations</h1>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={score} />
          {count > 0 && (
            <span className="text-[11px] text-white/20 tabular-nums">
              {count} check-in{count !== 1 ? 's' : ''} this cycle
            </span>
          )}
        </div>

        {/* Breakdown */}
        {comp && <Breakdown components={comp} />}

        {/* Read */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics.tap(); setView('read') }}
          className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 flex items-center gap-3 text-left"
        >
          <BookIcon done={readDone} />
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] font-semibold ${readDone ? 'text-white/40' : 'text-white/80'}`}>
              Read Affirmations
            </p>
            <p className="text-[11px] text-white/15 mt-0.5">Morning ritual</p>
          </div>
          {readDone && <CheckIcon />}
        </motion.button>

        {/* Check-ins */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">Check-ins</p>
            <span className="text-[11px] tabular-nums text-white/15">
              {Math.min(count, 4)} / 4
            </span>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
            {SCHEDULE.map((label, i) => {
              const session = sessions[i]
              return (
                <Slot
                  key={i}
                  number={i + 1}
                  label={label}
                  session={session}
                  onStart={() => { haptics.tap(); setView('checkin') }}
                />
              )
            })}
          </div>

          {/* Extra sessions */}
          {count > 4 && (
            <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              {sessions.slice(4).map((session, i) => (
                <Slot key={`e${i}`} number={5 + i} label="Extra" session={session} />
              ))}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptics.tap(); setView('checkin') }}
            className="mt-3 w-full rounded-2xl border border-dashed border-white/[0.08] py-3 text-[13px] font-medium text-white/30"
          >
            + New Check-in
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ── Small components ─────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const size = 130
  const sw = 5
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const pct = score != null ? score / 10 : 0
  const offset = circ * (1 - pct)
  const color = score == null ? '#333' : score >= 7 ? '#30D158' : score >= 4 ? '#FF9F0A' : '#FF453A'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-black tabular-nums text-white leading-none">
          {score != null ? score.toFixed(1) : '—'}
        </span>
        <span className="text-[9px] text-white/20 mt-1 uppercase tracking-widest">VF Score</span>
      </div>
    </div>
  )
}

function Breakdown({ components: c }) {
  const items = [
    { label: 'Conviction', value: c.conviction?.avg, color: '#30D158' },
    { label: 'Resistance (inv)', value: c.resistance?.inverted, color: '#FF453A' },
    { label: 'Key Decisions', value: c.keyDecisions?.score, color: '#5E9EFF' },
    { label: 'Boss Encounters', value: c.bossEncounters?.score, color: '#BF5AF2' },
    { label: 'Presence', value: c.presence?.score, color: '#FF9F0A' },
  ]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-1.5">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-2 text-[11px]">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: it.color }} />
          <span className="text-white/30 flex-1">{it.label}</span>
          <span className="text-white/50 font-semibold tabular-nums">
            {it.value != null ? it.value : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function Slot({ number, label, session, onStart }) {
  const done = !!session
  const affs = session?.affirmations || []
  const convAvg = affs.length > 0 ? (affs.reduce((s, a) => s + (a.convictionScore ?? 0), 0) / affs.length).toFixed(1) : null
  const resAvg = affs.length > 0 ? (affs.reduce((s, a) => s + (a.resistanceScore ?? 0), 0) / affs.length).toFixed(1) : null
  const time = session?.timestamp ? new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Indicator */}
      {done ? (
        <div className="h-5 w-5 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
      ) : (
        <div className="h-5 w-5 rounded-full border border-white/10 shrink-0" />
      )}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className={`text-[13px] ${done ? 'text-white/35' : 'text-white/60'}`}>
          #{number} — {label}
        </span>
        {done && (
          <div className="flex gap-3 mt-0.5 text-[10px] tabular-nums text-white/20">
            <span>C {convAvg}</span>
            <span>R {resAvg}</span>
            {time && <span className="ml-auto">{time}</span>}
          </div>
        )}
      </div>
    </div>
  )

  if (!done && onStart) {
    return (
      <motion.button whileTap={{ scale: 0.98 }} onClick={onStart} className="w-full text-left">
        {inner}
      </motion.button>
    )
  }

  return <div>{inner}</div>
}

function BookIcon({ done }) {
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${done ? 'bg-green-500/10' : 'bg-white/[0.06]'}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={done ? '#30D158' : 'rgba(255,255,255,0.35)'} strokeWidth="2" strokeLinecap="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
