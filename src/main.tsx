import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// i18n muss VOR App importiert werden
import './i18n/index';
import './index.css';
import App from './App';

// System-Theme-Listener: Reagiert wenn der User im OS den Dark/Light Mode wechselt
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  const savedTheme = localStorage.getItem('lernwelt-theme');
  if (savedTheme === 'system' || !savedTheme) {
    document.documentElement.setAttribute(
      'data-theme',
      e.matches ? 'dark' : 'light',
    );
  }
});

// document.getElementById('root') findet das <div id="root"> in index.html
// Das ist der einzige echte DOM-Knoten – alles andere rendert React
createRoot(document.getElementById('root')!).render(
  // StrictMode: Aktiviert zusätzliche Warnungen während der Entwicklung
  // Ähnlich wie Flutter's debugMode – hilft Fehler früh zu finden
  // Hat keinen Einfluss auf den Production-Build
  <StrictMode>
    <App />
  </StrictMode>,
);