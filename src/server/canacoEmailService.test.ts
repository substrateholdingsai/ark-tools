import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildCanacoConfirmacionEmailHtml,
  sendCanacoConfirmacionPagoEmail,
  type CanacoConfirmacionPagoEmailParams,
} from './canacoEmailService';
import type { Env } from '../index';

describe('CANACO Mérida — Servicio de Correos Transaccionales (Resend)', () => {
  const mockParams: CanacoConfirmacionPagoEmailParams = {
    email: 'demo@example.invalid',
    contactoNombre: 'Fernando Pech',
    razonSocial: 'Comercializadora del Mayab',
    rfc: 'CPM2106158A1',
    folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
    folioPago: 'SPEI-DEMO-4242',
    monto: 3700,
    folioIntegridad: 'CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
    metodo: 'SPEI Interbancario',
  };

  describe('buildCanacoConfirmacionEmailHtml', () => {
    it('construye una plantilla HTML responsiva con identidad HENEQUÉN', () => {
      const html = buildCanacoConfirmacionEmailHtml(mockParams);

      expect(html).toContain('CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA');
      expect(html).toContain('120 Años Impulsando a Yucatán');
      expect(html).toContain('Fernando Pech');
      expect(html).toContain('Comercializadora del Mayab');
      expect(html).toContain('CPM2106158A1');
      expect(html).toContain('SIEM-MID-2026-CPM2-PEQ-4242');
      expect(html).toContain('$3,700.00 MXN');
      expect(html).toContain('SPEI-DEMO-4242');
      expect(html).toContain('CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242');
      expect(html).toContain('No es un sello criptográfico ni una constancia NOM-151.');
      expect(html).not.toContain('SHA256');
      expect(html).not.toContain('Cédula Oficial');
      expect(html).toContain('Desarrollado con tecnología de Ark Systems');
    });

    it('utiliza la razón social como saludo si no se proporciona nombre de contacto', () => {
      const html = buildCanacoConfirmacionEmailHtml({
        ...mockParams,
        contactoNombre: undefined,
      });

      expect(html).toContain('Estimado(a) <strong>Comercializadora del Mayab</strong>');
    });
  });

  describe('sendCanacoConfirmacionPagoEmail', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('retorna error cuando falta RESEND_API_KEY', async () => {
      const mockEnv = {} as Env;
      const res = await sendCanacoConfirmacionPagoEmail(mockEnv, mockParams);

      expect(res.success).toBe(false);
      expect(res.error).toBe('RESEND_API_KEY no configurado');
    });

    it('retorna error si el correo del destinatario es inválido', async () => {
      const mockEnv = { RESEND_API_KEY: 're_test_123' } as Env;
      const res = await sendCanacoConfirmacionPagoEmail(mockEnv, {
        ...mockParams,
        email: 'invalido',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('destinatario inválido');
    });

    it('despacha exitosamente la solicitud a la API de Resend', async () => {
      const mockEnv = {
        RESEND_API_KEY: 're_test_123',
        AUTH_EMAIL_FROM: 'CANACO Mérida <afiliaciones@canacomerida.com.mx>',
      } as Env;

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email_resend_mid_12345' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const res = await sendCanacoConfirmacionPagoEmail(mockEnv, mockParams);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer re_test_123',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(res.success).toBe(true);
      expect(res.id).toBe('email_resend_mid_12345');
    });

    it('maneja respuestas de error de la API de Resend sin provocar excepciones no capturadas', async () => {
      const mockEnv = {
        RESEND_API_KEY: 're_test_123',
      } as Env;

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Dominio no verificado en Resend',
      });
      vi.stubGlobal('fetch', fetchMock);

      const res = await sendCanacoConfirmacionPagoEmail(mockEnv, mockParams);

      expect(res.success).toBe(false);
      expect(res.error).toContain('Error Resend 403');
    });

    it('despacha exitosamente la solicitud a la API de Telnyx cuando TELNYX_API_KEY está configurada', async () => {
      const mockEnv = {
        TELNYX_API_KEY: 'KEY_TELNYX_MOCK_123',
        AUTH_EMAIL_FROM: 'CANACO Mérida <afiliaciones@canacomerida.com.mx>',
      } as Env;

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            id: 'email_telnyx_mid_99999',
            record_type: 'email_message',
            status: 'queued',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const res = await sendCanacoConfirmacionPagoEmail(mockEnv, mockParams);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.telnyx.com/v2/email_messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer KEY_TELNYX_MOCK_123',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(res.success).toBe(true);
      expect(res.id).toBe('email_telnyx_mid_99999');
    });
  });
});
