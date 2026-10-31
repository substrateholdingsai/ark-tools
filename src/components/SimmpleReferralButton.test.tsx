import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimmpleReferralButton } from './SimmpleReferralButton';

describe('SimmpleReferralButton', () => {
  it('renderiza el enlace con el código de referido oficial', () => {
    render(<SimmpleReferralButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://app2.simmple.mx/register?ref=PAVE8BZP');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('muestra el texto contextual de opción A y las siglas de la marca', () => {
    render(<SimmpleReferralButton />);
    expect(screen.getByText('¿Buscas contabilidad PyME?')).toBeInTheDocument();
    expect(screen.getByText('SI')).toBeInTheDocument();
    expect(screen.getByText('MM')).toBeInTheDocument();
    expect(screen.getByText('PL')).toBeInTheDocument();
    expect(screen.getByText('Σ')).toBeInTheDocument();
  });
});
