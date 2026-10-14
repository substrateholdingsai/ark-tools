/**
 * ARK TOOLS — React Entry Point
 *
 * Este archivo monta la aplicación React en el DOM.
 * El worker (src/index.ts) sirve el HTML que carga este bundle.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
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
    <App />
  </React.StrictMode>
);
