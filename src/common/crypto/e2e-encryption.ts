/**
 * End-to-End (E2E) Zero-Knowledge Encryption Module
 * Standardized on Web Crypto API (SubtleCrypto: ECDH P-256 / X25519 + AES-256-GCM)
 *
 * Guarantees:
 *  1. Key pairs generated on client device. Private key NEVER sent to server.
 *  2. Plaintext is encrypted on sender device before network transmission.
 *  3. Server receives & stores ONLY ciphertext and nonce.
 *  4. Only authorized recipient can derive shared secret & decrypt plaintext.
 */

function getBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

// Helper: Convert Uint8Array to Base64 string
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper: Convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  // Node.js environment
  const nodeCrypto = require('crypto');
  return nodeCrypto.webcrypto.subtle as SubtleCrypto;
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    (window.crypto as any).getRandomValues(array);
    return array;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    (globalThis.crypto as any).getRandomValues(array);
    return array;
  }
  const nodeCrypto = require('crypto');
  nodeCrypto.randomFillSync(array);
  return array;
}

export interface E2EKeyPair {
  publicKeyRawHex: string;
  privateKeyJwk: JsonWebKey;
}

export interface EncryptedMessagePayload {
  encryptedContent: string; // Base64 ciphertext
  nonce: string;            // Base64 IV / Nonce
}

/**
 * Generate a new ECDH Keypair for E2E Encrypted Messaging
 */
export async function generateE2EKeyPair(): Promise<E2EKeyPair> {
  const subtle = getSubtleCrypto();
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );

  const rawPublicKey = await subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKeyRawHex: bytesToHex(new Uint8Array(rawPublicKey)),
    privateKeyJwk,
  };
}

/**
 * Derive shared AES-256-GCM key between my private key and partner's public key
 */
async function deriveSharedKey(
  myPrivateKeyJwk: JsonWebKey,
  theirPublicKeyRawHex: string,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();

  const myPrivateKey = await subtle.importKey(
    'jwk',
    myPrivateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits'],
  );

  const theirPublicKeyBytes = hexToBytes(theirPublicKeyRawHex);
  const theirPublicKey = await subtle.importKey(
    'raw',
    getBuffer(theirPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  return await subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt plaintext string on client device using recipient's public key
 */
export async function encryptClientMessage(
  plaintext: string,
  myPrivateKeyJwk: JsonWebKey,
  recipientPublicKeyRawHex: string,
): Promise<EncryptedMessagePayload> {
  const subtle = getSubtleCrypto();
  const sharedKey = await deriveSharedKey(myPrivateKeyJwk, recipientPublicKeyRawHex);

  const iv = new Uint8Array(12);
  getRandomValues(iv);

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: getBuffer(iv) },
    sharedKey,
    getBuffer(data),
  );

  return {
    encryptedContent: bytesToBase64(new Uint8Array(encryptedBuffer)),
    nonce: bytesToBase64(iv),
  };
}

/**
 * Decrypt ciphertext string on client device using sender's public key
 */
export async function decryptClientMessage(
  encryptedContentBase64: string,
  nonceBase64: string,
  myPrivateKeyJwk: JsonWebKey,
  senderPublicKeyRawHex: string,
): Promise<string> {
  const subtle = getSubtleCrypto();
  const sharedKey = await deriveSharedKey(myPrivateKeyJwk, senderPublicKeyRawHex);

  const iv = base64ToBytes(nonceBase64);
  const ciphertext = base64ToBytes(encryptedContentBase64);

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: getBuffer(iv) },
    sharedKey,
    getBuffer(ciphertext),
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
