import { useEffect, useState } from 'react'
import { Delete, LockKeyhole } from 'lucide-react'
import { hashPin } from '../lib/sha256.js'
import { useStore } from '../store.jsx'
import { FarmerAvatar } from './Art.jsx'
import { ConfirmDialog } from './ui.jsx'

export const PIN_LENGTH = 4

// Number pad with dots, big enough for work-worn thumbs.
export function PinPad({ onComplete, error, resetKey }) {
  const [digits, setDigits] = useState('')
  useEffect(() => setDigits(''), [resetKey])

  const press = (d) => {
    if (digits.length >= PIN_LENGTH) return
    const next = digits + d
    setDigits(next)
    if (next.length === PIN_LENGTH) setTimeout(() => onComplete(next), 120)
  }
  const back = () => setDigits((x) => x.slice(0, -1))

  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="pinpad">
      <div className={`pin-dots ${error ? 'shake' : ''}`} key={resetKey} aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={i < digits.length ? 'on' : ''} />
        ))}
      </div>
      <div className="pin-error" role="alert">{error || ' '}</div>
      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="plain" onClick={back} aria-label="Delete last digit">
          <Delete size={22} />
        </button>
      </div>
    </div>
  )
}

/** Shown on app start when the farmer has turned on the app lock. */
export function LockScreen() {
  const { state, unlock, reset, ask, dialog } = useStore()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [waitUntil, setWaitUntil] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (waitUntil <= Date.now()) return undefined
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [waitUntil])
  const waiting = Math.max(0, Math.ceil((waitUntil - now) / 1000))

  const check = (pin) => {
    if (waiting) return
    if (hashPin(pin, state.profile.pinSalt) === state.profile.pinHash) {
      unlock()
      return
    }
    const tries = attempt + 1
    setAttempt(tries)
    // Slow down guessing after every 5 wrong tries.
    if (tries % 5 === 0) {
      setWaitUntil(Date.now() + 30000)
      setNow(Date.now())
      setError('Too many wrong tries. Wait 30 seconds.')
    } else {
      setError('Wrong PIN. Try again.')
    }
  }

  const forgot = async () => {
    const ok = await ask({
      title: 'Forgot your PIN?',
      message:
        'The PIN cannot be recovered. You can erase all records on this phone and start over, then restore a backup file if you have one.',
      confirmLabel: 'Erase and start over',
      danger: true,
    })
    if (ok) {
      reset()
      unlock()
    }
  }

  return (
    <main className="lock">
      <FarmerAvatar size={88} />
      <h1>
        <LockKeyhole size={20} style={{ verticalAlign: -3 }} /> {state.profile.name ? `Hi, ${state.profile.name.split(' ')[0]}` : 'Sakahan is locked'}
      </h1>
      <p className="muted">Enter your 4-digit PIN to open your farm records.</p>
      <PinPad onComplete={check} error={waiting ? `Too many wrong tries. Wait ${waiting}s.` : error} resetKey={attempt} />
      <button className="link-btn" onClick={forgot}>
        Forgot PIN?
      </button>
      <ConfirmDialog dialog={dialog} />
    </main>
  )
}
