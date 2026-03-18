import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const IMAGES = [
  '/LimitlessNewPreloader/Neo.jpg',
  '/LimitlessNewPreloader/KobeFlinch.jpg',
  '/LimitlessNewPreloader/Lucy.jpg',
  '/LimitlessNewPreloader/TonyStark.jpg',
  '/LimitlessNewPreloader/LimitlessLaptop.jpg',
  '/LimitlessNewPreloader/Limitless.jpg',
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
            animate={{ opacity: i === imgIdx ? 0.4 : 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}
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
