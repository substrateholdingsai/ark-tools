import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseEmailAddress,
  getActiveEmailProvider,
  isEmailServiceConfigured,
  sendWithTelnyx,
  sendWithResend,
  sendTransactionalEmail,
  TELNYX_EMAIL_API_URL,
  RESEND_EMAIL_API_URL,
} from './emailService';
import type { Env } from '../../index';

describe('ARK LEDGER — Email Service (Telnyx & Resend)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('parseEmailAddress', () => {
    it('extrae correo y nombre de una dirección con formato RFC 5322', () => {
      const parsed = parseEmailAddress('ARK LEDGER <no-reply@mail.arksystems.site>');
      expect(parsed).toEqual({
        name: 'ARK LEDGER',
        email: 'no-reply@mail.arksystems.site',
      });
    });

    it('soporta nombres con comillas', () => {
      const parsed = parseEmailAddress('"Pavel Cortés" <pavel@mail.arksystems.site>');
      expect(parsed).toEqual({
        name: 'Pavel Cortés',
        email: 'pavel@mail.arksystems.site',
      });
    });

    it('soporta correos simples sin nombre', () => {
      const parsed = parseEmailAddress('contacto@despacho.mx');
      expect(parsed).toEqual({
        email: 'contacto@despacho.mx',
      });
    });
  });

  describe('getActiveEmailProvider & isEmailServiceConfigured', () => {
    it('retorna "telnyx" cuando TELNYX_API_KEY está configurada (prioridad por defecto)', () => {
      const env = { TELNYX_API_KEY: 'KEY_TELNYX_123' } as Env;
      expect(getActiveEmailProvider(env)).toBe('telnyx');
      expect(isEmailServiceConfigured(env)).toBe(true);
    });

    it('retorna "resend" cuando solo RESEND_API_KEY está configurada', () => {
      const env = { RESEND_API_KEY: 're_test_key' } as Env;
      expect(getActiveEmailProvider(env)).toBe('resend');
      expect(isEmailServiceConfigured(env)).toBe(true);
    });

    it('respeta la variable explícita EMAIL_PROVIDER=telnyx', () => {
      const env = {
        EMAIL_PROVIDER: 'telnyx',
        TELNYX_API_KEY: 'KEY_TELNYX_123',
        RESEND_API_KEY: 're_test_key',
      } as Env;
      expect(getActiveEmailProvider(env)).toBe('telnyx');
    });

    it('respeta la variable explícita EMAIL_PROVIDER=resend incluso si existe TELNYX_API_KEY', () => {
      const env = {
        EMAIL_PROVIDER: 'resend',
        TELNYX_API_KEY: 'KEY_TELNYX_123',
        RESEND_API_KEY: 're_test_key',
      } as Env;
      expect(getActiveEmailProvider(env)).toBe('resend');
    });

    it('retorna "none" cuando falta la clave del proveedor explícito', () => {
      const env = { EMAIL_PROVIDER: 'telnyx' } as Env;
      expect(getActiveEmailProvider(env)).toBe('none');
      expect(isEmailServiceConfigured(env)).toBe(false);
    });

    it('retorna "none" cuando ninguna clave está configurada', () => {
      const env = {} as Env;
      expect(getActiveEmailProvider(env)).toBe('none');
      expect(isEmailServiceConfigured(env)).toBe(false);
    });
  });

  describe('sendWithTelnyx', () => {
    it('despacha la solicitud a Telnyx API con formato y headers correctos', async () => {
      let capturedUrl = '';
      let capturedOptions: RequestInit | undefined;

      globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedOptions = init;
        return new Response(
          JSON.stringify({
            data: {
              id: 'telnyx_msg_987654',
              record_type: 'email_message',
              status: 'queued',
            },
          }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const result = await sendWithTelnyx(
        'KEY_TELNYX_XYZ',
        {
          from: 'ARK LEDGER <no-reply@mail.arksystems.site>',
          to: 'contador@firma.mx',
          subject: 'Confirmación de Cuenta',
          html: '<p>Bienvenido</p>',
          text: 'Bienvenido',
          replyTo: 'soporte@arksystems.site',
        },
        'ARK LEDGER <no-reply@mail.arksystems.site>'
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe('telnyx_msg_987654');
      expect(result.provider).toBe('telnyx');

      expect(capturedUrl).toBe(TELNYX_EMAIL_API_URL);
      const headers = capturedOptions?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer KEY_TELNYX_XYZ');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(capturedOptions?.body as string);
      expect(body.from).toEqual({
        name: 'ARK LEDGER',
        email: 'no-reply@mail.arksystems.site',
      });
      expect(body.to).toEqual([{ email: 'contador@firma.mx' }]);
      expect(body.subject).toBe('Confirmación de Cuenta');
      expect(body.html_body).toBe('<p>Bienvenido</p>');
      expect(body.text_body).toBe('Bienvenido');
      expect(body.reply_to).toBe('soporte@arksystems.site');
    });

    it('maneja respuestas de error estructuradas de Telnyx API', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              {
                code: 'domain_not_verified',
                title: 'Domain Not Verified',
                detail: 'The domain mail.arksystems.site is not verified on Telnyx.',
              },
            ],
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await sendWithTelnyx('KEY_TELNYX_XYZ', {
        to: 'test@example.com',
        subject: 'Prueba',
        text: 'Contenido',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('The domain mail.arksystems.site is not verified on Telnyx.');
      expect(result.provider).toBe('telnyx');
    });

    it('captura fallos de red sin lanzar excepciones no controladas', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const result = await sendWithTelnyx('KEY_TELNYX_XYZ', {
        to: 'test@example.com',
        subject: 'Prueba',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timed out');
      expect(result.provider).toBe('telnyx');
    });
  });

  describe('sendWithResend', () => {
    it('despacha la solicitud a Resend API con formato esperado', async () => {
      let capturedUrl = '';
      let capturedOptions: RequestInit | undefined;

      globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedOptions = init;
        return new Response(JSON.stringify({ id: 're_12345' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await sendWithResend('re_test_key', {
        from: 'ARK LEDGER <no-reply@mail.arksystems.site>',
        to: ['dest@example.com'],
        subject: 'Alerta',
        html: '<p>Alerta</p>',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('re_12345');
      expect(result.provider).toBe('resend');
      expect(capturedUrl).toBe(RESEND_EMAIL_API_URL);

      const body = JSON.parse(capturedOptions?.body as string);
      expect(body.from).toBe('ARK LEDGER <no-reply@mail.arksystems.site>');
      expect(body.to).toEqual(['dest@example.com']);
      expect(body.html).toBe('<p>Alerta</p>');
    });
  });

  describe('sendTransactionalEmail', () => {
    it('utiliza Telnyx cuando TELNYX_API_KEY está configurada', async () => {
      const fetchSpy = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { id: 'telnyx_switch_1001' },
          }),
          { status: 200 }
        )
      );
      globalThis.fetch = fetchSpy;

      const env = {
        TELNYX_API_KEY: 'KEY_TELNYX_PROD',
        AUTH_EMAIL_FROM: 'ARK LEDGER <no-reply@mail.arksystems.site>',
      } as Env;

      const result = await sendTransactionalEmail(env, {
        to: 'cliente@contable.com',
        subject: 'Bienvenida',
        text: 'Hola',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('telnyx');
      expect(result.id).toBe('telnyx_switch_1001');
      expect(fetchSpy).toHaveBeenCalledWith(TELNYX_EMAIL_API_URL, expect.any(Object));
    });

    it('utiliza Resend de respaldo si Telnyx falla y no hay fijación explícita de proveedor', async () => {
      const fetchSpy = vi.fn().mockImplementation(async (url) => {
        if (String(url).includes('telnyx.com')) {
          return new Response('Telnyx 500 Internal Server Error', { status: 500 });
        }
        if (String(url).includes('resend.com')) {
          return new Response(JSON.stringify({ id: 'resend_fallback_ok' }), { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      });
      globalThis.fetch = fetchSpy;

      const env = {
        TELNYX_API_KEY: 'KEY_TELNYX_FAILED',
        RESEND_API_KEY: 're_backup_key',
        AUTH_EMAIL_FROM: 'ARK LEDGER <no-reply@mail.arksystems.site>',
      } as Env;

      const result = await sendTransactionalEmail(env, {
        to: 'cliente@contable.com',
        subject: 'Bienvenida con Fallback',
        text: 'Hola',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('resend');
      expect(result.id).toBe('resend_fallback_ok');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('falla limpiamente si no hay ningún proveedor configurado', async () => {
      const env = {} as Env;
      const result = await sendTransactionalEmail(env, {
        to: 'user@test.com',
        subject: 'Prueba',
      });

      expect(result.success).toBe(false);
      expect(result.provider).toBe('none');
      expect(result.error).toContain('Servicio de correo no configurado');
    });
  });
});
