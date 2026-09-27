const pesoFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const pesoCents = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function peso(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? pesoFmt.format(v) : pesoCents.format(v)
}

export function pesoCompact(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}₱${trim(abs / 1e6)}M`
  if (abs >= 1e4) return `${sign}₱${trim(abs / 1e3)}K`
  return pesoFmt.format(v)
}

function trim(n) {
  return n.toFixed(1).replace(/\.0$/, '')
}

export function num(n, digits = 1) {
  const v = Number(n) || 0
  return v.toLocaleString('en-PH', { maximumFractionDigits: digits })
}

export function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', opts)
}

export function todayISO() {
  const d = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

// Parse a number typed by a farmer ("1,500", " 12.5 ") — empty stays null.
export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}
