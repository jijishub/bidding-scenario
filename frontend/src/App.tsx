import { useCallback, useEffect, useRef, useState } from 'react'
import Teleprompter from './Teleprompter'
import { createSession, sendStep } from './api'
import type { InputConfig, StepResponse } from './types'

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([])
  const [typingQueue, setTypingQueue] = useState<string[]>([])
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null)
  const [inputConfig, setInputConfig] = useState<InputConfig | null>(null)
  const [inputActive, setInputActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Holds the input config and done flag that should activate once typing drains
  const pendingInput = useRef<InputConfig | null>(null)
  const pendingDone = useRef(false)

  useEffect(() => {
    startSession()
  }, [])

  // Dequeue: when not typing and queue is non-empty, start the next message.
  // When queue drains, activate the pending input.
  useEffect(() => {
    if (currentlyTyping !== null) return

    if (typingQueue.length > 0) {
      const [next, ...rest] = typingQueue
      setTypingQueue(rest)
      setCurrentlyTyping(next)
      return
    }

    // Queue empty — reveal input
    if (pendingInput.current) {
      setInputConfig(pendingInput.current)
      setInputActive(true)
      setDone(pendingDone.current)
    }
  }, [typingQueue, currentlyTyping])

  const handleTypingComplete = useCallback((msg: string) => {
    setDisplayedMessages((prev) => [...prev, msg])
    setCurrentlyTyping(null)
  }, [])

  function applyResponse(resp: StepResponse) {
    setSessionId(resp.session_id)
    pendingInput.current = resp.input
    pendingDone.current = resp.done
    setInputActive(false)

    if (resp.messages.length === 0) {
      // No messages to animate — activate input immediately
      setInputConfig(resp.input)
      setInputActive(true)
      setDone(resp.done)
    } else {
      setTypingQueue((prev) => [...prev, ...resp.messages])
    }
  }

  async function startSession() {
    // Reset all state
    setDisplayedMessages([])
    setTypingQueue([])
    setCurrentlyTyping(null)
    setInputConfig(null)
    setInputActive(false)
    setDone(false)
    setSessionId(null)
    pendingInput.current = null
    pendingDone.current = false

    setLoading(true)
    try {
      const resp = await createSession()
      applyResponse(resp)
    } finally {
      setLoading(false)
    }
  }

  async function handleInput(value: string) {
    if (!sessionId || loading || !inputActive) return
    setInputActive(false)
    setLoading(true)
    try {
      const resp = await sendStep(sessionId, value)
      applyResponse(resp)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Teleprompter
      displayedMessages={displayedMessages}
      currentlyTyping={currentlyTyping}
      onTypingComplete={handleTypingComplete}
      inputConfig={inputActive ? inputConfig : null}
      onInput={handleInput}
      loading={loading}
      done={done}
      onRestart={startSession}
    />
  )
}
