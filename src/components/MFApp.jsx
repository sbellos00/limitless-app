import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import MFPreloader from './MFPreloader.jsx'
import MFUserSelect from './MFUserSelect.jsx'
import MentalFitnessTest from './MentalFitnessTest.jsx'
import { getThemeForXp, applyThemeToDOM } from '../theme.jsx'

const AUTH_KEY = 'limitless_mf_auth'

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

// Set global user ID for all API calls
let _currentUserId = null
export function getCurrentUserId() { return _currentUserId }

export default function MFApp() {
  const [phase, setPhase] = useState('preloader') // preloader | auth | app
  const [auth, setAuth] = useState(getStoredAuth)

  // If already authenticated, skip to app after preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(auth ? 'app' : 'auth')
    }, 2500)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set the global user ID whenever auth changes
  useEffect(() => {
    _currentUserId = auth?.userId || null
  }, [auth])

  const handleAuth = useCallback((userId, name) => {
    const authData = { userId, name }
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    setAuth(authData)
    _currentUserId = userId
    setPhase('app')
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setAuth(null)
    _currentUserId = null
    setPhase('auth')
    // Reset theme to default
    applyThemeToDOM(getThemeForXp(0))
  }, [])

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'preloader' && (
          <motion.div
            key="preloader"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.785, 0.135, 0.15, 0.86] }}
            className="h-full w-full"
          >
            <MFPreloader />
          </motion.div>
        )}

        {phase === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full"
          >
            <MFUserSelect onAuth={handleAuth} />
          </motion.div>
        )}

        {phase === 'app' && auth && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full flex flex-col"
          >
            <div className="mx-auto flex w-full max-w-[430px] min-h-0 flex-1 flex-col relative">
              <MentalFitnessTest onLogout={handleLogout} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
