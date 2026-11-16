/**
 * ARK LEDGER — Bóveda Offline Criptográfica (Art. 30 CFF & Anti Vendor-Lock-In)
 *
 * Genera un paquete descargable .zip con arquitectura de soberanía de datos:
 * 1. datos_expediente.json: Snapshot canónico de inputs, outputs y metadatos fiscales.
 * 2. papel_de_trabajo.html: Documento imprimible tamaño Carta (@media print) con firmas y sellos.
 * 3. offline-viewer.html: Visor interactivo 100% autocontenido (HTML+CSS+JS nativo, sin dependencias
 *    ni conexiones de red) que valida y recalcula el SHA-256 en vivo en cualquier navegador.
 * 4. manifest.sha256: Manifiesto estándar UNIX para auditoría forense con `sha256sum -c`.
 */

import JSZip from 'jszip';

export interface BovedaConceptoFila {
  concepto: string;
  dias?: string | number;
  formula?: string;
  fundamento?: string;
  importe: number;
}

export interface BovedaOfflineParams {
  titulo: string;
  toolId: string;
  toolNombre?: string;
  despachoName: string;
  client: {
    nombre: string;
    rfc?: string | null;
    curp?: string | null;
    nss?: string | null;
    tipo?: string;
    salario_diario?: number;
    salario_diario_integrado?: number;
    fecha_ingreso?: string | null;
  };
  folio?: string;
  fecha?: string;
  catalogVersion?: string;
  inputHash: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  filasConceptos?: BovedaConceptoFila[];
  totalMonto?: number;
  importeEnLetras?: string;
  qrDataUrl?: string;
  presentation?: {
    integrityLabel: string;
    integrityDescription: string;
    jsonHashField: string;
    manifestHashLabel?: string;
    manifestScope?: string;
    legalHeading?: string;
    legalText?: string;
    qrCaption: string;
    verifierMode?: 'digest' | 'reference_only';
  };
  archivosAdicionales?: Array<{
    ruta: string;
    contenido: string | Uint8Array;
  }>;
}

export interface BovedaMetadata {
  folio: string;
  inputHash: string;
  toolId: string;
  clientRfc: string;
  clientNombre: string;
  catalogVersion: string;
  inputHashLabel?: string;
  scopeLabel?: string;
}

/**
 * Calcula el digest SHA-256 de un texto o buffer en formato hexadecimal minúscula.
 * Utiliza Web Crypto API nativa (disponible en navegadores modernos y Node >= 18).
 */
export async function computeSha256(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new Error(
    'Web Crypto API (crypto.subtle) no disponible. Se requiere SHA-256 nativo en contexto seguro (navegador moderno/Node >= 18).'
  );
}

/**
 * Normaliza recursivamente un objeto ordenando sus llaves y genera su hash SHA-256 canónico.
 * Garantiza que { a: 1, b: 2 } y { b: 2, a: 1 } produzcan el mismo hash.
 */
export async function computeDeterministicHash(data: unknown): Promise<string> {
  const normalize = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(normalize);
    }
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = normalize((obj as Record<string, unknown>)[key]);
    }
    return result;
  };

  const canonicalJson = JSON.stringify(normalize(data));
  return computeSha256(canonicalJson);
}

/**
 * Genera el archivo manifest.sha256 en formato estándar UNIX FIPS 180-4.
 */
export function generarManifestSha256(
  archivos: Array<{ nombre: string; hash: string }>,
  meta: BovedaMetadata
): string {
  const fechaIso = new Date().toISOString();
  const header = [
    '# ==============================================================================#',
    '# ARK LEDGER — BÓVEDA OFFLINE · MANIFEST DE INTEGRIDAD CRIPTOGRÁFICA           #',
    `# ${meta.scopeLabel || 'Cumplimiento: Código Fiscal de la Federación (CFF Art. 30 / 10 Años)'}`,
    '# Estándar de Digest: FIPS 180-4 (SHA-256, 256 bits)                           #',
    '# ==============================================================================#',
    `# Folio Expediente : ${meta.folio}`,
    `# Herramienta      : ${meta.toolId}`,
    `# Contribuyente    : ${meta.clientNombre} (${meta.clientRfc})`,
    meta.inputHashLabel
      ? `# ${meta.inputHashLabel} : ${meta.inputHash}`
      : `# Sello Canónico   : ${meta.inputHash}`,
    `# Versión Catálogo : ${meta.catalogVersion}`,
    `# Fecha Generación : ${fechaIso}`,
    '#',
    '# Instrucciones de verificación independiente:',
    '#   Linux / macOS : sha256sum -c manifest.sha256',
    '#   Windows (PWSH): Get-FileHash * -Algorithm SHA256',
    '# ==============================================================================#',
    '',
  ].join('\n');

  const rows = archivos.map((a) => `${a.hash}  ${a.nombre}`).join('\n');
  return `${header}${rows}\n`;
}

