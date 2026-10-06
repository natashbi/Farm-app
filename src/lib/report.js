import { getCategory, getCrop } from '../data/categories.js'
import { addDays, byCategory, fieldStats, seasonBags, seasonFertilizer, seasonHarvest, seasonLabel, seasonStats, totals } from './calc.js'
import { fmtDate, num, peso } from './format.js'

const isSet = (v) => v !== null && v !== undefined && v !== ''

/** Season names newest first (one name covers every field planted that season). */
export function seasonNames(seasons) {
  const latest = new Map()
  for (const s of seasons) {
    if (!s.name) continue
    const d = s.startDate || ''
    if (!latest.has(s.name) || d > latest.get(s.name)) latest.set(s.name, d)
  }
  return [...latest.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name)
}

/**
 * The records inside a filter: a season name ('all' = every season) and a field
 * ('all' = every field, 'none' = farm-wide records not tied to a field).
 * Farm-wide costs (tools, repairs) count in "all fields" views; for one season
 * they count when dated inside that season.
 */
export function scopeRecords(state, { season = 'all', field = 'all' } = {}) {
  const seasons = state.seasons.filter(
    (s) => (season === 'all' || s.name === season) && (field === 'all' || (field === 'none' ? !s.fieldId : s.fieldId === field)),
  )
  const ids = new Set(seasons.map((s) => s.id))
  const known = new Set(state.seasons.map((s) => s.id))
  const filtered = season !== 'all' || field !== 'all'
  let span = null
  if (season !== 'all' && seasons.length) {
    const starts = seasons.map((s) => s.startDate).filter(Boolean).sort()
    const ends = seasons.map((s) => s.harvestDate || (s.startDate && addDays(s.startDate, Number(s.maturityDays) || getCrop(s.crop).days))).filter(Boolean).sort()
    if (starts.length && ends.length) span = [addDays(starts[0], -30), ends.at(-1)]
  }
  const farmWideIncluded = field === 'all' || field === 'none'
  const inSpan = (date) => !span || (date >= span[0] && date <= span[1])
  const isFarmWide = (r) => !r.seasonId || !known.has(r.seasonId)
  const pick = (r) => (isFarmWide(r) ? farmWideIncluded && inSpan(r.date || '') : !filtered || ids.has(r.seasonId))
  return {
    seasons,
    transactions: state.transactions.filter(pick),
    harvests: state.harvests.filter(pick),
    anomalies: state.anomalies.filter(pick),
    span,
  }
}

/** Everything the Reports screen shows, computed from one scope. */
export function buildReport(state, scope) {
  const all = { transactions: state.transactions, harvests: state.harvests }
  const seasonIds = new Set(scope.seasons.map((s) => s.id))
  const plantings = scope.seasons.map((s) => ({
    season: s,
    stats: seasonStats(s, all.transactions, all.harvests),
    harvest: seasonHarvest(s, all.harvests),
  }))
  const typed = plantings.filter((p) => isSet(p.season.totalCost))
  const typedIds = new Set(typed.map((p) => p.season.id))

  // Records that make up the money totals: farm-wide ones, plus those of plantings
  // whose cost is added up from records (not typed as one total).
  const farmTx = scope.transactions.filter((tx) => !seasonIds.has(tx.seasonId))
  const countedTx = scope.transactions.filter((tx) => !seasonIds.has(tx.seasonId) || !typedIds.has(tx.seasonId))
  const farm = totals(farmTx)
  const cost = plantings.reduce((s, p) => s + p.stats.cost, 0) + farm.cost
  const income = plantings.reduce((s, p) => s + p.stats.income, 0) + farm.income

  const categories = byCategory(countedTx).filter((r) => r.category.group !== 'income')
  const typedCost = typed.reduce((s, p) => s + Number(p.season.totalCost), 0)
  if (typedCost > 0) {
    categories.push({ category: { id: 'typed', label: 'Season totals (typed, no breakdown)', emoji: '🗒️', group: 'production' }, total: typedCost })
  }
  const split = { production: 0, tools: 0, typed: typedCost }
  for (const r of categories) if (r.category.id !== 'typed') split[r.category.group] += r.total

  // Harvest in the main unit, with the area it came from.
  const byUnit = {}
  for (const p of plantings) {
    if (!p.harvest.qty) continue
    const u = (byUnit[p.harvest.unit] ||= { qty: 0, area: 0, cost: 0, plantings: 0 })
    u.qty += p.harvest.qty
    u.area += Number(p.season.area) || 0
    u.cost += p.stats.cost
    u.plantings += 1
  }
  const mainUnit = Object.keys(byUnit).sort((a, b) => byUnit[b].qty - byUnit[a].qty)[0] || null
  const main = mainUnit ? byUnit[mainUnit] : null

  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const fieldRows = state.fields
    .filter((f) => scope.seasons.some((s) => s.fieldId === f.id))
    .map((f) => ({ field: f, ...fieldStats(f, scope.seasons, all.transactions, all.harvests) }))

  return {
    cost,
    income,
    profit: income - cost,
    split,
    categories,
    byUnit,
    mainUnit,
    harvestQty: main?.qty || 0,
    yieldPerHa: main && main.area > 0 ? main.qty / main.area : null,
    costPerUnit: main && main.qty > 0 ? main.cost / main.qty : null,
    areaPlanted: scope.seasons.reduce((s, x) => s + (Number(x.area) || 0), 0),
    plantings,
    fieldRows,
    fieldsById,
  }
}

