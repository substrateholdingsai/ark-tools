/**
 * Capa de persistencia en IndexedDB para Auditor de CFDI Atípicos (100% Local-First).
 * Permite almacenar miles de facturas y snapshots sin las limitaciones de 5MB de localStorage.
 */

import type {
  Contribuyente,
  CFDIExtraido,
  SATMetadataItem,
  CriterioAtipicoConfig,
  HallazgoRiesgo,
} from '../types';

const DB_NAME = 'ark_auditor_cfdi_db';
const DB_VERSION = 1;

interface SnapshotRespaldo {
  id: string;
  fecha: string;
  rfc: string;
  ejercicio: number;
  data: {
    contribuyente: Contribuyente;
    cfdis: CFDIExtraido[];
    metadata: SATMetadataItem[];
    criterios: CriterioAtipicoConfig[];
    hallazgos: HallazgoRiesgo[];
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('contribuyentes')) {
        db.createObjectStore('contribuyentes', { keyPath: 'rfc' });
      }

      if (!db.objectStoreNames.contains('cfdis')) {
        const store = db.createObjectStore('cfdis', { keyPath: 'uuid' });
        store.createIndex('by_emisor', 'rfcEmisor', { unique: false });
        store.createIndex('by_receptor', 'rfcReceptor', { unique: false });
        store.createIndex('by_fecha', 'fechaEmision', { unique: false });
      }

      if (!db.objectStoreNames.contains('metadata')) {
        const store = db.createObjectStore('metadata', { keyPath: 'uuid' });
        store.createIndex('by_emisor', 'rfcEmisor', { unique: false });
        store.createIndex('by_receptor', 'rfcReceptor', { unique: false });
      }

      if (!db.objectStoreNames.contains('snapshots')) {
        const store = db.createObjectStore('snapshots', { keyPath: 'id' });
        store.createIndex('by_rfc', 'rfc', { unique: false });
        store.createIndex('by_fecha', 'fecha', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarContribuyente(c: Contribuyente): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('contribuyentes', 'readwrite');
    tx.objectStore('contribuyentes').put(c);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listarContribuyentes(): Promise<Contribuyente[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('contribuyentes', 'readonly');
    const req = tx.objectStore('contribuyentes').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarLoteCFDI(lista: CFDIExtraido[]): Promise<void> {
  if (lista.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cfdis', 'readwrite');
    const store = tx.objectStore('cfdis');
    for (const item of lista) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerCFDIs(): Promise<CFDIExtraido[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cfdis', 'readonly');
    const req = tx.objectStore('cfdis').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarLoteMetadata(lista: SATMetadataItem[]): Promise<void> {
  if (lista.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    for (const item of lista) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerMetadata(): Promise<SATMetadataItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const req = tx.objectStore('metadata').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarSnapshot(
  rfc: string,
  ejercicio: number,
  data: SnapshotRespaldo['data']
): Promise<void> {
  const db = await openDB();
  const id = `snap_${rfc}_${ejercicio}_${Date.now()}`;
  const snap: SnapshotRespaldo = {
    id,
    fecha: new Date().toISOString(),
    rfc,
    ejercicio,
    data,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');
    store.put(snap);

    // Rotar para no superar 10 snapshots por RFC
    const index = store.index('by_rfc');
    const req = index.getAll(rfc);
    req.onsuccess = () => {
      const results: SnapshotRespaldo[] = req.result || [];
      if (results.length > 10) {
        results.sort((a, b) => a.fecha.localeCompare(b.fecha));
        const sobrantes = results.slice(0, results.length - 10);
        for (const item of sobrantes) {
          store.delete(item.id);
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function limpiarBaseDeDatos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['contribuyentes', 'cfdis', 'metadata', 'snapshots'], 'readwrite');
    tx.objectStore('contribuyentes').clear();
    tx.objectStore('cfdis').clear();
    tx.objectStore('metadata').clear();
    tx.objectStore('snapshots').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
