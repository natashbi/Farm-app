import { getCategory } from '../data/categories.js'

export function totals(transactions) {
  const t = { production: 0, tools: 0, income: 0 }
  for (const tx of transactions) {
    t[getCategory(tx.category).group] += Number(tx.amount) || 0
  }
  const cost = t.production + t.tools
  return { ...t, cost, profit: t.income - cost }
}

export function forSeason(transactions, seasonId) {
  if (!seasonId || seasonId === 'all') return transactions
  if (seasonId === 'none') return transactions.filter((tx) => !tx.seasonId)
  return transactions.filter((tx) => tx.seasonId === seasonId)
}

// Totals per category, largest first. `group` limits to one group.
export function byCategory(transactions, group) {
  const map = new Map()
  for (const tx of transactions) {
    const cat = getCategory(tx.category)
    if (group && cat.group !== group) continue
    map.set(cat.id, (map.get(cat.id) || 0) + (Number(tx.amount) || 0))
  }
  return [...map.entries()]
    .map(([id, total]) => ({ category: getCategory(id), total }))
    .sort((a, b) => b.total - a.total)
}

// Fertilizer bags recorded in the budget for a season (entries with a qty).
export function ledgerFertilizerBags(transactions, seasonId) {
  return forSeason(transactions, seasonId)
    .filter((tx) => tx.category === 'fertilizer' && tx.unit === 'bags')
    .reduce((sum, tx) => sum + (Number(tx.qty) || 0), 0)
}

const isSet = (v) => v !== null && v !== undefined && v !== ''

/**
 * Cost & income for a season. Old seasons usually have totals typed in by hand;
 * seasons tracked in the app add up their budget records. A typed total wins.
 */
export function seasonStats(season, transactions, harvests = []) {
  const ledger = totals(forSeason(transactions, season.id))
  const cost = isSet(season.totalCost) ? Number(season.totalCost) : ledger.cost
  const income = isSet(season.totalIncome) ? Number(season.totalIncome) : ledger.income
  const area = Number(season.area) || 0
  const harvest = seasonHarvest(season, harvests).qty
  return {
    ledger,
    cost,
    income,
    profit: income - cost,
    costFromLedger: !isSet(season.totalCost),
    incomeFromLedger: !isSet(season.totalIncome),
    costPerUnit: harvest > 0 ? cost / harvest : null,
    yieldPerHa: area > 0 && harvest > 0 ? harvest / area : null,
    budgetUsed: Number(season.budget) > 0 ? cost / Number(season.budget) : null,
  }
}

export function activeSeason(seasons) {
  const active = seasons.filter((s) => s.status === 'active')
  const pool = active.length ? active : seasons
  return [...pool].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0] || null
}

export function sortByDateDesc(items, key = 'date') {
  return [...items].sort((a, b) => (b[key] || '').localeCompare(a[key] || '') || (b.createdAt || 0) - (a.createdAt || 0))
}

// ---------------------------------------------------------------------------
// Harvest logs, fields and planting-date monitoring
// ---------------------------------------------------------------------------

/**
 * Harvest of a planting. Large farms harvest a field in several batches, so
 * when harvest logs exist their total is the harvest; older seasons without
 * logs use the amount typed on the season.
 */
export function seasonHarvest(season, harvests = []) {
  const logs = harvests.filter((h) => h.seasonId === season.id)
  if (logs.length) {
    const unit = season.harvestUnit || logs[0].unit || 'cavans'
    const qty = logs.filter((h) => (h.unit || unit) === unit).reduce((sum, h) => sum + (Number(h.qty) || 0), 0)
    return { qty, unit, fromLog: true, count: logs.length }
  }
  return { qty: Number(season.harvestQty) || 0, unit: season.harvestUnit || 'cavans', fromLog: false, count: 0 }
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / 864e5)
}

/**
 * Planting-date monitor: days after planting (DAP), the expected harvest date
 * (set by the farmer, else planting date + the crop's usual days) and how far along it is.
 */
export function plantingProgress(season, today, cropDays = 115) {
  if (!season.startDate) return null
  const total = Number(season.maturityDays) || cropDays
  const expected = season.harvestDate || addDays(season.startDate, total)
  const span = Math.max(1, daysBetween(season.startDate, expected))
  const dap = daysBetween(season.startDate, today)
  const daysLeft = daysBetween(today, expected)
  let stage = 'growing'
  if (season.status === 'completed') stage = 'harvested'
  else if (dap < 0) stage = 'planned'
  else if (daysLeft < 0) stage = 'overdue'
  else if (daysLeft <= 7) stage = 'ready'
  return { dap, expected, daysLeft, pct: Math.min(1, Math.max(0, dap / span)), stage, estimated: !season.harvestDate }
}

export function seasonLabel(season, fieldsById = {}) {
  if (!season) return ''
  const field = fieldsById[season.fieldId]
  return field ? `${field.name} · ${season.name}` : season.name
}

/** Money, area and harvest for one field across the given plantings. */
export function fieldStats(field, seasons, transactions, harvests = []) {
  const own = seasons.filter((s) => s.fieldId === field.id)
  let cost = 0
  let income = 0
  const harvest = {}
  for (const s of own) {
    const st = seasonStats(s, transactions, harvests)
    cost += st.cost
    income += st.income
    const h = seasonHarvest(s, harvests)
    if (h.qty) harvest[h.unit] = (harvest[h.unit] || 0) + h.qty
  }
  const area = Number(field.area) || 0
  const mainUnit = Object.entries(harvest).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  // Average harvest per hectare per planting, in the field's main unit.
  const yields = own
    .map((s) => ({ h: seasonHarvest(s, harvests), a: Number(s.area) || area }))
    .filter(({ h, a }) => h.qty > 0 && a > 0 && h.unit === mainUnit)
    .map(({ h, a }) => h.qty / a)
  return {
    plantings: own.length,
    cost,
    income,
    profit: income - cost,
    harvest,
    mainUnit,
    yieldPerHa: yields.length ? yields.reduce((x, y) => x + y, 0) / yields.length : null,
  }
}

/** Plantings still growing, the one closest to harvest first. */
export function growingPlantings(seasons, cropDays = () => 115) {
  const expected = (s) => s.harvestDate || (s.startDate ? addDays(s.startDate, Number(s.maturityDays) || cropDays(s.crop)) : '9999')
  return seasons.filter((s) => s.status !== 'completed').sort((a, b) => expected(a).localeCompare(expected(b)))
}
