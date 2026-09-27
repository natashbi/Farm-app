import { useState } from 'react'
import { num, peso } from '../lib/format.js'

// Where the money goes: one series, one color, bars sorted largest first.
export function CategoryBars({ rows, max = 6 }) {
  const shown = rows.slice(0, max)
  const rest = rows.slice(max).reduce((s, r) => s + r.total, 0)
  const data = rest > 0 ? [...shown, { category: { id: 'rest', label: 'Other', emoji: '•' }, total: rest }] : shown
  const top = Math.max(...data.map((r) => r.total), 1)
  return (
    <div className="stack" role="table" aria-label="Spending by category">
      {data.map((r) => (
        <div className="hbar" role="row" key={r.category.id}>
          <span className="name" role="cell">
            <span aria-hidden="true">{r.category.emoji}</span> {r.category.label}
          </span>
          <span className="track" role="cell">
            <span className="fill" style={{ width: `${(r.total / top) * 100}%`, display: 'block' }} />
          </span>
          <span className="val" role="cell">{peso(r.total)}</span>
        </div>
      ))}
    </div>
  )
}

function niceMax(v) {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => f <= s)
  return step * exp
}

/**
 * Fertilizer vs harvest, one dot per season. The best season is the accent;
 * every other season is de-emphasized gray. The shaded band is the range of
 * fertilizer that gave a harvest within 10% of the best.
 */
export function FertilizerScatter({ analysis, xLabel, yLabel }) {
  const [active, setActive] = useState(null)
  const { points, best, goodRange, unit } = analysis
  const W = 340
  const H = 230
  const pad = { l: 44, r: 16, t: 16, b: 42 }
  const xMax = niceMax(Math.max(...points.map((p) => p.fert)) * 1.2)
  const yMax = niceMax(Math.max(...points.map((p) => p.yield)) * 1.15)
  const x = (v) => pad.l + (v / xMax) * (W - pad.l - pad.r)
  const y = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b)
  const ticks = (max) => [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const latest = points[points.length - 1]
  const labelled = [best, latest !== best ? latest : null].filter(Boolean)
  const tooClose =
    labelled.length === 2 && Math.abs(y(labelled[0].yield) - y(labelled[1].yield)) < 20 && Math.abs(x(labelled[0].fert) - x(labelled[1].fert)) < 150

  // Labels sit above their dot (below when near the top), kept inside the plot.
  const label = (p, text) => {
    const px = Math.min(Math.max(x(p.fert), pad.l + 60), W - pad.r - 60)
    const py = y(p.yield) < pad.t + 24 ? y(p.yield) + 22 : y(p.yield) - 13
    return (
      <text key={`l-${p.season.id}`} className="data-label" x={px} y={py} textAnchor="middle">
        {text}
      </text>
    )
  }

  const act = active && points.find((p) => p.season.id === active)

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Fertilizer versus harvest for ${points.length} seasons`}>
        {goodRange && (
          <rect
            x={x(goodRange[0]) - 6}
            y={pad.t}
            width={Math.max(12, x(goodRange[1]) - x(goodRange[0]) + 12)}
            height={H - pad.t - pad.b}
            fill="var(--chart-band)"
            rx="6"
          />
        )}
        {ticks(yMax).map((t) => (
          <g key={`y${t}`}>
            <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text className="axis-label" x={pad.l - 8} y={y(t) + 4} textAnchor="end">
              {num(t, 0)}
            </text>
          </g>
        ))}
        {ticks(xMax).map((t) => (
          <text key={`x${t}`} className="axis-label" x={x(t)} y={H - pad.b + 16} textAnchor="middle">
            {num(t, 1)}
          </text>
        ))}
        <text className="axis-title" x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle">
          {xLabel}
        </text>
        <text className="axis-title" x={12} y={(pad.t + H - pad.b) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(pad.t + H - pad.b) / 2})`}>
          {yLabel}
        </text>
        {points.map((p) => {
          const isBest = p === best
          return (
            <g key={p.season.id}>
              <circle
                cx={x(p.fert)}
                cy={y(p.yield)}
                r={isBest ? 7 : 5.5}
                fill={isBest ? 'var(--chart-accent)' : 'var(--chart-muted)'}
                stroke="var(--surface)"
                strokeWidth="2"
              />
              <circle
                cx={x(p.fert)}
                cy={y(p.yield)}
                r="14"
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${p.season.name}: ${num(p.fert)} bags, ${num(p.yield)} ${unit}`}
                onMouseEnter={() => setActive(p.season.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(p.season.id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === p.season.id ? null : p.season.id)}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
            </g>
          )
        })}
        {best && label(best, `Best · ${best.season.name}`)}
        {latest !== best && !tooClose && label(latest, `Latest · ${latest.season.name}`)}
      </svg>
      {act && (
        <div className="chart-tip" style={{ left: `${(x(act.fert) / W) * 100}%`, top: `${(y(act.yield) / H) * 100}%` }}>
          <strong>{act.season.name}</strong>
          <br />
          {num(act.fert)} bags → {num(act.yield)} {unit}
          {act.profit !== null && (
            <>
              <br />
              Profit {peso(act.profit)}
            </>
          )}
        </div>
      )}
      <div className="legend" style={{ marginTop: 6 }}>
        <span>
          <i style={{ background: 'var(--chart-accent)' }} /> Best harvest
        </span>
        <span>
          <i style={{ background: 'var(--chart-muted)' }} /> Other seasons
        </span>
        {goodRange && (
          <span>
            <i style={{ background: 'var(--chart-band)', borderRadius: 3 }} /> Good range
          </span>
        )}
      </div>
    </div>
  )
}
