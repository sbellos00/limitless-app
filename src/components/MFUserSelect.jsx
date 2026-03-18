import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

const FONT = "'Bebas Neue', sans-serif"
const API_KEY = import.meta.env.VITE_API_KEY || ''

function apiHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra }
  if (API_KEY) h['X-API-Key'] = API_KEY
  return h
}

const AVATARS = {
  stef: '/LimitlessPreloader/Neo.jpg',
  john: '/LimitlessPreloader/KobeFlinch.jpg',
}

export default function MFUserSelect({ onAuth }) {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    fetch('/api/auth/users', { headers: apiHeaders() })
      .then(r => r.json())
      .then(setUsers)
      .catch(() => {})
  }, [])

  const handleSelect = useCallback((user) => {
    setSelected(user)
    setPassword('')
    setError(false)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleBack = useCallback(() => {
    setSelected(null)
    setPassword('')
    setError(false)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!selected || !password || loading) return
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ userId: selected.id, password }),
      })
      const data = await res.json()
      if (data.ok) {
        onAuth(data.userId, data.name)
      } else {
        setError(true)
        setPassword('')
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selected, password, loading, onAuth])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="select"
            className="z-10 flex flex-col items-center gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p
              className="text-[18px] uppercase tracking-[0.25em] text-white/30"
              style={{ fontFamily: FONT }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Who's training?
            </motion.p>

            <div className="flex gap-10">
              {users.map((user, i) => (
                <motion.button
                  key={user.id}
                  className="flex flex-col items-center gap-3 group"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + i * 0.1,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(user)}
                >
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-colors">
                    <img
                      src={AVATARS[user.name] || AVATARS.stef}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  <span className="text-[18px] uppercase tracking-wider text-white/60 group-hover:text-white/90 transition-colors capitalize"
                    style={{ fontFamily: FONT }}>
                    {user.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="password"
            className="z-10 flex flex-col items-center gap-6 w-full max-w-[280px]"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20">
                <img
                  src={AVATARS[selected.name] || AVATARS.stef}
                  alt={selected.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[18px] uppercase tracking-wider text-white/70 capitalize"
                style={{ fontFamily: FONT }}>
                {selected.name}
              </span>
            </motion.div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
              <motion.div
                className="w-full relative"
                animate={error ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false) }}
                  placeholder="ENTER PIN"
                  className="w-full px-4 py-3 text-center text-[22px] tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  style={{ fontFamily: FONT, letterSpacing: '0.3em' }}
                  autoComplete="off"
                />
                {error && (
                  <motion.p
                    className="absolute -bottom-5 left-0 right-0 text-center text-[12px] text-red-400/80"
                    style={{ fontFamily: FONT }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Wrong PIN
                  </motion.p>
                )}
              </motion.div>

              <motion.button
                type="submit"
                className="w-full py-3 rounded-xl text-[14px] uppercase tracking-[0.2em] transition-all"
                style={{
                  fontFamily: FONT,
                  background: password.length >= 4 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  color: password.length >= 4 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${password.length >= 4 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}
                whileTap={{ scale: 0.97 }}
                disabled={password.length < 4 || loading}
              >
                {loading ? 'Verifying...' : 'Enter'}
              </motion.button>
            </form>

            <motion.button
              className="text-[13px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors mt-2"
              style={{ fontFamily: FONT }}
              onClick={handleBack}
              whileTap={{ scale: 0.95 }}
            >
              Switch user
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
