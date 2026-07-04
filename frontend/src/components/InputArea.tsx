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

function formatWithCommas(raw: string): string {
  if (!raw) return ''
  const [intPart, decPart] = raw.split('.')
  const formattedInt = intPart === '' ? '' : Number(intPart).toLocaleString('en-US')
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
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

  // Handle keyboard shortcuts for choice buttons
  useEffect(() => {
    if (config?.type !== 'choice' || loading) return

    function handleKeyPress(e: globalThis.KeyboardEvent) {
      if (!config?.options) return

      const options = config.options
      let index = -1
      const optionText = options.map(option => option.toLowerCase())
      const positiveIndex = optionText.findIndex(option =>
        option.startsWith('true') || option.startsWith('yes') || option.startsWith('1')
      )
      const negativeIndex = optionText.findIndex(option =>
        option.startsWith('false') || option.startsWith('no') || option.startsWith('0')
      )

      if (e.key === '1') {
        index = positiveIndex >= 0 && negativeIndex >= 0 ? positiveIndex : 1
      } else if (e.key === '0') {
        index = positiveIndex >= 0 && negativeIndex >= 0 ? negativeIndex : 0
      } else if (e.key === '2') index = 2
      else if (e.key === '3') index = 3
      else if (e.key === '4') index = 4
      else if (e.key === '5') index = 5
      else if (e.key === '6') index = 6
      else if (e.key === '7') index = 7
      else if (e.key === '8') index = 8
      else if (e.key === '9') index = 9

      if (index >= 0 && index < options.length) {
        e.preventDefault()
        onSubmit(options[index])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [config, loading, onSubmit])

  // Handle keyboard for continue (press any key)
  useEffect(() => {
    if (config?.type !== 'continue' || loading) return

    function handleKeyPress(e: globalThis.KeyboardEvent) {
      e.preventDefault()
      onSubmit('')
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [config, loading, onSubmit])

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
          type="text"
          inputMode={config.type === 'number' ? 'decimal' : undefined}
          value={config.type === 'number' ? formatWithCommas(value) : value}
          onChange={e => {
            if (config.type !== 'number') {
              setValue(e.target.value)
              return
            }
            const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '')
            const [head, ...rest] = raw.split('.')
            setValue(rest.length ? `${head}.${rest.join('')}` : head)
          }}
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
