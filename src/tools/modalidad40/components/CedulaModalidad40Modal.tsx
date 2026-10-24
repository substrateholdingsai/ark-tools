import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck } from 'lucide-react';
import type { ResultadoModalidad40 } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resultado: ResultadoModalidad40;
  nombreAsegurado?: string;
  nssAsegurado?: string;
  despachoName?: string;
}

export function CedulaModalidad40Modal({
  isOpen,
  onClose,
  resultado,
  nombreAsegurado = 'Asegurado Proyectado',
  nssAsegurado = '0000-00-0000',
  despachoName = 'Despacho Contable ARK',
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  const hash = resultado.selloSha256;
  const verifyUrl = `https://ledger.arksystems.site/?verify=${hash}`;

  useEffect(() => {
    if (!isOpen) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: '#002B7F',
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, verifyUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { parametros, limites, inversion, pension, roi } = resultado;

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-[24px] border border-line bg-surface shadow-2xl print:max-h-none print:w-full print:rounded-none print:border-none print:shadow-none">
        {/* Barra superior de acciones (Oculta al imprimir) */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              PAPEL DE TRABAJO INSTITUCIONAL
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              ACUERDO DOF 21/10/2026 · LEY 73
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-[12px] bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/90"
            >
              <Printer className="h-4 w-4 text-gold" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido Cédula Tamaño Carta */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-y-auto p-6 font-inter text-navy sm:p-10 print:overflow-visible print:p-0"
        >
          {/* Membrete Oficial */}
          <div className="flex flex-col gap-6 border-b-2 border-navy pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-xs font-black tracking-[0.25em] text-gold-dark">
                  ARK LEDGER FISCAL & NÓMINA
                </span>
                <span className="font-mono text-[10px] text-muted">· SISTEMA MULTI-TENANT</span>
              </div>
              <h1 className="mt-1 font-playfair text-xl font-black text-navy sm:text-2xl">
                Cédula de Proyección de Pensión Ley 73 & Modalidad 40
              </h1>
              <p className="text-xs text-muted">
                Dictamen actuarial conforme a los Arts. 167 y 218 LSS y el Acuerdo
                ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026)
              </p>
            </div>

            <div className="text-right">
              <span className="font-orbitron text-xs font-bold uppercase text-navy">
                {despachoName}
              </span>
              <span className="block font-mono text-[11px] text-muted">
                Fecha de Emisión: {resultado.fechaCalculoIso.split('T')[0]}
              </span>
              <span className="block font-mono text-[10px] font-bold text-emerald-700">
                ● Tasa Cuota 2026: {inversion.tasaCuotaPct}% LSS
              </span>
            </div>
          </div>

          {/* Ficha del Asegurado */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface-2 p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">Asegurado:</span>
              <strong className="block truncate text-navy">{nombreAsegurado}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">NSS:</span>
              <strong className="font-mono text-navy">{nssAsegurado}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Edad de Retiro:
              </span>
              <strong className="font-mono text-navy">
                {parametros.edadJubilacion} Años ({pension.factorEdadPct}%)
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Meses Proyectados M40:
              </span>
              <strong className="font-mono text-navy">
                {parametros.mesesAportacion} Meses ({pension.semanasM40} Semanas)
              </strong>
            </div>
          </div>

          {/* Memoria de Criterio Normativo DOF 21/10/2026 */}
          <div className="mt-6 rounded-xl border border-line p-4">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
              AUDITORÍA DE CRITERIO NORMATIVO — ACUERDO DOF 21/10/2026
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div className="border-r border-line pr-2">
                <span className="text-muted">Último SBC al causar baja:</span>
                <span className="block font-mono font-bold text-navy">
                  ${parametros.ultimoSbc.toFixed(2)} MXN/día
                </span>
              </div>
              <div className="border-r border-line pr-2">
                <span className="text-muted">Adición legal (+1 UMA diaria):</span>
                <span className="block font-mono font-bold text-navy">
                  +${limites.umaDiaria.toFixed(2)} MXN/día
                </span>
              </div>
              <div>
                <span className="text-muted">Techo Legal Restringido:</span>
                <span className="block font-mono font-bold text-navy">
                  ${limites.limitePermitidoDof2026.toFixed(2)} MXN/día
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] italic text-muted">{limites.mensajeCriterio}</p>
          </div>

          {/* Desglose Actuarial Ley 73 */}
          <div className="mt-6 rounded-xl border border-line p-4">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
              MEMORIA ACTUARIAL DE CUANTÍA (ART. 167 LSS)
            </span>
            <table className="mt-3 w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-3 py-2">Concepto Actuarial</th>
                  <th className="px-3 py-2">Base / Factor</th>
                  <th className="px-3 py-2 text-right">Importe Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-[11px]">
                <tr>
                  <td className="px-3 py-2 font-sans font-medium text-navy">
                    Salario Promedio Diario (Últimas 250 Semanas)
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {pension.factorSalarioSmg.toFixed(2)} veces el SMG
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-navy">
                    ${pension.salarioPromedioDiario.toFixed(2)} MXN/día
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-sans font-medium text-navy">
                    Cuantía Básica Anual (Art. 167 LSS)
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {pension.pctCuantiaBasica.toFixed(2)}% del promedio
                  </td>
                  <td className="px-3 py-2 text-right text-navy">
                    $
                    {pension.cuantiaBasicaAnual.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-sans font-medium text-navy">
                    Incrementos Anuales ({pension.aniosExcedentes} Años excedentes)
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {pension.pctIncrementoAnual.toFixed(3)}% × {pension.aniosExcedentes} años
                  </td>
                  <td className="px-3 py-2 text-right text-navy">
                    $
                    {pension.incrementosAnuales.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-sans font-medium text-navy">
                    Pensión Ajustada por Edad ({pension.factorEdadPct}%)
                  </td>
                  <td className="px-3 py-2 text-muted">
                    Art. 171 LSS ({parametros.edadJubilacion} años)
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-navy">
                    ${pension.pensionConEdad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                {parametros.asignacionFamiliar && (
                  <tr>
                    <td className="px-3 py-2 font-sans font-medium text-navy">
                      Asignación Familiar / Ayuda Soledad (+15%)
                    </td>
                    <td className="px-3 py-2 text-muted">Art. 164 LSS</td>
                    <td className="px-3 py-2 text-right text-emerald-800">
                      +$
                      {pension.importeAsignacionFamiliar.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="px-3 py-2 font-sans font-medium text-navy">
                    Actualización Decreto Fox 2004 (+11%)
                  </td>
                  <td className="px-3 py-2 text-muted">Decreto Presidencial 2004</td>
                  <td className="px-3 py-2 text-right text-emerald-800">
                    +$
                    {pension.importeDecretoFox.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr className="bg-surface-2 text-xs font-bold">
                  <td className="px-3 py-2.5 font-sans text-navy">PENSIÓN MENSUAL NETA ESTIMADA</td>
                  <td className="px-3 py-2.5 text-muted">12 mensualidades</td>
                  <td className="px-3 py-2.5 text-right text-sm text-navy">
                    $
                    {pension.pensionMensualEstimada.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    MXN/mes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cuadro de Inversión y ROI */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-4 text-xs">
              <span className="mb-2 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                INVERSIÓN EN MODALIDAD 40 (2026)
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Aportación mensual al IMSS:</span>
                  <span className="font-mono font-bold text-navy">
                    ${inversion.cuotaMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Meses proyectados a pagar:</span>
                  <span className="font-mono font-bold text-navy">
                    {parametros.mesesAportacion} meses
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-1 font-bold">
                  <span className="text-navy">Inversión Total Acumulada:</span>
                  <span className="font-mono text-navy">
                    $
                    {inversion.inversionTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    MXN
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 text-xs">
              <span className="mb-2 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                RETORNO DE INVERSIÓN (ROI)
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Pensión estimada sin M40:</span>
                  <span className="font-mono text-muted">
                    ${roi.pensionSinM40.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    MXN/mes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-emerald-800">Ganancia mensual neta:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    +$
                    {roi.incrementoMensualPension.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    MXN/mes
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-1 font-bold">
                  <span className="text-gold-dark">Recuperación del 100%:</span>
                  <span className="font-mono text-gold-dark">
                    {roi.tiempoRecuperacionFormateado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque de Autenticidad Criptográfica y QR */}
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-navy/20 bg-surface-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase text-navy">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Sello Digital SHA-256 e Inalterabilidad Pericial</span>
              </div>
              <p className="max-w-md break-all font-mono text-[10px] text-muted">Hash: {hash}</p>
              <p className="text-[10px] text-muted">
                Este dictamen cuenta con respaldo determinista y verificación pública abierta ante
                el IMSS, tribunales y despachos contables auditores.
              </p>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="QR Verificación"
                  className="h-24 w-24 rounded-lg border border-line bg-white p-1"
                />
                <span className="mt-1 font-mono text-[8px] uppercase text-muted">
                  Escanear para cotejo
                </span>
              </div>
            )}
          </div>

          {/* Espacio para Firmas */}
          <div className="mt-12 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="border-t border-navy pt-2">
              <strong className="block text-navy">{despachoName}</strong>
              <span className="text-[10px] text-muted">Asesor / Contador Certificado</span>
            </div>
            <div className="border-t border-navy pt-2">
              <strong className="block text-navy">{nombreAsegurado}</strong>
              <span className="text-[10px] text-muted">Asegurado Titular</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
