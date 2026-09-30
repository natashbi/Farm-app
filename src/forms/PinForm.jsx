import { useState } from 'react'
import { hashPin } from '../lib/sha256.js'
import { useStore } from '../store.jsx'
import { Sheet } from '../components/ui.jsx'
import { PinPad } from '../components/Lock.jsx'

const newSalt = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

/**
 * Set, change or turn off the app lock. Changing or turning it off asks for the
 * current PIN first. Only a salted SHA-256 hash of the PIN is stored.
 */
export default function PinForm({ mode = 'set', onClose }) {
  const { state, setProfile, notify } = useStore()
  const hasPin = !!state.profile.pinHash
  const [step, setStep] = useState(hasPin ? 'current' : 'new')
  const [first, setFirst] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const prompts = {
    current: 'Enter your current PIN',
    new: 'Choose a new 4-digit PIN',
    confirm: 'Enter the new PIN again',
  }

  const fail = (message) => {
    setError(message)
    setAttempt((a) => a + 1)
  }

  const onComplete = (pin) => {
    if (step === 'current') {
      if (hashPin(pin, state.profile.pinSalt) !== state.profile.pinHash) return fail('Wrong PIN. Try again.')
      if (mode === 'remove') {
        setProfile({ pinHash: '', pinSalt: '' })
        notify('App lock turned off')
        return onClose()
      }
      setError('')
      setAttempt((a) => a + 1)
      return setStep('new')
    }
    if (step === 'new') {
      setFirst(pin)
      setError('')
      setAttempt((a) => a + 1)
      return setStep('confirm')
    }
    if (pin !== first) {
      setStep('new')
      return fail('The PINs did not match. Start again.')
    }
    const salt = newSalt()
    setProfile({ pinSalt: salt, pinHash: hashPin(pin, salt) })
    notify(hasPin ? 'PIN changed 🔒' : 'App lock is on 🔒')
    onClose()
  }

  const title = mode === 'remove' ? 'Turn off app lock' : hasPin ? 'Change PIN' : 'Set up app lock'
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="stack center" style={{ gap: 6, paddingTop: 12 }}>
        <h3 style={{ fontSize: 19, fontWeight: 600 }}>{prompts[step]}</h3>
        {step !== 'current' && (
          <p className="small muted">The app will ask for this PIN every time it opens, so others using the phone cannot see your records.</p>
        )}
      </div>
      <PinPad onComplete={onComplete} error={error} resetKey={`${step}-${attempt}`} />
    </Sheet>
  )
}
