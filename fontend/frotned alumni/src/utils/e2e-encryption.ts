/**
 * End-to-End (E2E) Zero-Knowledge Encryption Module for Frontend
 * Standardized on Web Crypto API (SubtleCrypto: ECDH P-256 / X25519 + AES-256-GCM)
 */

function getBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
  throw new Error('Web Crypto API (subtle) not supported in this environment');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (getRandomValues) not supported in this environment');
}

export interface E2EKeyPair {
  publicKeyRawHex: string;
  privateKeyJwk: JsonWebKey;
}

export interface EncryptedMessagePayload {
  encryptedContent: string; // Base64 ciphertext
  nonce: string;            // Base64 IV / Nonce
}

export async function generateE2EKeyPair(): Promise<E2EKeyPair> {
  const subtle = getSubtleCrypto();
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );

  const rawPubKeyBuffer = await subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyRawHex = bytesToHex(new Uint8Array(rawPubKeyBuffer));

  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKeyRawHex,
    privateKeyJwk,
  };
}

export async function deriveSharedAesKey(
  myPrivateKeyJwk: JsonWebKey,
  recipientPublicKeyHex: string,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();

  const myPrivateKey = await subtle.importKey(
    'jwk',
    myPrivateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits'],
  );

  const recipientRawBytes = hexToBytes(recipientPublicKeyHex);
  const recipientPublicKey = await subtle.importKey(
    'raw',
    getBuffer(recipientRawBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  const sharedAesKey = await subtle.deriveKey(
    {
      name: 'ECDH',
      public: recipientPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );

  return sharedAesKey;
}

export async function encryptClientMessage(
  plaintext: string,
  myPrivateKeyJwk: JsonWebKey,
  recipientPublicKeyHex: string,
): Promise<EncryptedMessagePayload> {
  const subtle = getSubtleCrypto();
  const sharedKey = await deriveSharedAesKey(myPrivateKeyJwk, recipientPublicKeyHex);

  const iv = getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: getBuffer(iv),
    },
    sharedKey,
    getBuffer(encodedText),
  );

  return {
    encryptedContent: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    nonce: bytesToBase64(iv),
  };
}

export async function decryptClientMessage(
  encryptedContentBase64: string,
  nonceBase64: string,
  myPrivateKeyJwk: JsonWebKey,
  senderPublicKeyHex: string,
): Promise<string> {
  const subtle = getSubtleCrypto();
  const sharedKey = await deriveSharedAesKey(myPrivateKeyJwk, senderPublicKeyHex);

  const ciphertext = base64ToBytes(encryptedContentBase64);
  const iv = base64ToBytes(nonceBase64);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: getBuffer(iv),
    },
    sharedKey,
    getBuffer(ciphertext),
  );

  return new TextDecoder().decode(decryptedBuffer);
}
