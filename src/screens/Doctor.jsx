import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { CONDITIONS, PROBLEM_TYPES, getCondition, getSymptom } from '../data/cropDoctor.js'
import { getCrop } from '../data/categories.js'
import { sortByDateDesc } from '../lib/calc.js'
import { fmtDate } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { HeroDoctorArt } from '../components/Art.jsx'
import { Chip, Empty, SectionHead, Stat, useNav } from '../components/ui.jsx'

export default function Doctor() {
  const { state } = useStore()
  const nav = useNav()
  const [filter, setFilter] = useState('open')
  const [type, setType] = useState('all')

  const all = sortByDateDesc(state.anomalies)
  const open = all.filter((a) => a.status !== 'resolved')
  const list = filter === 'open' ? open : filter === 'resolved' ? all.filter((a) => a.status === 'resolved') : all
  const library = CONDITIONS.filter((c) => type === 'all' || c.type === type)

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn plain" onClick={() => nav.setTab('home')} aria-label="Back to Home">
          <ArrowLeft size={22} />
        </button>
        <div className="grow">
          <h1>Crop Doctor</h1>
          <p>Doktor ng pananim</p>
        </div>
      </header>

      <section className="hero">
        <h2>Something wrong with your crops?</h2>
        <p>Tell us what you see — get the fertilizer, tools and steps to fix it.</p>
        <div className="actions">
          <button className="btn primary small" onClick={() => nav.open('diagnose')}>Check my crop</button>
        </div>
        <HeroDoctorArt className="hero-art" />
      </section>

      <div className="stats-grid">
        <Stat label="Open problems" amount={open.length} tone={open.length ? 'neg' : ''} hint="Still to fix" />
        <Stat label="Solved" amount={all.length - open.length} tone="pos" hint="Nice work!" />
      </div>

      <section className="section">
        <SectionHead title="Problem log" sub="What you saw in the field" />
        <div className="chips">
          <Chip active={filter === 'open'} onClick={() => setFilter('open')}>Open</Chip>
          <Chip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>Solved</Chip>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        </div>
        {list.length ? (
          <div className="list">
            {list.map((a) => {
              const top = getCondition(a.conditionIds?.[0])
              const crop = getCrop(a.crop)
              return (
                <button key={a.id} className="row" onClick={() => nav.open('anomaly', { anomaly: a })}>
                  {a.photo ? (
                    <img src={a.photo} alt="" className="bubble" style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="bubble" aria-hidden="true">{crop.emoji}</span>
                  )}
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>
                      {top ? top.name : getSymptom(a.symptoms?.[0])?.label || 'Crop problem'}
                    </span>
                    <span className="meta" style={{ display: 'block' }}>
                      {crop.label} · {fmtDate(a.date, { month: 'short', day: 'numeric', year: 'numeric' })} · {a.symptoms?.length || 0} sign
                      {a.symptoms?.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className={`badge ${a.status === 'resolved' ? 'good' : 'warn'}`}>{a.status === 'resolved' ? 'Solved' : 'Open'}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <Empty title={filter === 'open' ? 'No open problems 🎉' : 'Nothing here yet'}>
            When you notice something wrong, tap “Check my crop” and save it here.
          </Empty>
        )}
      </section>

      <section className="section">
        <SectionHead title="Common problems" sub={`${CONDITIONS.length} guides you can read anytime`} />
        <div className="chips">
          <Chip active={type === 'all'} onClick={() => setType('all')}>All</Chip>
          {Object.entries(PROBLEM_TYPES).map(([id, t]) => (
            <Chip key={id} emoji={t.emoji} active={type === id} onClick={() => setType(id)}>
              {t.label}
            </Chip>
          ))}
        </div>
        <div className="list">
          {library.map((c) => (
            <button key={c.id} className="row" onClick={() => nav.open('condition', { condition: c })}>
              <span className="bubble" aria-hidden="true">{PROBLEM_TYPES[c.type].emoji}</span>
              <span className="grow">
                <span className="title" style={{ display: 'block' }}>{c.name}</span>
                <span className="meta" style={{ display: 'block' }}>
                  {c.tl} · {c.crops === 'all' ? 'All crops' : c.crops.map((x) => getCrop(x).label).join(', ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
