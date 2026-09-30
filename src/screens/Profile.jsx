import { useState } from 'react'
import { ChevronRight, Copy, Database, Download, FileSpreadsheet, KeyRound, Lock, LockOpen, MapPin, Moon, Plus, Settings, Sparkles, Stethoscope, Trash2, Upload } from 'lucide-react'
import { getCrop } from '../data/categories.js'
import { num, todayISO } from '../lib/format.js'
import { buildReport, reportCSV, scopeRecords } from '../lib/report.js'
import { useStore } from '../store.jsx'
import { FarmerAvatar } from '../components/Art.jsx'
import { Field, SectionHead, Segmented, Sheet, useNav } from '../components/ui.jsx'
import { AnimatedNumber } from '../components/motion.jsx'

// Save a file to the phone. When the app runs inside a Claude artifact viewer,
// downloads go through the viewer's own save prompt.
export async function saveFile(filename, text, type) {
  const downloads = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null
  if (downloads) {
    try {
      await downloads.save({ filename, data: text })
      return 'saved'
    } catch (err) {
      return err?.code === 'declined' ? 'declined' : 'failed'
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'saved'
}

// A page host may already set data-theme; "Auto" goes back to whatever it set.
const hostTheme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null

export function applyTheme(theme) {
  try {
    localStorage.setItem('sakahan-theme', theme)
  } catch {
    /* private mode — theme just won't be remembered */
  }
  const value = theme === 'auto' ? hostTheme : theme
  if (value) document.documentElement.setAttribute('data-theme', value)
  else document.documentElement.removeAttribute('data-theme')
}

export function savedTheme() {
  try {
    return localStorage.getItem('sakahan-theme') || 'auto'
  } catch {
    return 'auto'
  }
}

export default function Profile() {
  const { state, replaceAll, reset, loadSample, notify, ask, lock } = useStore()
  const nav = useNav()
  const [theme, setTheme] = useState(savedTheme)
  const { profile, seasons, transactions, harvests, fields } = state
  const mainCrop = seasons[0] ? getCrop(seasons[0].crop) : null
  const totalArea = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0)

  const report = (result, done) => {
    if (result === 'saved') notify(done)
    else if (result === 'failed') notify('Saving files is not allowed here. Use “Copy backup text” instead.', 'bad')
  }
  const saveBackup = async () =>
    report(await saveFile(`sakahan-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json'), 'Backup downloaded')
  const saveCSV = async () => {
    const scope = scopeRecords(state)
    const csv = reportCSV(state, buildReport(state, scope), scope, `${profile.farm || 'Farm'} — all records`)
    report(await saveFile(`sakahan-records-${todayISO()}.csv`, csv, 'text/csv'), 'Spreadsheet downloaded')
  }

  const copyBackup = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state))
      notify('Backup copied — paste it somewhere safe')
    } catch {
      notify('Copy is not allowed here. Use Download backup instead.', 'bad')
    }
  }

  const onImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      let data
      try {
        data = JSON.parse(reader.result)
      } catch {
        return notify('That file is not a Sakahan backup.', 'bad')
      }
      const ok = await ask({
        title: 'Restore this backup?',
        message: 'All records on this phone will be replaced with the ones in the backup file.',
        confirmLabel: 'Restore',
      })
      if (!ok) return
      try {
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
        <div><strong><AnimatedNumber value={fields.length} /></strong><span>Fields</span></div>
        <div><strong><AnimatedNumber value={seasons.length} /></strong><span>Plantings</span></div>
        <div><strong><AnimatedNumber value={harvests.length} /></strong><span>Harvests</span></div>
        <div><strong><AnimatedNumber value={transactions.length} /></strong><span>Expenses</span></div>
      </section>

      <div className="field-row">
        <button className="btn primary" onClick={() => nav.open('profileForm')}>Edit profile</button>
        <button className="btn primary" onClick={saveBackup}>
          Backup
        </button>
      </div>

      <section className="section">
        <SectionHead
          title="Farm fields"
          sub={fields.length ? `${fields.length} field${fields.length === 1 ? '' : 's'} · ${num(totalArea)} ha` : 'Add each lote you farm'}
          action="+ Add"
          onAction={() => nav.open('field')}
        />
        {fields.length ? (
          <div className="list">
            {fields.map((f) => {
              const plantings = seasons.filter((s) => s.fieldId === f.id)
              const growing = plantings.find((s) => s.status === 'active')
              return (
                <button key={f.id} className="row" onClick={() => nav.open('field', { field: f })}>
                  <span className="bubble" aria-hidden="true">
                    <MapPin size={20} />
                  </span>
                  <span className="grow">
                    <span className="title" style={{ display: 'block' }}>
                      {f.name} · {num(f.area)} ha
                    </span>
                    <span className="meta" style={{ display: 'block' }}>
                      {f.location || 'No location'} · {plantings.length} planting{plantings.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  {growing && <span className="badge orange">{getCrop(growing.crop).emoji} Growing</span>}
                </button>
              )
            })}
          </div>
        ) : (
          <button className="btn ghost" onClick={() => nav.open('field')}>
            <Plus size={18} /> Add a field
          </button>
        )}
      </section>

      <section className="section">
        <SectionHead title="Security" sub="Keep others from opening your records on this phone" />
        <div className="settings-list">
          {profile.pinHash ? (
            <>
              <button onClick={() => lock()}>
                <Lock size={20} />
                <span className="grow">Lock now<small>App lock is on — PIN needed to open</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => nav.open('pin', { mode: 'set' })}>
                <KeyRound size={20} />
                <span className="grow">Change PIN</span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => nav.open('pin', { mode: 'remove' })}>
                <LockOpen size={20} />
                <span className="grow">Turn off app lock</span>
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => nav.open('pin', { mode: 'set' })}>
              <Lock size={20} />
              <span className="grow">Set up app lock (PIN)<small>Ask for a 4-digit PIN every time the app opens</small></span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Extra tools" />
        <div className="settings-list">
          <button onClick={() => nav.setTab('doctor')}>
            <Stethoscope size={20} />
            <span className="grow">Crop Doctor<small>Find the cause of crop problems and the fertilizer or tools to fix them</small></span>
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

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
          <button onClick={saveBackup}>
            <Download size={20} />
            <span className="grow">Download backup<small>Keep it in Google Drive or send it to yourself</small></span>
            <ChevronRight size={18} />
          </button>
          <button onClick={copyBackup}>
            <Copy size={20} />
            <span className="grow">Copy backup text<small>Paste it in Messenger or Notes to keep it safe</small></span>
            <ChevronRight size={18} />
          </button>
          <label>
            <Upload size={20} />
            <span className="grow">Restore from backup<small>Move your records to a new phone</small></span>
            <ChevronRight size={18} />
            <input type="file" accept="application/json,.json" onChange={onImport} aria-label="Restore from backup" />
          </label>
          <button onClick={saveCSV}>
            <FileSpreadsheet size={20} />
            <span className="grow">Export all records to Excel (CSV)<small>Expenses, income, plantings and harvests — for the cooperative or DA</small></span>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => { loadSample(); notify('Sample data added') }}>
            <Sparkles size={20} />
            <span className="grow">Add sample data<small>See how the app works with example seasons</small></span>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={async () => {
              const ok = await ask({
                title: 'Delete all data?',
                message: 'Every field, planting, harvest, expense and crop problem on this phone will be erased. Download a backup first if you may need them.',
                confirmLabel: 'Delete everything',
                danger: true,
              })
              if (ok) {
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
        <Field label="Farm location (optional)">
          <input className="input" value={farm} onChange={(e) => setFarm(e.target.value)} placeholder="e.g. Zaragoza, Nueva Ecija" />
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
        <FarmerAvatar size={120} className="anim-bob" />
        <h2 style={{ maxWidth: 'none', fontSize: 26 }}>Welcome to Sakahan</h2>
        <p style={{ maxWidth: 'none' }}>Farm Expense and Harvest Record App — record expenses, harvests and income for every field in one place.</p>
      </div>
      <Field label="What's your name?">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan" autoFocus />
      </Field>
      <Field label="Farm location (optional)">
        <input className="input" value={farm} onChange={(e) => setFarm(e.target.value)} placeholder="e.g. Zaragoza, Nueva Ecija" />
      </Field>
      <button className="btn primary block" onClick={() => start(false)}>Start my farm records</button>
      <button className="btn ghost block" onClick={() => start(true)}>Try with sample data first</button>
      <p className="small muted center">Everything is saved on this phone. No account or internet needed.</p>
    </main>
  )
}
