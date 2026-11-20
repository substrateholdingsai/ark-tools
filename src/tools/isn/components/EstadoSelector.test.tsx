import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ESTADOS } from '../data/estados';
import { EstadoSelector } from './EstadoSelector';

describe('EstadoSelector', () => {
  it('muestra la tasa de Yucatán sin redondearla a una decimal', () => {
    const yucatan = ESTADOS.find((estado) => estado.id === 'YUC');
    expect(yucatan).toBeDefined();

    render(<EstadoSelector value={yucatan!} onChange={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'Yucatán — 3.75%' })).toBeInTheDocument();
    expect(screen.getByText('3.75%')).toBeInTheDocument();
    expect(screen.queryByText('3.8%')).not.toBeInTheDocument();
  });
});
