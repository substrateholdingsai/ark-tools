import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingQuickstartModal } from './OnboardingQuickstartModal';

describe('OnboardingQuickstartModal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <OnboardingQuickstartModal
        isOpen={false}
        onClose={vi.fn()}
        onStartDemo={vi.fn()}
        onSelectTool={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza título, propuesta de valor y las dos opciones principales cuando isOpen es true', () => {
    render(
      <OnboardingQuickstartModal
        isOpen={true}
        onClose={vi.fn()}
        onStartDemo={vi.fn()}
        onSelectTool={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: /Tus cálculos fiscales, respaldados con evidencia inmutable/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Explorar con Caso Demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolver Caso Real Hoy/i)).toBeInTheDocument();
  });

  it('ejecuta onStartDemo al hacer clic en Probar Caso Demo y marca onboarding como completado', async () => {
    const onStartDemo = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingQuickstartModal
        isOpen={true}
        onClose={onClose}
        onStartDemo={onStartDemo}
        onSelectTool={vi.fn()}
      />
    );

    const demoButton = screen.getByRole('button', { name: /Probar Caso Demo \(1 Clic\)/i });
    await userEvent.click(demoButton);

    expect(onStartDemo).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('ark_onboarding_completed')).toBe('true');
  });

  it('permite saltar directamente a una herramienta real como Nómina', async () => {
    const onSelectTool = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingQuickstartModal
        isOpen={true}
        onClose={onClose}
        onStartDemo={vi.fn()}
        onSelectTool={onSelectTool}
      />
    );

    const nominaButton = screen.getByRole('button', { name: /Nómina & Finiquitos/i });
    await userEvent.click(nominaButton);

    expect(onSelectTool).toHaveBeenCalledWith('nomina');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('ark_onboarding_completed')).toBe('true');
  });

  it('permite cerrar el modal con el botón de omitir y respeta el checkbox de no volver a mostrar', async () => {
    const onClose = vi.fn();

    render(
      <OnboardingQuickstartModal
        isOpen={true}
        onClose={onClose}
        onStartDemo={vi.fn()}
        onSelectTool={vi.fn()}
      />
    );

    const skipButton = screen.getByRole('button', { name: /Omitir y explorar libremente/i });
    await userEvent.click(skipButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('ark_onboarding_completed')).toBe('true');
  });
});
