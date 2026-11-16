/**
 * ARK LEDGER — WhatsApp Studio Engine (CRM Outbound "Cero Costo" & Deep-Linking)
 *
 * Provee:
 * 1. Normalización E.164 de teléfonos mexicanos y extracción inversa de enlaces wa.me / api.whatsapp.com.
 * 2. Inferencia inteligente de Tenant/Remitente (Ark Financial Technologies vs CANACO SERVYTUR Mérida).
 * 3. Compilación de plantillas dinámicas con variables en tiempo real ({NOMBRE}, {DESPACHO}, {CIUDAD}, etc.).
 * 4. Construcción de deep links https://wa.me/... con mensaje codificado URI.
 */

export type WhatsAppTenantKey = 'ark' | 'canaco_merida';

export interface WhatsAppTenantConfig {
  key: WhatsAppTenantKey;
  label: string;
  badge: string;
  defaultSender: string;
  defaultSenderPhone: string;
  defaultRole: string;
}

export interface WhatsAppTemplate {
  id: string;
  tenant: WhatsAppTenantKey;
  name: string;
  category: string;
  description: string;
  body: string;
}

export interface WhatsAppTemplateVars {
  NOMBRE: string;
  DESPACHO: string;
  ESPECIALIDAD: string;
  CIUDAD: string;
  REMITENTE: string;
  TEL_REMITENTE: string;
  FECHA: string;
  FOLIO: string;
}

export interface LeadWhatsAppContext {
  id?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  ciudad?: string | null;
  especialidad?: string | null;
  status?: string | null;
  contacto_nombre?: string | null;
  notas?: string | null;
  tenant_id?: string | null;
}

export const WS_TENANT_CONFIGS: Record<WhatsAppTenantKey, WhatsAppTenantConfig> = {
  ark: {
    key: 'ark',
    label: 'Ark Financial Technologies',
    badge: 'Plan Corporate Firm · Marca Blanca',
    defaultSender: 'Pavel Cortés',
    defaultSenderPhone: '+52 56 5706 2511',
    defaultRole: 'Infraestructura Fiscal & IA · Ark Systems',
  },
  canaco_merida: {
    key: 'canaco_merida',
    label: 'CANACO SERVYTUR Mérida',
    badge: 'Ventanilla Cameral & Padrón SIEM',
    defaultSender: 'Coordinación de Afiliación CANACO',
    defaultSenderPhone: '+52 999 942 8850',
    defaultRole: 'Servicios Fiscales al Comercio · CANACO Mérida',
  },
};

