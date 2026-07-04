import { useEffect, useRef, useState } from 'react'
import type { MessagePart } from '../types'

interface Props {
  messages: (string | { text: string; color?: string; parts?: MessagePart[] })[]
  currentlyTyping: string | null
  onTypingComplete: (msg: string) => void
}

const CHAR_MS = 20
const FAST_CHAR_MS = 20
const PAUSE_MS = 100

type Kind = 'system' | 'error' | 'dialog' | 'narrative'

function classify(text: string): Kind {
  if (text.includes('System:') || text.includes('Congratulations!')) return 'system'
  if (
    text.includes('must be higher') ||
    text.includes('cannot bid') ||
    text.includes('not ineligible') ||
    text.includes('Please enter') ||
    text.includes('Invalid input')
  )
    return 'error'
  if (text.startsWith("\t'") || text.startsWith('\t"') || text.startsWith("\n\t'"))
    return 'dialog'
  return 'narrative'
}

const COLOR: Record<Kind, string> = {
  system: '#c084fc',
  error: '#f87171',
  dialog: '#e2e8f0',
  narrative: '#67e8f9',
}

function MessageLine({
  text,
  cursor = false,
  color,
  parts,
}: {
  text: string
  cursor?: boolean
  color?: string
  parts?: MessagePart[]
}) {
  const kind = classify(text)
  const baseStyle: React.CSSProperties = {
    color: color || COLOR[kind],
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
    lineHeight: 1.65,
    margin: '4px 0',
    fontFamily: 'inherit',
  }

  return (
    <p style={baseStyle}>
      {parts ? parts.map((p, i) => <span key={i} style={{ color: p.color }}>{p.text}</span>) : text}
      {cursor && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            animationName: 'blink',
            animationDuration: '1s',
            animationTimingFunction: 'step-end',
            animationIterationCount: 'infinite',
            color: '#67e8f9',
          }}
        >
          ▋
        </span>
      )}
    </p>
  )
}

// Bundles the active message and its current character index together so
// a message change ALWAYS resets to idx=0 — avoids the stale-charIndex
// no-op that occurs when charIndex is already 0 on the first frame.
interface TypingState {
  msg: string
  idx: number
}

export default function MessageLog({ messages, currentlyTyping, onTypingComplete }: Props) {
  const [typedText, setTypedText] = useState('')
  const [typingState, setTypingState] = useState<TypingState | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // When the parent hands us a new message, reset typing state to index 0.
  useEffect(() => {
    if (currentlyTyping === null) {
      setTypingState(null)
      setTypedText('')
    } else {
      setTypingState({ msg: currentlyTyping, idx: 0 })
    }
  }, [currentlyTyping])

  // Advance one character per tick, driven entirely by typingState.
  useEffect(() => {
    if (typingState === null) return
    const { msg, idx } = typingState

    if (idx >= msg.length) {
      const t = setTimeout(() => onTypingComplete(msg), PAUSE_MS)
      return () => clearTimeout(t)
    }

    const speed = msg.length > 100 ? FAST_CHAR_MS : CHAR_MS
    const t = setTimeout(() => {
      setTypedText(msg.slice(0, idx + 1))
      setTypingState({ msg, idx: idx + 1 })
    }, speed)
    return () => clearTimeout(t)
  }, [typingState, onTypingComplete])

  // Keep newest line visible
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typedText])

  return (
    <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
      {messages.map((msg, i) => {
        const text = typeof msg === 'string' ? msg : msg.text
        const color = typeof msg === 'string' ? undefined : msg.color
        const parts = typeof msg === 'string' ? undefined : msg.parts
        return <MessageLine key={i} text={text} color={color} parts={parts} />
      })}
      {currentlyTyping !== null && <MessageLine text={typedText} cursor />}
      <div ref={bottomRef} />
    </div>
  )
}
