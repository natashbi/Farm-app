import { describe, expect, it } from 'vitest'
import { analyzeSeasons, quadraticPeak } from './analysis.js'
import { plantingProgress, seasonHarvest, seasonStats, totals } from './calc.js'
import { buildReport, scopeRecords } from './report.js'
import { hashPin, sha256 } from './sha256.js'
import { diagnose } from '../data/cropDoctor.js'
import { normalize } from '../store.jsx'
import { makeSampleData } from '../data/sample.js'

const season = (id, bags, harvest, extra = {}) => ({
  id,
  name: id,
  crop: 'rice',
  status: 'completed',
  startDate: `2024-0${id.length}-01`,
  fertilizerBags: bags,
  harvestQty: harvest,
  harvestUnit: 'cavans',
  area: '',
  ...extra,
})

describe('totals', () => {
  it('splits production, tools and income', () => {
    const t = totals([
      { category: 'fertilizer', amount: 1000 },
      { category: 'tool_buy', amount: 500 },
      { category: 'harvest_sale', amount: 4000 },
    ])
    expect(t).toMatchObject({ production: 1000, tools: 500, income: 4000, cost: 1500, profit: 2500 })
  })
})

describe('seasonStats', () => {
  it('prefers totals typed by hand over budget records', () => {
    const tx = [{ category: 'seeds', amount: 300, seasonId: 's1' }]
    expect(seasonStats({ id: 's1', totalCost: 1000, totalIncome: '' }, tx)).toMatchObject({ cost: 1000, income: 0, profit: -1000 })
    expect(seasonStats({ id: 's1', totalCost: '', totalIncome: '' }, tx)).toMatchObject({ cost: 300, costFromLedger: true })
  })
})

describe('analyzeSeasons', () => {
  it('finds the fertilizer amount behind the best harvest (10 bags -> 150 beats 20 bags -> 100)', () => {
    const a = analyzeSeasons([season('a', 10, 150), season('bb', 20, 100)], [], 'rice')
    expect(a.best.season.id).toBe('a')
    expect(a.best.fert).toBe(10)
    expect(a.insights[0].tone).toBe('warn')
    expect(a.insights[0].text).toMatch(/More fertilizer did not mean more harvest/)
    // Latest season used too much — suggest going back down.
    expect(a.insights.some((i) => i.tone === 'tip' && /about 10 bags/.test(i.text))).toBe(true)
  })

  it('compares per hectare when every season has an area', () => {
    const a = analyzeSeasons([season('a', 10, 150, { area: 2 }), season('bb', 6, 100, { area: 1 })], [], 'rice')
    expect(a.perHa).toBe(true)
    expect(a.best.season.id).toBe('bb') // 100/ha beats 75/ha
  })

  it('ignores active seasons, other crops and other units', () => {
    const a = analyzeSeasons(
      [
        season('a', 10, 150),
        season('bb', 12, 140, { status: 'active' }),
        season('ccc', 12, 140, { crop: 'corn' }),
        season('dddd', 12, 3000, { harvestUnit: 'kg' }),
      ],
      [],
      'rice',
    )
    expect(a.points).toHaveLength(1)
    expect(a.skippedUnits).toBe(1)
  })

  it('compares fertilizer types and costs', () => {
    const { seasons, transactions, harvests } = makeSampleData()
    const a = analyzeSeasons(seasons, transactions, 'rice', harvests)
    expect(a.byType[0].type).toBe('Complete 14-14-14 + Urea')
    expect(a.byType).toHaveLength(3)
    expect(a.points.every((p) => p.fertCost > 0)).toBe(true)
    expect(a.insights.some((i) => /Best fertilizer type/.test(i.text))).toBe(true)
  })

  it('works with the sample data (harvest logs count as the harvest)', () => {
    const { seasons, transactions, harvests } = makeSampleData()
    const a = analyzeSeasons(seasons, transactions, 'rice', harvests)
    expect(a.points).toHaveLength(5)
    expect(a.perHa).toBe(true)
    expect(a.best.bags).toBe(40) // Lote 1: 40 bags on 6 ha -> 600 cavans
  })
})

