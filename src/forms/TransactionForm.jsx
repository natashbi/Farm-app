import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CATEGORIES, getCategory } from '../data/categories.js'
import { activeSeason, seasonLabel } from '../lib/calc.js'
import { todayISO, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Field, Segmented, Sheet, TlGuide } from '../components/ui.jsx'

const UNITS = ['bags', 'kg', 'liters', 'cavans', 'sacks', 'pcs', 'days']
const DEFAULT_UNIT = { fertilizer: 'bags', seeds: 'kg', pesticide: 'liters', harvest_sale: 'cavans', labor: 'days' }

export default function TransactionForm({ tx, preset, onClose }) {
  const { state, save, remove, notify, ask, celebrate } = useStore()
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
    if (!editing && kind === 'income') celebrate()
    onClose()
  }

  const del = async () => {
    if (!(await ask({ title: 'Delete this record?', confirmLabel: 'Delete', danger: true }))) return
    remove('transactions', tx.id)
    notify('Record deleted')
    onClose()
  }

  const seasons = [...state.seasons].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  const fieldsById = Object.fromEntries(state.fields.map((x) => [x.id, x]))

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
        <TlGuide text="Piliin kung GASTOS (perang lumabas) o KITA (perang pumasok)." />
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
          <TlGuide text="Saan napunta ang pera? Hal. abono, binhi, trabahador, gamit." />
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

        <Field label="Amount (₱)" tl="Magkano ang binayad o natanggap?">
          <div className="input-prefix">
            <b>₱</b>
            <input className="input" inputMode="decimal" placeholder="0" value={form.amount} onChange={set('amount')} autoFocus={!editing} />
          </div>
        </Field>
        {error && <div className="callout warn">{error}</div>}

        <Field label="What was it? (optional)" tl="Ano ang binili o ibinenta? Hal. Urea 46-0-0.">
          <input
            className="input"
            placeholder={kind === 'income' ? 'e.g. Sold 50 cavans palay' : 'e.g. Urea 46-0-0, knapsack sprayer'}
            value={form.item}
            onChange={set('item')}
          />
        </Field>

        <div className="field-row thirds">
          <Field label="Quantity (optional)" tl="Ilan? Hal. 4 (na sako).">
            <input className="input" inputMode="decimal" placeholder="0" value={form.qty} onChange={set('qty')} />
          </Field>
          <Field label="Unit" tl="Sukat: sako, kilo, litro…">
            <select className="input" value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Date" tl="Kailan ito binili o natanggap?">
          <input className="input" type="date" value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Planting (field · season)" hint="Farm-wide costs like tools can stay without a field." tl="Para saang lote ito? Piliin ang “Farm-wide” kung para sa buong bukid (hal. gamit).">
          <select className="input" value={form.seasonId} onChange={set('seasonId')}>
            <option value="">Farm-wide (no field)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {seasonLabel(s, fieldsById)}
                {s.status === 'active' ? ' (growing)' : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes (optional)" tl="Iba pang detalye. Hal. saan binili, sino ang nagtrabaho.">
          <textarea className="input" value={form.note} onChange={set('note')} placeholder="Supplier, who worked, etc." />
        </Field>
      </form>
    </Sheet>
  )
}
