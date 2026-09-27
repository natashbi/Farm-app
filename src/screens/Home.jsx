import { CATEGORIES, getCrop } from '../data/categories.js'
import { activeSeason, byCategory, forSeason, seasonStats, sortByDateDesc, totals } from '../lib/calc.js'
import { greeting, peso, pesoCompact } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { BugLeafScene, FarmerAvatar, HeroBudgetArt, PaddyScene } from '../components/Art.jsx'
import { CategoryBars } from '../components/Charts.jsx'
import { Chip, Empty, Progress, SectionHead, Stat, TxRow, useNav } from '../components/ui.jsx'

const QUICK = ['seeds', 'fertilizer', 'labor', 'pesticide', 'tool_buy', 'tool_rent', 'harvest_sale']

export default function Home() {
  const { state } = useStore()
  const nav = useNav()
  const name = state.profile.name?.split(' ')[0] || 'Farmer'
  const season = activeSeason(state.seasons)
  const scopeTx = season ? forSeason(state.transactions, season.id) : state.transactions
  const t = totals(scopeTx)
  const stats = season ? seasonStats(season, state.transactions) : null
  const recent = sortByDateDesc(state.transactions).slice(0, 4)
  const seasonsById = Object.fromEntries(state.seasons.map((s) => [s.id, s]))
  const openProblems = state.anomalies.filter((a) => a.status !== 'resolved').length

  return (
    <main className="screen">
      <header className="topbar">
        <div className="grow">
          <h1>{greeting()}, {name}!</h1>
          <p>Let's record today's farm work</p>
        </div>
        <button className="avatar-btn" onClick={() => nav.setTab('profile')} aria-label="My profile">
          <FarmerAvatar size={44} />
        </button>
      </header>

      <section className="hero">
        <h2>Track your farm expenses & profit</h2>
        <p>Gastos, gamit at kita — all in one place.</p>
        <div className="actions">
          <button className="pill-btn" onClick={() => nav.open('tx')}>Add record</button>
        </div>
        <HeroBudgetArt className="hero-art" />
      </section>

      <section className="section">
        <SectionHead title="Quick add" sub="Tap to record" />
        <div className="chips">
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

      {season && (
        <section className="section">
          <SectionHead title="This season" action="View" onAction={() => nav.open('season', { season })} />
          <button className="card play-card" onClick={() => nav.open('season', { season })} style={{ padding: 14 }}>
            <span className="thumb" aria-hidden="true">{getCrop(season.crop).emoji}</span>
            <span className="grow">
              <span className="title">{season.name}</span>
              <span className="small muted">
                {getCrop(season.crop).label}
                {season.area ? ` · ${season.area} ha` : ''} · {season.status === 'active' ? 'Growing now' : 'Harvested'}
              </span>
              {Number(season.budget) > 0 ? (
                <span className="progress-line">
                  <Progress value={stats.budgetUsed} />
                  <span>
                    {pesoCompact(stats.cost)} / {pesoCompact(season.budget)}
                  </span>
                </span>
              ) : (
                <span className="small muted">Spent {peso(stats.cost)}</span>
              )}
            </span>
          </button>
        </section>
      )}

      <section className="section">
        <SectionHead title={season ? 'Season money' : 'All-time money'} sub={season ? season.name : undefined} />
        <div className="stats-grid">
          <Stat label="Production cost" value={peso(t.production)} hint="Seeds, abono, labor…" />
          <Stat label="Tools & equipment" value={peso(t.tools)} hint="Bought, rented, repairs" />
          <Stat label="Income" value={peso(t.income)} hint="Harvest sales" />
          <Stat
            label={t.profit >= 0 ? 'Profit' : 'Profit so far'}
            value={peso(t.profit)}
            tone={t.profit >= 0 ? 'pos' : 'neg'}
            hint={t.profit < 0 && season?.status === 'active' ? 'Normal before harvest' : 'Income − all costs'}
          />
        </div>
      </section>

      {byCategory(scopeTx).filter((r) => r.category.group !== 'income').length > 0 && (
        <section className="section">
          <SectionHead title="Where your money goes" />
          <div className="card">
            <CategoryBars rows={byCategory(scopeTx).filter((r) => r.category.group !== 'income')} max={5} />
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead title="Recent records" action="View all" onAction={() => nav.setTab('budget')} />
        {recent.length ? (
          <div className="list">
            {recent.map((tx) => (
              <TxRow key={tx.id} tx={tx} season={seasonsById[tx.seasonId]} onClick={() => nav.open('tx', { tx })} />
            ))}
          </div>
        ) : (
          <Empty title="No records yet">Tap “Add record” to log your first expense.</Empty>
        )}
      </section>

      <section className="section">
        <SectionHead title="Discover" />
        <div className="tiles">
          <button className="tile" onClick={() => nav.setTab('doctor')}>
            <span className="art"><BugLeafScene /></span>
            <strong>Crop Doctor: find what's wrong</strong>
            <span>{openProblems ? `${openProblems} open problem${openProblems > 1 ? 's' : ''}` : 'Signs → fertilizer, tools & steps'}</span>
          </button>
          <button className="tile" onClick={() => nav.setTab('records')}>
            <span className="art"><PaddyScene /></span>
            <strong>Past harvests: the right fertilizer amount</strong>
            <span>{state.seasons.length} season{state.seasons.length === 1 ? '' : 's'} recorded</span>
          </button>
        </div>
      </section>
    </main>
  )
}
