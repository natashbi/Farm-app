import { CATEGORIES, getCrop } from '../data/categories.js'
import { addDays, byCategory, growingPlantings, totals } from '../lib/calc.js'
import { fmtDate, greeting, num, peso } from '../lib/format.js'
import { activityLog, scopeRecords } from '../lib/report.js'
import { useStore } from '../store.jsx'
import { BugLeafScene, FarmerAvatar, HeroBudgetArt, PaddyScene } from '../components/Art.jsx'
import { CategoryBars } from '../components/Charts.jsx'
import { Chip, Empty, SectionHead, Stat, useNav } from '../components/ui.jsx'
import { PlantingCard } from './Records.jsx'

const QUICK = ['seeds', 'fertilizer', 'labor', 'pesticide', 'tool_buy', 'tool_rent', 'harvest_sale']

export default function Home() {
  const { state } = useStore()
  const nav = useNav()
  const name = state.profile.name?.split(' ')[0] || 'Farmer'
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const totalArea = state.fields.reduce((s, f) => s + (Number(f.area) || 0), 0)
  const growing = growingPlantings(state.seasons, (c) => getCrop(c).days)

  // Money for what is growing now: those plantings' records plus farm-wide
  // costs (tools, repairs) since the first of them was planted.
  const growingIds = new Set(growing.map((s) => s.id))
  const since = growing.map((s) => s.startDate).filter(Boolean).sort()[0]
  const scopeTx = growing.length
    ? state.transactions.filter((tx) => growingIds.has(tx.seasonId) || (!tx.seasonId && (!since || tx.date >= addDays(since, -30))))
    : state.transactions
  const t = totals(scopeTx)
  const spend = byCategory(scopeTx).filter((r) => r.category.group !== 'income')
  const activity = activityLog(state, scopeRecords(state)).slice(0, 5)
  const openProblems = state.anomalies.filter((a) => a.status !== 'resolved').length

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

      <section className="hero">
        <h2>Farm expense & harvest records</h2>
        <p>Gastos, ani at kita ng bawat lote — all in one place.</p>
        <div className="actions">
          <button className="pill-btn" onClick={() => nav.open('tx')}>Add expense</button>
          <button className="pill-btn fill" onClick={() => nav.open('harvest')}>Log harvest</button>
        </div>
        <HeroBudgetArt className="hero-art" />
      </section>

      <section className="section">
        <SectionHead title="Quick add" sub="Tap to record" />
        <div className="chips">
          <Chip emoji="🌾" onClick={() => nav.open('harvest')}>Harvest</Chip>
          <Chip emoji="🌱" onClick={() => nav.open('season')}>New planting</Chip>
          {QUICK.map((id) => {
            const c = CATEGORIES.find((x) => x.id === id)
            return (
              <Chip key={id} emoji={c.emoji} onClick={() => nav.open('tx', { preset: { category: id } })}>
                {c.label}
              </Chip>
            )
          })}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Growing now" sub="Days after planting and expected harvest" action="View all" onAction={() => nav.setTab('harvest')} />
        {growing.length ? (
          <div className="stack" style={{ gap: 12 }}>
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

      <section className="section">
        <SectionHead
          title={growing.length ? 'This season’s money' : 'All-time money'}
          sub={growing.length ? `${growing.length} planting${growing.length === 1 ? '' : 's'} growing now` : undefined}
        />
        <div className="stats-grid">
          <Stat label="Production cost" amount={t.production} format={peso} hint="Seeds, abono, labor…" />
          <Stat label="Tools & equipment" amount={t.tools} format={peso} hint="Bought, rented, repairs" />
          <Stat label="Income" amount={t.income} format={peso} hint="Harvest sales" />
          <Stat
            label={t.profit >= 0 ? 'Profit' : 'Profit so far'}
            amount={t.profit}
            format={peso}
            tone={t.profit >= 0 ? 'pos' : 'neg'}
            hint={t.profit < 0 && growing.length ? 'Normal before harvest' : 'Income − all costs'}
          />
        </div>
      </section>

      {spend.length > 0 && (
        <section className="section">
          <SectionHead title="Where your money goes" />
          <div className="card">
            <CategoryBars rows={spend} max={5} />
          </div>
        </section>
      )}

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

      <section className="section">
        <SectionHead title="Tools" />
        <div className="tiles">
          <button className="tile" onClick={() => nav.setTab('harvest', { view: 'compare' })}>
            <span className="art"><PaddyScene /></span>
            <strong>Compare seasons: the right fertilizer amount</strong>
            <span>{state.seasons.filter((s) => s.status === 'completed').length} harvested plantings</span>
          </button>
          <button className="tile" onClick={() => nav.setTab('doctor')}>
            <span className="art"><BugLeafScene /></span>
            <strong>Crop Doctor: find what's wrong</strong>
            <span>{openProblems ? `${openProblems} open problem${openProblems > 1 ? 's' : ''}` : 'Signs → fertilizer, tools & steps'}</span>
          </button>
        </div>
      </section>
    </main>
  )
}
