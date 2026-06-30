import { useEffect, useRef, useState } from 'react'

interface Props {
  messages: string[]
  currentlyTyping: string | null
  onTypingComplete: (msg: string) => void
}

const CHAR_MS = 14
const FAST_CHAR_MS = 6    // long messages type faster
const PAUSE_MS = 90       // gap between messages

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

function MessageLine({ text, cursor = false }: { text: string; cursor?: boolean }) {
  const kind = classify(text)
  return (
    <p
      style={{
        color: COLOR[kind],
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 13,
        lineHeight: 1.65,
        margin: '4px 0',
        fontFamily: 'inherit',
      }}
    >
      {text}
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

export default function MessageLog({ messages, currentlyTyping, onTypingComplete }: Props) {
  const [typedText, setTypedText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const activeMsg = useRef<string | null>(null)   // which message is being animated
  const bottomRef = useRef<HTMLDivElement>(null)

  // Single effect handles both reset-on-new-message and character advancement.
  // Using a ref (activeMsg) avoids the two-effect ordering race where the old
  // charIndex could fire onTypingComplete for the newly arrived message.
  useEffect(() => {
    if (currentlyTyping === null) {
      activeMsg.current = null
      return
    }

    // New message arrived — reset and let the next render start at char 0
    if (activeMsg.current !== currentlyTyping) {
      activeMsg.current = currentlyTyping
      setTypedText('')
      setCharIndex(0)
      return
    }

    // Typing complete — pause then notify parent
    if (charIndex >= currentlyTyping.length) {
      const t = setTimeout(() => onTypingComplete(currentlyTyping), PAUSE_MS)
      return () => clearTimeout(t)
    }

    // Advance one character
    const speed = currentlyTyping.length > 100 ? FAST_CHAR_MS : CHAR_MS
    const t = setTimeout(() => {
      setTypedText(currentlyTyping.slice(0, charIndex + 1))
      setCharIndex((i) => i + 1)
    }, speed)
    return () => clearTimeout(t)
  }, [currentlyTyping, charIndex, onTypingComplete])

  // Keep the latest line in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typedText])

  return (
    <div
      style={{
        maxHeight: 340,
        overflowY: 'auto',
        paddingRight: 4,
        scrollbarWidth: 'none',
      }}
    >
      {messages.map((msg, i) => (
        <MessageLine key={i} text={msg} />
      ))}
      {currentlyTyping !== null && <MessageLine text={typedText} cursor />}
      <div ref={bottomRef} />
    </div>
  )
}
