import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
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

    render(<VentanillaAfiliacionModal isOpen={true} onClose={() => {}} />);

    // Verifica que aparece el banner de autollenado en Paso 1
    expect(screen.getByText(/Modo Walkthrough Directivo Activo/i)).toBeInTheDocument();

    // Clic en "Ir directo a Pago (Paso 3) →"
    fireEvent.click(screen.getByRole('button', { name: /Ir directo a Pago \(Paso 3\)/i }));

    // Verifica que el Paso 3 informa que el recorrido no procesa ni confirma pagos.
    expect(screen.getByText(/Simulador de Pasarela \(Modo Walkthrough\)/i)).toBeInTheDocument();
    expect(screen.getByText(/VISA de prueba •••• 4242/i)).toBeInTheDocument();
    expect(screen.getByText(/no confirma pago/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Clip/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pago acreditado/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Simular recorrido \(sin pago\)/i })[0]!);
    expect(screen.getByText(/Registro pendiente de pago/i)).toBeInTheDocument();
    expect(screen.getByText(/No se emite una Cédula/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(CANACO_WALKTHROUGH_SOCIO_DEMO.rfc))).toBeInTheDocument();
  });

  it('no activa la demostración por un valor heredado en localStorage', () => {
    window.history.replaceState({}, '', '/?brand=canaco');
    window.localStorage.setItem('canaco_demo_mode_v1', 'true');

    expect(checkInitialDemoMode()).toBe(false);
  });

  it('se desactiva y limpia el parámetro ?demo=1 de la URL al apagar el modo demo', () => {
    window.history.replaceState({}, '', '/?brand=canaco&demo=1');
    expect(checkInitialDemoMode()).toBe(true);

    setCanacoDemoMode(false);
    expect(checkInitialDemoMode()).toBe(false);
    expect(window.location.search).not.toContain('demo=1');
  });
});
