// src/data/conductas-cobranza.ts

export type RiesgoCobranza =
  | 'BAJO'
  | 'MEDIO'
  | 'ALTO'
  | 'CRITICO';

export type SeccionCobranzaId =
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII';

export type FuenteRegistros =
  | 'conductas'
  | 'comparadores';

export interface SeccionCobranza {
  id: SeccionCobranzaId;
  titulo: string;
  rango: string;
  descripcion: string;
  fuente: FuenteRegistros;
}

export interface ConductaCobranza {
  id: string;
  seccion: SeccionCobranzaId;
  titulo: string;
  descripcion: string;
  fundamento: string;
  riesgo: RiesgoCobranza;
}

export const RIESGOS_COBRANZA: readonly RiesgoCobranza[] = [
  'BAJO',
  'MEDIO',
  'ALTO',
  'CRITICO',
];

export const PESO_RIESGO: Record<RiesgoCobranza, number> = {
  BAJO: 1,
  MEDIO: 3,
  ALTO: 5,
  CRITICO: 10,
};

export const SECCIONES_COBRANZA: SeccionCobranza[] = [
  {
    id: 'I',
    titulo: 'Identidad y estructura legal',
    rango: '1.1-1.7',
    descripcion:
      'Razón social, representación legal, registros oficiales y suplantación de identidad.',
    fuente: 'conductas',
  },
  {
    id: 'II',
    titulo: 'Cobranza y acoso',
    rango: '2.1-2.9',
    descripcion:
      'Prácticas de cobranza, hostigamiento, horarios, lenguaje y contacto con terceros.',
    fuente: 'conductas',
  },
  {
    id: 'III',
    titulo: 'Smishing y fraude',
    rango: '3.1-3.7',
    descripcion:
      'Enlaces apócrifos, suplantación digital, QR no trazables y fraudes electrónicos.',
    fuente: 'conductas',
  },
  {
    id: 'IV',
    titulo: 'Ciclo deuda-extorsión',
    rango: '4.1-4.7',
    descripcion:
      'Refinanciamiento forzado, intereses no pactados, cobros indebidos y extorsión.',
    fuente: 'conductas',
  },
  {
    id: 'V',
    titulo: 'Operativos judiciales',
    rango: '5.1-5.3',
    descripcion:
      'Falsos embargos, órdenes judiciales simuladas y diligencias sin autoridad.',
    fuente: 'conductas',
  },
  {
    id: 'VI',
    titulo: 'Estructura financiera',
    rango: '6.1-6.4',
    descripcion:
      'CLABE, beneficiarios, CFDI, desvío de fondos e intermediarios sin registro.',
    fuente: 'conductas',
  },
  {
    id: 'VII',
    titulo: 'Contradicciones',
    rango: '7.1-7.6',
    descripcion:
      'Inconsistencias entre publicidad, contrato, CRM y operación real.',
    fuente: 'conductas',
  },
  {
    id: 'VIII',
    titulo: 'Contrato vs CRM — Eje de gravedad',
    rango: '8.1-8.12',
    descripcion:
      'Comparadores entre contrato y CRM. Se detalla en comparadores-contrato-crm.ts.',
    fuente: 'comparadores',
  },
];

