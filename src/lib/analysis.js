import { seasonBags, seasonFertilizer, seasonHarvest, seasonLabel, seasonStats } from './calc.js'
import { num, peso } from './format.js'

const round1 = (n) => Math.round(n * 10) / 10
const roundHalf = (n) => Math.round(n * 2) / 2
const sum = (list) => list.reduce((s, x) => s + x, 0)
const avg = (list) => sum(list) / list.length

const NEAR_TOP = 0.97
const CLOSE = 0.9
const UNIT_TL = { cavans: 'kaban', sacks: 'sako', kg: 'kilo', tons: 'tonelada', pieces: 'piraso' }

export function brandKey(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
}

const dateOf = (p) => p.season.harvestDate || p.season.startDate || ''
const similar = (a, b) => Math.abs(a - b) <= Math.max(a, b) * 0.15
const better = (a, b) => a.yield > b.yield || (a.yield === b.yield && (a.fert < b.fert || (a.fert === b.fert && dateOf(a) > dateOf(b))))
const top = (list) => list.reduce((a, b) => (better(b, a) ? b : a))
const lowest = (list) => (list.length ? list.reduce((a, b) => (b.yield < a.yield ? b : a)) : null)
const pick = (list, score) => list.reduce((a, b) => (a && score(a) >= score(b) ? a : b), null)

function frugal(list) {
  const peak = top(list)
  return list
    .filter((p) => p.yield >= peak.yield * NEAR_TOP)
    .reduce((a, b) => (b.fert < a.fert || (b.fert === a.fert && better(b, a)) ? b : a))
}

function words(unit, perHa) {
  const n1 = (n) => num(round1(n))
  return {
    n1,
    bags: (n) => `${n1(n)} bag${round1(n) === 1 ? '' : 's'}`,
    sako: (n) => `${n1(n)} sako`,
    qty: (n) => `${num(n)} ${unit}`,
    qtyTl: (n) => `${num(n)} ${UNIT_TL[unit] || unit}`,
    rate: perHa ? ' per hectare' : '',
    rateTl: perHa ? ' bawat ektarya' : '',
  }
}

function spelling(list) {
  const seen = new Map()
  list.forEach((p, i) => seen.set(p.type, { n: (seen.get(p.type)?.n || 0) + 1, i }))
  return [...seen.entries()].sort(([a, x], [b, y]) => y.n - x.n || /[A-Z]/.test(b) - /[A-Z]/.test(a) || y.i - x.i)[0][0]
}

function brandSummary(points) {
  const groups = new Map()
  for (const p of points) {
    if (!p.brandKey) continue
    if (!groups.has(p.brandKey)) groups.set(p.brandKey, [])
    groups.get(p.brandKey).push(p)
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const bags = sum(list.map((p) => p.bags))
      const priced = list.filter((p) => p.fertCost !== null && p.bags > 0)
      return {
        key,
        name: spelling(list),
        points: list,
        seasons: list.length,
        peak: top(list),
        best: frugal(list),
        perBag: bags > 0 ? sum(list.map((p) => p.harvest)) / bags : null,
        costPerBag: priced.length ? sum(priced.map((p) => p.fertCost)) / sum(priced.map((p) => p.bags)) : null,
        costPerArea: priced.length ? avg(priced.map((p) => p.fertCostPerArea)) : null,
      }
    })
    .sort((a, b) => (better(a.peak, b.peak) ? -1 : better(b.peak, a.peak) ? 1 : 0))
}

