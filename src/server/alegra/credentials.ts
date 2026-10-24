/**
 * ARK LEDGER — Encriptación y Desencriptación Segura de Credenciales Alegra
 *
 * Utiliza WebCrypto con AES-GCM (256 bits).
 * Las credenciales nunca se guardan en texto plano en D1 ni se exponen al frontend.
 */

import type { Env } from '../../index';

const FALLBACK_KEY_SEED = 'ark-tools-alegra-default-encryption-seed-2026';

/**
 * Deriva una CryptoKey de 256 bits a partir de un string secreto mediante SHA-256
 */
async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex inválido: longitud impar.');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Obtiene la llave de encriptación configurada en el entorno o usa fallback en dev
 */
export function getAlegraEncryptionSecret(env: Env): string {
  if (env.ALEGRA_ENCRYPTION_KEY && env.ALEGRA_ENCRYPTION_KEY.trim().length > 0) {
    return env.ALEGRA_ENCRYPTION_KEY.trim();
  }
  if (env.ENVIRONMENT === 'production') {
    console.warn(
      '[Alegra Credentials] ALEGRA_ENCRYPTION_KEY no configurada en producción. Usando fallback temporal.'
    );
  }
  return FALLBACK_KEY_SEED;
}

/**
 * Encripta un token de Alegra usando AES-GCM 256-bit
 * Retorna formato: `${iv_hex}:${ciphertext_hex}`
 */
export async function encryptToken(token: string, secretKey: string): Promise<string> {
  if (!token || typeof token !== 'string') {
    throw new Error('El token a encriptar no puede estar vacío.');
  }
  const key = await deriveAesKey(secretKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(token);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return `${toHex(iv)}:${toHex(new Uint8Array(ciphertext))}`;
}

/**
 * Desencripta un payload cifrado previamente con encryptToken
 */
export async function decryptToken(encryptedPayload: string, secretKey: string): Promise<string> {
  if (!encryptedPayload || !encryptedPayload.includes(':')) {
    throw new Error('Formato de token encriptado inválido.');
  }

  const [ivHex, ctHex] = encryptedPayload.split(':');
  if (!ivHex || !ctHex) {
    throw new Error('Componentes de token cifrado incompletos.');
  }

  const iv = fromHex(ivHex);
  const ciphertext = fromHex(ctHex);
  const key = await deriveAesKey(secretKey);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Error al desencriptar credencial: llave incorrecta o payload alterado.');
  }
}
