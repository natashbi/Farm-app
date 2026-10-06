import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { HARVEST_UNITS, getCrop } from '../data/categories.js'
import { growingPlantings, seasonLabel } from '../lib/calc.js'
import { num, peso, todayISO, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Field, Sheet, TlGuide } from '../components/ui.jsx'

// One harvest batch: crop, date and quantity, tied to the planting it came from.
export default function HarvestForm({ harvest, preset, onClose }) {
  const { state, save, remove, notify, ask, celebrate } = useStore()
  const editing = !!harvest
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  // Growing plantings first (closest to harvest on top), then past ones.
  const growing = growingPlantings(state.seasons, (c) => getCrop(c).days)
  const past = state.seasons.filter((s) => s.status === 'completed').sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  const plantings = [...growing, ...past]
  const firstSeason = harvest?.seasonId ?? preset?.seasonId ?? plantings[0]?.id ?? ''
  const [f, setF] = useState(() => {
    const s = state.seasons.find((x) => x.id === firstSeason)
    return {
      seasonId: firstSeason,
      date: harvest?.date || todayISO(),
      qty: harvest?.qty ?? '',
      unit: harvest?.unit || s?.harvestUnit || 'cavans',
      pricePerUnit: harvest?.pricePerUnit ?? '',
      buyer: harvest?.buyer || '',
      notes: harvest?.notes || '',
      addIncome: false,
      finish: false,
    }
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const season = state.seasons.find((s) => s.id === f.seasonId)

  const pickSeason = (e) => {
    const s = state.seasons.find((x) => x.id === e.target.value)
    setF((x) => ({ ...x, seasonId: e.target.value, unit: s?.harvestUnit || x.unit }))
  }

  const qty = toNumber(f.qty)
  const price = toNumber(f.pricePerUnit)
  const saleTotal = qty && price ? qty * price : 0

  const submit = (e) => {
    e?.preventDefault()
    if (!season) return setError('Pick the planting this harvest came from. Add a planting first in the Harvest tab.')
    if (!qty || qty <= 0) return setError('Enter how much was harvested.')
    const saved = save('harvests', {
      ...(harvest || {}),
      seasonId: season.id,
      fieldId: season.fieldId || '',
      crop: season.crop,
      date: f.date || todayISO(),
      qty,
      unit: f.unit,
      pricePerUnit: price || '',
      buyer: f.buyer.trim(),
      notes: f.notes.trim(),
    })
    // The last harvest of a planting closes it, so it moves to "Harvested" and joins Compare.
    const finishing = f.finish && season.status === 'active'
    if (finishing) save('seasons', { ...season, status: 'completed', harvestDate: f.date || todayISO(), harvestUnit: season.harvestUnit || f.unit })
    // Selling the harvest right away is common: record the income in one step.
    if (!editing && f.addIncome && saleTotal > 0) {
      save('transactions', {
        category: 'harvest_sale',
        amount: saleTotal,
        qty,
        unit: f.unit,
        item: `Sold ${num(qty)} ${f.unit} ${getCrop(season.crop).label.toLowerCase()}${f.buyer.trim() ? ` to ${f.buyer.trim()}` : ''}`,
        date: f.date || todayISO(),
        seasonId: season.id,
        harvestId: saved.id,
        note: '',
      })
      celebrate()
    } else if (finishing) celebrate()
    notify(editing ? 'Harvest updated' : finishing ? 'Harvest saved · planting marked Harvested 🌾' : f.addIncome && saleTotal > 0 ? 'Harvest and sale saved 🌾' : 'Harvest saved 🌾')
    onClose()
  }

  const del = async () => {
    const ok = await ask({ title: 'Delete this harvest record?', message: 'Any sale already recorded under Expenses stays.', confirmLabel: 'Delete', danger: true })
    if (!ok) return
    remove('harvests', harvest.id)
    notify('Harvest deleted')
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Edit harvest' : 'Log harvest'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="btn danger" style={{ flex: 'none' }} onClick={del} aria-label="Delete harvest">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn primary" onClick={submit}>
            Save harvest
          </button>
        </>
      }
    >
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <Field label="Planting (field · season)" tl="Saang lote at tanim galing ang ani?">
          <select className="input" value={f.seasonId} onChange={pickSeason}>
            {!plantings.length && <option value="">No plantings yet</option>}
            {plantings.map((s) => (
              <option key={s.id} value={s.id}>
                {getCrop(s.crop).emoji} {seasonLabel(s, fieldsById)}
                {s.status === 'active' ? ' (growing)' : ''}
              </option>
            ))}
          </select>
        </Field>
        {season && (
          <p className="small muted" style={{ marginTop: -8 }}>
            Crop: {getCrop(season.crop).emoji} {getCrop(season.crop).label}
            {fieldsById[season.fieldId] ? ` · ${num(fieldsById[season.fieldId].area)} ha` : ''}
          </p>
        )}

        <Field label="Harvest date" tl="Kailan inani?">
          <input className="input" type="date" value={f.date} onChange={set('date')} />
        </Field>

        <div className="field-row thirds">
          <Field label="Quantity harvested" tl="Ilan ang naani? Hal. 250 (kaban).">
            <input className="input" inputMode="decimal" value={f.qty} onChange={set('qty')} placeholder="e.g. 250" />
          </Field>
          <Field label="Unit" tl="Sukat: kaban, sako, kilo…">
            <select className="input" value={f.unit} onChange={set('unit')}>
              {HARVEST_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        {error && <div className="callout warn">{error}</div>}

        <div className="field-row">
          <Field label={`Price per ${f.unit.replace(/s$/, '')} (optional)`} tl="Magkano ang benta bawat isa?">
            <div className="input-prefix">
              <b>₱</b>
              <input className="input" inputMode="decimal" value={f.pricePerUnit} onChange={set('pricePerUnit')} placeholder="0" />
            </div>
          </Field>
          <Field label="Buyer (optional)" tl="Kanino ibinenta? Hal. rice mill.">
            <input className="input" value={f.buyer} onChange={set('buyer')} placeholder="e.g. rice mill" />
          </Field>
        </div>

        {!editing && (
          <label className="check-row">
            <input type="checkbox" checked={f.addIncome} onChange={set('addIncome')} disabled={!saleTotal} />
            <span>
              Also record the sale as income
              <TlGuide text="I-check kung naibenta na, para kusang maitala bilang kita." />
              <small>{saleTotal ? `${peso(saleTotal)} will be added under Expenses & Income` : 'Enter quantity and price to use this'}</small>
            </span>
          </label>
        )}

        {season?.status === 'active' && (
          <label className="check-row">
            <input type="checkbox" checked={f.finish} onChange={set('finish')} />
            <span>
              Last harvest — mark planting as Harvested
              <TlGuide text="I-check kung tapos na ang anihan sa lote. Lilipat ito sa Harvested at maisasama sa Compare." />
              <small>Leave unchecked if more batches are coming</small>
            </span>
          </label>
        )}

        <Field label="Notes (optional)" tl="Iba pang detalye. Hal. basa o tuyo ang palay.">
          <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Moisture, quality, who harvested, etc." />
        </Field>
      </form>
    </Sheet>
  )
}