/** A single dated feed of everything recorded — the farm's activity log. */
export function activityLog(state, scope) {
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const seasonsById = Object.fromEntries(state.seasons.map((s) => [s.id, s]))
  const where = (seasonId) => seasonLabel(seasonsById[seasonId], fieldsById)
  const events = []
  for (const tx of scope.transactions) {
    const cat = getCategory(tx.category)
    const income = cat.group === 'income'
    events.push({
      id: `tx-${tx.id}`,
      date: tx.date,
      kind: income ? 'income' : 'expense',
      emoji: cat.emoji,
      title: tx.item || cat.label,
      meta: [cat.label, where(tx.seasonId) || 'Farm-wide'].filter(Boolean).join(' · '),
      amount: `${income ? '+' : '−'}${peso(tx.amount)}`,
      tone: income ? 'in' : 'out',
      open: { sheet: 'tx', props: { tx } },
    })
  }
  for (const h of scope.harvests) {
    const pricePart = h.pricePerUnit ? ` · ${peso(h.pricePerUnit)}/${(h.unit || '').replace(/s$/, '')}` : ''
    events.push({
      id: `h-${h.id}`,
      date: h.date,
      kind: 'harvest',
      emoji: getCrop(h.crop).emoji,
      title: `Harvested ${num(h.qty)} ${h.unit}`,
      meta: `${where(h.seasonId) || 'Harvest'}${pricePart}`,
      amount: '',
      tone: 'in',
      open: { sheet: 'harvest', props: { harvest: h } },
    })
  }
  for (const s of scope.seasons) {
    const crop = getCrop(s.crop)
    if (s.startDate) {
      events.push({
        id: `p-${s.id}`,
        date: s.startDate,
        kind: 'planting',
        emoji: '🌱',
        title: `Planted ${crop.label.toLowerCase()}${s.area ? ` on ${num(s.area)} ha` : ''}`,
        meta: seasonLabel(s, fieldsById),
        amount: '',
        tone: '',
        open: { sheet: 'season', props: { season: s } },
      })
    }
    if (s.status === 'completed' && s.harvestDate) {
      events.push({
        id: `c-${s.id}`,
        date: s.harvestDate,
        kind: 'completed',
        emoji: '✅',
        title: 'Harvest finished',
        meta: seasonLabel(s, fieldsById),
        amount: '',
        tone: '',
        open: { sheet: 'season', props: { season: s } },
      })
    }
  }
  for (const a of scope.anomalies) {
    events.push({
      id: `a-${a.id}`,
      date: a.date,
      kind: 'problem',
      emoji: '🩺',
      title: a.status === 'resolved' ? 'Crop problem (solved)' : 'Crop problem reported',
      meta: where(a.seasonId) || getCrop(a.crop).label,
      amount: '',
      tone: '',
      open: { sheet: 'anomaly', props: { anomaly: a } },
    })
  }
  return events.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

// ---------------------------------------------------------------------------
// CSV export of a report (opens in Excel / Google Sheets)
// ---------------------------------------------------------------------------
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const row = (...cells) => cells.map(esc).join(',')

export function reportCSV(state, report, scope, title) {
  const lines = [row(title), row('Generated', fmtDate(new Date().toISOString().slice(0, 10))), '']
  lines.push(row('SUMMARY'))
  lines.push(row('Total expenses (PHP)', report.cost))
  lines.push(row('Total income (PHP)', report.income))
  lines.push(row('Net profit (PHP)', report.profit))
  lines.push(row('Area planted (ha)', report.areaPlanted))
  if (report.mainUnit) {
    lines.push(row(`Harvest (${report.mainUnit})`, report.harvestQty))
    if (report.yieldPerHa) lines.push(row(`Yield (${report.mainUnit}/ha)`, report.yieldPerHa.toFixed(1)))
    if (report.costPerUnit) lines.push(row(`Cost per ${report.mainUnit.replace(/s$/, '')} (PHP)`, report.costPerUnit.toFixed(2)))
  }
  lines.push('', row('EXPENSES BY CATEGORY'), row('Category', 'Amount (PHP)'))
  for (const r of report.categories) lines.push(row(r.category.label, r.total))
  lines.push('', row('PLANTINGS'), row('Field', 'Season', 'Crop', 'Area (ha)', 'Planted', 'Harvest date', 'Harvest', 'Unit', 'Fertilizer (bags)', 'Fertilizer type', 'Fertilizer cost (PHP)', 'Cost (PHP)', 'Income (PHP)', 'Profit (PHP)'))
  for (const p of report.plantings) {
    const s = p.season
    lines.push(
      row(report.fieldsById[s.fieldId]?.name || '', s.name, getCrop(s.crop).label, s.area, s.startDate, s.harvestDate, p.harvest.qty || '', p.harvest.unit, seasonBags(s, state.transactions) ?? '', s.fertilizerType, seasonFertilizer(s, state.transactions).cost ?? '', p.stats.cost, p.stats.income, p.stats.profit),
    )
  }
  if (report.fieldRows.length) {
    lines.push('', row('FIELD PERFORMANCE'), row('Field', 'Location', 'Area (ha)', 'Plantings', 'Avg yield per ha', 'Unit', 'Cost (PHP)', 'Income (PHP)', 'Profit (PHP)'))
    for (const f of report.fieldRows) {
      lines.push(row(f.field.name, f.field.location, f.field.area, f.plantings, f.yieldPerHa ? f.yieldPerHa.toFixed(1) : '', f.mainUnit || '', f.cost, f.income, f.profit))
    }
  }
  const seasonsById = Object.fromEntries(state.seasons.map((s) => [s.id, s]))
  lines.push('', row('HARVEST LOG'), row('Date', 'Field', 'Season', 'Crop', 'Quantity', 'Unit', 'Price per unit (PHP)', 'Buyer', 'Notes'))
  for (const h of [...scope.harvests].sort((a, b) => (a.date || '').localeCompare(b.date || ''))) {
    lines.push(row(h.date, report.fieldsById[h.fieldId]?.name || '', seasonsById[h.seasonId]?.name || '', getCrop(h.crop).label, h.qty, h.unit, h.pricePerUnit, h.buyer, h.notes))
  }
  lines.push('', row('EXPENSE AND INCOME RECORDS'), row('Date', 'Type', 'Category', 'Item', 'Quantity', 'Unit', 'Amount (PHP)', 'Field', 'Season', 'Notes'))
  for (const tx of [...scope.transactions].sort((a, b) => (a.date || '').localeCompare(b.date || ''))) {
    const cat = getCategory(tx.category)
    const s = seasonsById[tx.seasonId]
    lines.push(row(tx.date, cat.group === 'income' ? 'Income' : 'Expense', cat.label, tx.item, tx.qty, tx.unit, tx.amount, report.fieldsById[s?.fieldId]?.name || (s ? '' : 'Farm-wide'), s?.name || '', tx.note))
  }
  // BOM so Excel reads ñ and ₱ correctly.
  return '﻿' + lines.join('\n')
}