export const WS_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'ark_marca_blanca',
    tenant: 'ark',
    name: 'Plan Corporate Firm (Marca Blanca + IA)',
    category: 'Infraestructura',
    description: 'Despliegue dedicado con las 22 herramientas fiscales, Papeles SHA-256 y Noah IA.',
    body: `Hola *{NOMBRE}*, ¿qué tal? Te saluda *{REMITENTE}* de *Ark Financial Technologies*.

Vimos la trayectoria de *{DESPACHO}* en *{CIUDAD}* ({ESPECIALIDAD}) y quería compartirte cómo estamos instalando infraestructura fiscal propia para firmas líderes.

En lugar de licencias genéricas, desplegamos nuestro motor con *22 herramientas fiscales/laborales*, *Cédulas PDF con Sello SHA-256 + QR* y *Noah (Agente IA fiscal privado)* directamente bajo el dominio y logotipo de tu despacho (100% deducible).

¿Tienes 10 minutos esta semana para mostrarte una demo en vivo de cómo se vería con la marca de *{DESPACHO}*?

Quedo atento en este chat ({TEL_REMITENTE}). ¡Saludos!`,
  },
  {
    id: 'ark_forense_cfdi',
    tenant: 'ark',
    name: 'Auditoría Forense CFDI (#20) & Anexo 24',
    category: 'Auditoría SAT',
    description:
      'Enfoque técnico: Ley de Benford, Z-Score, cruce EFOS 69-B y conciliación masiva XML.',
    body: `Hola *{NOMBRE}*, buen día. Soy *{REMITENTE}* de *Ark Systems*.

Sabemos que en *{DESPACHO}* la revisión preventiva de CFDI 4.0 y cierres mensuales demanda horas críticas de equipo.

Desarrollamos para despachos en *{CIUDAD}* el *Detector Forense de Atípicos CFDI* y conciliador *Anexo 24 Cero-Captura*: procesa miles de XML en segundos directo en el navegador (Ley de Benford, Z-Score mensual, fraccionamiento de efectivo Art. 27 LISR y cruce EFOS 69-B) emitiendo Dictamen Pericial con Sello SHA-256 (Folio ref: *{FOLIO}*).

¿Te gustaría probarlo sin costo con un lote de XML de tu firma?`,
  },
  {
    id: 'ark_crypto_lfpiorpi',
    tenant: 'ark',
    name: 'Cumplimiento LFPIORPI (#17) & Activos Virtuales',
    category: 'Compliance PLD',
    description: 'Especial para firmas Crypto, Abogados o sujetas a Actividades Vulnerables.',
    body: `Hola *{NOMBRE}*, te escribe *{REMITENTE}* de *Ark Financial Technologies*.

Notamos que en *{DESPACHO}* atienden operaciones especializadas ({ESPECIALIDAD}) en *{CIUDAD}*.

Construimos un motor determinista de cumplimiento *Art. 17 LFPIORPI (Antilavado)* con cálculo automático de ventana móvil de 6 meses en UMAs vigentes, semáforo de avisos e integración con nuestra matriz de *Activos Virtuales* y Bóveda Offline Criptográfica (Art. 30 CFF).

¿Coordinamos una llamada breve de 10 min para enseñarte el Papel de Trabajo Pericial?`,
  },
  {
    id: 'ark_seguimiento_mail',
    tenant: 'ark',
    name: 'Seguimiento Ejecutivo a Propuesta Enviada',
    category: 'Seguimiento',
    description:
      'Ideal para prospectos que ya recibieron el correo institucional vía Resend (Mail_enviado).',
    body: `Hola *{NOMBRE}*, ¿cómo estás? Te escribe *{REMITENTE}* de *Ark Systems*.

Te escribo rápido por aquí para confirmar si tuviste oportunidad de revisar la propuesta de *Infraestructura Fiscal Marca Blanca + IA* que enviamos al correo de *{DESPACHO}*.

Si te parece bien, podemos agendar una breve sesión de 15 minutos para mostrarte en vivo las 22 herramientas y el sellado criptográfico SHA-256 operando con tu marca.

¿Qué día te queda mejor esta semana?`,
  },
  {
    id: 'canaco_boveda_fiscal',
    tenant: 'canaco_merida',
    name: 'Activación Suite Fiscal CANACO Mérida',
    category: 'Afiliación Cameral',
    description: 'Invitación institucional para comercios y despachos afiliados a CANACO SERVYTUR.',
    body: `Estimado(a) *{NOMBRE}* (*{DESPACHO}*), le saludamos de *{REMITENTE}* en *CANACO SERVYTUR Mérida*.

Le informamos que ya se encuentra disponible nuestra plataforma institucional con *12 herramientas de cumplimiento fiscal, laboral y timbrado CFDI 4.0*, además del nuevo *Buzón Documental Físico-Digital* para socios en *{CIUDAD}*.

¿Desea que le compartamos su acceso directo o agendemos una breve orientación de 10 minutos? (Folio de atención: *{FOLIO}*).`,
  },
  {
    id: 'canaco_refrendo_siem',
    tenant: 'canaco_merida',
    name: 'Refrendo de Padrón & Cédula Oficial QR',
    category: 'Padrón SIEM',
    description: 'Seguimiento de refrendo anual con entrega de Cédula Oficial verificable con QR.',
    body: `Hola *{NOMBRE}*, le contactamos de *{REMITENTE}* (*CANACO SERVYTUR Mérida*) con fecha *{FECHA}*.

En seguimiento al expediente comercial de *{DESPACHO}* en *{CIUDAD}*, queremos apoyarle con la emisión inmediata de su *Cédula Oficial de Afiliación con Sello SHA-256 y QR de Verificación Pública* (Folio *{FOLIO}*).

Puede responder a este mensaje o comunicarse al {TEL_REMITENTE} para concluir su trámite en un clic.`,
  },
];

