import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

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