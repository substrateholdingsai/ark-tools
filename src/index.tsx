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
