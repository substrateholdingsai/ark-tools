import type { Env } from '../index';

const SESSION_COOKIE = 'ark_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const VERIFY_TTL_SECONDS = 60 * 60 * 24;
const RESET_TTL_SECONDS = 60 * 30;
const PASSWORD_ITERATIONS = 25_000;

export interface AuthPrincipal {
  id: string;
  email: string;
  fullName: string;
  platformRole: 'user' | 'super_admin';
}

export interface TenantMembership {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

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

function cookieHeader(token: string, env: Env): string {
  const secure = env.APP_URL.startsWith('https://') ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearCookieHeader(env: Env): string {
  const secure = env.APP_URL.startsWith('https://') ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const pair = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : null;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS },
    key,
    256
  );
  const saltHex = Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${saltHex}$${hashHex}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterationsText, saltHex, expectedHex] = encoded.split('$');
  const iterations = Number(iterationsText);
  if (
    algorithm !== 'pbkdf2_sha256' ||
    !Number.isSafeInteger(iterations) ||
    iterations < 5_000 ||
    iterations > 600_000 ||
    typeof saltHex !== 'string' ||
    !/^[0-9a-f]{32}$/.test(saltHex || '') ||
    typeof expectedHex !== 'string' ||
    !/^[0-9a-f]{64}$/.test(expectedHex || '')
  ) {
    return false;
  }

  const salt = Uint8Array.from(saltHex.match(/.{2}/g) || [], (byte) => parseInt(byte, 16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
  const actualHex = Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  let difference = actualHex.length ^ expectedHex.length;
  for (let i = 0; i < Math.min(actualHex.length, expectedHex.length); i += 1) {
    difference |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return difference === 0;
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function passwordIsValid(password: string): boolean {
  return password.length >= 15 && password.length <= 128;
}

async function rateLimit(
  env: Env,
  scope: string,
  value: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (!env.ARK_TOOLS_DB) return false;
  const key = await sha256(`${scope}:${value}`);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  const result = await env.ARK_TOOLS_DB.prepare(
    `INSERT INTO auth_rate_limits (bucket_key, window_started_at, attempts)
       VALUES (?, ?, 1)
       ON CONFLICT(bucket_key) DO UPDATE SET
         attempts = CASE WHEN window_started_at <= ? THEN 1 ELSE attempts + 1 END,
         window_started_at = CASE WHEN window_started_at <= ? THEN ? ELSE window_started_at END
       RETURNING attempts`
  )
    .bind(key, now, windowStart, windowStart, now)
    .first<{ attempts: number }>();
  return (result?.attempts || 0) > limit;
}

async function rateLimited(
  request: Request,
  env: Env,
  scope: string,
  email: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const [ipLimited, emailLimited] = await Promise.all([
    rateLimit(env, `${scope}:ip`, ip, limit * 5, windowSeconds),
    rateLimit(env, `${scope}:email`, email, limit, windowSeconds),
  ]);
  return ipLimited || emailLimited;
}

async function sendAuthEmail(
  env: Env,
  to: string,
  subject: string,
  action: 'verify' | 'reset',
  token: string
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    throw new Error('Auth email delivery is not configured');
  }
  const url = new URL('/', env.APP_URL);
  url.searchParams.set('auth', action);
  url.searchParams.set('token', token);
  const actionUrl = url.toString();
  const actionLabel = action === 'verify' ? 'Verificar correo' : 'Restablecer contraseña';
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
      text: `${actionLabel}: ${actionUrl}\n\nSi no solicitaste esta acción, ignora este mensaje.`,
      html: `<p>${actionLabel} para tu cuenta de ARK TOOLS.</p><p><a href="${actionUrl}">${actionLabel}</a></p><p>Si no solicitaste esta acción, ignora este mensaje.</p>`,
    }),
  });
  if (!response.ok) {
    console.error('[Auth email] Resend rejected message', response.status);
    throw new Error('Auth email delivery failed');
  }
}

