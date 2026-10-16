/**
 * ARK TOOLS — Modal y Cédula Concentradora de Nómina Oficial (Sprint 11)
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
  const verifyUrl = `https://tools.arksystems.site/?verify=${resumen.hashLote}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/75 backdrop-blur-md overflow-y-auto">
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
        className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 sm:p-10 shadow-2xl text-ink font-inter"
      >
        {/* ═══ BARRA DE ACCIONES (NO-PRINT) ═══ */}
        <div className="no-print mb-6 pb-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
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
              className="p-1.5 rounded-lg border border-line hover:bg-surface-2 text-muted hover:text-ink cursor-pointer transition-colors"
              title="Cerrar vista previa"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══ ENCABEZADO INSTITUCIONAL ═══ */}
        <div className="border-b-2 border-navy/30 pb-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-playfair text-xl sm:text-2xl font-black text-navy tracking-tight uppercase">
                {despachoName}
              </div>
              <div className="font-orbitron text-xs font-bold uppercase tracking-widest text-gold mt-0.5">
                CÉDULA CONCENTRADORA DE NÓMINA OFICIAL
              </div>
              <div className="font-inter text-xs text-muted mt-0.5">
                Papel de Trabajo General de Retenciones, Seguridad Social e Impuestos Locales
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <div className="font-mono text-muted">
                <strong>Emisión:</strong> {new Date(resumen.fechaEmision).toLocaleString('es-MX')}
              </div>
              <div className="font-mono text-navy font-bold">
                <strong>Período:</strong> {parametros.periodo.toUpperCase()} ({parametros.diasPeriodo} días)
              </div>
              <div className="font-mono text-muted text-[11px]">
                {parametros.fechaInicio} al {parametros.fechaFin}
              </div>
            </div>
          </div>

          {/* Datos de la empresa cliente */}
          <div className="mt-4 pt-3 border-t border-line/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-surface-2/40 p-3 rounded-xl">
            <div>
              <span className="text-muted block text-[10px] uppercase font-bold">Empresa / Razón Social:</span>
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Building2 size={13} className="text-navy shrink-0" />
                {parametros.empresaNombre}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase font-bold">RFC de la Empresa:</span>
              <span className="font-mono font-medium text-ink">
                {parametros.empresaRfc || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase font-bold">Entidad Federativa (ISN):</span>
              <span className="font-medium text-ink">
                {parametros.estadoIsnNombre} (Tasa: {parametros.tasaIsn}%)
              </span>
            </div>
          </div>
        </div>

        {/* ═══ TARJETAS DE TOTALES EJECUTIVOS ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-surface-2/60 border border-line">
            <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">
              Nómina Bruta
            </span>
            <div className="font-orbitron text-base sm:text-lg font-bold text-ink mt-0.5 tabular-nums">
              ${resumen.totalPercepcionesBrutas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-muted block mt-0.5">
              {resumen.totalTrabajadores} Colaboradores
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
              Retención ISR (SAT)
            </span>
            <div className="font-orbitron text-base sm:text-lg font-bold text-rose-950 mt-0.5 tabular-nums">
              ${resumen.totalISRRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-700 block mt-0.5">
              Art. 96 LISR
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
              IMSS Obrero
            </span>
            <div className="font-orbitron text-base sm:text-lg font-bold text-blue-950 mt-0.5 tabular-nums">
              ${resumen.totalIMSSObrero.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-blue-700 block mt-0.5">
              LSS Cuotas Trabajador
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
              ISN Estatal
            </span>
            <div className="font-orbitron text-base sm:text-lg font-bold text-amber-950 mt-0.5 tabular-nums">
              ${resumen.totalISNEstatal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              {parametros.tasaIsn}% {parametros.estadoIsnNombre}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-emerald-900 tracking-wider block">
              Neto a Dispersar
            </span>
            <div className="font-orbitron text-base sm:text-lg font-bold text-emerald-950 mt-0.5 tabular-nums">
              ${resumen.totalNetoDispersar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">
              Importe a transferir
            </span>
          </div>
        </div>

        {/* ═══ TOTAL EN LETRAS OFICIAL (ART. 28 CFF) ═══ */}
        <div className="mb-6 p-3 rounded-xl bg-navy/5 border border-navy/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            Importe Total Neto a Dispersar en Letra (CFF Art. 28):
          </span>
          <div className="font-inter text-xs sm:text-sm font-bold text-navy mt-0.5">
            {resumen.importeNetoEnLetras}
          </div>
        </div>

        {/* ═══ TABLA ANALÍTICA DETALLADA POR TRABAJADOR ═══ */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-navy/30 bg-surface-2/80 text-muted uppercase tracking-wider text-[9px] font-bold">
                <th className="py-2 px-2">No</th>
                <th className="py-2 px-2">Trabajador</th>
                <th className="py-2 px-2">RFC / NSS</th>
                <th className="py-2 px-2 text-right">SD</th>
                <th className="py-2 px-2 text-right">SBC</th>
                <th className="py-2 px-2 text-center">Días</th>
                <th className="py-2 px-2 text-right">Total Percep.</th>
                <th className="py-2 px-2 text-right text-rose-800">ISR Ret.</th>
                <th className="py-2 px-2 text-right text-blue-800">IMSS Obr.</th>
                <th className="py-2 px-2 text-right">Otras Ded.</th>
                <th className="py-2 px-2 text-right">Total Ded.</th>
                <th className="py-2 px-2 text-right font-bold text-emerald-900">Sueldo Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {trabajadores.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2/40 transition-colors">
                  <td className="py-2 px-2 text-muted">{t.numeroLista}</td>
                  <td className="py-2 px-2 font-inter font-semibold text-ink whitespace-nowrap">
                    {t.nombre}
                  </td>
                  <td className="py-2 px-2 text-muted text-[10px]">
                    <div>{t.rfc || '—'}</div>
                    <div className="text-[9px] text-muted/70">{t.nss || ''}</div>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">${t.salarioDiario.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-navy">${t.sbcDiario.toFixed(2)}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{t.diasTrabajados}</td>
                  <td className="py-2 px-2 text-right font-bold tabular-nums">
                    ${t.totalPercepciones.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-rose-800">
                    ${t.isrRetenido.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-blue-800">
                    ${t.imssObrero.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-muted">
                    ${t.otrasDeducciones.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-ink">
                    ${t.totalDeducciones.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right font-bold tabular-nums text-emerald-900 bg-emerald-50/50">
                    ${t.sueldoNeto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy/40 bg-surface-2 font-bold text-ink">
                <td colSpan={3} className="py-2.5 px-2 font-inter uppercase tracking-wider text-[10px]">
                  Totales ({resumen.totalTrabajadores} Colaboradores)
                </td>
                <td colSpan={3} className="py-2.5 px-2 text-right text-muted text-[10px]">
                  Suma General:
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                  ${resumen.totalPercepcionesBrutas.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums text-rose-800">
                  ${resumen.totalISRRetenido.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums text-blue-800">
                  ${resumen.totalIMSSObrero.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums text-muted">
                  ${resumen.totalOtrasDeducciones.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                  ${resumen.totalDeducciones.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-900 bg-emerald-100/60 font-black">
                  ${resumen.totalNetoDispersar.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ═══ SELLO CRIPTOGRÁFICO Y QR DE VERIFICACIÓN ═══ */}
        <div className="border-t border-line pt-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                Sello Digital de Integridad SHA-256 (Lote Inmutable)
              </span>
              <button
                type="button"
                onClick={copyHash}
                className="no-print inline-flex items-center gap-1 text-[10px] text-muted hover:text-navy cursor-pointer transition-colors"
                title="Copiar Hash"
              >
                {copiedHash ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="font-mono text-[10px] text-muted break-all p-2 bg-surface-2 rounded-lg border border-line select-all">
              {resumen.hashLote}
            </div>
            <div className="text-[10px] text-muted">
              <strong>Tablas DOF:</strong> {resumen.catalogVersion} | Fundamento: Art. 96 LISR, Art. 27/28 LSS, Art. 76/87 LFT, Art. 28 CFF.
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Código QR de Verificación Pública"
                className="w-24 h-24 border border-line rounded-lg shadow-sm"
              />
            )}
            <span className="text-[9px] text-muted mt-1 uppercase tracking-wider font-semibold">
              Escanear para Verificación Pública
            </span>
          </div>
        </div>

        {/* ═══ SECCIÓN DE FIRMAS AUTÓGRAFAS ═══ */}
        <div className="pt-6 border-t-2 border-dashed border-line/80 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-14 border-b border-ink/40 mb-2"></div>
            <span className="font-bold text-ink block">Elaboró</span>
            <span className="text-muted text-[10px] block">Contador de Nóminas / C.P.</span>
          </div>
          <div>
            <div className="h-14 border-b border-ink/40 mb-2"></div>
            <span className="font-bold text-ink block">Revisó</span>
            <span className="text-muted text-[10px] block">Auditor Fiscal / Gerente</span>
          </div>
          <div>
            <div className="h-14 border-b border-ink/40 mb-2"></div>
            <span className="font-bold text-ink block">Autorizó</span>
            <span className="text-muted text-[10px] block">Representante Legal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
