import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CANACO_DEMO_STORAGE_KEY,
  CANACO_WALKTHROUGH_SOCIO_DEMO,
  checkInitialDemoMode,
  setCanacoDemoMode,
} from './canacoDemoMode';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';

describe('CANACO Walkthrough Demo Mode & Simulated Payment', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/?brand=canaco');
  });

  it('permanece oculto por defecto en URLs limpias de producción', () => {
    expect(checkInitialDemoMode()).toBe(false);

    render(<VentanillaAfiliacionModal isOpen={true} onClose={() => {}} />);
    expect(screen.queryByText(/Modo Walkthrough Directivo Activo/i)).not.toBeInTheDocument();
  });

  it('se activa con ?demo=1, permite autollenar el socio de 15 empleados y simular pago en Paso 3', () => {
    window.history.replaceState({}, '', '/?brand=canaco&demo=1');
    expect(checkInitialDemoMode()).toBe(true);
    expect(window.localStorage.getItem(CANACO_DEMO_STORAGE_KEY)).toBe('true');

    render(<VentanillaAfiliacionModal isOpen={true} onClose={() => {}} />);

    // Verifica que aparece el banner de autollenado en Paso 1
    expect(screen.getByText(/Modo Walkthrough Directivo Activo/i)).toBeInTheDocument();

    // Clic en "Ir directo a Pago (Paso 3) →"
    fireEvent.click(screen.getByRole('button', { name: /Ir directo a Pago \(Paso 3\)/i }));

    // Verifica que en Paso 3 aparece el Simulador de Pasarela con el RFC autollenado
    expect(screen.getByText(/Simulador de Pasarela \(Modo Walkthrough\)/i)).toBeInTheDocument();
    expect(screen.getByText(/VISA CORPORATIVA/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(CANACO_WALKTHROUGH_SOCIO_DEMO.rfc))).toBeInTheDocument();

    // Cambiar a Enlace Clip / QR y verificar que muestra el link de pago real de Clip + botón simulado
    fireEvent.click(screen.getByRole('button', { name: /Enlace Clip \/ QR/i }));
    expect(screen.getByRole('link', { name: /Abrir Link Clip Real/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Simular Pago Clip Acreditado y Emitir Cédula SIEM/i })
    ).toBeInTheDocument();
  });

  it('se desactiva y limpia el parámetro ?demo=1 de la URL al apagar el modo demo', () => {
    window.history.replaceState({}, '', '/?brand=canaco&demo=1');
    expect(checkInitialDemoMode()).toBe(true);

    setCanacoDemoMode(false);
    expect(checkInitialDemoMode()).toBe(false);
    expect(window.location.search).not.toContain('demo=1');
  });
});
