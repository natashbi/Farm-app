import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { makeSampleData } from './data/sample.js'
import { uid } from './lib/format.js'

const KEY = 'sakahan-farm-budget-v1'

export const EMPTY = {
  version: 1,
  profile: { name: '', farm: '', onboarded: false },
  transactions: [],
  seasons: [],
  anomalies: [],
}

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
    version: 1,
    profile: { ...EMPTY.profile, ...(data.profile || {}) },
    transactions: list(data.transactions),
    seasons: list(data.seasons),
    anomalies: list(data.anomalies),
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
      // Budget records keep existing when their season is deleted, just unlinked.
      if (action.kind === 'seasons') {
        next.transactions = state.transactions.map((t) => (t.seasonId === action.id ? { ...t, seasonId: '' } : t))
        next.anomalies = state.anomalies.map((a) => (a.seasonId === action.id ? { ...a, seasonId: '' } : a))
      }
      return next
    }
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.profile } }
    case 'replace':
      return action.data
    case 'sample': {
      const sample = makeSampleData()
      return {
        ...state,
        profile: { ...state.profile, onboarded: true },
        seasons: [...sample.seasons, ...state.seasons.filter((s) => !sample.seasons.some((x) => x.id === s.id))],
        transactions: [...sample.transactions, ...state.transactions.filter((s) => !sample.transactions.some((x) => x.id === s.id))],
        anomalies: [...sample.anomalies, ...state.anomalies.filter((s) => !sample.anomalies.some((x) => x.id === s.id))],
      }
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
  const timer = useRef()

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
    }),
    [notify, ask],
  )

  const value = useMemo(() => ({ state, ...actions, toast, dialog }), [state, actions, toast, dialog])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
