import { useMemo } from 'react'

const CHARS = ['.', '·', '✦', '*', '⊹', '°']
const TOTAL = 130

interface Star {
  left: string
  top: string
  char: string
  opacity: number
  size: number
  delay: string
  duration: string
}

export default function StarField() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: TOTAL }, () => ({
        left: `${(Math.random() * 100).toFixed(2)}%`,
        top: `${(Math.random() * 100).toFixed(2)}%`,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        opacity: parseFloat((0.08 + Math.random() * 0.35).toFixed(2)),
        size: parseFloat((10 + Math.random() * 7).toFixed(1)),
        delay: `${(Math.random() * 5).toFixed(1)}s`,
        duration: `${(2.5 + Math.random() * 3.5).toFixed(1)}s`,
      })),
    [],
  )

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            opacity: s.opacity,
            fontSize: s.size,
            color: '#06b6d4',
            fontFamily: 'monospace',
            animation: `pulse ${s.duration} ${s.delay} ease-in-out infinite`,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  )
}
