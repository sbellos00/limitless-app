import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Overlays
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* Cosmic — canvas star field with twinkling + nebula + cross-halos */
function StarField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const dpr = window.devicePixelRatio || 2
    const W = c.width = c.offsetWidth * dpr
    const H = c.height = c.offsetHeight * dpr
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.2,
      speed: Math.random() * 0.5 + 0.08,
      phase: Math.random() * Math.PI * 2,
    }))
    const nebulae = [
      { x: W * 0.25, y: H * 0.3, r: W * 0.25, color: '140,130,160' },
      { x: W * 0.72, y: H * 0.6, r: W * 0.2, color: '160,155,150' },
      { x: W * 0.5, y: H * 0.85, r: W * 0.28, color: '130,130,140' },
    ]
    let frame
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H)
      for (const n of nebulae) {
        const drift = Math.sin(t * 0.00008 + n.x) * 15
        const g = ctx.createRadialGradient(n.x + drift, n.y, 0, n.x + drift, n.y, n.r)
        g.addColorStop(0, `rgba(${n.color},0.015)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }
      for (const s of stars) {
        const a = 0.1 + 0.4 * Math.sin(t * 0.001 * s.speed + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(210,210,220,${a})`
        ctx.fill()
        if (s.r > 1.4 && a > 0.35) {
          ctx.strokeStyle = `rgba(210,210,220,${a * 0.25})`
          ctx.lineWidth = 0.5
          ctx.beginPath(); ctx.moveTo(s.x - s.r * 3, s.y); ctx.lineTo(s.x + s.r * 3, s.y); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(s.x, s.y - s.r * 3); ctx.lineTo(s.x, s.y + s.r * 3); ctx.stroke()
        }
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1]" style={{ width: '100%', height: '100%' }} />
}

