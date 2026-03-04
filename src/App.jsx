import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from './components/BottomNav.jsx'
import DashboardTab from './components/DashboardTab.jsx'
import MorningRoutine from './components/MorningRoutine.jsx'
import BadgesTab from './components/BadgesTab.jsx'
import StateTab from './components/StateTab.jsx'
import StatsTab from './components/StatsTab.jsx'
import HistoryTab from './components/HistoryTab.jsx'
import morningRoutine from './data/morningRoutine.js'
import DevPanel from './components/DevPanel.jsx'
import DayCountdownBar from './components/DayCountdownBar.jsx'

const STORAGE_KEYS = {
  statuses: 'limitless_morning_statuses',
  currentView: 'limitless_current_view',
  creativeBlockStart: 'limitless_creative_block_start',
  workSessions: 'limitless_work_sessions',
  nightRoutine: 'limitless_night_routine',
  lastReset: 'limitless_last_reset',
  dayStart: 'limitless_day_start'
}

const DAY_MS = 24 * 60 * 60 * 1000

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (error) {
    console.log('Failed to load from storage', error)
    return fallback
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [statuses, setStatuses] = useState(() => loadJson(STORAGE_KEYS.statuses, {}))
  const [currentView, setCurrentView] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.currentView) || 'morning-routine'
  )
  const [creativeBlockStartTime, setCreativeBlockStartTime] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.creativeBlockStart)
    return stored ? Number(stored) : null
  })
  const [dayStartTimestamp, setDayStartTimestamp] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.dayStart)
    return stored ? Number(stored) : null
  })
  const [now, setNow] = useState(Date.now())

  const items = useMemo(() => morningRoutine, [])
  const flatItems = useMemo(() => morningRoutine.flatMap((category) => category.items), [])

  const dayRemainingMs = dayStartTimestamp ? DAY_MS - (now - dayStartTimestamp) : 0
  const dayActive = dayStartTimestamp != null && dayRemainingMs > 0

  // Daily reset + reconcile with server on mount
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const today = now.toISOString().slice(0, 10)
    const lastReset = localStorage.getItem(STORAGE_KEYS.lastReset)

    if (hour >= 3 && lastReset !== today) {
      localStorage.setItem(STORAGE_KEYS.lastReset, today)
      localStorage.removeItem(STORAGE_KEYS.statuses)
      localStorage.removeItem(STORAGE_KEYS.currentView)
      localStorage.removeItem(STORAGE_KEYS.creativeBlockStart)
      localStorage.removeItem(STORAGE_KEYS.workSessions)
      localStorage.removeItem(STORAGE_KEYS.nightRoutine)
      setStatuses({})
      setCurrentView('morning-routine')
      setCreativeBlockStartTime(null)
      return
    }

    if (!lastReset) {
      localStorage.setItem(STORAGE_KEYS.lastReset, today)
    }

    // Reconcile: restore mid-morning progress if app was closed and reopened
    // Skip if all items are already logged — morning was completed, don't re-trigger completion screen
    fetch('/api/morning-block-log')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data || data.date !== today || !data.items?.length) return
        if (data.items.length >= flatItems.length) return // morning fully logged, skip
        const serverStatuses = {}
        for (const item of data.items) {
          serverStatuses[item.id] = item.status
        }
        setStatuses((prev) => {
          const merged = { ...serverStatuses, ...prev }
          localStorage.setItem(STORAGE_KEYS.statuses, JSON.stringify(merged))
          return merged
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    fetch('/api/morning-state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || data.date !== today) return
        if (dayStartTimestamp) return
        const stamp = data.createdAt ? Date.parse(data.createdAt) : null
        if (!stamp || Number.isNaN(stamp)) return
        localStorage.setItem(STORAGE_KEYS.dayStart, String(stamp))
        setDayStartTimestamp(stamp)
      })
      .catch(() => {})
  }, [dayStartTimestamp])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.statuses, JSON.stringify(statuses))
  }, [statuses])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentView, currentView)
  }, [currentView])

  useEffect(() => {
    if (creativeBlockStartTime) {
      localStorage.setItem(STORAGE_KEYS.creativeBlockStart, String(creativeBlockStartTime))
    } else {
      localStorage.removeItem(STORAGE_KEYS.creativeBlockStart)
    }
  }, [creativeBlockStartTime])

  useEffect(() => {
    if (dayStartTimestamp) {
      localStorage.setItem(STORAGE_KEYS.dayStart, String(dayStartTimestamp))
    } else {
      localStorage.removeItem(STORAGE_KEYS.dayStart)
    }
  }, [dayStartTimestamp])

  useEffect(() => {
    if (!dayActive) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [dayActive])

  useEffect(() => {
    if (dayStartTimestamp == null) return
    if (dayRemainingMs <= 0) {
      // Auto-expire after 24h
      setDayStartTimestamp(null)
      localStorage.removeItem(STORAGE_KEYS.dayStart)
    }
  }, [dayRemainingMs, dayStartTimestamp])

  useEffect(() => {
    const allComplete = flatItems.every((item) => statuses[item.id])
    if (allComplete && currentView === 'morning-routine') {
      setCurrentView('completed')
    }
  }, [flatItems, statuses, currentView])

  const logInteraction = async (itemId, status) => {
    try {
      await fetch('/api/morning-block-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          status,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.log('Morning block log failed', error)
    }
  }

  const handleStatusChange = (itemId, status) => {
    setStatuses((prev) => {
      const next = { ...prev }
      if (status == null) {
        delete next[itemId]
      } else {
        next[itemId] = status
      }
      return next
    })
    if (status) logInteraction(itemId, status)
  }

  const handleStartDay = async () => {
    if (dayActive) return
    const stamp = Date.now()
    setDayStartTimestamp(stamp)
    localStorage.setItem(STORAGE_KEYS.dayStart, String(stamp))
    try {
      await fetch('/api/morning-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdAt: new Date(stamp).toISOString(),
          updatedAt: new Date(stamp).toISOString()
        })
      })
    } catch {
      // ignore network errors for day start
    }
  }

  const handleEndDay = () => {
    setDayStartTimestamp(null)
    localStorage.removeItem(STORAGE_KEYS.dayStart)
    localStorage.removeItem(STORAGE_KEYS.statuses)
    localStorage.removeItem(STORAGE_KEYS.currentView)
    localStorage.removeItem(STORAGE_KEYS.creativeBlockStart)
    localStorage.removeItem(STORAGE_KEYS.workSessions)
    localStorage.removeItem(STORAGE_KEYS.nightRoutine)
    setStatuses({})
    setCurrentView('morning-routine')
    setCreativeBlockStartTime(null)
    setActiveTab('home')
  }

  const handleStartCreativeBlock = () => {
    if (!creativeBlockStartTime) {
      setCreativeBlockStartTime(Date.now())
    }
  }

  const renderFocus = () => (
    <MorningRoutine
      items={items}
      statuses={statuses}
      currentView={currentView}
      onStatusChange={handleStatusChange}
      onViewChange={setCurrentView}
      creativeBlockStartTime={creativeBlockStartTime}
      onStartCreativeBlock={handleStartCreativeBlock}
      onNewDay={() => {
        localStorage.removeItem(STORAGE_KEYS.statuses)
        localStorage.removeItem(STORAGE_KEYS.currentView)
        localStorage.removeItem(STORAGE_KEYS.creativeBlockStart)
        localStorage.removeItem(STORAGE_KEYS.workSessions)
        localStorage.removeItem(STORAGE_KEYS.nightRoutine)
        setStatuses({})
        setCurrentView('morning-routine')
        setCreativeBlockStartTime(null)
      }}
      dayActive={dayActive}
    />
  )

  return (
    <div className="h-dvh overflow-hidden bg-black text-white">
      <div
        className="mx-auto flex h-dvh max-w-[430px] flex-col"
        style={{ paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}
      >
        <AnimatePresence>
          {dayActive && (
            <DayCountdownBar
              key="day-bar"
              remainingMs={Math.max(dayRemainingMs, 0)}
              onEndDay={handleEndDay}
            />
          )}
        </AnimatePresence>
        <main className="flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {activeTab === 'home' && (
                <DashboardTab
                  onNavigateToFocus={() => setActiveTab('focus')}
                  dayActive={dayActive}
                  onStartDay={handleStartDay}
                />
              )}
              {activeTab === 'focus' && renderFocus()}
              {activeTab === 'state' && <StateTab />}
              {activeTab === 'badges' && <BadgesTab />}
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'history' && <HistoryTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      <DevPanel />
    </div>
  )
}
