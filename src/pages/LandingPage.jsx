import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold tracking-tight"
        >
          Limitless
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-lg text-white/60 max-w-md"
        >
          Your daily system for peak performance.
        </motion.p>
      </section>
    </div>
  )
}
