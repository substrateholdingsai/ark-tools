/**
 * ARK TOOLS — Validador de XMLs CFDI 4.0 & 3.3
 * Componente Principal
 *
 * Audita en tiempo real archivos XML de facturas electrónicas:
 *   - Verificación de esquema y versión vigente
 *   - Validación de timbrado digital y sellos SAT
 *   - Auditoría de RFC, Domicilio Fiscal y Régimen Receptor
 *   - Cuadratura aritmética contable entre subtotales, impuestos y total
 *   - Detección de inconsistencias PPD/PUE (Regla 2.7.1.32)
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import { DropZoneXML } from '../xml-excel/components/DropZoneXML';
import {
  ResumenAuditoriaCard,
  ListaDictamenes,
} from './components';
import {
  validarCFDI,
  validarArchivosXML,
  calcularResumenAuditoria,
} from './lib/validadorCFDI';
import { descargarCSVDictamenes } from './lib/exportarDictamen';
import type { DictamenCFDI } from './types';

// XMLs de demostración para auditoría
const EJEMPLOS_AUDITORIA = [
  // 1. Factura CFDI 4.0 Válida
  {
    nombre: 'cfdi-40-aprobado.xml',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="A" Folio="540" Fecha="2026-03-20T12:00:00" FormaPago="03" MetodoPago="PUE" LugarExpedicion="06600" Exportacion="01" Moneda="MXN" TipoCambio="1" SubTotal="50000.00" Descuento="0.00" Total="58000.00" TipoDeComprobante="I" NoCertificado="00001000000500000000" Sello="SELLO_EMISOR_OK">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="ESCUELA KEMPER URGATE" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="URE180429CE4" Nombre="UNIVERSIDAD ROBOTICA DE EXCELENCIA" DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="80141600" Cantidad="1" ClaveUnidad="E48" Descripcion="Consultoría tributaria y auditoría de balance" ValorUnitario="50000.00" Importe="50000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="8000.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="50000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="8000.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="7F9A1B2C-3D4E-5F6A-7B8C-9D0E1F2A3B4C" SelloCFD="S1" SelloSAT="S2" FechaTimbrado="2026-03-20T12:02:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,
  },

  // 2. CFDI con Discrepancia Aritmética (Total no cuadra)
  {
    nombre: 'cfdi-error-aritmético.xml',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F" Folio="99" Fecha="2026-03-22T15:30:00" FormaPago="01" MetodoPago="PUE" LugarExpedicion="64000" Exportacion="01" Moneda="MXN" TipoCambio="1" SubTotal="20000.00" Descuento="0.00" Total="27000.00" TipoDeComprobante="I" NoCertificado="00001000000500000000" Sello="SELLO_EMISOR_OK">
  <cfdi:Emisor Rfc="MEMA8204159Z8" Nombre="ALEJANDRO MEDINA" RegimenFiscal="612"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO" DomicilioFiscalReceptor="64000" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Dictamen de estados financieros" ValorUnitario="20000.00" Importe="20000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="3200.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="B2C3D4E5-F6A7-8B9C-0D1E-2F3A4B5C6D7E" SelloCFD="S1" SelloSAT="S2" FechaTimbrado="2026-03-22T15:32:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,
  },

  // 3. CFDI con Inconsistencia en Forma de Pago PPD (Forma 03 en vez de 99)
  {
    nombre: 'cfdi-observacion-ppd.xml',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="B" Folio="12" Fecha="2026-03-25T17:00:00" FormaPago="03" MetodoPago="PPD" LugarExpedicion="06600" Exportacion="01" Moneda="MXN" TipoCambio="1" SubTotal="12000.00" Descuento="0.00" Total="13920.00" TipoDeComprobante="I" NoCertificado="00001000000500000000" Sello="SELLO_EMISOR_OK">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="ESCUELA KEMPER URGATE" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="URE180429CE4" Nombre="UNIVERSIDAD ROBOTICA DE EXCELENCIA" DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="80141600" Cantidad="1" ClaveUnidad="E48" Descripcion="Material didáctico fiscal" ValorUnitario="12000.00" Importe="12000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="1920.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="4A5B6C7D-8E9F-0A1B-2C3D-4E5F6A7B8C9D" SelloCFD="S1" SelloSAT="S2" FechaTimbrado="2026-03-25T17:02:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`,
  },
];

interface ValidadorXMLProps {
  onBack?: () => void;
}

export function ValidadorXML({ onBack }: ValidadorXMLProps) {
  const [dictamenes, setDictamenes] = useState<DictamenCFDI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

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

  // Carga y validación de archivos XML arrastrados
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setIsLoading(true);
      try {
        const nuevosDictamenes = await validarArchivosXML(files);
        setDictamenes((prev) => {
          const uuidsExistentes = new Set(
            prev.map((d) => d.uuid).filter((u) => u !== 'SIN UUID')
          );
          const unicos = nuevosDictamenes.filter((d) => !uuidsExistentes.has(d.uuid));
          return [...prev, ...unicos];
        });
        showToast(`Se auditaron ${files.length} comprobante(s) XML`);
      } catch (err) {
        showToast('Error al auditar los comprobantes');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Carga de casos de prueba
  const handleCargarEjemplos = useCallback(() => {
    const demos = EJEMPLOS_AUDITORIA.map((e) => validarCFDI(e.xml, e.nombre));
    setDictamenes(demos);
    showToast('3 casos de auditoría cargados (Válido, Error y Observación)');
  }, [showToast]);

  // Exportar reporte de auditoría a CSV
  const handleDescargarDictamen = useCallback(() => {
    if (dictamenes.length === 0) return;
    descargarCSVDictamenes(dictamenes);
    showToast('Dictamen de auditoría descargado en CSV');
  }, [dictamenes, showToast]);

  const handleLimpiar = useCallback(() => {
    setDictamenes([]);
    showToast('Auditoría reiniciada');
  }, [showToast]);

  const handleEliminarDictamen = useCallback(
    (id: string) => {
      setDictamenes((prev) => prev.filter((d) => d.id !== id));
      showToast('Comprobante eliminado');
    },
    [showToast]
  );

  const resumen = useMemo(
    () => calcularResumenAuditoria(dictamenes),
    [dictamenes]
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 space-y-10">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLVER AL DASHBOARD
        </button>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase orbitron font-orbitron">
              AUDITORÍA FISCAL SAT
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-muted">Anexo 20 RMF & CFF</span>
          </div>
          <h1 className="mt-2 font-playfair font-black text-3xl md:text-5xl text-ink tracking-tight">
            Validador de XMLs CFDI
          </h1>
          <p className="mt-2 text-sm text-muted max-w-2xl">
            Inspecciona UUIDs, sellos criptográficos, obligatoriedad de datos
            en CFDI 4.0 (CP y régimen receptor), y cuadratura aritmética para
            garantizar la deducibilidad de tus comprobantes.
          </p>
        </div>

        {dictamenes.length === 0 && (
          <button
            onClick={handleCargarEjemplos}
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-4 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            Cargar 3 casos de prueba
          </button>
        )}
      </div>

      {/* Zona Drag & Drop */}
      <section>
        <DropZoneXML
          onFilesSelected={handleFilesSelected}
          isLoading={isLoading}
          totalCargados={dictamenes.length}
        />
      </section>

      {/* Reporte de Auditoría y Detalle */}
      {dictamenes.length > 0 && (
        <div className="space-y-8 animate-fadeIn">
          {/* Card Resumen Consolidado */}
          <section>
            <ResumenAuditoriaCard
              resumen={resumen}
              onDescargarDictamen={handleDescargarDictamen}
              onLimpiar={handleLimpiar}
            />
          </section>

          {/* Lista Interactiva de Dictámenes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-ink">
                Resultados de la Auditoría
              </h2>
            </div>
            <ListaDictamenes
              dictamenes={dictamenes}
              onEliminarDictamen={handleEliminarDictamen}
              onCopiarTexto={showToast}
            />
          </section>
        </div>
      )}

      {/* Badges de Garantía */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted border-t border-white/5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span>Auditoría Segura en Cliente (Zero Cloud Upload)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <span>Reglas oficiales Anexo 20 RMF 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-gold" />
          <span>Exportación de Dictamen para Papeles de Trabajo</span>
        </div>
      </div>

      {/* Toast Flotante */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-navy border border-gold/50 px-4 py-3 text-xs font-medium text-ink shadow-2xl shadow-gold/20 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default ValidadorXML;
