/**
 * ARK TOOLS — Modal de Aceptación de Invitaciones
 *
 * Flujo de onboarding cuando un colaborador o nuevo usuario abre el enlace:
 * https://tools.arksystems.site/?auth=invite&token=...
 *
 * Casos contemplados:
 * 1. Usuario con sesión iniciada con el mismo correo -> Aceptación en 1 clic.
 * 2. Usuario con sesión iniciada con correo diferente -> Advertencia y cambio de cuenta.
 * 3. Usuario existente no autenticado -> Solicita contraseña e inicia sesión.
 * 4. Nuevo usuario -> Define contraseña segura (≥ 15 chars) y nombre para crear cuenta al instante.
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  AlertCircle,
  X,
  Lock,
  User,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { apiClient, type InvitationInfoResponse } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '../Logo';

interface InviteAcceptModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteAcceptModal({ token, isOpen, onClose, onSuccess }: InviteAcceptModalProps) {
  const { isSignedIn, user, refreshSession, signOut, switchTenant } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<InvitationInfoResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos para usuarios no autenticados
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!isOpen || !token) return;

    setLoading(true);
    setErrorMsg(null);

    void apiClient.teams
      .getInvitationInfo(token)
      .then((res) => {
        setInfo(res);
        if (!res.valid) {
          setErrorMsg(res.error || 'Esta invitación no es válida o ha expirado.');
        }
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Error al verificar la invitación.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAccept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.teams.acceptInvitation({
        token,
        password: password || undefined,
        fullName: fullName.trim() || undefined,
      });

      // Recargar sesión y actualizar contexto
      await refreshSession();

      // Si el despacho devuelto tiene ID, activarlo
      const targetTenant = res.session.tenants.find((t) => t.name === info?.invitation?.tenantName);
      if (targetTenant) {
        switchTenant(targetTenant.id);
      }

      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo aceptar la invitación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut();
    } catch {
      // Ignorar error de logout
    }
  };

  const invitation = info?.invitation;
  const isEmailMismatch =
    isSignedIn && user && invitation && user.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div
      onClick={onClose}
      className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
      >
        {/* Encabezado */}
        <div className="border-b border-line bg-surface-2/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <h3 className="font-orbitron text-[13px] font-bold tracking-wider text-navy">
                  ARK TOOLS
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Colaboración en Equipo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted transition hover:bg-surface hover:text-ink"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw size={28} className="animate-spin text-navy" />
              <p className="mt-3 font-orbitron text-[12px] font-bold text-navy">
                Verificando invitación...
              </p>
              <p className="mt-1 text-[11px] text-muted">Validando enlace de acceso seguro</p>
            </div>
          ) : !info?.valid || !invitation ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-orbitron text-[14px] font-bold text-ink">
                  Invitación no disponible
                </h4>
                <p className="mt-1.5 text-[12px] text-muted">
                  {errorMsg ||
                    'El enlace de invitación no es válido, ya fue utilizado o ha expirado.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-navy py-2.5 font-orbitron text-[11px] font-bold tracking-wider text-white transition hover:bg-navy-dark"
              >
                IR AL INICIO
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tarjeta de Detalles del Despacho */}
              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy/15 bg-navy/5 text-navy">
                    <Building2 size={20} className="text-gold-dark" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Invitación al Despacho
                    </span>
                    <h4 className="text-[15px] font-bold text-navy">{invitation.tenantName}</h4>
                    <p className="mt-0.5 text-[12px] text-ink">
                      <strong>{invitation.inviterName}</strong> te ha invitado como{' '}
                      <span className="font-bold text-navy">
                        {invitation.role === 'admin' ? 'Administrador' : 'Colaborador'}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensajes de error */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Caso A: Usuario ya con sesión activa */}
              {isSignedIn && user ? (
                isEmailMismatch ? (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-900">
                    <p>
                      Esta invitación fue enviada exclusivamente a{' '}
                      <strong>{invitation.email}</strong>, pero actualmente tienes una sesión activa
                      como <strong>{user.email}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSwitchAccount()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 py-2 text-[11px] font-bold text-white transition hover:bg-amber-900"
                    >
                      <LogOut size={14} />
                      <span>Cerrar sesión actual para unirme</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[12px] text-muted">
                      Has iniciado sesión como <strong>{user.email}</strong>. Al aceptar, este
                      despacho se vinculará de inmediato a tu cuenta.
                    </p>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleAccept()}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy font-orbitron text-[11px] font-bold tracking-wider text-white shadow-sm transition hover:bg-navy-dark disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>UNIÉNDOME AL DESPACHO...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} className="text-gold" />
                          <span>ACEPTAR INVITACIÓN Y ENTRAR</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                /* Caso B: Usuario no autenticado */
                <form onSubmit={handleAccept} className="space-y-4">
                  {info.userExists ? (
                    <div>
                      <p className="mb-3 text-[12px] text-ink">
                        Tu cuenta <strong>{invitation.email}</strong> ya está registrada en ARK
                        TOOLS. Ingresa tu contraseña para aceptar la invitación e ingresar al
                        despacho:
                      </p>
                      <div>
                        <label className="mb-1 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink">
                          Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tu contraseña de acceso"
                            className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 pr-10 text-[13px] text-ink outline-none transition focus:border-navy"
                          />
                          <Lock
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-3 text-muted"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-[12px] text-ink">
                        Te damos la bienvenida a ARK TOOLS para <strong>{invitation.email}</strong>.
                        Crea tu contraseña para unirte al despacho:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink">
                            Tu Nombre Completo (Opcional)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="ej. Lic. Roberto Gómez"
                              className="h-10 w-full rounded-xl border border-line bg-surface-2 px-3.5 pr-10 text-[12px] text-ink outline-none transition focus:border-navy"
                            />
                            <User
                              size={15}
                              className="pointer-events-none absolute right-3.5 top-2.5 text-muted"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink">
                            Crear Contraseña (Mínimo 15 caracteres)
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              minLength={15}
                              maxLength={128}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Mínimo 15 caracteres..."
                              className="h-10 w-full rounded-xl border border-line bg-surface-2 px-3.5 pr-10 text-[12px] text-ink outline-none transition focus:border-navy"
                            />
                            <Lock
                              size={15}
                              className="pointer-events-none absolute right-3.5 top-2.5 text-muted"
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted">
                            Por seguridad nativa del sistema fiscal, la contraseña debe contener al
                            menos 15 caracteres.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (info.userExists ? !password : password.length < 15)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy font-orbitron text-[11px] font-bold tracking-wider text-white shadow-sm transition hover:bg-navy-dark disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>PROCESANDO ACCESO...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {info.userExists ? 'ACEPTAR E INICIAR SESIÓN' : 'CREAR CUENTA Y UNIRME'}
                        </span>
                        <ArrowRight size={14} className="text-gold" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Pie con botón de cierre */}
        <div className="flex items-center justify-between border-t border-line bg-surface-2/50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-semibold text-muted hover:text-navy"
          >
            Ahora no / Cancelar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shadow-xs rounded-xl border border-line bg-white px-4 py-1.5 font-orbitron text-[10px] font-bold text-navy transition hover:bg-surface-2"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteAcceptModal;
