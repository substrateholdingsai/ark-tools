/**
 * ARK LEDGER — Invitaciones a Despachos y Gestión de Miembros
 *
 * Endpoints para colaboración en equipo:
 * 1. GET    /api/tenants/:id/members — Lista de miembros activos e invitaciones pendientes
 * 2. POST   /api/tenants/:id/invitations — Crear y enviar invitación por correo
 * 3. DELETE /api/tenants/:id/invitations/:invId — Revocar invitación pendiente
 * 4. DELETE /api/tenants/:id/members/:userId — Remover miembro o abandonar despacho
 * 5. PATCH  /api/tenants/:id/members/:userId — Cambiar rol de miembro (admin <-> member)
 * 6. GET    /api/invitations/info?token=... — Consultar datos públicos de una invitación
 * 7. POST   /api/invitations/accept — Aceptar invitación y unirse al despacho
 */

import type { Env } from '../index';
import {
  type AuthPrincipal,
  cookieHeader,
  createSession,
  getTenantMemberships,
  hashPassword,
  passwordIsValid,
  publicSession,
  randomToken,
  rateLimit,
  requireTenantMembership,
  sha256,
  verifyPassword,
} from './auth';

const INVITATION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function json(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200,
  extraHeaders?: HeadersInit
): Response {
  const headers = new Headers(corsHeaders);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return Response.json(body, { status, headers });
}

async function sendInvitationEmail(
  env: Env,
  to: string,
  inviterName: string,
  tenantName: string,
  role: 'admin' | 'member',
  token: string
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    console.warn('[Invitations] Resend not configured, skipping email delivery');
    return;
  }

  const url = new URL('/', env.APP_URL);
  url.searchParams.set('auth', 'invite');
  url.searchParams.set('token', token);
  const inviteUrl = url.toString();
  const roleLabel = role === 'admin' ? 'Administrador' : 'Colaborador';
  const subject = `Invitación para unirte a ${tenantName} en ARK LEDGER`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">ARK LEDGER</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Plataforma Integral para Contadores y Asesores Fiscales</p>
  </div>
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="font-size: 16px; line-height: 24px; margin-top: 0;">
      Hola,
    </p>
    <p style="font-size: 16px; line-height: 24px;">
      <strong>${inviterName}</strong> te ha invitado a unirte y colaborar en el despacho <strong>${tenantName}</strong> con el rol de <strong>${roleLabel}</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Aceptar Invitación
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b; line-height: 20px;">
      Al unirte, tendrás acceso a los clientes, expedientes fiscales y herramientas del despacho.
    </p>
    <p style="font-size: 13px; color: #94a3b8; line-height: 18px; margin-bottom: 0;">
      Este enlace es válido durante 7 días. Si no esperabas esta invitación o consideras que se trata de un error, puedes ignorar este correo de forma segura.
    </p>
  </div>
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p>ARK LEDGER © ${new Date().getFullYear()} — <a href="https://ledger.arksystems.site" style="color: #64748b;">ledger.arksystems.site</a></p>
  </div>
</div>
`;

  const text = `Hola,

${inviterName} te ha invitado a unirte al despacho "${tenantName}" como ${roleLabel} en ARK LEDGER.

Para aceptar la invitación y acceder a la plataforma, haz clic en el siguiente enlace:
${inviteUrl}

Este enlace es válido durante 7 días. Si no esperabas este mensaje, puedes ignorarlo de forma segura.

ARK LEDGER
https://ledger.arksystems.site`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    console.error('[Invitations email] Resend rejected invitation message', response.status);
    throw new Error('No se pudo enviar el correo de invitación');
  }
}

async function getEffectiveRole(
  env: Env,
  principal: AuthPrincipal,
  tenantId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  const membership = await requireTenantMembership(env, principal, tenantId);
  if (membership) return membership.role;
  if (principal.platformRole === 'super_admin') return 'owner';
  return null;
}

