import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Home as HomeIcon, Stethoscope, UserRound, Wallet } from 'lucide-react'
import { useStore } from './store.jsx'
import { ConfirmDialog, NavContext, Toast } from './components/ui.jsx'
import Home from './screens/Home.jsx'
import Budget from './screens/Budget.jsx'
import Doctor from './screens/Doctor.jsx'
import Records from './screens/Records.jsx'
import Profile, { Onboarding, ProfileForm } from './screens/Profile.jsx'
import TransactionForm from './forms/TransactionForm.jsx'
import SeasonForm from './forms/SeasonForm.jsx'
import { AnomalyDetail, ConditionSheet, DiagnoseSheet } from './forms/Doctor.jsx'

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon, screen: Home },
  { id: 'budget', label: 'Budget', icon: Wallet, screen: Budget },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, screen: Doctor },
  { id: 'records', label: 'Records', icon: BookOpen, screen: Records },
  { id: 'profile', label: 'Profile', icon: UserRound, screen: Profile },
]

const SHEETS = {
  tx: TransactionForm,
  season: SeasonForm,
  diagnose: DiagnoseSheet,
  anomaly: AnomalyDetail,
  condition: ConditionSheet,
  profileForm: ProfileForm,
}

let sheetSeq = 0

export default function App() {
  const { state, toast, dialog } = useStore()
  const [tab, setTabState] = useState('home')
  const [stack, setStack] = useState([])
  const pendingBack = useRef(0)

  // Each open sheet adds a browser history entry so the phone's Back button
  // closes the sheet instead of leaving the app.
  useEffect(() => {
    const onPop = () => {
      if (pendingBack.current > 0) pendingBack.current -= 1
      setStack((s) => s.slice(0, -1))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.body.style.overflow = stack.length ? 'hidden' : ''
  }, [stack.length])

  const open = useCallback((type, props = {}) => {
    try {
      window.history.pushState({ sakahanSheet: true }, '')
    } catch {
      /* history not available (sandboxed frame) — sheets still work */
    }
    sheetSeq += 1
    setStack((s) => [...s, { type, props, key: sheetSeq }])
  }, [])

  const close = useCallback(() => {
    pendingBack.current += 1
    try {
      window.history.back()
    } catch {
      /* ignore */
    }
    // Fallback if the browser never fires popstate.
    setTimeout(() => {
      if (pendingBack.current > 0) {
        pendingBack.current -= 1
        setStack((s) => s.slice(0, -1))
      }
    }, 400)
  }, [])

  const setTab = useCallback((id) => {
    setTabState(id)
    window.scrollTo({ top: 0 })
  }, [])

  const nav = useMemo(() => ({ tab, setTab, open, close }), [tab, setTab, open, close])

  if (!state.profile.onboarded) {
    return (
      <div className="app">
        <Onboarding />
        <Toast toast={toast} />
      </div>
    )
  }

  const Screen = TABS.find((t) => t.id === tab).screen

  return (
    <NavContext.Provider value={nav}>
      <div className="app">
        <Screen key={tab} />
        <nav className="nav" aria-label="Main">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
                <span className="nav-icon">
                  <Icon size={22} strokeWidth={tab === t.id ? 2.4 : 1.9} />
                </span>
                {t.label}
              </button>
            )
          })}
        </nav>
        {stack.map((s) => {
          const SheetComp = SHEETS[s.type]
          return <SheetComp key={s.key} {...s.props} onClose={close} />
        })}
        <ConfirmDialog dialog={dialog} />
        <Toast toast={toast} />
      </div>
    </NavContext.Provider>
  )
}
