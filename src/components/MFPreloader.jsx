import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const IMAGES = [
  '/LimitlessPreloader/Neo.jpg',
  '/LimitlessPreloader/KobeFlinch.jpg',
  '/LimitlessPreloader/Lucy.jpg',
  '/LimitlessPreloader/TonyStark.jpg',
  '/LimitlessPreloader/WolfOfWalletSt.jpg',
  '/LimitlessPreloader/LimitlessLaptop.jpg',
]

export default function MFPreloader() {
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setImgIdx(prev => (prev + 1) % IMAGES.length)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden relative">
      {/* Background image cycle */}
      <div className="absolute inset-0 z-0">
        {IMAGES.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={false}
            animate={{ opacity: i === imgIdx ? 0.15 : 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center justify-center gap-8 px-6">
        <motion.h1
          className="text-center text-[12vw] font-extrabold uppercase leading-[0.85] tracking-[-0.04em] text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        >
          Limitless
        </motion.h1>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="h-px w-12 bg-white/20" />
          <span className="text-[2.5vw] font-bold uppercase tracking-[0.3em] text-white/40"
            style={{ minFontSize: '10px', fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
            Mental Fitness
          </span>
          <div className="h-px w-12 bg-white/20" />
        </motion.div>

        <motion.p
          className="text-[3vw] font-extrabold uppercase tracking-[-0.02em] text-white/20"
          style={{ fontSize: 'clamp(11px, 3vw, 16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Train Your Mind
        </motion.p>
      </div>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 h-[2px] bg-white/10 rounded-full overflow-hidden"
        style={{ width: '120px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-white/50 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'linear' }}
        />
      </motion.div>
    </div>
  )
}
