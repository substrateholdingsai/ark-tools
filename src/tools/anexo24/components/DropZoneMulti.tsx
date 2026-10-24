/**
 * ARK LEDGER — Herramienta #16: Motor de Conciliación Anexo 24
 * DropZoneMulti: Ingesta interactiva cliente-side para 3 tipos de fuentes de datos:
 * 1. XMLs de CFDI emitidos
 * 2. TXT de Metadata SAT (Vigencia / Cancelación)
 * 3. XML de Anexo 24 (Catálogo de Cuentas / Balanza de Comprobación)
 */

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  FileCode,
  FileCheck2,
  BookOpen,
  Upload,
  CheckCircle2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { FacturaCFDI } from '@/tools/xml-excel/types';
import type { CatalogoBalanzaAnexo24, MetadataParseResult } from '../types';
import { parsearCFDI } from '@/tools/xml-excel/lib/parserCFDI';
import { parsearMetadataSAT } from '../lib/parserMetadata';
import { parsearXMLAnexo24 } from '../lib/parserAnexo24';

// Datos de demostración listos para probar en 1 clic
const DEMO_CFDI_1 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F" Folio="2001" Fecha="2026-03-10T11:00:00" FormaPago="03" MetodoPago="PUE" Moneda="MXN" SubTotal="50000.00" Descuento="0.00" Total="58000.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="DES850101XYZ" Nombre="DESARROLLO DE SOFTWARE INTEGRAL SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO DEL NORTE SA" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="81111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Licencia Anual ERP y Asesoría Fiscal Cloud" ValorUnitario="50000.00" Importe="50000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="8000.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="50000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="8000.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="AAAAAAAA-1111-2222-3333-444444444444" FechaTimbrado="2026-03-10T11:05:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const DEMO_CFDI_2 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F" Folio="2002" Fecha="2026-03-11T16:30:00" FormaPago="99" MetodoPago="PPD" Moneda="MXN" SubTotal="30000.00" Descuento="0.00" Total="34800.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="DES850101XYZ" Nombre="DESARROLLO DE SOFTWARE INTEGRAL SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="IND950412XYZ" Nombre="INDUSTRIAS METALMECANICAS DEL CENTRO SA" RegimenFiscalReceptor="601" UsoCFDI="G01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="43231500" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicios de auditoría y conciliación contable" ValorUnitario="30000.00" Importe="30000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="4800.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="30000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="4800.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="BBBBBBBB-2222-3333-4444-555555555555" FechaTimbrado="2026-03-11T16:35:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const DEMO_CFDI_CANCELADA = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F" Folio="2003" Fecha="2026-03-12T10:00:00" FormaPago="01" MetodoPago="PUE" Moneda="MXN" SubTotal="15000.00" Descuento="0.00" Total="17400.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="DES850101XYZ" Nombre="DESARROLLO DE SOFTWARE INTEGRAL SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CORP901231ABC" Nombre="CORPORATIVO FINANCIERO DEL NORTE SA" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="81111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Factura emitida por error (Cancelada en SAT)" ValorUnitario="15000.00" Importe="15000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="2400.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="15000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="2400.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="CCCCCCCC-3333-4444-5555-666666666666" FechaTimbrado="2026-03-12T10:05:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const DEMO_METADATA_TXT = `Uuid~RfcEmisor~NombreEmisor~RfcReceptor~NombreReceptor~RfcPac~FechaEmision~FechaCertificacionSat~Monto~EfectoComprobante~Estatus~FechaCancelacion
AAAAAAAA-1111-2222-3333-444444444444~DES850101XYZ~DESARROLLO DE SOFTWARE INTEGRAL SA DE CV~CORP901231ABC~CORPORATIVO FINANCIERO DEL NORTE SA~PAC01~2026-03-10~2026-03-10~58000.00~I~1~
BBBBBBBB-2222-3333-4444-555555555555~DES850101XYZ~DESARROLLO DE SOFTWARE INTEGRAL SA DE CV~IND950412XYZ~INDUSTRIAS METALMECANICAS DEL CENTRO SA~PAC01~2026-03-11~2026-03-11~34800.00~I~1~
CCCCCCCC-3333-4444-5555-666666666666~DES850101XYZ~DESARROLLO DE SOFTWARE INTEGRAL SA DE CV~CORP901231ABC~CORPORATIVO FINANCIERO DEL NORTE SA~PAC01~2026-03-12~2026-03-12~17400.00~I~0~2026-03-13T12:00:00
`;

