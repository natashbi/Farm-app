import { Component } from 'react'

export async function hardReload() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) || []
    await Promise.all(regs.map((r) => r.unregister()))
    const keys = (await window.caches?.keys?.()) || []
    await Promise.all(keys.map((k) => caches.delete(k)))
  } catch {}
  const url = new URL(window.location.href)
  url.searchParams.set('v', Date.now().toString(36))
  window.location.replace(url.toString())
}

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  resetData = () => {
    if (!window.confirm('Burahin ang lahat ng records sa phone na ito at magsimula ulit?')) return
    try {
      localStorage.removeItem('sakahan-farm-budget-v1')
    } catch {}
    hardReload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app">
        <main className="onboard" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>May problema sa pagbukas ng app</h1>
          <p className="muted">Pindutin ang “I-reload” para kunin ang pinakabagong bersyon. Hindi mabubura ang records mo.</p>
          <button className="btn primary block" onClick={hardReload}>
            I-reload ang app
          </button>
          <button className="btn ghost block" onClick={this.resetData}>
            Magsimula ulit (burahin ang records)
          </button>
          <pre className="small muted" style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </main>
      </div>
    )
  }
}
