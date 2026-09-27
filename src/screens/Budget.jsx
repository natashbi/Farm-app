import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getCategory } from '../data/categories.js'
import { forSeason, sortByDateDesc, totals } from '../lib/calc.js'
import { peso } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Chip, Empty, Segmented, TxRow, useNav } from '../components/ui.jsx'
import { AnimatedNumber } from '../components/motion.jsx'

export default function Budget() {
  const { state } = useStore()
  const nav = useNav()
  const [seasonId, setSeasonId] = useState('all')
  const [group, setGroup] = useState('all')

  const seasons = [...state.seasons].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  const seasonsById = Object.fromEntries(seasons.map((s) => [s.id, s]))
  const scoped = forSeason(state.transactions, seasonId)
  const t = totals(scoped)
  const shown = sortByDateDesc(scoped.filter((tx) => group === 'all' || getCategory(tx.category).group === group))

  // Group rows by month with a subtotal.
  const months = []
  for (const tx of shown) {
    const key = (tx.date || '').slice(0, 7)
    let m = months[months.length - 1]
    if (!m || m.key !== key) {
      m = { key, items: [], out: 0, in: 0 }
      months.push(m)
    }
    m.items.push(tx)
    if (getCategory(tx.category).group === 'income') m.in += Number(tx.amount) || 0
    else m.out += Number(tx.amount) || 0
  }
  const monthLabel = (key) =>
    key ? new Date(`${key}-01T00:00:00`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : 'No date'

  return (
    <main className="screen">
      <header className="topbar">
        <div className="grow">
          <h1>Budget</h1>
          <p>Talaan ng gastos at kita</p>
        </div>
        <button className="icon-btn solid" onClick={() => nav.open('tx')} aria-label="Add record">
          <Plus size={22} />
        </button>
      </header>

      <div className="chips" role="group" aria-label="Season">
        <Chip active={seasonId === 'all'} onClick={() => setSeasonId('all')}>All time</Chip>
        {seasons.map((s) => (
          <Chip key={s.id} active={seasonId === s.id} onClick={() => setSeasonId(s.id)}>
            {s.name}
          </Chip>
        ))}
        {state.transactions.some((tx) => !tx.seasonId) && (
          <Chip active={seasonId === 'none'} onClick={() => setSeasonId('none')}>No season</Chip>
        )}
      </div>

      <section className="hero" style={{ minHeight: 0, gap: 14 }}>
        <div>
          <p style={{ maxWidth: 'none' }}>{t.profit >= 0 ? 'Profit' : 'Loss so far'} · Tubo</p>
          <div className="big-number">
            <AnimatedNumber value={t.profit} format={peso} />
          </div>
        </div>
        <div className="stats-row" style={{ textAlign: 'left' }}>
          {[
            ['Production', t.production],
            ['Tools', t.tools],
            ['Income', t.income],
          ].map(([label, v]) => (
            <div key={label} style={{ borderColor: 'var(--green-3)', paddingLeft: 10 }}>
              <span style={{ color: 'var(--on-green-2)' }}>{label}</span>
              <strong style={{ fontSize: 16 }}>
                <AnimatedNumber value={v} format={peso} />
              </strong>
            </div>
          ))}
        </div>
      </section>

      <Segmented
        label="Filter records"
        value={group}
        onChange={setGroup}
        options={[
          { value: 'all', label: 'All' },
          { value: 'production', label: 'Production' },
          { value: 'tools', label: 'Tools' },
          { value: 'income', label: 'Income' },
        ]}
      />

      {months.length ? (
        <div className="list">
          {months.map((m) => (
            <div key={m.key} className="list">
              <div className="month-head">
                <span>{monthLabel(m.key)}</span>
                <span>
                  {m.out > 0 && `−${peso(m.out)}`}
                  {m.out > 0 && m.in > 0 && ' · '}
                  {m.in > 0 && `+${peso(m.in)}`}
                </span>
              </div>
              {m.items.map((tx) => (
                <TxRow key={tx.id} tx={tx} season={seasonId === 'all' ? seasonsById[tx.seasonId] : null} onClick={() => nav.open('tx', { tx })} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Nothing recorded here yet"
          action={
            <button className="btn primary" onClick={() => nav.open('tx')}>
              <Plus size={18} /> Add record
            </button>
          }
        >
          Record seeds, fertilizer, labor, tools and harvest sales to see your real profit.
        </Empty>
      )}
    </main>
  )
}
