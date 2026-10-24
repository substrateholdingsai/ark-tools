/**
 * ARK LEDGER — Modal de Conexión de Cuenta Alegra
 *
 * Permite al usuario ingresar sus credenciales de API de forma segura.
 * Incluye validación de token, enlace de ayuda y comprobación de CSD.
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AlegraAccount } from '@/lib/apiClient';

interface AlegraConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: AlegraAccount) => void;
  onConnect: (params: {
    alegra_email: string;
    alegra_token: string;
    is_default?: boolean;
  }) => Promise<AlegraAccount>;
}

export const AlegraConnectModal: React.FC<AlegraConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onConnect,
}) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isDefault, setIsDefault] = useState(true);
  const [csdConfirmed, setCsdConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !token.trim()) {
      setError('Por favor ingresa tanto el correo como el token de API.');
      return;
    }
    if (!csdConfirmed) {
      setError('Por favor confirma que tu cuenta cuenta con CSD o acceso fiscal configurado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const account = await onConnect({
        alegra_email: email.trim(),
        alegra_token: token.trim(),
        is_default: isDefault,
      });
      onSuccess(account);
      onClose();
    } catch (err: any) {
      setError(
        err?.message || 'Error al conectar la cuenta con Alegra. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Conectar Cuenta de Alegra
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timbrado de Facturas CFDI 4.0 con PAC Quadrum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email registrado en Alegra
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@tudespacho.com"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Token */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Token de API de Alegra
              </label>
              <a
                href="https://app.alegra.com/configuration/api"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                ¿Dónde encuentro mi token?
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa tu token generado en Alegra"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-10 font-mono text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              El token se cifra con AES-GCM (256 bits) y nunca se expone en el navegador.
            </p>
          </div>

          {/* Confirm CSD */}
          <div className="pt-2">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={csdConfirmed}
                onChange={(e) => setCsdConfirmed(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Confirmo que esta cuenta en Alegra tiene cargado su{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  Certificado de Sello Digital (CSD)
                </strong>{' '}
                y cuenta con plan compatible para timbrar facturas ante el SAT.
              </span>
            </label>
          </div>

          {/* Default Account */}
          <div>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Usar como cuenta predeterminada para timbrar facturas en este despacho.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !csdConfirmed}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando con Alegra...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Conectar Cuenta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