async function createSession(
  env: Env,
  userId: string
): Promise<{ token: string; expiresAt: number }> {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;
  await env
    .ARK_TOOLS_DB!.prepare(
      `INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
    )
    .bind(await sha256(token), userId, expiresAt, now)
    .run();
  return { token, expiresAt };
}

async function getTenantMemberships(env: Env, userId: string): Promise<TenantMembership[]> {
  const { results } = await env
    .ARK_TOOLS_DB!.prepare(
      `SELECT t.id, t.name, COALESCE(t.slug, '') AS slug, m.role
       FROM tenant_memberships m
       JOIN tenants t ON t.id = m.tenant_id
       WHERE m.user_id = ?
       ORDER BY t.name`
    )
    .bind(userId)
    .all<TenantMembership>();
  return results || [];
}

function publicSession(principal: AuthPrincipal, tenants: TenantMembership[]) {
  return {
    user: { id: principal.id, email: principal.email, fullName: principal.fullName },
    tenants,
    platformRole: principal.platformRole,
  };
}

async function issueActionToken(
  env: Env,
  userId: string,
  purpose: 'verify_email' | 'reset_password',
  ttlSeconds: number
): Promise<string> {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await env.ARK_TOOLS_DB!.batch([
    env
      .ARK_TOOLS_DB!.prepare(
        `UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL`
      )
      .bind(now, userId, purpose),
    env
      .ARK_TOOLS_DB!.prepare(
        `INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
      )
      .bind(await sha256(token), userId, purpose, now + ttlSeconds, now),
  ]);
  return token;
}

