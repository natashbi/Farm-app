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
export function seasonStats(season, transactions) {
  const ledger = totals(forSeason(transactions, season.id))
  const cost = isSet(season.totalCost) ? Number(season.totalCost) : ledger.cost
  const income = isSet(season.totalIncome) ? Number(season.totalIncome) : ledger.income
  const area = Number(season.area) || 0
  const harvest = Number(season.harvestQty) || 0
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
