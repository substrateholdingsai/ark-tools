/**
 * ARK TOOLS — Conversor XML a Excel (CFDI 4.0 & 3.3)
 * Componente Principal
 *
 * Permite cargar hasta 200 archivos XML de facturas electrónicas, procesarlas
 * en tiempo real en el cliente (sin enviar datos a ningún servidor) y exportar
 * una sábana contable en CSV compatible al 100% con Excel y Google Sheets.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, FileSpreadsheet, Check, Sparkles, ShieldCheck, Cpu } from 'lucide-react';
import { DropZoneXML, ResumenLoteCard, TablaFacturas } from './components';
import { parsearCFDI, procesarArchivosXML, calcularResumenLote } from './lib/parserCFDI';
import { descargarCSVFacturas } from './lib/exportarExcel';
import type { FacturaCFDI } from './types';

// XMLs de ejemplo para el modo demostración
const EJEMPLOS_DEMO = [
  `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F" Folio="204" Fecha="2026-03-10T14:20:00" FormaPago="03" MetodoPago="PUE" LugarExpedicion="06600" Moneda="MXN" SubTotal="45000.00" Descuento="2000.00" Total="49880.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="DES850101XYZ" Nombre="DESARROLLO DE SOFTWARE INTEGRAL SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO DEL NORTE SA" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="81111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Licencia Anual Plataforma en la Nube ARK" ValorUnitario="45000.00" Importe="45000.00" Descuento="2000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="6880.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="43000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="6880.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="9B7C3E14-45D2-482F-8CE9-039A5D6B10E1" FechaTimbrado="2026-03-10T14:21:05"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

  `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="HON" Folio="88" Fecha="2026-03-12T11:15:00" FormaPago="03" MetodoPago="PUE" LugarExpedicion="64000" Moneda="MXN" SubTotal="28000.00" Descuento="0.00" Total="29493.34" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="MEMA8204159Z8" Nombre="ALEJANDRO MEDINA MARTINEZ" RegimenFiscal="612"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO DEL NORTE SA" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicios de auditoría y dictamen fiscal 2025" ValorUnitario="28000.00" Importe="28000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="4480.00" TotalImpuestosRetenidos="2986.66">
    <cfdi:Retenciones>
      <cfdi:Retencion Impuesto="002" Importe="2986.66"/>
      <cfdi:Retencion Impuesto="001" Importe="2800.00"/>
    </cfdi:Retenciones>
    <cfdi:Traslados>
      <cfdi:Traslado Base="28000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="4480.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="5E2B910A-33C1-4D90-BA12-70FD18CE5821" FechaTimbrado="2026-03-12T11:16:30"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

  `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="NC" Folio="15" Fecha="2026-03-14T09:40:00" FormaPago="01" MetodoPago="PUE" LugarExpedicion="06600" Moneda="MXN" SubTotal="5000.00" Descuento="0.00" Total="5800.00" TipoDeComprobante="E">
  <cfdi:Emisor Rfc="DES850101XYZ" Nombre="DESARROLLO DE SOFTWARE INTEGRAL SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO DEL NORTE SA" RegimenFiscalReceptor="601" UsoCFDI="G02"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Bonificación comercial por pronto pago" ValorUnitario="5000.00" Importe="5000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="800.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="5000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="800.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="C3A1098F-E24D-4A8E-9543-0BC837482DA9" FechaTimbrado="2026-03-14T09:42:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,
];

interface ConversorXMLProps {
  onBack?: () => void;
}

export function ConversorXML({ onBack }: ConversorXMLProps) {
  const [facturas, setFacturas] = useState<FacturaCFDI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Limpiar timer de toast al desmontar
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  // Carga de archivos XML arrastrados o seleccionados
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setIsLoading(true);
      try {
        const nuevasFacturas = await procesarArchivosXML(files);
        setFacturas((prev) => {
          // Filtrar duplicados por UUID si ya existe
          const uuidsExistentes = new Set(prev.map((f) => f.uuid).filter((u) => u !== 'SIN UUID'));
          const unicos = nuevasFacturas.filter((f) => !uuidsExistentes.has(f.uuid));
          return [...prev, ...unicos];
        });
        showToast(`Se procesaron ${files.length} archivo(s) XML`);
      } catch (err) {
        showToast('Error al procesar los archivos');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Carga de demostración con 3 XMLs listos
  const handleCargarEjemplos = useCallback(() => {
    const demoParsed = EJEMPLOS_DEMO.map((xml, idx) =>
      parsearCFDI(xml, `ejemplo-cfdi-00${idx + 1}.xml`)
    );
    setFacturas(demoParsed);
    showToast('3 comprobantes de demostración cargados');
  }, [showToast]);

  // Descarga del reporte en Excel (CSV)
  const handleDescargarExcel = useCallback(() => {
    if (facturas.length === 0) return;
    descargarCSVFacturas(facturas);
    showToast('Reporte Excel (CSV) generado con éxito');
  }, [facturas, showToast]);

  // Limpiar todos los comprobantes
  const handleLimpiar = useCallback(() => {
    setFacturas([]);
    showToast('Lista de comprobantes limpiada');
  }, [showToast]);

  // Eliminar un comprobante específico
  const handleEliminarFactura = useCallback(
    (id: string) => {
      setFacturas((prev) => prev.filter((f) => f.id !== id));
      showToast('Comprobante eliminado');
    },
    [showToast]
  );

  // Resumen financiero del lote cargado
  const resumen = useMemo(() => calcularResumenLote(facturas), [facturas]);

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-6 py-12 md:px-10">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLVER AL DASHBOARD
        </button>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="orbitron font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              CFDI 4.0 & 3.3
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-muted">Procesamiento Masivo</span>
          </div>
          <h1 className="mt-2 font-playfair text-3xl font-black tracking-tight text-ink md:text-5xl">
            Conversor XML → Excel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Arrastra tus facturas electrónicas y extrae instantáneamente UUID, emisor, receptor,
            impuestos y totales. 100% privado en tu navegador: ningún dato fiscal sale de tu equipo.
          </p>
        </div>

        {/* Botón de Ejemplos si está vacío */}
        {facturas.length === 0 && (
          <button
            onClick={handleCargarEjemplos}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold transition-all hover:scale-[1.02] hover:bg-gold/20 md:self-auto"
          >
            <Sparkles className="h-4 w-4" />
            Cargar 3 XMLs de muestra
          </button>
        )}
      </div>

      {/* Zona Drag & Drop */}
      <section>
        <DropZoneXML
          onFilesSelected={handleFilesSelected}
          isLoading={isLoading}
          totalCargados={facturas.length}
        />
      </section>

      {/* Si hay comprobantes cargados, mostrar Resumen y Tabla */}
      {facturas.length > 0 && (
        <div className="animate-fadeIn space-y-8">
          {/* Card de Resumen Consolidado */}
          <section>
            <ResumenLoteCard
              resumen={resumen}
              onDescargarExcel={handleDescargarExcel}
              onLimpiar={handleLimpiar}
            />
          </section>

          {/* Tabla Interactiva de Comprobantes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-playfair text-xl font-bold text-ink md:text-2xl">
                Detalle de Comprobantes
              </h2>
            </div>
            <TablaFacturas
              facturas={facturas}
              onEliminarFactura={handleEliminarFactura}
              onCopiarTexto={showToast}
            />
          </section>
        </div>
      )}

      {/* Badges de Garantía y Privacidad */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Privacidad Absoluta (Cero Transferencia a Servidores)</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-gold" />
          <span>Parseo nativo ultra rápido</span>
        </div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-gold" />
          <span>Formato CSV UTF-8 con BOM para Excel</span>
        </div>
      </div>

      {/* Toast flotante */}
      {toast && (
        <div className="animate-fadeIn fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-gold/50 bg-navy px-4 py-3 text-xs font-medium text-ink shadow-2xl shadow-gold/20">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default ConversorXML;
