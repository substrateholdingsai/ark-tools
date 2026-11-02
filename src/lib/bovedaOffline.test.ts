import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  computeSha256,
  computeDeterministicHash,
  generarManifestSha256,
  generarPapelDeTrabajoHtml,
  generarOfflineViewerHtml,
  generarBovedaOfflineZip,
  type BovedaOfflineParams,
} from './bovedaOffline';

describe('Bóveda Offline Criptográfica (Art. 30 CFF)', () => {
  const dummyParams: BovedaOfflineParams = {
    titulo: 'Papel de Trabajo de Finiquito e Indemnización',
    toolId: 'finiquitos',
    toolNombre: 'Calculadora de Finiquitos y Liquidaciones LFT',
    despachoName: 'Despacho Contable ARK & Asociados',
    client: {
      nombre: 'Comercializadora del Mayab S.A. de C.V.',
      rfc: 'CMA180315AB1',
      curp: null,
      tipo: 'empresa',
    },
    folio: 'EXP-TEST-001',
    fecha: '2026-11-02',
    catalogVersion: 'DOF-2026-OFICIAL-UMA117.31',
    inputHash: 'a1b2c3d4e5f67890ab12cd34ef56ab78c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    inputs: {
      fechaIngreso: '2020-01-15',
      fechaBaja: '2026-10-31',
      salarioDiario: 650.5,
      tipoBaja: 'renuncia_voluntaria',
    },
    outputs: {
      totalFiniquito: 32580.4,
      neto: 28940.1,
    },
    filasConceptos: [
      {
        concepto: 'Aguinaldo Proporcional',
        dias: '12.5 días',
        formula: '650.50 × 12.5 días devengados',
        fundamento: 'LFT Art. 87',
        importe: 8131.25,
      },
      {
        concepto: 'Prima Vacacional Legal',
        dias: '25%',
        formula: 'Vacaciones proporcionales × 25%',
        fundamento: 'LFT Art. 80',
        importe: 2439.38,
      },
    ],
    totalMonto: 10570.63,
    importeEnLetras: 'Diez mil quinientos setenta pesos 63/100 M.N.',
  };

  describe('computeSha256', () => {
    it('calcula el hash SHA-256 estándar de un string', async () => {
      // SHA-256 de "hello world" es conocido
      const hash = await computeSha256('hello world');
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('devuelve una cadena de 64 caracteres en hexadecimal', async () => {
      const hash = await computeSha256('prueba de texto fiscal');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('computeDeterministicHash', () => {
    it('produce el mismo hash sin importar el orden de las llaves en los objetos', async () => {
      const obj1 = { z: 100, a: 'test', m: { b: 2, a: 1 } };
      const obj2 = { a: 'test', m: { a: 1, b: 2 }, z: 100 };

      const hash1 = await computeDeterministicHash(obj1);
      const hash2 = await computeDeterministicHash(obj2);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('produce hashes distintos si los datos cambian', async () => {
      const hash1 = await computeDeterministicHash({ importe: 100.0 });
      const hash2 = await computeDeterministicHash({ importe: 100.01 });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generarManifestSha256', () => {
    it('genera un archivo de manifiesto estándar UNIX con el formato correcto', () => {
      const archivos = [
        {
          nombre: 'datos_expediente.json',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          nombre: 'papel_de_trabajo.html',
          hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        },
      ];

      const manifest = generarManifestSha256(archivos, {
        folio: 'EXP-TEST-001',
        inputHash: dummyParams.inputHash,
        toolId: 'finiquitos',
        clientRfc: 'CMA180315AB1',
        clientNombre: 'Comercializadora del Mayab',
        catalogVersion: 'DOF-2026',
      });

      expect(manifest).toContain(
        '# ARK LEDGER — BÓVEDA OFFLINE · MANIFEST DE INTEGRIDAD CRIPTOGRÁFICA'
      );
      expect(manifest).toContain('CFF Art. 30');
      expect(manifest).toContain('Folio Expediente : EXP-TEST-001');
      expect(manifest).toContain(`Sello Canónico   : ${dummyParams.inputHash}`);
      expect(manifest).toContain(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  datos_expediente.json'
      );
      expect(manifest).toContain(
        'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb  papel_de_trabajo.html'
      );
    });
  });

  describe('generarPapelDeTrabajoHtml', () => {
    it('genera un documento HTML estructurado e imprimible con @media print', () => {
      const html = generarPapelDeTrabajoHtml(dummyParams);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Despacho Contable ARK &amp; Asociados');
      expect(html).toContain(dummyParams.client.nombre);
      expect(html).toContain('RFC: CMA180315AB1');
      expect(html).toContain('EXP-TEST-001');
      expect(html).toContain('Aguinaldo Proporcional');
      expect(html).toContain('LFT Art. 87');
      expect(html).toContain(dummyParams.inputHash);
      expect(html).toContain('@media print');
      expect(html).toContain('Art. 30 CFF');
    });
  });

  describe('generarOfflineViewerHtml', () => {
    it('genera un visor interactivo autónomo sin scripts ni estilos externos de CDN', () => {
      const viewer = generarOfflineViewerHtml(dummyParams);

      expect(viewer).toContain('<!DOCTYPE html>');
      expect(viewer).toContain('ARK LEDGER · SOBERANÍA FISCAL');
      expect(viewer).toContain('BÓVEDA OFFLINE · CERO SERVIDOR');
      expect(viewer).toContain(dummyParams.inputHash);
      expect(viewer).toContain('recalcularIntegridad');
      expect(viewer).toContain('crypto.subtle.digest');

      // No debe depender de scripts externos
      expect(viewer).not.toContain('<script src="http');
      expect(viewer).not.toContain('<link rel="stylesheet" href="http');
    });
  });

  describe('generarBovedaOfflineZip', () => {
    it('empaqueta el ZIP con todos los archivos requeridos y coherencia de hashes en el manifiesto', async () => {
      const blob = await generarBovedaOfflineZip(dummyParams);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);

      // Cargar y desempacar el ZIP con JSZip para verificar su estructura interna
      const arrayBuffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 1. Verificar existencia de archivos raíz
      expect(zip.file('datos_expediente.json')).not.toBeNull();
      expect(zip.file('papel_de_trabajo.html')).not.toBeNull();
      expect(zip.file('offline-viewer.html')).not.toBeNull();
      expect(zip.file('manifest.sha256')).not.toBeNull();

      // 2. Verificar contenido de datos_expediente.json
      const jsonStr = await zip.file('datos_expediente.json')!.async('string');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.formato).toBe('ARK_LEDGER_BOVEDA_OFFLINE_V1');
      expect(parsed.sello_sha256_canónico).toBe(dummyParams.inputHash);
      expect(parsed.contribuyente.rfc).toBe('CMA180315AB1');

      // 3. Verificar que los hashes reportados en manifest.sha256 coincidan con los archivos reales
      const manifestStr = await zip.file('manifest.sha256')!.async('string');
      const hashJsonReal = await computeSha256(jsonStr);
      expect(manifestStr).toContain(`${hashJsonReal}  datos_expediente.json`);

      const papelHtmlStr = await zip.file('papel_de_trabajo.html')!.async('string');
      const hashPapelReal = await computeSha256(papelHtmlStr);
      expect(manifestStr).toContain(`${hashPapelReal}  papel_de_trabajo.html`);

      const viewerHtmlStr = await zip.file('offline-viewer.html')!.async('string');
      const hashViewerReal = await computeSha256(viewerHtmlStr);
      expect(manifestStr).toContain(`${hashViewerReal}  offline-viewer.html`);
    });
  });
});
