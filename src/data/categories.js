// Budget categories. `group` decides which total an entry counts toward:
//   production -> production cost, tools -> tools & equipment cost, income -> sales.
export const CATEGORIES = [
  { id: 'seeds', label: 'Seeds', tl: 'Binhi', emoji: '🌱', group: 'production' },
  { id: 'fertilizer', label: 'Fertilizer', tl: 'Abono', emoji: '🧪', group: 'production', unit: 'bags' },
  { id: 'pesticide', label: 'Pesticide', tl: 'Pamatay-peste', emoji: '🐛', group: 'production' },
  { id: 'labor', label: 'Labor', tl: 'Upa sa trabahador', emoji: '👩‍🌾', group: 'production' },
  { id: 'landprep', label: 'Land prep', tl: 'Araro / Paghahanda', emoji: '🚜', group: 'production' },
  { id: 'water', label: 'Irrigation', tl: 'Patubig', emoji: '💧', group: 'production' },
  { id: 'fuel', label: 'Fuel', tl: 'Gasolina / Krudo', emoji: '⛽', group: 'production' },
  { id: 'rent', label: 'Land rent', tl: 'Upa sa lupa', emoji: '🏞️', group: 'production' },
  { id: 'transport', label: 'Hauling', tl: 'Hakot / Biyahe', emoji: '🚚', group: 'production' },
  { id: 'other_cost', label: 'Other cost', tl: 'Iba pang gastos', emoji: '🧾', group: 'production' },
  { id: 'tool_buy', label: 'Tools bought', tl: 'Biniling gamit', emoji: '🛠️', group: 'tools' },
  { id: 'tool_rent', label: 'Tools rented', tl: 'Inupahang gamit', emoji: '🔑', group: 'tools' },
  { id: 'tool_repair', label: 'Repairs', tl: 'Pagkumpuni', emoji: '🔧', group: 'tools' },
  { id: 'harvest_sale', label: 'Harvest sale', tl: 'Benta ng ani', emoji: '🌾', group: 'income' },
  { id: 'other_income', label: 'Other income', tl: 'Ibang kita', emoji: '💰', group: 'income' },
]

export const GROUPS = {
  production: { label: 'Production cost', tl: 'Gastos sa produksyon' },
  tools: { label: 'Tools & equipment', tl: 'Gamit at makinarya' },
  income: { label: 'Income', tl: 'Kita' },
}

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id) {
  return byId[id] || { id, label: id, tl: '', emoji: '🧾', group: 'production' }
}

export const CROPS = [
  { id: 'rice', label: 'Rice', tl: 'Palay', emoji: '🌾' },
  { id: 'corn', label: 'Corn', tl: 'Mais', emoji: '🌽' },
  { id: 'vegetables', label: 'Vegetables', tl: 'Gulay', emoji: '🥬' },
  { id: 'root', label: 'Root crops', tl: 'Kamote / Kamoteng kahoy', emoji: '🍠' },
  { id: 'fruit', label: 'Fruit trees', tl: 'Prutas / Saging', emoji: '🍌' },
]

const cropById = Object.fromEntries(CROPS.map((c) => [c.id, c]))

export function getCrop(id) {
  return cropById[id] || { id, label: id || 'Crop', tl: '', emoji: '🌿' }
}

export const HARVEST_UNITS = ['cavans', 'sacks', 'kg', 'tons', 'pieces']