/* Snow — canvas falling snow particles */
function SnowFall() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const dpr = window.devicePixelRatio || 2
    const W = c.width = c.offsetWidth * dpr
    const H = c.height = c.offsetHeight * dpr
    const flakes = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: Math.random() * 0.5 + 0.12,
      phase: Math.random() * Math.PI * 2,
    }))
    let frame
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H)
      for (const f of flakes) {
        f.x += f.vx + Math.sin(t * 0.0004 + f.phase) * 0.15
        f.y += f.vy
        if (f.y > H) { f.y = -4; f.x = Math.random() * W }
        if (f.x > W) f.x = 0
        if (f.x < 0) f.x = W
        const a = 0.06 + 0.1 * Math.sin(t * 0.001 + f.phase)
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,242,245,${a})`
        ctx.fill()
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1]" style={{ width: '100%', height: '100%' }} />
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL BACKGROUND — full-page atmospheric effect per level
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelBackground({ special, color }) {
  switch (special) {
    case 'anime':
      return (
        <>
          {/* Speed lines from bottom-right */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            background: `repeating-conic-gradient(from 220deg at 95% 95%, transparent 0deg, transparent 4.5deg, ${color}04 4.8deg, transparent 5.1deg)`,
          }} />
          {/* Halftone dot pattern */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            backgroundImage: `radial-gradient(${color}06 1px, transparent 1px)`,
            backgroundSize: '14px 14px', opacity: 0.5,
          }} />
        </>
      )

    case 'film':
      return (
        <>
          {/* Film grain */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{ opacity: 0.045, mixBlendMode: 'overlay' }}>
            <svg width="100%" height="100%">
              <filter id="mf-film-grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" /></filter>
              <rect width="100%" height="100%" filter="url(#mf-film-grain)" />
            </svg>
          </div>
          {/* Warm sepia vignette */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(40,28,12,0.28) 100%)',
          }} />
          {/* Film perforations left edge */}
          <div className="pointer-events-none fixed top-0 left-0 bottom-0 w-3 z-[1] flex flex-col justify-around items-center py-4" style={{ opacity: 0.07 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{ width: 5, height: 3, borderRadius: 1, background: color }} />
            ))}
          </div>
        </>
      )

    case 'ink':
      return (
        <>
          {/* Large enso circle upper-right */}
          <div className="pointer-events-none fixed inset-0 z-[1]">
            <svg className="absolute" style={{ top: '-8%', right: '-12%', width: '70%', height: '70%', opacity: 0.03 }}
              viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="82" fill="none" stroke={color || '#8c8279'}
                strokeWidth="5" strokeLinecap="round" strokeDasharray="380 120" strokeDashoffset="40" />
            </svg>
          </div>
          {/* Ink wash gradient */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            background: `linear-gradient(180deg, ${color}06 0%, transparent 30%), radial-gradient(ellipse at 20% 80%, ${color}04 0%, transparent 50%)`,
          }} />
        </>
      )

    case 'war-room':
      return (
        <>
          {/* Grain */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{ opacity: 0.02, mixBlendMode: 'overlay' }}>
            <svg width="100%" height="100%">
              <filter id="mf-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter>
              <rect width="100%" height="100%" filter="url(#mf-grain)" />
            </svg>
          </div>
          {/* CRT scan lines */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(196,164,108,0.012) 3px, rgba(196,164,108,0.012) 4px)',
          }} />
          {/* Animated radar sweep */}
          <div className="pointer-events-none fixed inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <div style={{
              position: 'absolute', width: '140vw', height: '140vw', borderRadius: '50%',
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 350deg, ${color}05 355deg, ${color}0A 358deg, transparent 360deg)`,
              animation: 'mf-radar 8s linear infinite',
            }} />
            {[20, 40, 60].map(r => (
              <div key={r} className="absolute rounded-full" style={{ width: `${r}vw`, height: `${r}vw`, border: `1px solid ${color}05` }} />
            ))}
            <style>{`@keyframes mf-radar { to { transform: rotate(360deg) } }`}</style>
          </div>
        </>
      )

    case 'mountain':
      return (
        <div className="pointer-events-none fixed inset-0 z-[1]">
          {/* Distant mountain silhouette */}
          <svg className="absolute bottom-0 left-0 w-full" height="180" viewBox="0 0 800 180" preserveAspectRatio="none" style={{ opacity: 0.03 }}>
            <path d="M0,180 L0,140 L80,90 L160,120 L240,60 L320,100 L400,40 L480,80 L560,50 L640,95 L720,65 L800,110 L800,180 Z" fill={color} />
            <path d="M0,180 L0,155 L100,120 L200,140 L300,95 L400,130 L500,85 L600,125 L700,100 L800,135 L800,180 Z" fill={color} opacity="0.5" />
          </svg>
          {/* Drifting fog */}
          {[28, 52, 75].map((top, i) => (
            <motion.div key={top} className="absolute inset-x-0"
              style={{ top: `${top}%`, height: '80px', background: `linear-gradient(180deg, transparent, ${color}04, transparent)` }}
              animate={{ x: [0, i % 2 === 0 ? 25 : -25, 0] }}
              transition={{ duration: 14 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          {/* Topo contour lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ opacity: 0.02 }}>
            {[30, 45, 60, 75].map(y => (
              <path key={y} d={`M0,${y}% Q25%,${y - 8}% 50%,${y}% T100%,${y}%`}
                fill="none" stroke={color} strokeWidth="0.5" />
            ))}
          </svg>
        </div>
      )

    case 'snow':
      return <SnowFall />

    case 'knight':
      return (
        <>
          {/* Canvas/parchment noise */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{ opacity: 0.025, mixBlendMode: 'overlay' }}>
            <svg width="100%" height="100%">
              <filter id="mf-canvas"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" stitchTiles="stitch" /></filter>
              <rect width="100%" height="100%" filter="url(#mf-canvas)" />
            </svg>
          </div>
          {/* Diagonal candlelight */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            background: `linear-gradient(135deg, ${color}05 0%, transparent 35%, transparent 65%, ${color}03 100%)`,
          }} />
          {/* Parchment edge darkening */}
          <div className="pointer-events-none fixed inset-0 z-[1]" style={{
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.12)',
          }} />
        </>
      )

    case 'cosmic':
      return <StarField />

    default: return null
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL DIVIDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelDivider({ special, color }) {
  switch (special) {
    case 'anime':
      return (
        <div className="relative my-4 h-5 flex items-center justify-center overflow-hidden">
          <svg width="100%" height="20" viewBox="0 0 300 20" preserveAspectRatio="none">
            <path d="M0,10 L15,3 L30,17 L45,3 L60,17 L75,3 L90,17 L105,3 L120,17 L135,3 L150,17 L165,3 L180,17 L195,3 L210,17 L225,3 L240,17 L255,3 L270,17 L285,3 L300,10"
              fill="none" stroke={color} strokeWidth="2.5" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute" style={{
            width: 14, height: 14, background: color, opacity: 0.22,
            clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
          }} />
        </div>
      )

    case 'film':
      return (
        <div className="my-6 flex items-center justify-center gap-3">
          <div className="flex-1 max-w-[50px] h-px" style={{ background: `${color}10` }} />
          <div style={{ width: 10, height: 7, border: `1px solid ${color}18`, borderRadius: 1 }} />
          <div className="flex-1 max-w-[50px] h-px" style={{ background: `${color}10` }} />
        </div>
      )

    case 'ink':
      return (
        <div className="my-6 flex justify-center">
          <svg width="140" height="8" viewBox="0 0 140 8">
            <path d="M0,4 C10,2 18,6 30,3 C42,0 50,7 65,4 C78,1 88,6 100,3 C112,1 125,6 135,4 L140,4"
              fill="none" stroke={color} strokeWidth="1" opacity="0.1" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'war-room':
      return (
        <div className="my-4 flex items-center gap-1.5">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}06, ${color}18)` }} />
          <div className="w-2 h-2 border-l border-t" style={{ borderColor: `${color}25` }} />
          <div style={{ width: 6, height: 6, background: color, opacity: 0.3, transform: 'rotate(45deg)' }} />
          <div className="w-2 h-2 border-r border-b" style={{ borderColor: `${color}25` }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}18, ${color}06)` }} />
        </div>
      )

    case 'mountain':
      return (
        <div className="my-5 relative h-10">
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, ${color}05, transparent)` }} />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 40" preserveAspectRatio="none" style={{ opacity: 0.07 }}>
            <path d="M0,20 Q50,8 100,22 T200,18 T300,20" fill="none" stroke={color} strokeWidth="0.5" />
          </svg>
        </div>
      )

    case 'snow':
      return <div className="my-12" />

    case 'knight':
      return (
        <div className="my-5 flex items-center justify-center gap-2">
          <div className="w-10 h-px" style={{ background: `${color}0C` }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, transform: 'rotate(45deg)',
              background: i === 1 ? `${color}15` : 'transparent',
              border: `0.5px solid ${color}12`,
            }} />
          ))}
          <div className="w-10 h-px" style={{ background: `${color}0C` }} />
        </div>
      )

    case 'cosmic':
      return (
        <div className="my-6 flex justify-center">
          <svg width="120" height="12" viewBox="0 0 120 12">
            <line x1="10" y1="6" x2="40" y2="4" stroke={color} strokeWidth="0.3" opacity="0.12" />
            <line x1="40" y1="4" x2="60" y2="8" stroke={color} strokeWidth="0.3" opacity="0.12" />
            <line x1="60" y1="8" x2="80" y2="3" stroke={color} strokeWidth="0.3" opacity="0.12" />
            <line x1="80" y1="3" x2="110" y2="6" stroke={color} strokeWidth="0.3" opacity="0.12" />
            {[10, 40, 60, 80, 110].map((x, i) => (
              <circle key={i} cx={x} cy={[6, 4, 8, 3, 6][i]} r="1.5" fill={color} opacity="0.2" />
            ))}
          </svg>
        </div>
      )

    default:
      return <div className="my-4" />
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL SECTION HEADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelSectionHeader({ special, color, label, title, theme }) {
  const font = theme?.fontHeader || 'inherit'
  const bodyFont = theme?.fontBody || 'inherit'

  switch (special) {
    case 'anime':
      return (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <motion.p className="text-[12px] uppercase tracking-[0.25em] font-black"
              style={{ color, fontFamily: font }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >{label}</motion.p>
            <div style={{
              width: 10, height: 10, background: color, opacity: 0.45,
              clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
            }} />
          </div>
          <h1 className="mt-1 text-[28px] font-black tracking-tight" style={{ color: theme?.text, fontFamily: font }}>{title}</h1>
          <motion.div className="mt-1 h-[4px] w-20 rounded-full"
            style={{ background: color }}
            animate={{ width: ['80px', '92px', '80px'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
      )

    case 'film':
      return (
        <div className="mb-4 text-center">
          <div className="mx-auto w-16 h-px mb-3" style={{ background: `${color}15` }} />
          <p className="text-[8px]" style={{
            color, opacity: 0.4, fontFamily: bodyFont,
            fontVariant: 'small-caps', letterSpacing: '0.5em', textTransform: 'uppercase',
          }}>{label}</p>
          <h1 className="mt-2 text-[19px] font-normal tracking-wide" style={{
            color: theme?.text, fontFamily: font, letterSpacing: '0.08em',
          }}>{title}</h1>
          <div className="mx-auto w-16 h-px mt-3" style={{ background: `${color}15` }} />
        </div>
      )

    case 'ink':
      return (
        <div className="mb-4 flex items-start gap-4">
          <span className="text-[36px] leading-none mt-0.5" style={{
            color, opacity: 0.1, fontFamily: "'Shippori Mincho', serif",
          }}>
            {title === 'Mental Fitness' ? '心' : title === 'Statistics' ? '統' : title === 'Overview' ? '概' : '道'}
          </span>
          <div>
            <p className="text-[7px] uppercase tracking-[0.6em]" style={{ color, opacity: 0.2, fontFamily: bodyFont }}>{label}</p>
            <h1 className="text-[20px] font-normal" style={{
              color: theme?.text, fontFamily: "'Shippori Mincho', serif", letterSpacing: '0.03em',
            }}>{title}</h1>
          </div>
        </div>
      )

    case 'war-room':
      return (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5" style={{ background: color }} />
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold" style={{ color, fontFamily: font }}>{label}</p>
            <div className="ml-auto w-2 h-2" style={{ background: `${color}28`, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          </div>
          <h1 className="text-[28px] font-bold uppercase tracking-wider" style={{ color: theme?.text, fontFamily: font }}>{title}</h1>
          <div className="relative h-[3px] w-full mt-1 overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${color}55, ${color}0A, ${color}35)` }} />
            <motion.div className="absolute inset-y-0 w-12"
              style={{ background: `linear-gradient(90deg, transparent, ${color}35, transparent)` }}
              animate={{ left: ['-48px', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      )

    case 'mountain':
      return (
        <div className="mb-3">
          <p className="text-[9px] uppercase tracking-[0.3em] font-semibold" style={{ color, opacity: 0.3, fontFamily: bodyFont }}>{label}</p>
          <h1 className="mt-1 text-[24px] font-semibold" style={{ color: theme?.text, fontFamily: font }}>{title}</h1>
          <svg className="mt-1.5" width="120" height="8" viewBox="0 0 120 8" style={{ opacity: 0.12 }}>
            <path d="M0,6 L12,2 L24,5 L40,1 L56,4 L68,1 L80,5 L96,2 L108,5 L120,3" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'snow':
      return (
        <div className="mb-6 mt-10 text-center">
          <p className="text-[8px] uppercase tracking-[0.7em]" style={{ color, opacity: 0.15, fontFamily: bodyFont }}>{label}</p>
          <h1 className="mt-4 text-[18px] font-light tracking-widest" style={{ color: theme?.text, opacity: 0.55, fontFamily: font }}>{title}</h1>
        </div>
      )

    case 'knight':
      return (
        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color, opacity: 0.28, fontFamily: bodyFont }}>{label}</p>
          <h1 className="mt-1 text-[22px] italic" style={{ color: theme?.text, fontFamily: font }}>{title}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ background: `${color}12` }} />
            <svg width="16" height="8" viewBox="0 0 16 8" style={{ opacity: 0.18 }}>
              <path d="M0,4 L4,0 L8,4 L12,0 L16,4" fill="none" stroke={color} strokeWidth="0.8" />
            </svg>
            <div className="w-6 h-px" style={{ background: `${color}12` }} />
          </div>
        </div>
      )

    case 'cosmic':
      return (
        <div className="mb-5 text-center">
          <motion.p className="text-[8px] uppercase tracking-[0.6em]"
            style={{ color, opacity: 0.2, fontFamily: bodyFont }}
            animate={{ opacity: [0.12, 0.3, 0.12] }}
            transition={{ duration: 4, repeat: Infinity }}
          >{label}</motion.p>
          <h1 className="mt-2 text-[24px] font-light" style={{ color: theme?.text, fontFamily: font, letterSpacing: '0.06em' }}>{title}</h1>
          <svg className="mx-auto mt-2" width="60" height="6" viewBox="0 0 60 6" style={{ opacity: 0.18 }}>
            <circle cx="10" cy="3" r="1" fill={color} />
            <line x1="10" y1="3" x2="30" y2="3" stroke={color} strokeWidth="0.3" />
            <circle cx="30" cy="3" r="1.2" fill={color} />
            <line x1="30" y1="3" x2="50" y2="3" stroke={color} strokeWidth="0.3" />
            <circle cx="50" cy="3" r="1" fill={color} />
          </svg>
        </div>
      )

    default:
      return (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color, opacity: 0.4 }}>{label}</p>
          <h1 className="mt-1 text-[22px] font-semibold text-white">{title}</h1>
        </div>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelCard({ special, color, theme, children, className = '', glow = 0 }) {
  switch (special) {
    case 'anime':
      return (
        <motion.div
          className={`relative overflow-hidden ${className}`}
          initial={{ scale: 0.94, opacity: 0, rotate: -0.5 }}
          animate={{ scale: 1, opacity: 1, rotate: -0.5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            background: `${color}0A`, border: `3px solid ${color}2A`, borderRadius: '18px',
            boxShadow: `inset 0 0 30px ${color}06, 0 0 ${Math.round(glow * 180)}px ${color}${Math.round(glow * 80).toString(16).padStart(2, '0')}`,
          }}
        >
          {[{ top: 6, left: 6 }, { top: 6, right: 6 }, { bottom: 6, left: 6 }, { bottom: 6, right: 6 }].map((pos, i) => (
            <div key={i} className="absolute pointer-events-none" style={{
              ...pos, width: 12, height: 12, zIndex: 2, background: color, opacity: 0.18,
              clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
            }} />
          ))}
          {children}
        </motion.div>
      )

    case 'film':
      return (
        <div className={`relative ${className}`} style={{
          borderBottom: `0.5px solid ${color}0A`, paddingBottom: '14px', textAlign: 'center',
        }}>{children}</div>
      )

    case 'ink':
      return (
        <div className={`relative ${className}`}>
          {children}
          <svg className="w-full mt-3" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
            <path d="M0,3 C12,1 28,5 55,3 C82,1 95,4 125,3 C155,2 175,5 205,3 C235,1 265,4 285,3 C292,2 297,4 300,3"
              fill="none" stroke={color} strokeWidth="0.6" opacity="0.08" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'war-room':
      return (
        <div className={`relative overflow-hidden ${className}`} style={{
          background: `${color}04`, border: `1px solid ${color}0C`, borderRadius: '0px',
        }}>
          <div className="relative h-[3px] w-full overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${color}45, ${color}10, ${color}45)` }} />
          </div>
          <div className="absolute top-[3px] left-0 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: `${color}15` }} />
          <div className="absolute top-[3px] right-0 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: `${color}15` }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: `${color}0A` }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: `${color}0A` }} />
          <div className="relative">{children}</div>
        </div>
      )

    case 'mountain':
      return (
        <div className={`relative overflow-hidden ${className}`} style={{
          background: `${color}05`, border: `1px solid ${color}10`, borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {children}
          <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
            style={{ background: `linear-gradient(transparent, ${theme?.bg || '#141618'}30)` }} />
        </div>
      )

    case 'snow':
      return (
        <div className={`relative ${className}`} style={{
          background: 'transparent', border: `0.5px solid ${color}06`, borderRadius: '8px', padding: '24px',
        }}>{children}</div>
      )

    case 'knight':
      return (
        <div className={`relative overflow-hidden ${className}`} style={{
          background: `${color}03`, border: `1px solid ${color}0A`, borderRadius: '10px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {[
            { top: 0, left: 0, transform: 'none' },
            { top: 0, right: 0, transform: 'scaleX(-1)' },
            { bottom: 0, left: 0, transform: 'scaleY(-1)' },
            { bottom: 0, right: 0, transform: 'scale(-1)' },
          ].map((pos, i) => (
            <svg key={i} width="20" height="20" viewBox="0 0 20 20" className="absolute pointer-events-none"
              style={{ ...pos, opacity: 0.1 }}>
              <path d="M0,0 C0,8 2,10 8,10 C2,10 0,12 0,20" fill="none" stroke={color} strokeWidth="0.8" />
              <circle cx="4" cy="4" r="1" fill={color} />
            </svg>
          ))}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, ${color}03 0%, transparent 50%)`,
          }} />
          {children}
        </div>
      )

    case 'cosmic':
      return (
        <motion.div
          className={`relative overflow-hidden ${className}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: [0, -2, 0] }}
          transition={{
            opacity: { duration: 0.5 },
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{
            background: `${color}04`, border: `1px solid ${color}08`, borderRadius: '20px',
            boxShadow: `inset 0 1px 20px ${color}05, 0 0 40px ${color}03`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{ boxShadow: `inset 0 0 30px ${color}04` }} />
          {children}
        </motion.div>
      )

    default:
      return (
        <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{
          background: `${color}08`, border: `1px solid ${color}20`, backdropFilter: 'blur(20px)',
        }}>{children}</div>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelButton({ special, color, theme, children, onClick, disabled, className = '' }) {
  const font = theme?.fontHeader || theme?.fontBody || 'inherit'

  switch (special) {
    case 'anime':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.88 }}
          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
          onClick={onClick} disabled={disabled}
          className={`relative w-full py-4 text-[15px] font-black uppercase tracking-wide overflow-hidden ${className}`}
          style={{
            background: `${color}12`, border: `3px solid ${color}38`, borderRadius: '16px',
            color, fontFamily: font, opacity: disabled ? 0.4 : 0.95,
          }}
        >
          <div className="absolute top-2 right-3 pointer-events-none" style={{
            width: 10, height: 10, background: color, opacity: 0.3,
            clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
          }} />
          <div className="absolute bottom-2 left-3 pointer-events-none" style={{
            width: 7, height: 7, background: color, opacity: 0.18,
            clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
          }} />
          {children}
        </motion.button>
      )

    case 'film':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={onClick} disabled={disabled}
          className={`relative w-full py-4 text-[13px] tracking-widest uppercase ${className}`}
          style={{
            background: 'transparent', border: 'none', color, fontFamily: font,
            fontWeight: 400, letterSpacing: '0.2em', opacity: disabled ? 0.3 : 0.6,
          }}
        >
          {children}
          <motion.div className="absolute bottom-2 left-1/2 h-px"
            style={{ background: color, opacity: 0.4, translateX: '-50%' }}
            initial={{ width: 0 }} whileTap={{ width: '40%' }}
          />
        </motion.button>
      )

    case 'ink':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          onClick={onClick} disabled={disabled}
          className={`relative w-full py-4 text-[14px] ${className}`}
          style={{
            background: 'transparent', border: 'none', color,
            fontFamily: "'Shippori Mincho', serif", fontWeight: 400,
            opacity: disabled ? 0.3 : 0.55, letterSpacing: '0.08em',
          }}
        >
          {children}
          <motion.svg className="absolute bottom-2 left-1/2" width="60" height="4" viewBox="0 0 60 4"
            style={{ translateX: '-50%' }} initial={{ opacity: 0 }} whileTap={{ opacity: 0.3 }}>
            <path d="M0,2 C5,1 12,3 20,2 C28,1 35,3 45,2 C52,1 57,3 60,2"
              fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          </motion.svg>
        </motion.button>
      )

    case 'war-room':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.96 }}
          onClick={onClick} disabled={disabled}
          className={`relative w-full py-4 text-[13px] font-bold uppercase overflow-hidden ${className}`}
          style={{
            background: `${color}0A`, border: `1px solid ${color}1A`, borderRadius: '0px',
            color, fontFamily: font, letterSpacing: '0.15em', opacity: disabled ? 0.4 : 0.9,
          }}
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ opacity: 0.25 }}>▸▸</span>
          {children}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ opacity: 0.25 }}>◂◂</span>
        </motion.button>
      )

    case 'mountain':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.97 }}
          onClick={onClick} disabled={disabled}
          className={`w-full py-4 text-[14px] font-semibold ${className}`}
          style={{
            background: `${color}08`, border: `1px solid ${color}12`, borderRadius: '6px',
            color, fontFamily: font, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            opacity: disabled ? 0.4 : 0.9,
          }}
        >{children}</motion.button>
      )

    case 'snow':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          onClick={onClick} disabled={disabled}
          className={`w-full py-4 text-[13px] font-light tracking-wider ${className}`}
          style={{
            background: 'transparent', border: `0.5px solid ${color}08`, borderRadius: '8px',
            color, fontFamily: font, letterSpacing: '0.1em', opacity: disabled ? 0.2 : 0.45,
          }}
        >{children}</motion.button>
      )

    case 'knight':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={onClick} disabled={disabled}
          className={`relative w-full py-4 text-[14px] italic ${className}`}
          style={{
            background: `${color}04`, border: `1px solid ${color}0C`, borderRadius: '10px',
            color, fontFamily: font, opacity: disabled ? 0.35 : 0.8,
          }}
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ opacity: 0.18, fontSize: 10 }}>→</span>
          {children}
          <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ opacity: 0.18, fontSize: 10 }}>←</span>
        </motion.button>
      )

    case 'cosmic':
      return (
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.97 }}
          onClick={onClick} disabled={disabled}
          className={`w-full py-4 text-[14px] font-light ${className}`}
          style={{
            background: `${color}06`, borderRadius: '16px', color, fontFamily: font,
            backdropFilter: 'blur(8px)', opacity: disabled ? 0.35 : 0.9,
          }}
          animate={disabled ? {} : {
            boxShadow: [
              `0 0 10px ${color}06, inset 0 0 6px ${color}03, 0 0 0 1px ${color}0A`,
              `0 0 20px ${color}0C, inset 0 0 10px ${color}06, 0 0 0 1px ${color}14`,
              `0 0 10px ${color}06, inset 0 0 6px ${color}03, 0 0 0 1px ${color}0A`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >{children}</motion.button>
      )

    default:
      return (
        <motion.button whileTap={{ scale: disabled ? 1 : 0.97 }}
          onClick={onClick} disabled={disabled}
          className={`w-full py-4 text-[14px] font-semibold ${className}`}
          style={{ background: `${color}15`, border: `2px solid ${color}35`, borderRadius: '16px', color, fontFamily: font, opacity: disabled ? 0.4 : 0.9 }}
        >{children}</motion.button>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL NAV STYLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getLevelNavStyle(special, color, theme) {
  const base = {
    background: theme?.navBg || 'rgba(14,14,26,0.92)',
    backdropFilter: 'blur(16px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }
  switch (special) {
    case 'anime':   return { ...base, borderTop: `3px solid ${color}28` }
    case 'film':    return { ...base, borderTop: `0.5px solid ${color}08` }
    case 'ink':     return { ...base, borderTop: `0.5px solid ${color}05` }
    case 'war-room': return { ...base, borderTop: `2px solid ${color}22`, borderImage: `linear-gradient(90deg, ${color}30, transparent 50%, ${color}30) 1` }
    case 'mountain': return { ...base, borderTop: `1px solid ${color}0A`, boxShadow: '0 -4px 24px rgba(0,0,0,0.35)' }
    case 'snow':    return { ...base, borderTop: `0.5px solid ${color}04` }
    case 'knight':  return { ...base, borderTop: `1px solid ${color}08` }
    case 'cosmic':  return { ...base, borderTop: `1px solid ${color}06`, boxShadow: `0 -2px 24px ${color}05` }
    default:        return { ...base, borderTop: `1px solid ${color}15` }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL STAT ROW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelStatRow({ special, color, theme, stats }) {
  const font = theme?.fontBody || 'inherit'

  switch (special) {
    case 'anime':
      return (
        <div className="flex pt-3 gap-1.5" style={{ borderTop: `2px dashed ${color}10` }}>
          {stats.map((s, i) => (
            <motion.div key={s.label}
              className="flex-1 text-center py-2 relative overflow-hidden"
              style={{
                background: `${color}06`, border: `2px solid ${color}12`, borderRadius: '10px',
                transform: `rotate(${i % 2 === 0 ? 1 : -1}deg)`,
              }}
              initial={{ scale: 0, rotate: i % 2 === 0 ? 8 : -8 }}
              animate={{ scale: 1, rotate: i % 2 === 0 ? 1 : -1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: i * 0.06 }}
            >
              <p className="text-[20px] font-black tabular-nums leading-none" style={{ color, fontFamily: theme?.fontHeader }}>{s.value}</p>
              <p className="text-[6px] uppercase tracking-[0.12em] font-bold mt-1" style={{ color, opacity: 0.35, fontFamily: font }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      )

    case 'film':
      return (
        <div className="flex pt-3 justify-center items-baseline" style={{ borderTop: `0.5px solid ${color}08` }}>
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-baseline">
              {i > 0 && <div className="mx-4" style={{ width: 1, height: 14, background: `${color}12`, alignSelf: 'center' }} />}
              <div className="text-center">
                <p className="text-[13px] tabular-nums font-normal" style={{ color: theme?.text, fontFamily: font }}>{s.value}</p>
                <p className="text-[6px] uppercase tracking-[0.25em] mt-0.5" style={{ color, opacity: 0.22, fontFamily: font }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'ink':
      return (
        <div className="flex pt-4 gap-10">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-[16px] tabular-nums" style={{ color: theme?.text, fontFamily: "'Shippori Mincho', serif", opacity: 0.7 }}>{s.value}</p>
              <p className="text-[6px] uppercase tracking-[0.15em] mt-0.5" style={{ color, opacity: 0.15 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )

    case 'war-room':
      return (
        <div className="grid grid-cols-4 gap-0" style={{ borderTop: `1px solid ${color}0C` }}>
          {stats.map((s, i) => (
            <div key={s.label} className="text-center py-2"
              style={i > 0 ? { borderLeft: `1px solid ${color}08` } : {}}>
              <p className="text-[17px] font-bold tabular-nums" style={{ color, fontFamily: theme?.fontHeader }}>{s.value}</p>
              <p className="text-[5px] uppercase tracking-[0.35em] font-bold mt-0.5" style={{ color, opacity: 0.22, fontFamily: theme?.fontHeader }}>{s.label}</p>
            </div>
          ))}
        </div>
      )

    case 'mountain':
      return (
        <div className="flex pt-3 gap-4" style={{ borderTop: `1px solid ${color}0A` }}>
          {stats.map(s => (
            <div key={s.label} className="flex-1">
              <p className="text-[15px] font-semibold tabular-nums" style={{ color: theme?.text, fontFamily: font }}>{s.value}</p>
              <p className="text-[7px] uppercase tracking-[0.15em]" style={{ color, opacity: 0.28, fontFamily: font }}>{s.label}</p>
            </div>
          ))}
        </div>
      )

    case 'snow':
      return (
        <div className="flex pt-8 justify-around">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[13px] font-light tabular-nums" style={{ color: theme?.text, opacity: 0.45, fontFamily: font }}>{s.value}</p>
              <p className="text-[5px] uppercase tracking-[0.5em] mt-1" style={{ color, opacity: 0.12, fontFamily: font }}>{s.label}</p>
            </div>
          ))}
        </div>
      )

    case 'knight':
      return (
        <div className="flex pt-3 gap-4" style={{ borderTop: `0.5px solid ${color}08` }}>
          {stats.map(s => (
            <div key={s.label} className="flex-1 text-center">
              <p className="text-[15px] tabular-nums italic" style={{ color: theme?.text, fontFamily: theme?.fontHeader, opacity: 0.8 }}>{s.value}</p>
              <p className="text-[6px] uppercase tracking-[0.2em]" style={{ color, opacity: 0.22, fontFamily: font }}>{s.label}</p>
            </div>
          ))}
        </div>
      )

    case 'cosmic':
      return (
        <div className="flex pt-4 justify-around">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="text-center px-3 py-1.5 rounded-xl"
              style={{ background: `${color}03`, border: `0.5px solid ${color}06` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 + 0.2 }}
            >
              <p className="text-[14px] font-light tabular-nums" style={{ color: theme?.text, fontFamily: font }}>{s.value}</p>
              <p className="text-[5px] uppercase tracking-[0.4em] mt-0.5" style={{ color, opacity: 0.18, fontFamily: font }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      )

    default:
      return (
        <div className="flex pt-3" style={{ borderTop: `1px solid ${color}0C` }}>
          {stats.map((s, i) => (
            <div key={s.label} className="flex-1 text-center"
              style={i > 0 ? { borderLeft: `1px solid ${color}0C` } : {}}>
              <p className="text-[15px] font-bold tabular-nums text-white/70">{s.value}</p>
              <p className="text-[7px] uppercase tracking-[0.15em] text-white/25 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL CHARACTER HEADER — hero image treatment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelCharacterHeader({ special, color, theme, charImage, glow }) {
  switch (special) {
    case 'anime':
      return (
        <div className="relative w-full h-[300px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}18, ${theme?.accentAlt || '#e85d8a'}12, ${color}0C)` }} />
          )}
          {/* Manga panel frame */}
          <div className="absolute pointer-events-none" style={{
            inset: '10px', border: '3px solid rgba(255,255,255,0.6)', zIndex: 2,
          }} />
          {/* Speed lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `repeating-conic-gradient(from 0deg at 50% 120%, transparent 0deg, transparent 4deg, ${color}05 4.5deg, transparent 5deg)`,
          }} />
          <div className="absolute inset-x-0 bottom-0 h-[160px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#0e0e1a'}CC 60%, ${theme?.bg || '#0e0e1a'})`,
          }} />
        </div>
      )

    case 'film':
      return (
        <div className="relative w-full overflow-hidden" style={{ height: '280px' }}>
          <div className="absolute inset-x-0 top-0 h-6 z-10" style={{ background: '#000' }} />
          <div className="absolute inset-x-0 bottom-0 h-6 z-10" style={{ background: '#000' }} />
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'sepia(25%) contrast(1.1) brightness(0.9) saturate(0.85)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `radial-gradient(ellipse at center, ${color}0C, transparent)` }} />
          )}
          <div className="absolute top-0 left-0 bottom-0 w-5 z-10 flex flex-col justify-around items-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(60,50,35,0.5)', border: '1px solid rgba(80,65,40,0.3)' }} />
            ))}
          </div>
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,15,8,0.55) 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0 h-[120px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#1c1c1c'})`,
          }} />
        </div>
      )

    case 'ink':
      return (
        <div className="relative w-full h-[260px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'grayscale(85%) contrast(1.2) brightness(0.95)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(180deg, ${color}06, transparent)` }} />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
            <span style={{
              fontSize: '180px', lineHeight: 1, color: theme?.text, opacity: 0.03,
              fontFamily: "'Shippori Mincho', serif", userSelect: 'none',
            }}>心</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[160px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#1a1a1a'})`,
          }} />
          <svg className="absolute bottom-0 left-0 w-full" height="24" viewBox="0 0 400 24" preserveAspectRatio="none" style={{ zIndex: 2 }}>
            <path d="M0,14 C20,8 40,18 70,10 C100,2 120,16 160,12 C200,8 230,20 270,10 C310,0 340,18 370,12 C385,9 395,14 400,12 L400,24 L0,24 Z"
              fill={theme?.bg || '#1a1a1a'} />
          </svg>
        </div>
      )

    case 'war-room':
      return (
        <div className="relative w-full h-[280px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'sepia(20%) saturate(0.8)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(180deg, ${color}10, transparent)` }} />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(${color}04 1px, transparent 1px), linear-gradient(90deg, ${color}04 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute top-3 left-3 text-[6px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{
            color, background: `${theme?.bg || '#161412'}CC`, border: `1px solid ${color}15`, fontFamily: theme?.fontHeader,
          }}>CLASSIFIED</div>
          <div className="absolute top-3 right-3 text-[6px] uppercase tracking-wider px-1.5 py-0.5" style={{
            color, opacity: 0.35, background: `${theme?.bg || '#161412'}88`, fontFamily: theme?.fontHeader,
          }}>SEC-7</div>
          <div className="absolute inset-x-0 bottom-0 h-[140px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#161412'})`,
          }} />
        </div>
      )

    case 'mountain':
      return (
        <div className="relative w-full h-[300px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'contrast(1.1) brightness(0.9)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(180deg, ${color}0A, transparent)` }} />
          )}
          <svg className="absolute bottom-16 left-0 w-full pointer-events-none" height="80" viewBox="0 0 400 80" preserveAspectRatio="none" style={{ opacity: 0.05 }}>
            <path d="M0,80 L40,40 L80,55 L130,20 L180,50 L220,15 L260,45 L310,10 L350,40 L400,25 L400,80 Z" fill={color} />
          </svg>
          <motion.div className="absolute bottom-20 inset-x-0 h-20"
            style={{ background: `linear-gradient(transparent, ${color}05, transparent)` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute inset-x-0 bottom-0 h-[160px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#141618'})`,
          }} />
        </div>
      )

    case 'snow':
      return (
        <div className="relative w-full h-[240px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'grayscale(40%) brightness(0.85) contrast(1.05)' }} />
          ) : (
            <div className="w-full h-full" />
          )}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(transparent 30%, ${theme?.bg || '#0c0e11'})`,
          }} />
        </div>
      )

    case 'knight':
      return (
        <div className="relative w-full h-[290px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'sepia(12%) contrast(1.05) brightness(0.95)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}06, transparent)` }} />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, transparent 20%, ${color}04 45%, transparent 70%)`,
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.12)',
          }} />
          <div className="absolute inset-x-0 bottom-0 h-[140px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#141311'})`,
          }} />
        </div>
      )

    case 'cosmic':
      return (
        <div className="relative w-full h-[320px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0.85) contrast(1.1)' }} />
          ) : (
            <div className="w-full h-full" style={{
              background: `radial-gradient(ellipse at 50% 30%, ${color}0C, transparent 60%)`,
            }} />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at 25% 35%, ${color}06 0%, transparent 45%), radial-gradient(circle at 75% 55%, ${theme?.accentAlt || color}04 0%, transparent 40%)`,
          }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.12 }}>
            {[[60, 40], [120, 80], [200, 50], [280, 90], [320, 60]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.2" fill={color} />
            ))}
            <line x1="60" y1="40" x2="120" y2="80" stroke={color} strokeWidth="0.3" />
            <line x1="120" y1="80" x2="200" y2="50" stroke={color} strokeWidth="0.3" />
            <line x1="200" y1="50" x2="280" y2="90" stroke={color} strokeWidth="0.3" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-[180px]" style={{
            background: `linear-gradient(transparent, ${theme?.bg || '#0a0a12'})`,
          }} />
        </div>
      )

    default:
      return (
        <div className="relative w-full h-[300px] overflow-hidden">
          {charImage ? (
            <img src={charImage} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(180deg, ${color}15, transparent)` }} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-[140px]" style={{ background: 'linear-gradient(transparent, var(--bg-primary))' }} />
        </div>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL BADGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelBadge({ special, color, theme, levelIdx, glow }) {
  switch (special) {
    case 'anime':
      return (
        <motion.div className="w-14 h-14 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 3, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `${color}18`, border: `3px solid ${color}50`, borderRadius: '16px',
            boxShadow: `0 0 25px ${color}${Math.round((glow || 0.12) * 180).toString(16).padStart(2, '0')}`,
          }}
        >
          <span className="text-[24px] font-black" style={{
            color, fontFamily: theme?.fontHeader,
            WebkitTextStroke: `1.5px ${color}`, textShadow: `0 0 10px ${color}35`,
          }}>{levelIdx + 1}</span>
        </motion.div>
      )

    case 'film':
      return (
        <div className="w-10 h-10 flex items-center justify-center" style={{
          border: `1px solid ${color}18`, borderRadius: '50%',
        }}>
          <span className="text-[14px] font-normal tabular-nums" style={{
            color, opacity: 0.55, fontFamily: theme?.fontHeader,
          }}>{levelIdx + 1}</span>
        </div>
      )

    case 'ink':
      return (
        <div className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <span style={{
            fontSize: '44px', lineHeight: 1, color, opacity: 0.12,
            fontFamily: "'Shippori Mincho', serif", userSelect: 'none',
          }}>
            {['初', '修', '習', '戦', '師', '伝', '昇', '永'][levelIdx] || '初'}
          </span>
        </div>
      )

    case 'war-room':
      return (
        <div className="w-14 h-14 flex flex-col items-center justify-center" style={{
          background: `${color}08`, border: `2px solid ${color}22`, borderRadius: '0',
        }}>
          <div className="flex gap-0.5 mb-1">
            {Array.from({ length: Math.min(levelIdx + 1, 4) }).map((_, i) => (
              <div key={i} style={{ width: 6, height: 2, background: color, opacity: 0.45 }} />
            ))}
          </div>
          <span className="text-[16px] font-bold tabular-nums" style={{
            color, fontFamily: theme?.fontHeader, letterSpacing: '0.1em',
          }}>{String(levelIdx + 1).padStart(2, '0')}</span>
        </div>
      )

    case 'mountain':
      return (
        <div className="w-12 h-12 flex items-center justify-center" style={{
          background: `${color}08`, border: `1px solid ${color}12`, borderRadius: '6px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        }}>
          <svg width="28" height="20" viewBox="0 0 28 20" style={{ opacity: 0.45 }}>
            <path d="M14,2 L24,18 L4,18 Z" fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M14,2 L14,8" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
          </svg>
        </div>
      )

    case 'snow':
      return (
        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-[16px] font-light" style={{ color, opacity: 0.25, fontFamily: theme?.fontHeader }}>{levelIdx + 1}</span>
        </div>
      )

    case 'knight':
      return (
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0" style={{
            background: `${color}06`, border: `1px solid ${color}12`,
            clipPath: 'polygon(50% 0%, 79% 10%, 100% 35%, 100% 70%, 79% 90%, 50% 100%, 21% 90%, 0% 70%, 0% 35%, 21% 10%)',
          }} />
          <svg width="18" height="22" viewBox="0 0 18 22" style={{ opacity: 0.3, position: 'relative', zIndex: 1 }}>
            <path d="M9,0 C9,4 12,6 12,10 C12,14 9,14 9,22 C9,14 6,14 6,10 C6,6 9,4 9,0 Z M4,8 C6,10 6,12 4,14 M14,8 C12,10 12,12 14,14"
              fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'cosmic':
      return (
        <div className="relative w-14 h-14 flex items-center justify-center">
          <motion.div className="absolute inset-0" style={{
            border: `1px solid ${color}10`, borderRadius: '50%', transform: 'rotateX(65deg)',
          }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div className="absolute" style={{
            inset: '4px', border: `0.5px solid ${color}08`, borderRadius: '50%',
            transform: 'rotateX(65deg) rotateZ(60deg)',
          }}
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
            background: `${color}06`, boxShadow: `0 0 16px ${color}0A, inset 0 0 8px ${color}06`,
          }}>
            <span className="text-[16px] font-light" style={{ color, fontFamily: theme?.fontHeader }}>{levelIdx + 1}</span>
          </div>
        </div>
      )

    default:
      return (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
          background: `${color}18`, border: `1px solid ${color}30`,
        }}>
          <span className="text-[18px] font-black tabular-nums" style={{ color }}>{levelIdx + 1}</span>
        </div>
      )
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL PROGRESS BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LevelProgressBar({ special, color, nextColor, progress, theme }) {
  switch (special) {
    case 'anime':
      return (
        <div className="h-[8px] rounded-full overflow-hidden relative" style={{
          background: `${color}10`, border: `1px solid ${color}1A`,
        }}>
          <motion.div className="h-full rounded-full relative overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${color}, ${nextColor || color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div className="absolute inset-y-0 w-8"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
              animate={{ left: ['-32px', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          </motion.div>
        </div>
      )

    case 'film':
      return (
        <div className="h-[3px] overflow-hidden" style={{ background: `${color}08` }}>
          <motion.div className="h-full" style={{ background: `${color}35` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
        </div>
      )

    case 'ink':
      return (
        <div className="relative h-[4px] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 4" preserveAspectRatio="none">
            <path d="M0,2 C30,1 60,3 100,2 C140,1 180,3 220,2 C260,1 285,3 300,2"
              fill="none" stroke={color} strokeWidth="1" opacity="0.06" strokeLinecap="round" />
          </svg>
          <motion.div className="h-full rounded-full" style={{ background: `${color}28` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
        </div>
      )

    case 'war-room':
      return (
        <div className="h-[4px] overflow-hidden" style={{ background: `${color}06` }}>
          <motion.div className="h-full relative overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${color}60, ${nextColor || color}45)` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
          >
            <motion.div className="absolute inset-y-0 w-4"
              style={{ background: `linear-gradient(90deg, transparent, ${color}45, transparent)` }}
              animate={{ left: ['-16px', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </div>
      )

    case 'mountain':
      return (
        <div className="h-[5px] rounded-full overflow-hidden" style={{
          background: `${color}06`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}45, ${nextColor || color}35)` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
        </div>
      )

    case 'snow':
      return (
        <div className="h-[2px] rounded-full overflow-hidden" style={{ background: `${color}04` }}>
          <motion.div className="h-full rounded-full" style={{ background: `${color}12` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2 }} />
        </div>
      )

    case 'knight':
      return (
        <div className="relative h-[5px] rounded-full overflow-hidden" style={{ background: `${color}05` }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}30, ${nextColor || color}20)` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
          {progress > 5 && (
            <motion.div className="absolute top-1/2"
              style={{
                width: 7, height: 7, background: color, opacity: 0.25,
                transform: 'translateY(-50%) rotate(45deg)',
              }}
              initial={{ left: 0 }}
              animate={{ left: `calc(${progress}% - 3.5px)` }}
              transition={{ duration: 0.8 }}
            />
          )}
        </div>
      )

    case 'cosmic':
      return (
        <div className="relative h-[4px] rounded-full overflow-hidden" style={{ background: `${color}05` }}>
          <motion.div className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}30, ${nextColor || color}45)`,
              boxShadow: `0 0 10px ${color}20`,
            }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          <motion.div className="absolute inset-0 rounded-full"
            animate={{ boxShadow: [`0 0 4px ${color}08`, `0 0 8px ${color}14`, `0 0 4px ${color}08`] }}
            transition={{ duration: 2.5, repeat: Infinity }} />
        </div>
      )

    default:
      return (
        <div className="h-[5px] rounded-full overflow-hidden bg-white/[0.06]">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${nextColor || color})` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
        </div>
      )
  }
}
