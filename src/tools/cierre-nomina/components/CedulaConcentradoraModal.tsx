/**
 * ARK LEDGER — Modal y Cédula Concentradora de Nómina Oficial (Sprint 11)
 *
 * Papel de Trabajo General para impresión en PDF (@media print) y descarga:
 * - Resumen institucional con datos del despacho y empresa cliente.
 * - 5 Tarjetas ejecutivas con totales consolidados (Bruto, ISR, IMSS, ISN, Neto).
 * - Total en letras con validez conforme al Art. 28 del CFF.
 * - Tabla analítica completa con desglose colaborador por colaborador.
 * - Sello digital criptográfico SHA-256 del lote y versión DOF.
 * - Código QR de validación pública oficial.
 * - Bloque de 3 firmas autógrafas para auditoría contable.
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  ArrowDownToLine,
  Copy,
  Check,
} from 'lucide-react';
import type { CierreNominaCompleto } from '../types';
import {
  exportarConcentradoCSV,
  exportarDispersionBancariaCSV,
  descargarArchivo,
} from '../lib/exportarCierre';
import { GlassButton } from '@/components/ui/GlassButton';

interface CedulaConcentradoraModalProps {
  isOpen: boolean;
  onClose: () => void;
  cierre: CierreNominaCompleto;
  despachoName?: string;
}

export function CedulaConcentradoraModal({
  isOpen,
  onClose,
  cierre,
  despachoName = 'Despacho Contable Especializado',
}: CedulaConcentradoraModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const { parametros, trabajadores, resumen } = cierre;
  const verifyUrl = `https://ledger.arksystems.site/?verify=${resumen.hashLote}`;

  useEffect(() => {
    if (!isOpen || !resumen.hashLote) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#002B7F', // Navy Ark
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, resumen.hashLote, verifyUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    void navigator.clipboard.writeText(resumen.hashLote);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = exportarConcentradoCSV(cierre);
    const nombre = `Cedula_Nomina_${parametros.empresaNombre.replace(/\s+/g, '_')}_${parametros.fechaFin}.csv`;
    descargarArchivo(csv, nombre);
  };

  const handleDownloadDispersion = () => {
    const csv = exportarDispersionBancariaCSV(cierre);
    const nombre = `Dispersion_Bancaria_${parametros.empresaNombre.replace(/\s+/g, '_')}_${parametros.fechaFin}.csv`;
    descargarArchivo(csv, nombre);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/75 p-2 backdrop-blur-md sm:p-4">
      {/* ═══ ESTILOS DE IMPRESIÓN OFICIAL TAMAÑO CARTA ═══ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cedula-concentradora-oficial,
          #cedula-concentradora-oficial * {
            visibility: visible;
          }
          #cedula-concentradora-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #0b1528 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: letter landscape;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        ref={printContainerRef}
        id="cedula-concentradora-oficial"
        className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 font-inter text-ink shadow-2xl sm:p-10"
      >
        {/* ═══ BARRA DE ACCIONES (NO-PRINT) ═══ */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy">
            <ShieldCheck size={18} className="text-gold" />
            <span>Papel de Trabajo de Auditoría Laboral & Fiscal</span>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadDispersion}
              className="text-xs"
            >
              <ArrowDownToLine size={14} className="mr-1.5 text-navy" />
              Dispersión Bancaria
            </GlassButton>
            <GlassButton
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadCSV}
              className="text-xs"
            >
              <FileSpreadsheet size={14} className="mr-1.5 text-emerald-600" />
              Descargar CSV
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs"
            >
              <Printer size={14} className="mr-1.5" />
              Imprimir / Guardar PDF
            </GlassButton>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              title="Cerrar vista previa"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══ ENCABEZADO INSTITUCIONAL ═══ */}
        <div className="mb-6 border-b-2 border-navy/30 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-playfair text-xl font-black uppercase tracking-tight text-navy sm:text-2xl">
                {despachoName}
              </div>
              <div className="mt-0.5 font-orbitron text-xs font-bold uppercase tracking-widest text-gold">
                CÉDULA CONCENTRADORA DE NÓMINA OFICIAL
              </div>
              <div className="mt-0.5 font-inter text-xs text-muted">
                Papel de Trabajo General de Retenciones, Seguridad Social e Impuestos Locales
              </div>
            </div>

            <div className="space-y-0.5 text-right text-xs">
              <div className="font-mono text-muted">
                <strong>Emisión:</strong> {new Date(resumen.fechaEmision).toLocaleString('es-MX')}
              </div>
              <div className="font-mono font-bold text-navy">
                <strong>Período:</strong> {parametros.periodo.toUpperCase()} (
                {parametros.diasPeriodo} días)
              </div>
              <div className="font-mono text-[11px] text-muted">
                {parametros.fechaInicio} al {parametros.fechaFin}
              </div>
            </div>
          </div>

          {/* Datos de la empresa cliente */}
          <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border-t border-line/60 bg-surface-2/40 p-3 pt-3 text-xs sm:grid-cols-3">
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Empresa / Razón Social:
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                <Building2 size={13} className="shrink-0 text-navy" />
                {parametros.empresaNombre}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                RFC de la Empresa:
              </span>
              <span className="font-mono font-medium text-ink">
                {parametros.empresaRfc || 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Entidad Federativa (ISN):
              </span>
              <span className="font-medium text-ink">
                {parametros.estadoIsnNombre} (Tasa: {parametros.tasaIsn}%)
              </span>
            </div>
          </div>
        </div>

        {/* ═══ TARJETAS DE TOTALES EJECUTIVOS ═══ */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-line bg-surface-2/60 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Nómina Bruta
            </span>
            <div className="mt-0.5 font-orbitron text-base font-bold tabular-nums text-ink sm:text-lg">
              $
              {resumen.totalPercepcionesBrutas.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="mt-0.5 block text-[10px] text-muted">
              {resumen.totalTrabajadores} Colaboradores
            </span>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">
              Retención ISR (SAT)
            </span>
            <div className="mt-0.5 font-orbitron text-base font-bold tabular-nums text-rose-950 sm:text-lg">
              ${resumen.totalISRRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="mt-0.5 block text-[10px] text-rose-700">Art. 96 LISR</span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">
              IMSS Obrero
            </span>
            <div className="mt-0.5 font-orbitron text-base font-bold tabular-nums text-blue-950 sm:text-lg">
              ${resumen.totalIMSSObrero.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="mt-0.5 block text-[10px] text-blue-700">LSS Cuotas Trabajador</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
              ISN Estatal
            </span>
            <div className="mt-0.5 font-orbitron text-base font-bold tabular-nums text-amber-950 sm:text-lg">
              ${resumen.totalISNEstatal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="mt-0.5 block text-[10px] text-amber-700">
              {parametros.tasaIsn}% {parametros.estadoIsnNombre}
            </span>
          </div>

          <div className="col-span-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 sm:col-span-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              Neto a Dispersar
            </span>
            <div className="mt-0.5 font-orbitron text-base font-bold tabular-nums text-emerald-950 sm:text-lg">
              ${resumen.totalNetoDispersar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="mt-0.5 block text-[10px] font-medium text-emerald-800">
              Importe a transferir
            </span>
          </div>
        </div>

        {/* ═══ TOTAL EN LETRAS OFICIAL (ART. 28 CFF) ═══ */}
        <div className="mb-6 rounded-xl border border-navy/20 bg-navy/5 p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
            Importe Total Neto a Dispersar en Letra (CFF Art. 28):
          </span>
          <div className="mt-0.5 font-inter text-xs font-bold text-navy sm:text-sm">
            {resumen.importeNetoEnLetras}
          </div>
        </div>

        {/* ═══ TABLA ANALÍTICA DETALLADA POR TRABAJADOR ═══ */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b-2 border-navy/30 bg-surface-2/80 text-[9px] font-bold uppercase tracking-wider text-muted">
                <th className="px-2 py-2">No</th>
                <th className="px-2 py-2">Trabajador</th>
                <th className="px-2 py-2">RFC / NSS</th>
                <th className="px-2 py-2 text-right">SD</th>
                <th className="px-2 py-2 text-right">SBC</th>
                <th className="px-2 py-2 text-center">Días</th>
                <th className="px-2 py-2 text-right">Total Percep.</th>
                <th className="px-2 py-2 text-right text-rose-800">ISR Ret.</th>
                <th className="px-2 py-2 text-right text-blue-800">IMSS Obr.</th>
                <th className="px-2 py-2 text-right">Otras Ded.</th>
                <th className="px-2 py-2 text-right">Total Ded.</th>
                <th className="px-2 py-2 text-right font-bold text-emerald-900">Sueldo Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {trabajadores.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-surface-2/40">
                  <td className="px-2 py-2 text-muted">{t.numeroLista}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-inter font-semibold text-ink">
                    {t.nombre}
                  </td>
                  <td className="px-2 py-2 text-[10px] text-muted">
                    <div>{t.rfc || '—'}</div>
                    <div className="text-[9px] text-muted/70">{t.nss || ''}</div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    ${t.salarioDiario.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-navy">
                    ${t.sbcDiario.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">{t.diasTrabajados}</td>
                  <td className="px-2 py-2 text-right font-bold tabular-nums">
                    ${t.totalPercepciones.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-rose-800">
                    ${t.isrRetenido.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-blue-800">
                    ${t.imssObrero.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-muted">
                    ${t.otrasDeducciones.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-ink">
                    ${t.totalDeducciones.toFixed(2)}
                  </td>
                  <td className="bg-emerald-50/50 px-2 py-2 text-right font-bold tabular-nums text-emerald-900">
                    ${t.sueldoNeto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy/40 bg-surface-2 font-bold text-ink">
                <td
                  colSpan={3}
                  className="px-2 py-2.5 font-inter text-[10px] uppercase tracking-wider"
                >
                  Totales ({resumen.totalTrabajadores} Colaboradores)
                </td>
                <td colSpan={3} className="px-2 py-2.5 text-right text-[10px] text-muted">
                  Suma General:
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                  ${resumen.totalPercepcionesBrutas.toFixed(2)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-rose-800">
                  ${resumen.totalISRRetenido.toFixed(2)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-blue-800">
                  ${resumen.totalIMSSObrero.toFixed(2)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted">
                  ${resumen.totalOtrasDeducciones.toFixed(2)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                  ${resumen.totalDeducciones.toFixed(2)}
                </td>
                <td className="bg-emerald-100/60 px-2 py-2.5 text-right font-mono font-black tabular-nums text-emerald-900">
                  ${resumen.totalNetoDispersar.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ═══ SELLO CRIPTOGRÁFICO Y QR DE VERIFICACIÓN ═══ */}
        <div className="mb-6 grid grid-cols-1 items-center gap-4 border-t border-line pt-4 md:grid-cols-4">
          <div className="space-y-1.5 text-xs md:col-span-3">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                Sello Digital de Integridad SHA-256 (Lote Inmutable)
              </span>
              <button
                type="button"
                onClick={copyHash}
                className="no-print inline-flex cursor-pointer items-center gap-1 text-[10px] text-muted transition-colors hover:text-navy"
                title="Copiar Hash"
              >
                {copiedHash ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="select-all break-all rounded-lg border border-line bg-surface-2 p-2 font-mono text-[10px] text-muted">
              {resumen.hashLote}
            </div>
            <div className="text-[10px] text-muted">
              <strong>Tablas DOF:</strong> {resumen.catalogVersion} | Fundamento: Art. 96 LISR, Art.
              27/28 LSS, Art. 76/87 LFT, Art. 28 CFF.
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Código QR de Verificación Pública"
                className="h-24 w-24 rounded-lg border border-line shadow-sm"
              />
            )}
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
              Escanear para Verificación Pública
            </span>
          </div>
        </div>

        {/* ═══ SECCIÓN DE FIRMAS AUTÓGRAFAS ═══ */}
        <div className="grid grid-cols-3 gap-6 border-t-2 border-dashed border-line/80 pt-6 text-center text-xs">
          <div>
            <div className="mb-2 h-14 border-b border-ink/40"></div>
            <span className="block font-bold text-ink">Elaboró</span>
            <span className="block text-[10px] text-muted">Contador de Nóminas / C.P.</span>
          </div>
          <div>
            <div className="mb-2 h-14 border-b border-ink/40"></div>
            <span className="block font-bold text-ink">Revisó</span>
            <span className="block text-[10px] text-muted">Auditor Fiscal / Gerente</span>
          </div>
          <div>
            <div className="mb-2 h-14 border-b border-ink/40"></div>
            <span className="block font-bold text-ink">Autorizó</span>
            <span className="block text-[10px] text-muted">Representante Legal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
