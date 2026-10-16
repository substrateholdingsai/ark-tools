// src/data/comparadores-contrato-crm.ts

import type { RiesgoCobranza } from './conductas-cobranza';

export const ESTADOS_COMPARADOR = [
  'COINCIDE',
  'DIFIERE',
  'PARCIAL',
  'NO_VERIFICABLE',
  'SIN_DATO',
] as const;

export type EstadoComparador =
  (typeof ESTADOS_COMPARADOR)[number];

export interface ComparadorContratoCRM {
  id: string;
  codigo: string;
  seccion: 'VIII';
  campo: string;
  pregunta: string;
  contrato: string;
  crm: string;
  riesgo: RiesgoCobranza;
  fundamento: string;
  impactoContable: string;
  recomendacion: string;
  evidenciaSugerida: string[];
}

export const COMPARADORES_CONTRATO_CRM: ComparadorContratoCRM[] = [
  {
    id: '8.1',
    codigo: 'CC-8.1',
    seccion: 'VIII',
    campo: 'Monto principal',
    pregunta:
      '¿El monto exigido por el CRM coincide con el monto firmado en contrato?',
    contrato: 'Monto original financiado o contratado.',
    crm: 'Saldo o monto exigido por el sistema de cobranza.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 386 Código Penal; LFPC',
    impactoContable:
      'Inflación artificial de deuda; posible cobro indebido y reconocimiento incorrecto de ingresos.',
    recomendacion:
      'Conciliar contrato, pagos aplicados y saldo exigido antes de continuar la gestión.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Estado de cuenta del crédito',
      'Registros del CRM',
      'Pagos aplicados',
    ],
  },
  {
    id: '8.2',
    codigo: 'CC-8.2',
    seccion: 'VIII',
    campo: 'Tasa o interés pactado',
    pregunta:
      '¿La tasa aplicada por el CRM coincide con la tasa pactada en contrato?',
    contrato: 'Tasa ordinaria, moratoria y método de cálculo.',
    crm: 'Tasa registrada o aplicada en el sistema de cobranza.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 23 LCTC; LFPC',
    impactoContable:
      'Intereses no pactados o capitalización indebida; gasto financiero incorrecto.',
    recomendacion:
      'Recalcular intereses con tasa contractual y tabla de amortización.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Tabla de amortización',
      'Cálculo de intereses del CRM',
      'Pagos aplicados',
    ],
  },
  {
    id: '8.3',
    codigo: 'CC-8.3',
    seccion: 'VIII',
    campo: 'Fecha de vencimiento o plazo',
    pregunta:
      '¿La fecha de vencimiento del CRM coincide con el plazo contractual?',
    contrato: 'Plazo, calendario de pagos y fecha de vencimiento.',
    crm: 'Fecha de vencimiento o exigibilidad registrada.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 386 Código Penal; LFPC',
    impactoContable:
      'Acortamiento artificial de plazo para forzar mora y generar cargos.',
    recomendacion:
      'Validar fecha de vencimiento contractual contra el CRM y los estados de cuenta.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Calendario de pagos',
      'Estado de cuenta',
      'Registro del CRM',
    ],
  },
  {
    id: '8.4',
    codigo: 'CC-8.4',
    seccion: 'VIII',
    campo: 'Plataforma o cuenta de pago',
    pregunta:
      '¿La cuenta o plataforma de pago del CRM coincide con la pactada en contrato?',
    contrato: 'CLABE, SPEI, cuenta institucional o medio de pago autorizado.',
    crm: 'Cuenta, QR, OXXO o plataforma registrada para cobrar.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 400 Bis; LFPC',
    impactoContable:
      'Desvío de fondos, riesgo PLD y pagos no acreditables al acreedor correcto.',
    recomendacion:
      'Confirmar que la cuenta receptora sea institucional y esté en contrato.',
    evidenciaSugerida: [
      'Contrato firmado',
      'CLABE institucional',
      'Comprobantes de pago',
      'Instrucciones de pago del CRM',
    ],
  },
  {
    id: '8.5',
    codigo: 'CC-8.5',
    seccion: 'VIII',
    campo: 'Beneficiario del pago',
    pregunta:
      '¿El beneficiario registrado en CRM coincide con el beneficiario contractual?',
    contrato: 'Acreedor, razón social o beneficiario autorizado.',
    crm: 'Nombre del beneficiario registrado para recibir pago.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 111 Bis; Art. 400 Bis',
    impactoContable:
      'Cobro a persona física o cuenta no facultada; posible desvío de recursos.',
    recomendacion:
      'Validar beneficiario contra contrato, RFC y facturación.',
    evidenciaSugerida: [
      'Contrato firmado',
      'RFC del acreedor',
      'Factura o CFDI',
      'Registro del beneficiario en CRM',
    ],
  },
  {
    id: '8.6',
    codigo: 'CC-8.6',
    seccion: 'VIII',
    campo: 'Consentimiento y aviso de privacidad',
    pregunta:
      '¿El CRM conserva evidencia del consentimiento y aviso de privacidad?',
    contrato: 'Consentimiento firmado o aceptación electrónica.',
    crm: 'Registro de consentimiento, fecha y versión del aviso.',
    riesgo: 'ALTO',
    fundamento: 'LFPDPPP Art. 16',
    impactoContable:
      'Tratamiento de datos sin base legal; contingencia administrativa y reputacional.',
    recomendacion:
      'Verificar consentimiento expreso, fecha y versión del aviso de privacidad.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Aviso de privacidad',
      'Registro de consentimiento',
      'Log de aceptación electrónica',
    ],
  },
  {
    id: '8.7',
    codigo: 'CC-8.7',
    seccion: 'VIII',
    campo: 'Llamadas registradas',
    pregunta:
      '¿Las llamadas registradas en CRM coinciden con la bitácora real de contacto?',
    contrato: 'Límites de contacto y obligaciones de cobranza.',
    crm: 'Llamadas reportadas por agente o sistema.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 284 Bis; NOM-184',
    impactoContable:
      'Falsedad de registros; violación de límites de contacto, horario y posibles contingencias penales.',
    recomendacion:
      'Cruzar bitácora telefónica, grabaciones y registros del CRM.',
    evidenciaSugerida: [
      'Bitácora telefónica',
      'Grabaciones',
      'Registros del CRM',
      'Reportes de gestión',
    ],
  },
  {
    id: '8.8',
    codigo: 'CC-8.8',
    seccion: 'VIII',
    campo: 'Pagos aplicados',
    pregunta:
      '¿Los pagos recibidos están correctamente aplicados en el CRM?',
    contrato: 'Monto, forma de pago y aplicación pactada.',
    crm: 'Aplicación de pagos, saldo y amortización.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 386 Código Penal; Art. 17 LFPC',
    impactoContable:
      'Pago no aplicado; saldo sobreestimado y posible fraude.',
    recomendacion:
      'Conciliar depósitos bancarios contra amortización en CRM.',
    evidenciaSugerida: [
      'Comprobantes de pago',
      'Estado de cuenta bancario',
      'Estado de cuenta del crédito',
      'Registros del CRM',
    ],
  },
  {
    id: '8.9',
    codigo: 'CC-8.9',
    seccion: 'VIII',
    campo: 'Aval, obligado solidario o contactos',
    pregunta:
      '¿El CRM usa avales o contactos que no están pactados en contrato?',
    contrato: 'Aval, obligado solidario o referencias autorizadas.',
    crm: 'Contactos usados para cobranza o presión.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 16 Constitucional; LFPDPPP',
    impactoContable:
      'Aval fantasma y uso indebido de datos personales.',
    recomendacion:
      'Confirmar avales firmados y consentimiento de contactos.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Pagaré o anexo de aval',
      'Consentimiento de contactos',
      'Registro de contactos en CRM',
    ],
  },
  {
    id: '8.10',
    codigo: 'CC-8.10',
    seccion: 'VIII',
    campo: 'CAT y publicidad',
    pregunta:
      '¿El CAT contratado coincide con el CAT anunciado en publicidad?',
    contrato: 'CAT, tasa y costos totales contratados.',
    crm: 'CAT, tasa o costos usados en gestión o publicidad.',
    riesgo: 'ALTO',
    fundamento: 'Art. 32 LFPC',
    impactoContable:
      'Publicidad engañosa; riesgo ante CONDUSEF y contingencias comerciales.',
    recomendacion:
      'Comparar CAT contratado con publicidad, landing y registros del CRM.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Publicidad o landing',
      'Cálculo del CAT',
      'Registros del CRM',
    ],
  },
  {
    id: '8.11',
    codigo: 'CC-8.11',
    seccion: 'VIII',
    campo: 'Comisión de apertura',
    pregunta:
      '¿La comisión de apertura cobrada coincide con la pactada?',
    contrato: 'Comisión de apertura pactada.',
    crm: 'Comisión registrada o cobrada.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 17 LFPC; Art. 386 Código Penal',
    impactoContable:
      'Cargo no pactado; ingreso improcedente y posible reclamación.',
    recomendacion:
      'Validar comisión de apertura contra contrato, recibos y CFDI.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Recibos de comisión',
      'CFDI',
      'Registro del CRM',
    ],
  },
  {
    id: '8.12',
    codigo: 'CC-8.12',
    seccion: 'VIII',
    campo: 'Penalización o cargo por gestión',
    pregunta:
      '¿Las penalizaciones o cargos por gestión coinciden con lo pactado?',
    contrato: 'Penalizaciones, gastos de cobranza o cargos autorizados.',
    crm: 'Penalizaciones o cargos registrados.',
    riesgo: 'CRITICO',
    fundamento: 'Art. 72 LFPC',
    impactoContable:
      'Penalizaciones o gestión extrajudicial no pactada.',
    recomendacion:
      'Verificar conceptos de penalización y soporte contractual.',
    evidenciaSugerida: [
      'Contrato firmado',
      'Registro de penalizaciones',
      'Comprobantes de cargo',
      'Registros del CRM',
    ],
  },
];
