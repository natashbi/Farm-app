import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { fertilizerAdvice, roundHalf } from '../lib/analysis.js'
import { growingPlantings } from '../lib/calc.js'
import { fmtDate, greeting, num, peso } from '../lib/format.js'
import { activityLog, moneySummary, scopeRecords } from '../lib/report.js'
import { useStore } from '../store.jsx'
import { FarmerAvatar, HeroBudgetArt } from '../components/Art.jsx'
import { Empty, SectionHead, Segmented, Stat, TlGuide, useNav } from '../components/ui.jsx'
import { PlantingCard } from './Records.jsx'

function adviceCrops(seasons) {
  const growing = [...new Set(seasons.filter((s) => s.status !== 'completed').map((s) => s.crop))]
  if (growing.length) return growing
  const count = {}
  for (const s of seasons) count[s.crop] = (count[s.crop] || 0) + 1
  return Object.keys(count).sort((a, b) => count[b] - count[a])
}

function FertilizerAdvice({ state, growing }) {
  const nav = useNav()
  const advice = useMemo(
    () =>
      adviceCrops(state.seasons)
        .map((crop) => ({ crop, analysis: fertilizerAdvice(state, crop) }))
        .filter((x) => x.analysis)
        .slice(0, 2),
    [state],
  )
  if (!advice.length) return null
  return (
    <section className="section">
      <SectionHead title="Fertilizer advice" sub="Payo sa abono mula sa iyong records" />
      <div className="stack">
        {advice.map(({ crop, analysis }) => {
          const rec = analysis.recommendation
          const area = growing.filter((s) => s.crop === crop).reduce((sum, s) => sum + (Number(s.area) || 0), 0)
          return (
            <button key={crop} className="card advice-card" onClick={() => nav.setTab('harvest', { view: 'compare', crop })}>
              <span className="thumb" aria-hidden="true">🧪</span>
              <span className="grow">
                <span className="kicker">
                  {getCrop(crop).emoji} {getCrop(crop).label}
                </span>
                <strong className="title">{rec.text}</strong>
                {analysis.perHa && area > 0 && (
                  <span className="small">
                    For the {num(area)} ha growing now: about {num(roundHalf(rec.fert * area))} bags{rec.brand ? ` of ${rec.brand}` : ''}.
                  </span>
                )}
                {rec.reasons[0] && <span className="small muted">{rec.reasons[0].text}</span>}
                <TlGuide text={rec.tl} />
                <span className="go">
                  See why <ChevronRight size={14} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function Home() {
  const { state, setProfile } = useStore()
  const nav = useNav()
  const name = state.profile.name?.split(' ')[0] || 'Farmer'
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const totalArea = state.fields.reduce((s, f) => s + (Number(f.area) || 0), 0)
  const growing = growingPlantings(state.seasons, (c) => getCrop(c).days)
  const money = moneySummary(state, growing.length ? state.profile.homeMoney || 'all' : 'all')
  const activity = activityLog(state, scopeRecords(state)).slice(0, 5)

  return (
    <main className="screen">
      <header className="topbar">
        <div className="grow">
          <h1>{greeting()}, {name}!</h1>
          <p>
            {state.profile.farm || "Let's record today's farm work"}
            {state.fields.length ? ` · ${state.fields.length} field${state.fields.length === 1 ? '' : 's'}, ${num(totalArea)} ha` : ''}
          </p>
        </div>
        <button className="avatar-btn" onClick={() => nav.setTab('profile')} aria-label="My profile">
          <FarmerAvatar size={44} />
        </button>
      </header>

      <div className="cols">
        <div className="col-main">
          <section className="hero">
            <h2>Farm expense & harvest records</h2>
            <p>Gastos, ani at kita ng bawat lote, all in one place.</p>
            <div className="actions">
              <button className="pill-btn" onClick={() => nav.open('tx')}>Add expense</button>
              <button className="pill-btn fill" onClick={() => nav.open('harvest')}>Log harvest</button>
            </div>
            <HeroBudgetArt className="hero-art" />
          </section>

          <section className="section">
            <SectionHead title="Growing now" sub="Days after planting and expected harvest" action="View all" onAction={() => nav.setTab('harvest')} />
            {growing.length ? (
              <div className="stack plantings" style={{ gap: 12 }}>
                {growing.slice(0, 3).map((s) => (
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
              <button className="btn ghost" onClick={() => nav.open('season')}>
                🌱 Add what you planted
              </button>
            )}
          </section>

          <FertilizerAdvice state={state} growing={growing} />
        </div>

        <div className="col-side">
          <section className="section">
            <SectionHead
              title={money.view === 'growing' ? 'Money for growing crops' : 'Overall money'}
              sub={
                money.view === 'growing'
                  ? `Gastos at kita ng ${money.growing} tanim na tumutubo ngayon`
                  : 'Lahat ng gastos at kita, lahat ng season at lote'
              }
            />
            {growing.length > 0 && (
              <Segmented
                label="Money to show"
                value={money.view}
                onChange={(v) => setProfile({ homeMoney: v })}
                options={[
                  { value: 'all', label: 'Overall' },
                  { value: 'growing', label: 'Growing now' },
                ]}
              />
            )}
            <div className="stats-grid">
              <Stat label="Production cost" amount={money.production} format={peso} hint="Seeds, abono, labor…" />
              <Stat label="Tools & equipment" amount={money.tools} format={peso} hint="Bought, rented, repairs" />
              <Stat label="Income" amount={money.income} format={peso} hint="Harvest sales" />
              <Stat
                label={money.profit >= 0 ? 'Profit' : 'Profit so far'}
                amount={money.profit}
                format={peso}
                tone={money.profit >= 0 ? 'pos' : 'neg'}
                hint={money.profit < 0 && growing.length ? 'Normal before harvest' : 'Income − all costs'}
              />
            </div>
          </section>

          <section className="section">
            <SectionHead title="Recent activity" action="Reports" onAction={() => nav.setTab('reports')} />
            {activity.length ? (
              <div className="timeline">
                {activity.map((e) => (
                  <button key={e.id} className="tl-item" onClick={() => nav.open(e.open.sheet, e.open.props)}>
                    <span className={`tl-dot ${e.kind}`} aria-hidden="true">{e.emoji}</span>
                    <span className="grow">
                      <span className="title">{e.title}</span>
                      <span className="meta">
                        {fmtDate(e.date, { month: 'short', day: 'numeric' })} · {e.meta}
                      </span>
                    </span>
                    {e.amount && <span className={`amount ${e.tone}`}>{e.amount}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="No records yet">Tap “Add expense” or “Log harvest” to start.</Empty>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
