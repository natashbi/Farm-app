import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { makeSampleData } from './data/sample.js'
import { uid } from './lib/format.js'

const KEY = 'sakahan-farm-budget-v1'

// seasons = plantings: one crop cycle on one field (planting → harvest).
export const EMPTY = {
  version: 2,
  profile: { name: '', farm: '', onboarded: false, pinHash: '', pinSalt: '', tlGuide: true },
  fields: [],
  seasons: [],
  harvests: [],
  transactions: [],
  anomalies: [],
}

const COLLECTIONS = ['fields', 'seasons', 'harvests', 'transactions', 'anomalies']

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    return normalize(JSON.parse(raw))
  } catch {
    return EMPTY
  }
}

// Accept anything that looks like our data (also used for backup imports).
export function normalize(data) {
  if (!data || typeof data !== 'object') throw new Error('Not a Sakahan backup file')
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && x.id) : [])
  return {
    version: 2,
    profile: { ...EMPTY.profile, ...(data.profile || {}) },
    ...Object.fromEntries(COLLECTIONS.map((k) => [k, list(data[k])])),
  }
}

function upsert(items, item) {
  const i = items.findIndex((x) => x.id === item.id)
  if (i === -1) return [{ createdAt: Date.now(), ...item }, ...items]
  const next = items.slice()
  next[i] = { ...items[i], ...item }
  return next
}

function reducer(state, action) {
  switch (action.type) {
    case 'save':
      return { ...state, [action.kind]: upsert(state[action.kind], action.item) }
    case 'remove': {
      const next = { ...state, [action.kind]: state[action.kind].filter((x) => x.id !== action.id) }
      // Records stay when their planting or field is deleted, just unlinked.
      if (action.kind === 'seasons') {
        for (const k of ['transactions', 'anomalies', 'harvests']) {
          next[k] = state[k].map((t) => (t.seasonId === action.id ? { ...t, seasonId: '' } : t))
        }
      }
      if (action.kind === 'fields') {
        for (const k of ['seasons', 'harvests']) {
          next[k] = state[k].map((t) => (t.fieldId === action.id ? { ...t, fieldId: '' } : t))
        }
      }
      return next
    }
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.profile } }
    case 'replace':
      return action.data
    case 'sample': {
      const sample = makeSampleData()
      const merged = { ...state, profile: { ...state.profile, onboarded: true, farm: state.profile.farm || sample.farm } }
      for (const k of COLLECTIONS) {
        merged[k] = [...sample[k], ...state[k].filter((s) => !sample[k].some((x) => x.id === s.id))]
      }
      return merged
    }
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [burst, setBurst] = useState(null)
  // App lock: records stay hidden until the PIN is entered (only for this visit).
  // Starts unlocked when no PIN is set, so turning the lock on doesn't lock you out mid-visit.
  const [unlocked, setUnlocked] = useState(() => !state.profile.pinHash)
  const timer = useRef()
  const burstTimer = useRef()

  const celebrate = useCallback(() => {
    clearTimeout(burstTimer.current)
    setBurst({ key: Date.now() })
    burstTimer.current = setTimeout(() => setBurst(null), 1400)
  }, [])

  // In-app "Are you sure?" dialog. Resolves true when the farmer confirms.
  const ask = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({
          ...options,
          answer: (ok) => {
            setDialog(null)
            resolve(ok)
          },
        })
      }),
    [],
  )

  const notify = useCallback((message, tone = 'good') => {
    clearTimeout(timer.current)
    setToast({ message, tone, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      notify('Phone storage is full — export a backup and remove some photos.', 'bad')
    }
  }, [state, notify])

  const actions = useMemo(
    () => ({
      save: (kind, item) => {
        const withId = item.id ? item : { ...item, id: uid() }
        dispatch({ type: 'save', kind, item: withId })
        return withId
      },
      remove: (kind, id) => dispatch({ type: 'remove', kind, id }),
      setProfile: (profile) => dispatch({ type: 'profile', profile }),
      replaceAll: (data) => dispatch({ type: 'replace', data: normalize(data) }),
      reset: () => dispatch({ type: 'replace', data: { ...EMPTY, profile: { ...EMPTY.profile } } }),
      loadSample: () => dispatch({ type: 'sample' }),
      notify,
      ask,
      celebrate,
      unlock: () => setUnlocked(true),
      lock: () => setUnlocked(false),
    }),
    [notify, ask, celebrate],
  )

  const locked = !!state.profile.pinHash && !unlocked
  const value = useMemo(() => ({ state, ...actions, toast, dialog, burst, locked }), [state, actions, toast, dialog, burst, locked])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
