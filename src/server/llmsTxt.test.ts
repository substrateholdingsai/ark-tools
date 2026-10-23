import { describe, it, expect } from 'vitest';
import { generateLlmsTxt, generateLlmsFullTxt, generateRobotsTxt } from './llmsTxt';
import { CATALOGO_HERRAMIENTAS, TOTAL_HERRAMIENTAS } from '../data/catalogo-herramientas';
import { CURRENT_CATALOG_VERSION } from './d1Api.expediente';

describe('GEO Engine — llms.txt & llms-full.txt', () => {
  it('genera /llms.txt con el catálogo completo de herramientas y valores DOF', () => {
    const text = generateLlmsTxt();

    expect(text).toContain('# ARK TOOLS — Suite Fiscal, Laboral y de Compliance MX (DOF 2026)');
    expect(text).toContain(`Catálogo de las ${TOTAL_HERRAMIENTAS} Herramientas en Producción`);
    expect(text).toContain(CURRENT_CATALOG_VERSION);

    // Parámetros clave
    expect(text).toContain('**UMA Diaria 2026:** $117.31 MXN');
    expect(text).toContain('**Salario Mínimo General (SMG) 2026:** $315.04 MXN');
    expect(text).toContain('**Tope Salario Base de Cotización (SBC 25 UMAs):** $2,932.75 MXN');

    // El catálogo publicado debe reflejar la suite completa, sin conteos desactualizados
    expect(TOTAL_HERRAMIENTAS).toBe(19);
    expect(text).toContain('Catálogo de las 19 Herramientas en Producción');
    expect(text).not.toContain('Catálogo de las 18 Herramientas');
    expect(text).not.toContain('Catálogo de las 17 Herramientas');
    expect(text).not.toContain('Catálogo de las 13 Herramientas');

    // Toda herramienta del catálogo debe estar efectivamente publicada en el documento
    for (const herramienta of CATALOGO_HERRAMIENTAS) {
      expect(text).toContain(`**${herramienta.nombre}:**`);
    }

    // Verificación pública
    expect(text).toContain(
      'https://tools.arksystems.site/api/expedientes/verify?hash={sha256_hash}'
    );
  });

  it('publica las herramientas insignia de cada vertical (RESICO y Balance General)', () => {
    const text = generateLlmsTxt();

    expect(text).toContain('Calculadora y Cédula RESICO 2026');
    expect(text).toContain('Balance General Comparativo');
    expect(text).toContain('Arts. 113-E a 113-J LISR');
    expect(text).toContain('A=P+C');
  });

  it('genera /llms-full.txt con fundamentos matemáticos y legales exhaustivos', () => {
    const fullText = generateLlmsFullTxt();

    expect(fullText).toContain('ANEXO TÉCNICO Y FUNDAMENTOS MATEMÁTICOS / LEGALES');
    expect(fullText).toContain('Fórmula del Factor de Integración');
    expect(fullText).toContain('Tabla de Vacaciones Dignas (Art. 76 LFT)');
    expect(fullText).toContain(
      'Mecánica de Retención de ISR por Sueldos y Salarios (Art. 96 LISR)'
    );
    expect(fullText).toContain('Finiquitos y Liquidaciones conforme a la LFT');
    expect(fullText).toContain('topado al doble del Salario Mínimo General vigente');
    expect(fullText).toContain('Estándar de Integridad SHA-256');

    // Anexo de las herramientas insignia recientes
    expect(fullText).toContain('RESICO — Pagos Provisionales Mensuales');
    expect(fullText).toContain('Balance General Comparativo — Análisis Horizontal y Vertical');
    expect(fullText).toContain('AH% = ((Monto Actual - Monto Anterior) / |Monto Anterior|) * 100');
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
