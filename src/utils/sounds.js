let ctx = null

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, duration, gain = 0.08) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration / 1000)
  osc.connect(g)
  g.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration / 1000)
}

export const sounds = {
  tap: () => tone(1200, 30, 0.06),

  complete: () => {
    tone(523.25, 80, 0.07) // C5
    setTimeout(() => tone(659.25, 80, 0.07), 90)  // E5
    setTimeout(() => tone(783.99, 120, 0.07), 180) // G5
  },

  success: () => {
    const c = getCtx()
    if (!c) return
    const freqs = [500, 630, 750]
    for (const f of freqs) {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      g.gain.setValueAtTime(0.05, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      osc.connect(g)
      g.connect(c.destination)
      osc.start()
      osc.stop(c.currentTime + 0.2)
    }
  },

  // ── Affirmation flow sounds ────────────────────────────────────────────

  // Conviction: warm low hum that rises in pitch — feels like building pressure
  convictionTick: () => tone(220, 60, 0.04),

  // Conviction hold: subtle drone that plays while holding
  convictionHold: () => {
    const c = getCtx()
    if (!c) return
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, c.currentTime)
    osc.frequency.linearRampToValueAtTime(180, c.currentTime + 0.3)
    g.gain.setValueAtTime(0.03, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.3)
  },

  // Conviction settle: soft resolved chord
  convictionSettle: () => {
    tone(330, 150, 0.05) // E4
    setTimeout(() => tone(440, 150, 0.05), 60) // A4
    setTimeout(() => tone(554, 200, 0.04), 120) // C#5
  },

  // Resistance tap: sharp percussive hit, slightly dissonant
  resistanceTap: () => {
    const c = getCtx()
    if (!c) return
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(800, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.08)
    g.gain.setValueAtTime(0.1, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.08)
  },

  // Resistance settle: low thud
  resistanceSettle: () => {
    const c = getCtx()
    if (!c) return
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(100, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.2)
    g.gain.setValueAtTime(0.08, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.2)
  },

  // Swipe between affirmations in reader: soft whoosh
  swipe: () => {
    const c = getCtx()
    if (!c) return
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.1)
    g.gain.setValueAtTime(0.04, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.1)
  },

  // Phase transition (conviction intro → resistance intro): ascending chime
  phaseTransition: () => {
    tone(440, 100, 0.05)  // A4
    setTimeout(() => tone(554, 100, 0.05), 80)  // C#5
    setTimeout(() => tone(659, 150, 0.05), 160)  // E5
    setTimeout(() => tone(880, 250, 0.04), 260)  // A5
  },
}
