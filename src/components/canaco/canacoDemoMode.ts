/**
 * CANACO SERVYTUR MÉRIDA — Controlador de Modo Demo / Walkthrough
 *
 * Permite habilitar o deshabilitar instantáneamente las herramientas de demostración
 * para el walkthrough directivo sin dejar controles de prueba visibles en producción.
 *
 * ¿Cómo se activa?
 *  1) Agregando `?demo=1` o `?walkthrough=1` a la URL (se persiste en localStorage).
 *  2) Presionando el atajo de teclado `Ctrl + Shift + D`.
 *
 * ¿Cómo se oculta/desactiva?
 *  1) Pulsando el botón "Ocultar Modo Demo" en la barra flotante de Walkthrough.
 *  2) Navegando con `?demo=0`.
 *  3) Volviendo a presionar `Ctrl + Shift + D`.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SectorEconomico } from './types';

export const CANACO_DEMO_STORAGE_KEY = 'canaco_demo_mode_v1';
export const CANACO_DEMO_CLIP_URL_KEY = 'canaco_demo_clip_url_v1';
const DEMO_EVENT_NAME = 'canaco-demo-mode-change';

export interface CanacoWalkthroughDemoData {
  razonSocial: string;
  nombreComercial: string;
  rfc: string;
  sector: SectorEconomico;
  numEmpleados: number;
  municipio: string;
  calle: string;
  codigoPostal: string;
  contactoNombre: string;
  email: string;
  telefono: string;
}

/**
 * Caso canónico para el Walkthrough del lunes (coincide con el escenario de 15 empleados
 * e ISN Yucatán 2026 Pequeña Empresa sobre $250,000: $9,375 bruto − $1,875 estímulo = $7,500 MXN neto).
 */
export const CANACO_WALKTHROUGH_SOCIO_DEMO: CanacoWalkthroughDemoData = {
  razonSocial: 'COMERCIALIZADORA PENINSULAR DEL MAYAB S.A. DE C.V.',
  nombreComercial: 'Mayab Comercial Peninsular',
  rfc: 'CPM2106158A1',
  sector: 'comercio',
  numEmpleados: 15,
  municipio: 'Mérida',
  calle: 'Calle 60 #450 x 51 y 53, Centro Histórico',
  codigoPostal: '97000',
  contactoNombre: 'Lic. Fernando Pech Várguez',
  email: 'fernando.pech@mayabcomercial.mx',
  telefono: '9999123456',
};

export function checkInitialDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo') ?? params.get('walkthrough');

    if (demoParam === '0' || demoParam === 'false' || demoParam === 'off') {
      window.localStorage.removeItem(CANACO_DEMO_STORAGE_KEY);
      return false;
    }

    if (demoParam === '1' || demoParam === 'true' || demoParam === 'on') {
      window.localStorage.setItem(CANACO_DEMO_STORAGE_KEY, 'true');
      return true;
    }

    return window.localStorage.getItem(CANACO_DEMO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCanacoDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(CANACO_DEMO_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(CANACO_DEMO_STORAGE_KEY);
      // Limpiar query param ?demo=1 o ?walkthrough=1 de la barra de direcciones para que quede limpia
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      url.searchParams.delete('walkthrough');
      const relativeUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, '', relativeUrl);
    }
    window.dispatchEvent(new CustomEvent(DEMO_EVENT_NAME, { detail: { enabled } }));
  } catch {
    // Ignorar errores de almacenamiento en modo incógnito estricto
  }
}

export function getDemoClipPaymentUrl(): string {
  if (typeof window === 'undefined') return 'https://pago.clip.mx/';
  try {
    return window.localStorage.getItem(CANACO_DEMO_CLIP_URL_KEY)?.trim() || 'https://pago.clip.mx/';
  } catch {
    return 'https://pago.clip.mx/';
  }
}

export function setDemoClipPaymentUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = url.trim();
    if (cleaned) {
      window.localStorage.setItem(CANACO_DEMO_CLIP_URL_KEY, cleaned);
    } else {
      window.localStorage.removeItem(CANACO_DEMO_CLIP_URL_KEY);
    }
  } catch {
    // Ignorar
  }
}

export function useCanacoDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => checkInitialDemoMode());

  useEffect(() => {
    setIsDemoMode(checkInitialDemoMode());

    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setIsDemoMode(custom.detail.enabled);
      } else {
        setIsDemoMode(checkInitialDemoMode());
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const next = !checkInitialDemoMode();
        setCanacoDemoMode(next);
      }
    };

    window.addEventListener(DEMO_EVENT_NAME, handleCustomChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(DEMO_EVENT_NAME, handleCustomChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const enableDemoMode = useCallback(() => setCanacoDemoMode(true), []);
  const disableDemoMode = useCallback(() => setCanacoDemoMode(false), []);
  const toggleDemoMode = useCallback(() => setCanacoDemoMode(!checkInitialDemoMode()), []);

  return {
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode,
  };
}
