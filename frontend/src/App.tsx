import { useCallback, useEffect, useRef, useState } from 'react'
import Teleprompter from './Teleprompter'
import { createSession, sendStep } from './api'
import type { InputConfig, Message, StepResponse } from './types'

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayedMessages, setDisplayedMessages] = useState<(string | Message)[]>([])
  const [typingQueue, setTypingQueue] = useState<(string | Message)[]>([])
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null)
  const [inputConfig, setInputConfig] = useState<InputConfig | null>(null)
  const [inputActive, setInputActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actions, setActions] = useState<string[]>([])

  const pendingInput = useRef<InputConfig | null>(null)
  const pendingDone = useRef(false)
  const currentMessageObj = useRef<string | Message | null>(null)
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
      currentMessageObj.current = next
      const msgText = typeof next === 'string' ? next : next.text
      setCurrentlyTyping(msgText)
      return
    }

    if (pendingInput.current) {
      setInputConfig(pendingInput.current)
      setInputActive(true)
      setDone(pendingDone.current)
    }
  }, [typingQueue, currentlyTyping])

  const handleTypingComplete = useCallback(() => {
    if (currentMessageObj.current) {
      setDisplayedMessages((prev) => [...prev, currentMessageObj.current!])
      currentMessageObj.current = null
    }
    setCurrentlyTyping(null)
  }, [])

  // Handle actions from the backend (e.g., beep sounds)
  useEffect(() => {
    if (actions.includes('play_beep_3x')) {
      // Play beep sound 3 times using Web Audio API
      const playBeep = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800 // Hz
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      }

      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(), i * 400)
      }
    }

    if (actions.includes('play_chime')) {
      // Elegant sci-fi announcement chime: E5 (659Hz) into B5 (988Hz) with soft decay
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playBellTone = (freq: number, startDelay: number, duration: number) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, audioContext.currentTime)
          gain.gain.setValueAtTime(0.25, audioContext.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
          osc.start(audioContext.currentTime)
          osc.stop(audioContext.currentTime + duration)
        }, startDelay)
      }
      playBellTone(659.25, 0, 1.2)   // E5 tone
      playBellTone(987.77, 200, 1.6) // B5 tone
    }
  }, [actions])

  function applyResponse(resp: StepResponse) {
    setError(null)
    setSessionId(resp.session_id)
    setActions(resp.actions || [])
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

  async function startSession(skipTo?: string) {
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
      const resp = await createSession(skipTo)
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

  const currentlyTypingColor =
    currentMessageObj.current && typeof currentMessageObj.current !== 'string'
      ? currentMessageObj.current.color
      : undefined

  return (
    <Teleprompter
      displayedMessages={displayedMessages}
      currentlyTyping={currentlyTyping}
      currentlyTypingColor={currentlyTypingColor}
      onTypingComplete={handleTypingComplete}
      inputConfig={inputActive ? inputConfig : null}
      onInput={handleInput}
      loading={loading}
      done={done}
      error={error}
      onRestart={() => startSession()}
      onSkip={startSession}
    />
  )
}
