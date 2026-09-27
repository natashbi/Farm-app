import { useMemo, useState } from 'react'
import { Camera, CheckCircle2, Info, Lightbulb, Plus, ShieldCheck, Trash2, Wrench, FlaskConical, ListChecks } from 'lucide-react'
import { CROPS, getCrop } from '../data/categories.js'
import { PROBLEM_TYPES, SYMPTOM_GROUPS, diagnose, getSymptom, symptomsForCrop } from '../data/cropDoctor.js'
import { activeSeason } from '../lib/calc.js'
import { fmtDate, todayISO } from '../lib/format.js'
import { compressImage } from '../lib/photo.js'
import { useStore } from '../store.jsx'
import { Field, Segmented, Sheet, useNav } from '../components/ui.jsx'

const SEVERITY = [
  { value: 'low', label: 'A few plants' },
  { value: 'medium', label: 'Some areas' },
  { value: 'high', label: 'Spreading fast' },
]

export function Disclaimer() {
  return (
    <div className="callout info">
      <Info size={18} />
      <span>
        These are general guides. Confirm with your Municipal Agriculture Office or DA technician, and always follow the product label and
        wear protective gear when spraying.
      </span>
    </div>
  )
}

// One likely problem with everything needed to fix it.
export function ConditionCard({ condition, level, matched, onRecord }) {
  const type = PROBLEM_TYPES[condition.type]
  return (
    <article className="card result">
      <div className="result-head">
        <span className="bubble" aria-hidden="true">{type.emoji}</span>
        <div style={{ flex: 1 }}>
          <h3>{condition.name}</h3>
          <div className="tl">{condition.tl} · {type.label}</div>
        </div>
        {level && <span className={`badge ${level === 'strong' ? 'orange' : ''}`}>{level === 'strong' ? 'Likely' : 'Possible'}</span>}
      </div>
      {matched?.length > 0 && (
        <div className="wrap-gap">
          {matched.map((id) => (
            <span key={id} className="badge good">✓ {getSymptom(id)?.label}</span>
          ))}
        </div>
      )}
      <p className="small" style={{ color: 'var(--ink-2)' }}>{condition.about}</p>

      {condition.items.length > 0 && (
        <div className="fix-block">
          <h4><FlaskConical size={16} /> Fertilizer / treatment</h4>
          {condition.items.map((it) => (
            <div className="fix-item" key={it.name}>
              <div className="grow">
                <div className="name">{it.name}</div>
                {it.note && <div className="note">{it.note}</div>}
              </div>
              {onRecord && (
                <button className="add-mini" onClick={() => onRecord(it)} aria-label={`Record purchase of ${it.name}`}>
                  <Plus size={14} /> Record
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {condition.tools.length > 0 && (
        <div className="fix-block">
          <h4><Wrench size={16} /> Tools needed</h4>
          {condition.tools.map((it) => (
            <div className="fix-item" key={it.name}>
              <div className="grow">
                <div className="name">{it.name}</div>
                {it.note && <div className="note">{it.note}</div>}
              </div>
              {onRecord && (
                <button className="add-mini" onClick={() => onRecord(it)} aria-label={`Record purchase of ${it.name}`}>
                  <Plus size={14} /> Record
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="fix-block">
        <h4><ListChecks size={16} /> What to do</h4>
        <ol className="steps">
          {condition.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="callout good">
        <ShieldCheck size={18} />
        <span><strong>Next season:</strong> {condition.prevent}</span>
      </div>
    </article>
  )
}

function useRecordPurchase(seasonId) {
  const nav = useNav()
  return (item) =>
    nav.open('tx', { preset: { category: item.cat, item: item.name, seasonId, note: 'From Crop Doctor' } })
}

export function DiagnoseSheet({ onClose, preset }) {
  const { state, save, notify } = useStore()
  const [step, setStep] = useState(preset?.crop ? 2 : 1)
  const [crop, setCrop] = useState(preset?.crop || '')
  const [picked, setPicked] = useState([])
  const [severity, setSeverity] = useState('medium')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const current = activeSeason(state.seasons)
  const [seasonId, setSeasonId] = useState(current && current.status === 'active' ? current.id : '')
  const record = useRecordPurchase(seasonId)

  const symptoms = useMemo(() => symptomsForCrop(crop), [crop])
  const results = useMemo(() => diagnose(crop, picked), [crop, picked])
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhoto(await compressImage(file))
    } catch (err) {
      notify(err.message, 'bad')
    }
  }

  const saveLog = () => {
    save('anomalies', {
      date: todayISO(),
      crop,
      seasonId,
      symptoms: picked,
      severity,
      note: note.trim(),
      photo,
      conditionIds: results.slice(0, 3).map((r) => r.condition.id),
      status: 'open',
    })
    notify('Saved to your problem log')
    onClose()
  }

  const back = () => (step > 1 ? setStep(step - 1) : onClose())
  const shown = showAll ? results : results.slice(0, 3)

  return (
    <Sheet
      title={step === 3 ? 'Possible causes' : 'Crop Doctor'}
      onClose={onClose}
      onBack={back}
      scrollKey={step}
      footer={
        step === 3 && results.length > 0 ? (
          <button className="btn primary" onClick={saveLog}>
            Save to problem log
          </button>
        ) : null
      }
    >
      {step === 1 && (
        <div className="quiz">
          <div className="steps-dots" aria-hidden="true"><span className="on" /><span /><span /></div>
          <span className="kicker">Step 1 of 3</span>
          <h3>Which crop has a problem?</h3>
          <div className="options">
            {CROPS.map((c) => (
              <button
                key={c.id}
                className="option"
                aria-pressed={crop === c.id}
                onClick={() => {
                  setCrop(c.id)
                  setPicked([])
                  setStep(2)
                }}
              >
                <span className="big" aria-hidden="true">{c.emoji}</span>
                {c.label}
                <small>{c.tl}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="quiz">
          <div className="steps-dots" aria-hidden="true"><span className="on" /><span className="on" /><span /></div>
          <span className="kicker">Step 2 of 3 · {getCrop(crop).emoji} {getCrop(crop).label}</span>
          <h3>What do you see on your crop? Pick all that apply.</h3>
          {SYMPTOM_GROUPS.map((g) => {
            const list = symptoms.filter((s) => s.group === g.id)
            if (!list.length) return null
            return (
              <div key={g.id} className="stack">
                <div className="group-label">
                  <span aria-hidden="true">{g.emoji}</span> {g.label} · {g.tl}
                </div>
                <div className="options">
                  {list.map((s) => (
                    <button key={s.id} className="option" aria-pressed={picked.includes(s.id)} onClick={() => toggle(s.id)}>
                      {s.label}
                      <small>{s.tl}</small>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <button className="find" disabled={!picked.length} onClick={() => setStep(3)}>
            <Lightbulb size={18} /> Find answers {picked.length ? `(${picked.length})` : ''}
          </button>
        </div>
      )}

      {step === 3 && (
        <>
          {results.length === 0 ? (
            <div className="callout warn">
              <Info size={18} />
              <span>No match found for these signs. Take a photo and show it to your Municipal Agriculture Office.</span>
            </div>
          ) : (
            <p className="small muted">
              {getCrop(crop).emoji} {getCrop(crop).label} · {picked.length} sign{picked.length > 1 ? 's' : ''} picked. Most likely first — tap{' '}
              <strong>Record</strong> to add a purchase to your budget.
            </p>
          )}
          {shown.map((r) => (
            <ConditionCard key={r.condition.id} {...r} onRecord={record} />
          ))}
          {results.length > 3 && !showAll && (
            <button className="btn ghost" onClick={() => setShowAll(true)}>
              Show {results.length - 3} more possible causes
            </button>
          )}
          <Disclaimer />

          <div className="card stack">
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Save this for your records</h3>
            <fieldset className="field">
              <legend>How bad is it?</legend>
              <Segmented label="Severity" value={severity} onChange={setSeverity} options={SEVERITY} />
            </fieldset>
            <Field label="Season">
              <select className="input" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
                <option value="">No season</option>
                {state.seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where in the field, since when…" />
            </Field>
            <div className="field">
              <span>Photo (optional)</span>
              <label className="photo-drop">
                {photo ? <img src={photo} alt="Crop problem" /> : <span className="hstack"><Camera size={20} /> Take or choose a photo</span>}
                <input type="file" accept="image/*" capture="environment" onChange={onPhoto} aria-label="Add photo" />
              </label>
            </div>
          </div>
        </>
      )}
    </Sheet>
  )
}

export function AnomalyDetail({ anomaly, onClose }) {
  const { state, save, remove, notify, ask } = useStore()
  const live = state.anomalies.find((a) => a.id === anomaly.id) || anomaly
  const record = useRecordPurchase(live.seasonId)
  const results = diagnose(live.crop, live.symptoms || []).slice(0, 3)
  const crop = getCrop(live.crop)
  const season = state.seasons.find((s) => s.id === live.seasonId)
  const solved = live.status === 'resolved'

  const toggle = () => {
    save('anomalies', { ...live, status: solved ? 'open' : 'resolved', resolvedAt: solved ? '' : todayISO() })
    notify(solved ? 'Marked as still a problem' : 'Great! Marked as solved ✅')
  }
  const del = async () => {
    if (!(await ask({ title: 'Delete this problem from your log?', confirmLabel: 'Delete', danger: true }))) return
    remove('anomalies', live.id)
    onClose()
  }

  return (
    <Sheet
      title="Problem details"
      onClose={onClose}
      action={
        <button className="icon-btn plain" onClick={del} aria-label="Delete problem">
          <Trash2 size={20} />
        </button>
      }
      footer={
        <button className={`btn ${solved ? 'ghost' : 'primary'}`} onClick={toggle}>
          <CheckCircle2 size={18} /> {solved ? 'Mark as not solved' : 'Mark as solved'}
        </button>
      }
    >
      {live.photo && <img className="photo-thumb" src={live.photo} alt="Crop problem" />}
      <div className="card stack">
        <div className="hstack between">
          <strong>{crop.emoji} {crop.label}</strong>
          <span className={`badge ${solved ? 'good' : 'warn'}`}>{solved ? 'Solved' : 'Open'}</span>
        </div>
        <div className="small muted">
          {fmtDate(live.date)}
          {season ? ` · ${season.name}` : ''} · {SEVERITY.find((s) => s.value === live.severity)?.label || ''}
        </div>
        <div className="wrap-gap">
          {(live.symptoms || []).map((id) => (
            <span className="badge" key={id}>{getSymptom(id)?.label || id}</span>
          ))}
        </div>
        {live.note && <p className="small">{live.note}</p>}
      </div>
      {results.map((r) => (
        <ConditionCard key={r.condition.id} {...r} onRecord={record} />
      ))}
      <Disclaimer />
    </Sheet>
  )
}

export function ConditionSheet({ condition, onClose }) {
  const record = useRecordPurchase(activeSeason(useStore().state.seasons)?.id || '')
  return (
    <Sheet title="Crop problem guide" onClose={onClose}>
      <ConditionCard condition={condition} onRecord={record} />
      <div className="small muted">
        Applies to: {condition.crops === 'all' ? 'all crops' : condition.crops.map((c) => getCrop(c).label).join(', ')}
      </div>
      <Disclaimer />
    </Sheet>
  )
}
