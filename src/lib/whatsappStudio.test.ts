import { describe, expect, it } from 'vitest';
import {
  WS_TEMPLATES,
  buildWhatsAppDeepLink,
  buildWhatsAppVariables,
  compileWhatsAppMessage,
  extractWhatsAppFromHtml,
  inferDefaultTemplateId,
  inferWhatsAppTenant,
  normalizeMexicanPhone,
} from './whatsappStudio';

describe('whatsappStudio engine (src/lib/whatsappStudio.ts)', () => {
  it('normaliza números mexicanos de 10, 12 y 13 dígitos y descarta secuencias inválidas', () => {
    expect(normalizeMexicanPhone('999 123 4567')).toBe('529991234567');
    expect(normalizeMexicanPhone('+52 (999) 123-4567')).toBe('529991234567');
    expect(normalizeMexicanPhone('5219991234567')).toBe('5219991234567');
    expect(normalizeMexicanPhone('5219991234567', { stripLegacyMobileOne: true })).toBe(
      '529991234567'
    );
    expect(normalizeMexicanPhone('0000000000')).toBeNull();
    expect(normalizeMexicanPhone('1111111111')).toBeNull();
    expect(normalizeMexicanPhone('')).toBeNull();
  });

  it('extrae y normaliza números desde enlaces profundos wa.me y api.whatsapp.com', () => {
    expect(normalizeMexicanPhone('https://wa.me/529991234567?text=Hola')).toBe('529991234567');
    expect(
      extractWhatsAppFromHtml(
        '<a href="https://api.whatsapp.com/send?phone=5219998887766&text=Hola">Chat</a>'
      )
    ).toBe('5219998887766');
    expect(
      extractWhatsAppFromHtml('<a href="https://wa.me/+529994445566" class="btn-wa">WhatsApp</a>')
    ).toBe('529994445566');
  });

  it('infiere correctamente el tenant y la plantilla sugerida según el contexto del prospecto', () => {
    expect(inferWhatsAppTenant({ especialidad: 'Crypto', ciudad: 'Merida' })).toBe('ark');
    expect(inferWhatsAppTenant({ notas: 'Socio activo SIEM CANACO' })).toBe('canaco_merida');
    expect(inferWhatsAppTenant({ especialidad: 'General' }, 'canaco_merida')).toBe('canaco_merida');

    expect(inferDefaultTemplateId({ status: 'Mail_enviado_091026' }, 'ark')).toBe(
      'ark_seguimiento_mail'
    );
    expect(inferDefaultTemplateId({ status: 'Nuevo', especialidad: 'Crypto' }, 'ark')).toBe(
      'ark_crypto_lfpiorpi'
    );
    expect(inferDefaultTemplateId({ status: 'Nuevo', especialidad: 'Fiscal' }, 'ark')).toBe(
      'ark_forense_cfdi'
    );
    expect(inferDefaultTemplateId({ status: 'Nuevo', especialidad: 'General' }, 'ark')).toBe(
      'ark_marca_blanca'
    );
    expect(inferDefaultTemplateId({ status: 'Nuevo' }, 'canaco_merida')).toBe(
      'canaco_boveda_fiscal'
    );
  });

  it('compila variables dinámicas y construye el deep link codificado en URI', () => {
    const vars = buildWhatsAppVariables(
      {
        id: 'lead-987654',
        contacto_nombre: 'Despacho Fiscal del Sureste',
        ciudad: 'Merida',
        especialidad: 'Fiscal',
      },
      {
        tenant: 'ark',
        recipientName: 'CP Roberto Méndez',
        dateIso: '2026-11-11',
      }
    );

    const template = WS_TEMPLATES.find((t) => t.id === 'ark_marca_blanca')!;
    const msg = compileWhatsAppMessage(template.body, vars);

    expect(msg).toContain('CP Roberto Méndez');
    expect(msg).toContain('Despacho Fiscal del Sureste');
    expect(msg).toContain('Merida');
    expect(msg).toContain('Pavel Cortés');

    const link = buildWhatsAppDeepLink('9991234567', msg);
    expect(link).toMatch(/^https:\/\/wa\.me\/529991234567\?text=/);
    expect(decodeURIComponent(link!.split('?text=')[1]!)).toContain('CP Roberto Méndez');
  });
});
