/**
 * ARK LEDGER — Generador de Papel de Trabajo Oficial (Sprint 10)
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
import { Printer, X, ShieldCheck } from 'lucide-react';
import type { ClientRecord, ExpedienteRecord } from '@/lib/apiClient';
import { numeroALetras } from '@/lib/numeroALetras';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  despachoName: string;
  client: ClientRecord;
  expediente: ExpedienteRecord;
}

export function PapelDeTrabajoModal({ isOpen, onClose, despachoName, client, expediente }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `https://ledger.arksystems.site/?verify=${expediente.input_hash}`;

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
    const desglose =
      (outputs.desglose as Array<{
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
    const factor = outputs.factor as
      | {
          factor?: number;
          aporteVacaciones?: number;
          aporteAguinaldo?: number;
        }
      | undefined;

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
  } else if (tool_id === 'resico') {
    totalMonto = Number(outputs.totalImpuestosPagar) || 0;
    const desglose =
      (outputs.desglose as Array<{
        concepto: string;
        base?: number;
        tasaPct?: number;
        importe?: number;
        fundamento?: string;
      }>) || [];

    filasConceptos = desglose.map((d) => ({
      concepto: d.concepto,
      formula:
        d.tasaPct && d.tasaPct > 0
          ? `Base $${(d.base || 0).toLocaleString('es-MX')} × ${d.tasaPct}%`
          : `Base $${(d.base || 0).toLocaleString('es-MX')}`,
      fundamento: d.fundamento || 'LISR Art. 113-E / 206',
      importe: Number(d.importe) || 0,
    }));
  } else if (tool_id === 'balance-general') {
    const totales = (outputs.totales as Record<string, number | boolean>) || {};
    totalMonto = Number(totales.totalActivo) || 0;
    filasConceptos = [
      {
        concepto: 'Total Activo',
        formula: 'Suma de Activo Corriente y No Corriente',
        fundamento: 'NIF B-6 (Balance General)',
        importe: Number(totales.totalActivo) || 0,
      },
      {
        concepto: 'Total Pasivo',
        formula: 'Suma de Pasivo a Corto y Largo Plazo',
        fundamento: 'NIF B-6 (Balance General)',
        importe: Number(totales.totalPasivo) || 0,
      },
      {
        concepto: 'Total Patrimonio / Capital Contable',
        formula: 'Capital Social + Utilidades/Pérdidas',
        fundamento: 'NIF B-6 (Balance General)',
        importe: Number(totales.totalPatrimonio) || 0,
      },
      {
        concepto: 'Total Pasivo + Patrimonio',
        formula: 'Pasivo Total + Capital Contable Total',
        fundamento: 'Ecuación Contable: A = P + C',
        importe: Number(totales.totalPasivoPatrimonio) || 0,
      },
    ];
  } else if (tool_id === 'anexo24') {
    const resumen = (outputs.resumen as Record<string, number | boolean>) || {};
    totalMonto = Number(resumen.totalImporteFacturado ?? outputs.totalImporte ?? 0);
    const partidas =
      (outputs.partidasConciliadas as Array<{
        concepto: string;
        codigoAgrupador: string;
        nombreCuenta: string;
        debe: number;
        haber: number;
      }>) || [];
    filasConceptos = partidas.slice(0, 15).map((p) => ({
      concepto: `${p.codigoAgrupador} · ${p.nombreCuenta}`,
      formula:
        p.debe > 0 ? `Cargo (Debe) $${p.debe.toFixed(2)}` : `Abono (Haber) $${p.haber.toFixed(2)}`,
      fundamento: 'CFF Art. 28 / Anexo 24 RMF',
      importe: p.debe > 0 ? p.debe : p.haber,
    }));
  } else if (tool_id === 'monitor-lfpiorpi') {
    const resumen = (outputs.resumen as Record<string, unknown>) || {};
    totalMonto = Number(resumen.montoTotalEvaluado) || 0;
    const clientes =
      (outputs.clientes as Array<{
        idCliente: string;
        totalAcumulado6Meses: number;
        operacionesCount: number;
        nivelRiesgo: string;
        requiereAviso: boolean;
        requiereExpediente: boolean;
      }>) || [];
    filasConceptos = [
      {
        concepto: `Actividad: ${String(resumen.actividadVulnerable || 'LFPIORPI')}`,
        dias: `${String(resumen.totalClientes || 0)} clientes`,
        formula: `Umbral Identificación: ${Number(resumen.umbralIdentificacionUMA || 1605).toLocaleString('es-MX')} UMA | Aviso: ${Number(resumen.umbralAvisoUMA || 3210).toLocaleString('es-MX')} UMA`,
        fundamento: 'LFPIORPI Art. 17',
        importe: totalMonto,
      },
      ...clientes.slice(0, 14).map((c) => ({
        concepto: `Cliente ${c.idCliente} [${c.nivelRiesgo}]`,
        dias: `${c.operacionesCount} ops`,
        formula: c.requiereAviso
          ? 'Supera umbral de Aviso (Reporte SPPLD obligatorio)'
          : c.requiereExpediente
            ? 'Supera umbral de Identificación (Expediente requerido)'
            : 'Operación ordinaria bajo los umbrales',
        fundamento: 'LFPIORPI Art. 17 penúltimo párrafo',
        importe: c.totalAcumulado6Meses,
      })),
    ];
  } else if (tool_id === 'recargos') {
    totalMonto = Number(outputs.totalPagar) || 0;
    const factorDetalle = outputs.factorDetalle as
      | {
          periodoInpcReciente?: string;
          periodoInpcAntiguo?: string;
        }
      | undefined;
    const factorActualizacion = Number(outputs.factorActualizacion) || 1.0;
    const mesesMora = Number(outputs.mesesMora) || 0;
    const tasaTotal = Number(outputs.tasaRecargosTotal) || 0;

    filasConceptos = [
      {
        concepto: 'Impuesto Omitido (Adeudo Histórico)',
        formula: `Fecha exigibilidad: ${String(inputs.fechaVencimiento || 'N/A')}`,
        fundamento: 'Ley Específica de la Contribución',
        importe: Number(outputs.importeHistorico) || 0,
      },
      {
        concepto: `Actualización por Inflación (Factor ${factorActualizacion.toFixed(4)})`,
        formula: `INPC ${factorDetalle?.periodoInpcReciente || ''} / INPC ${factorDetalle?.periodoInpcAntiguo || ''}`,
        fundamento: 'CFF Art. 17-A',
        importe: Number(outputs.montoActualizacion) || 0,
      },
      {
        concepto: '(=) Impuesto Actualizado (Base de Recargos)',
        formula: `Impuesto Histórico × Factor ${factorActualizacion.toFixed(4)}`,
        fundamento: 'CFF Art. 17-A',
        importe: Number(outputs.impuestoActualizado) || 0,
      },
      {
        concepto: `Recargos por Mora (${mesesMora} meses al 1.47% mensual)`,
        formula: `Tasa acumulada ${tasaTotal}% sobre Base Actualizada`,
        fundamento: 'CFF Art. 21 y LIF Art. 8',
        importe: Number(outputs.montoRecargos) || 0,
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
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4">
      {/* ═══ BARRA FLOTANTE DE ACCIONES (NO IMPRIME) ═══ */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-navy px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-xl transition-all hover:bg-navy/90"
        >
          <Printer size={15} className="text-gold" />
          <span>Imprimir / Guardar PDF</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-line bg-white p-2.5 text-ink shadow-xl transition-all hover:bg-surface-2"
          title="Cerrar vista previa"
        >
          <X size={18} />
        </button>
      </div>

      {/* ═══ HOJA DE PAPEL DE TRABAJO (TAMAÑO CARTA ESTÁNDAR) ═══ */}
      <div
        ref={printContainerRef}
        id="papel-de-trabajo-print"
        className="my-8 w-full max-w-[850px] rounded-2xl border border-line bg-white p-8 font-inter text-[12px] leading-relaxed text-black shadow-2xl sm:p-12 print:m-0 print:w-full print:max-w-none print:border-none print:p-8 print:shadow-none"
      >
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b-2 border-navy pb-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                {despachoName.toUpperCase()}
              </span>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-800">
                Auditado y Sellado
              </span>
            </div>
            <h1 className="mt-1 font-playfair text-2xl font-black tracking-tight text-ink sm:text-3xl">
              Papel de Trabajo y Dictamen de Auditoría
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-muted">
              Conforme a las Normas de Información Financiera y Leyes Fiscales/Laborales Federales
              de los Estados Unidos Mexicanos.
            </p>
          </div>

          <div className="shrink-0 space-y-1 text-right font-mono text-[11px]">
            <div className="text-sm font-bold text-navy">FOLIO: {folio}</div>
            <div className="text-muted">Fecha: {fechaStr}</div>
            <div className="text-[10px] font-semibold text-emerald-700">
              {expediente.catalog_version}
            </div>
          </div>
        </div>

        {/* DATOS DEL CONTRIBUYENTE / TRABAJADOR */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface-2/60 p-4 text-[11px] sm:grid-cols-2">
          <div>
            <span className="block font-orbitron text-[10px] font-bold uppercase text-muted">
              Sujeto / Razón Social
            </span>
            <div className="mt-0.5 text-sm font-bold text-ink">{client.nombre}</div>
            <div className="mt-0.5 font-mono text-muted">
              Tipo: <span className="font-semibold uppercase text-ink">{client.tipo}</span>
              {client.rfc && ` · RFC: ${client.rfc}`}
            </div>
          </div>

          <div className="space-y-1 font-mono sm:text-right">
            {client.salario_diario > 0 && (
              <div>
                <span className="text-muted">Salario Diario: </span>
                <span className="font-bold text-ink">${client.salario_diario.toFixed(2)} MXN</span>
              </div>
            )}
            {client.salario_diario_integrado > 0 && (
              <div>
                <span className="text-muted">SDI Integrado: </span>
                <span className="font-bold text-ink">
                  ${client.salario_diario_integrado.toFixed(2)} MXN
                </span>
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
          <h2 className="mb-2 font-playfair text-lg font-bold text-ink">
            Desglose Analítico del Cálculo
          </h2>

          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-navy text-left font-orbitron text-[10px] font-bold text-navy">
                <th className="py-2 pr-3">Concepto</th>
                <th className="px-2 py-2 text-center">Base / Días</th>
                <th className="px-3 py-2">Fórmula Aplicada</th>
                <th className="px-2 py-2">Fundamento Legal</th>
                <th className="py-2 pl-3 text-right">Importe (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filasConceptos.map((f, i) => (
                <tr key={i} className="hover:bg-black/2">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{f.concepto}</td>
                  <td className="px-2 py-2.5 text-center font-mono text-muted">{f.dias ?? '-'}</td>
                  <td className="px-3 py-2.5 text-[10.5px] text-muted">{f.formula}</td>
                  <td className="px-2 py-2.5 font-mono text-[10px] font-semibold text-navy">
                    {f.fundamento}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono font-bold text-ink">
                    $
                    {f.importe.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy bg-navy/5 font-bold">
                <td
                  colSpan={4}
                  className="px-3 py-3 text-right font-orbitron text-[11px] uppercase text-navy"
                >
                  Total Determinado a Liquidar:
                </td>
                <td className="py-3 pl-3 text-right font-mono text-base text-navy">
                  $
                  {totalMonto.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  MXN
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* IMPORTE EN LETRAS */}
        <div className="mb-6 rounded-lg border border-line bg-surface-2 p-3 font-mono text-[11px]">
          <span className="font-bold text-ink">IMPORTE CON LETRA: </span>
          <span className="font-semibold text-navy">{importeEnLetras}</span>
        </div>

        {/* FUNDAMENTACIÓN Y CERTEZA JURÍDICA */}
        <div className="mb-8 space-y-1 border-l-2 border-gold pl-3 text-[10px] leading-relaxed text-muted">
          <p>
            <strong className="text-ink">Certeza Jurídica y Validez de Papel de Trabajo:</strong>{' '}
            Este cálculo fue determinado conforme a los artículos 50, 76, 79, 80, 87, 162 y 486 de
            la Ley Federal del Trabajo, Ley del Seguro Social, Código Fiscal de la Federación (Art.
            28) y las tarifas oficiales publicadas en el Diario Oficial de la Federación vigentes al
            ejercicio 2026.
          </p>
        </div>

        {/* FIRMAS DE CONFORMIDAD Y AUDITORÍA */}
        <div className="mb-8 grid grid-cols-2 gap-12 border-t border-line pt-8 text-center text-[11px]">
          <div>
            <div className="mx-auto mb-1.5 w-48 border-b border-black" />
            <p className="font-bold text-ink">Firma del Contador Auditor</p>
            <p className="font-mono text-[10px] text-muted">Por el Despacho Emisor</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 w-48 border-b border-black" />
            <p className="font-bold text-ink">Firma de Conformidad</p>
            <p className="font-mono text-[10px] text-muted">{client.nombre}</p>
          </div>
        </div>

        {/* SELLO CRIPTOGRÁFICO Y CÓDIGO QR */}
        <div className="flex items-center justify-between gap-4 border-t-2 border-line/80 pt-4 font-mono text-[10px]">
          <div className="max-w-[560px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <ShieldCheck size={14} className="text-gold" />
              <span>SELLO DIGITAL INMUTABLE (SHA-256):</span>
              <button
                type="button"
                onClick={copyHash}
                className="ml-1 cursor-pointer text-[9px] text-muted underline hover:text-navy print:hidden"
              >
                {copiedHash ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="break-all rounded border border-line bg-surface-2 p-1.5 text-[9.5px] leading-tight text-muted">
              {expediente.input_hash}
            </div>
            <p className="text-[9px] text-muted">
              Para validar la autenticidad e inalterabilidad legal de este dictamen, escanee el
              código QR o consulte en{' '}
              <span className="text-navy">https://ledger.arksystems.site</span> con el hash digital.
            </p>
          </div>

          {qrDataUrl && (
            <div className="shrink-0 text-center">
              <img
                src={qrDataUrl}
                alt="Código QR de Verificación"
                className="mx-auto h-20 w-20 rounded-lg border border-navy/20 bg-white p-1"
              />
              <span className="mt-1 block text-[8px] font-bold uppercase text-navy">
                Escanear para Validar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
