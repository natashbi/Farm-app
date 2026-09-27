import { createContext, useContext, useEffect, useRef } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { EmptyFieldArt } from './Art.jsx'
import { getCategory } from '../data/categories.js'
import { fmtDate, peso } from '../lib/format.js'

// Navigation: bottom tabs + a stack of full-screen sheets that the phone's
// back button can close.
export const NavContext = createContext(null)
export const useNav = () => useContext(NavContext)

export function Sheet({ title, onClose, onBack, children, footer, action, closeIcon = 'back', scrollKey }) {
  const body = useRef(null)
  useEffect(() => {
    body.current?.scrollTo?.(0, 0)
  }, [scrollKey])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <button className="icon-btn plain" onClick={onBack || onClose} aria-label={onBack ? 'Back' : 'Close'}>
            {closeIcon === 'x' ? <X size={22} /> : <ArrowLeft size={22} />}
          </button>
          <h2>{title}</h2>
          <div style={{ width: 42, display: 'grid', placeItems: 'center' }}>{action}</div>
        </header>
        <div className="sheet-body" ref={body}>
          {children}
        </div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </section>
    </>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Chip({ active, onClick, emoji, children, ...rest }) {
  return (
    <button type="button" className="chip" aria-pressed={!!active} onClick={onClick} {...rest}>
      {emoji && <span className="emoji" aria-hidden="true">{emoji}</span>}
      {children}
    </button>
  )
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SectionHead({ title, sub, action, onAction }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {action && (
        <button className="link" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

export function Stat({ label, value, hint, tone, dot }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <span className="label">
        {dot && <i className="dot" style={{ background: dot }} />}
        {label}
      </span>
      <span className="value">{value}</span>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Progress({ value }) {
  const pct = Math.max(0, Math.min(1, value || 0))
  return (
    <div className={`progress ${value > 1 ? 'over' : ''}`} role="progressbar" aria-valuenow={Math.round((value || 0) * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct * 100}%` }} />
    </div>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <EmptyFieldArt className="art" />
      <strong>{title}</strong>
      {children && <p className="small">{children}</p>}
      {action}
    </div>
  )
}

export function TxRow({ tx, season, onClick }) {
  const cat = getCategory(tx.category)
  const income = cat.group === 'income'
  return (
    <button className="row" onClick={onClick}>
      <span className="bubble" aria-hidden="true">{cat.emoji}</span>
      <span className="grow">
        <span className="title" style={{ display: 'block' }}>{tx.item || cat.label}</span>
        <span className="meta" style={{ display: 'block' }}>
          {cat.label}
          {tx.qty ? ` · ${tx.qty} ${tx.unit || ''}` : ''} · {fmtDate(tx.date, { month: 'short', day: 'numeric' })}
          {season ? ` · ${season.name}` : ''}
        </span>
      </span>
      <span className={`amount ${income ? 'in' : 'out'}`}>
        {income ? '+' : '−'}
        {peso(tx.amount)}
      </span>
    </button>
  )
}

export function ConfirmDialog({ dialog }) {
  useEffect(() => {
    if (!dialog) return
    // Capture phase so Escape closes only the dialog, not the sheet behind it.
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      dialog.answer(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [dialog])
  if (!dialog) return null
  return (
    <div className="dialog-backdrop" onClick={() => dialog.answer(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="dialog-title">{dialog.title}</h2>
        {dialog.message && <p>{dialog.message}</p>}
        <div className="field-row">
          <button className="btn ghost" onClick={() => dialog.answer(false)} autoFocus>
            Cancel
          </button>
          <button className={`btn ${dialog.danger ? 'danger-fill' : 'primary'}`} onClick={() => dialog.answer(true)}>
            {dialog.confirmLabel || 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div key={toast.key} className={`toast ${toast.tone === 'bad' ? 'bad' : ''}`} role="status">
      {toast.message}
    </div>
  )
}