async function handleRegister(request: Request, env: Env, cors: Record<string, string>) {
  const body = (await request.json()) as {
    email?: unknown;
    fullName?: unknown;
    tenantName?: unknown;
  } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const fullName =
    (typeof body?.fullName === 'string' ? body.fullName.trim().slice(0, 120) : '') ||
    email.split('@')[0] ||
    '';
  const tenantName =
    (typeof body?.tenantName === 'string' ? body.tenantName.trim().slice(0, 120) : '') ||
    `Despacho ${fullName}`;

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Ingresa un correo electrónico válido.' }, cors, 400);
  }
  if (await rateLimited(request, env, 'register', email, 5, 3600)) {
    return json({ error: 'Demasiados intentos. Intenta más tarde.' }, cors, 429);
  }
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    return json(
      { error: 'El registro aún no está disponible: falta configurar el envío de correo.' },
      cors,
      503
    );
  }

  const db = env.ARK_TOOLS_DB!;
  const existing = await db
    .prepare('SELECT id, email_verified_at FROM users WHERE lower(email) = ? LIMIT 1')
    .bind(email)
    .first<{ id: string; email_verified_at: number | null }>();

  if (existing?.email_verified_at) {
    return json(
      {
        success: true,
        message: 'Si la cuenta puede registrarse, recibirás un correo de verificación.',
      },
      cors,
      202
    );
  }

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db.batch([
      db
        .prepare(
          `INSERT INTO users (id, email, full_name, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(userId, email, fullName),
      db
        .prepare(
          'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        )
        .bind(tenantId, tenantName, slugify(tenantName)),
      db
        .prepare(
          'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
        )
        .bind(userId, tenantId, 'owner', now),
    ]);
  }

  const token = await issueActionToken(env, userId, 'verify_email', VERIFY_TTL_SECONDS);
  try {
    await sendAuthEmail(env, email, 'Verifica tu correo de ARK TOOLS', 'verify', token);
  } catch (error) {
    console.error('[Auth register] Verification email failed', error);
    return json(
      { error: 'No se pudo enviar el correo de verificación. Intenta nuevamente.' },
      cors,
      503
    );
  }
  return json(
    {
      success: true,
      message: 'Si la cuenta puede registrarse, recibirás un correo de verificación.',
    },
    cors,
    202
  );
}

async function handleLogin(request: Request, env: Env, cors: Record<string, string>) {
  const body = (await request.json()) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 128) {
    return json({ error: 'Correo o contraseña incorrectos.' }, cors, 401);
  }
  if (await rateLimited(request, env, 'login', email, 10, 900)) {
    return json({ error: 'Demasiados intentos. Intenta más tarde.' }, cors, 429);
  }

  const row = await env
    .ARK_TOOLS_DB!.prepare(
      `SELECT id, email, full_name, password_hash, email_verified_at, platform_role
     FROM users WHERE lower(email) = ? LIMIT 1`
    )
    .bind(email)
    .first<{
      id: string;
      email: string;
      full_name: string | null;
      password_hash: string | null;
      email_verified_at: number | null;
      platform_role: 'user' | 'super_admin';
    }>();
  const dummyHash = `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${'00'.repeat(16)}$${'00'.repeat(32)}`;
  const matches = await verifyPassword(password, row?.password_hash || dummyHash);
  if (!row || !matches || !row.email_verified_at) {
    return json(
      { error: 'Correo o contraseña incorrectos. Verifica tu correo si aún no lo has confirmado.' },
      cors,
      401
    );
  }

  const principal: AuthPrincipal = {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    platformRole: row.platform_role,
  };
  const tenants = await getTenantMemberships(env, principal.id);
  if (tenants.length === 0) {
    return json({ error: 'La cuenta no tiene un despacho activo. Contacta a soporte.' }, cors, 403);
  }
  const session = await createSession(env, principal.id);
  return json(publicSession(principal, tenants), cors, 200, {
    'Set-Cookie': cookieHeader(session.token, env),
    'Cache-Control': 'no-store',
  });
}

async function handleVerifyEmail(request: Request, env: Env, cors: Record<string, string>) {
  const body = (await request.json()) as { token?: unknown; password?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!/^[0-9a-f]{64}$/.test(token) || !passwordIsValid(password)) {
    return json(
      { error: 'El enlace no es válido o expiró, o la contraseña no cumple los requisitos.' },
      cors,
      400
    );
  }
  const now = Math.floor(Date.now() / 1000);
  const db = env.ARK_TOOLS_DB!;
  const tokenHash = await sha256(token);
  const passwordHash = await hashPassword(password);
  const claimedToken = await db
    .prepare(
      `UPDATE auth_tokens SET used_at = ?
       WHERE token_hash = ? AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > ?
       RETURNING user_id`
    )
    .bind(now, tokenHash, now)
    .first<{ user_id: string }>();
  if (!claimedToken)
    return json({ error: 'El enlace de verificación no es válido o expiró.' }, cors, 400);

  const row = await db
    .prepare(
      `UPDATE users SET password_hash = ?, email_verified_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND email_verified_at IS NULL
       RETURNING id, email, full_name, platform_role`
    )
    .bind(passwordHash, now, claimedToken.user_id)
    .first<{
      id: string;
      email: string;
      full_name: string | null;
      platform_role: 'user' | 'super_admin';
    }>();
  if (!row) return json({ error: 'La cuenta asociada no está disponible.' }, cors, 400);
  let tenants = await getTenantMemberships(env, row.id);
  if (tenants.length === 0) {
    const tenantName = `Despacho ${row.full_name || row.email.split('@')[0]}`.slice(0, 120);
    const tenantId = crypto.randomUUID();
    await db.batch([
      db
        .prepare(
          'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        )
        .bind(tenantId, tenantName, slugify(tenantName)),
      db
        .prepare(
          'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
        )
        .bind(row.id, tenantId, 'owner', now),
    ]);
    tenants = await getTenantMemberships(env, row.id);
    if (tenants.length === 0) {
      return json({ error: 'No se pudo crear el despacho asociado a la cuenta.' }, cors, 500);
    }
  }
  const session = await createSession(env, row.id);
  const principal: AuthPrincipal = {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    platformRole: row.platform_role,
  };
  return json(publicSession(principal, tenants), cors, 200, {
    'Set-Cookie': cookieHeader(session.token, env),
    'Cache-Control': 'no-store',
  });
}

async function handleRequestPasswordReset(
  request: Request,
  env: Env,
  cors: Record<string, string>
) {
  const body = (await request.json()) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Ingresa un correo electrónico válido.' }, cors, 400);
  }
  if (await rateLimited(request, env, 'reset', email, 3, 3600)) {
    return json({ error: 'Demasiados intentos. Intenta más tarde.' }, cors, 429);
  }
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    return json(
      { error: 'La recuperación aún no está disponible: falta configurar el envío de correo.' },
      cors,
      503
    );
  }
  const user = await env
    .ARK_TOOLS_DB!.prepare(
      'SELECT id FROM users WHERE lower(email) = ? AND email_verified_at IS NOT NULL LIMIT 1'
    )
    .bind(email)
    .first<{ id: string }>();
  if (user) {
    const token = await issueActionToken(env, user.id, 'reset_password', RESET_TTL_SECONDS);
    try {
      await sendAuthEmail(env, email, 'Restablece tu contraseña de ARK TOOLS', 'reset', token);
    } catch (error) {
      console.error('[Auth reset] Reset email failed', error);
      return json({ error: 'No se pudo enviar el correo. Intenta nuevamente.' }, cors, 503);
    }
  }
  return json(
    {
      success: true,
      message: 'Si existe una cuenta verificada con ese correo, recibirás instrucciones.',
    },
    cors,
    202
  );
}

async function handleResetPassword(request: Request, env: Env, cors: Record<string, string>) {
  const body = (await request.json()) as { token?: unknown; password?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return json({ error: 'El enlace de recuperación no es válido o expiró.' }, cors, 400);
  }
  if (!passwordIsValid(password)) {
    return json({ error: 'La contraseña debe tener entre 15 y 128 caracteres.' }, cors, 400);
  }
  const db = env.ARK_TOOLS_DB!;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await hashPassword(password);
  const claimedToken = await db
    .prepare(
      `UPDATE auth_tokens SET used_at = ?
       WHERE token_hash = ? AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > ?
       RETURNING user_id`
    )
    .bind(now, tokenHash, now)
    .first<{ user_id: string }>();
  if (!claimedToken)
    return json({ error: 'El enlace de recuperación no es válido o expiró.' }, cors, 400);
  await db.batch([
    db
      .prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(passwordHash, claimedToken.user_id),
    db
      .prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
      .bind(now, claimedToken.user_id),
  ]);
  return json(
    { success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' },
    cors
  );
}

export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<AuthPrincipal | null> {
  if (!env.ARK_TOOLS_DB) return null;
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.ARK_TOOLS_DB.prepare(
    `SELECT u.id, u.email, COALESCE(u.full_name, '') AS fullName,
            u.platform_role AS platformRole
     FROM auth_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
       AND u.email_verified_at IS NOT NULL LIMIT 1`
  )
    .bind(await sha256(token), now)
    .first<AuthPrincipal>();
  return row || null;
}

export async function requireTenantMembership(
  env: Env,
  principal: AuthPrincipal,
  tenantId: string
): Promise<TenantMembership | null> {
  if (!env.ARK_TOOLS_DB) return null;
  return env.ARK_TOOLS_DB.prepare(
    `SELECT t.id, t.name, COALESCE(t.slug, '') AS slug, m.role
     FROM tenant_memberships m JOIN tenants t ON t.id = m.tenant_id
     WHERE m.user_id = ? AND m.tenant_id = ? LIMIT 1`
  )
    .bind(principal.id, tenantId)
    .first<TenantMembership>();
}

export async function handleAuthApiRequest(
  request: Request,
  env: Env,
  cors: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/auth/')) return null;
  if (path === '/api/auth/sync') {
    return json(
      { error: 'Este endpoint fue deshabilitado; usa la autenticación segura.' },
      cors,
      410
    );
  }
  if (!env.ARK_TOOLS_DB) return json({ error: 'Base de datos no disponible.' }, cors, 503);

  try {
    if (path === '/api/auth/register' && request.method === 'POST') {
      return await handleRegister(request, env, cors);
    }
    if (path === '/api/auth/login' && request.method === 'POST') {
      return await handleLogin(request, env, cors);
    }
    if (path === '/api/auth/verify-email' && request.method === 'POST') {
      return await handleVerifyEmail(request, env, cors);
    }
    if (path === '/api/auth/request-password-reset' && request.method === 'POST') {
      return await handleRequestPasswordReset(request, env, cors);
    }
    if (path === '/api/auth/reset-password' && request.method === 'POST') {
      return await handleResetPassword(request, env, cors);
    }
    if (path === '/api/auth/session' && request.method === 'GET') {
      if (!principal) {
        return json({ error: 'No hay sesión activa.' }, cors, 401, { 'Cache-Control': 'no-store' });
      }
      return json(
        publicSession(principal, await getTenantMemberships(env, principal.id)),
        cors,
        200,
        { 'Cache-Control': 'no-store' }
      );
    }
    if (path === '/api/auth/logout' && request.method === 'POST') {
      const token = getCookie(request, SESSION_COOKIE);
      if (token && /^[0-9a-f]{64}$/.test(token)) {
        await env.ARK_TOOLS_DB.prepare(
          'UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ?'
        )
          .bind(Math.floor(Date.now() / 1000), await sha256(token))
          .run();
      }
      return json({ success: true }, cors, 200, {
        'Set-Cookie': clearCookieHeader(env),
        'Cache-Control': 'no-store',
      });
    }
    if (path === '/api/auth/tenants' && request.method === 'POST') {
      if (!principal) return json({ error: 'No hay sesión activa.' }, cors, 401);
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim().slice(0, 120) || '';
      if (!name) return json({ error: 'El nombre del despacho es obligatorio.' }, cors, 400);
      const tenant: TenantMembership = {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        role: 'owner',
      };
      const now = Math.floor(Date.now() / 1000);
      await env.ARK_TOOLS_DB.batch([
        env.ARK_TOOLS_DB.prepare(
          'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(tenant.id, tenant.name, tenant.slug),
        env.ARK_TOOLS_DB.prepare(
          'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
        ).bind(principal.id, tenant.id, 'owner', now),
      ]);
      return json({ success: true, tenant }, cors, 201);
    }
    return json({ error: 'Ruta de autenticación no encontrada.' }, cors, 404);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, cors, 400);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Auth API] Request failed', message, error);
    return json(
      { error: `No se pudo completar la solicitud de autenticación: ${message}` },
      cors,
      500
    );
  }
}
