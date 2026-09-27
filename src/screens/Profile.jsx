import { useState } from 'react'
import { ChevronRight, Database, Download, FileSpreadsheet, Moon, Settings, Sparkles, Trash2, Upload } from 'lucide-react'
import { getCategory, getCrop } from '../data/categories.js'
import { seasonStats } from '../lib/calc.js'
import { pesoCompact, todayISO } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { FarmerAvatar } from '../components/Art.jsx'
import { Field, Progress, SectionHead, Segmented, Sheet, useNav } from '../components/ui.jsx'

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function toCSV(state) {
  const seasons = Object.fromEntries(state.seasons.map((s) => [s.id, s.name]))
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['Date', 'Type', 'Category', 'Item', 'Quantity', 'Unit', 'Amount (PHP)', 'Season', 'Notes']]
  for (const tx of [...state.transactions].sort((a, b) => (a.date || '').localeCompare(b.date || ''))) {
    const cat = getCategory(tx.category)
    rows.push([tx.date, cat.group === 'income' ? 'Income' : 'Expense', cat.label, tx.item, tx.qty, tx.unit, tx.amount, seasons[tx.seasonId] || '', tx.note])
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export function applyTheme(theme) {
  try {
    localStorage.setItem('sakahan-theme', theme)
  } catch {
    /* private mode — theme just won't be remembered */
  }
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

export function savedTheme() {
  try {
    return localStorage.getItem('sakahan-theme') || 'auto'
  } catch {
    return 'auto'
  }
}

export default function Profile() {
  const { state, replaceAll, reset, loadSample, notify } = useStore()
  const nav = useNav()
  const [theme, setTheme] = useState(savedTheme)
  const { profile, seasons, transactions, anomalies } = state
  const solved = anomalies.filter((a) => a.status === 'resolved').length
  const mainCrop = seasons[0] ? getCrop(seasons[0].crop) : null
  const latest = [...seasons].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')).slice(0, 3)

  const onImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!window.confirm('Replace all data on this phone with this backup?')) return
        replaceAll(data)
        notify('Backup restored ✅')
      } catch {
        notify('That file is not a Sakahan backup.', 'bad')
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="screen">
      <header className="topbar center">
        <button className="icon-btn plain" onClick={() => nav.open('profileForm')} aria-label="Edit profile">
          <Settings size={22} />
        </button>
        <h1 className="grow">Account</h1>
        <span style={{ width: 42 }} />
      </header>

      <section className="profile-head">
        <FarmerAvatar className="avatar-lg" size={112} />
        <h2>{profile.name || 'Farmer'}</h2>
        <span className="badge dark">
          {mainCrop ? `${mainCrop.emoji} ${mainCrop.label} farmer` : 'Farmer'}
          {profile.farm ? ` · ${profile.farm}` : ''}
        </span>
      </section>

      <section className="stats-row">
        <div><strong>{seasons.length}</strong><span>Seasons</span></div>
        <div><strong>{transactions.length}</strong><span>Records</span></div>
        <div><strong>{anomalies.length}</strong><span>Problems</span></div>
        <div><strong>{solved}</strong><span>Solved</span></div>
      </section>

      <div className="field-row">
        <button className="btn primary" onClick={() => nav.open('profileForm')}>Edit profile</button>
        <button
          className="btn primary"
          onClick={() => {
            download(`sakahan-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json')
            notify('Backup downloaded')
          }}
        >
          Backup
        </button>
      </div>

      {latest.length > 0 && (
        <section className="section">
          <SectionHead title="Latest seasons" action="View all" onAction={() => nav.setTab('records')} />
          <div className="stack" style={{ gap: 14 }}>
            {latest.map((s) => {
              const st = seasonStats(s, transactions)
              return (
                <div key={s.id} className="play-card">
                  <span className="thumb" aria-hidden="true">{getCrop(s.crop).emoji}</span>
                  <span className="grow">
                    <span className="title">{s.name}</span>
                    {Number(s.budget) > 0 ? (
                      <span className="progress-line">
                        <Progress value={st.budgetUsed} />
                        <span>{pesoCompact(st.cost)} / {pesoCompact(s.budget)}</span>
                      </span>
                    ) : (
                      <span className="small muted">Spent {pesoCompact(st.cost)}</span>
                    )}
                    <button className="chip" style={{ alignSelf: 'flex-start', minHeight: 30, padding: '3px 12px', fontSize: 13 }} onClick={() => nav.open('season', { season: s })}>
                      {s.status === 'active' ? 'Continue' : 'Open'}
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead title="Appearance" />
        <Segmented
          label="Theme"
          value={theme}
          onChange={(t) => {
            setTheme(t)
            applyTheme(t)
          }}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light', label: '☀️ Light' },
            { value: 'dark', label: <><Moon size={14} style={{ verticalAlign: -2 }} /> Dark</> },
          ]}
        />
      </section>

      <section className="section">
        <SectionHead title="Your data" sub="Saved only on this phone — back it up often" />
        <div className="settings-list">
          <button onClick={() => { download(`sakahan-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json'); notify('Backup downloaded') }}>
            <Download size={20} />
            <span className="grow">Download backup<small>Keep it in Google Drive or send it to yourself</small></span>
            <ChevronRight size={18} />
          </button>
          <label>
            <Upload size={20} />
            <span className="grow">Restore from backup<small>Move your records to a new phone</small></span>
            <ChevronRight size={18} />
            <input type="file" accept="application/json,.json" onChange={onImport} aria-label="Restore from backup" />
          </label>
          <button onClick={() => { download(`sakahan-budget-${todayISO()}.csv`, toCSV(state), 'text/csv'); notify('Spreadsheet downloaded') }}>
            <FileSpreadsheet size={20} />
            <span className="grow">Export budget to Excel (CSV)<small>For the cooperative, bank or loan papers</small></span>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => { loadSample(); notify('Sample data added') }}>
            <Sparkles size={20} />
            <span className="grow">Add sample data<small>See how the app works with example seasons</small></span>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete ALL records, seasons and problems on this phone? This cannot be undone.')) {
                reset()
                notify('All data deleted')
              }
            }}
          >
            <Trash2 size={20} className="danger" />
            <span className="grow danger">Delete all data</span>
          </button>
        </div>
      </section>

      <p className="small muted center">
        <Database size={12} style={{ verticalAlign: -1 }} /> Sakahan works offline. Crop advice is a general guide — confirm with your Municipal
        Agriculture Office.
      </p>
    </main>
  )
}

