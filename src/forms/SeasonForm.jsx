import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CROPS, HARVEST_UNITS, getCrop } from '../data/categories.js'
import { addDays, ledgerFertilizerBags, seasonHarvest, seasonStats } from '../lib/calc.js'
import { fmtDate, num, peso, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Chip, Field, Segmented, Sheet } from '../components/ui.jsx'

// A planting (season): one crop cycle on one field, from planting to harvest.
export default function SeasonForm({ season, preset, onClose }) {
  const { state, save, remove, notify, ask } = useStore()
  const editing = !!season
  const [f, setF] = useState(() => ({
    name: season?.name || '',
    fieldId: season?.fieldId ?? preset?.fieldId ?? state.fields[0]?.id ?? '',
    crop: season?.crop || state.seasons[0]?.crop || 'rice',
    maturityDays: season?.maturityDays ?? '',
    status: season?.status || preset?.status || 'active',
    startDate: season?.startDate || '',
    harvestDate: season?.harvestDate || '',
    area: season?.area ?? state.fields.find((x) => x.id === (preset?.fieldId ?? state.fields[0]?.id))?.area ?? '',
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
  const logged = season ? seasonHarvest(season, state.harvests) : null
  const cropDays = getCrop(f.crop).days
  const expected = f.startDate ? f.harvestDate || addDays(f.startDate, Number(f.maturityDays) || cropDays) : ''

  // Picking a field fills in its size so yields per hectare are right.
  const pickField = (e) => {
    const field = state.fields.find((x) => x.id === e.target.value)
    setF((x) => ({ ...x, fieldId: e.target.value, area: field && (x.area === '' || !editing) ? field.area : x.area }))
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!f.name.trim()) return setError('Give this planting a season name, e.g. "Wet Season 2026".')
    const n = (v) => {
      const x = toNumber(v)
      return x === null ? '' : x
    }
    save('seasons', {
      ...(season || {}),
      name: f.name.trim(),
      fieldId: f.fieldId,
      crop: f.crop,
      maturityDays: n(f.maturityDays),
      status: f.status,
      startDate: f.startDate,
      harvestDate: f.harvestDate,
      area: n(f.area),
      fertilizerBags: n(f.fertilizerBags),
      fertilizerType: f.fertilizerType.trim(),
      seedKg: n(f.seedKg),
      harvestQty: logged?.fromLog ? season.harvestQty ?? '' : n(f.harvestQty),
      harvestUnit: f.harvestUnit,
      budget: n(f.budget),
      totalCost: n(f.totalCost),
      totalIncome: n(f.totalIncome),
      notes: f.notes.trim(),
    })
    notify(editing ? 'Season updated' : 'Season saved 🌾')
    onClose()
  }

  const del = async () => {
    const ok = await ask({
      title: 'Delete this season?',
      message: 'Budget records stay, but they will no longer be linked to this season.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    remove('seasons', season.id)
    notify('Season deleted')
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Edit planting' : 'New planting'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="btn danger" style={{ flex: 'none' }} onClick={del} aria-label="Delete planting">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn primary" onClick={submit}>
            Save planting
          </button>
        </>
      }
    >
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <Field label="Field (lote)" hint={state.fields.length ? undefined : 'Add your fields in Profile → Farm fields to compare them.'}>
          <select className="input" value={f.fieldId} onChange={pickField}>
            <option value="">No field</option>
            {state.fields.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · {num(x.area)} ha{x.location ? ` · ${x.location}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Season name">
          <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Wet Season 2026" />
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
          <Field label={f.status === 'active' ? 'Target harvest date' : 'Harvest date'}>
            <input className="input" type="date" value={f.harvestDate} onChange={set('harvestDate')} />
          </Field>
        </div>
        <Field label="Days to harvest" hint={expected ? `Expected harvest: ${fmtDate(expected)}${f.harvestDate ? '' : ' (estimated)'}` : `Usual for ${getCrop(f.crop).label.toLowerCase()}: about ${cropDays} days`}>
          <input className="input" inputMode="numeric" value={f.maturityDays} onChange={set('maturityDays')} placeholder={`${cropDays} (variety's maturity)`} />
        </Field>

        <Field label="Area planted (hectares)" hint="Lets the app compare plantings fairly even if the area differs.">
          <input className="input" inputMode="decimal" value={f.area} onChange={set('area')} placeholder="e.g. 1.5" />
        </Field>

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>🧪 Inputs used</h3>
        <div className="field-row">
          <Field label="Fertilizer (bags)" hint={ledgerBags ? `Expense records show ${num(ledgerBags)} bags` : '1 bag = 50 kg'}>
            <input className="input" inputMode="decimal" value={f.fertilizerBags} onChange={set('fertilizerBags')} placeholder="e.g. 10" />
          </Field>
          <Field label="Seeds (kg)">
            <input className="input" inputMode="decimal" value={f.seedKg} onChange={set('seedKg')} placeholder="e.g. 40" />
          </Field>
        </div>
        {ledgerBags > 0 && String(f.fertilizerBags) !== String(ledgerBags) && (
          <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => setF((x) => ({ ...x, fertilizerBags: ledgerBags }))}>
            Use {num(ledgerBags)} bags from expense records
          </button>
        )}
        <Field label="Fertilizer type (optional)">
          <input className="input" value={f.fertilizerType} onChange={set('fertilizerType')} placeholder="e.g. Complete 14-14-14 + Urea" />
        </Field>

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>🌾 Harvest</h3>
        {logged?.fromLog && (
          <div className="callout good">
            <span>
              <strong>
                {num(logged.qty)} {logged.unit}
              </strong>{' '}
              from {logged.count} harvest log{logged.count === 1 ? '' : 's'}. Add more batches with “Log harvest”.
            </span>
          </div>
        )}
        <div className="field-row thirds">
          <Field label="Harvest amount" hint={logged?.fromLog ? 'Counted from harvest logs' : 'For old seasons without harvest logs'}>
            <input
              className="input"
              inputMode="decimal"
              value={logged?.fromLog ? logged.qty : f.harvestQty}
              onChange={set('harvestQty')}
              disabled={logged?.fromLog}
              placeholder={f.status === 'active' ? 'Use “Log harvest”' : 'e.g. 150'}
            />
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
          <Field label="Total cost" hint={ledger ? `Leave blank to add up expense records (${peso(ledger.cost)})` : 'Leave blank to add up expense records'}>
            <div className="input-prefix">
              <b>₱</b>
              <input className="input" inputMode="decimal" value={f.totalCost} onChange={set('totalCost')} placeholder="auto" />
            </div>
          </Field>
          <Field label="Total sales" hint={ledger ? `Leave blank to add up expense records (${peso(ledger.income)})` : 'For old seasons, type the total'}>
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
