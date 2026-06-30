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
  const [error, setError] = useState<string | null>(null)

  const pendingInput = useRef<InputConfig | null>(null)
  const pendingDone = useRef(false)
  // Prevents the StrictMode double-mount from firing two createSession calls
  const initiated = useRef(false)

  useEffect(() => {
    if (initiated.current) return
    initiated.current = true
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
    setError(null)
    setSessionId(resp.session_id)
    pendingInput.current = resp.input
    pendingDone.current = resp.done
    setInputActive(false)

    if (resp.messages.length === 0) {
      setInputConfig(resp.input)
      setInputActive(true)
      setDone(resp.done)
    } else {
      setTypingQueue((prev) => [...prev, ...resp.messages])
    }
  }

  async function startSession() {
    initiated.current = true
    setDisplayedMessages([])
    setTypingQueue([])
    setCurrentlyTyping(null)
    setInputConfig(null)
    setInputActive(false)
    setDone(false)
    setSessionId(null)
    setError(null)
    pendingInput.current = null
    pendingDone.current = false

    setLoading(true)
    try {
      const resp = await createSession()
      applyResponse(resp)
    } catch (e) {
      setError(
        'Cannot reach the backend. Make sure the FastAPI server is running on port 8000.\n' +
        String(e),
      )
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
    } catch (e) {
      setError('Network error: ' + String(e))
      setInputActive(true)
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
      error={error}
      onRestart={startSession}
    />
  )
}
