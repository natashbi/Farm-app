import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CROPS, HARVEST_UNITS } from '../data/categories.js'
import { ledgerFertilizerBags, seasonStats } from '../lib/calc.js'
import { num, peso, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Chip, Field, Segmented, Sheet } from '../components/ui.jsx'

export default function SeasonForm({ season, onClose }) {
  const { state, save, remove, notify } = useStore()
  const editing = !!season
  const [f, setF] = useState(() => ({
    name: season?.name || '',
    crop: season?.crop || state.seasons[0]?.crop || 'rice',
    status: season?.status || 'completed',
    startDate: season?.startDate || '',
    harvestDate: season?.harvestDate || '',
    area: season?.area ?? '',
    fertilizerBags: season?.fertilizerBags ?? '',
    fertilizerType: season?.fertilizerType || '',
    seedKg: season?.seedKg ?? '',
    harvestQty: season?.harvestQty ?? '',
    harvestUnit: season?.harvestUnit || 'cavans',
    budget: season?.budget ?? '',
    totalCost: season?.totalCost ?? '',
    totalIncome: season?.totalIncome ?? '',
    notes: season?.notes || '',
  }))
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target ? e.target.value : e }))

  const ledger = season ? seasonStats(season, state.transactions).ledger : null
  const ledgerBags = season ? ledgerFertilizerBags(state.transactions, season.id) : 0

  const submit = (e) => {
    e?.preventDefault()
    if (!f.name.trim()) return setError('Give this season a name, e.g. "Wet Season 2025".')
    const n = (v) => {
      const x = toNumber(v)
      return x === null ? '' : x
    }
    save('seasons', {
      ...(season || {}),
      name: f.name.trim(),
      crop: f.crop,
      status: f.status,
      startDate: f.startDate,
      harvestDate: f.harvestDate,
      area: n(f.area),
      fertilizerBags: n(f.fertilizerBags),
      fertilizerType: f.fertilizerType.trim(),
      seedKg: n(f.seedKg),
      harvestQty: n(f.harvestQty),
      harvestUnit: f.harvestUnit,
      budget: n(f.budget),
      totalCost: n(f.totalCost),
      totalIncome: n(f.totalIncome),
      notes: f.notes.trim(),
    })
    notify(editing ? 'Season updated' : 'Season saved 🌾')
    onClose()
  }

  const del = () => {
    if (!window.confirm('Delete this season? Budget records stay but are no longer linked to it.')) return
    remove('seasons', season.id)
    notify('Season deleted')
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Edit season' : 'New season'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="btn danger" style={{ flex: 'none' }} onClick={del} aria-label="Delete season">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn primary" onClick={submit}>
            Save season
          </button>
        </>
      }
    >
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <Field label="Season name">
          <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Wet Season 2025" autoFocus={!editing} />
        </Field>
        {error && <div className="callout warn">{error}</div>}

        <fieldset className="field">
          <legend>Crop</legend>
          <div className="chips wrap">
            {CROPS.map((c) => (
              <Chip key={c.id} emoji={c.emoji} active={f.crop === c.id} onClick={() => setF((x) => ({ ...x, crop: c.id }))}>
                {c.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Segmented
          label="Season status"
          value={f.status}
          onChange={set('status')}
          options={[
            { value: 'active', label: '🌱 Growing now' },
            { value: 'completed', label: '✅ Harvested' },
          ]}
        />

        <div className="field-row">
          <Field label="Planting date">
            <input className="input" type="date" value={f.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="Harvest date">
            <input className="input" type="date" value={f.harvestDate} onChange={set('harvestDate')} />
          </Field>
        </div>

        <Field label="Field size (hectares)" hint="Lets the app compare seasons fairly even if you planted a different area.">
          <input className="input" inputMode="decimal" value={f.area} onChange={set('area')} placeholder="e.g. 1.5" />
        </Field>

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>🧪 Inputs used</h3>
        <div className="field-row">
          <Field label="Fertilizer (bags)" hint={ledgerBags ? `Budget records show ${num(ledgerBags)} bags` : '1 bag = 50 kg'}>
            <input className="input" inputMode="decimal" value={f.fertilizerBags} onChange={set('fertilizerBags')} placeholder="e.g. 10" />
          </Field>
          <Field label="Seeds (kg)">
            <input className="input" inputMode="decimal" value={f.seedKg} onChange={set('seedKg')} placeholder="e.g. 40" />
          </Field>
        </div>
        {ledgerBags > 0 && String(f.fertilizerBags) !== String(ledgerBags) && (
          <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => setF((x) => ({ ...x, fertilizerBags: ledgerBags }))}>
            Use {num(ledgerBags)} bags from budget records
          </button>
        )}
        <Field label="Fertilizer type (optional)">
          <input className="input" value={f.fertilizerType} onChange={set('fertilizerType')} placeholder="e.g. Complete 14-14-14 + Urea" />
        </Field>

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>🌾 Harvest</h3>
        <div className="field-row thirds">
          <Field label="Harvest amount">
            <input className="input" inputMode="decimal" value={f.harvestQty} onChange={set('harvestQty')} placeholder={f.status === 'active' ? 'Fill in after harvest' : 'e.g. 150'} />
          </Field>
          <Field label="Unit">
            <select className="input" value={f.harvestUnit} onChange={set('harvestUnit')}>
              {HARVEST_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>₱ Money</h3>
        <Field label="Planned budget (optional)">
          <div className="input-prefix">
            <b>₱</b>
            <input className="input" inputMode="decimal" value={f.budget} onChange={set('budget')} placeholder="0" />
          </div>
        </Field>
        <div className="field-row">
          <Field label="Total cost" hint={ledger ? `Leave blank to use budget records (${peso(ledger.cost)})` : 'Leave blank to use budget records'}>
            <div className="input-prefix">
              <b>₱</b>
              <input className="input" inputMode="decimal" value={f.totalCost} onChange={set('totalCost')} placeholder="auto" />
            </div>
          </Field>
          <Field label="Total sales" hint={ledger ? `Leave blank to use budget records (${peso(ledger.income)})` : 'For old seasons, type the total'}>
            <div className="input-prefix">
              <b>₱</b>
              <input className="input" inputMode="decimal" value={f.totalIncome} onChange={set('totalIncome')} placeholder="auto" />
            </div>
          </Field>
        </div>

        <Field label="Notes — what happened this season?">
          <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Typhoon, pests, new variety, etc." />
        </Field>
      </form>
    </Sheet>
  )
}
