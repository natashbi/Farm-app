import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { analyzeSeasons, round1, roundHalf } from '../lib/analysis.js'
import { ledgerFertilizerBags, plantingProgress, seasonHarvest, seasonLabel, seasonStats } from '../lib/calc.js'
import { fmtDate, num, peso, pesoCompact, todayISO } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { HeroRecordsArt } from '../components/Art.jsx'
import { FertilizerScatter } from '../components/Charts.jsx'
import { Chip, Empty, Progress, SectionHead, useNav } from '../components/ui.jsx'
import { AnimatedNumber } from '../components/motion.jsx'

const TONE_ICON = { warn: AlertTriangle, tip: Lightbulb, good: CheckCircle2, info: Info }

// Compare finished plantings of one crop: which fertilizer amount gave the best harvest.
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
  const analysis = useMemo(
    () => analyzeSeasons(state.seasons, state.transactions, crop, state.harvests, (s) => seasonLabel(s, fieldsById)),
    [state.seasons, state.transactions, crop, state.harvests, fieldsById],
  )
  const seasons = state.seasons.filter((s) => s.crop === crop)
  const activeArea = seasons.filter((s) => s.status === 'active').reduce((sum, s) => sum + (Number(s.area) || 0), 0)
  const { best, perHa, unit, goodRange, sweetSpot, points } = analysis
  const perHaTxt = perHa ? '/ha' : ''

  if (!state.seasons.length) {
    return (
      <>
        <section className="hero">
          <h2>Learn from your past harvests</h2>
          <p>Record each season's fertilizer and harvest. The app shows what amount gave the best result.</p>
          <div className="actions">
            <button className="btn primary small" onClick={() => nav.open('season', { preset: { status: 'completed' } })}>Add a past season</button>
          </div>
          <HeroRecordsArt className="hero-art" />
        </section>
        <Empty title="No plantings yet">
          Example: 10 bags of fertilizer → 150 cavans, but 20 bags → 100 cavans. Recording this helps you use the right amount next time.
        </Empty>
      </>
    )
  }

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
              ≈ <AnimatedNumber value={round1(best.fert)} format={(n) => num(n)} /> <span style={{ fontSize: 20, fontWeight: 500 }}>bags{perHaTxt}</span>
            </div>
            {perHa && activeArea > 0 && (
              <p style={{ color: 'var(--on-green)' }}>
                About <strong>{num(roundHalf(best.fert * activeArea))} bags</strong> for the {num(activeArea)} ha growing now
              </p>
            )}
            <p>
              Gave your best harvest: {num(best.yield)} {unit}
              {perHaTxt} in {seasonLabel(best.season, fieldsById)}.
            </p>
            {goodRange && goodRange[1] - goodRange[0] >= 0.5 && (
              <span className="badge" style={{ alignSelf: 'flex-start', position: 'relative', zIndex: 1 }}>
                Good range: {num(goodRange[0])}–{num(goodRange[1])} bags{perHaTxt}
              </span>
            )}
          </>
        ) : (
          <>
            <h2>Compare your seasons</h2>
            <p>Add finished seasons with fertilizer bags and harvest to see what works best.</p>
            <div className="actions">
              <button className="btn primary small" onClick={() => nav.open('season', { preset: { status: 'completed' } })}>Add past season</button>
            </div>
          </>
        )}
        <HeroRecordsArt className="hero-art" style={{ width: '34%' }} />
      </section>

      {points.length >= 2 && (
        <section className="section">
          <SectionHead title="Fertilizer vs harvest" sub={perHa ? 'Per hectare, so different field sizes compare fairly' : 'Totals per season'} />
          <div className="card">
            <FertilizerScatter analysis={analysis} labelOf={(x) => seasonLabel(x, fieldsById)} xLabel={`Fertilizer (bags${perHaTxt})`} yLabel={`Harvest (${unit}${perHaTxt})`} />
          </div>
        </section>
      )}

      {analysis.insights.length > 0 && (
        <section className="section">
          <SectionHead title="What your records say" />
          <div className="stack">
            {analysis.insights.map((ins) => {
              const Icon = TONE_ICON[ins.tone] || Info
              return (
                <div key={ins.text} className={`callout ${ins.tone}`}>
                  <Icon size={18} />
                  <span>{ins.text}</span>
                </div>
              )
            })}
            {sweetSpot && (
              <div className="callout info">
                <Info size={18} />
                <span>
                  Trend estimate from all your seasons: the harvest peaks near <strong>{num(sweetSpot)} bags{perHaTxt}</strong>. Treat this as a
                  guide — weather and pests also matter.
                </span>
              </div>
            )}
            {analysis.skippedUnits > 0 && (
              <p className="small muted">{analysis.skippedUnits} season(s) use a different harvest unit and are not compared.</p>
            )}
          </div>
        </section>
      )}

      {points.length >= 2 && (
        <section className="section">
          <SectionHead title="Side by side" />
          <div className="card table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Season</th>
                  <th className="num">Fertilizer</th>
                  <th className="num">Harvest</th>
                  <th className="num">Per bag</th>
                  <th className="num">Profit</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.season.id} className={p === best ? 'best' : ''}>
                    <td>{seasonLabel(p.season, fieldsById)}{p === best ? ' ⭐' : ''}</td>
                    <td className="num">{num(p.bags)}</td>
                    <td className="num">{num(p.harvest)}</td>
                    <td className="num">{p.perBag !== null ? num(p.perBag) : '—'}</td>
                    <td className="num">{p.profit !== null ? pesoCompact(p.profit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 8 }}>
              Totals in bags and {unit}. “Per bag” = {unit} harvested for each bag of fertilizer.
            </p>
          </div>
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
  const ledgerBags = ledgerFertilizerBags(state.transactions, season.id)
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
              🧪 {season.fertilizerBags !== '' && season.fertilizerBags !== undefined ? `${num(season.fertilizerBags)} bags` : '—'} · 🌾{' '}
              {harvest.qty ? `${num(harvest.qty)} ${harvest.unit}` : '—'} ·{' '}
              <span style={{ color: stats.profit >= 0 ? 'var(--good)' : 'var(--bad)', fontWeight: 500 }}>
                {stats.profit >= 0 ? 'Profit' : 'Loss'} {peso(Math.abs(stats.profit))}
              </span>
            </span>
          ) : (
            <span className="small" style={{ color: 'var(--ink-2)' }}>
              🧪 {num(Number(season.fertilizerBags) || ledgerBags)} bags so far · Spent {peso(stats.cost)}
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
