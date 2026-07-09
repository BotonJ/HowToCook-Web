import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .catch(() => {
      // SW registration failed silently — non-critical for SPA functionality
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
