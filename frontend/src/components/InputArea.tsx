import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import type { InputConfig } from '../types'

interface Props {
  config: InputConfig | null
  onSubmit: (value: string) => void
  loading: boolean
  done: boolean
  onRestart: () => void
}

const CYAN = '#06b6d4'
const PURPLE = '#a78bfa'

function glassBtn(color: string, disabled = false): CSSProperties {
  return {
    padding: '8px 22px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    background: disabled ? 'rgba(255,255,255,0.04)' : `${color}18`,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : color + '44'}`,
    color: disabled ? 'rgba(255,255,255,0.25)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.02em',
  }
}

function glassInput(): CSSProperties {
  return {
    flex: 1,
    padding: '9px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'rgba(6,182,212,0.04)',
    border: '1px solid rgba(6,182,212,0.2)',
    color: '#f1f5f9',
    outline: 'none',
    transition: 'border-color 0.15s',
  }
}

export default function InputArea({ config, onSubmit, loading, onRestart }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('')
    const shouldFocus =
      config &&
      config.type !== 'continue' &&
      config.type !== 'choice' &&
      config.type !== 'done'
    if (shouldFocus) setTimeout(() => inputRef.current?.focus(), 60)
  }, [config])

  function submit() {
    if (loading) return
    onSubmit(value)
    setValue('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  // Loading indicator while no config
  if (!config) {
    return loading ? (
      <span style={{ fontSize: 12, color: 'rgba(6,182,212,0.45)', letterSpacing: '0.05em' }}>
        processing...
      </span>
    ) : null
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (config.type === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBlock: 12 }}>
        <p style={{ fontSize: 11, color: 'rgba(6,182,212,0.5)', letterSpacing: '0.08em' }}>
          {config.label.toUpperCase()}
        </p>
        <button onClick={onRestart} style={glassBtn(PURPLE)}>
          Play Again
        </button>
      </div>
    )
  }

  // ── Continue (press any key) ──────────────────────────────────────────────
  if (config.type === 'continue') {
    return (
      <button
        onClick={() => onSubmit('')}
        disabled={loading}
        style={glassBtn('#4b5563', loading)}
      >
        {config.label || 'Continue →'}
      </button>
    )
  }

  // ── Choice buttons ────────────────────────────────────────────────────────
  if (config.type === 'choice') {
    return (
      <div>
        <p style={{ fontSize: 11, color: 'rgba(6,182,212,0.65)', marginBottom: 10, letterSpacing: '0.05em' }}>
          {config.label.toUpperCase()}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {config.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => onSubmit(opt)}
              disabled={loading}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                background: 'rgba(6,182,212,0.05)',
                border: '1px solid rgba(6,182,212,0.18)',
                color: '#67e8f9',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(6,182,212,0.12)'
                el.style.borderColor = 'rgba(6,182,212,0.45)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(6,182,212,0.05)'
                el.style.borderColor = 'rgba(6,182,212,0.18)'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Text / Number ─────────────────────────────────────────────────────────
  return (
    <div>
      {config.label && (
        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: 'rgba(6,182,212,0.65)',
            marginBottom: 8,
            letterSpacing: '0.05em',
            whiteSpace: 'pre-wrap',
          }}
        >
          {config.label.toUpperCase()}
        </label>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type={config.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={config.placeholder}
          disabled={loading}
          style={glassInput()}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.55)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.2)' }}
        />
        <button
          onClick={submit}
          disabled={loading || !value}
          style={glassBtn(CYAN, loading || !value)}
        >
          Enter
        </button>
      </div>
    </div>
  )
}
