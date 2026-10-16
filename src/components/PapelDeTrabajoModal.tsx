/**
 * ARK TOOLS — Generador de Papel de Trabajo Oficial (Sprint 10)
 *
 * Emite el dictamen formal en formato de Papel de Trabajo de Auditoría:
 * - Membrete del Despacho y Folio Institucional.
 * - Datos del Contribuyente/Trabajador y Bases Salariales.
 * - Tabla matricial de conceptos, fórmulas y fundamentos legales exactos.
 * - Importe total en número y en letra oficial (pesos mexicanos).
 * - Sello digital inmutable SHA-256 y Código QR de verificación pública.
 * - Firma del Auditor y firma de conformidad del cliente/trabajador.
 * - Optimizado para impresión directa y guardado en PDF (CSS @media print).
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { ClientRecord, ExpedienteRecord } from '@/lib/apiClient';
import { numeroALetras } from '@/lib/numeroALetras';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  despachoName: string;
  client: ClientRecord;
  expediente: ExpedienteRecord;
}

export function PapelDeTrabajoModal({
  isOpen,
  onClose,
  despachoName,
  client,
  expediente,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `https://tools.arksystems.site/?verify=${expediente.input_hash}`;

  // Generar código QR de verificación
  useEffect(() => {
    if (!isOpen || !expediente.input_hash) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#002B7F', // Navy Ark
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, expediente.input_hash, verifyUrl]);

  if (!isOpen) return null;

  // Extraer totales y conceptos según la herramienta
  const { tool_id, inputs, outputs } = expediente;

  let totalMonto = 0;
  let filasConceptos: Array<{
    concepto: string;
    dias?: string | number;
    formula: string;
    fundamento: string;
    importe: number;
  }> = [];

  if (tool_id === 'finiquitos') {
    const esLiq = inputs.tipoBaja === 'liquidacion';
    totalMonto = Number(esLiq ? outputs.totalLiquidacion : outputs.totalFiniquito) || 0;
    const desglose = (outputs.desglose as Array<{
      concepto: string;
      dias?: number;
      formula: string;
      fundamento: string;
      importe: number;
      deshabilitado?: boolean;
    }>) || [];

    filasConceptos = desglose
      .filter((c) => !c.deshabilitado && c.importe > 0)
      .map((c) => ({
        concepto: c.concepto,
        dias: c.dias ?? '-',
        formula: c.formula,
        fundamento: c.fundamento,
        importe: Number(c.importe) || 0,
      }));
  } else if (tool_id === 'nomina') {
    totalMonto = Number(outputs.neto) || 0;
    const isr = outputs.isr as { isrFinal?: number } | undefined;
    const imss = outputs.imss as { total?: number } | undefined;
    const bruto = Number(inputs.sueldoBruto) || 0;

    filasConceptos = [
      {
        concepto: 'Sueldo Bruto del Período',
        dias: (inputs.diasTrabajados as number) || 15,
        formula: `Sueldo pactado para ${String(inputs.periodo || 'quincenal')}`,
        fundamento: 'LFT Art. 82',
        importe: bruto,
      },
      {
        concepto: '(-) Retención ISR',
        formula: 'Tarifa mensual proporcional Art. 96 LISR',
        fundamento: 'LISR Art. 96',
        importe: -(Number(isr?.isrFinal) || 0),
      },
      {
        concepto: '(-) Retención IMSS Obrero',
        formula: 'Cuotas de seguridad social sobre SBC',
        fundamento: 'LSS Art. 25, 107',
        importe: -(Number(imss?.total) || 0),
      },
    ];
  } else if (tool_id === 'sbc') {
    totalMonto = Number(outputs.sbcFinal) || 0;
    const factor = outputs.factor as {
      factor?: number;
      aporteVacaciones?: number;
      aporteAguinaldo?: number;
    } | undefined;

    filasConceptos = [
      {
        concepto: 'Salario Diario Base',
        formula: 'Cuota diaria en efectivo',
        fundamento: 'LSS Art. 27',
        importe: Number(inputs.salarioDiario) || 0,
      },
      {
        concepto: 'Factor de Integración Legal',
        dias: (factor?.factor || 1.0493).toFixed(4),
        formula: '1 + (Aguinaldo/365) + (Vacaciones × Prima / 365)',
        fundamento: 'LSS Art. 27, 28',
        importe: Number(outputs.sbcBruto) || 0,
      },
    ];
  } else if (tool_id === 'isn') {
    totalMonto = Number(outputs.isn) || 0;
    filasConceptos = [
      {
        concepto: 'Base Gravable de Nómina',
        formula: 'Total de erogaciones gravadas por remuneración',
        fundamento: 'Código Financiero Estatal',
        importe: Number(outputs.baseGravable) || 0,
      },
      {
        concepto: `Impuesto Sobre Nómina (${String(outputs.tasa || '3%')})`,
        formula: `${Number(outputs.baseGravable) || 0} × Tasa Estatal Vigente`,
        fundamento: 'Ley de Hacienda Estatal',
        importe: totalMonto,
      },
    ];
  } else {
    totalMonto = 0;
  }

  const importeEnLetras = numeroALetras(totalMonto);
  const folio = `ARK-${expediente.input_hash.slice(0, 8).toUpperCase()}`;
  const fechaStr = new Date(expediente.created_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    void navigator.clipboard.writeText(expediente.input_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* ═══ BARRA FLOTANTE DE ACCIONES (NO IMPRIME) ═══ */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-navy text-white text-xs font-orbitron font-bold uppercase tracking-wider hover:bg-navy/90 shadow-xl cursor-pointer transition-all"
        >
          <Printer size={15} className="text-gold" />
          <span>Imprimir / Guardar PDF</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white text-ink hover:bg-surface-2 border border-line shadow-xl cursor-pointer transition-all"
          title="Cerrar vista previa"
        >
          <X size={18} />
        </button>
      </div>

      {/* ═══ HOJA DE PAPEL DE TRABAJO (TAMAÑO CARTA ESTÁNDAR) ═══ */}
      <div
        ref={printContainerRef}
        id="papel-de-trabajo-print"
        className="w-full max-w-[850px] bg-white text-black p-8 sm:p-12 rounded-2xl shadow-2xl my-8 font-inter border border-line print:m-0 print:p-8 print:shadow-none print:border-none print:w-full print:max-w-none text-[12px] leading-relaxed"
      >
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="border-b-2 border-navy pb-4 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-navy text-[11px] tracking-[0.2em] uppercase">
                {despachoName.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[9px] uppercase">
                Auditado y Sellado
              </span>
            </div>
            <h1 className="font-playfair text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
              Papel de Trabajo y Dictamen de Auditoría
            </h1>
            <p className="text-muted text-[11px] mt-0.5 font-medium">
              Conforme a las Normas de Información Financiera y Leyes Fiscales/Laborales Federales de los Estados Unidos Mexicanos.
            </p>
          </div>

          <div className="text-right shrink-0 font-mono text-[11px] space-y-1">
            <div className="font-bold text-navy text-sm">FOLIO: {folio}</div>
            <div className="text-muted">Fecha: {fechaStr}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">{expediente.catalog_version}</div>
          </div>
        </div>

        {/* DATOS DEL CONTRIBUYENTE / TRABAJADOR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-2/60 border border-line mb-6 text-[11px]">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted font-orbitron block">
              Sujeto / Razón Social
            </span>
            <div className="font-bold text-sm text-ink mt-0.5">{client.nombre}</div>
            <div className="text-muted font-mono mt-0.5">
              Tipo: <span className="uppercase text-ink font-semibold">{client.tipo}</span>
              {client.rfc && ` · RFC: ${client.rfc}`}
            </div>
          </div>

          <div className="space-y-1 sm:text-right font-mono">
            {client.salario_diario > 0 && (
              <div>
                <span className="text-muted">Salario Diario: </span>
                <span className="font-bold text-ink">${client.salario_diario.toFixed(2)} MXN</span>
              </div>
            )}
            {client.salario_diario_integrado > 0 && (
              <div>
                <span className="text-muted">SDI Integrado: </span>
                <span className="font-bold text-ink">${client.salario_diario_integrado.toFixed(2)} MXN</span>
              </div>
            )}
            {client.fecha_ingreso && (
              <div>
                <span className="text-muted">Fecha de Ingreso: </span>
                <span className="font-semibold text-ink">{client.fecha_ingreso}</span>
              </div>
            )}
          </div>
        </div>

        {/* TABLA MATRICIAL DE CONCEPTOS */}
        <div className="mb-6">
          <h2 className="font-playfair text-lg font-bold text-ink mb-2">
            Desglose Analítico del Cálculo
          </h2>

          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-navy text-navy font-bold text-left font-orbitron text-[10px]">
                <th className="py-2 pr-3">Concepto</th>
                <th className="py-2 px-2 text-center">Base / Días</th>
                <th className="py-2 px-3">Fórmula Aplicada</th>
                <th className="py-2 px-2">Fundamento Legal</th>
                <th className="py-2 pl-3 text-right">Importe (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filasConceptos.map((f, i) => (
                <tr key={i} className="hover:bg-black/2">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{f.concepto}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-muted">{f.dias ?? '-'}</td>
                  <td className="py-2.5 px-3 text-muted text-[10.5px]">{f.formula}</td>
                  <td className="py-2.5 px-2 font-mono text-navy font-semibold text-[10px]">
                    {f.fundamento}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono font-bold text-ink">
                    ${f.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy bg-navy/5 font-bold">
                <td colSpan={4} className="py-3 px-3 text-right uppercase font-orbitron text-[11px] text-navy">
                  Total Determinado a Liquidar:
                </td>
                <td className="py-3 pl-3 text-right font-mono text-base text-navy">
                  ${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* IMPORTE EN LETRAS */}
        <div className="p-3 rounded-lg bg-surface-2 border border-line mb-6 font-mono text-[11px]">
          <span className="font-bold text-ink">IMPORTE CON LETRA: </span>
          <span className="text-navy font-semibold">{importeEnLetras}</span>
        </div>

        {/* FUNDAMENTACIÓN Y CERTEZA JURÍDICA */}
        <div className="text-[10px] text-muted space-y-1 mb-8 leading-relaxed border-l-2 border-gold pl-3">
          <p>
            <strong className="text-ink">Certeza Jurídica y Validez de Papel de Trabajo:</strong> Este cálculo fue determinado conforme a los artículos 50, 76, 79, 80, 87, 162 y 486 de la Ley Federal del Trabajo, Ley del Seguro Social, Código Fiscal de la Federación (Art. 28) y las tarifas oficiales publicadas en el Diario Oficial de la Federación vigentes al ejercicio 2026.
          </p>
        </div>

        {/* FIRMAS DE CONFORMIDAD Y AUDITORÍA */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-line mb-8 text-center text-[11px]">
          <div>
            <div className="border-b border-black w-48 mx-auto mb-1.5" />
            <p className="font-bold text-ink">Firma del Contador Auditor</p>
            <p className="text-[10px] text-muted font-mono">Por el Despacho Emisor</p>
          </div>
          <div>
            <div className="border-b border-black w-48 mx-auto mb-1.5" />
            <p className="font-bold text-ink">Firma de Conformidad</p>
            <p className="text-[10px] text-muted font-mono">{client.nombre}</p>
          </div>
        </div>

        {/* SELLO CRIPTOGRÁFICO Y CÓDIGO QR */}
        <div className="pt-4 border-t-2 border-line/80 flex items-center justify-between gap-4 text-[10px] font-mono">
          <div className="space-y-1.5 max-w-[560px]">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <ShieldCheck size={14} className="text-gold" />
              <span>SELLO DIGITAL INMUTABLE (SHA-256):</span>
              <button
                type="button"
                onClick={copyHash}
                className="print:hidden text-[9px] text-muted hover:text-navy underline cursor-pointer ml-1"
              >
                {copiedHash ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="text-[9.5px] text-muted break-all leading-tight bg-surface-2 p-1.5 rounded border border-line">
              {expediente.input_hash}
            </div>
            <p className="text-[9px] text-muted">
              Para validar la autenticidad e inalterabilidad legal de este dictamen, escanee el código QR o consulte en <span className="text-navy">https://tools.arksystems.site</span> con el hash digital.
            </p>
          </div>

          {qrDataUrl && (
            <div className="text-center shrink-0">
              <img
                src={qrDataUrl}
                alt="Código QR de Verificación"
                className="w-20 h-20 border border-navy/20 p-1 rounded-lg mx-auto bg-white"
              />
              <span className="text-[8px] text-navy font-bold uppercase block mt-1">
                Escanear para Validar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
