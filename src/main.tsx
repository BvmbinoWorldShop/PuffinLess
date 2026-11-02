import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA Service Worker for offline capability & fast loading
if ('serviceWorker' in navigator && !window.location.host.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PuffinLess PWA ServiceWorker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('PuffinLess PWA ServiceWorker registration failed:', err);
      });
  });
}
