/**
 * CANACO SERVYTUR MÉRIDA — Controlador de Modo Demo / Walkthrough
 *
 * Permite habilitar o deshabilitar instantáneamente las herramientas de demostración
 * para el walkthrough directivo sin dejar controles de prueba visibles en producción.
 *
 * El modo se activa agregando `?demo=1` o `?walkthrough=1` a la URL.
 *
 * El modo solo se activa con `?demo=1` o `?walkthrough=1` en la URL.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SectorEconomico } from './types';

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
  razonSocial: 'Comercializadora del Mayab',
  nombreComercial: 'Comercializadora del Mayab',
  rfc: 'CPM2106158A1',
  sector: 'comercio',
  numEmpleados: 15,
  municipio: 'Mérida',
  calle: 'Domicilio de prueba',
  codigoPostal: '00000',
  contactoNombre: 'Fernando Pech',
  email: 'demo@example.invalid',
  telefono: '0000000000',
};

export function checkInitialDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const demoParam = params.get('demo') ?? params.get('walkthrough');
  return demoParam === '1' || demoParam === 'true' || demoParam === 'on';
}

export function setCanacoDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set('demo', '1');
    url.searchParams.delete('walkthrough');
  } else {
    url.searchParams.delete('demo');
    url.searchParams.delete('walkthrough');
  }
  const relativeUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', relativeUrl);
  window.dispatchEvent(new CustomEvent(DEMO_EVENT_NAME, { detail: { enabled } }));
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

    window.addEventListener(DEMO_EVENT_NAME, handleCustomChange);
    return () => {
      window.removeEventListener(DEMO_EVENT_NAME, handleCustomChange);
    };
  }, []);

  const disableDemoMode = useCallback(() => setCanacoDemoMode(false), []);

  return {
    isDemoMode,
    disableDemoMode,
  };
}
