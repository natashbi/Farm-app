import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { analyzeSeasons, round1, roundHalf } from '../lib/analysis.js'
import { plantingProgress, seasonBags, seasonHarvest, seasonLabel, seasonStats } from '../lib/calc.js'
import { fmtDate, num, peso, pesoCompact, todayISO } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { HeroRecordsArt } from '../components/Art.jsx'
import { Chip, Empty, Progress, SectionHead, useNav } from '../components/ui.jsx'
import { AnimatedNumber } from '../components/motion.jsx'

const TONE_ICON = { warn: AlertTriangle, tip: Lightbulb, good: CheckCircle2, info: Info }

// Why a finished planting is left out of the comparison, in words the farmer can act on.
const MISSING = {
  'no-harvest': () => 'Walang ani na nakalagay',
  'no-bags': () => 'Walang “Ilang sako ng abono?”',
  unit: (x) => `Ibang sukat ng ani (${x.unit})`,
}

// Show only the three lessons that matter most, so the screen stays easy to read.
const KEY_KINDS = ['more-not-better', 'type', 'cost']
function keyInsights(insights) {
  const key = KEY_KINDS.map((k) => insights.find((i) => i.kind === k)).filter(Boolean)
  return key.length ? key : insights.slice(0, 3)
}

// Compare finished plantings of one crop: which fertilizer amount and type gave the best harvest.
export function CompareSeasons() {
  const { state } = useStore()
  const nav = useNav()
  const crops = useMemo(() => {
    const count = {}
    for (const s of state.seasons) count[s.crop] = (count[s.crop] || 0) + 1
    return Object.keys(count).sort((a, b) => count[b] - count[a])
  }, [state.seasons])
  const [picked, setPicked] = useState(null)
  const crop = picked && crops.includes(picked) ? picked : crops[0]

  const fieldsById = useMemo(() => Object.fromEntries(state.fields.map((f) => [f.id, f])), [state.fields])
  const label = (s) => seasonLabel(s, fieldsById)
  const analysis = useMemo(
    () => analyzeSeasons(state.seasons, state.transactions, crop, state.harvests, (s) => seasonLabel(s, fieldsById)),
    [state.seasons, state.transactions, crop, state.harvests, fieldsById],
  )
  const seasons = state.seasons.filter((s) => s.crop === crop)
  const activeArea = seasons.filter((s) => s.status === 'active').reduce((sum, s) => sum + (Number(s.area) || 0), 0)
  const growingCount = seasons.filter((s) => s.status === 'active').length
  const { best, perHa, unit, points, byType } = analysis
  const ha = perHa ? '/ha' : ''
  const short = unit === 'cavans' ? 'cav' : unit
  const addPast = () => nav.open('season', { preset: { status: 'completed' } })

  if (!state.seasons.length) {
    return (
      <>
        <section className="hero">
          <h2>Learn from your past harvests</h2>
          <p>Record each season's fertilizer and harvest. The app shows what amount gave the best result.</p>
          <div className="actions">
            <button className="btn primary small" onClick={addPast}>Add a past season</button>
          </div>
          <HeroRecordsArt className="hero-art" />
        </section>
        <Empty title="No plantings yet">
          Example: 10 bags of fertilizer → 150 cavans, but 20 bags → 100 cavans. Recording this helps you use the right amount next time.
        </Empty>
      </>
    )
  }

  const newestFirst = [...points].reverse()
  const topYield = Math.max(...points.map((p) => p.yield), 1)

  return (
    <>
      {crops.length > 1 && (
        <div className="chips" role="group" aria-label="Crop">
          {crops.map((c) => (
            <Chip key={c} emoji={getCrop(c).emoji} active={c === crop} onClick={() => setPicked(c)}>
              {getCrop(c).label}
            </Chip>
          ))}
        </div>
      )}

      <section className="hero" style={{ gap: 8 }}>
        {best ? (
          <>
            <p style={{ maxWidth: '64%' }}>Best fertilizer amount for {getCrop(crop).label}</p>
            <div className="big-number" style={{ position: 'relative', zIndex: 1 }}>
              ≈ <AnimatedNumber value={round1(best.fert)} format={(n) => num(n)} /> <span style={{ fontSize: 20, fontWeight: 500 }}>bags{ha}</span>
            </div>
            <p>
              Gave the biggest harvest: <strong style={{ color: 'var(--on-green)' }}>{num(best.yield)} {unit}{ha}</strong> in {label(best.season)}
              {best.type ? ` (${best.type})` : ''}.
            </p>
            {perHa && activeArea > 0 && (
              <p style={{ color: 'var(--on-green)' }}>
                For the {num(activeArea)} ha growing now: about <strong>{num(roundHalf(best.fert * activeArea))} bags</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <h2>Compare your seasons</h2>
            <p>Add finished seasons with fertilizer bags and harvest to see what works best.</p>
            <div className="actions">
              <button className="btn primary small" onClick={addPast}>Add past season</button>
            </div>
          </>
        )}
        <HeroRecordsArt className="hero-art" style={{ width: '34%' }} />
      </section>

      {points.length >= 2 && (
        <section className="section">
          <SectionHead title="Fertilizer vs harvest" sub={`Each season: fertilizer used and harvest${perHa ? ' per hectare' : ''}. Longest bar = biggest harvest.`} />
          <div className="card stack" style={{ gap: 14 }}>
            {newestFirst.map((p) => (
              <div key={p.season.id} className={`fert-row ${p === best ? 'best' : ''}`}>
                <div className="hstack between">
                  <strong className="small">
                    {label(p.season)}
                    {p === best ? ' ⭐' : ''}
                  </strong>
                  <span className="small">
                    {num(p.yield)} {short}
                    {ha}
                  </span>
                </div>
                <div className="fert-bar">
                  <span style={{ width: `${(p.yield / topYield) * 100}%` }} />
                </div>
                <div className="small muted">
                  🧪 {num(round1(p.fert))} bags{ha}
                  {p.type ? ` · ${p.type}` : ''}
                  {p.fertCost !== null ? ` · ${pesoCompact(p.fertCost)} sa abono` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {byType.length >= 2 && (
        <section className="section">
          <SectionHead title="By fertilizer type" sub="Average of all seasons that used each type" />
          <div className="card table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Fertilizer type</th>
                  <th className="num">Bags{ha}</th>
                  <th className="num">₱ abono{ha}</th>
                  <th className="num">Harvest{ha}</th>
                </tr>
              </thead>
              <tbody>
                {byType.map((t, i) => (
                  <tr key={t.type} className={i === 0 ? 'best' : ''}>
                    <td>
                      {t.type}
                      {i === 0 ? ' ⭐' : ''}
                      <div className="small muted">
                        {t.seasons} season{t.seasons === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="num">{num(round1(t.fert))}</td>
                    <td className="num">{t.costPerArea !== null ? pesoCompact(t.costPerArea) : '—'}</td>
                    <td className="num">
                      {num(t.yield)} {short}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {analysis.insights.length > 0 && (
        <section className="section">
          <SectionHead title="What your records say" />
          <div className="stack">
            {keyInsights(analysis.insights).map((ins) => {
              const Icon = TONE_ICON[ins.tone] || Info
              return (
                <div key={ins.text} className={`callout ${ins.tone}`}>
                  <Icon size={18} />
                  <span>{ins.text}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {(analysis.excluded.length > 0 || growingCount > 0) && (
        <section className="section">
          <SectionHead title="Not compared yet" sub="Hindi pa kasama — i-tap para kumpletuhin" />
          {analysis.excluded.length > 0 && (
            <div className="list">
              {analysis.excluded.map((x) => (
                <button key={x.season.id} className="row" onClick={() => nav.open('season', { season: x.season })}>
                  <span className="bubble" aria-hidden="true">{getCrop(x.season.crop).emoji}</span>
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>{label(x.season)}</span>
                    <span className="meta" style={{ display: 'block', color: 'var(--warn)' }}>⚠️ {MISSING[x.reason](x)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {growingCount > 0 && (
            <p className="small muted">
              🌱 {growingCount} tanim ang tumutubo pa. Lalabas dito pag naka-✅ Already harvested na.
            </p>
          )}
        </section>
      )}
    </>
  )
}

const STAGE = {
  planned: { label: 'Planned', tone: '' },
  growing: { label: 'Growing', tone: 'orange' },
  ready: { label: 'Harvest soon', tone: 'warn' },
  overdue: { label: 'Past target date', tone: 'bad' },
  harvested: { label: 'Harvested', tone: 'dark' },
}

// A planting with its money, harvest and — while growing — its date monitor.
export function PlantingCard({ season, field, onClick, onLogHarvest }) {
  const { state } = useStore()
  const crop = getCrop(season.crop)
  const stats = seasonStats(season, state.transactions, state.harvests)
  const harvest = seasonHarvest(season, state.harvests)
  const bags = seasonBags(season, state.transactions)
  const progress = plantingProgress(season, todayISO(), crop.days)
  const done = season.status === 'completed'
  const stage = STAGE[progress?.stage || (done ? 'harvested' : 'growing')]
  return (
    <div className="card planting">
      <button className="play-card" onClick={onClick}>
        <span className="thumb" aria-hidden="true">
          <span className={done ? '' : 'sway-emoji'}>{crop.emoji}</span>
        </span>
        <span className="grow">
          <span className="hstack between">
            <span className="title">{field ? `${field.name} · ${season.name}` : season.name}</span>
            <span className={`badge ${stage.tone}`}>{stage.label}</span>
          </span>
          <span className="small muted">
            {crop.label}
            {season.area ? ` · ${num(season.area)} ha` : ''}
            {season.startDate ? ` · planted ${fmtDate(season.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
          </span>
          {done ? (
            <span className="small" style={{ color: 'var(--ink-2)' }}>
              🧪 {bags !== null ? `${num(bags)} bags` : '—'} · 🌾{' '}
              {harvest.qty ? `${num(harvest.qty)} ${harvest.unit}` : '—'} ·{' '}
              <span style={{ color: stats.profit >= 0 ? 'var(--good)' : 'var(--bad)', fontWeight: 500 }}>
                {stats.profit >= 0 ? 'Profit' : 'Loss'} {peso(Math.abs(stats.profit))}
              </span>
            </span>
          ) : (
            <span className="small" style={{ color: 'var(--ink-2)' }}>
              🧪 {num(bags || 0)} bags so far · Spent {peso(stats.cost)}
              {harvest.qty ? ` · 🌾 ${num(harvest.qty)} ${harvest.unit}` : ''}
            </span>
          )}
        </span>
      </button>
      {!done && progress && (
        <div className="monitor">
          <div className="monitor-line">
            <span>
              <strong>Day {Math.max(0, progress.dap)}</strong> after planting
            </span>
            <span>
              {progress.daysLeft > 0
                ? `Harvest in ${progress.daysLeft} day${progress.daysLeft === 1 ? '' : 's'}`
                : progress.daysLeft === 0
                  ? 'Harvest today'
                  : `${-progress.daysLeft} day${progress.daysLeft === -1 ? '' : 's'} past target`}{' '}
              · {fmtDate(progress.expected, { month: 'short', day: 'numeric' })}
              {progress.estimated ? ' (est.)' : ''}
            </span>
          </div>
          <Progress value={progress.pct} />
          {onLogHarvest && (
            <button className="btn ghost small" onClick={onLogHarvest}>
              🌾 Log harvest
            </button>
          )}
        </div>
      )}
      {!done && !progress && <p className="small muted">Add the planting date to track days to harvest.</p>}
      {Number(season.budget) > 0 && (
        <span className="progress-line">
          <span className="small muted" style={{ minWidth: 48 }}>Budget</span>
          <Progress value={stats.budgetUsed} />
          <span>
            {pesoCompact(stats.cost)} / {pesoCompact(season.budget)}
          </span>
        </span>
      )}
    </div>
  )
}
