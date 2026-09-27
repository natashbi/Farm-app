// Demo data so a farmer can see how the app works before entering their own.
// Mirrors a common story: 10 bags of fertilizer -> 150 cavans, but 20 bags -> 100.
export function makeSampleData() {
  const y = new Date().getFullYear()
  const d = (year, m, day) => `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const now = Date.now()

  const seasons = [
    {
      id: 's-ws1', name: `Wet Season ${y - 2}`, crop: 'rice', status: 'completed',
      startDate: d(y - 2, 6, 10), harvestDate: d(y - 2, 10, 5), area: 1.5,
      fertilizerBags: 14, fertilizerType: 'Complete 14-14-14 + Urea', seedKg: 40,
      harvestQty: 125, harvestUnit: 'cavans', budget: 55000, totalCost: 52000, totalIncome: 118750,
      notes: 'Typhoon in September, some lodging.',
    },
    {
      id: 's-ds1', name: `Dry Season ${y - 1}`, crop: 'rice', status: 'completed',
      startDate: d(y - 2, 11, 20), harvestDate: d(y - 1, 3, 18), area: 1.5,
      fertilizerBags: 10, fertilizerType: 'Complete 14-14-14 + Urea', seedKg: 40,
      harvestQty: 150, harvestUnit: 'cavans', budget: 50000, totalCost: 48500, totalIncome: 150000,
      notes: 'Used Leaf Color Chart before every urea top-dress.',
    },
    {
      id: 's-ws2', name: `Wet Season ${y - 1}`, crop: 'rice', status: 'completed',
      startDate: d(y - 1, 6, 12), harvestDate: d(y - 1, 10, 8), area: 1.5,
      fertilizerBags: 20, fertilizerType: 'Complete 14-14-14 + Urea', seedKg: 40,
      harvestQty: 100, harvestUnit: 'cavans', budget: 55000, totalCost: 61000, totalIncome: 95000,
      notes: 'Added extra urea. Plants fell over and had planthoppers.',
    },
    {
      id: 's-ds2', name: `Dry Season ${y}`, crop: 'rice', status: 'completed',
      startDate: d(y - 1, 11, 18), harvestDate: d(y, 3, 20), area: 1.5,
      fertilizerBags: 12, fertilizerType: 'Complete 14-14-14 + Urea', seedKg: 40,
      harvestQty: 145, harvestUnit: 'cavans', budget: 52000, totalCost: 50200, totalIncome: 145000,
      notes: '',
    },
    {
      id: 's-now', name: `Wet Season ${y}`, crop: 'rice', status: 'active',
      startDate: d(y, 6, 8), harvestDate: '', area: 1.5,
      fertilizerBags: '', fertilizerType: 'Complete 14-14-14 + Urea', seedKg: 40,
      harvestQty: '', harvestUnit: 'cavans', budget: 55000, totalCost: '', totalIncome: '',
      notes: 'Plan: stay near 10–12 bags.',
    },
    {
      id: 's-corn1', name: `Corn Dry ${y - 1}`, crop: 'corn', status: 'completed',
      startDate: d(y - 2, 12, 1), harvestDate: d(y - 1, 3, 30), area: 0.5,
      fertilizerBags: 6, fertilizerType: 'Complete + Urea', seedKg: 9,
      harvestQty: 40, harvestUnit: 'sacks', budget: 20000, totalCost: 18500, totalIncome: 36000, notes: '',
    },
    {
      id: 's-corn2', name: `Corn Dry ${y}`, crop: 'corn', status: 'completed',
      startDate: d(y - 1, 12, 3), harvestDate: d(y, 4, 2), area: 0.5,
      fertilizerBags: 8, fertilizerType: 'Complete + Urea', seedKg: 9,
      harvestQty: 42, harvestUnit: 'sacks', budget: 20000, totalCost: 21000, totalIncome: 37800, notes: '',
    },
  ]

  const tx = (id, category, amount, date, item, extra = {}) => ({
    id, category, amount, date, item, seasonId: 's-now', note: '', createdAt: now, ...extra,
  })
  const transactions = [
    tx('t1', 'seeds', 3400, d(y, 6, 5), 'Certified seeds (2 bags)', { qty: 2, unit: 'bags' }),
    tx('t2', 'landprep', 6000, d(y, 6, 7), 'Plowing & harrowing'),
    tx('t3', 'tool_rent', 3000, d(y, 6, 7), 'Hand tractor rental'),
    tx('t4', 'labor', 7500, d(y, 7, 1), 'Transplanting (10 workers)'),
    tx('t5', 'fertilizer', 9600, d(y, 7, 3), 'Complete 14-14-14', { qty: 6, unit: 'bags' }),
    tx('t6', 'tool_buy', 2800, d(y, 7, 10), 'Knapsack sprayer'),
    tx('t7', 'fertilizer', 6400, d(y, 7, 28), 'Urea 46-0-0', { qty: 4, unit: 'bags' }),
    tx('t8', 'water', 2400, d(y, 8, 2), 'Irrigation fee (NIA)'),
    tx('t9', 'pesticide', 1850, d(y, 8, 14), 'Bt biopesticide'),
    tx('t10', 'fuel', 1200, d(y, 8, 20), 'Diesel for water pump'),
    tx('t11', 'tool_buy', 450, d(y, 8, 22), 'Bolo (itak)'),
    tx('t12', 'tool_repair', 650, d(y, 9, 3), 'Water pump repair'),
    tx('t13', 'labor', 2000, d(y, 9, 10), 'Weeding'),
    tx('t14', 'other_income', 1500, d(y, 9, 15), 'Vegetables from dike'),
  ]

  const anomalies = [
    {
      id: 'a1', date: d(y, 7, 25), crop: 'rice', seasonId: 's-now',
      symptoms: ['yellow_old', 'stunted'], severity: 'medium',
      note: 'Lower leaves pale in the east side of the field.',
      conditionIds: ['nitrogen_def', 'poor_soil'], status: 'resolved', photo: null, createdAt: now,
    },
    {
      id: 'a2', date: d(y, 9, 12), crop: 'rice', seasonId: 's-now',
      symptoms: ['holes'], severity: 'low',
      note: 'A few chewed leaves near the canal.',
      conditionIds: ['armyworm', 'fruit_borer'], status: 'open', photo: null, createdAt: now,
    },
  ]

  return { seasons, transactions, anomalies }
}
