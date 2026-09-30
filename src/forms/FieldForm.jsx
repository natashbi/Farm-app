import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toNumber } from '../lib/format.js'
import { useStore } from '../store.jsx'
import { Field, Sheet } from '../components/ui.jsx'

// A field (lote) the farmer plants: large farms track each one separately.
export default function FieldForm({ field, onClose }) {
  const { state, save, remove, notify, ask } = useStore()
  const editing = !!field
  const [f, setF] = useState(() => ({
    name: field?.name || `Lote ${state.fields.length + 1}`,
    location: field?.location || '',
    area: field?.area ?? '',
    notes: field?.notes || '',
  }))
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = (e) => {
    e?.preventDefault()
    if (!f.name.trim()) return setError('Give the field a name, e.g. "Lote 1".')
    const area = toNumber(f.area)
    if (area === null || area <= 0) return setError('Enter the field size in hectares, e.g. 2.5.')
    save('fields', { ...(field || {}), name: f.name.trim(), location: f.location.trim(), area, notes: f.notes.trim() })
    notify(editing ? 'Field updated' : 'Field added')
    onClose()
  }

  const del = async () => {
    const ok = await ask({
      title: `Delete ${field.name}?`,
      message: 'Plantings and harvests stay, but they will no longer be linked to this field.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    remove('fields', field.id)
    notify('Field deleted')
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Edit field' : 'New field'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="btn danger" style={{ flex: 'none' }} onClick={del} aria-label="Delete field">
              <Trash2 size={18} />
            </button>
          )}
          <button className="btn primary" onClick={submit}>
            Save field
          </button>
        </>
      }
    >
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <Field label="Field name">
          <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Lote 1" />
        </Field>
        <Field label="Location (optional)">
          <input className="input" value={f.location} onChange={set('location')} placeholder="e.g. Brgy. Batitang, Zaragoza" />
        </Field>
        <Field label="Size (hectares)">
          <input className="input" inputMode="decimal" value={f.area} onChange={set('area')} placeholder="e.g. 2.5" />
        </Field>
        {error && <div className="callout warn">{error}</div>}
        <Field label="Notes (optional)">
          <textarea className="input" value={f.notes} onChange={set('notes')} placeholder="Irrigated, soil type, tenant, etc." />
        </Field>
      </form>
    </Sheet>
  )
}
