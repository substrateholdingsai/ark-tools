/**
 * ARK TOOLS — Modal de Gestión de Equipo y Colaboradores del Despacho
 *
 * Permite a los titulares (owner) y administradores (admin) gestionar el equipo:
 * 1. Lista de miembros activos con badges de rol (Titular, Administrador, Colaborador).
 * 2. Modificación de roles (owner -> admin <-> member).
 * 3. Expulsión de miembros o salida voluntaria.
 * 4. Envío de invitaciones por correo electrónico con enlace seguro (7 días de vigencia).
 * 5. Visualización y revocación de invitaciones pendientes.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  UserCheck,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  Building2,
  ChevronDown,
} from 'lucide-react';
import {
  apiClient,
  type TenantMember,
  type TenantPendingInvitation,
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamModal({ isOpen, onClose }: TeamModalProps) {
  const { tenantId, tenantName, orgRole, platformRole, user } = useAuth();

  const isSuperAdmin = platformRole === 'super_admin';
  const isOwner = orgRole === 'owner' || isSuperAdmin;
  const isAdmin = orgRole === 'admin';
  const canManage = isOwner || isAdmin;

  const [activeTab, setActiveTab] = useState<'members' | 'invite'>('members');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invitations, setInvitations] = useState<TenantPendingInvitation[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulario de invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  // Acciones en progreso
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<TenantMember | null>(null);

  const loadTeamData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.teams.getMembers(tenantId);
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar los miembros del despacho.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (isOpen && tenantId) {
      void loadTeamData();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, tenantId, loadTeamData]);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !inviteEmail.trim()) return;

    setInviting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.teams.inviteMember(tenantId, inviteEmail.trim(), inviteRole);
      setSuccessMsg(res.message || `Invitación enviada exitosamente a ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('member');
      await loadTeamData();
      setActiveTab('members');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo enviar la invitación.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!tenantId) return;
    setActionUserId(invitationId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.teams.revokeInvitation(tenantId, invitationId);
      setSuccessMsg(res.message || 'Invitación revocada.');
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo revocar la invitación.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: 'admin' | 'member') => {
    if (!tenantId || !isOwner) return;
    setActionUserId(memberUserId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.teams.updateMemberRole(tenantId, memberUserId, newRole);
      setSuccessMsg('Rol de colaborador actualizado.');
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar el rol.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!tenantId || !confirmRemoveMember) return;
    const target = confirmRemoveMember;
    setConfirmRemoveMember(null);
    setActionUserId(target.userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.teams.removeMember(tenantId, target.userId);
      setSuccessMsg(`"${target.fullName || target.email}" ha sido removido del despacho.`);
      setMembers((prev) => prev.filter((m) => m.userId !== target.userId));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo remover al miembro.');
    } finally {
      setActionUserId(null);
    }
  };

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: number) => {
    const diff = expiresAt - Math.floor(Date.now() / 1000);
    const days = Math.ceil(diff / 86400);
    return days > 0 ? `${days} día${days > 1 ? 's' : ''}` : 'expirando';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/15 bg-navy/5 text-navy">
              <Users size={20} className="text-gold-dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron text-[15px] font-bold text-navy">
                  Equipo y Colaboradores
                </h2>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase tracking-wider text-navy">
                  {orgRole === 'owner' ? 'Titular' : orgRole === 'admin' ? 'Administrador' : 'Colaborador'}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <Building2 size={12} className="text-gold-dark" />
                <span>{tenantName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-6 py-2.5 text-[12px] text-rose-700">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-6 py-2.5 text-[12px] text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex items-center justify-between border-b border-line px-6 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-3 py-2 text-[12px] font-bold transition',
                activeTab === 'members'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-muted hover:text-ink'
              )}
            >
              <Users size={14} />
              <span>Miembros Activos ({members.length})</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-2 text-[12px] font-bold transition',
                  activeTab === 'invite'
                    ? 'border-navy text-navy'
                    : 'border-transparent text-muted hover:text-ink'
                )}
              >
                <UserPlus size={14} />
                <span>Invitar Colaborador</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void loadTeamData()}
            disabled={loading}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted transition hover:bg-surface-2 hover:text-ink"
            title="Actualizar lista"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'members' ? (
            <div className="space-y-6">
              {/* Sección 1: Miembros Activos */}
              <div>
                <h3 className="mb-3 font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted">
                  Colaboradores del Despacho
                </h3>

                {members.length === 0 && !loading ? (
                  <div className="rounded-xl border border-line bg-surface p-6 text-center text-[12px] text-muted">
                    No hay miembros registrados en este despacho.
                  </div>
                ) : (
                  <div className="divide-y divide-line/60 rounded-xl border border-line bg-white shadow-xs">
                    {members.map((member) => {
                      const isMe = member.userId === user?.id;
                      const isMemberOwner = member.role === 'owner';
                      const isMemberAdmin = member.role === 'admin';

                      return (
                        <div
                          key={member.userId}
                          className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-navy font-orbitron text-[11px] font-bold text-gold">
                              {(member.fullName || member.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[13px] font-bold text-ink">
                                  {member.fullName || member.email.split('@')[0]}
                                </span>
                                {isMe && (
                                  <span className="rounded bg-navy/10 px-1.5 py-0.2 font-orbitron text-[9px] font-bold text-navy">
                                    TÚ
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted">
                                <span className="truncate">{member.email}</span>
                                <span>•</span>
                                <span>Desde {formatDate(member.joinedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rol y Acciones */}
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            {/* Selector de Rol para Owner */}
                            {isOwner && !isMemberOwner && !isMe ? (
                              <div className="relative">
                                <select
                                  value={member.role}
                                  disabled={actionUserId === member.userId}
                                  onChange={(e) =>
                                    void handleRoleChange(
                                      member.userId,
                                      e.target.value as 'admin' | 'member'
                                    )
                                  }
                                  className="h-8 rounded-lg border border-line bg-surface-2 px-2.5 pr-7 text-[11px] font-semibold text-navy outline-none transition focus:border-navy"
                                >
                                  <option value="member">Colaborador</option>
                                  <option value="admin">Administrador</option>
                                </select>
                                <ChevronDown
                                  size={12}
                                  className="pointer-events-none absolute right-2 top-2.5 text-muted"
                                />
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                                  isMemberOwner
                                    ? 'border border-amber-300 bg-amber-50 text-amber-900'
                                    : isMemberAdmin
                                      ? 'border border-sky-300 bg-sky-50 text-sky-900'
                                      : 'border border-slate-200 bg-slate-50 text-slate-700'
                                )}
                              >
                                {isMemberOwner ? (
                                  <Crown size={12} className="text-gold-dark" />
                                ) : isMemberAdmin ? (
                                  <Shield size={12} className="text-sky-600" />
                                ) : (
                                  <UserCheck size={12} className="text-slate-500" />
                                )}
                                <span>
                                  {isMemberOwner
                                    ? 'Titular'
                                    : isMemberAdmin
                                      ? 'Administrador'
                                      : 'Colaborador'}
                                </span>
                              </span>
                            )}

                            {/* Botón Remover Miembro */}
                            {canManage && !isMemberOwner && !isMe && (
                              <button
                                type="button"
                                disabled={actionUserId === member.userId}
                                onClick={() => setConfirmRemoveMember(member)}
                                className="rounded-lg p-1.5 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                                title="Remover del despacho"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sección 2: Invitaciones Pendientes */}
              {canManage && invitations.length > 0 && (
                <div>
                  <h3 className="mb-3 font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted">
                    Invitaciones Pendientes ({invitations.length})
                  </h3>

                  <div className="divide-y divide-line/60 rounded-xl border border-line bg-surface/50 shadow-xs">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                            <Mail size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[12px] font-bold text-ink">
                                {inv.email}
                              </span>
                              <span className="rounded bg-surface-2 px-1.5 py-0.2 font-orbitron text-[9px] font-semibold text-muted">
                                {inv.role === 'admin' ? 'Administrador' : 'Colaborador'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted">
                              <Clock size={11} />
                              <span>
                                Expira en {getDaysRemaining(inv.expiresAt)} (enviada por{' '}
                                {inv.invitedByName || inv.invitedByEmail})
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={actionUserId === inv.id}
                          onClick={() => void handleRevokeInvite(inv.id)}
                          className="flex items-center gap-1 self-end rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 sm:self-center"
                        >
                          <X size={13} />
                          <span>Revocar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Pestaña: Enviar Invitación */
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-navy/15 bg-navy/5 text-navy">
                    <Mail size={18} className="text-gold-dark" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-navy">
                      Invitar a un nuevo colaborador
                    </h4>
                    <p className="mt-0.5 text-[11px] text-muted">
                      El invitado recibirá un correo transaccional de ARK TOOLS con un enlace de acceso seguro para unirse inmediatamente al despacho.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                  Correo Electrónico del Colaborador
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ejemplo: asistente@despacho.com"
                  className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                  Rol en el Despacho
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole('member')}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3 text-left transition',
                      inviteRole === 'member'
                        ? 'border-navy bg-navy/5'
                        : 'border-line bg-surface-2 hover:bg-surface'
                    )}
                  >
                    <UserCheck size={18} className="shrink-0 text-slate-600" />
                    <div>
                      <div className="text-[12px] font-bold text-navy">Colaborador</div>
                      <div className="text-[10px] text-muted">
                        Acceso completo para capturar y consultar expedientes, clientes y cálculos fiscales.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isOwner}
                    onClick={() => setInviteRole('admin')}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3 text-left transition',
                      inviteRole === 'admin'
                        ? 'border-navy bg-navy/5'
                        : 'border-line bg-surface-2 hover:bg-surface',
                      !isOwner && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Shield size={18} className="shrink-0 text-sky-700" />
                    <div>
                      <div className="text-[12px] font-bold text-navy">Administrador</div>
                      <div className="text-[10px] text-muted">
                        {isOwner
                          ? 'Puede invitar y gestionar colaboradores además de utilizar todas las herramientas.'
                          : 'Solo el titular puede otorgar permisos de administrador.'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy font-orbitron text-[11px] font-bold tracking-wider text-white shadow-sm transition hover:bg-navy-dark disabled:opacity-50"
                >
                  {inviting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>ENVIANDO INVITACIÓN...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} className="text-gold" />
                      <span>ENVIAR INVITACIÓN POR CORREO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal de confirmación para remover miembro */}
        {confirmRemoveMember && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
            <div className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center gap-2 text-rose-600">
                <AlertCircle size={20} />
                <h4 className="font-orbitron text-[13px] font-bold">¿Remover colaborador?</h4>
              </div>
              <p className="text-[12px] leading-relaxed text-ink">
                ¿Estás seguro de que deseas revocar el acceso de{' '}
                <strong>{confirmRemoveMember.fullName || confirmRemoveMember.email}</strong> a este despacho?
                Ya no podrá visualizar los clientes ni expedientes vinculados.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveMember(null)}
                  className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-surface-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveMember()}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
                >
                  Sí, remover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamModal;