/**
 * Genera LEAME.txt con instrucciones de conservación y alcance de verificación.
 * Incluido en el .zip y en manifest.sha256. No cita Art. 49 CCo (cita no verificada para este contenido).
 */
export function generarLeameTxt(meta: BovedaMetadata): string {
  const fechaIso = new Date().toISOString();
  const label = meta.inputHashLabel || 'Sello canónico (hash determinista de inputs canónicos)';
  return [
    'ARK LEDGER — BÓVEDA OFFLINE (paquete de preservación documental)',
    '===============================================================',
    '',
    `Folio: ${meta.folio}`,
    `Herramienta: ${meta.toolId}`,
    `Contribuyente: ${meta.clientNombre} (${meta.clientRfc})`,
    `${label}: ${meta.inputHash}`,
    `Versión de catálogo: ${meta.catalogVersion}`,
    `Generado: ${fechaIso}`,
    '',
    'ALCANCE Y CONSERVACIÓN (Art. 30 CFF)',
    '- Este paquete permite verificar la integridad de sus archivos sin servidor mediante manifest.sha256 (SHA-256 por archivo).',
    '- Conservación documental recomendada conforme al Código Fiscal de la Federación, Art. 30, por el plazo aplicable (5 a 10 años, según corresponda).',
    '- Alcance: la verificación por manifiesto acredita integridad de los archivos del paquete. No sustituye la verificación de registro/autenticidad ante sistemas en línea de ARK ni acredita por sí sola cumplimiento fiscal.',
    '- Rutas/QR de verificación en línea (p. ej. ?verify=) requieren que el servicio correspondiente esté disponible; no son verificables únicamente con este .zip.',
    '',
    'REQUISITOS DEL VISOR (offline-viewer.html)',
    '- Navegador moderno con Web Crypto API (crypto.subtle) en contexto seguro.',
    '- file:// suele funcionar en navegadores modernos, pero el soporte puede variar según navegador/configuración.',
    '',
    'CONTENIDO TÍPICO',
    '- datos_expediente.json, papel_de_trabajo.html, offline-viewer.html, manifest.sha256, LEAME.txt (y archivos adicionales si aplica).',
    '',
    'VERIFICACIÓN DE INTEGRIDAD DE ARCHIVOS',
    '- Linux / macOS: sha256sum -c manifest.sha256',
    '- Windows (PowerShell): calcular hash por archivo y comparar con manifest.sha256 (ver procedimiento en offline-viewer.html).',
    '',
    'Nota: este instructivo no incluye citas legales no verificadas (p. ej. Art. 49 CCo no citado).',
    '',
  ].join('\n');
}

/**
 * Genera el documento HTML estático del papel de trabajo, listo para imprimir en tamaño Carta.
 */
