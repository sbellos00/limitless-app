import { useEffect, useRef, useState } from 'react'

export default function Typewriter({
  text,
  typingSpeed = 45,
  initialDelay = 0,
  showCursor = true,
  cursorCharacter = '|',
  className = '',
  onComplete,
}) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const start = () => {
      const tick = () => {
        if (indexRef.current < text.length) {
          indexRef.current++
          setDisplayed(text.slice(0, indexRef.current))
          // Slight random variance for natural feel
          const speed = typingSpeed + (Math.random() - 0.5) * typingSpeed * 0.6
          timeoutRef.current = setTimeout(tick, speed)
        } else {
          setDone(true)
          onComplete?.()
        }
      }
      timeoutRef.current = setTimeout(tick, initialDelay)
    }

    start()
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [text, typingSpeed, initialDelay])

  return (
    <span className={`inline whitespace-pre-wrap ${className}`}>
      {displayed}
      {showCursor && (
        <span
          className={`ml-0.5 inline-block ${done ? 'animate-blink' : ''}`}
          style={!done ? { opacity: 1 } : undefined}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  )
}