function brandReasons(R, O, best, w, label, detailed) {
  const pairs = R.points.flatMap((r) => O.points.map((o) => ({ r, o })))
  const same = pick(
    pairs.filter(({ r, o }) => similar(r.fert, o.fert) && r.yield > o.yield),
    ({ r, o }) => r.yield - o.yield,
  )
  const less = pick(
    pairs.filter(({ r, o }) => r.fert < o.fert * 0.9 && r.yield > o.yield),
    ({ r, o }) => (o.fert - r.fert) / o.fert + (r.yield - o.yield) / r.yield,
  )
  const against = pick(
    pairs.filter(({ r, o }) => (similar(r.fert, o.fert) || o.fert < r.fert) && o.yield > r.yield),
    ({ r, o }) => o.yield - r.yield,
  )
  const out = []

  if (same) {
    const { r, o } = same
    const equal = round1(r.fert) === round1(o.fert)
    out.push({
      tone: 'good',
      kind: 'brand-same',
      text: `${equal ? `With the same ${w.bags(r.fert)}${w.rate}` : `With about the same fertilizer (${w.n1(r.fert)} and ${w.bags(o.fert)}${w.rate})`}, ${R.name} harvested ${w.qty(r.yield)} but ${O.name} only ${num(o.yield)}.`,
      tl: `${equal ? `Sa parehong ${w.sako(r.fert)}` : `Sa halos parehong dami ng abono (${w.n1(r.fert)} at ${w.sako(o.fert)})`}, ${w.qtyTl(r.yield)} ang ani sa ${R.name} pero ${num(o.yield)} lang sa ${O.name}.`,
    })
  }
  if (less && (detailed || !same)) {
    const { r, o } = less
    out.push({
      tone: 'good',
      kind: 'brand-less',
      text: `Even with fewer bags, ${R.name} did better: ${w.bags(r.fert)}${w.rate} gave ${w.qty(r.yield)}, while ${w.bags(o.fert)} of ${O.name} gave only ${num(o.yield)}.`,
      tl: `Kahit mas kaunting sako, mas mataas ang ani sa ${R.name}: ${w.sako(r.fert)} → ${w.qtyTl(r.yield)}, pero ${w.sako(o.fert)} ng ${O.name} → ${num(o.yield)} lang.`,
    })
  }
  if (!same && !less) {
    const r = R.peak
    const o = O.peak
    out.push({
      tone: 'good',
      kind: 'brand-best',
      text: `${R.name} gave your biggest harvest: ${w.qty(r.yield)} with ${w.bags(r.fert)}${w.rate}. With ${O.name}, the most was ${num(o.yield)} using ${w.bags(o.fert)}.`,
      tl: `Pinakamataas ang ani sa ${R.name}: ${w.qtyTl(r.yield)} sa ${w.sako(r.fert)}. Sa ${O.name}, ${num(o.yield)} lang ang pinakamataas (${w.sako(o.fert)}).`,
    })
  }

  const o = O.peak
  if (o.yield >= best.yield * CLOSE) {
    if (o.fert <= best.fert * 0.8) {
      out.push({
        tone: 'tip',
        kind: 'brand-close',
        text: `${O.name} came close with fewer bags: ${w.bags(o.fert)}${w.rate} gave ${w.qty(o.yield)}. Try it again to see if it saves you money.`,
        tl: `Malapit din ang ${O.name} kahit mas kaunting sako: ${w.sako(o.fert)} → ${w.qtyTl(o.yield)}. Subukan ulit para makita kung makakatipid.`,
      })
    } else if (o.fertCostPerArea !== null && best.fertCostPerArea !== null && o.fertCostPerArea <= best.fertCostPerArea * 0.8) {
      const cost = (p) => peso(Math.round(p.fertCostPerArea))
      out.push({
        tone: 'tip',
        kind: 'brand-close',
        text: `${O.name} came close for less money: ${w.qty(o.yield)} with ${cost(o)} of fertilizer${w.rate}, compared with ${cost(best)} for ${R.name}.`,
        tl: `Malapit din ang ${O.name} at mas mura: ${w.qtyTl(o.yield)} sa ${cost(o)} na abono, kumpara sa ${cost(best)} ng ${R.name}.`,
      })
    }
  }

  if (against) {
    const { r, o: other } = against
    out.push({
      tone: 'info',
      kind: 'brand-mixed',
      text: `Not every season agrees: in ${label(other.season)}, ${O.name} gave ${w.qty(other.yield)} with ${w.bags(other.fert)}, more than ${R.name} with ${w.bags(r.fert)} (${num(r.yield)}). Keep comparing.`,
      tl: `Hindi palaging ganito: noong ${label(other.season)}, ${num(other.yield)} ang ani sa ${O.name} (${w.sako(other.fert)}), mas mataas kaysa sa ${R.name} (${num(r.yield)}).`,
    })
  }
  return out
}

