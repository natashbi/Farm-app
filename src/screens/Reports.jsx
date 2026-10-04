import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { activityLog, buildReport, reportCSV, scopeRecords, seasonNames } from '../lib/report.js'
import { fmtDate, num, peso, pesoCompact, todayISO } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { CategoryBars } from '../components/Charts.jsx'
import { Chip, Empty, SectionHead, Stat, useNav } from '../components/ui.jsx'
import { saveFile } from './Profile.jsx'

// Printing is blocked inside embedded previews, so only offer it on the real app page.
const canPrint = (() => {
  try {
    return window.self === window.top
  } catch {
    return false
  }
})()

export default function Reports() {
  const { state, notify } = useStore()
  const nav = useNav()
  const [season, setSeason] = useState('all')
  const [field, setField] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const names = useMemo(() => seasonNames(state.seasons), [state.seasons])

  const scope = useMemo(() => scopeRecords(state, { season, field }), [state, season, field])
  const report = useMemo(() => buildReport(state, scope), [state, scope])
  const activity = useMemo(() => activityLog(state, scope), [state, scope])
  const fieldName = field === 'all' ? 'All fields' : state.fields.find((f) => f.id === field)?.name
  const title = `${state.profile.farm || 'Farm'} report · ${season === 'all' ? 'All seasons' : season} · ${fieldName}`
  const unit = report.mainUnit
  const unitOne = unit?.replace(/s$/, '')

  const exportCSV = async () => {
    const result = await saveFile(`sakahan-report-${todayISO()}.csv`, reportCSV(state, report, scope, title), 'text/csv')
    if (result === 'saved') notify('Report downloaded — open it in Excel or Google Sheets')
    else if (result === 'failed') notify('Saving files is not allowed here.', 'bad')
  }

  const empty = !state.seasons.length && !state.transactions.length && !state.harvests.length

  return (
    <main className="screen report">
      <header className="topbar">
        <div className="grow">
          <h1>Reports</h1>
          <p>Buod ng gastos, kita at ani</p>
        </div>
      </header>

      {empty ? (
        <Empty title="Nothing to report yet">Record expenses, plantings and harvests first — the summary builds itself.</Empty>
      ) : (
        <>
          <div className="stack no-print" style={{ gap: 8 }}>
            <div className="chips" role="group" aria-label="Season">
              <Chip active={season === 'all'} onClick={() => setSeason('all')}>All seasons</Chip>
              {names.map((n) => (
                <Chip key={n} active={season === n} onClick={() => setSeason(n)}>
                  {n}
                </Chip>
              ))}
            </div>
            {state.fields.length > 1 && (
              <div className="chips" role="group" aria-label="Field">
                <Chip active={field === 'all'} onClick={() => setField('all')}>All fields</Chip>
                {state.fields.map((f) => (
                  <Chip key={f.id} active={field === f.id} onClick={() => setField(f.id)}>
                    {f.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <section className="hero report-hero" style={{ minHeight: 0, gap: 10 }}>
            <p style={{ maxWidth: 'none' }}>
              {season === 'all' ? 'All seasons' : season} · {fieldName}
              {state.profile.farm ? ` · ${state.profile.farm}` : ''}
            </p>
            <div>
              <p style={{ maxWidth: 'none' }}>{report.profit >= 0 ? 'Net profit' : 'Net loss'}</p>
              <div className="big-number">{peso(report.profit)}</div>
            </div>
            <div className="stats-row" style={{ textAlign: 'left', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                ['Expenses', peso(report.cost)],
                ['Income', peso(report.income)],
                season === 'all'
                  ? [field === 'all' ? 'Farm size' : 'Field size', `${num(field === 'all' ? state.fields.reduce((x, f) => x + (Number(f.area) || 0), 0) : state.fields.find((f) => f.id === field)?.area || 0)} ha`]
                  : ['Area planted', `${num(report.areaPlanted)} ha`],
              ].map(([label, v]) => (
                <div key={label} style={{ borderColor: 'var(--green-3)', paddingLeft: 10 }}>
                  <span style={{ color: 'var(--on-green-2)' }}>{label}</span>
                  <strong style={{ fontSize: 15 }}>{v}</strong>
                </div>
              ))}
            </div>
          </section>

          {unit && (
            <div className="stats-grid">
              <Stat label={`Harvest (${unit})`} value={num(report.harvestQty)} hint={`${report.byUnit[unit].plantings} planting(s) harvested`} />
              <Stat label={`Yield per hectare`} value={report.yieldPerHa ? `${num(report.yieldPerHa)}` : '—'} hint={`${unit} per ha`} />
              <Stat label={`Cost per ${unitOne}`} value={report.costPerUnit ? peso(Math.round(report.costPerUnit)) : '—'} hint="Expenses ÷ harvest" />
              <Stat
                label="Production cost"
                value={pesoCompact(report.split.production + report.split.typed)}
                hint={`+ tools & equipment ${pesoCompact(report.split.tools)}`}
              />
            </div>
          )}

          <div className="hstack no-print" style={{ gap: 8 }}>
            <button className="btn primary" style={{ flex: 1 }} onClick={exportCSV}>
              <Download size={18} /> Excel (CSV)
            </button>
            {canPrint && (
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => window.print()}>
                <Printer size={18} /> Print / PDF
              </button>
            )}
          </div>

          {report.fieldRows.length > 1 && (
            <section className="section">
              <SectionHead title="Field performance" sub="Compare your fields side by side" />
              <div className="card table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th className="num">Area</th>
                      <th className="num">Yield/ha</th>
                      <th className="num">Cost</th>
                      <th className="num">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.fieldRows.map((f) => (
                      <tr key={f.field.id}>
                        <td>
                          {f.field.name}
                          <div className="small muted">{f.plantings} planting{f.plantings === 1 ? '' : 's'}</div>
                        </td>
                        <td className="num">{num(f.field.area)} ha</td>
                        <td className="num">{f.yieldPerHa ? `${num(f.yieldPerHa)} ${f.mainUnit === 'cavans' ? 'cav' : f.mainUnit}` : '—'}</td>
                        <td className="num">{pesoCompact(f.cost)}</td>
                        <td className="num" style={{ color: f.profit >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                          {pesoCompact(f.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {report.plantings.length > 0 && (
            <section className="section">
              <SectionHead title="Plantings" sub="Planting and harvest dates, harvest and profit" />
              <div className="card table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Planting</th>
                      <th>Dates</th>
                      <th className="num">Harvest</th>
                      <th className="num">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.plantings]
                      .sort((a, b) => (b.season.startDate || '').localeCompare(a.season.startDate || ''))
                      .map(({ season: s, stats, harvest }) => (
                        <tr key={s.id} onClick={() => nav.open('season', { season: s })} style={{ cursor: 'pointer' }}>
                          <td>
                            {getCrop(s.crop).emoji} {report.fieldsById[s.fieldId]?.name || '—'}
                            <div className="small muted">{s.name}</div>
                          </td>
                          <td className="small">
                            {s.startDate ? fmtDate(s.startDate, { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                            <div className="muted">
                              → {s.harvestDate ? fmtDate(s.harvestDate, { month: 'short', day: 'numeric', year: '2-digit' }) : s.status === 'active' ? 'growing' : '—'}
                            </div>
                          </td>
                          <td className="num">{harvest.qty ? `${num(harvest.qty)} ${harvest.unit === 'cavans' ? 'cav' : harvest.unit}` : '—'}</td>
                          <td className="num" style={{ color: stats.profit >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                            {pesoCompact(stats.profit)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {report.categories.length > 0 && (
            <section className="section">
              <SectionHead title="Expenses by category" sub={`Total ${peso(report.cost)}`} />
              <div className="card stack">
                {report.categories.some((r) => r.category.id !== 'typed') && (
                  <CategoryBars rows={report.categories.filter((r) => r.category.id !== 'typed')} max={8} />
                )}
                {report.split.typed > 0 && (
                  <p className="small muted">
                    Plus {peso(report.split.typed)} from older seasons entered as one total (no category breakdown).
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="section">
            <SectionHead title="Activity log" sub={`${activity.length} recorded activities`} />
            {activity.length ? (
              <div className="timeline">
                {(showAll ? activity : activity.slice(0, 5)).map((e) => (
                  <button key={e.id} className="tl-item" onClick={() => nav.open(e.open.sheet, e.open.props)}>
                    <span className={`tl-dot ${e.kind}`} aria-hidden="true">{e.emoji}</span>
                    <span className="grow">
                      <span className="title">{e.title}</span>
                      <span className="meta">
                        {fmtDate(e.date, { month: 'short', day: 'numeric', year: 'numeric' })} · {e.meta}
                      </span>
                    </span>
                    {e.amount && <span className={`amount ${e.tone}`}>{e.amount}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="small muted">No activity in this period.</p>
            )}
            {!showAll && activity.length > 5 && (
              <button className="btn ghost no-print" onClick={() => setShowAll(true)}>
                Show all {activity.length}
              </button>
            )}
          </section>
        </>
      )}
    </main>
  )
}
