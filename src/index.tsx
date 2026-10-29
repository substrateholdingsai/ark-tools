/**
 * ARK LEDGER — React Entry Point
 *
 * Monta la aplicación React en el DOM con el AuthProvider nativo.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { ExpedienteProvider } from './context/ExpedienteContext';
import { App } from './App';
import './styles/ark-system.css';

// Resiliencia de despliegue: captura fallas de chunks dinámicos cuando se publica una nueva versión
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn(
      '[ARK] Error al precargar chunk dinámico (posible nueva versión desplegada). Sincronizando...',
      event
    );
    const reloadKey = 'ark_last_preload_reload';
    const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
    const now = Date.now();
    // Prevenir bucles de reload: máximo 1 reload cada 15 segundos
    if (now - lastReload > 15000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element #root not found. Asegúrate de que el HTML tiene <div id="root"></div>.'
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ExpedienteProvider>
        <App />
      </ExpedienteProvider>
    </AuthProvider>
  </React.StrictMode>
);
