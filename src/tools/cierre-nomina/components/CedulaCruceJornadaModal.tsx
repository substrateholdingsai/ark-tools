/**
 * ARK LEDGER — Cédula Oficial de Cruce Laboral-Fiscal (Jornada vs. Nómina)
 *
 * Papel de Trabajo Institucional para impresión en PDF (@media print) y verificación:
 * - Cumplimiento del Art. 132 Fracc. VIII Bis LFT (Registro de jornada fehaciente)
 * - Soporte de materialidad de la nómina conforme al Art. 27 Fracc. V LISR y Art. 28 CFF
 * - Semáforo de riesgo y score de consistencia laboral-fiscal (0 a 100)
 * - Desglose de horas reales de asistencia vs horas amparadas en CFDI
 * - Sello criptográfico SHA-256 inmutable + Código QR de verificación pública
 * - Bloque institucional de firmas de responsabilidad contable y laboral
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Copy,
  Check,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import type { DictamenCruceJornada, NivelRiesgoCruce } from '../types';
import { generarCsvDiscrepancias } from '../lib/cruceNominaChecador';
import { descargarArchivo } from '../lib/exportarCierre';
import { GlassButton } from '@/components/ui/GlassButton';

interface CedulaCruceJornadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictamen: DictamenCruceJornada;
  despachoName?: string;
}

export function CedulaCruceJornadaModal({
  isOpen,
  onClose,
  dictamen,
  despachoName = 'Despacho Contable Especializado',
}: CedulaCruceJornadaModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `https://ledger.arksystems.site/?verify=${dictamen.selloSha256}`;

  useEffect(() => {
    if (!isOpen || !dictamen.selloSha256) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#002B7F', // Navy Ark
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, dictamen.selloSha256, verifyUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    void navigator.clipboard.writeText(dictamen.selloSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = generarCsvDiscrepancias(dictamen);
    const nombre = `Auditoria_Jornada_Nomina_${dictamen.empresaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    descargarArchivo(csv, nombre);
  };

  const colorNivelRiesgo = (nivel: NivelRiesgoCruce) => {
    switch (nivel) {
      case 'BAJO':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'MEDIO':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'ALTO':
        return 'text-orange-800 bg-orange-50 border-orange-200';
      case 'CRITICO':
        return 'text-rose-800 bg-rose-50 border-rose-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/75 p-2 backdrop-blur-md sm:p-4">
      {/* ═══ ESTILOS DE IMPRESIÓN OFICIAL TAMAÑO CARTA ═══ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cedula-cruce-jornada-oficial,
          #cedula-cruce-jornada-oficial * {
            visibility: visible;
          }
          #cedula-cruce-jornada-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm 15mm;
            background: white !important;
            color: black !important;
            font-size: 8pt;
          }
          .no-imprimir {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="relative flex max-h-[95vh] w-full max-w-[1240px] flex-col rounded-2xl border border-line bg-surface shadow-2xl">
        {/* ═══ BARRA SUPERIOR DE ACCIONES (NO IMPRIMIR) ═══ */}
        <div className="no-imprimir flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
              <Scale size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                  Cédula de Cruce Laboral-Fiscal
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-orbitron text-[10px] font-bold ${colorNivelRiesgo(
                    dictamen.nivelRiesgoGlobal
                  )}`}
                >
                  RIESGO {dictamen.nivelRiesgoGlobal} · SCORE {dictamen.scoreConsistencia}/100
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Papel de trabajo con Sello SHA-256 conforme a Arts. 132 LFT, 27 LISR y 28 CFF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GlassButton
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadCSV}
              className="text-xs"
            >
              <FileSpreadsheet size={14} className="mr-1.5 text-navy" />
              Descargar Auditoría CSV
            </GlassButton>

            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs"
            >
              <Printer size={14} className="mr-1.5 text-gold" />
              Imprimir / Guardar PDF
            </GlassButton>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-line p-2 text-muted hover:bg-surface hover:text-ink"
              title="Cerrar cédula"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══ CONTENEDOR IMPRIMIBLE (CÉDULA INSTITUCIONAL) ═══ */}
        <div
          id="cedula-cruce-jornada-oficial"
          ref={printContainerRef}
          className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-10"
        >
          {/* ENCABEZADO INSTITUCIONAL */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-navy pb-5">
            <div>
              <div className="font-orbitron text-[10px] font-bold tracking-[0.2em] text-gold-dark">
                ARK LEDGER &bull; AUDITORÍA INTEGRAL DE JORNADA Y NÓMINA
              </div>
              <h1 className="mt-1 font-playfair text-2xl font-black text-navy sm:text-3xl">
                Cédula de Cruce Laboral-Fiscal
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>Reloj Checador (STPS Art. 132 LFT)</span>
                <span>&bull;</span>
                <span>CFDI de Nómina 4.0 (SAT Art. 27 LISR)</span>
                <span>&bull;</span>
                <span>Soporte de Materialidad (CFF Art. 28)</span>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-navy">{despachoName}</div>
              <div className="text-muted">Despacho Fiscal & Laboral Certificado</div>
              <div className="mt-1 font-mono text-[10px] text-muted">
                Emisión: {new Date(dictamen.fechaEmision).toLocaleString('es-MX')}
              </div>
            </div>
          </div>

          {/* DATOS DE LA EMPRESA Y PERÍODO */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface-2/40 p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Empresa Evaluada
              </span>
              <div className="font-bold text-ink">{dictamen.empresaNombre}</div>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                RFC Patronal
              </span>
              <div className="font-mono font-bold text-ink">
                {dictamen.empresaRfc || 'NO REGISTRADO'}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Período Auditado
              </span>
              <div className="font-mono text-ink">
                {dictamen.periodoAnalizado.fechaInicio || 'Inicio'} &rarr;{' '}
                {dictamen.periodoAnalizado.fechaFin || 'Fin'}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Estatus de Consistencia
              </span>
              <div className="font-orbitron font-bold text-navy">
                {dictamen.colaboradoresConDiscrepancia === 0 ? 'CONGRUENTE' : 'CON OBSERVACIONES'}
              </div>
            </div>
          </div>

          {/* 4 KPIS EJECUTIVOS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase text-muted">
                Colaboradores Auditados
              </span>
              <div className="font-orbitron text-xl font-bold text-navy">
                {dictamen.totalColaboradoresAuditados}
              </div>
              <span className="text-[10px] text-muted">
                CFDI: {dictamen.totalColaboradoresCfdi} | Checador:{' '}
                {dictamen.totalColaboradoresChecador}
              </span>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase text-rose-800">
                Con Discrepancia
              </span>
              <div className="font-orbitron text-xl font-bold text-rose-900">
                {dictamen.colaboradoresConDiscrepancia}
              </div>
              <span className="text-[10px] text-rose-800">
                {(
                  (dictamen.colaboradoresConDiscrepancia /
                    (dictamen.totalColaboradoresAuditados || 1)) *
                  100
                ).toFixed(0)}
                % del lote
              </span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase text-amber-800">
                Horas Extras Checador
              </span>
              <div className="font-orbitron text-xl font-bold text-amber-950">
                {dictamen.totalHorasExtrasChecador} hrs
              </div>
              <span className="text-[10px] text-amber-800">registradas en biométrico</span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase text-blue-800">
                Horas Extras en CFDI
              </span>
              <div className="font-orbitron text-xl font-bold text-blue-950">
                {dictamen.totalHorasExtrasPagadasCfdi} hrs
              </div>
              <span className="text-[10px] text-blue-800">
                Dif: {dictamen.diferenciaNetaHorasExtras > 0 ? '+' : ''}
                {dictamen.diferenciaNetaHorasExtras} hrs
              </span>
            </div>
          </div>

          {/* ALERTAS DETECTADAS */}
          <div className="space-y-2 rounded-xl border border-line bg-surface-2/60 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-navy">
              <AlertTriangle size={15} className="text-gold" />
              <span>Diagnóstico de Riesgo y Observaciones Jurídicas</span>
            </div>
            <ul className="space-y-1 text-[11px] leading-relaxed">
              {dictamen.alertasPrincipales.map((alerta, i) => (
                <li key={i} className="flex items-start gap-1.5 font-medium text-ink">
                  <span>&bull;</span>
                  <span>{alerta}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* TABLA ANALÍTICA DETALLADA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                Desglose Analítico por Colaborador ({dictamen.discrepancias.length})
              </span>
              <span className="text-[10px] text-muted">
                Jornada normal de 8 hrs / día &bull; LFT Art. 61
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="border-b border-line bg-surface-2 text-[10px] font-bold uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">Colaborador / RFC</th>
                    <th className="px-3 py-2 text-center">Checador Tot / Ext</th>
                    <th className="px-3 py-2 text-center">CFDI Ord / Ext</th>
                    <th className="px-3 py-2 text-center">Diferencia</th>
                    <th className="px-3 py-2">Hallazgo & Fundamento Legal</th>
                    <th className="px-3 py-2 text-center">Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {dictamen.discrepancias.map((d, idx) => (
                    <tr key={d.rfc} className="hover:bg-surface-2/30">
                      <td className="px-3 py-2.5 font-mono text-muted">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-ink">{d.nombre}</div>
                        <div className="font-mono text-[10px] text-muted">{d.rfc}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <div>{d.horasChecadorTotal.toFixed(1)} hrs</div>
                        <div className="text-[10px] font-semibold text-amber-800">
                          {d.horasChecadorExtras > 0
                            ? `+${d.horasChecadorExtras.toFixed(1)} ext`
                            : '0 ext'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <div>{d.horasCfdiOrdinarias.toFixed(1)} hrs</div>
                        <div className="text-[10px] font-semibold text-blue-800">
                          {d.horasCfdiExtras > 0 ? `+${d.horasCfdiExtras.toFixed(1)} ext` : '0 ext'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        <span
                          className={
                            d.diferenciaHorasExtras > 0
                              ? 'text-rose-700'
                              : d.diferenciaHorasExtras < 0
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                          }
                        >
                          {d.diferenciaHorasExtras > 0
                            ? `+${d.diferenciaHorasExtras.toFixed(1)}`
                            : d.diferenciaHorasExtras.toFixed(1)}
                        </span>
                      </td>
                      <td className="max-w-xs px-3 py-2.5">
                        <div className="font-medium text-ink">{d.detalles}</div>
                        <div className="mt-0.5 text-[9px] font-semibold text-navy">
                          {d.fundamentoLegal}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 font-orbitron text-[9px] font-bold ${colorNivelRiesgo(
                            d.nivelRiesgo
                          )}`}
                        >
                          {d.nivelRiesgo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SELLO DIGITAL CRIPTOGRÁFICO Y QR */}
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border-2 border-navy/20 bg-surface-2/40 p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                <ShieldCheck size={16} className="text-gold" />
                <span>Cadena Digital & Sello SHA-256 Inmutable</span>
              </div>
              <p className="max-w-xl text-[10px] text-muted">
                Este dictamen fue sellado criptográficamente mediante algoritmo SHA-256 conforme al
                Art. 28 del Código Fiscal de la Federación. Cualquier modificación en los archivos
                origen invalida la autenticidad del papel de trabajo.
              </p>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[10px] font-bold text-navy">
                  {dictamen.selloSha256}
                </div>
                <button
                  type="button"
                  onClick={copyHash}
                  className="no-imprimir cursor-pointer rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-navy"
                  title="Copiar Hash"
                >
                  {copiedHash ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="QR Verificación Pública"
                  className="h-24 w-24 rounded-lg border border-line bg-white p-1"
                />
                <span className="mt-1 font-orbitron text-[8px] font-bold uppercase text-navy">
                  Validación Pública
                </span>
              </div>
            )}
          </div>

          {/* FIRMAS AUTÓGRAFAS */}
          <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
            <div className="border-t border-line pt-2">
              <div className="font-semibold text-ink">Auditor Laboral y Fiscal</div>
              <div className="text-[10px] text-muted">Revisión de Asistencia & CFDI</div>
            </div>
            <div className="border-t border-line pt-2">
              <div className="font-semibold text-ink">Responsable de Recursos Humanos</div>
              <div className="text-[10px] text-muted">Control de Reloj Checador</div>
            </div>
            <div className="border-t border-line pt-2">
              <div className="font-semibold text-ink">Representante Legal / Contraloría</div>
              <div className="text-[10px] text-muted">Aprobación para Deducibilidad</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
