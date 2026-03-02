import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const CATEGORY_COLORS = {
  nutrition: '#30D158',
  work: '#5E9EFF',
  'mental-power': '#BF5AF2',
  personality: '#FF9F0A',
  creativity: '#FF375F',
  physical: '#64D2FF',
  relationships: '#FFD60A',
}

const MAX_DOTS = 24
const MAX_TREND_DAYS = 14

function VotePile({ category, positive, negative, delay = 0 }) {
  const color = CATEGORY_COLORS[category] || '#ffffff'
  const posDots = Math.min(positive, MAX_DOTS)
  const negDots = Math.min(negative, MAX_DOTS)
  const posOverflow = positive > MAX_DOTS ? positive - MAX_DOTS : 0
  const negOverflow = negative > MAX_DOTS ? negative - MAX_DOTS : 0

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium text-white/40">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {category}
        </span>
        <span className="text-[11px] font-medium tabular-nums text-white/20">
          +{positive} / -{negative}
        </span>
      </div>
      <div className="flex items-end gap-0">
        <div className="flex flex-1 justify-end">
          <div className="flex flex-wrap-reverse justify-end gap-[3px]">
            {posOverflow > 0 && (
              <span className="self-center text-[10px] text-white/20 mr-1">+{posOverflow}</span>
            )}
            {Array.from({ length: posDots }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + i * 0.025, type: 'spring', stiffness: 600, damping: 28 }}
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: 'rgba(48, 209, 88, 0.55)' }}
              />
            ))}
          </div>
        </div>

        <div className="mx-2 w-px self-stretch min-h-[10px] bg-white/[0.08] flex-shrink-0" />

        <div className="flex flex-1 justify-start">
          <div className="flex flex-wrap-reverse justify-start gap-[3px]">
            {Array.from({ length: negDots }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + i * 0.025 + 0.08, type: 'spring', stiffness: 600, damping: 28 }}
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: 'rgba(255, 69, 58, 0.5)' }}
              />
            ))}
            {negOverflow > 0 && (
              <span className="self-center text-[10px] text-white/20 ml-1">+{negOverflow}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VoteItem({ vote }) {
  const color = CATEGORY_COLORS[vote.category] || '#ffffff'

  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 text-[14px] font-semibold ${
          vote.polarity === 'positive' ? 'text-positive/60' : 'text-negative/60'
        }`}
      >
        {vote.polarity === 'positive' ? '+' : '-'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-snug text-white/60">{vote.action}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/15">
          {vote.source}
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {vote.category}
        </p>
      </div>
      {vote.weight !== 1 && (
        <span className="text-[12px] font-medium text-white/15">{vote.weight}x</span>
      )}
    </div>
  )
}

const fetchJson = async (url) => {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    return null
  }
}

const formatDateLabel = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: '2-digit' })
    .formatToParts(date)
  const weekday = parts.find((part) => part.type === 'weekday')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${weekday} ${day}`.trim()
}

const formatFullDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

const formatSleepSummary = (sleepData) => {
  if (!sleepData) return '--'
  const hours = sleepData.hoursSlept
  const score = sleepData.sleepScore
  const hoursLabel = hours != null ? `${Number(hours).toFixed(1)}h` : null
  const scoreLabel = score != null ? `score ${Number(score).toFixed(1)}` : null
  if (hoursLabel && scoreLabel) return `${hoursLabel} • ${scoreLabel}`
  return hoursLabel || scoreLabel || '--'
}

const formatCompletionRate = (completionRate) => {
  if (completionRate == null) return '--'
  if (typeof completionRate === 'string') return completionRate
  if (typeof completionRate === 'number') {
    if (completionRate <= 1) {
      return `${Math.round(completionRate * 100)}% completed`
    }
    return `${completionRate} completed`
  }
  return '--'
}

const formatWorkSummary = (workData) => {
  if (!workData) return '--'
  const sessions = Array.isArray(workData.sessions) ? workData.sessions : []
  const completed = sessions.filter((session) => session.endedAt || session.compositeScore != null)
  const scored = completed.filter((session) => session.compositeScore != null)
  const avgComposite = scored.length
    ? scored.reduce((sum, session) => sum + Number(session.compositeScore || 0), 0) / scored.length
    : null
  if (completed.length === 0 && avgComposite == null) return '--'
  if (avgComposite != null) {
    return `${completed.length} sessions • avg ${avgComposite.toFixed(1)}`
  }
  return `${completed.length} sessions`
}

export default function HistoryTab() {
  const [historyDates, setHistoryDates] = useState(null)
  const [historyError, setHistoryError] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [trendVotes, setTrendVotes] = useState({})
  const [dayData, setDayData] = useState({
    votes: null,
    sleep: null,
    morning: null,
    work: null,
  })
  const [dayLoading, setDayLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchJson('/api/history')
      .then((data) => {
        if (!mounted) return
        if (!Array.isArray(data)) {
          setHistoryError(true)
          setHistoryDates([])
          return
        }
        const sorted = [...data].sort()
        setHistoryDates(sorted)
        if (sorted.length > 0) {
          setSelectedDate((prev) => prev || sorted[sorted.length - 1])
        }
      })
      .catch(() => {
        if (!mounted) return
        setHistoryError(true)
        setHistoryDates([])
      })
    return () => {
      mounted = false
    }
  }, [])

  const recentDates = useMemo(() => {
    if (!historyDates) return []
    return historyDates.slice(-MAX_TREND_DAYS)
  }, [historyDates])

  useEffect(() => {
    let active = true
    if (!recentDates.length) {
      setTrendVotes({})
      return () => {}
    }

    const loadTrend = async () => {
      const entries = await Promise.all(
        recentDates.map(async (date) => {
          const data = await fetchJson(`/api/history/${date}/votes`)
          const votes = Array.isArray(data?.votes) ? data.votes : []
          const positive = votes.filter((v) => v.polarity === 'positive').length
          const negative = votes.filter((v) => v.polarity === 'negative').length
          return [date, {
            net: positive - negative,
            hasVotes: votes.length > 0,
          }]
        })
      )
      if (!active) return
      setTrendVotes(Object.fromEntries(entries))
    }

    loadTrend()
    return () => {
      active = false
    }
  }, [recentDates])

  useEffect(() => {
    let active = true
    if (!selectedDate) {
      setDayData({ votes: null, sleep: null, morning: null, work: null })
      return () => {}
    }

    setDayLoading(true)
    Promise.all([
      fetchJson(`/api/history/${selectedDate}/votes`),
      fetchJson(`/api/history/${selectedDate}/sleep-data`),
      fetchJson(`/api/history/${selectedDate}/morning-state`),
      fetchJson(`/api/history/${selectedDate}/work-sessions`),
    ])
      .then(([votes, sleep, morning, work]) => {
        if (!active) return
        setDayData({ votes, sleep, morning, work })
      })
      .finally(() => {
        if (!active) return
        setDayLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedDate])

  if (historyError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-[15px] text-white/25">
        Could not load history.
      </div>
    )
  }

  if (!historyDates) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    )
  }

  if (historyDates.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="text-center text-[15px] leading-relaxed text-white/25">
          No history yet. Data archives daily at 3am.
        </p>
      </div>
    )
  }

  const trendValues = Object.values(trendVotes)
  const maxAbsNet = Math.max(1, ...trendValues.map((value) => Math.abs(value.net)))

  const allVotes = Array.isArray(dayData.votes?.votes) ? dayData.votes.votes : []
  const positiveVotes = allVotes.filter((v) => v.polarity === 'positive')
  const negativeVotes = allVotes.filter((v) => v.polarity === 'negative')

  const categories = {}
  for (const vote of allVotes) {
    if (!categories[vote.category]) categories[vote.category] = { positive: 0, negative: 0 }
    categories[vote.category][vote.polarity] += 1
  }

  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => (b.positive + b.negative) - (a.positive + a.negative))

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto no-scrollbar">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[28px] font-bold tracking-tight">History</h1>
        <div className="mt-2 text-[13px] text-white/30">
          {selectedDate ? formatFullDate(selectedDate) : '--'}
        </div>
      </div>

      <div className="space-y-6 px-6 pb-6">
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/15">Trend</p>
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/15">
              last {recentDates.length} days
            </span>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentDates.map((date, index) => {
              const trend = trendVotes[date] || { net: 0, hasVotes: false }
              const net = trend.net
              const absNet = Math.abs(net)
              const ratio = absNet / maxAbsNet
              const barHeight = Math.max(2, Math.round(ratio * 18))
              const isNeutral = net === 0
              const barColor = net > 0
                ? 'rgba(48, 209, 88, 0.85)'
                : net < 0
                  ? 'rgba(255, 69, 58, 0.85)'
                  : 'rgba(255, 255, 255, 0.18)'

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`flex min-w-[56px] flex-col items-center gap-2 rounded-2xl px-2 py-2 transition-colors ${
                    selectedDate === date ? 'bg-white/[0.08]' : 'bg-white/[0.02]'
                  }`}
                >
                  <span className={`text-[11px] font-medium ${
                    selectedDate === date ? 'text-white/70' : 'text-white/35'
                  }`}>
                    {formatDateLabel(date)}
                  </span>
                  <div className="relative h-12 w-3">
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.08]" />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barHeight }}
                      transition={{ duration: 0.4, delay: index * 0.02 }}
                      className="absolute left-0 right-0 rounded-full"
                      style={{
                        background: barColor,
                        opacity: trend.hasVotes ? 0.9 : 0.35,
                        bottom: net >= 0 ? '50%' : undefined,
                        top: net < 0 ? '50%' : undefined,
                        height: isNeutral ? 2 : barHeight,
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/15">Day Summary</p>
            <span className="text-[11px] text-white/25">{selectedDate}</span>
          </div>
          {dayLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-widest text-white/20">
                  Sleep
                </span>
                <span className="text-[14px] text-white/60">{formatSleepSummary(dayData.sleep)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-widest text-white/20">
                  Morning
                </span>
                <span className="text-[14px] text-white/60">
                  {formatCompletionRate(dayData.morning?.completionRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-widest text-white/20">
                  Work
                </span>
                <span className="text-[14px] text-white/60">{formatWorkSummary(dayData.work)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/15">
                Votes By Category
              </p>
              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-widest">
                <span className="text-positive/40">pos</span>
                <span className="w-px h-3 bg-white/[0.08]" />
                <span className="text-negative/40">neg</span>
              </div>
            </div>

            {allVotes.length === 0 ? (
              <p className="mt-4 text-[14px] text-white/30">No votes logged this day.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {sortedCategories.map(([cat, counts], i) => (
                  <VotePile
                    key={cat}
                    category={cat}
                    positive={counts.positive}
                    negative={counts.negative}
                    delay={i * 0.05}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/15">
                Vote Timeline
              </p>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="font-medium text-positive/60">+{positiveVotes.length}</span>
                <span className="font-medium text-negative/60">-{negativeVotes.length}</span>
                <span className="text-white/20">{allVotes.length} total</span>
              </div>
            </div>
            {allVotes.length === 0 ? (
              <p className="mt-4 text-[14px] text-white/30">No votes recorded.</p>
            ) : (
              <div className="mt-3 divide-y divide-white/[0.03]">
                {[...allVotes].reverse().map((vote) => (
                  <VoteItem key={vote.id || `${vote.timestamp}-${vote.action}`} vote={vote} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
