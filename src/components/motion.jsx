import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * A number that counts up to its value, and ticks from the old value to the
 * new one when a record changes a total.
 */
export function AnimatedNumber({ value, format = (n) => n, duration = 750 }) {
  const target = Number(value) || 0
  const still = prefersReducedMotion()
  const [shown, setShown] = useState(still ? target : 0)
  const current = useRef(still ? target : 0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target
      setShown(target)
      return undefined
    }
    const from = current.current
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      current.current = from + (target - from) * eased
      setShown(current.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  const rounded = Number.isInteger(target) ? Math.round(shown) : Math.round(shown * 10) / 10
  return format(rounded)
}

const PIECES = ['🌾', '🌿', '✨', '🌱', '💰', '🍃']

// A short burst of leaves and coins for good moments (income saved, problem solved).
export function Celebration({ burst }) {
  if (!burst || prefersReducedMotion()) return null
  return (
    <div className="celebrate" key={burst.key} aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.3
        const dist = 90 + ((i * 37) % 70)
        return (
          <span
            key={i}
            style={{
              '--x': `${Math.cos(angle) * dist}px`,
              '--y': `${Math.sin(angle) * dist - 40}px`,
              '--r': `${((i * 67) % 360) - 180}deg`,
              '--d': `${(i % 4) * 30}ms`,
            }}
          >
            {PIECES[i % PIECES.length]}
          </span>
        )
      })}
    </div>
  )
}