export function ProfileForm({ onClose }) {
  const { state, setProfile, notify } = useStore()
  const [name, setName] = useState(state.profile.name || '')
  const [farm, setFarm] = useState(state.profile.farm || '')
  const submit = (e) => {
    e?.preventDefault()
    setProfile({ name: name.trim(), farm: farm.trim(), onboarded: true })
    notify('Profile saved')
    onClose()
  }
  return (
    <Sheet title="Edit profile" onClose={onClose} footer={<button className="btn primary" onClick={submit}>Save</button>}>
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="profile-head">
          <FarmerAvatar size={96} />
        </div>
        <Field label="Your name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan dela Cruz" />
        </Field>
        <Field label="Farm name or location (optional)">
          <input className="input" value={farm} onChange={(e) => setFarm(e.target.value)} placeholder="e.g. Brgy. San Isidro, Nueva Ecija" />
        </Field>
      </form>
    </Sheet>
  )
}

export function Onboarding() {
  const { setProfile, loadSample } = useStore()
  const [name, setName] = useState('')
  const [farm, setFarm] = useState('')
  const start = (sample) => {
    setProfile({ name: name.trim(), farm: farm.trim(), onboarded: true })
    if (sample) loadSample()
  }
  return (
    <main className="onboard">
      <div className="hero" style={{ minHeight: 220, alignItems: 'center', textAlign: 'center' }}>
        <FarmerAvatar size={120} />
        <h2 style={{ maxWidth: 'none', fontSize: 26 }}>Welcome to Sakahan</h2>
        <p style={{ maxWidth: 'none' }}>Your farm notebook for budget, crop problems and past harvests.</p>
      </div>
      <Field label="What's your name?">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan" autoFocus />
      </Field>
      <Field label="Farm name or barangay (optional)">
        <input className="input" value={farm} onChange={(e) => setFarm(e.target.value)} placeholder="e.g. Brgy. San Isidro" />
      </Field>
      <button className="btn primary block" onClick={() => start(false)}>Start my farm records</button>
      <button className="btn ghost block" onClick={() => start(true)}>Try with sample data first</button>
      <p className="small muted center">Everything is saved on this phone. No account or internet needed.</p>
    </main>
  )
}
