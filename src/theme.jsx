import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

// ── 8 Level Themes ─────────────────────────────────────────────────────────
// Each level completely transforms the app's visual identity.

export const THEME_LEVELS = [
  // Level 1 — Awakened — Hajime no Ippo anime-cel energy
  {
    name: 'Awakened',     short: 'AWKN', minXp: 0,
    title: 'Hajime no Ippo',
    bg:           '#0e0e1a',
    bgSecondary:  '#151524',
    bgCard:       'rgba(135,206,235,0.07)',
    text:         '#ffffff',
    textSecondary:'rgba(255,255,255,0.65)',
    textMuted:    'rgba(255,255,255,0.30)',
    accent:       '#87ceeb',
    accentAlt:    '#e85d8a',
    cardBorder:   'rgba(135,206,235,0.18)',
    navBg:        'rgba(14,14,26,0.92)',
    navBorder:    'rgba(135,206,235,0.12)',
    fontBody:     "'Nunito', sans-serif",
    fontHeader:   "'Fredoka One', 'Nunito', sans-serif",
    radius:       '16px',
    radiusSm:     '12px',
    borderWidth:  '2px',
    glassBg:      'rgba(135,206,235,0.05)',
    glassBorder:  'rgba(135,206,235,0.10)',
    glow:         0.12,
    grain:        false,
    special:      'anime',      // bouncy micro-animations, bold stroke borders
  },

  // Level 2 — Practitioner — Bruce Lee warm analog film
  {
    name: 'Practitioner', short: 'PRAC', minXp: 300,
    title: 'Bruce Lee',
    bg:           '#1c1c1c',
    bgSecondary:  '#242018',
    bgCard:       'rgba(212,196,160,0.06)',
    text:         '#d4c4a0',
    textSecondary:'rgba(212,196,160,0.55)',
    textMuted:    'rgba(212,196,160,0.28)',
    accent:       '#c97b3a',
    accentAlt:    '#d4c4a0',
    cardBorder:   'rgba(201,123,58,0.15)',
    navBg:        'rgba(28,28,28,0.92)',
    navBorder:    'rgba(201,123,58,0.10)',
    fontBody:     "'Helvetica Neue', Arial, sans-serif",
    fontHeader:   "'Helvetica Neue', Arial, sans-serif",
    radius:       '12px',
    radiusSm:     '8px',
    borderWidth:  '1px',
    glassBg:      'rgba(212,196,160,0.04)',
    glassBorder:  'rgba(201,123,58,0.08)',
    glow:         0.10,
    grain:        true,
    special:      'film',       // grain texture overlays, compact centered layouts
  },

  // Level 3 — Adept — Matrix: Combat (Neo ready to fight)
  {
    name: 'Adept',        short: 'ADPT', minXp: 1000,
    title: 'The One',
    bg:           '#0a0a0a',
    bgSecondary:  '#0d0d0d',
    bgCard:       'rgba(0,255,65,0.04)',
    text:         '#39ff14',
    textSecondary:'rgba(57,255,20,0.55)',
    textMuted:    'rgba(57,255,20,0.25)',
    accent:       '#39ff14',
    accentAlt:    '#ff003c',
    cardBorder:   'rgba(57,255,20,0.15)',
    navBg:        'rgba(10,10,10,0.95)',
    navBorder:    'rgba(57,255,20,0.10)',
    fontBody:     "'JetBrains Mono', 'Courier New', monospace",
    fontHeader:   "'Share Tech Mono', 'JetBrains Mono', monospace",
    radius:       '0px',
    radiusSm:     '0px',
    borderWidth:  '1px',
    glassBg:      'rgba(57,255,20,0.03)',
    glassBorder:  'rgba(57,255,20,0.08)',
    glow:         0.14,
    grain:        false,
    special:      'ink',        // tactical HUD, hex grid, targeting overlays
  },

  // Level 4 — Warrior — The Commander Before Battle (sepia warmth)
  {
    name: 'Warrior',      short: 'WARR', minXp: 3000,
    title: 'The Commander',
    bg:           '#161412',
    bgSecondary:  '#1e1a16',
    bgCard:       'rgba(196,164,108,0.06)',
    text:         '#ddd5c0',
    textSecondary:'rgba(221,213,192,0.55)',
    textMuted:    'rgba(221,213,192,0.28)',
    accent:       '#c4a46c',
    accentAlt:    '#ddd5c0',
    cardBorder:   'rgba(196,164,108,0.14)',
    navBg:        'rgba(22,20,18,0.94)',
    navBorder:    'rgba(196,164,108,0.10)',
    fontBody:     "'Source Serif 4', 'Georgia', serif",
    fontHeader:   "'Bebas Neue', sans-serif",
    radius:       '8px',
    radiusSm:     '4px',
    borderWidth:  '1px',
    glassBg:      'rgba(196,164,108,0.04)',
    glassBorder:  'rgba(196,164,108,0.08)',
    glow:         0.14,
    grain:        true,
    special:      'war-room',   // wide cinematic layouts, banner headers, bold top bars
  },

  // Level 5 — Master — The Hooded Mountaineer (gunmetal)
  {
    name: 'Master',       short: 'MSTR', minXp: 6000,
    title: 'The Mountaineer',
    bg:           '#141618',
    bgSecondary:  '#1a1c1f',
    bgCard:       'rgba(58,61,66,0.35)',
    text:         '#e8e9eb',
    textSecondary:'rgba(232,233,235,0.50)',
    textMuted:    'rgba(92,99,112,0.55)',
    accent:       '#5c6370',
    accentAlt:    '#ffffff',
    cardBorder:   'rgba(92,99,112,0.18)',
    navBg:        'rgba(20,22,24,0.94)',
    navBorder:    'rgba(92,99,112,0.10)',
    fontBody:     "'Outfit', 'Manrope', sans-serif",
    fontHeader:   "'Outfit', 'Manrope', sans-serif",
    radius:       '6px',
    radiusSm:     '3px',
    borderWidth:  '1px',
    glassBg:      'rgba(58,61,66,0.20)',
    glassBorder:  'rgba(92,99,112,0.10)',
    glow:         0.16,
    grain:        false,
    special:      'mountain',   // fog-gradient dividers, jagged angular elements
  },

  // Level 6 — Legend — Matrix: Transcendence (Neo stopping bullets)
  {
    name: 'Legend',        short: 'LGND', minXp: 11000,
    title: 'The Transcendent',
    bg:           '#0a0808',
    bgSecondary:  '#0e0c0a',
    bgCard:       'rgba(212,170,92,0.04)',
    text:         '#d4aa5c',
    textSecondary:'rgba(212,170,92,0.50)',
    textMuted:    'rgba(212,170,92,0.22)',
    accent:       '#d4aa5c',
    accentAlt:    '#e8dcc8',
    cardBorder:   'rgba(212,170,92,0.12)',
    navBg:        'rgba(10,8,8,0.96)',
    navBorder:    'rgba(212,170,92,0.08)',
    fontBody:     "'JetBrains Mono', 'Courier New', monospace",
    fontHeader:   "'Share Tech Mono', 'JetBrains Mono', monospace",
    radius:       '0px',
    radiusSm:     '0px',
    borderWidth:  '1px',
    glassBg:      'rgba(212,170,92,0.025)',
    glassBorder:  'rgba(212,170,92,0.06)',
    glow:         0.18,
    grain:        false,
    special:      'snow',       // gold code rain, bullet-time, transcendent overlays
  },

  // Level 7 — Ascended — The Archilochus Knight (desaturated warmth)
  {
    name: 'Ascended',     short: 'ASCN', minXp: 18000,
    title: 'The Knight',
    bg:           '#141311',
    bgSecondary:  '#1a1916',
    bgCard:       'rgba(160,154,144,0.05)',
    text:         '#e8e0d0',
    textSecondary:'rgba(160,154,144,0.60)',
    textMuted:    'rgba(160,154,144,0.30)',
    accent:       '#a09a90',
    accentAlt:    '#e8e0d0',
    cardBorder:   'rgba(160,154,144,0.10)',
    navBg:        'rgba(20,19,17,0.94)',
    navBorder:    'rgba(160,154,144,0.06)',
    fontBody:     "system-ui, sans-serif",
    fontHeader:   "'Playfair Display', serif",
    radius:       '10px',
    radiusSm:     '6px',
    borderWidth:  '1px',
    glassBg:      'rgba(160,154,144,0.035)',
    glassBorder:  'rgba(160,154,144,0.06)',
    glow:         0.18,
    grain:        true,
    special:      'knight',     // diagonal compositions, canvas textures, light/shadow gradients
  },

  // Level 8 — Eternal — The Cosmic Shroud (total black galaxy)
  {
    name: 'Eternal',      short: 'ETRN', minXp: 28000,
    title: 'The Cosmic Shroud',
    bg:           '#050505',
    bgSecondary:  '#0a0a0a',
    bgCard:       'rgba(160,160,170,0.03)',
    text:         '#d4d4dc',
    textSecondary:'rgba(160,160,170,0.45)',
    textMuted:    'rgba(160,160,170,0.22)',
    accent:       '#808088',
    accentAlt:    '#d4d4dc',
    cardBorder:   'rgba(160,160,170,0.05)',
    navBg:        'rgba(5,5,5,0.95)',
    navBorder:    'rgba(160,160,170,0.04)',
    fontBody:     "'Cormorant Garamond', serif",
    fontHeader:   "'Cormorant Garamond', serif",
    radius:       '16px',
    radiusSm:     '10px',
    borderWidth:  '1px',
    glassBg:      'rgba(160,160,170,0.02)',
    glassBorder:  'rgba(160,160,170,0.03)',
    glow:         0.18,
    grain:        false,
    special:      'cosmic',     // star particles, floating glass, inner glow, total black void
  },
]

