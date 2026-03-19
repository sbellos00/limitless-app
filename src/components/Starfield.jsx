import { useEffect, useRef } from 'react'

export default function Starfield({
  starColor = 'rgba(255,255,255,1)',
  bgColor = 'rgba(0,0,0,1)',
  speed = 0.5,
  quantity = 400,
  opacity = 0.08,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ctx = canvas.getContext('2d')

    let w, h, x, y, z, stars, animId
    const ratio = quantity / 2

    function measure() {
      w = parent.clientWidth
      h = parent.clientHeight
      x = Math.round(w / 2)
      y = Math.round(h / 2)
      z = (w + h) / 2
      canvas.width = w
      canvas.height = h
    }

    function createStars() {
      stars = Array.from({ length: quantity }, () => [
        Math.random() * w * 2 - x * 2,
        Math.random() * h * 2 - y * 2,
        Math.round(Math.random() * z),
        0, 0, 0, 0, true,
      ])
    }

    function update() {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        s[7] = true
        s[5] = s[3]
        s[6] = s[4]
        s[2] -= speed
        if (s[2] < 0) { s[2] += z; s[7] = false }
        s[3] = x + (s[0] / s[2]) * ratio
        s[4] = y + (s[1] / s[2]) * ratio
      }
    }

    function draw() {
      ctx.fillStyle = `rgba(0,0,0,${opacity})`
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = starColor
      const colorRatio = 1 / z
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        if (s[5] > 0 && s[5] < w && s[6] > 0 && s[6] < h && s[7]) {
          ctx.lineWidth = (1 - colorRatio * s[2]) * 2
          ctx.beginPath()
          ctx.moveTo(s[5], s[6])
          ctx.lineTo(s[3], s[4])
          ctx.stroke()
        }
      }
    }

    function animate() {
      update()
      draw()
      animId = requestAnimationFrame(animate)
    }

    measure()
    createStars()
    animate()

    const onResize = () => { measure(); createStars() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [starColor, bgColor, speed, quantity, opacity])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