const DEMO_CATALOGO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalogocuentas:Catalogo xmlns:catalogocuentas="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas"
  Version="1.3" RFC="DES850101XYZ" Mes="03" Anio="2026">
  <catalogocuentas:Ctas CodAgrup="105.01" NumCta="1105-01-001" Desc="Clientes Nacionales Monterrey" SubCtaDe="1105" Nivel="2" Naturaleza="D"/>
  <catalogocuentas:Ctas CodAgrup="208.01" NumCta="2108-01-001" Desc="IVA Trasladado Efectivamente Cobrado" SubCtaDe="2108" Nivel="2" Naturaleza="A"/>
  <catalogocuentas:Ctas CodAgrup="209.01" NumCta="2109-01-001" Desc="IVA Trasladado Pendiente de Cobro PPD" SubCtaDe="2109" Nivel="2" Naturaleza="A"/>
  <catalogocuentas:Ctas CodAgrup="401.01" NumCta="4101-01-001" Desc="Ventas y Servicios Tasa General 16%" SubCtaDe="4101" Nivel="2" Naturaleza="A"/>
</catalogocuentas:Catalogo>`;

interface DropZoneMultiProps {
  facturas: FacturaCFDI[];
  metadata: MetadataParseResult | null;
  catalogo: CatalogoBalanzaAnexo24 | null;
  onFacturasCargadas: (facturas: FacturaCFDI[]) => void;
  onMetadataCargada: (metadata: MetadataParseResult | null) => void;
  onCatalogoCargado: (catalogo: CatalogoBalanzaAnexo24 | null) => void;
  onLimpiarTodo: () => void;
}

export function DropZoneMulti({
  facturas,
  metadata,
  catalogo,
  onFacturasCargadas,
  onMetadataCargada,
  onCatalogoCargado,
  onLimpiarTodo,
}: DropZoneMultiProps) {
  const [arrastrandoCfdi, setArrastrandoCfdi] = useState(false);
  const [arrastrandoMeta, setArrastrandoMeta] = useState(false);
  const [arrastrandoCata, setArrastrandoCata] = useState(false);

  const fileInputCfdiRef = useRef<HTMLInputElement>(null);
  const fileInputMetaRef = useRef<HTMLInputElement>(null);
  const fileInputCataRef = useRef<HTMLInputElement>(null);

  const procesarArchivosCFDI = async (files: FileList | File[]) => {
    const lista = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.xml'));
    if (lista.length === 0) return;

    const nuevasFacturas: FacturaCFDI[] = [];
    for (const file of lista) {
      try {
        const texto = await file.text();
        const factura = parsearCFDI(texto, file.name);
        nuevasFacturas.push(factura);
      } catch (e) {
        console.error('Error parseando CFDI', file.name, e);
      }
    }

    onFacturasCargadas([...facturas, ...nuevasFacturas]);
  };

  const procesarArchivoMetadata = async (file: File) => {
    try {
      const texto = await file.text();
      const meta = parsearMetadataSAT(texto);
      onMetadataCargada(meta);
    } catch (e) {
      console.error('Error parseando Metadata SAT', e);
    }
  };

  const procesarArchivoCatalogo = async (file: File) => {
    try {
      const texto = await file.text();
      const cata = parsearXMLAnexo24(texto, catalogo);
      onCatalogoCargado(cata);
    } catch (e) {
      console.error('Error parseando Anexo 24', e);
    }
  };

  const cargarDemo = () => {
    const f1 = parsearCFDI(DEMO_CFDI_1, 'CFDI_F2001.xml');
    const f2 = parsearCFDI(DEMO_CFDI_2, 'CFDI_F2002.xml');
    const f3 = parsearCFDI(DEMO_CFDI_CANCELADA, 'CFDI_F2003_CANCELADA.xml');

    const meta = parsearMetadataSAT(DEMO_METADATA_TXT);
    const cata = parsearXMLAnexo24(DEMO_CATALOGO_XML);

    onFacturasCargadas([f1, f2, f3]);
    onMetadataCargada(meta);
    onCatalogoCargado(cata);
  };

  const tieneDatos = facturas.length > 0 || metadata !== null || catalogo !== null;

  return (
    <div className="space-y-4">
      {/* Barra superior de acciones rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted">
            Fuentes de Ingesta Cliente-Side (100% Local y Privado)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={cargarDemo}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 font-orbitron text-[11px] font-bold uppercase tracking-wider text-gold-dark hover:bg-gold/20"
          >
            <Sparkles size={13} />
            <span>Cargar Lote de Demostración</span>
          </button>

          {tieneDatos && (
            <button
              type="button"
              onClick={onLimpiarTodo}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted hover:border-red-300 hover:text-red-700"
            >
              <Trash2 size={13} />
              <span>Limpiar Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de los 3 DropZones */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1. CFDIs XML */}
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoCfdi(true);
          }}
          onDragLeave={() => setArrastrandoCfdi(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoCfdi(false);
            if (e.dataTransfer.files) void procesarArchivosCFDI(e.dataTransfer.files);
          }}
          onClick={() => fileInputCfdiRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 border-dashed p-6 transition-all ${
            arrastrandoCfdi
              ? 'border-navy bg-navy/5 shadow-md'
              : facturas.length > 0
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-line bg-surface hover:border-navy/40 hover:bg-surface-2'
          }`}
        >
          <input
            ref={fileInputCfdiRef}
            type="file"
            multiple
            accept=".xml"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) void procesarArchivosCFDI(e.target.files);
            }}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                <FileCode size={20} />
              </div>
              {facturas.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  <CheckCircle2 size={12} /> {facturas.length} XMLs
                </span>
              )}
            </div>

            <div>
              <h3 className="font-playfair text-[17px] font-bold text-ink">
                1. Facturas CFDI (XML)
              </h3>
              <p className="mt-1 font-inter text-xs leading-relaxed text-muted">
                Arrastra lote de facturas de ingresos emitidas (CFDI 4.0 o 3.3).
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-2 text-[11px] font-semibold text-navy">
            <Upload size={13} />
            <span>{facturas.length > 0 ? 'Agregar más XMLs' : 'Seleccionar archivos XML'}</span>
          </div>
        </div>

        {/* 2. Metadata SAT TXT */}
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoMeta(true);
          }}
          onDragLeave={() => setArrastrandoMeta(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoMeta(false);
            const f = e.dataTransfer.files[0];
            if (f) void procesarArchivoMetadata(f);
          }}
          onClick={() => fileInputMetaRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 border-dashed p-6 transition-all ${
            arrastrandoMeta
              ? 'border-navy bg-navy/5 shadow-md'
              : metadata !== null
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-line bg-surface hover:border-navy/40 hover:bg-surface-2'
          }`}
        >
          <input
            ref={fileInputMetaRef}
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void procesarArchivoMetadata(f);
            }}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <FileCheck2 size={20} />
              </div>
              {metadata !== null && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  <CheckCircle2 size={12} /> {metadata.totalRegistros} Folios
                </span>
              )}
            </div>

            <div>
              <h3 className="font-playfair text-[17px] font-bold text-ink">
                2. Metadata del SAT (TXT)
              </h3>
              <p className="mt-1 font-inter text-xs leading-relaxed text-muted">
                Archivo plano del portal SAT para filtrar y descartar facturas canceladas.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-navy">
              <Upload size={13} />
              <span>{metadata ? 'Reemplazar TXT' : 'Seleccionar Metadata SAT'}</span>
            </div>
            {metadata && metadata.cancelados > 0 && (
              <span className="text-[10px] font-bold text-red-600">
                {metadata.cancelados} cancelados
              </span>
            )}
          </div>
        </div>

        {/* 3. XML Anexo 24 (Catálogo / Balanza) */}
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoCata(true);
          }}
          onDragLeave={() => setArrastrandoCata(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setArrastrandoCata(false);
            const f = e.dataTransfer.files[0];
            if (f) void procesarArchivoCatalogo(f);
          }}
          onClick={() => fileInputCataRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 border-dashed p-6 transition-all ${
            arrastrandoCata
              ? 'border-navy bg-navy/5 shadow-md'
              : catalogo !== null
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-line bg-surface hover:border-navy/40 hover:bg-surface-2'
          }`}
        >
          <input
            ref={fileInputCataRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void procesarArchivoCatalogo(f);
            }}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <BookOpen size={20} />
              </div>
              {catalogo !== null ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  <CheckCircle2 size={12} /> {catalogo.cuentas.length} Cuentas
                </span>
              ) : (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                  Opcional (SAT Std)
                </span>
              )}
            </div>

            <div>
              <h3 className="font-playfair text-[17px] font-bold text-ink">
                3. Contabilidad Anexo 24
              </h3>
              <p className="mt-1 font-inter text-xs leading-relaxed text-muted">
                Catálogo de Cuentas o Balanza XML. Si se omite, usa el catálogo SAT oficial
                estándar.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-2 text-[11px] font-semibold text-navy">
            <Upload size={13} />
            <span>{catalogo ? 'Reemplazar Catálogo' : 'Cargar XML Anexo 24'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
