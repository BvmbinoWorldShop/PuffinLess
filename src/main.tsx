import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';

// Global error shielding to prevent silent crashes and unhandled promise rejections on mobile browsers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[PuffinLess] Unhandled promise rejection captured:', event.reason);
  });
  window.addEventListener('error', (event) => {
    console.error('[PuffinLess] Global error captured:', event.error);
  });
}

function mountApp() {
  const container = document.getElementById('root');
  if (!container) return;
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

// Register PWA Service Worker for offline capability & fast loading
if ('serviceWorker' in navigator && !window.location.host.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update();
        console.log('PuffinLess PWA ServiceWorker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('PuffinLess PWA ServiceWorker registration failed:', err);
      });
  });
}
