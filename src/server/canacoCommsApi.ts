import type { Env } from '../index';
import { requireTenantMembership, type AuthPrincipal } from './auth';

const BASE_PATH = '/api/comms';
const ADMIN_EMAILS = new Set(['horus.i2d@gmail.com', 'pavel@arksystems.site']);
const MAX_AUDIENCE_SIZE = 5000;
const SQLITE_BIND_BATCH = 500;

interface StoredJob {
  job_id: string;
  tenant_id: string;
  idempotency_key: string;
  channel: string;
  audience_size: number;
  status: string;
  cost_estimate_json: string | null;
  preview_json: string | null;
  detail_json: string | null;
  receipt_json: string | null;
  draft_json: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DispatchBody extends Record<string, unknown> {
  idempotency_key?: unknown;
  contact_ids?: unknown;
  channel?: unknown;
  dry_run?: unknown;
}

function json(body: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
  });
}

function storedJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    console.error('[CANACO Comms] Invalid stored job JSON', error);
    return null;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function jobIdFrom(value: unknown): string | null {
  const response = objectValue(value);
  const job = objectValue(response.job);
  const id = response.job_id ?? response.jobId ?? response.id ?? job.job_id ?? job.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function responseStatus(value: unknown, fallback: string): string {
  const response = objectValue(value);
  const job = objectValue(response.job);
  const status = response.status ?? job.status;
  return typeof status === 'string' && status.trim() ? status : fallback;
}

function serialize(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error('No se pudo serializar la respuesta del worker.');
  return serialized;
}

function toPublicJob(row: StoredJob) {
  return {
    job_id: row.job_id,
    channel: row.channel,
    audience_size: row.audience_size,
    status: row.status,
    cost_estimate: storedJson(row.cost_estimate_json),
    preview: storedJson(row.preview_json),
    detail: storedJson(row.detail_json),
    receipt: storedJson(row.receipt_json),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function authorize(
  env: Env,
  principal: AuthPrincipal | null,
  tenantId: string
): Promise<boolean> {
  if (!principal) return false;
  if (ADMIN_EMAILS.has(principal.email.toLowerCase())) return true;
  const membership = await requireTenantMembership(env, principal, tenantId);
  return membership !== null && membership.role !== 'member';
}

function configured(env: Env): {
  workerUrl: string;
  internalKey: string;
  tenantId: string;
} | null {
  const workerUrl = env.SALES_WORKER_URL?.trim();
  const internalKey = env.SALES_WORKER_INTERNAL_KEY?.trim();
  const tenantId = env.CANACO_SALES_TENANT_ID?.trim();
  if (!workerUrl || !internalKey || !tenantId || !env.ARK_TOOLS_DB) return null;
  return { workerUrl, internalKey, tenantId };
}

async function forward(
  config: NonNullable<ReturnType<typeof configured>>,
  path: string,
  method: 'GET' | 'POST',
  body?: unknown
): Promise<{ response: Response; data: unknown }> {
  const target = new URL(path, config.workerUrl);
  const headers = new Headers({ 'X-Ark-Internal-Key': config.internalKey });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(target, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: 'La respuesta del worker Sales no es JSON válido.' };
    }
  }
  return { response, data };
}

async function eligibleContactIds(
  env: Env,
  tenantId: string,
  requestedIds: string[]
): Promise<string[]> {
  const db = env.ARK_TOOLS_DB;
  if (!db) throw new Error('D1 no está disponible para validar la audiencia.');
  const eligible = new Set<string>();
  for (let offset = 0; offset < requestedIds.length; offset += SQLITE_BIND_BATCH) {
    const batch = requestedIds.slice(offset, offset + SQLITE_BIND_BATCH);
    const placeholders = batch.map(() => '?').join(', ');
    const result = await db
      .prepare(
        `SELECT id FROM leads_ark_tools
         WHERE tenant_id = ? AND COALESCE(is_demo, 0) = 0
           AND COALESCE(arkangel_share_consent, 0) = 1
           AND consent_accepted_at IS NOT NULL
           AND id IN (${placeholders})`
      )
      .bind(tenantId, ...batch)
      .all<{ id: string }>();
    for (const row of result.results || []) eligible.add(row.id);
  }
  return requestedIds.filter((id) => eligible.has(id));
}

async function saveDispatch(
  env: Env,
  tenantId: string,
  principal: AuthPrincipal,
  body: DispatchBody,
  audienceSize: number,
  draftBody: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const db = env.ARK_TOOLS_DB;
  const id = jobIdFrom(data);
  if (!db || !id) throw new Error('La respuesta del worker no incluye job_id.');
  const response = objectValue(data);
  const job = objectValue(response.job);
  const preview = response.preview ?? job.preview ?? null;
  const costEstimate = response.cost_estimate ?? job.cost_estimate ?? null;
  const status = responseStatus(data, 'pending_approval');
  const channel = String(body.channel);
  const idempotencyKey = String(body.idempotency_key);

  await db
    .prepare(
      `INSERT INTO canaco_comms_jobs
         (job_id, tenant_id, idempotency_key, channel, audience_size, status,
          cost_estimate_json, preview_json, detail_json, draft_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(job_id) DO UPDATE SET
         status = excluded.status,
         cost_estimate_json = excluded.cost_estimate_json,
         preview_json = excluded.preview_json,
         detail_json = excluded.detail_json,
         draft_json = excluded.draft_json,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      id,
      tenantId,
      idempotencyKey,
      channel,
      audienceSize,
      status,
      costEstimate == null ? null : serialize(costEstimate),
      preview == null ? null : serialize(preview),
      serialize(data),
      serialize(draftBody),
      principal.email
    )
    .run();
}

async function updateJob(
  env: Env,
  tenantId: string,
  jobId: string,
  status: string,
  detail: unknown,
  receipt?: unknown
): Promise<void> {
  const db = env.ARK_TOOLS_DB;
  if (!db) throw new Error('D1 no está disponible para registrar el trabajo.');
  await db
    .prepare(
      `UPDATE canaco_comms_jobs
       SET status = ?, detail_json = ?,
           receipt_json = COALESCE(?, receipt_json),
           updated_at = CURRENT_TIMESTAMP
       WHERE job_id = ? AND tenant_id = ?`
    )
    .bind(
      status,
      serialize(detail),
      receipt === undefined ? null : serialize(receipt),
      jobId,
      tenantId
    )
    .run();
}

export async function handleCanacoCommsApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(`${BASE_PATH}/`)) return null;

  const config = configured(env);
  if (!config) {
    return json(
      { error: 'La integración de comunicaciones no está configurada en el Worker Ledger.' },
      corsHeaders,
      503
    );
  }
  if (!principal) {
    return json({ error: 'Autenticación requerida.' }, corsHeaders, 401);
  }
  if (!(await authorize(env, principal, config.tenantId))) {
    return json({ error: 'Se requiere administración de CANACO.' }, corsHeaders, 403);
  }

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return json({ error: 'D1 no está disponible.' }, corsHeaders, 503);
  }

  if (url.pathname === `${BASE_PATH}/templates` && request.method === 'GET') {
    try {
      const { response, data } = await forward(config, '/templates', 'GET');
      return json(data, corsHeaders, response.status);
    } catch (error) {
      console.error('[CANACO Comms] Sales templates request failed', error);
      return json({ error: 'No se pudieron cargar las plantillas de Sales.' }, corsHeaders, 502);
    }
  }

  if (url.pathname === `${BASE_PATH}/jobs` && request.method === 'GET') {
    try {
      const result = await db
        .prepare(
          `SELECT job_id, tenant_id, idempotency_key, channel, audience_size, status,
                  cost_estimate_json, preview_json, detail_json, receipt_json,
                  draft_json,
                  created_by, created_at, updated_at
           FROM canaco_comms_jobs WHERE tenant_id = ?
           ORDER BY created_at DESC`
        )
        .bind(config.tenantId)
        .all<StoredJob>();
      return json({ jobs: (result.results || []).map(toPublicJob) }, corsHeaders);
    } catch (error) {
      console.error('[CANACO Comms] Could not list CRM jobs', error);
      return json(
        { error: 'No se pudo consultar la lista de trabajos de comunicación.' },
        corsHeaders,
        500
      );
    }
  }

  if (url.pathname === `${BASE_PATH}/jobs` && request.method === 'POST') {
    let body: DispatchBody;
    try {
      body = (await request.json()) as DispatchBody;
    } catch {
      return json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, corsHeaders, 400);
    }
    const idempotencyKey = body.idempotency_key;
    const channel = body.channel;
    const contactIds = body.contact_ids;
    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.length < 16 ||
      idempotencyKey.length > 200 ||
      !['whatsapp', 'email', 'voice_ai'].includes(String(channel)) ||
      !Array.isArray(contactIds) ||
      contactIds.length === 0 ||
      contactIds.length > MAX_AUDIENCE_SIZE ||
      contactIds.some((id) => typeof id !== 'string' || id.length === 0) ||
      body.dry_run !== true
    ) {
      return json(
        {
          error: 'El borrador debe incluir audiencia válida y solicitar una vista previa dry-run.',
        },
        corsHeaders,
        400
      );
    }
    const uniqueIds = [...new Set(contactIds as string[])];
    if (uniqueIds.length !== contactIds.length) {
      return json({ error: 'La audiencia contiene identificadores duplicados.' }, corsHeaders, 400);
    }
    try {
      try {
        await db.prepare('SELECT job_id FROM canaco_comms_jobs LIMIT 0').all();
      } catch (error) {
        console.error('[CANACO Comms] CRM job storage is unavailable', error);
        return json(
          { error: 'El almacenamiento CRM de comunicaciones no está disponible.' },
          corsHeaders,
          503
        );
      }
      const allowedIds = await eligibleContactIds(env, config.tenantId, uniqueIds);
      if (!allowedIds.length) {
        return json(
          { error: 'No hay contactos elegibles con consentimiento vigente.' },
          corsHeaders,
          400
        );
      }
      const draftFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (key !== 'contact_ids') draftFields[key] = value;
      }
      const workerBody = {
        ...draftFields,
        tenant_id: config.tenantId,
        audience: { contact_ids: allowedIds },
      };
      const { response, data } = await forward(
        config,
        '/api/internal/campaigns/dispatch',
        'POST',
        workerBody
      );
      if (!response.ok) return json(data, corsHeaders, response.status);
      await saveDispatch(
        env,
        config.tenantId,
        principal,
        body,
        allowedIds.length,
        workerBody,
        data
      );
      return json(data, corsHeaders, response.status);
    } catch (error) {
      console.error('[CANACO Comms] Dispatch request failed', error);
      return json(
        { error: error instanceof Error ? error.message : 'No se pudo crear el trabajo.' },
        corsHeaders,
        502
      );
    }
  }

  const jobMatch = url.pathname.match(
    /^\/api\/comms\/jobs\/([^/]+)(?:\/(preview|approve|receipt|pause|resume))?$/
  );
  if (!jobMatch) return json({ error: 'Ruta de comunicaciones no encontrada.' }, corsHeaders, 404);
  let jobId: string;
  try {
    jobId = decodeURIComponent(jobMatch[1] || '');
  } catch {
    return json({ error: 'Identificador de trabajo inválido.' }, corsHeaders, 400);
  }
  if (!jobId || jobId.length > 200) {
    return json({ error: 'Identificador de trabajo inválido.' }, corsHeaders, 400);
  }

  try {
    const stored = await db
      .prepare(
        `SELECT job_id, draft_json, status FROM canaco_comms_jobs
         WHERE job_id = ? AND tenant_id = ? LIMIT 1`
      )
      .bind(jobId, config.tenantId)
      .first<{ job_id: string; draft_json: string | null; status: string }>();
    if (!stored)
      return json({ error: 'Trabajo no encontrado en el CRM CANACO.' }, corsHeaders, 404);

    const action = jobMatch[2];
    if (!action && request.method === 'GET') {
      const { response, data } = await forward(
        config,
        `/api/internal/campaigns/${encodeURIComponent(jobId)}`,
        'GET'
      );
      if (response.ok) {
        const receipt = nestedReceipt(data);
        await updateJob(
          env,
          config.tenantId,
          jobId,
          responseStatus(data, 'pending_approval'),
          data,
          receipt
        );
      }
      return json(data, corsHeaders, response.status);
    }
    if (!action || request.method !== 'POST') {
      return json({ error: 'Método no permitido para este trabajo.' }, corsHeaders, 405);
    }

    if (action === 'preview') {
      if (stored.status !== 'pending_approval') {
        return json(
          { error: 'Solo se puede renovar la vista previa de un trabajo pendiente.' },
          corsHeaders,
          409
        );
      }
      const draftBody = storedJson(stored.draft_json);
      if (!draftBody || typeof draftBody !== 'object' || Array.isArray(draftBody)) {
        return json(
          { error: 'No hay borrador de vista previa guardado para este trabajo.' },
          corsHeaders,
          409
        );
      }
      const { response, data } = await forward(
        config,
        '/api/internal/campaigns/dispatch',
        'POST',
        draftBody
      );
      if (response.ok) {
        await saveDispatch(
          env,
          config.tenantId,
          principal,
          {
            channel: String((draftBody as Record<string, unknown>).channel || ''),
            idempotency_key: String((draftBody as Record<string, unknown>).idempotency_key || ''),
          },
          Array.isArray((draftBody as Record<string, unknown>).audience)
            ? ((draftBody as Record<string, unknown>).audience as unknown[]).length
            : Array.isArray(
                  objectValue((draftBody as Record<string, unknown>).audience).contact_ids
                )
              ? (
                  objectValue((draftBody as Record<string, unknown>).audience)
                    .contact_ids as unknown[]
                ).length
              : 1,
          draftBody as Record<string, unknown>,
          data
        );
      }
      return json(data, corsHeaders, response.status);
    }

    let body: unknown = {};
    if (action === 'receipt') {
      try {
        body = await request.json();
      } catch {
        return json({ error: 'El recibo debe ser JSON válido.' }, corsHeaders, 400);
      }
    }
    const { response, data } = await forward(
      config,
      `/api/internal/campaigns/${encodeURIComponent(jobId)}/${action}`,
      'POST',
      body
    );
    if (!response.ok) return json(data, corsHeaders, response.status);

    const fallbackStatus =
      action === 'approve'
        ? 'approved'
        : action === 'pause'
          ? 'paused'
          : action === 'resume'
            ? 'running'
            : responseStatus(data, 'completed');
    await updateJob(
      env,
      config.tenantId,
      jobId,
      responseStatus(data, fallbackStatus),
      data,
      action === 'receipt' ? body : undefined
    );
    return json(data, corsHeaders, response.status);
  } catch (error) {
    console.error('[CANACO Comms] Job request failed', error);
    return json({ error: 'No se pudo completar la operación del trabajo.' }, corsHeaders, 502);
  }
}

function nestedReceipt(value: unknown): unknown | undefined {
  const response = objectValue(value);
  const job = objectValue(response.job);
  return response.receipt ?? job.receipt;
}
