/**
 * ARK TOOLS — Generador de Links de Pago (Clip)
 * Componente: Formulario de Configuración de Cobro
 */

import React, { useState } from 'react';
import { DollarSign, FileText, User, Phone, Tag, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { GlassButton } from '@/components/ui';
import type { ClipCheckoutPayload } from '../types';

interface FormularioCobroProps {
  onGenerarLink: (payload: ClipCheckoutPayload) => Promise<void>;
  onMontoChange: (monto: number, msi: number) => void;
  isLoading: boolean;
}

const PRESETS_MONTO = [500, 1500, 3000, 5000, 10000];

export const FormularioCobro: React.FC<FormularioCobroProps> = ({
  onGenerarLink,
  onMontoChange,
  isLoading,
}) => {
  const [montoStr, setMontoStr] = useState('1500');
  const [concepto, setConcepto] = useState('Servicios Contables y Asesoría Fiscal');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [referencia, setReferencia] = useState('');
  const [msi, setMsi] = useState(0);
  const [enableOxxo, setEnableOxxo] = useState(true);
  const [diasExpiracion, setDiasExpiracion] = useState(7);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const handleMontoInputChange = (valor: string) => {
    setMontoStr(valor);
    const num = parseFloat(valor) || 0;
    onMontoChange(num, msi);
  };

  const handlePresetClick = (valor: number) => {
    setMontoStr(String(valor));
    onMontoChange(valor, msi);
  };

  const handleMsiChange = (nuevoMsi: number) => {
    setMsi(nuevoMsi);
    const num = parseFloat(montoStr) || 0;
    onMontoChange(num, nuevoMsi);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const montoNum = parseFloat(montoStr);
    if (!montoNum || montoNum < 1) {
      setErrorValidacion('Por favor ingresa un monto válido mayor o igual a $1.00 MXN.');
      return;
    }

    if (!concepto.trim()) {
      setErrorValidacion('Por favor ingresa una descripción para el cobro.');
      return;
    }

    await onGenerarLink({
      amount: montoNum,
      purchase_description: concepto.trim(),
      customer_name: cliente.trim() || undefined,
      customer_email: undefined,
      client_reference: referencia.trim() || undefined,
      enable_oxxo: enableOxxo,
      expires_in_days: diasExpiracion > 0 ? diasExpiracion : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Monto */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <DollarSign className="h-3.5 w-3.5 text-gold" />
          Monto a cobrar (MXN)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="1"
            max="500000"
            required
            value={montoStr}
            onChange={(e) => handleMontoInputChange(e.target.value)}
            className="bg-surface-raised w-full rounded-2xl border border-white/10 py-3.5 pl-9 pr-4 font-mono text-xl font-bold text-ink transition-colors placeholder:text-muted/40 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
            placeholder="0.00"
          />
        </div>

        {/* Botones rápidos de monto */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="mr-1 text-[10px] font-bold uppercase text-muted">Rápidos:</span>
          {PRESETS_MONTO.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => handlePresetClick(p)}
              className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                parseFloat(montoStr) === p
                  ? 'border-gold/40 bg-gold/20 font-bold text-gold'
                  : 'hover:bg-surface-raised border-white/5 bg-surface text-muted'
              }`}
            >
              ${p.toLocaleString('es-MX')}
            </button>
          ))}
        </div>
      </div>

      {/* Concepto / Descripción */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-gold" />
            Concepto del Cobro
          </span>
          <span className="text-[10px] text-muted">{concepto.length}/250</span>
        </label>
        <input
          type="text"
          maxLength={250}
          required
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej. Honorarios Contables Mensuales Marzo 2026"
          className="bg-surface-raised w-full rounded-xl border border-white/10 px-4 py-3 text-xs text-ink transition-colors placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
      </div>

      {/* Cliente y Teléfono WhatsApp */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <User className="h-3.5 w-3.5 text-gold" />
            Nombre del Cliente (Opcional)
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej. Juan Pérez / Empresa SA"
            className="bg-surface-raised w-full rounded-xl border border-white/10 px-4 py-3 text-xs text-ink transition-colors placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            WhatsApp del Cliente (Opcional)
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 5512345678"
            className="bg-surface-raised w-full rounded-xl border border-white/10 px-4 py-3 text-xs text-ink transition-colors placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>
      </div>

      {/* Referencia interna y Expiración */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Tag className="h-3.5 w-3.5 text-gold" />
            Folio o Referencia Interna
          </label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. FAC-2026-088"
            className="bg-surface-raised w-full rounded-xl border border-white/10 px-4 py-3 text-xs text-ink transition-colors placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            Vigencia del Enlace
          </label>
          <select
            value={diasExpiracion}
            onChange={(e) => setDiasExpiracion(Number(e.target.value))}
            className="bg-surface-raised w-full cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-xs text-ink transition-colors focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          >
            <option value={1}>Expira en 24 horas</option>
            <option value={3}>Expira en 3 días</option>
            <option value={7}>Expira en 7 días (Recomendado)</option>
            <option value={30}>Expira en 30 días</option>
            <option value={0}>Sin expiración automática</option>
          </select>
        </div>
      </div>

      {/* Meses Sin Intereses */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted">
          Plazo / Meses Sin Intereses (MSI)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { m: 0, label: 'Contado' },
            { m: 3, label: '3 MSI' },
            { m: 6, label: '6 MSI' },
            { m: 9, label: '9 MSI' },
            { m: 12, label: '12 MSI' },
          ].map((item) => (
            <button
              type="button"
              key={item.m}
              onClick={() => handleMsiChange(item.m)}
              className={`rounded-xl border px-1 py-2 text-center text-xs font-medium transition-colors ${
                msi === item.m
                  ? 'border-gold bg-gold font-bold text-navy shadow-md'
                  : 'hover:bg-surface-raised border-white/10 bg-surface text-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle OXXO */}
      <div className="bg-surface-raised/40 flex items-center justify-between rounded-xl border border-white/5 p-4">
        <div>
          <span className="block text-xs font-semibold text-ink">
            Aceptar Pagos en Efectivo en OXXO®
          </span>
          <span className="text-[11px] text-muted">
            Permite al cliente generar un código de barras para liquidar en cualquier tienda OXXO.
          </span>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enableOxxo}
            onChange={(e) => setEnableOxxo(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
        </label>
      </div>

      {errorValidacion && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
          {errorValidacion}
        </div>
      )}

      {/* Botón de Generación */}
      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading}
        className="shadow-xl shadow-gold/25"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            GENERANDO CHECKOUT EN CLIP...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            GENERAR LINK DE PAGO CLIP
          </>
        )}
      </GlassButton>
    </form>
  );
};
