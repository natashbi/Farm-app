import { seasonHarvest, seasonStats } from './calc.js'
import { num } from './format.js'

const round1 = (n) => Math.round(n * 10) / 10
const roundHalf = (n) => Math.round(n * 2) / 2

/**
 * Compare past seasons of one crop to find how much fertilizer gave the best
 * harvest. When every season has a field area, values are per hectare so
 * seasons with different field sizes are fair to compare.
 */
export function analyzeSeasons(seasons, transactions, cropId, harvests = [], label = (season) => season.name) {
  const done = seasons.filter(
    (s) =>
      s.crop === cropId &&
      s.status === 'completed' &&
      seasonHarvest(s, harvests).qty > 0 &&
      s.fertilizerBags !== '' &&
      s.fertilizerBags !== null &&
      s.fertilizerBags !== undefined &&
      Number(s.fertilizerBags) >= 0,
  )

  // Compare like with like: use the most common harvest unit.
  const unitCounts = {}
  const unitOf = (s) => seasonHarvest(s, harvests).unit
  for (const s of done) unitCounts[unitOf(s)] = (unitCounts[unitOf(s)] || 0) + 1
  const unit = Object.keys(unitCounts).sort((a, b) => unitCounts[b] - unitCounts[a])[0] || 'cavans'
  const usable = done.filter((s) => unitOf(s) === unit)
  const skippedUnits = done.length - usable.length

  const perHa = usable.length > 0 && usable.every((s) => Number(s.area) > 0)
  const points = usable
    .map((s) => {
      const area = perHa ? Number(s.area) : 1
      const bags = Number(s.fertilizerBags)
      const harvest = seasonHarvest(s, harvests).qty
      const stats = seasonStats(s, transactions, harvests)
      return {
        season: s,
        fert: bags / area,
        yield: harvest / area,
        bags,
        harvest,
        perBag: bags > 0 ? harvest / bags : null,
        profit: stats.cost || stats.income ? stats.profit : null,
      }
    })
    .sort((a, b) => (a.season.harvestDate || a.season.startDate || '').localeCompare(b.season.harvestDate || b.season.startDate || ''))

  const result = {
    unit,
    perHa,
    points,
    skippedUnits,
    best: null,
    goodRange: null,
    sweetSpot: null,
    insights: [],
  }
  if (!points.length) return result

  const best = points.reduce((a, b) => (b.yield > a.yield || (b.yield === a.yield && b.fert < a.fert) ? b : a))
  result.best = best

  const good = points.filter((p) => p.yield >= best.yield * 0.9)
  result.goodRange = [Math.min(...good.map((p) => p.fert)), Math.max(...good.map((p) => p.fert))]
  result.sweetSpot = quadraticPeak(points)

  const rate = perHa ? ' per hectare' : ''
  const bagsTxt = (n) => `${num(n)} bag${n === 1 ? '' : 's'}`

  if (points.length < 2) {
    result.insights.push({
      tone: 'info',
      text: 'Add at least one more finished season of this crop so the app can compare what worked best.',
    })
    return result
  }

  // 1. More fertilizer but a smaller harvest — the clearest lesson in the data.
  let worst = null
  for (const lo of points) {
    for (const hi of points) {
      if (hi.fert > lo.fert * 1.1 && hi.yield < lo.yield) {
        const gap = (hi.fert - lo.fert) / Math.max(lo.fert, 0.1) + (lo.yield - hi.yield) / lo.yield
        if (!worst || gap > worst.gap) worst = { lo, hi, gap }
      }
    }
  }
  if (worst) {
    const { lo, hi } = worst
    result.insights.push({
      tone: 'warn',
      text: `More fertilizer did not mean more harvest: ${label(hi.season)} used ${bagsTxt(round1(hi.fert))}${rate} but harvested ${num(hi.yield)} ${unit}, while ${label(lo.season)} used only ${bagsTxt(round1(lo.fert))} and harvested ${num(lo.yield)} ${unit}.`,
    })
  }

  // 2. Latest season vs the best one.
  const latest = points[points.length - 1]
  if (latest !== best) {
    if (latest.fert > best.fert * 1.15) {
      result.insights.push({
        tone: 'tip',
        text: `Your latest season (${label(latest.season)}) used ${bagsTxt(round1(latest.fert))}${rate}. Try going back to about ${bagsTxt(round1(best.fert))}${rate} — it saves money and gave your best harvest.`,
      })
    } else if (latest.fert < best.fert * 0.85) {
      result.insights.push({
        tone: 'tip',
        text: `Your latest season used ${bagsTxt(round1(latest.fert))}${rate} and harvested less than your best. Try about ${bagsTxt(round1(best.fert))}${rate}.`,
      })
    } else {
      result.insights.push({
        tone: 'info',
        text: `Your latest season used a similar amount of fertilizer as your best season, so the harvest gap may come from pests, weather, water or seed. Check the Crop Doctor log.`,
      })
    }
  }

  // 3. Harvest per bag of fertilizer.
  const withBags = points.filter((p) => p.perBag !== null)
  if (withBags.length >= 2) {
    const eff = withBags.reduce((a, b) => (b.perBag > a.perBag ? b : a))
    result.insights.push({
      tone: 'good',
      text: `Best return on fertilizer: ${label(eff.season)} — ${num(eff.perBag)} ${unit} for every bag used.`,
    })
  }

  // 4. Most profitable.
  const withProfit = points.filter((p) => p.profit !== null)
  if (withProfit.length >= 2) {
    const top = withProfit.reduce((a, b) => (b.profit > a.profit ? b : a))
    result.insights.push({ tone: 'good', text: `Most profitable season: ${label(top.season)}.`, profitSeason: top.season.id })
  }

  return result
}

// Least-squares fit harvest = a + b·fert + c·fert². When the curve bends down
// inside the recorded range, its top is an estimated "sweet spot".
export function quadraticPeak(points) {
  const xs = [...new Set(points.map((p) => round1(p.fert)))]
  if (points.length < 3 || xs.length < 3) return null
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0
  for (const { fert: x, yield: y } of points) {
    s0 += 1; s1 += x; s2 += x * x; s3 += x ** 3; s4 += x ** 4
    t0 += y; t1 += x * y; t2 += x * x * y
  }
  const det = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const M = [[s0, s1, s2], [s1, s2, s3], [s2, s3, s4]]
  const D = det(M)
  if (Math.abs(D) < 1e-9) return null
  const col = (i, v) => M.map((row, r) => row.map((val, c) => (c === i ? v[r] : val)))
  const T = [t0, t1, t2]
  const b = det(col(1, T)) / D
  const c = det(col(2, T)) / D
  if (c >= 0) return null
  const x = -b / (2 * c)
  const lo = Math.min(...points.map((p) => p.fert))
  const hi = Math.max(...points.map((p) => p.fert))
  return x >= lo && x <= hi ? x : null
}

export { round1, roundHalf }
