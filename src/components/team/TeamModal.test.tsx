import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamModal } from './TeamModal';

// Mock de useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    tenantId: 'tenant-123',
    tenantName: 'Despacho Contable Águila',
    orgRole: 'owner',
    platformRole: 'user',
    user: { id: 'user-owner', email: 'owner@aguila.com', fullName: 'Lic. Águila' },
  }),
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    teams: {
      getMembers: vi.fn(),
      inviteMember: vi.fn(),
      revokeInvitation: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
    },
  },
}));

import { apiClient } from '@/lib/apiClient';

describe('TeamModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(<TeamModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Equipo y Colaboradores')).not.toBeInTheDocument();
  });

  it('carga y renderiza la lista de miembros activos e invitaciones pendientes', async () => {
    vi.mocked(apiClient.teams.getMembers).mockResolvedValueOnce({
      tenantId: 'tenant-123',
      currentUserRole: 'owner',
      members: [
        {
          userId: 'user-owner',
          email: 'owner@aguila.com',
          fullName: 'Lic. Águila',
          role: 'owner',
          joinedAt: 1792000000,
        },
        {
          userId: 'user-2',
          email: 'asistente@aguila.com',
          fullName: 'Ana Asistente',
          role: 'member',
          joinedAt: 1792100000,
        },
      ],
      invitations: [
        {
          id: 'inv-1',
          email: 'nuevo@aguila.com',
          role: 'member',
          createdAt: 1792150000,
          expiresAt: Math.floor(Date.now() / 1000) + 86400 * 5,
          invitedByEmail: 'owner@aguila.com',
          invitedByName: 'Lic. Águila',
        },
      ],
    });

    render(<TeamModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Equipo y Colaboradores')).toBeInTheDocument();
    expect(screen.getByText('Despacho Contable Águila')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lic. Águila')).toBeInTheDocument();
      expect(screen.getByText('Ana Asistente')).toBeInTheDocument();
      expect(screen.getByText('nuevo@aguila.com')).toBeInTheDocument();
    });
  });

  it('permite cambiar a la pestaña de invitar y enviar una invitación', async () => {
    vi.mocked(apiClient.teams.getMembers).mockResolvedValue({
      tenantId: 'tenant-123',
      currentUserRole: 'owner',
      members: [],
      invitations: [],
    });

    vi.mocked(apiClient.teams.inviteMember).mockResolvedValueOnce({
      success: true,
      message: 'Invitación enviada con éxito.',
      invitation: {
        id: 'inv-99',
        email: 'contador@nuevo.com',
        role: 'member',
        expiresAt: 1792700000,
      },
    });

    render(<TeamModal isOpen={true} onClose={vi.fn()} />);

    const inviteTabBtn = screen.getByText('Invitar Colaborador');
    fireEvent.click(inviteTabBtn);

    expect(screen.getByText('Invitar a un nuevo colaborador')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/asistente@despacho.com/i);
    fireEvent.change(emailInput, { target: { value: 'contador@nuevo.com' } });

    const submitBtn = screen.getByText('ENVIAR INVITACIÓN POR CORREO');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.teams.inviteMember).toHaveBeenCalledWith(
        'tenant-123',
        'contador@nuevo.com',
        'member'
      );
    });
  });
});
