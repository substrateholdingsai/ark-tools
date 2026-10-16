/**
 * ARK TOOLS — Resultado de Finiquito y Liquidación
 * Sprint 8 — Componente #4
 *
 * Card dorada de alto impacto visual con el monto total a pagar.
 * Utiliza LiquidGlassDome + TextMagnified + GlassButton (Design System ARK).
 *
 * Fundamento: LFT Arts. 50, 76, 79, 80, 87, 162, 486.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import {
  GlassButton,
  LiquidGlassDome,
  BadgeGold,
  GoldDivider,
  TextMagnified,
} from '@/components/ui';
import type { EntradaFiniquito, ResultadoFiniquito } from '../types';

interface Props {
  entrada: EntradaFiniquito;
  resultado: ResultadoFiniquito;
}

export function ResultadoFiniquitoCard({ entrada, resultado }: Props) {
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<number | null>(null);

  const {
    totalFiniquito,
    totalLiquidacion,
    importeAguinaldo,
    importeVacaciones,
    importePrimaVacacional,
    importePrimaAntiguedad,
    importeIndem90,
    importe20dias,
    diasAntiguedad,
    aniosExactos,
  } = resultado;

  const esLiquidacion = entrada.tipoBaja === 'liquidacion';
  const granTotal = esLiquidacion ? totalLiquidacion : totalFiniquito;

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  /** Copia al portapapeles un resumen estructurado para WhatsApp o correo */
  const handleCopiar = async () => {
    const texto = generarResumenTexto(entrada, resultado);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      timerRef.current = window.setTimeout(() => setCopiado(false), 2000);
    }
  };

  /** Descarga de dictamen/desglose en formato CSV compatible con Microsoft Excel (BOM UTF-8) */
  const handleDescargarCSV = () => {
    const contenido = generarContenidoCSV(entrada, resultado);
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fechaSlug = new Date().toISOString().split('T')[0];
    link.download = `calculo-${entrada.tipoBaja}-${fechaSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <LiquidGlassDome padding="lg" radius="dome" className="border border-gold/40 shadow-xl">
      {/* Header con Badge de Certeza Jurídica */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase font-orbitron block">
            CÁLCULO DEFINITIVO · {esLiquidacion ? 'DESPIDO INJUSTIFICADO' : 'RENUNCIA VOLUNTARIA'}
          </span>
          <h3 className="text-[22px] font-bold text-navy font-playfair mt-0.5">
            {esLiquidacion ? 'Total de Liquidación Legal' : 'Total de Finiquito Ordinario'}
          </h3>
        </div>
        <BadgeGold size="md">LFT OFICIAL 2026</BadgeGold>
      </div>

      {/* Cifra Magnificada Central */}
      <div className="my-5 p-5 sm:p-6 rounded-[20px] bg-gradient-to-b from-white/95 to-surface-2/70 border border-gold/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_6px_20px_rgba(212,175,55,0.14)]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gold-dark">
            <DollarSign className="w-3.5 h-3.5" />
            Importe bruto a liquidar
          </span>
          <span className="font-mono text-muted text-[10px]">
            {diasAntiguedad.toLocaleString('es-MX')} días laborados ({aniosExactos.toFixed(2)} años)
          </span>
        </div>

        <TextMagnified size="lg" className="text-navy my-1">
          ${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TextMagnified>

        {esLiquidacion ? (
          <div className="mt-3 pt-3 border-t border-gold/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted">
            <span>
              Prestaciones devengadas:{' '}
              <strong className="text-navy font-bold">
                ${totalFiniquito.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
            <span className="text-gold-dark font-bold font-orbitron">
              Indemnización constitucional:{' '}
              ${(importeIndem90 + importe20dias).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-[11px] font-mono text-muted">
            Solo prestaciones devengadas proporcionales (no incluye indemnizaciones constitucionales de despido).
          </div>
        )}
      </div>

      <GoldDivider spacing="sm" className="my-4" />

      {/* Desglose en Mini-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center my-4">
        <div className="p-3 rounded-[14px] bg-surface-2/80 border border-line">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
            Aguinaldo
          </span>
          <span className="font-orbitron font-bold text-[14px] text-navy block">
            ${importeAguinaldo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-muted font-mono">Art. 87 LFT</span>
        </div>

        <div className="p-3 rounded-[14px] bg-surface-2/80 border border-line">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
            Vacaciones + Prima
          </span>
          <span className="font-orbitron font-bold text-[14px] text-navy block">
            ${(importeVacaciones + importePrimaVacacional).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-muted font-mono">Arts. 76, 80 LFT</span>
        </div>

        <div className="p-3 rounded-[14px] bg-surface-2/80 border border-line">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
            Prima Antigüedad
          </span>
          <span className="font-orbitron font-bold text-[14px] text-navy block">
            {entrada.incluirPrimaAntiguedad
              ? `$${importePrimaAntiguedad.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </span>
          <span className="text-[9px] text-muted font-mono">Art. 162 LFT</span>
        </div>

        <div className="p-3 rounded-[14px] bg-surface-2/80 border border-line">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">
            {esLiquidacion ? 'Indemnización 90d' : 'Indemnizaciones'}
          </span>
          <span className="font-orbitron font-bold text-[14px] text-navy block">
            {esLiquidacion && entrada.incluirIndem90Dias
              ? `$${importeIndem90.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'N/A'}
          </span>
          <span className="text-[9px] text-muted font-mono">
            {esLiquidacion ? 'Art. 50 LFT' : 'Finiquito'}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-4 border-t border-line">
        <GlassButton
          variant="primary"
          size="md"
          onClick={handleCopiar}
          className="w-full sm:flex-1 flex items-center justify-center gap-2"
        >
          {copiado ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Copiado al Portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Resumen Ejecutivo</span>
            </>
          )}
        </GlassButton>

        <GlassButton
          variant="default"
          size="md"
          onClick={handleDescargarCSV}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-navy" />
          <span>Descargar Excel (CSV)</span>
        </GlassButton>
      </div>

      {/* Sello de Confianza y Certeza Jurídica */}
      <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
        <div className="flex items-center gap-1.5 text-navy">
          <ShieldCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />
          <span>Cálculo fundamentado en LFT con reforma Vacaciones Dignas y tope de 2×SMG.</span>
        </div>
        <span className="font-mono text-[9px] hidden sm:inline">ARK SYSTEMS · SOVEREIGN COMPUTE</span>
      </div>
    </LiquidGlassDome>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE RESUMEN Y EXPORTACIÓN
   ═══════════════════════════════════════════════════════════════ */

function generarResumenTexto(entrada: EntradaFiniquito, resultado: ResultadoFiniquito): string {
  const esLiquidacion = entrada.tipoBaja === 'liquidacion';
  const total = esLiquidacion ? resultado.totalLiquidacion : resultado.totalFiniquito;

  const lineas: string[] = [
    `═══════════════════════════════════════════════════════════`,
    `ARK TOOLS — DICTAMEN DE ${esLiquidacion ? 'LIQUIDACIÓN LABORAL' : 'FINIQUITO LABORAL'}`,
    `═══════════════════════════════════════════════════════════`,
    `Régimen: ${esLiquidacion ? 'Despido Injustificado / Rescisión Patronal' : 'Renuncia Voluntaria / Término de Contrato'}`,
    `Fecha de Ingreso: ${entrada.fechaIngreso}`,
    `Fecha de Baja:    ${entrada.fechaBaja}`,
    `Antigüedad:       ${resultado.diasAntiguedad.toLocaleString('es-MX')} días (${resultado.aniosExactos.toFixed(2)} años)`,
    `Salario Diario:   $${entrada.salarioDiario.toFixed(2)} MXN`,
    `Salario Integrado (SDI): $${entrada.sdi.toFixed(2)} MXN`,
    `───────────────────────────────────────────────────────────`,
    `CONCEPTOS CALCULADOS:`,
  ];

  for (const c of resultado.desglose) {
    if (!c.deshabilitado && c.importe > 0) {
      lineas.push(
        `• ${c.concepto.padEnd(38, ' ')}: $${c.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN (${c.fundamento})`
      );
    }
  }

  lineas.push(
    `───────────────────────────────────────────────────────────`,
    `TOTAL A PERCIBIR: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`,
    `═══════════════════════════════════════════════════════════`,
    `Calculado en ARK TOOLS (https://tools.arksystems.site) conforme a la Ley Federal del Trabajo.`
  );

  return lineas.join('\n');
}

function generarContenidoCSV(entrada: EntradaFiniquito, resultado: ResultadoFiniquito): string {
  const BOM = '\uFEFF';
  const esLiquidacion = entrada.tipoBaja === 'liquidacion';
  const total = esLiquidacion ? resultado.totalLiquidacion : resultado.totalFiniquito;

  const filas: string[] = [
    `"ARK TOOLS — Calculadora de Finiquitos y Liquidaciones"`,
    `"Tipo de Cálculo","${esLiquidacion ? 'Liquidación (Despido Injustificado)' : 'Finiquito (Renuncia Voluntaria)'}"`,
    `"Fecha de Ingreso","${entrada.fechaIngreso}"`,
    `"Fecha de Baja","${entrada.fechaBaja}"`,
    `"Días de Antigüedad","${resultado.diasAntiguedad}"`,
    `"Años Exactos","${resultado.aniosExactos}"`,
    `"Salario Diario","${entrada.salarioDiario}"`,
    `"Salario Diario Integrado (SDI)","${entrada.sdi}"`,
    ``,
    `"Concepto","Fórmula","Días","Fundamento","Importe"`,
  ];

  for (const c of resultado.desglose) {
    const imp = c.deshabilitado ? '0.00' : c.importe.toFixed(2);
    const d = c.dias !== undefined ? c.dias.toString() : '';
    filas.push(`"${c.concepto}","${c.formula.replace(/"/g, '""')}","${d}","${c.fundamento}","${imp}"`);
  }

  filas.push(
    ``,
    `"TOTAL A PAGAR","","","","${total.toFixed(2)}"`,
    `"Fecha de Generación","${new Date().toISOString()}"`,
    `"Fundamento Legal","Ley Federal del Trabajo (Arts. 50, 76, 79, 80, 87, 162, 486)"`
  );

  return BOM + filas.join('\r\n');
}
