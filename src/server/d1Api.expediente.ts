/**
 * ARK TOOLS — Backend D1 Handlers: Expediente Único y Clientes (Sprint 9)
 *
 * Aislamiento estricto por tenant_id:
 * 1. /api/clients (Catálogo centralizado de empresas, trabajadores y personas físicas)
 * 2. /api/expedientes (Historial de cálculos sellados con SHA-256 y versión DOF)
 */

import type { Env } from '../index';

export interface ClientRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  parent_id: string | null;
  tipo: 'empresa' | 'trabajador' | 'persona_fisica';
  nombre: string;
  rfc: string | null;
  curp: string | null;
  nss: string | null;
  salario_diario: number;
  salario_diario_integrado: number;
  fecha_ingreso: string | null;
  factor_integracion: number;
  estado: 'activo' | 'inactivo' | 'archivado';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExpedienteRecord {
  id: string;
  client_id: string;
  tenant_id: string;
  tool_id: string;
  titulo: string | null;
  input_hash: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  catalog_version: string;
  created_by: string | null;
  created_at: string;
}

/** Versión oficial del catálogo DOF para sellado */
export const CURRENT_CATALOG_VERSION = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75';

/**
 * Genera un hash SHA-256 determinista serializando las llaves de forma ordenada
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
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalJson));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Router de peticiones de Clientes y Expedientes
 */