export function generarPapelDeTrabajoHtml(params: BovedaOfflineParams): string {
  const folio = params.folio || `EXP-${Date.now().toString(36).toUpperCase()}`;
  const fechaStr = params.fecha || new Date().toLocaleDateString('es-MX', { dateStyle: 'long' });
  const total = Number(params.totalMonto || 0);
  const totalFmt = total.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const integrityLabel = params.presentation?.integrityLabel || 'SELLO DIGITAL INMUTABLE (SHA-256)';
  const integrityDescription =
    params.presentation?.integrityDescription ||
    'La integridad del cálculo está sellada criptográficamente en el origen.';
  const qrCaption = params.presentation?.qrCaption || 'ESCANEAR';

  const filasHtml = (params.filasConceptos || [])
    .map(
      (f, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
          <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">${escapeHtml(f.concepto)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: center; font-family: monospace; color: #475569;">${f.dias ?? '-'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 11px;">${escapeHtml(f.formula || '-')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 10px;">${escapeHtml(f.fundamento || '-')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; font-weight: 600; color: #0F172A;">$${Number(f.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Papel de Trabajo — ${escapeHtml(folio)} — ${escapeHtml(params.client.nombre)}</title>
  <style>
    @page { size: letter portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; background: #FFFFFF; margin: 0; padding: 24px; font-size: 12px; line-height: 1.45; }
    .header { border-bottom: 2px solid #002B7F; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .despacho { font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #002B7F; }
    .titulo { font-size: 22px; font-weight: 900; margin: 4px 0 2px 0; color: #0A0A0B; letter-spacing: -0.02em; }
    .subtitulo { font-size: 11px; color: #64748B; margin: 0; }
    .meta-box { text-align: right; font-family: monospace; font-size: 11px; }
    .folio { font-size: 13px; font-weight: 800; color: #002B7F; }
    .badge-dof { display: inline-block; background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; margin-top: 4px; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 600; }
    .info-val { font-size: 12px; font-weight: 700; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11.5px; }
    th { background: #002B7F; color: #FFFFFF; padding: 8px 10px; font-weight: 700; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
    .letra-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 10.5px; margin-bottom: 16px; }
    .legal-box { border-left: 3px solid #D4AF37; padding-left: 10px; font-size: 9.5px; color: #475569; margin-bottom: 24px; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; margin-bottom: 24px; text-align: center; }
    .linea-firma { width: 180px; border-bottom: 1px solid #000; margin: 0 auto 6px auto; }
    .footer-sello { border-top: 2px solid #E2E8F0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: monospace; font-size: 9.5px; }
    .hash-val { word-break: break-all; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 4px; color: #475569; font-size: 9px; margin-top: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="despacho">${escapeHtml(params.despachoName)}</div>
      <h1 class="titulo">${escapeHtml(params.presentation ? params.titulo : 'Papel de Trabajo y Dictamen de Auditoría')}</h1>
      <p class="subtitulo">${escapeHtml(params.presentation ? 'Proyección informativa; no resolución oficial' : `${params.toolNombre || params.titulo} · Cumplimiento Fiscal y Laboral`)}</p>
    </div>
    <div class="meta-box">
      <div class="folio">FOLIO: ${escapeHtml(folio)}</div>
      <div style="color: #64748B;">${escapeHtml(fechaStr)}</div>
      <div class="badge-dof">${escapeHtml(params.catalogVersion || 'DOF-2026-OFICIAL')}</div>
    </div>
  </div>

  <div class="grid-info">
    <div>
      <div class="info-label">Contribuyente / Empleador</div>
      <div class="info-val">${escapeHtml(params.client.nombre)}</div>
      <div style="font-family: monospace; color: #002B7F; font-size: 11px; margin-top: 2px;">
        RFC: ${escapeHtml(params.client.rfc || 'No registrado')}
        ${params.client.curp ? ` · CURP: ${escapeHtml(params.client.curp)}` : ''}
      </div>
    </div>
    <div>
      <div class="info-label">${params.presentation ? 'Alcance del folio' : 'Certeza Jurídica & Integridad'}</div>
      <div class="info-val">${params.presentation ? 'Referencia del cálculo' : 'Art. 30 CFF (Conservación 5 a 10 Años)'}</div>
      <div style="color: #059669; font-weight: 600; font-size: 11px; margin-top: 2px;">
        ${params.presentation ? escapeHtml(params.presentation.integrityLabel) : '✓ Sellado con Algoritmo SHA-256 Deterministico'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Concepto</th>
        <th style="width: 10%; text-align: center;">Base/Días</th>
        <th style="width: 32%;">Fórmula de Determinación</th>
        <th style="width: 15%;">Fundamento</th>
        <th style="width: 15%; text-align: right;">Importe M.N.</th>
      </tr>
    </thead>
    <tbody>
      ${filasHtml}
    </tbody>
    <tfoot>
      <tr style="background: #002B7F; color: #FFFFFF; font-weight: 800;">
        <td colspan="4" style="padding: 10px; text-align: right; text-transform: uppercase;">Total Determinado:</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; font-size: 13px;">$${totalFmt} MXN</td>
      </tr>
    </tfoot>
  </table>

  ${
    params.importeEnLetras
      ? `
  <div class="letra-box">
    <strong>IMPORTE CON LETRA:</strong> ${escapeHtml(params.importeEnLetras)}
  </div>`
      : ''
  }

  <div class="legal-box">
    <strong>${escapeHtml(params.presentation?.legalHeading || 'Fundamentación y Valor Probatorio')}:</strong>
    ${escapeHtml(params.presentation?.legalText || `Este papel de trabajo fue generado conforme a las disposiciones fiscales aplicables del Código Fiscal de la Federación (Art. 28 y 30), Ley del Impuesto Sobre la Renta, Ley del Seguro Social y Ley Federal del Trabajo. ${integrityDescription}`)}
  </div>

  <div class="firmas">
    <div>
      <div class="linea-firma"></div>
      <strong style="color: #0F172A;">${params.presentation ? 'Responsable de la proyección' : 'Firma del Contador Auditor'}</strong>
      <div style="color: #64748B; font-size: 10px;">Por el Despacho Emisor</div>
    </div>
    <div>
      <div class="linea-firma"></div>
      <strong style="color: #0F172A;">Firma de Conformidad</strong>
      <div style="color: #64748B; font-size: 10px;">${escapeHtml(params.client.nombre)}</div>
    </div>
  </div>

  <div class="footer-sello">
    <div style="max-width: 580px;">
      <strong style="color: #002B7F;">${escapeHtml(integrityLabel)}:</strong>
      <div class="hash-val">${escapeHtml(params.inputHash)}</div>
      ${
        params.presentation?.verifierMode === 'reference_only'
          ? ''
          : `<div style="color: #64748B; font-size: 9px; margin-top: 3px;">
        Auditoría independiente en terminal: <code>echo -n '&lt;canonical_json&gt;' | sha256sum</code>
      </div>`
      }
    </div>
    ${
      params.qrDataUrl
        ? `<div style="text-align: center;">
             <img src="${params.qrDataUrl}" alt="${params.presentation ? 'QR de referencia' : 'QR Verificación'}" style="width: 72px; height: 72px; border: 1px solid #CBD5E1; padding: 2px; border-radius: 6px; background: #FFF;">
             <div style="font-size: 8px; color: #002B7F; font-weight: 700; margin-top: 2px;">${escapeHtml(qrCaption)}</div>
           </div>`
        : ''
    }
  </div>
</body>
</html>`;
}

/**
 * Genera el visor offline-viewer.html interactivo 100% autocontenido.
 * Funciona bajo protocolo file:/// sin conexión a internet y recalcula hashes con Web Crypto API.
 */
export function generarOfflineViewerHtml(
  params: BovedaOfflineParams,
  manifestEntries: Array<{ nombre: string; hash: string }> = []
): string {
  const folio = params.folio || `EXP-${Date.now().toString(36).toUpperCase()}`;
  const fechaStr = params.fecha || new Date().toISOString().split('T')[0];
  const referenceOnly = params.presentation?.verifierMode === 'reference_only';
  const integrityLabel =
    params.presentation?.integrityLabel || 'SELLO DETERMINÍSTICO INMUTABLE (SHA-256)';
  const integrityDescription =
    params.presentation?.integrityDescription ||
    'El navegador puede recalcular el SHA-256 de los datos (inputs canónicos) para cotejarlos con el valor registrado.';
  const payloadJson = JSON.stringify(
    {
      folio,
      fecha: fechaStr,
      despacho: params.despachoName,
      contribuyente: params.client,
      herramienta: params.toolId,
      version_catalogo_dof: params.catalogVersion || 'DOF-2026-OFICIAL',
      [params.presentation?.jsonHashField || 'sello_registrado_sha256']: params.inputHash,
      inputs: params.inputs,
      outputs: params.outputs,
    },
    null,
    2
  );

  const papelHtml = generarPapelDeTrabajoHtml(params);
  const manifestJson = JSON.stringify(manifestEntries);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARK LEDGER · Bóveda Offline [${escapeHtml(folio)}]</title>
  <style>
    :root { --bg:#0A0A0B; --surface:#121214; --surface-2:#1A1A1E; --border:rgba(255,255,255,0.10); --border-accent:rgba(0,245,255,0.35); --cyan:#00F5FF; --lime:#CCFF00; --text:#F5F5F7; --text-muted:#9CA3AF; --text-dim:#6B7280; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 24px; line-height: 1.5; font-size: 13px; }
    .container { max-width: 960px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-badge { background: #FFF; color: #000; font-weight: 900; font-size: 10px; padding: 3px 7px; border-radius: 999px; letter-spacing: 0.14em; }
    .brand-title { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255,255,255,0.9); }
    .badge-offline { background: rgba(204,255,0,0.12); border: 1px solid rgba(204,255,0,0.3); color: var(--lime); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; font-family: monospace; display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 8px var(--lime); }
    .hero-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; }
    .hero-title { font-size: 20px; font-weight: 700; color: #FFF; margin-bottom: 6px; }
    .hero-sub { color: var(--text-muted); font-size: 12px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; }
    .meta-item { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .meta-lbl { font-size: 10px; text-transform: uppercase; color: var(--text-dim); font-weight: 600; letter-spacing: 0.05em; font-family: monospace; }
    .meta-val { font-size: 12px; font-weight: 700; color: var(--text); margin-top: 2px; }
    .hash-banner { background: rgba(0,245,255,0.05); border: 1px solid var(--border-accent); border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
    .hash-title { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-family: monospace; color: var(--cyan); font-weight: 700; letter-spacing: 0.08em; margin-bottom: 6px; }
    .hash-code { font-family: monospace; font-size: 11px; word-break: break-all; color: rgba(255,255,255,0.95); background: rgba(0,0,0,0.5); padding: 8px 10px; border-radius: 6px; }
    .nav-tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--border); margin-bottom: 20px; flex-wrap: wrap; }
    .tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 10px 16px; font-size: 12px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--cyan); border-bottom-color: var(--cyan); }
    .tab-panel { display: none; } .tab-panel.active { display: block; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 18px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; background: #002B7F; color: #FFF; border: none; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .btn-lime { background: var(--lime); color: #000; }
    .audit-box { border-radius: 12px; padding: 16px; margin-top: 14px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
    .audit-box.success { background: rgba(204,255,0,0.08); border: 1px solid rgba(204,255,0,0.35); color: #E4FFA0; }
    .audit-box.error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.45); color: #FCA5A5; }
    .audit-box.warn { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.4); color: #FDE68A; }
    .dropzone { border: 2px dashed var(--border); border-radius: 12px; padding: 28px; text-align: center; background: rgba(255,255,255,0.02); cursor: pointer; margin-top: 14px; }
    pre { background: #050506; border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-family: monospace; font-size: 11.5px; overflow-x: auto; color: #E5E7EB; line-height: 1.5; }
    iframe.preview-frame { width: 100%; height: 750px; border: 1px solid var(--border); border-radius: 12px; background: #FFF; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand"><span class="brand-badge">ARK</span><span class="brand-title">ARK LEDGER · BÓVEDA OFFLINE</span></div>
      <div class="badge-offline"><span class="dot"></span>INTEGRIDAD DE ARCHIVOS (OFFLINE)</div>
    </header>
    <div class="hero-card">
      <div class="hero-title">${escapeHtml(params.toolNombre || params.titulo)}</div>
      <div class="hero-sub">${referenceOnly ? escapeHtml(integrityDescription) : 'Integridad de archivos verificable offline con manifest.sha256. La verificación de registro/autenticidad en línea de ARK requiere servicio disponible.'}</div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-lbl">Contribuyente</div><div class="meta-val">${escapeHtml(params.client.nombre)}</div></div>
        <div class="meta-item"><div class="meta-lbl">RFC / Identificación</div><div class="meta-val" style="font-family: monospace; color: var(--cyan);">${escapeHtml(params.client.rfc || 'No registrado')}</div></div>
        <div class="meta-item"><div class="meta-lbl">Folio</div><div class="meta-val" style="font-family: monospace;">${escapeHtml(folio)}</div></div>
        <div class="meta-item"><div class="meta-lbl">Vigencia DOF</div><div class="meta-val" style="color: var(--lime); font-family: monospace;">${escapeHtml(params.catalogVersion || 'DOF-2026-OFICIAL')}</div></div>
      </div>
      <div class="hash-banner">
        <div class="hash-title"><span>${escapeHtml(integrityLabel)}</span><span style="color: var(--text-dim); font-size: 10px;">${referenceOnly ? 'Referencia del cálculo' : 'Hash determinista (inputs canónicos)'}</span></div>
        <div class="hash-code" id="registered-hash">${escapeHtml(params.inputHash)}</div>
      </div>
      <p style="margin-top:10px; font-size:11px; color:var(--text-dim);">Requisitos: navegador moderno con Web Crypto (crypto.subtle) en contexto seguro. Abrir desde file:// suele funcionar, pero el soporte depende del navegador/configuración.</p>
    </div>
    <nav class="nav-tabs">
      <button class="tab-btn active" onclick="showTab(event,'papel')">${referenceOnly ? '1. Cédula' : '1. Papel de Trabajo'}</button>
      <button class="tab-btn" onclick="showTab(event,'validador')">${referenceOnly ? '2. Alcance' : '2. Verificación local'}</button>
      <button class="tab-btn" onclick="showTab(event,'manifest')">3. Manifiesto</button>
      <button class="tab-btn" onclick="showTab(event,'raw')">4. Datos JSON</button>
    </nav>
    <div id="tab-papel" class="tab-panel active">
      <div class="card" style="padding:14px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span style="font-size:12px; color:var(--text-muted);">${referenceOnly ? 'Vista imprimible de proyección; no es documento oficial.' : 'Documento imprimible. Integridad de archivos del paquete validable con manifest.sha256 (offline).'}</span>
        <button class="btn btn-lime" onclick="printFrame()">Imprimir / Guardar PDF</button>
      </div>
      <iframe id="doc-frame" class="preview-frame" srcdoc="${escapeHtmlAttr(papelHtml)}"></iframe>
    </div>
    <div id="tab-validador" class="tab-panel">
      <div class="card">
        <h3 style="font-size:15px; margin-bottom:6px;">${referenceOnly ? 'Alcance del folio' : 'Verificar hash de inputs canónicos (local)'}</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">${escapeHtml(integrityDescription)} ${referenceOnly ? '' : 'Sin envío de datos a internet. Este resultado verifica el hash registrado de inputs canónicos; la integridad de cada archivo se verifica contra manifest.sha256.'}</p>
        <button class="btn" onclick="recalcularIntegridad()">${referenceOnly ? 'Mostrar alcance' : 'Ejecutar verificación local'}</button>
        <div id="audit-result" style="display:none;" class="audit-box"></div>
        <div class="dropzone" id="dropzone" onclick="document.getElementById('file-input').click()">
          <input type="file" id="file-input" style="display:none;" onchange="handleFileSelect(event)">
          <div style="font-size:13px; font-weight:700; color:var(--cyan); margin-bottom:4px;">Arrastra un archivo del .zip para validar contra manifest.sha256</div>
          <div style="font-size:11px; color:var(--text-dim);">Se calcula SHA-256 y se compara con el manifiesto: resultado PASS o FAIL explícito.</div>
        </div>
        <div id="drop-result" style="display:none; margin-top:14px;" class="audit-box"></div>
      </div>
    </div>
    <div id="tab-manifest" class="tab-panel">
      <div class="card">
        <h3 style="font-size:15px; margin-bottom:6px;">Verificación independiente de integridad de archivos</h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Valida integridad de archivos del paquete (no sustituye verificación/registro en línea de ARK ni acredita por sí sola cumplimiento fiscal).</p>
        <div style="margin-bottom:12px;"><div style="font-size:11px; font-family:monospace; color:var(--cyan); margin-bottom:4px;">Linux / macOS:</div><pre><code>sha256sum -c manifest.sha256</code></pre></div>
        <div style="margin-bottom:16px;"><div style="font-size:11px; font-family:monospace; color:var(--lime); margin-bottom:4px;">Windows PowerShell (verifica contra manifest.sha256):</div><pre><code>$manifest = Get-Content .\\manifest.sha256 | Where-Object { $_ -match '^[0-9a-f]{64}\\s\\s' }
$ok = $true
foreach ($line in $manifest) {
  $expected,$name = $line -split '\\s\\s',2
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $name).Hash.ToLower()
  if ($actual -eq $expected.ToLower()) { Write-Host "PASS  $name" -ForegroundColor Green }
  else { Write-Host "FAIL  $name (esperado $expected, actual $actual)" -ForegroundColor Red; $ok = $false }
}
if (-not $ok) { exit 1 }</code></pre></div>
        <div style="font-size:12px; color:var(--text-dim);">Conservación documental: CFF Art. 30 (5 a 10 años según corresponda). Rutas/QR de verificación en línea requieren servicio disponible.</div>
      </div>
    </div>
    <div id="tab-raw" class="tab-panel">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><h3 style="font-size:15px;">Datos del expediente (JSON)</h3><button class="btn" style="padding:6px 12px; font-size:11px;" onclick="copyRawJson()">Copiar JSON</button></div>
        <pre><code id="raw-json-block">${escapeHtml(payloadJson)}</code></pre>
      </div>
    </div>
  </div>
  <script>
    const registeredHash = ${JSON.stringify(params.inputHash || '')};
    const referenceOnly = ${referenceOnly};
    const rawData = ${JSON.stringify(params.inputs || {})};
    const manifestEntries = ${manifestJson};
    const integrityDescription = ${JSON.stringify(integrityDescription)};

    function showTab(ev, tabName) { document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); if(ev&&ev.target) ev.target.classList.add('active'); document.getElementById('tab-'+tabName).classList.add('active'); }
    function printFrame(){ const f=document.getElementById('doc-frame'); if(f&&f.contentWindow){f.contentWindow.focus();f.contentWindow.print();} else window.print(); }
    function copyRawJson(){ const t=document.getElementById('raw-json-block').textContent; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(()=>alert('Copiado al portapapeles.')); else alert('No se pudo copiar automáticamente.'); }
    function normalize(obj){ if(obj===null||typeof obj!=='object') return obj; if(Array.isArray(obj)) return obj.map(normalize); const s={}; Object.keys(obj).sort().forEach(k=>{s[k]=normalize(obj[k]);}); return s; }
    async function sha256HexFromBytes(buffer){ if(!crypto||!crypto.subtle) throw new Error('Web Crypto API (crypto.subtle) no disponible. Use navegador moderno en contexto seguro.'); const h=await crypto.subtle.digest('SHA-256',buffer); return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
    async function recalcularIntegridad(){
      const resEl=document.getElementById('audit-result'); resEl.style.display='block';
      if(referenceOnly){ resEl.className='audit-box warn'; resEl.textContent='ALCANCE: '+integrityDescription; return; }
      try{
        const canonical=JSON.stringify(normalize(rawData));
        const calculatedHash=await sha256HexFromBytes(new TextEncoder().encode(canonical));
        const coincide=calculatedHash.toLowerCase()===String(registeredHash).toLowerCase();
        if(coincide){ resEl.className='audit-box success'; resEl.textContent='PASS — El hash recalculado de inputs canónicos coincide con el valor registrado.\nRegistrado:  '+registeredHash+'\nRecalculado: '+calculatedHash; }
        else { resEl.className='audit-box error'; resEl.textContent='FAIL — NO COINCIDE: el sello no corresponde a los datos (inputs canónicos).\nRegistrado:  '+registeredHash+'\nRecalculado: '+calculatedHash; }
      }catch(err){ resEl.className='audit-box error'; resEl.textContent='FAIL — Error al calcular hash: '+String(err); }
    }
    async function handleFileSelect(event){ const file=event.target.files&&event.target.files[0]; if(!file) return; await processFile(file); event.target.value=''; }
    async function processFile(file){
      const resEl=document.getElementById('drop-result'); resEl.style.display='block'; resEl.className='audit-box warn'; resEl.textContent='Calculando SHA-256 de '+file.name+'...';
      try{
        const buffer=await file.arrayBuffer(); const hash=await sha256HexFromBytes(buffer);
        const expected=(manifestEntries||[]).find(e=>e&&e.nombre===file.name);
        if(!expected){ resEl.className='audit-box warn'; resEl.textContent='SIN REFERENCIA EN MANIFIESTO — '+file.name+'\nSHA-256 calculado: '+hash+'\nNo se puede emitir PASS/FAIL contra manifest.sha256 (archivo no listado).'; return; }
        const match=String(expected.hash).toLowerCase()===hash.toLowerCase();
        if(match){ resEl.className='audit-box success'; resEl.textContent='PASS — Coincide con manifest.sha256.\nArchivo:  '+file.name+'\nEsperado: '+expected.hash+'\nActual:   '+hash; }
        else { resEl.className='audit-box error'; resEl.textContent='FAIL — NO COINCIDE con manifest.sha256 (posible alteración).\nArchivo:  '+file.name+'\nEsperado: '+expected.hash+'\nActual:   '+hash; }
      }catch(err){ resEl.className='audit-box error'; resEl.textContent='FAIL — No se pudo verificar el archivo: '+String(err); }
    }
    const dropzone=document.getElementById('dropzone');
    dropzone.addEventListener('dragover',(e)=>{e.preventDefault();dropzone.style.borderColor='var(--cyan)';});
    dropzone.addEventListener('dragleave',(e)=>{e.preventDefault();dropzone.style.borderColor='var(--border)';});
    dropzone.addEventListener('drop',async(e)=>{e.preventDefault();dropzone.style.borderColor='var(--border)'; if(e.dataTransfer.files&&e.dataTransfer.files[0]) await processFile(e.dataTransfer.files[0]);});
    window.addEventListener('DOMContentLoaded',()=>{recalcularIntegridad();});
  </script>
</body>
</html>`;
}

export async function generarBovedaOfflineZip(params: BovedaOfflineParams): Promise<Blob> {
  const zip = new JSZip();

  const folio = params.folio || `EXP-${Date.now().toString(36).toUpperCase()}`;
  const fecha = params.fecha || new Date().toISOString();

  const canonicalData = {
    formato: 'ARK_LEDGER_BOVEDA_OFFLINE_V1',
    estandar: params.presentation
      ? 'Paquete de referencia; hashes de archivos incluidos en manifest.sha256'
      : 'Art. 30 CFF / FIPS 180-4',
    folio,
    fecha_emision: fecha,
    [params.presentation?.jsonHashField || 'sello_sha256_canónico']: params.inputHash,
    version_catalogo_dof: params.catalogVersion || 'DOF-2026-OFICIAL',
    despacho: params.despachoName,
    contribuyente: params.client,
    herramienta: {
      id: params.toolId,
      nombre: params.toolNombre || params.titulo,
    },
    total_determinado: params.totalMonto ?? null,
    importe_en_letras: params.importeEnLetras ?? null,
    conceptos: params.filasConceptos || [],
    inputs: params.inputs,
    outputs: params.outputs,
  };

  const jsonContent = JSON.stringify(canonicalData, null, 2);
  zip.file('datos_expediente.json', jsonContent);

  const meta: BovedaMetadata = {
    folio,
    inputHash: params.inputHash,
    toolId: params.toolId,
    clientRfc: params.client.rfc || 'XAXX010101000',
    clientNombre: params.client.nombre,
    catalogVersion: params.catalogVersion || 'DOF-2026-OFICIAL',
    inputHashLabel: params.presentation?.manifestHashLabel,
    scopeLabel: params.presentation?.manifestScope,
  };

  const papelHtml = generarPapelDeTrabajoHtml(params);
  zip.file('papel_de_trabajo.html', papelHtml);

  const leameTxt = generarLeameTxt(meta);
  zip.file('LEAME.txt', leameTxt);

  if (params.archivosAdicionales && params.archivosAdicionales.length > 0) {
    for (const arch of params.archivosAdicionales) {
      zip.file(arch.ruta, arch.contenido);
    }
  }

  const hashJson = await computeSha256(jsonContent);
  const hashPapel = await computeSha256(papelHtml);
  const hashLeame = await computeSha256(leameTxt);

  const baseEntries: Array<{ nombre: string; hash: string }> = [
    { nombre: 'datos_expediente.json', hash: hashJson },
    { nombre: 'papel_de_trabajo.html', hash: hashPapel },
    { nombre: 'LEAME.txt', hash: hashLeame },
  ];

  if (params.archivosAdicionales && params.archivosAdicionales.length > 0) {
    for (const arch of params.archivosAdicionales) {
      const hashArch = await computeSha256(
        typeof arch.contenido === 'string' ? arch.contenido : new Uint8Array(arch.contenido)
      );
      baseEntries.push({ nombre: arch.ruta, hash: hashArch });
    }
  }

  let finalEntries = [...baseEntries, { nombre: 'offline-viewer.html', hash: '' }];
  let finalViewer = generarOfflineViewerHtml(params, finalEntries);
  for (let i = 0; i < 4; i++) {
    const vh = await computeSha256(finalViewer);
    finalEntries = [...baseEntries, { nombre: 'offline-viewer.html', hash: vh }];
    const next = generarOfflineViewerHtml(params, finalEntries);
    const nh = await computeSha256(next);
    finalViewer = next;
    if (nh === vh) break;
  }
  const finalViewerHash = await computeSha256(finalViewer);
  finalEntries = [...baseEntries, { nombre: 'offline-viewer.html', hash: finalViewerHash }];
  zip.file('offline-viewer.html', finalViewer);

  const manifestContent = generarManifestSha256(finalEntries, meta);
  zip.file('manifest.sha256', manifestContent);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export async function descargarBovedaOfflineZip(params: BovedaOfflineParams): Promise<void> {
  const blob = await generarBovedaOfflineZip(params);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const rfcLimpio = (params.client.rfc || 'RFC').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const toolLimpia = params.toolId.replace(/[^a-zA-Z0-9_-]/g, '');
  const hashCorto = params.inputHash ? params.inputHash.slice(0, 8) : 'HASH';
  const fileName = `BOVEDA_OFFLINE_${rfcLimpio}_${toolLimpia}_${hashCorto}.zip`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttr(str: string): string {
  return escapeHtml(str);
}
