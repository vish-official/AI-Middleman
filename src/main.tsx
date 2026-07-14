import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign Vite HMR/WebSocket errors that are expected in sandboxed proxy environments
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.includes('WebSocket') || 
    reason.includes('websocket') || 
    reason.includes('vite') ||
    reason.includes('HMR')
  ) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('WebSocket') || 
    message.includes('websocket') || 
    message.includes('vite') ||
    message.includes('HMR')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

