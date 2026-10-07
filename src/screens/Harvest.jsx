import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { growingPlantings, sortByDateDesc } from '../lib/calc.js'
import { fmtDate, num, peso } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Chip, Empty, Segmented, SectionHead, useNav } from '../components/ui.jsx'
import { CompareSeasons, PlantingCard } from './Records.jsx'

const ADD = {
  plantings: { label: 'Add planting', sheet: 'season' },
  log: { label: 'Log harvest', sheet: 'harvest' },
  compare: { label: 'Add past season', sheet: 'season', props: { preset: { status: 'completed' } } },
}

// Harvest records: plantings with their planting/harvest dates, the harvest log, and season comparison.
export default function Harvest({ params }) {
  const { state } = useStore()
  const nav = useNav()
  const [view, setView] = useState(params?.view || 'plantings')
  const [field, setField] = useState('all')
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const inField = (r) => field === 'all' || r.fieldId === field
  const add = ADD[view]

  return (
    <main className="screen">
      <header className="topbar">
        <div className="grow">
          <h1>Harvest</h1>
          <p>Taniman at ani</p>
        </div>
        <button className="icon-btn solid" onClick={() => nav.open(add.sheet, add.props)} aria-label={add.label}>
          <Plus size={22} />
        </button>
      </header>

      <Segmented
        label="Harvest view"
        value={view}
        onChange={setView}
        options={[
          { value: 'plantings', label: 'Plantings' },
          { value: 'log', label: 'Harvests' },
          { value: 'compare', label: 'Compare' },
        ]}
      />

      {view !== 'compare' && state.fields.length > 1 && (
        <div className="chips" role="group" aria-label="Field">
          <Chip active={field === 'all'} onClick={() => setField('all')}>All fields</Chip>
          {state.fields.map((f) => (
            <Chip key={f.id} active={field === f.id} onClick={() => setField(f.id)}>
              {f.name}
            </Chip>
          ))}
        </div>
      )}

      {view === 'plantings' && <Plantings seasons={state.seasons.filter(inField)} fieldsById={fieldsById} />}
      {view === 'log' && <HarvestLog harvests={state.harvests.filter(inField)} seasons={state.seasons.filter(inField)} fieldsById={fieldsById} />}
      {view === 'compare' && <CompareSeasons />}
    </main>
  )
}

function Plantings({ seasons, fieldsById }) {
  const nav = useNav()
  const growing = growingPlantings(seasons, (c) => getCrop(c).days)
  const done = seasons.filter((s) => s.status === 'completed').sort((a, b) => (b.harvestDate || b.startDate || '').localeCompare(a.harvestDate || a.startDate || ''))
  if (!seasons.length) {
    return (
      <Empty
        title="No plantings yet"
        action={
          <button className="btn primary" onClick={() => nav.open('season')}>
            <Plus size={18} /> Add planting
          </button>
        }
      >
        Add each field you plant with its crop and planting date. The app counts the days and tells you when harvest is near.
      </Empty>
    )
  }
  return (
    <>
      <section className="section">
        <SectionHead title="Growing now" sub={`${growing.length} planting${growing.length === 1 ? '' : 's'} · days after planting and expected harvest`} />
        {growing.length ? (
          <div className="stack" style={{ gap: 12 }}>
            {growing.map((s) => (
              <PlantingCard
                key={s.id}
                season={s}
                field={fieldsById[s.fieldId]}
                onClick={() => nav.open('season', { season: s })}
                onLogHarvest={() => nav.open('harvest', { preset: { seasonId: s.id } })}
              />
            ))}
          </div>
        ) : (
          <p className="small muted">Nothing growing right now.</p>
        )}
      </section>
      {done.length > 0 && (
        <section className="section">
          <SectionHead title="Harvested" sub="Past plantings. Tap to see or edit." />
          <div className="stack" style={{ gap: 12 }}>
            {done.map((s) => (
              <PlantingCard key={s.id} season={s} field={fieldsById[s.fieldId]} onClick={() => nav.open('season', { season: s })} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function HarvestLog({ harvests, seasons, fieldsById }) {
  const { state } = useStore()
  const nav = useNav()
  const seasonsById = Object.fromEntries(state.seasons.map((s) => [s.id, s]))
  // A planting marked harvested with its total typed in (no batches logged) is a harvest too.
  const logged = new Set(state.harvests.map((h) => h.seasonId))
  const typed = seasons
    .filter((s) => s.status === 'completed' && Number(s.harvestQty) > 0 && !logged.has(s.id))
    .map((s) => ({
      id: `planting-${s.id}`,
      planting: s,
      seasonId: s.id,
      fieldId: s.fieldId,
      crop: s.crop,
      date: s.harvestDate || s.startDate || '',
      qty: Number(s.harvestQty),
      unit: s.harvestUnit || 'cavans',
    }))
  const list = sortByDateDesc([...harvests, ...typed])

  // Totals per crop and unit, e.g. "Rice · 985 cavans".
  const totals = {}
  for (const h of list) {
    const key = `${h.crop}|${h.unit}`
    totals[key] ||= { crop: h.crop, unit: h.unit, qty: 0, batches: 0 }
    totals[key].qty += Number(h.qty) || 0
    totals[key].batches += 1
  }

  if (!list.length) {
    return (
      <Empty
        title="No harvests logged yet"
        action={
          <button className="btn primary" onClick={() => nav.open('harvest')}>
            <Plus size={18} /> Log harvest
          </button>
        }
      >
        Log each harvest batch with its date, crop and quantity. Large fields can have several batches.
      </Empty>
    )
  }

  const months = []
  for (const h of list) {
    const key = (h.date || '').slice(0, 7)
    let m = months.at(-1)
    if (!m || m.key !== key) months.push((m = { key, items: [] }))
    m.items.push(h)
  }

  return (
    <>
      <div className="stats-grid">
        {Object.values(totals).map((t) => (
          <div className="stat" key={`${t.crop}|${t.unit}`}>
            <span className="label">
              {getCrop(t.crop).emoji} {getCrop(t.crop).label}
            </span>
            <span className="value">
              {num(t.qty)} <span style={{ fontSize: 14, fontWeight: 500 }}>{t.unit}</span>
            </span>
            <span className="hint">
              {t.batches} harvest batch{t.batches === 1 ? '' : 'es'}
            </span>
          </div>
        ))}
      </div>
      <div className="list">
        {months.map((m) => (
          <div key={m.key} className="list">
            <div className="month-head">
              <span>{m.key ? fmtDate(`${m.key}-01`, { month: 'long', year: 'numeric' }) : 'No date'}</span>
            </div>
            {m.items.map((h) => {
              const s = seasonsById[h.seasonId]
              const f = fieldsById[h.fieldId]
              return (
                <button key={h.id} className="row" onClick={() => (h.planting ? nav.open('season', { season: h.planting }) : nav.open('harvest', { harvest: h }))}>
                  <span className="bubble" aria-hidden="true">{getCrop(h.crop).emoji}</span>
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>
                      {f?.name || getCrop(h.crop).label}
                    </span>
                    <span className="meta" style={{ display: 'block' }}>
                      {fmtDate(h.date, { month: 'short', day: 'numeric' })}
                      {s ? ` · ${s.name}` : ''}
                      {h.planting ? ' · from planting' : ''}
                      {h.pricePerUnit ? ` · ${peso(h.pricePerUnit)}/${h.unit.replace(/s$/, '')}` : ''}
                      {h.buyer ? ` · ${h.buyer}` : ''}
                    </span>
                  </span>
                  <span className="amount in">
                    {num(h.qty)} {h.unit}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