describe('quadraticPeak', () => {
  it('finds the top of a bending curve', () => {
    const pts = [2, 4, 6, 8, 10].map((x) => ({ fert: x, yield: 100 - (x - 6) ** 2 }))
    expect(quadraticPeak(pts)).toBeCloseTo(6, 5)
  })
  it('returns null when the harvest keeps rising', () => {
    const pts = [2, 4, 6].map((x) => ({ fert: x, yield: x * 10 }))
    expect(quadraticPeak(pts)).toBeNull()
  })
})

describe('diagnose', () => {
  it('ranks nitrogen deficiency first for yellow old leaves', () => {
    const r = diagnose('rice', ['yellow_old', 'stunted'])
    expect(r[0].condition.id).toBe('nitrogen_def')
    expect(r[0].level).toBe('strong')
  })
  it('suggests fall armyworm for sawdust in corn whorl', () => {
    expect(diagnose('corn', ['sawdust_whorl', 'holes'])[0].condition.id).toBe('armyworm')
  })
  it('does not suggest rice-only problems for vegetables', () => {
    const ids = diagnose('vegetables', ['stunted']).map((r) => r.condition.id)
    expect(ids).not.toContain('tungro')
  })
  it('returns nothing without symptoms', () => {
    expect(diagnose('rice', [])).toEqual([])
  })
})

describe('normalize (backup import)', () => {
  it('rejects junk and keeps valid records', () => {
    expect(() => normalize(null)).toThrow()
    const d = normalize({ seasons: [{ id: 'x' }, null, 'bad'], transactions: 'nope' })
    expect(d.seasons).toHaveLength(1)
    expect(d.transactions).toEqual([])
  })
})

describe('harvest logs', () => {
  it('adds up harvest batches of a planting', () => {
    const s = { id: 's1', harvestUnit: 'cavans', harvestQty: 99 }
    const logs = [
      { seasonId: 's1', qty: 250, unit: 'cavans' },
      { seasonId: 's1', qty: 130, unit: 'cavans' },
      { seasonId: 's2', qty: 999, unit: 'cavans' },
    ]
    expect(seasonHarvest(s, logs)).toMatchObject({ qty: 380, fromLog: true, count: 2 })
    expect(seasonHarvest(s, [])).toMatchObject({ qty: 99, fromLog: false })
  })
})

describe('planting and harvest date monitoring', () => {
  it('counts days after planting and days to the expected harvest', () => {
    const p = plantingProgress({ startDate: '2026-06-01', status: 'active' }, '2026-09-01', 115)
    expect(p.dap).toBe(92)
    expect(p.expected).toBe('2026-09-24')
    expect(p.daysLeft).toBe(23)
    expect(p.stage).toBe('growing')
  })
  it('uses the target harvest date when set and flags late harvests', () => {
    const p = plantingProgress({ startDate: '2026-06-01', harvestDate: '2026-09-10', status: 'active' }, '2026-09-15', 115)
    expect(p.estimated).toBe(false)
    expect(p.stage).toBe('overdue')
  })
})

describe('reports', () => {
  it('expense categories add up to the report total', () => {
    const data = makeSampleData()
    const state = { ...data, profile: {} }
    const scope = scopeRecords(state)
    const r = buildReport(state, scope)
    const sum = r.categories.reduce((x, c) => x + c.total, 0)
    expect(sum).toBe(r.cost)
    expect(r.fieldRows).toHaveLength(3)
    expect(r.mainUnit).toBe('cavans')
  })
  it('filters by field and season', () => {
    const data = makeSampleData()
    const state = { ...data, profile: {} }
    const lote1 = scopeRecords(state, { field: 'f-1' })
    expect(lote1.seasons.every((s) => s.fieldId === 'f-1')).toBe(true)
    expect(lote1.transactions.some((t) => !t.seasonId)).toBe(false) // farm-wide costs only in "all fields"
  })
})

describe('app lock PIN', () => {
  it('hashes with SHA-256 (standard test vector)', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
  it('never stores the PIN itself and depends on the salt', () => {
    expect(hashPin('1234', 'a')).not.toContain('1234')
    expect(hashPin('1234', 'a')).not.toBe(hashPin('1234', 'b'))
  })
})
