import { addDays, seasonNameFor as seasonName } from '../lib/calc.js'
import { todayISO } from '../lib/format.js'

// Demo data: a large-scale rice farm in Zaragoza, Nueva Ecija with three fields.
// Dates are relative to today so the planting monitor always shows live crops.
// Lote 1 mirrors a common story: fewer bags of fertilizer gave the best harvest.

export function makeSampleData() {
  const today = todayISO()
  const at = (days) => addDays(today, days)
  const now = Date.now()

  const fields = [
    { id: 'f-1', name: 'Lote 1', location: 'Brgy. Batitang, Zaragoza', area: 6, notes: 'Irrigated (NIA canal)' },
    { id: 'f-2', name: 'Lote 2', location: 'Brgy. Macarse, Zaragoza', area: 4.5, notes: '' },
    { id: 'f-3', name: 'Lote 3', location: 'Brgy. Santa Cruz, Zaragoza', area: 3, notes: 'Corn in dry season' },
  ]

  const planting = (id, fieldId, crop, start, extra) => ({
    id,
    fieldId,
    crop,
    name: seasonName(start),
    startDate: start,
    status: 'completed',
    area: fields.find((f) => f.id === fieldId).area,
    fertilizerType: crop === 'rice' ? 'Complete 14-14-14 + Urea' : 'Complete + Urea',
    harvestUnit: crop === 'rice' ? 'cavans' : 'sacks',
    maturityDays: crop === 'rice' ? 115 : 110,
    harvestQty: '',
    fertilizerCost: '',
    totalCost: '',
    totalIncome: '',
    notes: '',
    ...extra,
  })

  // Lote 1 (6 ha): four past rice seasons, one growing now.
  const l1 = at(-110)
  const seasons = [
    planting('s-1a', 'f-1', 'rice', addDays(l1, -728), {
      harvestDate: addDays(l1, -610), fertilizerBags: 56, seedKg: 240, harvestQty: 500,
      fertilizerType: 'Complete 16-20-0 + Urea', fertilizerCost: 92400,
      budget: 220000, totalCost: 208000, totalIncome: 475000, notes: 'Typhoon before harvest, some lodging.',
    }),
    planting('s-1b', 'f-1', 'rice', addDays(l1, -546), {
      harvestDate: addDays(l1, -428), fertilizerBags: 40, seedKg: 240, harvestQty: 600, fertilizerCost: 64000,
      budget: 200000, totalCost: 194000, totalIncome: 600000, notes: 'Used Leaf Color Chart before every urea top-dress.',
    }),
    planting('s-1c', 'f-1', 'rice', addDays(l1, -364), {
      harvestDate: addDays(l1, -246), fertilizerBags: 80, seedKg: 240, harvestQty: 400,
      fertilizerType: 'Urea + Ammonium sulfate', fertilizerCost: 124000,
      budget: 220000, totalCost: 244000, totalIncome: 380000, notes: 'Added extra urea. Plants fell over and had planthoppers.',
    }),
    planting('s-1d', 'f-1', 'rice', addDays(l1, -182), {
      harvestDate: addDays(l1, -64), fertilizerBags: 48, seedKg: 240, fertilizerCost: 76800,
      budget: 210000, totalCost: 200800, totalIncome: 580000,
    }),
    planting('s-1e', 'f-1', 'rice', l1, { status: 'active', fertilizerBags: '', seedKg: 240, budget: 220000, notes: 'Plan: stay near 40 bags.' }),

    // Lote 2 (4.5 ha)
    planting('s-2a', 'f-2', 'rice', addDays(at(-85), -182), {
      harvestDate: addDays(at(-85), -64), fertilizerBags: 30, seedKg: 180, fertilizerCost: 48000,
      budget: 160000, totalCost: 150000, totalIncome: 405000,
    }),
    planting('s-2b', 'f-2', 'rice', at(-85), { status: 'active', fertilizerBags: '', seedKg: 180, budget: 165000 }),

    // Lote 3 (3 ha): corn in the dry season, rice now.
    planting('s-3a', 'f-3', 'corn', addDays(at(-40), -364), {
      harvestDate: addDays(at(-40), -254), fertilizerBags: 18, seedKg: 54, harvestQty: 160, fertilizerCost: 28800,
      budget: 95000, totalCost: 92000, totalIncome: 176000,
    }),
    planting('s-3b', 'f-3', 'corn', addDays(at(-40), -182), {
      harvestDate: addDays(at(-40), -72), fertilizerBags: 24, seedKg: 54, harvestQty: 168, fertilizerCost: 38400,
      budget: 100000, totalCost: 104000, totalIncome: 184800,
    }),
    planting('s-3c', 'f-3', 'rice', at(-40), { status: 'active', fertilizerBags: '', seedKg: 120, budget: 110000 }),
  ]

  // Harvest logs: large fields are harvested in batches over several days.
  const harvest = (id, seasonId, date, qty, pricePerUnit, buyer) => {
    const s = seasons.find((x) => x.id === seasonId)
    return { id, seasonId, fieldId: s.fieldId, crop: s.crop, date, qty, unit: s.harvestUnit, pricePerUnit, buyer, notes: '', createdAt: now }
  }
  const d1 = seasons.find((s) => s.id === 's-1d').harvestDate
  const d2 = seasons.find((s) => s.id === 's-2a').harvestDate
  const harvests = [
    harvest('h-1', 's-1d', addDays(d1, -2), 250, 1000, 'Zaragoza Rice Mill'),
    harvest('h-2', 's-1d', addDays(d1, -1), 200, 1000, 'Zaragoza Rice Mill'),
    harvest('h-3', 's-1d', d1, 130, 1000, 'Local trader'),
    harvest('h-4', 's-2a', addDays(d2, -1), 230, 1000, 'Zaragoza Rice Mill'),
    harvest('h-5', 's-2a', d2, 175, 1000, 'Zaragoza Rice Mill'),
  ]

  const tx = (id, seasonId, category, amount, daysAfterPlanting, item, extra = {}) => {
    const s = seasons.find((x) => x.id === seasonId)
    return { id, category, amount, date: addDays(s.startDate, daysAfterPlanting), item, seasonId, note: '', createdAt: now, ...extra }
  }
  const transactions = [
    // Lote 1: growing now
    tx('t-1', 's-1e', 'seeds', 13600, -4, 'Certified seeds (8 bags)', { qty: 8, unit: 'bags' }),
    tx('t-2', 's-1e', 'landprep', 24000, -2, 'Plowing & harrowing'),
    tx('t-3', 's-1e', 'tool_rent', 12000, -2, 'Hand tractor rental'),
    tx('t-4', 's-1e', 'labor', 30000, 20, 'Transplanting (25 workers)'),
    tx('t-5', 's-1e', 'fertilizer', 38400, 22, 'Complete 14-14-14', { qty: 24, unit: 'bags' }),
    tx('t-6', 's-1e', 'fertilizer', 25600, 47, 'Urea 46-0-0', { qty: 16, unit: 'bags' }),
    tx('t-7', 's-1e', 'water', 9600, 55, 'Irrigation fee (NIA)'),
    tx('t-8', 's-1e', 'pesticide', 7400, 67, 'Bt biopesticide'),
    tx('t-9', 's-1e', 'fuel', 4800, 73, 'Diesel for water pump'),
    tx('t-10', 's-1e', 'labor', 8000, 94, 'Weeding'),
    tx('t-11', 's-1e', 'other_income', 1500, 99, 'Vegetables from dike'),
    // Lote 2: growing now
    tx('t-12', 's-2b', 'seeds', 10200, -3, 'Certified seeds (6 bags)', { qty: 6, unit: 'bags' }),
    tx('t-13', 's-2b', 'landprep', 18000, -1, 'Plowing & harrowing'),
    tx('t-14', 's-2b', 'labor', 22500, 18, 'Transplanting (18 workers)'),
    tx('t-15', 's-2b', 'fertilizer', 30400, 21, 'Complete 14-14-14', { qty: 19, unit: 'bags' }),
    tx('t-16', 's-2b', 'water', 7200, 50, 'Irrigation fee (NIA)'),
    // Lote 3: growing now
    tx('t-17', 's-3c', 'seeds', 6800, -3, 'Certified seeds (4 bags)', { qty: 4, unit: 'bags' }),
    tx('t-18', 's-3c', 'landprep', 12000, -1, 'Plowing & harrowing'),
    tx('t-19', 's-3c', 'labor', 15000, 16, 'Transplanting (12 workers)'),
    tx('t-20', 's-3c', 'fertilizer', 12800, 20, 'Complete 14-14-14', { qty: 8, unit: 'bags' }),
    // Farm-wide tools (not tied to one field)
    { id: 't-21', category: 'tool_buy', amount: 5600, date: at(-80), item: 'Knapsack sprayers (2)', seasonId: '', note: '', createdAt: now },
    { id: 't-22', category: 'tool_buy', amount: 900, date: at(-38), item: 'Bolos (2)', seasonId: '', note: '', createdAt: now },
    { id: 't-23', category: 'tool_repair', amount: 1650, date: at(-26), item: 'Water pump repair', seasonId: '', note: '', createdAt: now },
  ]

  const anomalies = [
    {
      id: 'a-1', date: addDays(l1, 47), crop: 'rice', seasonId: 's-1e',
      symptoms: ['yellow_old', 'stunted'], severity: 'medium',
      note: 'Lower leaves pale on the east side of Lote 1.',
      conditionIds: ['nitrogen_def', 'poor_soil'], status: 'resolved', photo: null, createdAt: now,
    },
    {
      id: 'a-2', date: at(-12), crop: 'rice', seasonId: 's-2b',
      symptoms: ['holes'], severity: 'low',
      note: 'A few chewed leaves near the canal in Lote 2.',
      conditionIds: ['armyworm', 'fruit_borer'], status: 'open', photo: null, createdAt: now,
    },
  ]

  return { fields, seasons, harvests, transactions, anomalies, farm: 'Zaragoza, Nueva Ecija' }
}