/**
 * Extrae el primer enlace wa.me o api.whatsapp.com/send de un bloque de texto o HTML.
 */
export function extractWhatsAppFromHtml(htmlOrText: string | null | undefined): string | null {
  if (!htmlOrText) return null;
  const regex = /(?:wa\.me\/|api\.whatsapp\.com\/send\?[^"'\s>]*phone=)\+?(\d{10,13})/i;
  const match = htmlOrText.match(regex);
  if (!match || !match[1]) return null;
  return normalizeMexicanPhone(match[1]);
}

/**
 * Normaliza un teléfono mexicano o cadena con enlace wa.me para su uso en deep links de WhatsApp.
 * - Si recibe un URL wa.me/... o api.whatsapp.com/..., extrae el número primero.
 * - Si tiene 10 dígitos nacionales (ej. 9991234567), antepone "52" -> "529991234567".
 * - Si tiene 12 dígitos con prefijo "52" o 13 dígitos con prefijo "521", conserva los dígitos válidos.
 * - Rechaza secuencias inválidas de un solo dígito repetido (ej. 0000000000).
 */
export function normalizeMexicanPhone(
  raw: string | null | undefined,
  options: { stripLegacyMobileOne?: boolean } = {}
): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // 1. Verificar si contiene un deep link de WhatsApp embebido
  const deepLinkMatch = trimmed.match(
    /(?:wa\.me\/|api\.whatsapp\.com\/send\?[^"'\s>]*phone=)\+?(\d{10,15})/i
  );
  const source = deepLinkMatch?.[1] ? deepLinkMatch[1] : trimmed;

  // 2. Soportar múltiples números separados por /, coma o punto y coma
  const candidates = source.split(/[,/;]/);
  for (const cand of candidates) {
    const digits = cand.replace(/\D/g, '');
    if (!digits || digits.length < 10) continue;

    // Rechazar números compuestos por el mismo dígito repetido (ej. 9999999999999 si todos son iguales)
    const last10 = digits.slice(-10);
    if (/^(\d)\1{9}$/.test(last10) && (last10.startsWith('0') || last10 === '1111111111')) {
      continue;
    }

    if (digits.length === 10) {
      return `52${digits}`;
    }
    if (digits.length === 13 && digits.startsWith('521')) {
      return options.stripLegacyMobileOne ? `52${digits.slice(3)}` : digits;
    }
    if (digits.length === 12 && digits.startsWith('52')) {
      return digits;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `52${digits.slice(1)}`;
    }
    if (digits.length >= 10 && digits.length <= 15) {
      return digits;
    }
  }

  return null;
}

/**
 * Infiere automáticamente el perfil de Tenant para WhatsApp Studio según el contexto del lead.
 */
export function inferWhatsAppTenant(
  lead: LeadWhatsAppContext,
  activeTenantId?: string | null
): WhatsAppTenantKey {
  if (activeTenantId === 'canaco_merida' || lead.tenant_id === 'canaco_merida') {
    return 'canaco_merida';
  }
  const haystack = [lead.contacto_nombre, lead.especialidad, lead.notas, lead.web]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    haystack.includes('canaco') ||
    haystack.includes('siem') ||
    haystack.includes('cámara de comercio') ||
    haystack.includes('camara de comercio')
  ) {
    return 'canaco_merida';
  }
  return 'ark';
}

/**
 * Selecciona la plantilla sugerida por defecto según el estatus y especialidad del prospecto.
 */
export function inferDefaultTemplateId(
  lead: LeadWhatsAppContext,
  tenant: WhatsAppTenantKey
): string {
  if (tenant === 'canaco_merida') {
    return 'canaco_boveda_fiscal';
  }
  const status = (lead.status || '').trim();
  if (status.startsWith('Mail_enviado')) {
    return 'ark_seguimiento_mail';
  }
  const esp = (lead.especialidad || '').toLowerCase();
  if (esp.includes('crypto') || esp.includes('abog') || esp.includes('pld')) {
    return 'ark_crypto_lfpiorpi';
  }
  if (esp.includes('fiscal') || esp.includes('auditor')) {
    return 'ark_forense_cfdi';
  }
  return 'ark_marca_blanca';
}

/**
 * Extrae un nombre limpio de despacho o empresa a partir del contacto o dominio web.
 */
export function resolveDespachoName(lead: LeadWhatsAppContext): string {
  if (lead.contacto_nombre && lead.contacto_nombre.trim()) {
    return lead.contacto_nombre.trim();
  }
  if (lead.web && lead.web.trim()) {
    const cleanDomain = lead.web
      .trim()
      .replace(/^https?:\/\/(www\.)?/i, '')
      .split('/')[0];
    if (cleanDomain) return cleanDomain;
  }
  return 'su firma contable';
}

/**
 * Genera el mapa de variables dinámicas para compilar plantillas de WhatsApp Studio.
 */
export function buildWhatsAppVariables(
  lead: LeadWhatsAppContext,
  options: {
    tenant?: WhatsAppTenantKey;
    recipientName?: string;
    senderName?: string;
    senderPhone?: string;
    dateIso?: string;
  } = {}
): WhatsAppTemplateVars {
  const tenantKey = options.tenant ?? inferWhatsAppTenant(lead);
  const tenantCfg = WS_TENANT_CONFIGS[tenantKey];

  const nombre =
    options.recipientName?.trim() || lead.contacto_nombre?.trim() || 'Socio(a) Director(a)';
  const despacho = resolveDespachoName(lead);
  const especialidad = lead.especialidad?.trim() || 'Contabilidad & Fiscal';
  const ciudad = lead.ciudad?.trim() || 'México';
  const remitente = options.senderName?.trim() || tenantCfg.defaultSender;
  const telRemitente = options.senderPhone?.trim() || tenantCfg.defaultSenderPhone;
  const fecha = options.dateIso || new Date().toISOString().slice(0, 10);
  const rawId = (lead.id || 'ARK01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const folio = `ARK-${rawId.slice(0, 6) || '2026'}`;

  return {
    NOMBRE: nombre,
    DESPACHO: despacho,
    ESPECIALIDAD: especialidad,
    CIUDAD: ciudad,
    REMITENTE: remitente,
    TEL_REMITENTE: telRemitente,
    FECHA: fecha,
    FOLIO: folio,
  };
}

/**
 * Inyecta en tiempo real las variables {NOMBRE}, {DESPACHO}, {CIUDAD}, etc. en una plantilla.
 */
export function compileWhatsAppMessage(templateBody: string, vars: WhatsAppTemplateVars): string {
  return templateBody
    .replace(/\{NOMBRE\}/g, vars.NOMBRE)
    .replace(/\{EMPRESA\}/g, vars.DESPACHO)
    .replace(/\{DESPACHO\}/g, vars.DESPACHO)
    .replace(/\{ESPECIALIDAD\}/g, vars.ESPECIALIDAD)
    .replace(/\{CIUDAD\}/g, vars.CIUDAD)
    .replace(/\{REMITENTE\}/g, vars.REMITENTE)
    .replace(/\{TEL_REMITENTE\}/g, vars.TEL_REMITENTE)
    .replace(/\{FECHA\}/g, vars.FECHA)
    .replace(/\{FOLIO\}/g, vars.FOLIO);
}

/**
 * Construye la URL de deep linking https://wa.me/<telefono>?text=<mensaje_codificado>
 */
export function buildWhatsAppDeepLink(
  rawPhone: string | null | undefined,
  message?: string | null
): string | null {
  const cleanPhone = normalizeMexicanPhone(rawPhone);
  if (!cleanPhone) return null;
  if (!message || !message.trim()) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.trim())}`;
}
