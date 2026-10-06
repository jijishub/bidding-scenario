import { useState } from 'react'
import StarField from './components/StarField'
import MessageLog from './components/MessageLog'
import InputArea from './components/InputArea'
import type { InputConfig, Message } from './types'

interface Props {
  displayedMessages: (string | Message)[]
  currentlyTyping: string | null
  currentlyTypingColor?: string
  onTypingComplete: (msg: string) => void
  inputConfig: InputConfig | null
  onInput: (value: string) => void
  loading: boolean
  done: boolean
  error: string | null
  onRestart: () => void
  onSkip?: (point?: string) => void
}

export default function Teleprompter({
  displayedMessages,
  currentlyTyping,
  currentlyTypingColor,
  onTypingComplete,
  inputConfig,
  onInput,
  loading,
  done,
  error,
  onRestart,
  onSkip,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 40%, #0a0f1e 0%, #000 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
      }}
    >
      {/* Star field */}
      <StarField />

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 700,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* Glass panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 660,
          margin: '0 16px',
          borderRadius: 20,
          background: 'rgba(6, 9, 22, 0.78)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(6, 182, 212, 0.18)',
          boxShadow: [
            '0 0 0 1px rgba(6,182,212,0.06)',
            '0 32px 80px rgba(0,0,0,0.75)',
            'inset 0 1px 0 rgba(255,255,255,0.04)',
          ].join(', '),
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(6,182,212,0.12)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot color="#ef4444" />
            <Dot color="#f59e0b" />
            <Dot color="#22c55e" />
            <span
              style={{
                marginLeft: 10,
                fontSize: 11,
                letterSpacing: '0.1em',
                color: 'rgba(6,182,212,0.4)',
              }}
            >
              AUCTION TERMINAL — BIDDING SCENARIO v1.0
            </span>
          </div>

          {/* Settings Gear Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Dev & Testing Fast-Forward"
            style={{
              background: showSettings ? 'rgba(6,182,212,0.2)' : 'transparent',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 6,
              color: '#67e8f9',
              cursor: 'pointer',
              padding: '3px 8px',
              fontSize: 12,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            ⚙ DEV
          </button>

          {/* Dev Skipping Popover */}
          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 20,
                zIndex: 50,
                width: 250,
                background: 'rgba(6, 12, 28, 0.95)',
                border: '1px solid rgba(6,182,212,0.4)',
                borderRadius: 12,
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(16px)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(6,182,212,0.7)', letterSpacing: '0.05em' }}>
                TEST CREDENTIALS: AGE 22 (CLAIM: 11)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: '⚡ Bid Choice', point: 'BID_CHOICE' },
                  { label: '⚡ Bidding Duel', point: 'BIDDING' },
                  { label: '⚡ Claim Item (Code 11)', point: 'VERIFY_AGE' },
                  { label: '⚡ Break Room (Win)', point: 'BID_BREAK_WIN' },
                  { label: '⚡ Break Room (Loss)', point: 'BID_BREAK_LOSS' },
                  { label: '🔄 Normal Start', point: undefined },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowSettings(false)
                      onSkip?.(item.point)
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'inherit',
                      background: 'rgba(6,182,212,0.06)',
                      border: '1px solid rgba(6,182,212,0.2)',
                      color: item.point ? '#67e8f9' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(6,182,212,0.18)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(6,182,212,0.06)'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message viewport */}
        <div style={{ padding: '20px 24px', minHeight: 300 }}>
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: 'var(--teleprompter-red)', fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>
                {error}
              </p>
              <button
                onClick={onRestart}
                style={{
                  alignSelf: 'flex-start',
                  padding: '7px 18px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.35)',
                  color: 'var(--teleprompter-red)',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <MessageLog
              messages={displayedMessages}
              currentlyTyping={currentlyTyping}
              currentlyTypingColor={currentlyTypingColor}
              onTypingComplete={onTypingComplete}
            />
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(6,182,212,0.08)' }} />

        {/* Input zone */}
        <div style={{ padding: '16px 24px 20px' }}>
          <InputArea
            config={inputConfig}
            onSubmit={onInput}
            loading={loading}
            done={done}
            onRestart={onRestart}
          />
        </div>
      </div>
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        opacity: 0.7,
      }}
    />
  )
}
