import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildCanacoConfirmacionEmailHtml,
  sendCanacoConfirmacionPagoEmail,
  type CanacoConfirmacionPagoEmailParams,
} from './canacoEmailService';
import type { Env } from '../index';

describe('CANACO Mérida — Servicio de Correos Transaccionales (Resend)', () => {
  const mockParams: CanacoConfirmacionPagoEmailParams = {
    email: 'socio@mayab.mx',
    contactoNombre: 'Lic. Fernando Pech',
    razonSocial: 'Abarrotes y Comercializadora Mayab S.A. de C.V.',
    rfc: 'ABM120301AA1',
    folioSiem: 'SIEM-MID-2026-ABM1-MIC-4819',
    folioPago: 'SPEI-ARK-20261028-9988',
    monto: 2150.0,
    selloDigitalSha256: 'SHA256:CANACO-MID-4819-2026-OFICIAL',
    metodo: 'SPEI Interbancario',
  };

  describe('buildCanacoConfirmacionEmailHtml', () => {
    it('construye una plantilla HTML responsiva con identidad HENEQUÉN', () => {
      const html = buildCanacoConfirmacionEmailHtml(mockParams);

      expect(html).toContain('CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA');
      expect(html).toContain('120 Años Impulsando a Yucatán');
      expect(html).toContain('Lic. Fernando Pech');
      expect(html).toContain('Abarrotes y Comercializadora Mayab S.A. de C.V.');
      expect(html).toContain('ABM120301AA1');
      expect(html).toContain('SIEM-MID-2026-ABM1-MIC-4819');
      expect(html).toContain('$2,150.00 MXN');
      expect(html).toContain('SPEI-ARK-20261028-9988');
      expect(html).toContain('SHA256:CANACO-MID-4819-2026-OFICIAL');
      expect(html).toContain('Ver y Descargar Cédula Oficial Carta con QR');
      expect(html).toContain('Desarrollado con tecnología de Ark Systems');
    });

    it('utiliza la razón social como saludo si no se proporciona nombre de contacto', () => {
      const html = buildCanacoConfirmacionEmailHtml({
        ...mockParams,
        contactoNombre: undefined,
      });

      expect(html).toContain(
        'Estimado(a) <strong>Abarrotes y Comercializadora Mayab S.A. de C.V.</strong>'
      );
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
  });
});
