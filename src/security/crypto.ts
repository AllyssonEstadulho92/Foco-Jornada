const encoder = new TextEncoder()
const decoder = new TextDecoder()

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export const PBKDF2_ITERATIONS = 600_000
export const PIN_LENGTH = 6

export interface WrappedKey {
  iv: string
  ciphertext: string
}

export interface EncryptedValue {
  iv: string
  ciphertext: string
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return base64ToBytes(normalized + padding)
}

export function randomBytes(length: number): Uint8Array {
  const value = new Uint8Array(length)
  crypto.getRandomValues(value)
  return value
}

export function randomToken(length = 32): string {
  return toBase64Url(randomBytes(length))
}

export function normalizeRecoveryCode(value: string): string {
  return value.replace(/\s+/g, '').replace(/-/g, '').trim()
}

export function formatRecoveryCode(bytes: Uint8Array): string {
  const encoded = toBase64Url(bytes)
  return encoded.match(/.{1,5}/g)?.join('-') ?? encoded
}

export function validateSecret(secret: string, type: 'pin' | 'password'): string | null {
  if (type === 'pin') {
    if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(secret)) return `O PIN deve ter exatamente ${PIN_LENGTH} dígitos.`
    return null
  }
  if (secret.length < 12) return 'A palavra-passe deve ter pelo menos 12 caracteres.'
  if (secret.length > 256) return 'A palavra-passe é demasiado longa.'
  return null
}

export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function deriveSecretKey(secret: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', asArrayBuffer(encoder.encode(secret)), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: asArrayBuffer(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function importRawAesKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', asArrayBuffer(bytes), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function aesEncrypt(key: CryptoKey, plaintext: Uint8Array, additionalData: string): Promise<EncryptedValue> {
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(iv), additionalData: asArrayBuffer(encoder.encode(additionalData)), tagLength: 128 },
    key,
    asArrayBuffer(plaintext),
  )
  return { iv: toBase64Url(iv), ciphertext: toBase64Url(new Uint8Array(ciphertext)) }
}

async function aesDecrypt(key: CryptoKey, value: EncryptedValue, additionalData: string): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: asArrayBuffer(fromBase64Url(value.iv)),
      additionalData: asArrayBuffer(encoder.encode(additionalData)),
      tagLength: 128,
    },
    key,
    asArrayBuffer(fromBase64Url(value.ciphertext)),
  )
  return new Uint8Array(plaintext)
}

export async function wrapDataKey(dataKey: CryptoKey, wrappingKey: CryptoKey, context: string): Promise<WrappedKey> {
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', dataKey))
  return aesEncrypt(wrappingKey, raw, context)
}

export async function unwrapDataKey(wrapped: WrappedKey, wrappingKey: CryptoKey, context: string): Promise<CryptoKey> {
  const raw = await aesDecrypt(wrappingKey, wrapped, context)
  return crypto.subtle.importKey('raw', asArrayBuffer(raw), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

export async function encryptJson(key: CryptoKey, value: unknown, context: string): Promise<EncryptedValue> {
  return aesEncrypt(key, encoder.encode(JSON.stringify(value)), context)
}

export async function decryptJson<T>(key: CryptoKey, value: EncryptedValue, context: string): Promise<T> {
  const bytes = await aesDecrypt(key, value, context)
  return JSON.parse(decoder.decode(bytes)) as T
}
