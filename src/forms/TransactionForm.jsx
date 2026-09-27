import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CATEGORIES, getCategory } from '../data/categories.js'
import { activeSeason } from '../lib/calc.js'
import { todayISO, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Field, Segmented, Sheet } from '../components/ui.jsx'

const UNITS = ['bags', 'kg', 'liters', 'cavans', 'sacks', 'pcs', 'days']
const DEFAULT_UNIT = { fertilizer: 'bags', seeds: 'kg', pesticide: 'liters', harvest_sale: 'cavans', labor: 'days' }

export default function TransactionForm({ tx, preset, onClose }) {
  const { state, save, remove, notify, ask } = useStore()
  const editing = !!tx
  const startCat = tx?.category || preset?.category || 'fertilizer'
  const [kind, setKind] = useState(getCategory(startCat).group === 'income' ? 'income' : 'expense')
  const [form, setForm] = useState(() => ({
    category: startCat,
    item: tx?.item ?? preset?.item ?? '',
    amount: tx?.amount ?? '',
    qty: tx?.qty ?? '',
    unit: tx?.unit || DEFAULT_UNIT[startCat] || 'pcs',
    date: tx?.date || todayISO(),
    seasonId: tx ? tx.seasonId || '' : preset?.seasonId ?? activeSeason(state.seasons)?.id ?? '',
    note: tx?.note ?? preset?.note ?? '',
  }))
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }))

  const cats = CATEGORIES.filter((c) => (kind === 'income' ? c.group === 'income' : c.group !== 'income'))

  const switchKind = (k) => {
    setKind(k)
    const first = CATEGORIES.find((c) => (k === 'income' ? c.group === 'income' : c.group !== 'income'))
    if (getCategory(form.category).group === 'income' !== (k === 'income')) {
      setForm((f) => ({ ...f, category: first.id, unit: DEFAULT_UNIT[first.id] || f.unit }))
    }
  }

  const submit = (e) => {
    e?.preventDefault()
    const amount = toNumber(form.amount)
    if (!amount || amount <= 0) return setError('Please enter the amount in pesos.')
    const qty = toNumber(form.qty)
    save('transactions', {
      ...(tx || {}),
      category: form.category,
      item: form.item.trim(),
      amount,
      qty: qty || '',
      unit: qty ? form.unit : '',
      date: form.date || todayISO(),
      seasonId: form.seasonId,
      note: form.note.trim(),
    })
    notify(editing ? 'Record updated' : kind === 'income' ? 'Income saved 🌾' : 'Expense saved')
    onClose()
  }

  const del = async () => {
    if (!(await ask({ title: 'Delete this record?', confirmLabel: 'Delete', danger: true }))) return
    remove('transactions', tx.id)
    notify('Record deleted')
    onClose()
  }

  const seasons = [...state.seasons].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))

  return (
    <Sheet
      title={editing ? 'Edit record' : kind === 'income' ? 'Add income' : 'Add expense'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="btn danger" style={{ flex: 'none' }} onClick={del} aria-label="Delete record">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn primary" onClick={submit}>
            Save
          </button>
        </>
      }
    >
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <Segmented
          label="Record type"
          value={kind}
          onChange={switchKind}
          options={[
            { value: 'expense', label: 'Expense · Gastos' },
            { value: 'income', label: 'Income · Kita' },
          ]}
        />

        <fieldset className="field">
          <legend>Category</legend>
          <div className="cat-grid">
            {cats.map((c) => (
              <button
                type="button"
                key={c.id}
                className="cat-btn"
                aria-pressed={form.category === c.id}
                onClick={() => setForm((f) => ({ ...f, category: c.id, unit: f.qty ? f.unit : DEFAULT_UNIT[c.id] || f.unit }))}
              >
                <span className="emoji" aria-hidden="true">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
          <small>
            {getCategory(form.category).tl} ·{' '}
            {getCategory(form.category).group === 'tools'
              ? 'counts as tools & equipment'
              : getCategory(form.category).group === 'income'
                ? 'counts as income'
                : 'counts as production cost'}
          </small>
        </fieldset>

        <Field label="Amount (₱)">
          <div className="input-prefix">
            <b>₱</b>
            <input className="input" inputMode="decimal" placeholder="0" value={form.amount} onChange={set('amount')} autoFocus={!editing} />
          </div>
        </Field>
        {error && <div className="callout warn">{error}</div>}

        <Field label="What was it? (optional)">
          <input
            className="input"
            placeholder={kind === 'income' ? 'e.g. Sold 50 cavans palay' : 'e.g. Urea 46-0-0, knapsack sprayer'}
            value={form.item}
            onChange={set('item')}
          />
        </Field>

        <div className="field-row thirds">
          <Field label="Quantity (optional)">
            <input className="input" inputMode="decimal" placeholder="0" value={form.qty} onChange={set('qty')} />
          </Field>
          <Field label="Unit">
            <select className="input" value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="field-row">
          <Field label="Date">
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Season">
            <select className="input" value={form.seasonId} onChange={set('seasonId')}>
              <option value="">No season</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <textarea className="input" value={form.note} onChange={set('note')} placeholder="Supplier, who worked, etc." />
        </Field>
      </form>
    </Sheet>
  )
}
