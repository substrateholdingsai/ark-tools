/**
 * ARK LEDGER — Tool 21: Retención 2% Clínicas y Hospitales (Yucatán)
 * Art. 20-Bis a 20-Quinquies LGHY (D.O. 26-dic-2025)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertTriangle, CalendarClock, Download, Stethoscope } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { ESTADOS } from '@/tools/isn/data/estados';
import { formatearMXN } from '@/tools/isn/lib/calcularISN';
import {
  GlassButton,
  LiquidGlassDome,
  BadgeGold,
  GoldDivider,
  TextMagnified,
} from '@/components/ui';
import { calcularRetencionClinicas, MENSAJE_SOLO_YUCATAN } from './lib/calcularRetencionClinicas';
import { descargarAafy30, descargarAafy31, descargarCotejoAafy } from './lib/exportarAafyRetencion';
import type { RetencionClinicasInput, TipoPersonaRetencion } from './types';

interface RetencionClinicasProps {
  onBack?: () => void;
}

export function RetencionClinicas({ onBack }: RetencionClinicasProps) {
  const { activeClient } = useExpediente();

  const [estadoId, setEstadoId] = useState<string>('YUC');
  const [montoHonorarios, setMontoHonorarios] = useState<number>(10000);
  const [fechaPago, setFechaPago] = useState<string>('2026-03-15');
  const [folioConstancia, setFolioConstancia] = useState<string>('AAFY30-202603-001');

  const [retenedorNombre, setRetenedorNombre] = useState<string>(
    'Clínica Médica Peninsular S.A. de C.V.'
  );
  const [retenedorRfc, setRetenedorRfc] = useState<string>('CMP200101AB1');
  const [retenedorRec, setRetenedorRec] = useState<string>('REC-MID-2026');
  const [retenedorCiee, setRetenedorCiee] = useState<string>('');

  const [prestadorNombre, setPrestadorNombre] = useState<string>('Dr. Fernando Pech Várguez');
  const [prestadorRfc, setPrestadorRfc] = useState<string>('PEVF850412XYZ');
  const [prestadorRec, setPrestadorRec] = useState<string>('');
  const [prestadorDomicilio, setPrestadorDomicilio] = useState<string>(
    'Calle 60 #450, Centro, Mérida, Yuc.'
  );
  const [prestadorTipo, setPrestadorTipo] = useState<TipoPersonaRetencion>('fisica');

  useEffect(() => {
    if (activeClient) {
      setRetenedorNombre(activeClient.nombre);
      if (activeClient.rfc) setRetenedorRfc(activeClient.rfc);
      const meta = activeClient.metadata as Record<string, unknown> | undefined;
      if (typeof meta?.registro_estatal_aafy === 'string' && meta.registro_estatal_aafy) {
        setRetenedorRec(meta.registro_estatal_aafy);
      }
      if (typeof meta?.ciee === 'string' && meta.ciee) {
        setRetenedorCiee(meta.ciee);
      }
    }
  }, [activeClient]);

  const esYucatan = estadoId.trim().toUpperCase() === 'YUC';

  const input: RetencionClinicasInput = useMemo(
    () => ({
      estadoId,
      montoHonorarios,
      fechaPago,
      folioConstancia,
      retenedor: {
        nombre: retenedorNombre,
        rfc: retenedorRfc,
        rec: retenedorRec || undefined,
        ciee: retenedorCiee || undefined,
      },
      prestador: {
        nombre: prestadorNombre,
        rfc: prestadorRfc,
        rec: prestadorRec || undefined,
        domicilioFiscal: prestadorDomicilio || undefined,
        tipoPersona: prestadorTipo,
      },
    }),
    [
      estadoId,
      montoHonorarios,
      fechaPago,
      folioConstancia,
      retenedorNombre,
      retenedorRfc,
      retenedorRec,
      retenedorCiee,
      prestadorNombre,
      prestadorRfc,
      prestadorRec,
      prestadorDomicilio,
      prestadorTipo,
    ]
  );

  const resultado = useMemo(() => {
    if (!esYucatan) return null;
    return calcularRetencionClinicas(input);
  }, [esYucatan, input]);

  const handleExportAafy30 = useCallback(() => {
    if (resultado) descargarAafy30(input, resultado);
  }, [input, resultado]);

  const handleExportAafy31 = useCallback(() => {
    if (resultado) descargarAafy31(input, resultado);
  }, [input, resultado]);

  const handleExportCotejo = useCallback(() => {
    if (resultado) descargarCotejoAafy(input, resultado);
  }, [input, resultado]);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
          <Stethoscope size={12} />
          Yucatán · Art. 20-Bis a 20-Quinquies LGHY
        </div>
        <h1 className="font-playfair text-[34px] font-black leading-[0.98] tracking-[-0.03em] text-ink md:text-[42px]">
          Retención 2% Clínicas y Hospitales
        </h1>
        <p className="mt-3 max-w-[68ch] font-inter text-[14px] leading-[1.6] text-muted">
          Determinación de la retención del 2% sobre honorarios médicos al momento del pago (Art.
          20-Bis LGHY, D.O. 26-dic-2025) y emisión de formatos oficiales AAFY-30 y AAFY-31.
        </p>
      </header>

      <div className="mb-6">
        <ExpedienteToolBanner
          toolId="retencion-clinicas"
          titulo={`Retención 2% Clínicas — ${retenedorNombre}`}
          inputs={input as unknown as Record<string, unknown>}
          outputs={
            (resultado ?? { blocked: MENSAJE_SOLO_YUCATAN }) as unknown as Record<string, unknown>
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        {/* Entradas */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
              1. Entidad, Honorarios y Fecha de Pago
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Entidad Federativa
                </label>
                <select
                  value={estadoId}
                  onChange={(e) => setEstadoId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                >
                  {ESTADOS.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} ({est.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Monto Honorarios (MXN)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={montoHonorarios}
                  onChange={(e) => setMontoHonorarios(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-orbitron text-sm font-bold text-ink focus:border-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Folio Constancia AAFY-30
                </label>
                <input
                  type="text"
                  value={folioConstancia}
                  onChange={(e) => setFolioConstancia(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-ink focus:border-navy focus:outline-none"
                />
              </div>
            </div>

            {!esYucatan && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                <span>{MENSAJE_SOLO_YUCATAN} — Selecciona Yucatán (YUC) para calcular.</span>
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
              2. Datos del Retenedor (Clínica / Hospital)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  value={retenedorNombre}
                  onChange={(e) => setRetenedorNombre(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  RFC Retenedor
                </label>
                <input
                  type="text"
                  value={retenedorRfc}
                  onChange={(e) => setRetenedorRfc(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  REC AAFY
                </label>
                <input
                  type="text"
                  value={retenedorRec}
                  onChange={(e) => setRetenedorRec(e.target.value.toUpperCase())}
                  placeholder="Ej. REC-MID-2026"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  CIEE (Opcional — clients.metadata.ciee)
                </label>
                <input
                  type="text"
                  value={retenedorCiee}
                  onChange={(e) => setRetenedorCiee(e.target.value.toUpperCase())}
                  placeholder="Clave de Identificación Electrónica Estatal"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
              3. Datos del Prestador (Médico / Sociedad)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  value={prestadorNombre}
                  onChange={(e) => setPrestadorNombre(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  RFC Prestador
                </label>
                <input
                  type="text"
                  value={prestadorRfc}
                  onChange={(e) => setPrestadorRfc(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Tipo de Persona
                </label>
                <select
                  value={prestadorTipo}
                  onChange={(e) => setPrestadorTipo(e.target.value as TipoPersonaRetencion)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink"
                >
                  <option value="fisica">Persona Física</option>
                  <option value="moral">Persona Moral</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  REC Prestador (si tiene)
                </label>
                <input
                  type="text"
                  value={prestadorRec}
                  onChange={(e) => setPrestadorRec(e.target.value.toUpperCase())}
                  placeholder="Opcional si captura domicilio"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                  Domicilio Fiscal (si no tiene REC)
                </label>
                <input
                  type="text"
                  value={prestadorDomicilio}
                  onChange={(e) => setPrestadorDomicilio(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resultado y Alertas */}
        <div className="space-y-4 lg:sticky lg:top-[88px]">
          {resultado ? (
            <LiquidGlassDome padding="lg" radius="dome">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                    Art. 20-Bis LGHY · Yucatán
                  </div>
                  <div className="mt-1 font-playfair text-[18px] font-black text-ink">
                    Retención 2% al Pago
                  </div>
                </div>
                <BadgeGold size="md">2.0%</BadgeGold>
              </div>

              <GoldDivider spacing="md" />

              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted">Base (Contraprestaciones)</span>
                  <span className="font-orbitron font-semibold">
                    {formatearMXN(resultado.base)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Retención 2% (AAFY-30 / 31)</span>
                  <span className="font-orbitron font-bold text-navy">
                    −{formatearMXN(resultado.retencion2Pct)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Impuesto Ejercicio Prof. 3% (Ref.)</span>
                  <span className="font-orbitron text-muted">
                    {formatearMXN(resultado.impuestoEjercicioProfesional3Pct)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Límite Entero (Art. 20-Bis)</span>
                  <span className="font-mono font-bold text-ink">
                    {resultado.fechaLimiteEntero}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Límite Constancia (5 días)</span>
                  <span className="font-mono text-ink">{resultado.fechaLimiteConstancia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Límite Pago 3% (Art. 16-20)</span>
                  <span className="font-mono text-muted">{resultado.fechaLimitePagoImpuesto}</span>
                </div>
              </div>

              <GoldDivider spacing="md" />

              <div className="py-2 text-center">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                  Neto a pagar al prestador
                </div>
                <TextMagnified size="xl" className="text-navy">
                  {formatearMXN(resultado.netoPagar)}
                </TextMagnified>
              </div>

              <GoldDivider spacing="md" />

              <div className="space-y-2.5">
                <GlassButton variant="primary" size="md" fullWidth onClick={handleExportAafy30}>
                  <Download size={14} />
                  DESCARGAR AAFY-30 (CONSTANCIA)
                </GlassButton>
                <GlassButton variant="default" size="md" fullWidth onClick={handleExportAafy31}>
                  <Download size={14} />
                  DESCARGAR AAFY-31 (ENTERO)
                </GlassButton>
                <GlassButton variant="default" size="sm" fullWidth onClick={handleExportCotejo}>
                  <Download size={13} />
                  CSV COTEJO PORTAL AAFY
                </GlassButton>
              </div>
            </LiquidGlassDome>
          ) : (
            <div className="rounded-[20px] border border-amber-300 bg-amber-50 p-6 text-center text-sm font-bold text-amber-900">
              {MENSAJE_SOLO_YUCATAN}
            </div>
          )}

          {/* Recordatorios Regulatorios Art. 20-Bis a 20-Quinquies */}
          <div className="rounded-[16px] border border-line bg-surface-2 p-4 text-[11px] leading-[1.55] text-muted">
            <div className="mb-2 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
              <CalendarClock size={13} />
              Alertas y Plazos AAFY 2026
            </div>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>Entero mensual (Art. 20-Bis):</strong> Día 10 del mes siguiente (Enero 2026
                prorrogado al <strong>20-feb-2026</strong> por Acuerdo AAFY 12/2026 (III.1.5)).
              </li>
              <li>
                <strong>Constancia AAFY-30 (Art. 20-Ter):</strong> Dentro de los 5 días siguientes
                al pago (Art. 20-Ter LGHY). Acumulación mensual no confirmada en reglas oficiales.
              </li>
              <li>
                <strong>Informativa trimestral (Art. 20-Quinquies):</strong> 1er y 2do trimestre
                2026 acumulados en <strong>julio 2026</strong>.
              </li>
              <li>
                <strong>Responsabilidad solidaria (Art. 20-Quater):</strong> La clínica responde
                solidariamente si omite retener o enterar el 2%.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetencionClinicas;
