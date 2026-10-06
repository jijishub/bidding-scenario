import { useEffect, useRef, useState } from 'react'
import type { Message, MessagePart } from '../types'

interface Props {
  messages: (string | Message)[]
  currentlyTyping: string | null
  currentlyTypingColor?: string
  onTypingComplete: (msg: string) => void
}

const CHAR_MS = 20
const FAST_CHAR_MS = 20
const PAUSE_MS = 100

type Kind = 'system' | 'error' | 'dialog' | 'narrative'

/**
 * Maps friendly color names (e.g. "teal") to app hex codes or CSS variables.
 * Allows backend authors to write `color="teal"` directly.
 */
export const NAMED_COLORS: Record<string, string> = {
  teal: '#67e8f9',
  cyan: '#67e8f9',
  white: '#ffffff',
  purple: 'var(--teleprompter-purple)',
  red: 'var(--teleprompter-red)',
}

export function resolveColor(color?: string): string | undefined {
  if (!color) return undefined
  const key = color.toLowerCase().trim()
  return NAMED_COLORS[key] || color
}

/**
 * Parses markdown asterisks (*italic*) or <i>italic</i> tags into styled italic spans.
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text.includes('*') && !text.includes('<i>')) return text

  const tokens = text.split(/(\*[^*]+\*|<i>.*?<\/i>)/g)
  return tokens.map((seg, idx) => {
    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
      return (
        <span key={idx} style={{ fontStyle: 'italic' }}>
          {seg.slice(1, -1)}
        </span>
      )
    }
    if (seg.startsWith('<i>') && seg.endsWith('</i>')) {
      return (
        <span key={idx} style={{ fontStyle: 'italic' }}>
          {seg.slice(3, -4)}
        </span>
      )
    }
    return seg
  })
}

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
  system: 'var(--teleprompter-purple)',
  error: 'var(--teleprompter-red)',
  dialog: '#e2e8f0',
  narrative: 'var(--teleprompter-text)',
}

function MessageLine({
  text,
  cursor = false,
  color,
  italic,
  parts,
}: {
  text: string
  cursor?: boolean
  color?: string
  italic?: boolean
  parts?: MessagePart[]
}) {
  const kind = classify(text)
  const resolvedColor = resolveColor(color)
  const baseStyle: React.CSSProperties = {
    color: resolvedColor || COLOR[kind],
    fontStyle: italic ? 'italic' : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
    lineHeight: 1.65,
    margin: '4px 0',
    fontFamily: 'inherit',
  }

  return (
    <p style={baseStyle}>
      {parts
        ? parts.map((p, i) => (
            <span
              key={i}
              style={{
                color: resolveColor(p.color),
                fontStyle: p.italic ? 'italic' : undefined,
              }}
            >
              {renderFormattedText(p.text)}
            </span>
          ))
        : renderFormattedText(text)}
      {cursor && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            animationName: 'blink',
            animationDuration: '1s',
            animationTimingFunction: 'step-end',
            animationIterationCount: 'infinite',
            color: resolvedColor || 'var(--teleprompter-text)',
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

export default function MessageLog({ messages, currentlyTyping, currentlyTypingColor, onTypingComplete }: Props) {
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
        const italic = typeof msg === 'string' ? undefined : msg.italic
        const parts = typeof msg === 'string' ? undefined : msg.parts
        return <MessageLine key={i} text={text} color={color} italic={italic} parts={parts} />
      })}
      {currentlyTyping !== null && <MessageLine text={typedText} color={currentlyTypingColor} cursor />}
      <div ref={bottomRef} />
    </div>
  )
}