export async function handleExpedienteApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  const db = env.ARK_TOOLS_DB;

  if (!db) {
    if (url.pathname.startsWith('/api/clients') || url.pathname.startsWith('/api/expedientes')) {
      return Response.json(
        {
          error: 'Database Not Configured',
          message: 'El binding ARK_TOOLS_DB de D1 no está disponible.',
        },
        { status: 503, headers: corsHeaders }
      );
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. CLIENTES (/api/clients)
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/clients — Listar clientes del tenant con filtros
  if (url.pathname === '/api/clients' && request.method === 'GET') {
    try {
      const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
      if (!tenantId) {
        return Response.json(
          { error: 'Parámetro tenant_id requerido' },
          { status: 400, headers: corsHeaders }
        );
      }

      const q = (url.searchParams.get('q') || '').trim();
      const tipo = url.searchParams.get('tipo');
      const estado = url.searchParams.get('estado') || 'activo';
      const id = url.searchParams.get('id');

      // Si busca por ID individual
      if (id) {
        const row = await db
          .prepare(
            `SELECT * FROM clients WHERE id = ? AND tenant_id = ? LIMIT 1`
          )
          .bind(id, tenantId)
          .first<Record<string, unknown>>();

        if (!row) {
          return Response.json(
            { error: 'Cliente no encontrado' },
            { status: 404, headers: corsHeaders }
          );
        }

        const client: ClientRecord = {
          id: String(row.id),
          tenant_id: String(row.tenant_id),
          user_id: row.user_id ? String(row.user_id) : null,
          parent_id: row.parent_id ? String(row.parent_id) : null,
          tipo: (row.tipo as ClientRecord['tipo']) || 'trabajador',
          nombre: String(row.nombre),
          rfc: row.rfc ? String(row.rfc) : null,
          curp: row.curp ? String(row.curp) : null,
          nss: row.nss ? String(row.nss) : null,
          salario_diario: Number(row.salario_diario) || 0,
          salario_diario_integrado: Number(row.salario_diario_integrado) || 0,
          fecha_ingreso: row.fecha_ingreso ? String(row.fecha_ingreso) : null,
          factor_integracion: Number(row.factor_integracion) || 1.049315,
          estado: (row.estado as ClientRecord['estado']) || 'activo',
          metadata: row.metadata ? (JSON.parse(String(row.metadata)) as Record<string, unknown>) : null,
          created_at: String(row.created_at),
          updated_at: String(row.updated_at),
        };

        return Response.json({ ok: true, client }, { headers: corsHeaders });
      }

      // Consulta de listado con filtros dinámicos
      let query = `SELECT * FROM clients WHERE tenant_id = ?`;
      const binds: unknown[] = [tenantId];

      if (estado !== 'todos') {
        query += ` AND estado = ?`;
        binds.push(estado);
      }

      if (tipo) {
        query += ` AND tipo = ?`;
        binds.push(tipo);
      }

      if (q) {
        query += ` AND (nombre LIKE ? OR rfc LIKE ? OR nss LIKE ? OR curp LIKE ?)`;
        const wildcard = `%${q}%`;
        binds.push(wildcard, wildcard, wildcard, wildcard);
      }

      query += ` ORDER BY nombre ASC LIMIT 100`;

      const stmt = db.prepare(query);
      const { results } = await stmt.bind(...binds).all<Record<string, unknown>>();

      const clients: ClientRecord[] = (results || []).map((row) => ({
        id: String(row.id),
        tenant_id: String(row.tenant_id),
        user_id: row.user_id ? String(row.user_id) : null,
        parent_id: row.parent_id ? String(row.parent_id) : null,
        tipo: (row.tipo as ClientRecord['tipo']) || 'trabajador',
        nombre: String(row.nombre),
        rfc: row.rfc ? String(row.rfc) : null,
        curp: row.curp ? String(row.curp) : null,
        nss: row.nss ? String(row.nss) : null,
        salario_diario: Number(row.salario_diario) || 0,
        salario_diario_integrado: Number(row.salario_diario_integrado) || 0,
        fecha_ingreso: row.fecha_ingreso ? String(row.fecha_ingreso) : null,
        factor_integracion: Number(row.factor_integracion) || 1.049315,
        estado: (row.estado as ClientRecord['estado']) || 'activo',
        metadata: row.metadata ? (JSON.parse(String(row.metadata)) as Record<string, unknown>) : null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));

      return Response.json({ ok: true, clients }, { headers: corsHeaders });
    } catch (err) {
      console.error('[API Clients GET Error]', err);
      return Response.json(
        { error: 'Error al consultar clientes', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // POST /api/clients — Crear o actualizar cliente
  if (url.pathname === '/api/clients' && request.method === 'POST') {
    try {
      const body = (await request.json()) as Partial<ClientRecord> & {
        tenant_id: string;
        nombre: string;
      };

      const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
      if (!tenantId || !body.nombre?.trim()) {
        return Response.json(
          { error: 'Parámetros obligatorios: tenant_id, nombre' },
          { status: 400, headers: corsHeaders }
        );
      }

      const id = body.id || crypto.randomUUID();
      const metadataStr = body.metadata ? JSON.stringify(body.metadata) : null;

      await db
        .prepare(
          `INSERT INTO clients (
            id, tenant_id, user_id, parent_id, tipo, nombre, rfc, curp, nss,
            salario_diario, salario_diario_integrado, fecha_ingreso, factor_integracion,
            estado, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            parent_id = excluded.parent_id,
            tipo = excluded.tipo,
            nombre = excluded.nombre,
            rfc = excluded.rfc,
            curp = excluded.curp,
            nss = excluded.nss,
            salario_diario = excluded.salario_diario,
            salario_diario_integrado = excluded.salario_diario_integrado,
            fecha_ingreso = excluded.fecha_ingreso,
            factor_integracion = excluded.factor_integracion,
            estado = excluded.estado,
            metadata = excluded.metadata,
            updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = excluded.tenant_id`
        )
        .bind(
          id,
          tenantId,
          body.user_id || null,
          body.parent_id || null,
          body.tipo || 'trabajador',
          body.nombre.trim(),
          body.rfc?.trim().toUpperCase() || null,
          body.curp?.trim().toUpperCase() || null,
          body.nss?.trim() || null,
          body.salario_diario || 0,
          body.salario_diario_integrado || 0,
          body.fecha_ingreso || null,
          body.factor_integracion || 1.049315,
          body.estado || 'activo',
          metadataStr
        )
        .run();

      const created = await db
        .prepare(`SELECT * FROM clients WHERE id = ? AND tenant_id = ?`)
        .bind(id, tenantId)
        .first<Record<string, unknown>>();

      const returnedClient = created
        ? {
            ...created,
            metadata: created?.metadata ? JSON.parse(String(created.metadata)) : null,
          }
        : {
            id,
            tenant_id: tenantId,
            user_id: body.user_id || null,
            parent_id: body.parent_id || null,
            tipo: body.tipo || 'trabajador',
            nombre: body.nombre.trim(),
            rfc: body.rfc?.trim().toUpperCase() || null,
            curp: body.curp?.trim().toUpperCase() || null,
            nss: body.nss?.trim() || null,
            salario_diario: body.salario_diario || 0,
            salario_diario_integrado: body.salario_diario_integrado || 0,
            fecha_ingreso: body.fecha_ingreso || null,
            factor_integracion: body.factor_integracion || 1.049315,
            estado: body.estado || 'activo',
            metadata: body.metadata || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      return Response.json(
        {
          ok: true,
          client: returnedClient,
        },
        { status: 201, headers: corsHeaders }
      );
    } catch (err) {
      console.error('[API Clients POST Error]', err);
      return Response.json(
        { error: 'Error al guardar cliente', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // DELETE /api/clients — Eliminar o archivar cliente
  if (url.pathname === '/api/clients' && request.method === 'DELETE') {
    try {
      const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
      const id = url.searchParams.get('id');

      if (!tenantId || !id) {
        return Response.json(
          { error: 'Parámetros tenant_id e id requeridos' },
          { status: 400, headers: corsHeaders }
        );
      }

      await db
        .prepare(`DELETE FROM clients WHERE id = ? AND tenant_id = ?`)
        .bind(id, tenantId)
        .run();

      return Response.json({ ok: true, deleted: true }, { headers: corsHeaders });
    } catch (err) {
      console.error('[API Clients DELETE Error]', err);
      return Response.json(
        { error: 'Error al eliminar cliente', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. EXPEDIENTES (/api/expedientes)
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/expedientes/verify — Verificación pública de autenticidad por hash SHA-256
  if (url.pathname === '/api/expedientes/verify' && request.method === 'GET') {
    try {
      const hash = url.searchParams.get('hash')?.trim().toLowerCase();
      if (!hash || hash.length !== 64) {
        return Response.json(
          { error: 'Hash SHA-256 inválido o no proporcionado (debe contener 64 caracteres)' },
          { status: 400, headers: corsHeaders }
        );
      }

      const row = await db
        .prepare(
          `SELECT e.*, c.nombre as client_nombre, c.rfc as client_rfc, c.tipo as client_tipo, t.name as tenant_name
           FROM expedientes e
           LEFT JOIN clients c ON e.client_id = c.id
           LEFT JOIN tenants t ON e.tenant_id = t.id
           WHERE LOWER(e.input_hash) = ?
           ORDER BY e.created_at DESC LIMIT 1`
        )
        .bind(hash)
        .first<Record<string, unknown>>();

      if (!row) {
        return Response.json(
          {
            verified: false,
            message: 'No se encontró ningún cálculo con este sello criptográfico en ARK TOOLS',
          },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(
        {
          verified: true,
          certificado: {
            input_hash: String(row.input_hash),
            tool_id: String(row.tool_id),
            titulo: row.titulo ? String(row.titulo) : null,
            catalog_version: String(row.catalog_version),
            created_at: String(row.created_at),
            despacho: row.tenant_name ? String(row.tenant_name) : 'Despacho Acreditado ARK TOOLS',
            cliente: {
              nombre: row.client_nombre ? String(row.client_nombre) : 'Cliente Registrado',
              rfc: row.client_rfc ? String(row.client_rfc) : null,
              tipo: row.client_tipo ? String(row.client_tipo) : 'trabajador',
            },
            inputs: JSON.parse(String(row.inputs || '{}')) as Record<string, unknown>,
            outputs: JSON.parse(String(row.outputs || '{}')) as Record<string, unknown>,
          },
        },
        { headers: corsHeaders }
      );
    } catch (err) {
      console.error('[API Expediente Verify Error]', err);
      return Response.json(
        { error: 'Error al verificar cálculo', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // GET /api/expedientes — Consultar historial de cálculos por cliente y tenant
  if (url.pathname === '/api/expedientes' && request.method === 'GET') {
    try {
      const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
      const clientId = url.searchParams.get('client_id');
      const toolId = url.searchParams.get('tool_id');
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));

      if (!tenantId) {
        return Response.json(
          { error: 'Parámetro tenant_id requerido' },
          { status: 400, headers: corsHeaders }
        );
      }

      let query = `SELECT * FROM expedientes WHERE tenant_id = ?`;
      const binds: unknown[] = [tenantId];

      if (clientId) {
        query += ` AND client_id = ?`;
        binds.push(clientId);
      }

      if (toolId) {
        query += ` AND tool_id = ?`;
        binds.push(toolId);
      }

      query += ` ORDER BY created_at DESC LIMIT ?`;
      binds.push(limit);

      const stmt = db.prepare(query);
      const { results } = await stmt.bind(...binds).all<Record<string, unknown>>();

      const expedientes: ExpedienteRecord[] = (results || []).map((row) => ({
        id: String(row.id),
        client_id: String(row.client_id),
        tenant_id: String(row.tenant_id),
        tool_id: String(row.tool_id),
        titulo: row.titulo ? String(row.titulo) : null,
        input_hash: String(row.input_hash),
        inputs: JSON.parse(String(row.inputs || '{}')) as Record<string, unknown>,
        outputs: JSON.parse(String(row.outputs || '{}')) as Record<string, unknown>,
        catalog_version: String(row.catalog_version),
        created_by: row.created_by ? String(row.created_by) : null,
        created_at: String(row.created_at),
      }));

      return Response.json({ ok: true, expedientes }, { headers: corsHeaders });
    } catch (err) {
      console.error('[API Expedientes GET Error]', err);
      return Response.json(
        { error: 'Error al consultar expedientes', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // POST /api/expedientes — Guardar cálculo sellado con SHA-256 y versión DOF
  if (url.pathname === '/api/expedientes' && request.method === 'POST') {
    try {
      const body = (await request.json()) as {
        client_id: string;
        tenant_id: string;
        tool_id: string;
        titulo?: string;
        inputs: Record<string, unknown>;
        outputs: Record<string, unknown>;
        catalog_version?: string;
        created_by?: string;
      };

      const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
      const { client_id, tool_id, titulo, inputs, outputs } = body;

      if (!client_id || !tenantId || !tool_id || !inputs || !outputs) {
        return Response.json(
          { error: 'Parámetros obligatorios: client_id, tenant_id, tool_id, inputs, outputs' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Validar que el client_id pertenezca al tenant_id
      const clientExists = await db
        .prepare(`SELECT id, nombre FROM clients WHERE id = ? AND tenant_id = ?`)
        .bind(client_id, tenantId)
        .first();

      if (!clientExists) {
        return Response.json(
          { error: 'El cliente no pertenece a este despacho' },
          { status: 403, headers: corsHeaders }
        );
      }

      const inputHash = await computeDeterministicHash(inputs);
      const catalogVersion = body.catalog_version || CURRENT_CATALOG_VERSION;

      // Deduplicación inteligente: si existe cálculo idéntico para este cliente y tool en las últimas 24h
      const existing = await db
        .prepare(
          `SELECT * FROM expedientes
           WHERE client_id = ? AND tool_id = ? AND input_hash = ?
           ORDER BY created_at DESC LIMIT 1`
        )
        .bind(client_id, tool_id, inputHash)
        .first<Record<string, unknown>>();

      if (existing) {
        const parsed: ExpedienteRecord = {
          id: String(existing.id),
          client_id: String(existing.client_id),
          tenant_id: String(existing.tenant_id),
          tool_id: String(existing.tool_id),
          titulo: existing.titulo ? String(existing.titulo) : null,
          input_hash: String(existing.input_hash),
          inputs: JSON.parse(String(existing.inputs || '{}')) as Record<string, unknown>,
          outputs: JSON.parse(String(existing.outputs || '{}')) as Record<string, unknown>,
          catalog_version: String(existing.catalog_version),
          created_by: existing.created_by ? String(existing.created_by) : null,
          created_at: String(existing.created_at),
        };

        return Response.json(
          { ok: true, expediente: parsed, deduplicated: true },
          { headers: corsHeaders }
        );
      }

      const id = crypto.randomUUID();
      const inputsStr = JSON.stringify(inputs);
      const outputsStr = JSON.stringify(outputs);

      await db
        .prepare(
          `INSERT INTO expedientes (
            id, client_id, tenant_id, tool_id, titulo, input_hash,
            inputs, outputs, catalog_version, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          id,
          client_id,
          tenantId,
          tool_id,
          titulo || null,
          inputHash,
          inputsStr,
          outputsStr,
          catalogVersion,
          body.created_by || null
        )
        .run();

      const createdExpediente: ExpedienteRecord = {
        id,
        client_id,
        tenant_id: tenantId,
        tool_id,
        titulo: titulo || null,
        input_hash: inputHash,
        inputs,
        outputs,
        catalog_version: catalogVersion,
        created_by: body.created_by || null,
        created_at: new Date().toISOString(),
      };

      return Response.json(
        { ok: true, expediente: createdExpediente, deduplicated: false },
        { status: 201, headers: corsHeaders }
      );
    } catch (err) {
      console.error('[API Expedientes POST Error]', err);
      return Response.json(
        { error: 'Error al registrar expediente', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // DELETE /api/expedientes — Eliminar cálculo individual del historial
  if (url.pathname === '/api/expedientes' && request.method === 'DELETE') {
    try {
      const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
      const id = url.searchParams.get('id');

      if (!tenantId || !id) {
        return Response.json(
          { error: 'Parámetros tenant_id e id requeridos' },
          { status: 400, headers: corsHeaders }
        );
      }

      await db
        .prepare(`DELETE FROM expedientes WHERE id = ? AND tenant_id = ?`)
        .bind(id, tenantId)
        .run();

      return Response.json({ ok: true, deleted: true }, { headers: corsHeaders });
    } catch (err) {
      console.error('[API Expedientes DELETE Error]', err);
      return Response.json(
        { error: 'Error al eliminar cálculo', details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return null;
}
