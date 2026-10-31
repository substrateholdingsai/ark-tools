/**
 * CANACO SERVYTUR MÉRIDA — API del Buzón Documental (Oficialía de Partes Digital)
 *
 * Flujo "sube uno, regresa luego" (estilo Payments by Wix):
 * - GET  /api/canaco/buzon/estado?rfc=          → Público: solo avance (X de Y), sin archivos.
 * - POST /api/canaco/buzon/acceso               → Socio: RFC + correo registrado abre su buzón.
 * - POST /api/canaco/buzon/upload (multipart)   → Socio: deposita / reemplaza un casillero.
 * - GET  /api/canaco/buzon/admin/resumen        → Cámara: avance documental por RFC.
 * - GET  /api/canaco/buzon/admin/expediente     → Cámara: detalle del expediente.
 * - GET  /api/canaco/buzon/admin/archivo?id=    → Cámara: visualiza el archivo.
 * - POST /api/canaco/buzon/admin/dictaminar     → Cámara: aprueba o rechaza con motivo.
 *
 * Los archivos se guardan en R2 (binding CANACO_DOCS) y, si no existe, en base64 dentro de D1.
 */

import type { Env } from '../index';
import type { AuthPrincipal } from './auth';
import {
  MAX_BYTES_BUZON_D1,
  MAX_BYTES_BUZON_R2,
  MIME_PERMITIDOS_BUZON,
  documentosRequeridos,
  esTipoDocumentoValido,
  normalizarRfc,
  rfcEsValido,
  tipoPersonaPorRfc,
  type EstatusDocumentoCanaco,
  type TipoDocumentoCanaco,
} from '@/components/canaco/documentosBuzon';

const TENANT_CANACO = 'canaco_merida';
const CANACO_ADMIN_EMAIL = 'horus.i2d@gmail.com';

interface LeadSocioRow {
  id: string;
  web: string | null;
  email: string | null;
  status: string | null;
  contacto_nombre: string | null;
  notas: string | null;
}

interface DocumentoRow {
  id: string;
  rfc: string;
  tipo_documento: TipoDocumentoCanaco;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  sha256: string;
  storage: 'r2' | 'd1';
  r2_key: string | null;
  contenido_base64?: string | null;
  estatus: EstatusDocumentoCanaco;
  motivo_rechazo: string | null;
  revisado_por: string | null;
  revisado_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SlotBuzon {
  tipo: TipoDocumentoCanaco;
  estatus: 'pendiente' | EstatusDocumentoCanaco;
  nombreArchivo?: string;
  tamanoBytes?: number;
  sha256?: string;
  motivoRechazo?: string | null;
  depositadoEn?: string | null;
}

function noStore(corsHeaders: Record<string, string>, status = 200, extra?: HeadersInit) {
  const headers = new Headers({ ...corsHeaders, 'Cache-Control': 'no-store' });
  if (extra) new Headers(extra).forEach((v, k) => headers.set(k, v));
  return { status, headers };
}

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return Response.json(body, noStore(corsHeaders, status));
}