// ── Theme Resolution ─────────────────────────────────────────────────────────

export function getThemeForXp(xp) {
  let theme = THEME_LEVELS[0]
  let idx = 0
  for (let i = 0; i < THEME_LEVELS.length; i++) {
    if (xp >= THEME_LEVELS[i].minXp) {
      theme = THEME_LEVELS[i]
      idx = i
    }
  }
  const next = THEME_LEVELS[idx + 1] || null
  return { ...theme, idx, next }
}

// ── CSS Variable Application ─────────────────────────────────────────────────

export function applyThemeToDOM(theme) {
  const root = document.documentElement
  const s = root.style

  s.setProperty('--bg-primary', theme.bg)
  s.setProperty('--bg-secondary', theme.bgSecondary)
  s.setProperty('--bg-card', theme.bgCard)
  s.setProperty('--text-primary', theme.text)
  s.setProperty('--text-secondary', theme.textSecondary)
  s.setProperty('--text-muted', theme.textMuted)
  s.setProperty('--accent', theme.accent)
  s.setProperty('--accent-alt', theme.accentAlt)
  s.setProperty('--card-border', theme.cardBorder)
  s.setProperty('--nav-bg', theme.navBg)
  s.setProperty('--nav-border', theme.navBorder)
  s.setProperty('--font-body', theme.fontBody)
  s.setProperty('--font-header', theme.fontHeader)
  s.setProperty('--radius', theme.radius)
  s.setProperty('--radius-sm', theme.radiusSm)
  s.setProperty('--border-width', theme.borderWidth)
  s.setProperty('--glass-bg', theme.glassBg)
  s.setProperty('--glass-border', theme.glassBorder)
  s.setProperty('--glow', String(theme.glow))

  // Set meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.bg)

  // Set data attribute for CSS special selectors
  root.setAttribute('data-theme', theme.special)
}

