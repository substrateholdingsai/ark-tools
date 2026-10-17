/**
 * ARK TOOLS — Modal de Conexión de Cuenta Alegra
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
      setError(err?.message || 'Error al conectar la cuenta con Alegra. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
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
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email registrado en Alegra
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@tudespacho.com"
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Token de API de Alegra
              </label>
              <a
                href="https://app.alegra.com/configuration/api"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                ¿Dónde encuentro mi token?
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa tu token generado en Alegra"
                disabled={loading}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              El token se cifra con AES-GCM (256 bits) y nunca se expone en el navegador.
            </p>
          </div>

          {/* Confirm CSD */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={csdConfirmed}
                onChange={(e) => setCsdConfirmed(e.target.checked)}
                disabled={loading}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={loading}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Usar como cuenta predeterminada para timbrar facturas en este despacho.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !csdConfirmed}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando con Alegra...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
