/**
 * Generador de datos de prueba para validación inmediata del Auditor Forense.
 * Genera contribuyentes realistas de México con comprobantes normales y casos deliberadamente atípicos.
 */

import type { Contribuyente, CFDIExtraido, SATMetadataItem } from '../types';

export function generarDatosDemostracion(ejercicio = 2026): {
  contribuyente: Contribuyente;
  otrosContribuyentes: Contribuyente[];
  cfdis: CFDIExtraido[];
  metadata: SATMetadataItem[];
} {
  const contribuyentePrincipal: Contribuyente = {
    rfc: 'ATN180620AA1',
    razonSocial: 'ATENEA LOGÍSTICA & DISTRIBUCIÓN NACIONAL S.A. DE C.V.',
    regimenFiscal: '601 - General de Ley Personas Morales',
    ejercicio,
    actividadEconomica: '492310 - Autotransporte foráneo de carga y logística de última milla',
  };

  const otrosContribuyentes: Contribuyente[] = [
    contribuyentePrincipal,
    {
      rfc: 'CVI200115XX9',
      razonSocial: 'CONSTRUCTORA DEL VALLE INDUSTRIAL S.A.P.I. DE C.V.',
      regimenFiscal: '601 - General de Ley Personas Morales',
      ejercicio,
      actividadEconomica: '236111 - Edificación residencial y comercial',
    },
    {
      rfc: 'MARD850912KL3',
      razonSocial: 'DIEGO MARTÍNEZ RIVERA (ASESORÍA FISCAL)',
      regimenFiscal: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
      ejercicio,
      actividadEconomica: '541110 - Bufetes jurídicos y contables',
    },
  ];

  const contrapartes = [
    { rfc: 'PEM900101XYZ', nombre: 'COMBUSTIBLES DEL NORTE S.A. DE C.V.' },
    { rfc: 'TEL920315AA0', nombre: 'TELECOMUNICACIONES INTEGRADAS DE MÉXICO' },
    { rfc: 'ACF1904128N2', nombre: 'ACEROS Y FERRETERÍAS DEL BAJÍO' },
    { rfc: 'BMA0903117J0', nombre: 'BIENES Y MANIFACTURAS DE ANÁHUAC (EFOS 69-B)' }, // EFOS
    { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL' },
    { rfc: 'DIST891011JK2', nombre: 'DISTRIBUIDORA OCCIDENTE S.A. DE C.V.' },
  ];

  const cfdis: CFDIExtraido[] = [];
  const metadata: SATMetadataItem[] = [];

  const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  let contadorUUID = 1000;
  const genUUID = () =>
    `CFDI40-${ejercicio}-${(contadorUUID++).toString().padStart(6, '0')}-AABB-CCDD`;

  // 1. Facturas normales distribuidas en el año
  for (const m of meses) {
    const numFacturas = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numFacturas; i++) {
      const dia = (5 + i * 4).toString().padStart(2, '0');
      const uuid = genUUID();
      const contraparte = contrapartes[i % contrapartes.length]!;
      const subtotal = 12500 + i * 3200;
      const traslados = subtotal * 0.16;
      const total = subtotal + traslados;

      const fechaEmi = `${ejercicio}-${m}-${dia}T10:30:00`;
      const fechaTim = `${ejercicio}-${m}-${dia}T10:32:00`;

      cfdis.push({
        uuid,
        serie: 'A',
        folio: `${contadorUUID}`,
        fechaEmision: fechaEmi,
        fechaTimbrado: fechaTim,
        rfcEmisor: contribuyentePrincipal.rfc,
        nombreEmisor: contribuyentePrincipal.razonSocial,
        rfcReceptor: contraparte.rfc,
        nombreReceptor: contraparte.nombre,
        moneda: 'MXN',
        tipoCambio: 1,
        subtotal,
        descuento: 0,
        total,
        impuestosTrasladados: traslados,
        impuestosRetenidos: 0,
        tipoComprobante: 'I',
        clasificacion: 'EMITIDO',
        formaPago: '03', // Transferencia
        metodoPago: 'PUE',
        conceptos: [
          {
            claveProdServ: '78101802',
            descripcion: 'Servicio de flete y consolidación logística intermodal',
            cantidad: 1,
            valorUnitario: subtotal,
            importe: subtotal,
          },
        ],
        cfdiRelacionados: [],
        enMetadata: true,
        canceladoEnSAT: false,
        montoMetadata: total,
      });

      metadata.push({
        uuid,
        rfcEmisor: contribuyentePrincipal.rfc,
        nombreEmisor: contribuyentePrincipal.razonSocial,
        rfcReceptor: contraparte.rfc,
        nombreReceptor: contraparte.nombre,
        rfcPac: 'SAT970701NN3',
        fechaEmision: fechaEmi,
        fechaCertificacionSat: fechaTim,
        monto: total,
        efectoComprobante: 'I',
        estatus: '1',
      });
    }
  }

  // 2. CASO ATÍPICO: Efectivo mayor a $2,000 (Art. 27 LISR)
  const uuidEf1 = genUUID();
  cfdis.push({
    uuid: uuidEf1,
    serie: 'GAS',
    folio: '9901',
    fechaEmision: `${ejercicio}-03-14T14:15:00`,
    fechaTimbrado: `${ejercicio}-03-14T14:20:00`,
    rfcEmisor: 'PEM900101XYZ',
    nombreEmisor: 'COMBUSTIBLES DEL NORTE S.A. DE C.V.',
    rfcReceptor: contribuyentePrincipal.rfc,
    nombreReceptor: contribuyentePrincipal.razonSocial,
    moneda: 'MXN',
    tipoCambio: 1,
    subtotal: 15500,
    descuento: 0,
    total: 17980,
    impuestosTrasladados: 2480,
    impuestosRetenidos: 0,
    tipoComprobante: 'I',
    clasificacion: 'RECIBIDO',
    formaPago: '01', // Efectivo prohibido > $2000
    metodoPago: 'PUE',
    conceptos: [
      {
        claveProdServ: '15101514',
        descripcion: 'Combustible Diésel Automotriz',
        cantidad: 800,
        valorUnitario: 19.37,
        importe: 15500,
      },
    ],
    cfdiRelacionados: [],
    enMetadata: true,
    canceladoEnSAT: false,
    montoMetadata: 17980,
  });
  metadata.push({
    uuid: uuidEf1,
    rfcEmisor: 'PEM900101XYZ',
    nombreEmisor: 'COMBUSTIBLES DEL NORTE S.A. DE C.V.',
    rfcReceptor: contribuyentePrincipal.rfc,
    nombreReceptor: contribuyentePrincipal.razonSocial,
    rfcPac: 'SAT970701NN3',
    fechaEmision: `${ejercicio}-03-14T14:15:00`,
    fechaCertificacionSat: `${ejercicio}-03-14T14:20:00`,
    monto: 17980,
    efectoComprobante: 'I',
    estatus: '1',
  });

  // 3. CASO ATÍPICO: Fraccionamiento de pagos en efectivo en el mismo día
  for (let i = 1; i <= 3; i++) {
    const uuidFrac = genUUID();
    cfdis.push({
      uuid: uuidFrac,
      serie: 'FAC',
      folio: `880${i}`,
      fechaEmision: `${ejercicio}-05-20T11:0${i * 5}:00`,
      fechaTimbrado: `${ejercicio}-05-20T11:0${i * 5}:30`,
      rfcEmisor: 'ACF1904128N2',
      nombreEmisor: 'ACEROS Y FERRETERÍAS DEL BAJÍO',
      rfcReceptor: contribuyentePrincipal.rfc,
      nombreReceptor: contribuyentePrincipal.razonSocial,
      moneda: 'MXN',
      tipoCambio: 1,
      subtotal: 1650,
      descuento: 0,
      total: 1914, // < $2,000 cada una, pero suman $5,742 en el mismo día
      impuestosTrasladados: 264,
      impuestosRetenidos: 0,
      tipoComprobante: 'I',
      clasificacion: 'RECIBIDO',
      formaPago: '01',
      metodoPago: 'PUE',
      conceptos: [
        {
          claveProdServ: '30101800',
          descripcion: `Consumibles de taller lote ${i}`,
          cantidad: 1,
          valorUnitario: 1650,
          importe: 1650,
        },
      ],
      cfdiRelacionados: [],
      enMetadata: true,
      canceladoEnSAT: false,
      montoMetadata: 1914,
    });
    metadata.push({
      uuid: uuidFrac,
      rfcEmisor: 'ACF1904128N2',
      nombreEmisor: 'ACEROS Y FERRETERÍAS DEL BAJÍO',
      rfcReceptor: contribuyentePrincipal.rfc,
      nombreReceptor: contribuyentePrincipal.razonSocial,
      rfcPac: 'SAT970701NN3',
      fechaEmision: `${ejercicio}-05-20T11:0${i * 5}:00`,
      fechaCertificacionSat: `${ejercicio}-05-20T11:0${i * 5}:30`,
      monto: 1914,
      efectoComprobante: 'I',
      estatus: '1',
    });
  }

  // 4. CASO ATÍPICO: Factura cancelada en el SAT (Estatus = 0) que el contador creía viva
  const uuidCanc = genUUID();
  cfdis.push({
    uuid: uuidCanc,
    serie: 'B',
    folio: '7721',
    fechaEmision: `${ejercicio}-02-18T09:00:00`,
    fechaTimbrado: `${ejercicio}-02-18T09:05:00`,
    rfcEmisor: contribuyentePrincipal.rfc,
    nombreEmisor: contribuyentePrincipal.razonSocial,
    rfcReceptor: 'DIST891011JK2',
    nombreReceptor: 'DISTRIBUIDORA OCCIDENTE S.A. DE C.V.',
    moneda: 'MXN',
    tipoCambio: 1,
    subtotal: 85000,
    descuento: 0,
    total: 98600,
    impuestosTrasladados: 13600,
    impuestosRetenidos: 0,
    tipoComprobante: 'I',
    clasificacion: 'EMITIDO',
    formaPago: '03',
    metodoPago: 'PPD',
    conceptos: [
      {
        claveProdServ: '78101802',
        descripcion: 'Flete internacional y despacho fronterizo',
        cantidad: 1,
        valorUnitario: 85000,
        importe: 85000,
      },
    ],
    cfdiRelacionados: [],
    enMetadata: true,
    canceladoEnSAT: true, // CANCELADA
    fechaCancelacionSAT: `${ejercicio}-04-02T16:00:00`,
    montoMetadata: 98600,
  });
  metadata.push({
    uuid: uuidCanc,
    rfcEmisor: contribuyentePrincipal.rfc,
    nombreEmisor: contribuyentePrincipal.razonSocial,
    rfcReceptor: 'DIST891011JK2',
    nombreReceptor: 'DISTRIBUIDORA OCCIDENTE S.A. DE C.V.',
    rfcPac: 'SAT970701NN3',
    fechaEmision: `${ejercicio}-02-18T09:00:00`,
    fechaCertificacionSat: `${ejercicio}-02-18T09:05:00`,
    monto: 98600,
    efectoComprobante: 'I',
    estatus: '0', // Cancelado
    fechaCancelacion: `${ejercicio}-04-02T16:00:00`,
  });

  // 5. CASO ATÍPICO: Operación con EFOS de la lista 69-B
  const uuidEFOS = genUUID();
  cfdis.push({
    uuid: uuidEFOS,
    serie: 'EXP',
    folio: '104',
    fechaEmision: `${ejercicio}-06-11T12:00:00`,
    fechaTimbrado: `${ejercicio}-06-11T12:02:00`,
    rfcEmisor: 'BMA0903117J0', // EFOS definitivo
    nombreEmisor: 'BIENES Y MANIFACTURAS DE ANÁHUAC (EFOS 69-B)',
    rfcReceptor: contribuyentePrincipal.rfc,
    nombreReceptor: contribuyentePrincipal.razonSocial,
    moneda: 'MXN',
    tipoCambio: 1,
    subtotal: 120000,
    descuento: 0,
    total: 139200,
    impuestosTrasladados: 19200,
    impuestosRetenidos: 0,
    tipoComprobante: 'I',
    clasificacion: 'RECIBIDO',
    formaPago: '03',
    metodoPago: 'PUE',
    conceptos: [
      {
        claveProdServ: '80101500',
        descripcion: 'Consultoría estratégica en reingeniería de procesos',
        cantidad: 1,
        valorUnitario: 120000,
        importe: 120000,
      },
    ],
    cfdiRelacionados: [],
    enMetadata: true,
    canceladoEnSAT: false,
    montoMetadata: 139200,
  });
  metadata.push({
    uuid: uuidEFOS,
    rfcEmisor: 'BMA0903117J0',
    nombreEmisor: 'BIENES Y MANIFACTURAS DE ANÁHUAC (EFOS 69-B)',
    rfcReceptor: contribuyentePrincipal.rfc,
    nombreReceptor: contribuyentePrincipal.razonSocial,
    rfcPac: 'SAT970701NN3',
    fechaEmision: `${ejercicio}-06-11T12:00:00`,
    fechaCertificacionSat: `${ejercicio}-06-11T12:02:00`,
    monto: 139200,
    efectoComprobante: 'I',
    estatus: '1',
  });

  // 6. CASO ATÍPICO: Desfase de timbrado > 72 horas (violación Art. 39 RCFF)
  const uuidDesfase = genUUID();
  cfdis.push({
    uuid: uuidDesfase,
    serie: 'A',
    folio: '4502',
    fechaEmision: `${ejercicio}-08-01T08:00:00`,
    fechaTimbrado: `${ejercicio}-08-06T15:30:00`, // 5 días después (>120 hrs)
    rfcEmisor: contribuyentePrincipal.rfc,
    nombreEmisor: contribuyentePrincipal.razonSocial,
    rfcReceptor: 'TEL920315AA0',
    nombreReceptor: 'TELECOMUNICACIONES INTEGRADAS DE MÉXICO',
    moneda: 'MXN',
    tipoCambio: 1,
    subtotal: 45000,
    descuento: 0,
    total: 52200,
    impuestosTrasladados: 7200,
    impuestosRetenidos: 0,
    tipoComprobante: 'I',
    clasificacion: 'EMITIDO',
    formaPago: '03',
    metodoPago: 'PUE',
    conceptos: [
      {
        claveProdServ: '78101802',
        descripcion: 'Transporte de equipos y enlaces satelitales',
        cantidad: 1,
        valorUnitario: 45000,
        importe: 45000,
      },
    ],
    cfdiRelacionados: [],
    enMetadata: true,
    canceladoEnSAT: false,
    montoMetadata: 52200,
  });
  metadata.push({
    uuid: uuidDesfase,
    rfcEmisor: contribuyentePrincipal.rfc,
    nombreEmisor: contribuyentePrincipal.razonSocial,
    rfcReceptor: 'TEL920315AA0',
    nombreReceptor: 'TELECOMUNICACIONES INTEGRADAS DE MÉXICO',
    rfcPac: 'SAT970701NN3',
    fechaEmision: `${ejercicio}-08-01T08:00:00`,
    fechaCertificacionSat: `${ejercicio}-08-06T15:30:00`,
    monto: 52200,
    efectoComprobante: 'I',
    estatus: '1',
  });

  return {
    contribuyente: contribuyentePrincipal,
    otrosContribuyentes,
    cfdis,
    metadata,
  };
}
