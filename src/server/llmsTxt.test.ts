import { describe, it, expect } from 'vitest';
import { generateLlmsTxt, generateLlmsFullTxt, generateRobotsTxt } from './llmsTxt';
import { CURRENT_CATALOG_VERSION } from './d1Api.expediente';

describe('GEO Engine — llms.txt & llms-full.txt', () => {
  it('genera /llms.txt con el catálogo completo de 13 herramientas y valores DOF', () => {
    const text = generateLlmsTxt();

    expect(text).toContain('# ARK TOOLS — Suite Fiscal, Laboral y de Compliance MX (DOF 2026)');
    expect(text).toContain('Catálogo de las 13 Herramientas en Producción');
    expect(text).toContain(CURRENT_CATALOG_VERSION);

    // Parámetros clave
    expect(text).toContain('**UMA Diaria 2026:** $117.31 MXN');
    expect(text).toContain('**Salario Mínimo General (SMG) 2026:** $315.04 MXN');
    expect(text).toContain('**Tope Salario Base de Cotización (SBC 25 UMAs):** $2,932.75 MXN');

    // Herramientas clave
    expect(text).toContain('Cierre de Nómina Masivo (Batch DOF)');
    expect(text).toContain('Calculadora de Nómina Rápida 2026');
    expect(text).toContain('Calculadora SBC');
    expect(text).toContain('Calculadora ISN');
    expect(text).toContain('Calculadora de Finiquitos y Liquidaciones LFT');
    expect(text).toContain('Conversor XML a Excel');
    expect(text).toContain('Validador y Auditor de XMLs');
    expect(text).toContain('Timbrado de Facturas CFDI 4.0 vía Alegra / Quadrum PAC');
    expect(text).toContain('Generador de Enlaces de Pago Clip');
    expect(text).toContain('Simulador de Leasing Tecnológico');
    expect(text).toContain('Guía Interactiva SAT / IMSS');
    expect(text).toContain('Auditoría Legal de Cobranza');
    expect(text).toContain('Mapa de Regulación de Activos Virtuales');

    // Verificación pública
    expect(text).toContain('https://tools.arksystems.site/api/expedientes/verify?hash={sha256_hash}');
  });

  it('genera /llms-full.txt con fundamentos matemáticos y legales exhaustivos', () => {
    const fullText = generateLlmsFullTxt();

    expect(fullText).toContain('ANEXO TÉCNICO Y FUNDAMENTOS MATEMÁTICOS / LEGALES');
    expect(fullText).toContain('Fórmula del Factor de Integración');
    expect(fullText).toContain('Tabla de Vacaciones Dignas (Art. 76 LFT)');
    expect(fullText).toContain('Mecánica de Retención de ISR por Sueldos y Salarios (Art. 96 LISR)');
    expect(fullText).toContain('Finiquitos y Liquidaciones conforme a la LFT');
    expect(fullText).toContain('topado al doble del Salario Mínimo General vigente');
    expect(fullText).toContain('Estándar de Integridad SHA-256');
  });

  it('genera /robots.txt con directivas explícitas para crawlers de IA', () => {
    const robots = generateRobotsTxt();

    expect(robots).toContain('User-agent: GPTBot');
    expect(robots).toContain('User-agent: ClaudeBot');
    expect(robots).toContain('User-agent: PerplexityBot');
    expect(robots).toContain('User-agent: Google-Extended');
    expect(robots).toContain('Sitemap: https://tools.arksystems.site/llms.txt');
    expect(robots).toContain('Sitemap: https://tools.arksystems.site/llms-full.txt');
  });
});