export function analyzeSeasons(seasons, transactions, cropId, harvests = [], label = (season) => season.name) {
  const excluded = []
  const done = []
  for (const s of seasons) {
    if (s.crop !== cropId || s.status !== 'completed') continue
    const bags = seasonBags(s, transactions)
    if (!(seasonHarvest(s, harvests).qty > 0)) excluded.push({ season: s, reason: 'no-harvest' })
    else if (bags === null || bags < 0) excluded.push({ season: s, reason: 'no-bags' })
    else done.push(s)
  }

  const unitCounts = {}
  const unitOf = (s) => seasonHarvest(s, harvests).unit
  for (const s of done) unitCounts[unitOf(s)] = (unitCounts[unitOf(s)] || 0) + 1
  const unit = Object.keys(unitCounts).sort((a, b) => unitCounts[b] - unitCounts[a])[0] || 'cavans'
  const usable = done.filter((s) => unitOf(s) === unit)
  const skippedUnits = done.length - usable.length
  for (const s of done) if (unitOf(s) !== unit) excluded.push({ season: s, reason: 'unit', unit: unitOf(s) })

  const perHa = usable.length > 0 && usable.every((s) => Number(s.area) > 0)
  const points = usable
    .map((s) => {
      const area = perHa ? Number(s.area) : 1
      const bags = seasonBags(s, transactions)
      const harvest = seasonHarvest(s, harvests).qty
      const stats = seasonStats(s, transactions, harvests)
      const fertilizer = seasonFertilizer(s, transactions)
      return {
        season: s,
        fert: bags / area,
        yield: harvest / area,
        bags,
        harvest,
        type: fertilizer.type,
        brandKey: brandKey(fertilizer.type),
        fertCost: fertilizer.cost,
        fertCostPerArea: fertilizer.cost !== null ? fertilizer.cost / area : null,
        fertCostPerUnit: fertilizer.cost !== null && harvest > 0 ? fertilizer.cost / harvest : null,
        perBag: bags > 0 ? harvest / bags : null,
        profit: stats.cost || stats.income ? stats.profit : null,
      }
    })
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)))

  const result = {
    unit,
    perHa,
    points,
    skippedUnits,
    excluded,
    best: null,
    brands: [],
    recommendation: null,
    sweetSpot: null,
    insights: [],
  }
  if (!points.length) return result

  const w = words(unit, perHa)
  const brands = brandSummary(points)
  const peak = top(points)
  const group = points.filter((p) => p.brandKey === peak.brandKey)
  const best = frugal(group)
  const R = peak.brandKey ? brands.find((b) => b.key === peak.brandKey) : null
  result.brands = brands
  result.best = best
  result.sweetSpot = quadraticPeak(group)

  const rec = {
    brand: R ? R.name : '',
    brandKey: best.brandKey,
    fert: best.fert,
    point: best,
    peak,
    text: R ? `Use ${R.name}, about ${w.bags(best.fert)}${w.rate}.` : `Use about ${w.bags(best.fert)}${w.rate}.`,
    tl: R ? `Gamitin ang ${R.name}, mga ${w.sako(best.fert)}${w.rateTl}.` : `Gumamit ng mga ${w.sako(best.fert)}${w.rateTl}.`,
    reasons: [],
    note: `Based on ${points.length} finished season${points.length === 1 ? '' : 's'}. Weather, pests, water and the field also change the harvest, so keep recording every season.`,
  }
  result.recommendation = rec

  if (points.length < 2) {
    result.insights.push({
      tone: 'info',
      kind: 'one-season',
      text: 'Add at least one more finished season of this crop so the app can compare what worked best.',
    })
    return result
  }

  if (R) {
    brands
      .filter((b) => b !== R)
      .slice(0, 2)
      .forEach((O, i) => rec.reasons.push(...brandReasons(R, O, best, w, label, i === 0)))
  }

  const of = R ? ` of ${R.name}` : ''
  const ng = R ? ` ng ${R.name}` : ''
  if (best !== peak) {
    rec.reasons.push({
      tone: 'tip',
      kind: 'amount-more',
      text: `${w.bags(peak.fert)}${of} gave ${w.qty(peak.yield)}, almost the same as ${w.bags(best.fert)} (${num(best.yield)}). The extra bags are not worth the money.`,
      tl: `Halos pareho ang ani sa ${w.sako(peak.fert)}${ng} (${num(peak.yield)}) at sa ${w.sako(best.fert)} (${num(best.yield)}). Sayang ang dagdag na sako.`,
    })
  } else {
    const more = lowest(group.filter((p) => p.fert > best.fert * 1.1))
    if (more) {
      rec.reasons.push({
        tone: 'warn',
        kind: 'more-not-better',
        text: `More fertilizer did not mean more harvest: ${w.bags(more.fert)}${of} gave ${w.qty(more.yield)}, ${more.yield < best.yield ? 'less than' : 'no more than'} ${w.bags(best.fert)} (${num(best.yield)}).`,
        tl: `Hindi lumaki ang ani sa dagdag na abono: ${w.sako(more.fert)}${ng} → ${w.qtyTl(more.yield)} lang, kumpara sa ${num(best.yield)} sa ${w.sako(best.fert)}.`,
      })
    }
  }
  const less = lowest(group.filter((p) => p.fert < best.fert * 0.9))
  if (less) {
    rec.reasons.push({
      tone: 'tip',
      kind: 'amount-less',
      text: `Using less cut your harvest: ${w.bags(less.fert)}${of} gave only ${w.qty(less.yield)}. Stay near ${w.bags(best.fert)}${w.rate}.`,
      tl: `Kulang ang ${w.sako(less.fert)}${ng}: ${w.qtyTl(less.yield)} lang ang ani. Manatili sa mga ${w.sako(best.fert)}${w.rateTl}.`,
    })
  }

  const latest = points.at(-1)
  if (latest !== best) {
    if (R && latest.brandKey && latest.brandKey !== R.key) {
      if (latest.yield < best.yield * CLOSE) {
        result.insights.push({
          tone: 'tip',
          kind: 'latest',
          text: `Your latest season (${label(latest.season)}) used ${latest.type} and harvested ${w.qty(latest.yield)}. Go back to ${R.name}, about ${w.bags(best.fert)}${w.rate}.`,
          tl: `Noong huling season, ${latest.type} ang ginamit at ${w.qtyTl(latest.yield)} lang ang ani. Bumalik sa ${R.name}, mga ${w.sako(best.fert)}${w.rateTl}.`,
        })
      }
    } else if (latest.fert > best.fert * 1.15) {
      result.insights.push({
        tone: 'tip',
        kind: 'latest',
        text: `Your latest season (${label(latest.season)}) used ${w.bags(latest.fert)}${w.rate}. Try about ${w.bags(best.fert)}${w.rate}: it ${best === peak ? 'gave your best harvest' : 'gave about the same harvest'} for less money.`,
        tl: `Noong huling season, ${w.sako(latest.fert)} ang ginamit. Subukan ang mga ${w.sako(best.fert)}${w.rateTl}: mas tipid at ${best === peak ? 'mas mataas ang ani' : 'halos pareho ang ani'}.`,
      })
    } else if (latest.fert < best.fert * 0.85 && latest.yield < best.yield) {
      result.insights.push({
        tone: 'tip',
        kind: 'latest',
        text: `Your latest season used ${w.bags(latest.fert)}${w.rate} and harvested less than your best. Try about ${w.bags(best.fert)}${w.rate}.`,
        tl: `Kulang ang ${w.sako(latest.fert)} noong huling season. Subukan ang mga ${w.sako(best.fert)}${w.rateTl}.`,
      })
    } else if (latest.yield < best.yield * NEAR_TOP) {
      result.insights.push({
        tone: 'info',
        kind: 'latest',
        text: 'Your latest season used about the same fertilizer as your best season, so the lower harvest may come from the field, pests, weather, water or seed. Check the Crop Doctor log.',
        tl: 'Halos pareho ang abono sa pinakamagandang season, kaya baka galing ang mas mababang ani sa lote, peste, panahon, tubig o binhi.',
      })
    }
  }

  if (!R && brands.length >= 2) {
    const b = brands[0]
    result.insights.push({
      tone: 'good',
      kind: 'brand-top',
      text: `Of the brands you wrote down, ${b.name} did best: ${w.qty(b.peak.yield)} with ${w.bags(b.peak.fert)}${w.rate}.`,
    })
  }

  let worst = null
  for (const lo of points) {
    for (const hi of points) {
      if (lo.brandKey !== hi.brandKey || lo.brandKey === best.brandKey) continue
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
      kind: 'more-not-better',
      text: `More ${hi.type || 'fertilizer'} did not mean more harvest: ${label(hi.season)} used ${w.bags(hi.fert)}${w.rate} but harvested ${w.qty(hi.yield)}, while ${label(lo.season)} used only ${w.bags(lo.fert)} and harvested ${num(lo.yield)}.`,
    })
  }

  if (points.some((p) => !p.brandKey) && brands.length < 2) {
    result.insights.push({
      tone: 'info',
      kind: 'brand-missing',
      text: 'Write the fertilizer brand in each planting. Then the app can tell you which brand gives the biggest harvest.',
      tl: 'Isulat ang brand ng abono sa bawat tanim para malaman kung aling brand ang pinakamabisa.',
    })
  }

  const withCost = points.filter((p) => p.fertCostPerUnit !== null)
  if (withCost.length >= 2) {
    const cheap = withCost.reduce((a, b) => (b.fertCostPerUnit < a.fertCostPerUnit ? b : a))
    const dear = withCost.reduce((a, b) => (b.fertCostPerUnit > a.fertCostPerUnit ? b : a))
    const tag = (p) => `${p.type ? `${p.type}, ` : ''}₱${num(p.fertCostPerUnit, 0)}`
    result.insights.push({
      tone: 'tip',
      kind: 'cost',
      text: `Fertilizer cost per ${unit.replace(/s$/, '')}: lowest in ${label(cheap.season)} (${tag(cheap)}), highest in ${label(dear.season)} (${tag(dear)}).`,
    })
  }

  const withProfit = points.filter((p) => p.profit !== null)
  if (withProfit.length >= 2) {
    const most = withProfit.reduce((a, b) => (b.profit > a.profit ? b : a))
    result.insights.push({ tone: 'good', kind: 'profit', text: `Most profitable season: ${label(most.season)}.`, profitSeason: most.season.id })
  }

  return result
}

export function fertilizerAdvice(state, cropId) {
  const fieldsById = Object.fromEntries(state.fields.map((f) => [f.id, f]))
  const analysis = analyzeSeasons(state.seasons, state.transactions, cropId, state.harvests, (s) => seasonLabel(s, fieldsById))
  return analysis.points.length >= 2 ? analysis : null
}

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