export async function handleInvitationsApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  // ─────────────────────────────────────────────────────────────────
  // 1. PUBLIC: GET /api/invitations/info?token=...
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/invitations/info' && request.method === 'GET') {
    const token = url.searchParams.get('token');
    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      return json({ valid: false, error: 'Token de invitación inválido.' }, corsHeaders, 400);
    }
    const db = env.ARK_TOOLS_DB;
    if (!db) return json({ error: 'Base de datos no disponible.' }, corsHeaders, 503);

    const tokenHash = await sha256(token);
    const invitation = await db
      .prepare(
        `SELECT i.id, i.tenant_id, i.email, i.role, i.created_at, i.expires_at, i.accepted_at, i.revoked_at,
                t.name AS tenant_name,
                u.email AS inviter_email, COALESCE(u.full_name, '') AS inviter_name
         FROM tenant_invitations i
         JOIN tenants t ON t.id = i.tenant_id
         JOIN users u ON u.id = i.invited_by
         WHERE i.token_hash = ?
         LIMIT 1`
      )
      .bind(tokenHash)
      .first<{
        id: string;
        tenant_id: string;
        email: string;
        role: 'admin' | 'member';
        created_at: number;
        expires_at: number;
        accepted_at: number | null;
        revoked_at: number | null;
        tenant_name: string;
        inviter_email: string;
        inviter_name: string;
      }>();

    if (!invitation) {
      return json(
        { valid: false, error: 'Invitación no encontrada o enlace inválido.' },
        corsHeaders,
        404
      );
    }
    if (invitation.revoked_at) {
      return json(
        { valid: false, error: 'Esta invitación ha sido revocada por el despacho.' },
        corsHeaders,
        410
      );
    }
    if (invitation.accepted_at) {
      return json(
        { valid: false, error: 'Esta invitación ya fue aceptada previamente.' },
        corsHeaders,
        410
      );
    }
    const now = Math.floor(Date.now() / 1000);
    if (invitation.expires_at < now) {
      return json(
        { valid: false, error: 'Esta invitación ha expirado (tenía vigencia de 7 días).' },
        corsHeaders,
        410
      );
    }

    const existingUser = await db
      .prepare('SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1')
      .bind(invitation.email)
      .first<{ id: string }>();

    return json(
      {
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          tenantName: invitation.tenant_name,
          role: invitation.role,
          inviterName: invitation.inviter_name || invitation.inviter_email,
          expiresAt: invitation.expires_at,
        },
        userExists: Boolean(existingUser),
      },
      corsHeaders,
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. PUBLIC/AUTH: POST /api/invitations/accept
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/invitations/accept' && request.method === 'POST') {
    const db = env.ARK_TOOLS_DB;
    if (!db) return json({ error: 'Base de datos no disponible.' }, corsHeaders, 503);

    const body = (await request.json()) as {
      token?: unknown;
      password?: unknown;
      fullName?: unknown;
    } | null;

    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      return json({ error: 'Token de invitación no válido.' }, corsHeaders, 400);
    }

    const tokenHash = await sha256(token);
    const invitation = await db
      .prepare(
        `SELECT i.id, i.tenant_id, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at,
                t.name AS tenant_name
         FROM tenant_invitations i
         JOIN tenants t ON t.id = i.tenant_id
         WHERE i.token_hash = ?
         LIMIT 1`
      )
      .bind(tokenHash)
      .first<{
        id: string;
        tenant_id: string;
        email: string;
        role: 'admin' | 'member';
        expires_at: number;
        accepted_at: number | null;
        revoked_at: number | null;
        tenant_name: string;
      }>();

    if (!invitation) {
      return json({ error: 'Invitación no encontrada o enlace inválido.' }, corsHeaders, 404);
    }
    if (invitation.revoked_at) {
      return json({ error: 'Esta invitación ha sido revocada por el despacho.' }, corsHeaders, 410);
    }
    if (invitation.accepted_at) {
      return json({ error: 'Esta invitación ya fue aceptada previamente.' }, corsHeaders, 410);
    }
    const now = Math.floor(Date.now() / 1000);
    if (invitation.expires_at < now) {
      return json({ error: 'Esta invitación ha expirado.' }, corsHeaders, 410);
    }

    let targetUserId: string;

    if (principal) {
      // Usuario autenticado en la sesión actual
      if (principal.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return json(
          {
            error: `La invitación fue enviada a ${invitation.email}, pero tienes una sesión activa como ${principal.email}. Por favor cierra sesión o inicia sesión con la cuenta correspondiente.`,
          },
          corsHeaders,
          403
        );
      }
      targetUserId = principal.id;
    } else {
      // Usuario no autenticado: verificar si existe o si se registra
      const existingUser = await db
        .prepare(
          `SELECT id, email, password_hash, email_verified_at FROM users WHERE lower(email) = lower(?) LIMIT 1`
        )
        .bind(invitation.email)
        .first<{
          id: string;
          email: string;
          password_hash: string | null;
          email_verified_at: number | null;
        }>();

      const password = typeof body?.password === 'string' ? body.password : '';

      if (existingUser) {
        if (!password) {
          return json(
            { error: 'Ingresa tu contraseña para aceptar la invitación e iniciar sesión.' },
            corsHeaders,
            400
          );
        }
        if (!existingUser.password_hash) {
          return json(
            { error: 'Esta cuenta aún no tiene contraseña configurada. Restablécela primero.' },
            corsHeaders,
            400
          );
        }
        const valid = await verifyPassword(password, existingUser.password_hash);
        if (!valid) {
          return json({ error: 'Contraseña incorrecta.' }, corsHeaders, 401);
        }
        targetUserId = existingUser.id;

        // Si su correo no estaba verificado, la invitación sirve como prueba de propiedad
        if (!existingUser.email_verified_at) {
          await db
            .prepare('UPDATE users SET email_verified_at = ? WHERE id = ?')
            .bind(now, existingUser.id)
            .run();
        }
      } else {
        // Registro de nuevo usuario a través de la invitación
        if (!password || !passwordIsValid(password)) {
          return json(
            { error: 'La contraseña debe tener entre 15 y 128 caracteres.' },
            corsHeaders,
            400
          );
        }
        targetUserId = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);
        const fullName =
          typeof body?.fullName === 'string' && body.fullName.trim()
            ? body.fullName.trim().slice(0, 120)
            : invitation.email.split('@')[0];

        await db
          .prepare(
            `INSERT INTO users (id, email, full_name, password_hash, email_verified_at, platform_role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
          .bind(targetUserId, invitation.email.toLowerCase(), fullName, hashedPassword, now)
          .run();
      }
    }

    // Agregar membresía al despacho y marcar invitación como aceptada
    await db.batch([
      db
        .prepare(
          `INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, tenant_id) DO UPDATE SET role = ?`
        )
        .bind(targetUserId, invitation.tenant_id, invitation.role, now, invitation.role),
      db
        .prepare(`UPDATE tenant_invitations SET accepted_at = ? WHERE id = ?`)
        .bind(now, invitation.id),
    ]);

    // Crear sesión e iniciar
    const session = await createSession(env, targetUserId);
    const userRow = await db
      .prepare(
        `SELECT id, email, COALESCE(full_name, '') AS fullName, platform_role AS platformRole
         FROM users WHERE id = ?`
      )
      .bind(targetUserId)
      .first<AuthPrincipal>();

    const memberships = await getTenantMemberships(env, targetUserId);

    return json(
      {
        success: true,
        message: `¡Te has unido exitosamente al despacho "${invitation.tenant_name}"!`,
        session: publicSession(userRow!, memberships),
      },
      corsHeaders,
      200,
      {
        'Set-Cookie': cookieHeader(session.token, env),
        'Cache-Control': 'no-store',
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // TENANT SCOPED ROUTES: Requieren usuario autenticado
  // ─────────────────────────────────────────────────────────────────
  const tenantMembersMatch = path.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/members$/);
  const tenantInvitationsMatch = path.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invitations$/);
  const revokeInviteMatch = path.match(
    /^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invitations\/([a-zA-Z0-9_-]+)$/
  );
  const memberActionMatch = path.match(
    /^\/api\/tenants\/([a-zA-Z0-9_-]+)\/members\/([a-zA-Z0-9_-]+)$/
  );

  if (!tenantMembersMatch && !tenantInvitationsMatch && !revokeInviteMatch && !memberActionMatch) {
    return null; // No corresponde a este módulo
  }

  if (!principal) {
    return json({ error: 'Autenticación requerida.' }, corsHeaders, 401, {
      'Cache-Control': 'no-store',
    });
  }

  const db = env.ARK_TOOLS_DB;
  if (!db) return json({ error: 'Base de datos no disponible.' }, corsHeaders, 503);

  // ─────────────────────────────────────────────────────────────────
  // 3. GET /api/tenants/:id/members — Lista de miembros e invitaciones
  // ─────────────────────────────────────────────────────────────────
  if (tenantMembersMatch && request.method === 'GET') {
    const tenantId = tenantMembersMatch[1]!;
    const callerRole = await getEffectiveRole(env, principal, tenantId);

    if (!callerRole) {
      return json({ error: 'No tienes acceso a este despacho.' }, corsHeaders, 403);
    }

    const membersPromise = db
      .prepare(
        `SELECT u.id AS userId, u.email, COALESCE(u.full_name, '') AS fullName,
                m.role, m.created_at AS joinedAt
         FROM tenant_memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.tenant_id = ?
         ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, m.created_at ASC`
      )
      .bind(tenantId)
      .all<{
        userId: string;
        email: string;
        fullName: string;
        role: 'owner' | 'admin' | 'member';
        joinedAt: number;
      }>();

    const now = Math.floor(Date.now() / 1000);
    const invitationsPromise =
      callerRole === 'owner' || callerRole === 'admin'
        ? db
            .prepare(
              `SELECT i.id, i.email, i.role, i.created_at AS createdAt, i.expires_at AS expiresAt,
                      u.email AS invitedByEmail, COALESCE(u.full_name, '') AS invitedByName
               FROM tenant_invitations i
               JOIN users u ON u.id = i.invited_by
               WHERE i.tenant_id = ? AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > ?
               ORDER BY i.created_at DESC`
            )
            .bind(tenantId, now)
            .all<{
              id: string;
              email: string;
              role: 'admin' | 'member';
              createdAt: number;
              expiresAt: number;
              invitedByEmail: string;
              invitedByName: string;
            }>()
        : Promise.resolve({ results: [] });

    const [membersResult, invitationsResult] = await Promise.all([
      membersPromise,
      invitationsPromise,
    ]);

    return json(
      {
        tenantId,
        currentUserRole: callerRole,
        members: membersResult.results || [],
        invitations: invitationsResult.results || [],
      },
      corsHeaders,
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. POST /api/tenants/:id/invitations — Invitar a un colaborador
  // ─────────────────────────────────────────────────────────────────
  if (tenantInvitationsMatch && request.method === 'POST') {
    const tenantId = tenantInvitationsMatch[1]!;
    const callerRole = await getEffectiveRole(env, principal, tenantId);

    if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
      return json(
        { error: 'Se requiere rol de administrador o titular para invitar colaboradores.' },
        corsHeaders,
        403
      );
    }

    const body = (await request.json()) as { email?: unknown; role?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const requestedRole = body?.role === 'admin' ? 'admin' : 'member';

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Ingresa un correo electrónico válido.' }, corsHeaders, 400);
    }

    // Un admin solo puede invitar a miembros; solo el owner puede invitar a otros administradores
    if (
      requestedRole === 'admin' &&
      callerRole !== 'owner' &&
      principal.platformRole !== 'super_admin'
    ) {
      return json(
        { error: 'Solo el titular del despacho puede invitar a nuevos administradores.' },
        corsHeaders,
        403
      );
    }

    // Rate limiting para evitar abuso de envío de correos
    if (await rateLimit(env, 'invite:tenant', tenantId, 30, 3600)) {
      return json(
        { error: 'Has alcanzado el límite de invitaciones para este despacho. Intenta más tarde.' },
        corsHeaders,
        429
      );
    }

    // Verificar si el usuario ya es miembro activo del despacho
    const existingMember = await db
      .prepare(
        `SELECT 1 FROM tenant_memberships tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.tenant_id = ? AND lower(u.email) = ?
         LIMIT 1`
      )
      .bind(tenantId, email)
      .first();

    if (existingMember) {
      return json({ error: 'Este usuario ya es miembro de este despacho.' }, corsHeaders, 409);
    }

    // Obtener el nombre del despacho para el correo
    const tenant = await db
      .prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(tenantId)
      .first<{ name: string }>();

    if (!tenant) {
      return json({ error: 'Despacho no encontrado.' }, corsHeaders, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + INVITATION_TTL_SECONDS;
    const token = randomToken();
    const tokenHash = await sha256(token);

    // Revisar si existe una invitación previa pendiente
    const existingInvite = await db
      .prepare(
        `SELECT id FROM tenant_invitations
         WHERE tenant_id = ? AND lower(email) = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
         LIMIT 1`
      )
      .bind(tenantId, email, now)
      .first<{ id: string }>();

    let invitationId: string;

    if (existingInvite) {
      // Renovar invitación existente
      invitationId = existingInvite.id;
      await db
        .prepare(
          `UPDATE tenant_invitations
           SET token_hash = ?, role = ?, invited_by = ?, expires_at = ?, created_at = ?
           WHERE id = ?`
        )
        .bind(tokenHash, requestedRole, principal.id, expiresAt, now, invitationId)
        .run();
    } else {
      // Crear nueva invitación
      invitationId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO tenant_invitations (id, tenant_id, email, role, token_hash, invited_by, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(invitationId, tenantId, email, requestedRole, tokenHash, principal.id, now, expiresAt)
        .run();
    }

    // Enviar correo transaccional
    await sendInvitationEmail(
      env,
      email,
      principal.fullName || principal.email,
      tenant.name,
      requestedRole,
      token
    );

    return json(
      {
        success: true,
        message: `Invitación enviada exitosamente a ${email}.`,
        invitation: {
          id: invitationId,
          email,
          role: requestedRole,
          expiresAt,
        },
      },
      corsHeaders,
      201
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. DELETE /api/tenants/:id/invitations/:invId — Revocar invitación
  // ─────────────────────────────────────────────────────────────────
  if (revokeInviteMatch && request.method === 'DELETE') {
    const tenantId = revokeInviteMatch[1]!;
    const inviteId = revokeInviteMatch[2]!;
    const callerRole = await getEffectiveRole(env, principal, tenantId);

    if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
      return json(
        { error: 'Se requiere rol de administrador o titular para revocar invitaciones.' },
        corsHeaders,
        403
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .prepare(
        `UPDATE tenant_invitations
         SET revoked_at = ?
         WHERE id = ? AND tenant_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`
      )
      .bind(now, inviteId, tenantId)
      .run();

    if (!result.meta.changes) {
      return json({ error: 'Invitación no encontrada o ya procesada/revocada.' }, corsHeaders, 404);
    }

    return json({ success: true, message: 'Invitación revocada exitosamente.' }, corsHeaders, 200);
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. DELETE /api/tenants/:id/members/:userId — Remover miembro / salir
  // ─────────────────────────────────────────────────────────────────
  if (memberActionMatch && request.method === 'DELETE') {
    const tenantId = memberActionMatch[1]!;
    const targetUserId = memberActionMatch[2]!;
    const callerRole = await getEffectiveRole(env, principal, tenantId);

    if (!callerRole) {
      return json({ error: 'No tienes acceso a este despacho.' }, corsHeaders, 403);
    }

    // Caso A: El usuario decide abandonar el despacho por sí mismo
    if (principal.id === targetUserId) {
      if (callerRole === 'owner') {
        const ownerCount = await db
          .prepare(
            `SELECT COUNT(*) AS count FROM tenant_memberships WHERE tenant_id = ? AND role = 'owner'`
          )
          .bind(tenantId)
          .first<{ count: number }>();

        if ((ownerCount?.count || 0) <= 1) {
          return json(
            {
              error:
                'El titular no puede abandonar el despacho siendo el único propietario. Transfiere la titularidad o elimina el despacho.',
            },
            corsHeaders,
            400
          );
        }
      }

      await db
        .prepare(`DELETE FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?`)
        .bind(tenantId, targetUserId)
        .run();

      return json({ success: true, message: 'Has abandonado el despacho.' }, corsHeaders, 200);
    }

    // Caso B: Un administrador o titular expulsa a un miembro
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return json(
        { error: 'No tienes permisos para remover miembros de este despacho.' },
        corsHeaders,
        403
      );
    }

    const targetMembership = await db
      .prepare(`SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?`)
      .bind(tenantId, targetUserId)
      .first<{ role: 'owner' | 'admin' | 'member' }>();

    if (!targetMembership) {
      return json({ error: 'El usuario no es miembro de este despacho.' }, corsHeaders, 404);
    }

    if (targetMembership.role === 'owner') {
      return json({ error: 'No se puede remover al titular del despacho.' }, corsHeaders, 403);
    }

    if (
      targetMembership.role === 'admin' &&
      callerRole !== 'owner' &&
      principal.platformRole !== 'super_admin'
    ) {
      return json(
        { error: 'Solo el titular del despacho puede remover a un administrador.' },
        corsHeaders,
        403
      );
    }

    await db
      .prepare(`DELETE FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?`)
      .bind(tenantId, targetUserId)
      .run();

    return json(
      { success: true, message: 'Miembro removido exitosamente del despacho.' },
      corsHeaders,
      200
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. PATCH /api/tenants/:id/members/:userId — Cambiar rol de miembro
  // ─────────────────────────────────────────────────────────────────
  if (memberActionMatch && request.method === 'PATCH') {
    const tenantId = memberActionMatch[1]!;
    const targetUserId = memberActionMatch[2]!;
    const callerRole = await getEffectiveRole(env, principal, tenantId);

    if (callerRole !== 'owner' && principal.platformRole !== 'super_admin') {
      return json(
        { error: 'Solo el titular del despacho puede cambiar los roles de los miembros.' },
        corsHeaders,
        403
      );
    }

    const body = (await request.json()) as { role?: unknown } | null;
    const newRole = body?.role;

    if (newRole !== 'admin' && newRole !== 'member') {
      return json({ error: 'El rol debe ser "admin" o "member".' }, corsHeaders, 400);
    }

    const targetMembership = await db
      .prepare(`SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?`)
      .bind(tenantId, targetUserId)
      .first<{ role: 'owner' | 'admin' | 'member' }>();

    if (!targetMembership) {
      return json({ error: 'El usuario no es miembro de este despacho.' }, corsHeaders, 404);
    }

    if (targetMembership.role === 'owner') {
      return json(
        { error: 'No se puede modificar el rol del titular desde este endpoint.' },
        corsHeaders,
        400
      );
    }

    await db
      .prepare(`UPDATE tenant_memberships SET role = ? WHERE tenant_id = ? AND user_id = ?`)
      .bind(newRole, tenantId, targetUserId)
      .run();

    return json(
      { success: true, message: 'Rol de miembro actualizado exitosamente.', role: newRole },
      corsHeaders,
      200
    );
  }

  return null;
}
