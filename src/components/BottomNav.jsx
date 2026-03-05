import { motion } from 'framer-motion'
import { haptics } from '../utils/haptics.js'

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
  </svg>
)

const FocusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const StateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </svg>
)

const BadgesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
  </svg>
)

const StatsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

const HistoryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
    <path d="M7 4h4" />
  </svg>
)

const DopamineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const tabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'focus', label: 'Flow', Icon: FocusIcon },
  { id: 'state', label: 'State', Icon: StateIcon },
  { id: 'mental', label: 'Mental', Icon: BadgesIcon },
  { id: 'dopamine', label: 'Dopamine', Icon: DopamineIcon },
  { id: 'history', label: 'History', Icon: HistoryIcon },
]

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="glass-bar border-t border-white/[0.04]">
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              onClick={() => {
                haptics.tap()
                onChange(tab.id)
              }}
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 outline-none"
            >
              <span
                className={`transition-opacity duration-200 ${
                  active ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <tab.Icon />
              </span>
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  active ? 'text-white' : 'text-white/30'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>

    </nav>
  )
}
