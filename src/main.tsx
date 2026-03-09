import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { App } from './App';
import './styles/index.css';

// Register service worker for caching and offline support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // eslint-disable-next-line no-console
        console.log('Service Worker registered: ', registration);
      })
      .catch((registrationError) => {
        // eslint-disable-next-line no-console
        console.log('Service Worker registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