// ── CSS Variables from theme (for local scoping on containers) ───────────────

export function getThemeVars(theme) {
  return {
    '--bg-primary': theme.bg,
    '--bg-secondary': theme.bgSecondary,
    '--bg-card': theme.bgCard,
    '--text-primary': theme.text,
    '--text-secondary': theme.textSecondary,
    '--text-muted': theme.textMuted,
    '--accent': theme.accent,
    '--accent-alt': theme.accentAlt,
    '--card-border': theme.cardBorder,
    '--nav-bg': theme.navBg,
    '--nav-border': theme.navBorder,
    '--font-body': theme.fontBody,
    '--font-header': theme.fontHeader,
    '--radius': theme.radius,
    '--radius-sm': theme.radiusSm,
    '--border-width': theme.borderWidth,
    '--glass-bg': theme.glassBg,
    '--glass-border': theme.glassBorder,
    '--glow': String(theme.glow),
  }
}

// ── React Context ────────────────────────────────────────────────────────────

const APP_THEME = getThemeForXp(0)
const ThemeContext = createContext(null)

function getMfXp() {
  try {
    const cached = localStorage.getItem('limitless_mf_xp')
    if (cached != null) return parseInt(cached, 10) || 0
    const raw = localStorage.getItem('limitless_mental_fitness')
    if (!raw) return 0
    const data = JSON.parse(raw)
    const sessions = data.sessions || []
    return sessions.reduce((sum, s) => {
      if (s.xpAwarded != null) return sum + (s.xpAwarded || 0)
      const DEPTH_MULT = [1, 1.5, 2]
      const mult = DEPTH_MULT[(s.depth || 1) - 1] || 1
      return sum + Math.round((s.durationMin || 0) * mult)
    }, 0)
  } catch { return 0 }
}

export function ThemeProvider({ children }) {
  const [mfXp, setMfXp] = useState(getMfXp)
  const mfTheme = useMemo(() => getThemeForXp(mfXp), [mfXp])

  useEffect(() => {
    applyThemeToDOM(APP_THEME)
  }, [])

  const value = useMemo(() => ({
    theme: APP_THEME,
    mfTheme,
    mfXp,
    setMfXp,
  }), [mfTheme, mfXp])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

// Re-export for MentalFitnessTest compatibility
export { THEME_LEVELS as LEVELS }