function esAdminCanaco(principal: AuthPrincipal | null | undefined): boolean {
  if (!principal) return false;
  return (
    principal.platformRole === 'super_admin' || principal.email.toLowerCase() === CANACO_ADMIN_EMAIL
  );
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sanitizarNombre(nombre: string): string {
  const limpio = nombre
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(-120);
  return limpio || 'documento';
}

async function buscarSocioPorRfc(db: D1Database, rfc: string): Promise<LeadSocioRow | null> {
  return db
    .prepare(
      `SELECT id, web, email, status, contacto_nombre, notas
       FROM leads_ark_tools
       WHERE tenant_id = ? AND (notas LIKE ? OR web LIKE ?)
       ORDER BY updated_at DESC
       LIMIT 1`
    )
    .bind(TENANT_CANACO, `%${rfc}%`, `%${rfc}%`)
    .first<LeadSocioRow>();
}

async function verificarSocio(
  db: D1Database,
  rfc: string,
  email: string
): Promise<LeadSocioRow | null> {
  const socio = await buscarSocioPorRfc(db, rfc);
  if (!socio?.email) return null;
  return socio.email.trim().toLowerCase() === email.trim().toLowerCase() ? socio : null;
}

async function listarDocumentos(db: D1Database, rfc: string): Promise<DocumentoRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, rfc, tipo_documento, nombre_archivo, mime_type, tamano_bytes, sha256, storage,
              r2_key, estatus, motivo_rechazo, revisado_por, revisado_at, created_at, updated_at
       FROM canaco_documentos
       WHERE tenant_id = ? AND rfc = ?`
    )
    .bind(TENANT_CANACO, rfc)
    .all<DocumentoRow>();
  return results || [];
}

export function construirSlots(rfc: string, documentos: DocumentoRow[]): SlotBuzon[] {
  const porTipo = new Map(documentos.map((d) => [d.tipo_documento, d]));
  return documentosRequeridos(tipoPersonaPorRfc(rfc)).map((def) => {
    const doc = porTipo.get(def.tipo);
    if (!doc) return { tipo: def.tipo, estatus: 'pendiente' as const };
    return {
      tipo: def.tipo,
      estatus: doc.estatus,
      nombreArchivo: doc.nombre_archivo,
      tamanoBytes: doc.tamano_bytes,
      sha256: doc.sha256,
      motivoRechazo: doc.motivo_rechazo,
      depositadoEn: doc.updated_at || doc.created_at,
    };
  });
}

export function resumirSlots(slots: SlotBuzon[]) {
  const requeridos = slots.length;
  const depositados = slots.filter(
    (s) => s.estatus === 'recibido' || s.estatus === 'aprobado'
  ).length;
  const aprobados = slots.filter((s) => s.estatus === 'aprobado').length;
  const rechazados = slots.filter((s) => s.estatus === 'rechazado').length;
  return {
    requeridos,
    depositados,
    aprobados,
    rechazados,
    completo: depositados === requeridos,
    faltantes: slots
      .filter((s) => s.estatus === 'pendiente' || s.estatus === 'rechazado')
      .map((s) => s.tipo),
  };
}

export async function handleCanacoBuzonApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal?: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/canaco/buzon/')) return null;

  const db = env.ARK_TOOLS_DB;
  if (!db) return json({ error: 'Base de datos D1 no disponible.' }, corsHeaders, 503);

  try {
    // ───────────────────────────────────────────────────────────────
    // PÚBLICO: avance documental por RFC (sin nombres ni archivos)
    // ───────────────────────────────────────────────────────────────
    if (path === '/api/canaco/buzon/estado' && request.method === 'GET') {
      const rfc = normalizarRfc(url.searchParams.get('rfc'));
      if (!rfcEsValido(rfc)) return json({ error: 'RFC inválido.' }, corsHeaders, 400);

      const socio = await buscarSocioPorRfc(db, rfc);
      if (!socio) return json({ encontrado: false }, corsHeaders, 404);

      const slots = construirSlots(rfc, await listarDocumentos(db, rfc));
      return json(
        {
          encontrado: true,
          rfc,
          tipoPersona: tipoPersonaPorRfc(rfc),
          ...resumirSlots(slots),
          slots: slots.map((s) => ({ tipo: s.tipo, estatus: s.estatus })),
        },
        corsHeaders
      );
    }

    // ───────────────────────────────────────────────────────────────
    // SOCIO: abrir el buzón con RFC + correo registrado
    // ───────────────────────────────────────────────────────────────
    if (path === '/api/canaco/buzon/acceso' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { rfc?: unknown; email?: unknown };
      const rfc = normalizarRfc(body.rfc);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!rfcEsValido(rfc) || !email.includes('@')) {
        return json({ error: 'Captura un RFC válido y tu correo registrado.' }, corsHeaders, 400);
      }

      const socio = await verificarSocio(db, rfc, email);
      if (!socio) {
        return json(
          {
            error:
              'No encontramos un registro SIEM con ese RFC y correo. Verifica que sea el correo que capturaste en la Ventanilla.',
          },
          corsHeaders,
          403
        );
      }

      const slots = construirSlots(rfc, await listarDocumentos(db, rfc));
      const folio = socio.notas?.match(/Folio SIEM:\s*([^\s|]+)/i)?.[1] || null;
      return json(
        {
          ok: true,
          rfc,
          razonSocial: socio.web || 'Comercio Afiliado',
          contactoNombre: socio.contacto_nombre,
          folioSiem: folio,
          tipoPersona: tipoPersonaPorRfc(rfc),
          ...resumirSlots(slots),
          slots,
        },
        corsHeaders
      );
    }

    // ───────────────────────────────────────────────────────────────
    // SOCIO: depositar documento en un casillero (multipart/form-data)
    // ───────────────────────────────────────────────────────────────
    if (path === '/api/canaco/buzon/upload' && request.method === 'POST') {
      const form = await request.formData().catch(() => null);
      if (!form) return json({ error: 'Se esperaba multipart/form-data.' }, corsHeaders, 400);

      const rfc = normalizarRfc(form.get('rfc'));
      const emailRaw = form.get('email');
      const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
      const tipo = form.get('tipoDocumento');
      const archivo = form.get('archivo');

      if (!rfcEsValido(rfc) || !email.includes('@')) {
        return json({ error: 'RFC o correo inválidos.' }, corsHeaders, 400);
      }
      if (!esTipoDocumentoValido(tipo)) {
        return json({ error: 'Casillero de documento desconocido.' }, corsHeaders, 400);
      }
      if (!archivo || typeof archivo === 'string') {
        return json({ error: 'Adjunta el archivo del documento.' }, corsHeaders, 400);
      }

      const aplicables = documentosRequeridos(tipoPersonaPorRfc(rfc)).map((d) => d.tipo);
      if (!aplicables.includes(tipo)) {
        return json({ error: 'Este documento no aplica para persona física.' }, corsHeaders, 400);
      }

      const file = archivo as File;
      const mime = (file.type || '').toLowerCase();
      if (!MIME_PERMITIDOS_BUZON.includes(mime)) {
        return json(
          { error: 'Formato no permitido. Sube PDF, JPG, PNG o WEBP.' },
          corsHeaders,
          415
        );
      }

      const usaR2 = Boolean(env.CANACO_DOCS);
      const maxBytes = usaR2 ? MAX_BYTES_BUZON_R2 : MAX_BYTES_BUZON_D1;
      if (file.size <= 0 || file.size > maxBytes) {
        return json(
          {
            error: `El archivo debe pesar menos de ${(maxBytes / 1024 / 1024).toFixed(1)} MB.`,
          },
          corsHeaders,
          413
        );
      }

      const socio = await verificarSocio(db, rfc, email);
      if (!socio) {
        return json({ error: 'No autorizado para depositar en este buzón.' }, corsHeaders, 403);
      }

      const existente = await db
        .prepare(
          `SELECT id, estatus, storage, r2_key FROM canaco_documentos
           WHERE tenant_id = ? AND rfc = ? AND tipo_documento = ? LIMIT 1`
        )
        .bind(TENANT_CANACO, rfc, tipo)
        .first<{
          id: string;
          estatus: EstatusDocumentoCanaco;
          storage: string;
          r2_key: string | null;
        }>();

      if (existente?.estatus === 'aprobado') {
        return json(
          { error: 'Este documento ya fue cotejado y aprobado por la Cámara.' },
          corsHeaders,
          409
        );
      }

      const buffer = await file.arrayBuffer();
      const hash = await sha256Hex(buffer);
      const nombre = sanitizarNombre(file.name || `${tipo}.pdf`);
      const docId = existente?.id || crypto.randomUUID();
      let r2Key: string | null = null;
      let contenidoBase64: string | null = null;

      if (usaR2 && env.CANACO_DOCS) {
        r2Key = `canaco_merida/${rfc}/${tipo}/${crypto.randomUUID()}-${nombre}`;
        await env.CANACO_DOCS.put(r2Key, buffer, {
          httpMetadata: { contentType: mime },
          customMetadata: { rfc, tipo, sha256: hash },
        });
      } else {
        contenidoBase64 = bufferToBase64(buffer);
      }

      if (existente) {
        await db
          .prepare(
            `UPDATE canaco_documentos
             SET nombre_archivo = ?, mime_type = ?, tamano_bytes = ?, sha256 = ?, storage = ?,
                 r2_key = ?, contenido_base64 = ?, estatus = 'recibido', motivo_rechazo = NULL,
                 revisado_por = NULL, revisado_at = NULL, lead_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = ?`
          )
          .bind(
            nombre,
            mime,
            file.size,
            hash,
            usaR2 ? 'r2' : 'd1',
            r2Key,
            contenidoBase64,
            socio.id,
            docId,
            TENANT_CANACO
          )
          .run();

        if (existente.storage === 'r2' && existente.r2_key && env.CANACO_DOCS) {
          await env.CANACO_DOCS.delete(existente.r2_key).catch(() => undefined);
        }
      } else {
        await db
          .prepare(
            `INSERT INTO canaco_documentos (
               id, tenant_id, rfc, lead_id, tipo_documento, nombre_archivo, mime_type,
               tamano_bytes, sha256, storage, r2_key, contenido_base64, estatus,
               created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibido', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
          .bind(
            docId,
            TENANT_CANACO,
            rfc,
            socio.id,
            tipo,
            nombre,
            mime,
            file.size,
            hash,
            usaR2 ? 'r2' : 'd1',
            r2Key,
            contenidoBase64
          )
          .run();
      }

      const slots = construirSlots(rfc, await listarDocumentos(db, rfc));
      return json(
        {
          ok: true,
          acuse: {
            folio: `ACUSE-${rfc.slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`,
            tipoDocumento: tipo,
            nombreArchivo: nombre,
            sha256: hash,
            recibidoEn: new Date().toISOString(),
          },
          ...resumirSlots(slots),
          slots,
        },
        corsHeaders,
        201
      );
    }

    // ───────────────────────────────────────────────────────────────
    // CÁMARA (ADMIN): resumen, expediente, archivo y dictamen
    // ───────────────────────────────────────────────────────────────
    if (path.startsWith('/api/canaco/buzon/admin/')) {
      if (!esAdminCanaco(principal)) {
        return json({ error: 'No autorizado para consultar expedientes.' }, corsHeaders, 403);
      }

      if (path === '/api/canaco/buzon/admin/resumen' && request.method === 'GET') {
        const { results } = await db
          .prepare(
            `SELECT rfc,
                    SUM(CASE WHEN estatus IN ('recibido', 'aprobado') THEN 1 ELSE 0 END) AS depositados,
                    SUM(CASE WHEN estatus = 'aprobado' THEN 1 ELSE 0 END) AS aprobados,
                    SUM(CASE WHEN estatus = 'rechazado' THEN 1 ELSE 0 END) AS rechazados
             FROM canaco_documentos WHERE tenant_id = ? GROUP BY rfc`
          )
          .bind(TENANT_CANACO)
          .all<{ rfc: string; depositados: number; aprobados: number; rechazados: number }>();

        const resumen: Record<
          string,
          { depositados: number; aprobados: number; rechazados: number; requeridos: number }
        > = {};
        for (const row of results || []) {
          resumen[row.rfc] = {
            depositados: Number(row.depositados) || 0,
            aprobados: Number(row.aprobados) || 0,
            rechazados: Number(row.rechazados) || 0,
            requeridos: documentosRequeridos(tipoPersonaPorRfc(row.rfc)).length,
          };
        }
        return json({ ok: true, resumen }, corsHeaders);
      }

      if (path === '/api/canaco/buzon/admin/expediente' && request.method === 'GET') {
        const rfc = normalizarRfc(url.searchParams.get('rfc'));
        if (!rfcEsValido(rfc)) return json({ error: 'RFC inválido.' }, corsHeaders, 400);
        const documentos = await listarDocumentos(db, rfc);
        const slots = construirSlots(rfc, documentos);
        const idsPorTipo = Object.fromEntries(documentos.map((d) => [d.tipo_documento, d.id]));
        return json(
          {
            ok: true,
            rfc,
            tipoPersona: tipoPersonaPorRfc(rfc),
            ...resumirSlots(slots),
            slots: slots.map((s) => ({ ...s, id: idsPorTipo[s.tipo] || null })),
          },
          corsHeaders
        );
      }

      if (path === '/api/canaco/buzon/admin/archivo' && request.method === 'GET') {
        const id = url.searchParams.get('id') || '';
        const doc = await db
          .prepare(
            `SELECT id, nombre_archivo, mime_type, storage, r2_key, contenido_base64
             FROM canaco_documentos WHERE id = ? AND tenant_id = ? LIMIT 1`
          )
          .bind(id, TENANT_CANACO)
          .first<{
            id: string;
            nombre_archivo: string;
            mime_type: string;
            storage: 'r2' | 'd1';
            r2_key: string | null;
            contenido_base64: string | null;
          }>();
        if (!doc) return json({ error: 'Documento no encontrado.' }, corsHeaders, 404);

        let cuerpo: BodyInit | null = null;
        if (doc.storage === 'r2' && doc.r2_key && env.CANACO_DOCS) {
          const objeto = await env.CANACO_DOCS.get(doc.r2_key);
          cuerpo = objeto ? (objeto.body as unknown as BodyInit) : null;
        } else if (doc.contenido_base64) {
          const bytes = base64ToBytes(doc.contenido_base64);
          cuerpo = bytes.buffer as unknown as BodyInit;
        }
        if (!cuerpo) return json({ error: 'Archivo no disponible.' }, corsHeaders, 404);

        return new Response(
          cuerpo,
          noStore(corsHeaders, 200, {
            'Content-Type': doc.mime_type,
            'Content-Disposition': `inline; filename="${doc.nombre_archivo}"`,
            'X-Content-Type-Options': 'nosniff',
          })
        );
      }

      if (path === '/api/canaco/buzon/admin/dictaminar' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          id?: unknown;
          estatus?: unknown;
          motivo?: unknown;
        };
        const id = typeof body.id === 'string' ? body.id : '';
        const estatus = body.estatus;
        const motivo = typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 500) : '';
        if (!id || (estatus !== 'aprobado' && estatus !== 'rechazado')) {
          return json({ error: 'Dictamen inválido.' }, corsHeaders, 400);
        }
        if (estatus === 'rechazado' && !motivo) {
          return json({ error: 'Indica el motivo del rechazo para el socio.' }, corsHeaders, 400);
        }

        await db
          .prepare(
            `UPDATE canaco_documentos
             SET estatus = ?, motivo_rechazo = ?, revisado_por = ?, revisado_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = ?`
          )
          .bind(
            estatus,
            estatus === 'rechazado' ? motivo : null,
            principal?.email || 'canaco',
            id,
            TENANT_CANACO
          )
          .run();
        return json({ ok: true, id, estatus }, corsHeaders);
      }
    }

    return null;
  } catch (err) {
    console.error('[Buzón CANACO] Error', err);
    return json({ error: 'Error al procesar el buzón documental.' }, corsHeaders, 500);
  }
}
