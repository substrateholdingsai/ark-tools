import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingCelebrationModal } from './OnboardingCelebrationModal';

describe('OnboardingCelebrationModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <OnboardingCelebrationModal
        isOpen={false}
        onClose={vi.fn()}
        onOpenPapel={vi.fn()}
        onStartRealClient={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza título de felicitación, propuesta de valor y hash SHA-256', () => {
    render(
      <OnboardingCelebrationModal
        isOpen={true}
        onClose={vi.fn()}
        onOpenPapel={vi.fn()}
        onStartRealClient={vi.fn()}
        hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      />
    );

    expect(
      screen.getByRole('heading', { name: /Has generado tu primer Papel de Trabajo oficial/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/¡Cálculo Blindado con Éxito!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855/i)
    ).toBeInTheDocument();
  });

  it('ejecuta onStartRealClient y onClose al pulsar el botón principal', async () => {
    const onStartRealClient = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingCelebrationModal
        isOpen={true}
        onClose={onClose}
        onOpenPapel={vi.fn()}
        onStartRealClient={onStartRealClient}
      />
    );

    const button = screen.getByRole('button', { name: /Registrar mi Primer Cliente Real/i });
    await userEvent.click(button);

    expect(onStartRealClient).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta onOpenPapel y onClose al pulsar ver cédula oficial', async () => {
    const onOpenPapel = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingCelebrationModal
        isOpen={true}
        onClose={onClose}
        onOpenPapel={onOpenPapel}
        onStartRealClient={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /Ver Cédula Oficial con QR/i });
    await userEvent.click(button);

    expect(onOpenPapel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
