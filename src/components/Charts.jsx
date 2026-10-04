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
