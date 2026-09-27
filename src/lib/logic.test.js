import { describe, expect, it } from 'vitest'
import { analyzeSeasons, quadraticPeak } from './analysis.js'
import { seasonStats, totals } from './calc.js'
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

  it('works with the sample data', () => {
    const { seasons, transactions } = makeSampleData()
    const a = analyzeSeasons(seasons, transactions, 'rice')
    expect(a.points).toHaveLength(4)
    expect(a.best.bags).toBe(10)
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
