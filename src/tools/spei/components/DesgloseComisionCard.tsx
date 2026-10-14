/**
 * ARK TOOLS — Generador de Links de Pago (Clip)
 * Componente: Tarjeta de Desglose de Comisiones Clip y Neto a Recibir
 */

import React from 'react';
import { Banknote, HelpCircle } from 'lucide-react';
import { LiquidGlassDome, TextMagnified, BadgeGold } from '@/components/ui';
import { formatearMXN } from '../lib/clipClient';
import type { ComisionClip } from '../types';

interface DesgloseComisionCardProps {
  comision: ComisionClip;
}

export const DesgloseComisionCard: React.FC<DesgloseComisionCardProps> = ({
  comision,
}) => {
  return (
    <LiquidGlassDome padding="lg" radius="dome" className="w-full">
      <div className="flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-xl font-bold text-ink">
                  Liquidación Bancaria Estimada
                </h3>
                <BadgeGold size="sm">CLIP CHECKOUT</BadgeGold>
              </div>
              <p className="text-xs text-muted">
                Transferencia automática a tu cuenta CLABE al siguiente día hábil
              </p>
            </div>
          </div>
        </div>

        {/* Cifra Clave: Neto a Recibir */}
        <div className="bg-surface/60 rounded-2xl p-6 border border-white/5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Neto estimado a depositar en tu banco
          </span>
          <TextMagnified size="2xl">
            {formatearMXN(comision.netoRecibido)}
          </TextMagnified>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted">
            <span>De un cobro total de <strong>{formatearMXN(comision.montoCobrado)}</strong></span>
            <span>•</span>
            <span className="text-amber-300">
              Comisión total Clip: -{formatearMXN(comision.comisionTotal)}
            </span>
          </div>
        </div>

        {/* Desglose de Comisiones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Comisión Base Clip
            </span>
            <p className="mt-1 text-base font-semibold text-ink font-mono">
              3.60% + IVA
            </p>
            <span className="text-[10px] text-muted block mt-0.5">
              4.176% tasa efectiva
            </span>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Sobretasa MSI
            </span>
            <p className="mt-1 text-base font-semibold text-ink font-mono">
              {comision.msiMeses > 0 ? `+${comision.sobretasaMSIPorcentaje}%` : 'Contado (0%)'}
            </p>
            <span className="text-[10px] text-muted block mt-0.5">
              {comision.msiMeses > 0 ? `${comision.msiMeses} Meses Sin Intereses` : 'Sin financiamiento'}
            </span>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Total Retenido Clip
            </span>
            <p className="mt-1 text-base font-semibold text-red-300 font-mono">
              -{formatearMXN(comision.comisionTotal)}
            </p>
            <span className="text-[10px] text-muted block mt-0.5">
              Incluye IVA acreditable
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted/70 bg-surface/20 p-3 rounded-xl border border-white/5">
          <HelpCircle className="h-4 w-4 shrink-0 text-gold" />
          <span>
            Clip emite factura CFDI con el desglose de comisiones mensuales para deducir el gasto y acreditar el IVA.
          </span>
        </div>
      </div>
    </LiquidGlassDome>
  );
};
