import { useEffect, useRef } from 'react'

export function useCursor(theme) {
  const themeRef  = useRef(theme)
  const stateRef  = useRef({
    mouse:  { x: -999, y: -999, speed: 0 },
    smooth: { x: -999, y: -999 },
    prev:   { x: -999, y: -999 },
    dots:   [],
    raf:    null,
    active: false,
  })

  // Keep theme in sync without restarting the loop
  useEffect(() => { themeRef.current = theme }, [theme])

  useEffect(() => {
    const st = stateRef.current
    let canvas = null
    let ctx    = null
    let W = window.innerWidth
    let H = window.innerHeight

    // ── Find canvas (retry until found) ──
    const findCanvas = () => {
      canvas = document.getElementById('particle-canvas')
      if (!canvas) { setTimeout(findCanvas, 16); return }
      ctx = canvas.getContext('2d')
      canvas.width  = W
      canvas.height = H
      start()
    }

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      if (canvas) { canvas.width = W; canvas.height = H }
    }

    const onMove = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? -999
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? -999
      const dx    = x - st.prev.x
      const dy    = y - st.prev.y
      const speed = Math.sqrt(dx * dx + dy * dy)
      st.mouse = { x, y, speed }
      st.prev  = { x, y }

      const count = Math.min(Math.floor(speed / 5) + 1, 4)
      for (let i = 0; i < count; i++) {
        st.dots.push({
          x:    x + (Math.random() - 0.5) * 4,
          y:    y + (Math.random() - 0.5) * 4,
          life: 1,
          size: Math.random() * 2.5 + 1.5,
          hue:  205 + Math.random() * 45,
        })
      }
      if (st.dots.length > 40) st.dots.splice(0, st.dots.length - 40)
    }

    const loop = () => {
      if (!ctx || !st.active) return
      ctx.clearRect(0, 0, W, H)

      const { x, y, speed = 0 } = st.mouse
      const dark = themeRef.current === 'dark'

      // Smooth follow
      if (st.smooth.x < 0 && x > 0) { st.smooth.x = x; st.smooth.y = y }
      if (x > 0) {
        st.smooth.x += (x - st.smooth.x) * 0.15
        st.smooth.y += (y - st.smooth.y) * 0.15
      }
      const sx = st.smooth.x, sy = st.smooth.y

      // ── Trail dots ──
      for (let i = st.dots.length - 1; i >= 0; i--) {
        const d = st.dots[i]
        d.life -= 0.055
        if (d.life <= 0) { st.dots.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${d.hue},85%,${dark ? 68 : 32}%,${d.life * (dark ? 0.6 : 0.38)})`
        ctx.fill()
      }

      // ── Glow ring ──
      if (sx > 0) {
        const r  = 22 + Math.min(speed * 0.25, 12)
        const gc = dark ? '41,151,255' : '0,70,180'
        const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, r)
        g.addColorStop(0,   `rgba(${gc},0)`)
        g.addColorStop(0.4, `rgba(${gc},${dark ? 0.22 : 0.14})`)
        g.addColorStop(1,   `rgba(${gc},0)`)
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }

      // ── Sharp cursor dot ──
      if (x > 0) {
        ctx.beginPath()
        ctx.arc(x, y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,20,0.88)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.strokeStyle = dark ? 'rgba(41,151,255,0.65)' : 'rgba(0,70,180,0.42)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      st.raf = requestAnimationFrame(loop)
    }

    const start = () => {
      st.active = true
      window.addEventListener('resize',    onResize,         { passive: true })
      window.addEventListener('mousemove', onMove,           { passive: true })
      window.addEventListener('touchmove', onMove,           { passive: true })
      loop()
    }

    findCanvas()

    return () => {
      st.active = false
      cancelAnimationFrame(st.raf)
      window.removeEventListener('resize',    onResize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, []) // run once, theme is tracked via ref
}
