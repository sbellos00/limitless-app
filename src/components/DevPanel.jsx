import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ALL_MORNING_DONE = {
  'sleep-screenshot': 'done', 'morning-reading': 'done', 'journaling': 'done',
  'review-plan': 'done', 'sunlight-walk': 'done', 'fitmind': 'done',
  'shower': 'done', 'visualization': 'done', 'write-values': 'done'
}

const PRESETS = [
  {
    label: 'Fresh Day',
    apply: () => {
      ;['limitless_morning_statuses','limitless_current_view','limitless_creative_block_start',
        'limitless_work_sessions','limitless_night_routine'].forEach(k => localStorage.removeItem(k))
    }
  },
  {
    label: 'Morning 5/9',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify({
        'sleep-screenshot': 'done', 'morning-reading': 'done', 'journaling': 'done',
        'review-plan': 'skipped', 'sunlight-walk': 'done'
      }))
      localStorage.setItem('limitless_current_view', 'morning-routine')
    }
  },
  {
    label: 'Morning Done',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'completed')
    }
  },
  {
    label: 'Creative 45m',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'creative-block')
      localStorage.setItem('limitless_creative_block_start', String(Date.now() - 45 * 60000))
    }
  },
  {
    label: 'Work Pre',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'work-sessions')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: null, s1End: null, s2Start: null, s2End: null,
        s3Start: null, s3End: null, breakStart: null, lunchStart: null
      }))
    }
  },
  {
    label: 'Work Running',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'work-sessions')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: new Date(Date.now() - 30 * 60000).toISOString(),
        s1End: null, s2Start: null, s2End: null, s3Start: null, s3End: null,
        breakStart: null, lunchStart: null
      }))
    }
  },
  {
    label: 'Work Break',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'work-sessions')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: new Date(Date.now() - 100 * 60000).toISOString(),
        s1End: new Date(Date.now() - 5 * 60000).toISOString(),
        s2Start: null, s2End: null, s3Start: null, s3End: null,
        breakStart: Date.now(), lunchStart: null
      }))
    }
  },
  {
    label: 'Work Lunch',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'work-sessions')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: '2026-02-21T09:00:00Z', s1End: '2026-02-21T10:30:00Z',
        s2Start: '2026-02-21T10:40:00Z', s2End: '2026-02-21T12:10:00Z',
        s3Start: null, s3End: null, breakStart: null, lunchStart: Date.now()
      }))
    }
  },
  {
    label: 'Work Done',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'work-sessions')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: '2026-02-21T09:00:00Z', s1End: '2026-02-21T10:30:00Z',
        s2Start: '2026-02-21T10:40:00Z', s2End: '2026-02-21T12:10:00Z',
        s3Start: '2026-02-21T12:40:00Z', s3End: '2026-02-21T14:10:00Z',
        breakStart: null, lunchStart: null
      }))
    }
  },
  {
    label: 'Night Mid',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'night-routine')
      localStorage.setItem('limitless_night_routine', JSON.stringify({
        'letting-go': 'done', 'nervous-system': 'done'
      }))
    }
  },
  {
    label: 'Night → Bed',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'night-routine')
      localStorage.setItem('limitless_night_routine', JSON.stringify({
        'letting-go': 'done', 'nervous-system': 'done', 'plan-tomorrow': 'done'
      }))
    }
  },
  {
    label: 'Day Complete',
    apply: () => {
      localStorage.setItem('limitless_morning_statuses', JSON.stringify(ALL_MORNING_DONE))
      localStorage.setItem('limitless_current_view', 'night-routine')
      localStorage.setItem('limitless_work_sessions', JSON.stringify({
        s1Start: '2026-02-21T09:00:00Z', s1End: '2026-02-21T10:30:00Z',
        s2Start: '2026-02-21T10:40:00Z', s2End: '2026-02-21T12:10:00Z',
        s3Start: '2026-02-21T12:40:00Z', s3End: '2026-02-21T14:10:00Z',
        breakStart: null, lunchStart: null
      }))
      localStorage.setItem('limitless_night_routine', JSON.stringify({
        'letting-go': 'done', 'nervous-system': 'done', 'plan-tomorrow': 'done',
        '__bedStarted': true,
        'finalize-plan': 'done', 'read-prompts': 'done', 'affirmations': 'done', 'alter-memories': 'done'
      }))
    }
  },
]

export default function DevPanel({ onNavigate }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-2 z-[200] flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-white/60 backdrop-blur-sm"
        style={{ top: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      >
        {open ? '\u2715' : 'D'}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed right-2 z-[200] w-[160px] rounded-2xl bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/[0.08] p-2 shadow-2xl" style={{ top: 'calc(3rem + env(safe-area-inset-top, 0px))' }}>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Dev Pages
          </p>
          <div className="mt-1 mb-2 space-y-0.5">
            <button
              onClick={() => { onNavigate?.('vf'); setOpen(false) }}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-emerald-400/80 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              VF Affirmations
            </button>
            <button
              onClick={() => { onNavigate?.('mental-overview'); setOpen(false) }}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-purple-400/80 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              Mental Overview
            </button>
            <button
              onClick={() => { navigate('/mental-fitness'); setOpen(false) }}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-amber-400/80 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              Mental Fitness
            </button>
          </div>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Dev States
          </p>
          <div className="mt-1 space-y-0.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  preset.apply()
                  location.reload()
                }}
                className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-white/60 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