export const CONDUCTAS_COBRANZA: ConductaCobranza[] = [
  // =====================================================
  // I. IDENTIDAD Y ESTRUCTURA LEGAL
  // =====================================================
  {
    id: '1.1',
    seccion: 'I',
    titulo: 'Usurpación de identidad corporativa',
    descripcion:
      'Mensajes de cobranza sin razón social registrada o identificable ante autoridad.',
    fundamento: 'Art. 112 Bis LFPC',
    riesgo: 'CRITICO',
  },
  {
    id: '1.2',
    seccion: 'I',
    titulo: 'Representación sin poder legal',
    descripcion:
      'Cobrador o gestor que se ostenta como abogado sin cédula o facultades.',
    fundamento: 'Art. 250 CP; Art. 112 LFPC',
    riesgo: 'CRITICO',
  },
  {
    id: '1.3',
    seccion: 'I',
    titulo: 'Nombre comercial distinto a razón social',
    descripcion:
      'La publicidad usa un nombre comercial, pero el contrato corresponde a otra persona moral.',
    fundamento: 'Art. 32 LFPC',
    riesgo: 'ALTO',
  },
  {
    id: '1.4',
    seccion: 'I',
    titulo: 'Sin registro REDECO',
    descripcion:
      'Despacho de cobranza no registrado ante CONDUSEF cuando corresponde.',
    fundamento: 'Art. 17 Bis CONDUSEF',
    riesgo: 'CRITICO',
  },
  {
    id: '1.5',
    seccion: 'I',
    titulo: 'Uso indebido de logotipos oficiales',
    descripcion:
      'Mensajes con logos tipo gobierno, juzgado o autoridad para intimidar.',
    fundamento: 'Art. 386 Fraude',
    riesgo: 'CRITICO',
  },
  {
    id: '1.6',
    seccion: 'I',
    titulo: 'Suplantación de funcionario',
    descripcion:
      'Se hace pasar por actuario, juez, autoridad o funcionario inexistente.',
    fundamento: 'Art. 178 Bis CP',
    riesgo: 'CRITICO',
  },
  {
    id: '1.7',
    seccion: 'I',
    titulo: 'Domicilio fiscal fantasma',
    descripcion:
      'Dirección de cobranza no verificable o domicilio inconsistente.',
    fundamento: 'Art. 110 CFF',
    riesgo: 'MEDIO',
  },

  // =====================================================
  // II. COBRANZA Y ACOSO
  // =====================================================
  {
    id: '2.1',
    seccion: 'II',
    titulo: 'Amenaza fuera de proceso',
    descripcion:
      'Amenaza de embargo, demanda o acción legal sin juicio ni procedimiento válido.',
    fundamento: 'Art. 284 Bis CP - Amenazas',
    riesgo: 'CRITICO',
  },
  {
    id: '2.2',
    seccion: 'II',
    titulo: 'Contacto a referencias con dolo',
    descripcion:
      'Llamar a familiares, contactos o referencias para avergonzar o presionar.',
    fundamento: 'Art. 16 Constitucional; NOM-184',
    riesgo: 'CRITICO',
  },
  {
    id: '2.3',
    seccion: 'II',
    titulo: 'Hostigamiento continuo',
    descripcion:
      'Más impactos de cobranza de los permitidos en un periodo corto al mismo deudor.',
    fundamento: 'Art. 284 Bis - Acoso',
    riesgo: 'CRITICO',
  },
  {
    id: '2.4',
    seccion: 'II',
    titulo: 'Horario prohibido',
    descripcion:
      'Contacto fuera del horario permitido, por ejemplo fuera de 08:00-22:00.',
    fundamento: 'NOM-184 SCFI',
    riesgo: 'ALTO',
  },
  {
    id: '2.5',
    seccion: 'II',
    titulo: 'Lenguaje denigrante',
    descripcion:
      'Insultos, amenazas, humillaciones o trato degradante al deudor.',
    fundamento: 'Art. 259 Bis Acoso',
    riesgo: 'ALTO',
  },
  {
    id: '2.6',
    seccion: 'II',
    titulo: 'Falsos abogados en llamada',
    descripcion:
      'Plantillas donde supuestos licenciados o jurídicos inexistentes exigen pago.',
    fundamento: 'Art. 250 CP',
    riesgo: 'CRITICO',
  },
  {
    id: '2.7',
    seccion: 'II',
    titulo: 'Grabación sin consentimiento',
    descripcion:
      'CRM o call center graba conversaciones sin aviso de privacidad o consentimiento.',
    fundamento: 'LFPDPPP Art. 16',
    riesgo: 'MEDIO',
  },
  {
    id: '2.8',
    seccion: 'II',
    titulo: 'Desfase CRM vs realidad en llamadas registradas',
    descripcion:
      'El agente reporta menos intentos de los detectados por el sistema; evidencia de mala fe.',
    fundamento: 'Art. 284 Bis; Art. 386 Fraude procesal',
    riesgo: 'CRITICO',
  },
  {
    id: '2.9',
    seccion: 'II',
    titulo: 'Mensajes anónimos de cobranza',
    descripcion:
      'Cobranza desde número privado o sin identificación del acreedor o despacho.',
    fundamento: 'Art. 16 LFPC',
    riesgo: 'ALTO',
  },

  // =====================================================
  // III. SMISHING Y FRAUDE
  // =====================================================
  {
    id: '3.1',
    seccion: 'III',
    titulo: 'Enlace de pago apócrifo o dominio parecido',
    descripcion:
      'SMS o mensaje con link falso, typo o dominio similar para capturar datos o pagos.',
    fundamento: 'Art. 386 Fraude; Art. 211 Bis',
    riesgo: 'CRITICO',
  },
  {
    id: '3.2',
    seccion: 'III',
    titulo: 'QR de pago no trazable',
    descripcion:
      'Código QR o SPEI a cuenta física sin CLABE institucional del contrato.',
    fundamento: 'Art. 400 Bis - Lavado',
    riesgo: 'CRITICO',
  },
  {
    id: '3.3',
    seccion: 'III',
    titulo: 'WhatsApp con logo falso',
    descripcion:
      'Perfil de mensajería con escudos, logos oficiales o identidad falsa.',
    fundamento: 'Art. 386; Art. 211',
    riesgo: 'ALTO',
  },
  {
    id: '3.4',
    seccion: 'III',
    titulo: 'Cobro con intimidación digital',
    descripcion:
      'Uso de fotos, INE, documentos o imágenes para amenazar con difusión.',
    fundamento: 'Ley Olimpia Art. 199',
    riesgo: 'CRITICO',
  },
  {
    id: '3.5',
    seccion: 'III',
    titulo: 'Suplantación de CONDUSEF',
    descripcion:
      'Contacto falso a nombre de CONDUSEF u otra autoridad para cobrar.',
    fundamento: 'Art. 172 Bis',
    riesgo: 'CRITICO',
  },
  {
    id: '3.6',
    seccion: 'III',
    titulo: 'Deepfake de voz',
    descripcion:
      'Audio sintético o manipulado para simular la voz del titular o autoridad.',
    fundamento: 'Art. 211 Bis; LFPDPPP',
    riesgo: 'CRITICO',
  },
  {
    id: '3.7',
    seccion: 'III',
    titulo: 'Link acortado sin dominio propio',
    descripcion:
      'Uso de acortadores genéricos sin dominio verificable de la entidad financiera.',
    fundamento: 'NOM-184; LFPC',
    riesgo: 'MEDIO',
  },

  // =====================================================
  // IV. CICLO DEUDA-EXTORSIÓN
  // =====================================================
  {
    id: '4.1',
    seccion: 'IV',
    titulo: 'Refinanciamiento forzado',
    descripcion:
      'Condicionar o presionar a refinanciar bajo amenaza de incremento de deuda.',
    fundamento: 'Art. 17 LFPC - Prácticas abusivas',
    riesgo: 'ALTO',
  },
  {
    id: '4.2',
    seccion: 'IV',
    titulo: 'Interés sobre interés no pactado',
    descripcion:
      'Capitalización de intereses no firmada o no informada.',
    fundamento: 'Art. 23 LCTC',
    riesgo: 'CRITICO',
  },
  {
    id: '4.3',
    seccion: 'IV',
    titulo: 'Cobro de lo indebido',
    descripcion:
      'Cargo por gestión inexistente, comisión no pactada o concepto no reconocido.',
    fundamento: 'Art. 386 Fraude',
    riesgo: 'CRITICO',
  },
  {
    id: '4.4',
    seccion: 'IV',
    titulo: 'Extorsión por contactos',
    descripcion:
      'Amenaza de difundir o contactar a referencias para presionar pago.',
    fundamento: 'Art. 390 Extorsión',
    riesgo: 'CRITICO',
  },
  {
    id: '4.5',
    seccion: 'IV',
    titulo: 'Préstamo espejo',
    descripcion:
      'Ofrecer otro crédito para pagar el actual sin informar riesgos o condiciones.',
    fundamento: 'Art. 72 LFPC',
    riesgo: 'ALTO',
  },
  {
    id: '4.6',
    seccion: 'IV',
    titulo: 'Retención de documentos',
    descripcion:
      'No entregar pagaré, contrato, finiquito o comprobante aunque se liquide.',
    fundamento: 'Art. 17 LFPC',
    riesgo: 'MEDIO',
  },
  {
    id: '4.7',
    seccion: 'IV',
    titulo: 'Venta de deuda sin aviso',
    descripcion:
      'Cesión de cartera a despacho sin notificación al deudor.',
    fundamento: 'Art. 2035 Código Civil',
    riesgo: 'ALTO',
  },

  // =====================================================
  // V. OPERATIVOS JUDICIALES
  // =====================================================
  {
    id: '5.1',
    seccion: 'V',
    titulo: 'Falso embargo sin juicio',
    descripcion:
      'Notificación de embargo extrajudicial sin mandamiento judicial válido.',
    fundamento: 'Art. 284 Bis; Art. 16 Constitucional',
    riesgo: 'CRITICO',
  },
  {
    id: '5.2',
    seccion: 'V',
    titulo: 'Simulación de orden judicial',
    descripcion:
      'PDF, oficio o sello falso de juzgado para intimidar.',
    fundamento: 'Art. 386 Fraude procesal',
    riesgo: 'CRITICO',
  },
  {
    id: '5.3',
    seccion: 'V',
    titulo: 'Diligencia sin actuario',
    descripcion:
      'Visita domiciliaria con documentos no oficiales y sin actuario competente.',
    fundamento: 'Art. 1172 CPC; Art. 178',
    riesgo: 'CRITICO',
  },

  // =====================================================
  // VI. ESTRUCTURA FINANCIERA
  // =====================================================
  {
    id: '6.1',
    seccion: 'VI',
    titulo: 'CLABE no coincide con contrato',
    descripcion:
      'SPEI a cuenta distinta de la pactada, generalmente persona física.',
    fundamento: 'Art. 400 Bis; Art. 112 LFPC',
    riesgo: 'CRITICO',
  },
  {
    id: '6.2',
    seccion: 'VI',
    titulo: 'Sin comprobante CFDI',
    descripcion:
      'Recibe pago sin emitir recibo, factura o comprobante deducible.',
    fundamento: 'Art. 29 CFF',
    riesgo: 'MEDIO',
  },
  {
    id: '6.3',
    seccion: 'VI',
    titulo: 'Desvío a wallet cripto',
    descripcion:
      'Solicitar pago en USDT, criptoactivos o wallets no contratadas.',
    fundamento: 'Art. 400 Bis',
    riesgo: 'CRITICO',
  },
  {
    id: '6.4',
    seccion: 'VI',
    titulo: 'Intermediario sin registro',
    descripcion:
      'Cobrador o intermediario recibe en cuenta personal sin facultades.',
    fundamento: 'Art. 111 Bis',
    riesgo: 'ALTO',
  },

  // =====================================================
  // VII. CONTRADICCIONES
  // =====================================================
  {
    id: '7.1',
    seccion: 'VII',
    titulo: 'Contradicción en monto original',
    descripcion:
      'Publicidad o landing ofrece un monto, pero contrato registra otro.',
    fundamento: 'Art. 386 Fraude; Art. 32 LFPC',
    riesgo: 'CRITICO',
  },
  {
    id: '7.2',
    seccion: 'VII',
    titulo: 'Tasa engañosa',
    descripcion:
      'Publicidad anuncia tasa baja o cero, pero CAT o contrato revela tasa real mayor.',
    fundamento: 'Art. 32 LFPC Publicidad engañosa',
    riesgo: 'CRITICO',
  },
  {
    id: '7.3',
    seccion: 'VII',
    titulo: 'Plazo fantasma',
    descripcion:
      'Ofrece un plazo, pero el CRM o la operación exige otro menor.',
    fundamento: 'Art. 69 LFPC',
    riesgo: 'ALTO',
  },
  {
    id: '7.4',
    seccion: 'VII',
    titulo: 'Aval no informado',
    descripcion:
      'Usa contactos como aval o referencia obligada sin firma ni consentimiento.',
    fundamento: 'Art. 16 Constitucional; LFPDPPP',
    riesgo: 'CRITICO',
  },
  {
    id: '7.5',
    seccion: 'VII',
    titulo: 'Penalización no pactada',
    descripcion:
      'Cargo diario o penalización por mora no prevista en contrato.',
    fundamento: 'Art. 17 LFPC',
    riesgo: 'ALTO',
  },
  {
    id: '7.6',
    seccion: 'VII',
    titulo: 'Promesa de borrado de Buró',
    descripcion:
      'Ofrecer borrado de Buró a cambio de pago adicional sin fundamento.',
    fundamento: 'Art. 386; Ley Buró',
    riesgo: 'CRITICO',
  },
];
