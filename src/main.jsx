import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'
import { applyTheme, savedTheme } from './screens/Profile.jsx'
import './styles.css'

applyTheme(savedTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

// Works offline after the first visit (normal build only, not the single-file build).
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.MODE !== 'single' && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
