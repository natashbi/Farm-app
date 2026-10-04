import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CROPS, HARVEST_UNITS, getCrop } from '../data/categories.js'
import { addDays, ledgerFertilizerBags, seasonFertilizer, seasonHarvest, seasonNameFor, seasonStats } from '../lib/calc.js'
import { fmtDate, num, peso, toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Chip, Field, Segmented, Sheet } from '../components/ui.jsx'

// A planting (season): one crop cycle on one field, from planting to harvest.
// Only the few things every farmer knows are shown; the rest sits under "More details".
export default function SeasonForm({ season, preset, onClose }) {
  const { state, save, remove, notify, ask } = useStore()
  const editing = !!season
  const firstField = season?.fieldId ?? preset?.fieldId ?? state.fields[0]?.id ?? ''
  const [f, setF] = useState(() => ({
    name: season?.name || '',
    fieldId: firstField,
    crop: season?.crop || state.seasons[0]?.crop || 'rice',
    maturityDays: season?.maturityDays ?? '',
    status: season?.status || preset?.status || 'active',
    startDate: season?.startDate || '',
    harvestDate: season?.harvestDate || '',
    area: season?.area ?? state.fields.find((x) => x.id === firstField)?.area ?? '',
    fertilizerBags: season?.fertilizerBags ?? '',
    fertilizerType: season?.fertilizerType || '',
    fertilizerCost: season?.fertilizerCost ?? '',
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

  const done = f.status === 'completed'
  const ledger = season ? seasonStats(season, state.transactions).ledger : null
  const ledgerBags = season ? ledgerFertilizerBags(state.transactions, season.id) : 0
  const ledgerFert = season ? seasonFertilizer(season, state.transactions).ledgerCost : 0
  const logged = season ? seasonHarvest(season, state.harvests) : null
  const cropDays = getCrop(f.crop).days
  const expected = f.startDate ? f.harvestDate || addDays(f.startDate, Number(f.maturityDays) || cropDays) : ''
  const autoName = seasonNameFor(f.startDate)

  // Picking a field fills in its size so yields per hectare are right.
  const pickField = (e) => {
    const field = state.fields.find((x) => x.id === e.target.value)
    setF((x) => ({ ...x, fieldId: e.target.value, area: field ? field.area : x.area }))
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!f.startDate) return setError('Enter the planting date.')
    const n = (v) => {
      const x = toNumber(v)
      return x === null ? '' : x
    }
    save('seasons', {
      ...(season || {}),
      name: f.name.trim() || autoName,
      fieldId: f.fieldId,
      crop: f.crop,
      maturityDays: n(f.maturityDays),
      status: f.status,
      startDate: f.startDate,
      harvestDate: f.harvestDate,
      area: n(f.area),
      fertilizerBags: n(f.fertilizerBags),
      fertilizerType: f.fertilizerType.trim(),
      fertilizerCost: n(f.fertilizerCost),
      seedKg: n(f.seedKg),
      harvestQty: logged?.fromLog ? season.harvestQty ?? '' : n(f.harvestQty),
      harvestUnit: f.harvestUnit,
      budget: n(f.budget),
      totalCost: n(f.totalCost),
      totalIncome: n(f.totalIncome),
      notes: f.notes.trim(),
    })
    notify(editing ? 'Planting updated' : 'Planting saved 🌱')
    onClose()
  }

  const del = async () => {
    const ok = await ask({
      title: 'Delete this planting?',
      message: 'Expense and harvest records stay, but they will no longer be linked to it.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    remove('seasons', season.id)
    notify('Planting deleted')
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
        <Field label="1. Which field (lote)?" hint={state.fields.length ? undefined : 'Add your fields first in Profile → Farm fields.'}>
          <select className="input" value={f.fieldId} onChange={pickField}>
            <option value="">No field</option>
            {state.fields.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · {num(x.area)} ha
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="field">
          <legend>2. What crop?</legend>
          <div className="chips wrap">
            {CROPS.map((c) => (
              <Chip key={c.id} emoji={c.emoji} active={f.crop === c.id} onClick={() => setF((x) => ({ ...x, crop: c.id }))}>
                {c.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Field label="3. When was it planted?" hint={expected ? `Expected harvest: ${fmtDate(expected)}${f.harvestDate ? '' : ` (about ${Number(f.maturityDays) || cropDays} days)`}` : undefined}>
          <input className="input" type="date" value={f.startDate} onChange={set('startDate')} />
        </Field>
        {error && <div className="callout warn">{error}</div>}

        <fieldset className="field">
          <legend>4. Is it still growing?</legend>
          <Segmented
            label="Planting status"
            value={f.status}
            onChange={set('status')}
            options={[
              { value: 'active', label: '🌱 Still growing' },
              { value: 'completed', label: '✅ Already harvested' },
            ]}
          />
        </fieldset>

        {done && (
          <>
            <Field label="Harvest date">
              <input className="input" type="date" value={f.harvestDate} onChange={set('harvestDate')} />
            </Field>
            {logged?.fromLog ? (
              <div className="callout good">
                <span>
                  Harvest: <strong>{num(logged.qty)} {logged.unit}</strong> from {logged.count} harvest log{logged.count === 1 ? '' : 's'}.
                </span>
              </div>
            ) : (
              <div className="field-row thirds">
                <Field label="How much was harvested?">
                  <input className="input" inputMode="decimal" value={f.harvestQty} onChange={set('harvestQty')} placeholder="e.g. 150" />
                </Field>
                <Field label="Unit">
                  <select className="input" value={f.harvestUnit} onChange={set('harvestUnit')}>
                    {HARVEST_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </>
        )}

        <div className="divider" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>🧪 Fertilizer used</h3>
        <p className="small muted" style={{ marginTop: -10 }}>Used in Harvest → Compare to find the best amount and type.</p>
        <div className="field-row">
          <Field label="Bags" hint={ledgerBags ? `Expenses show ${num(ledgerBags)} bags` : '1 bag = 50 kg'}>
            <input className="input" inputMode="decimal" value={f.fertilizerBags} onChange={set('fertilizerBags')} placeholder="e.g. 10" />
          </Field>
          <Field label="Cost" hint={ledgerFert ? `Expenses show ${peso(ledgerFert)}` : 'Leave blank to use expenses'}>
            <div className="input-prefix">
              <b>₱</b>
              <input className="input" inputMode="decimal" value={f.fertilizerCost} onChange={set('fertilizerCost')} placeholder="auto" />
            </div>
          </Field>
        </div>
        {ledgerBags > 0 && String(f.fertilizerBags) !== String(ledgerBags) && (
          <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => setF((x) => ({ ...x, fertilizerBags: ledgerBags }))}>
            Use {num(ledgerBags)} bags from expenses
          </button>
        )}
        <Field label="Type">
          <input className="input" value={f.fertilizerType} onChange={set('fertilizerType')} placeholder="e.g. Complete 14-14-14 + Urea" list="fertilizer-types" />
          <datalist id="fertilizer-types">
            {[...new Set(state.seasons.map((s) => s.fertilizerType).filter(Boolean))].map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <details className="more">
          <summary>More details (optional)</summary>
          <div className="stack" style={{ gap: 16, paddingTop: 12 }}>
            <Field label="Season name" hint={`Leave blank to use “${autoName}”`}>
              <input className="input" value={f.name} onChange={set('name')} placeholder={autoName} />
            </Field>
            <div className="field-row">
              <Field label="Days to harvest" hint={`Usual: ${cropDays} days`}>
                <input className="input" inputMode="numeric" value={f.maturityDays} onChange={set('maturityDays')} placeholder={String(cropDays)} />
              </Field>
              {!done && (
                <Field label="Target harvest date">
                  <input className="input" type="date" value={f.harvestDate} onChange={set('harvestDate')} />
                </Field>
              )}
            </div>
            <div className="field-row">
              <Field label="Area planted (ha)" hint="Filled in from the field">
                <input className="input" inputMode="decimal" value={f.area} onChange={set('area')} placeholder="e.g. 1.5" />
              </Field>
              <Field label="Seeds (kg)">
                <input className="input" inputMode="decimal" value={f.seedKg} onChange={set('seedKg')} placeholder="e.g. 40" />
              </Field>
            </div>
            <Field label="Planned budget">
              <div className="input-prefix">
                <b>₱</b>
                <input className="input" inputMode="decimal" value={f.budget} onChange={set('budget')} placeholder="0" />
              </div>
            </Field>
            <div className="field-row">
              <Field label="Total cost" hint={ledger ? `Blank = expenses (${peso(ledger.cost)})` : 'For old seasons'}>
                <div className="input-prefix">
                  <b>₱</b>
                  <input className="input" inputMode="decimal" value={f.totalCost} onChange={set('totalCost')} placeholder="auto" />
                </div>
              </Field>
              <Field label="Total sales" hint={ledger ? `Blank = income (${peso(ledger.income)})` : 'For old seasons'}>
                <div className="input-prefix">
                  <b>₱</b>
                  <input className="input" inputMode="decimal" value={f.totalIncome} onChange={set('totalIncome')} placeholder="auto" />
                </div>
              </Field>
            </div>
            <Field label="Notes">
              <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Typhoon, pests, new variety, etc." />
            </Field>
          </div>
        </details>
      </form>
    </Sheet>
  )
}
