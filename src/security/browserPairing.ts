import {
  decryptJson,
  encryptJson,
  fromBase64Url,
  importRawAesKey,
  randomBytes,
  randomToken,
  toBase64Url,
  type EncryptedValue,
} from './crypto'
import { cloudSyncManager, normalizeCloudSyncEndpoint } from './cloudSync'
import { SecurityProfileStore, type SecurityProfile } from './profileStore'
import type { SecuritySession } from './SecurityManager'

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const PAIRING_ID_PATTERN = /^[A-Za-z0-9_-]{20,64}$/
const PAIRING_SECRET_BYTES = 32

export interface BrowserPairingDescriptor {
  version: 1
  endpoint: string
  pairingId: string
  secret: string
}

export interface BrowserPairingCreated {
  session: SecuritySession
  url: string
  expiresAt: string
}

interface PairingEnvelope {
  payload: EncryptedValue
  expiresAt: string
}

interface PairingPayload {
  profile: SecurityProfile
}

type FetchLike = typeof fetch

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function digestWithContext(context: string, secret: Uint8Array): Promise<Uint8Array> {
  const label = encoder.encode(context)
  const material = new Uint8Array(label.length + secret.length)
  material.set(label)
  material.set(secret, label.length)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', asArrayBuffer(material)))
  material.fill(0)
  return digest
}

async function derivePairingMaterial(pairingId: string, secretText: string): Promise<{
  authToken: string
  encryptionKey: CryptoKey
}> {
  const secret = fromBase64Url(secretText)
  if (secret.length !== PAIRING_SECRET_BYTES) throw new Error('Ligação de associação inválida.')

  const authBytes = await digestWithContext(`foco-jornada:browser-pairing:auth:${pairingId}:v1:`, secret)
  const encryptionBytes = await digestWithContext(`foco-jornada:browser-pairing:encrypt:${pairingId}:v1:`, secret)
  secret.fill(0)
  try {
    return {
      authToken: toBase64Url(authBytes),
      encryptionKey: await importRawAesKey(encryptionBytes),
    }
  } finally {
    authBytes.fill(0)
    encryptionBytes.fill(0)
  }
}

function pairingContext(pairingId: string): string {
  return `foco-jornada:browser-pairing:profile:${pairingId}:v1`
}

function encodeDescriptor(descriptor: BrowserPairingDescriptor): string {
  return toBase64Url(encoder.encode(JSON.stringify({
    v: descriptor.version,
    e: descriptor.endpoint,
    i: descriptor.pairingId,
    s: descriptor.secret,
  })))
}

export function parseBrowserPairingLink(raw: string): BrowserPairingDescriptor | null {
  const input = raw.trim()
  if (!input) return null

  let hash = input
  try {
    if (/^https?:\/\//i.test(input)) hash = new URL(input).hash
  } catch {
    return null
  }
  if (hash.startsWith('#')) hash = hash.slice(1)

  const encoded = new URLSearchParams(hash).get('pair')
  if (!encoded) return null

  try {
    const value = JSON.parse(decoder.decode(fromBase64Url(encoded))) as {
      v?: unknown
      e?: unknown
      i?: unknown
      s?: unknown
    }
    if (value.v !== 1 || typeof value.e !== 'string' || typeof value.i !== 'string' || typeof value.s !== 'string') {
      return null
    }
    const endpoint = normalizeCloudSyncEndpoint(value.e)
    if (!endpoint || !PAIRING_ID_PATTERN.test(value.i)) return null
    const secret = fromBase64Url(value.s)
    const validSecret = secret.length === PAIRING_SECRET_BYTES
    secret.fill(0)
    if (!validSecret) return null
    return {
      version: 1,
      endpoint,
      pairingId: value.i,
      secret: value.s,
    }
  } catch {
    return null
  }
}

function buildPairingUrl(descriptor: BrowserPairingDescriptor): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin)
  base.hash = `pair=${encodeDescriptor(descriptor)}`
  return base.toString()
}

async function responseError(response: Response): Promise<Error> {
  try {
    const body = await response.json() as { error?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) return new Error(body.error)
  } catch {
    // Usa mensagem HTTP segura abaixo.
  }
  return new Error(`O serviço de associação respondeu com HTTP ${response.status}.`)
}

class BrowserPairingClient {
  constructor(
    private readonly endpoint: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  private url(pairingId: string): string {
    return `${this.endpoint}/v1/pair/${encodeURIComponent(pairingId)}`
  }

  private headers(authToken: string): HeadersInit {
    return {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    }
  }

  async put(pairingId: string, authToken: string, payload: EncryptedValue): Promise<string> {
    const response = await this.fetcher(this.url(pairingId), {
      method: 'PUT',
      headers: this.headers(authToken),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ payload }),
    })
    if (!response.ok) throw await responseError(response)
    const body = await response.json() as { expiresAt?: unknown }
    if (typeof body.expiresAt !== 'string' || !Number.isFinite(Date.parse(body.expiresAt))) {
      throw new Error('O serviço de associação devolveu uma validade inválida.')
    }
    return body.expiresAt
  }

  async get(pairingId: string, authToken: string): Promise<PairingEnvelope> {
    const response = await this.fetcher(this.url(pairingId), {
      method: 'GET',
      headers: this.headers(authToken),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok) throw await responseError(response)
    const body = await response.json() as Partial<PairingEnvelope>
    if (
      !body.payload
      || typeof body.payload.iv !== 'string'
      || typeof body.payload.ciphertext !== 'string'
      || typeof body.expiresAt !== 'string'
      || !Number.isFinite(Date.parse(body.expiresAt))
    ) {
      throw new Error('O serviço devolveu uma associação incompleta.')
    }
    return body as PairingEnvelope
  }

  async remove(pairingId: string, authToken: string): Promise<void> {
    const response = await this.fetcher(this.url(pairingId), {
      method: 'DELETE',
      headers: this.headers(authToken),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok && response.status !== 404) throw await responseError(response)
  }
}

export class BrowserPairingManager {
  private readonly profiles = new SecurityProfileStore()

  async create(session: SecuritySession): Promise<BrowserPairingCreated> {
    const current = await this.profiles.get(session.profile.id)
    if (!current) throw new Error('Perfil local não encontrado.')
    if (!current.cloudSync?.enabled) {
      throw new Error('Ativa primeiro a sincronização móvel ↔ computador neste perfil.')
    }

    const endpoint = cloudSyncManager.getEndpoint(current)
    if (!endpoint) throw new Error('Configura primeiro o endpoint Cloudflare da sincronização.')
    if (!current.cloudSync.remoteRevision) {
      throw new Error('Aguarda a primeira sincronização completa antes de associar outro navegador.')
    }

    const pairingId = randomToken(16)
    const secretBytes = randomBytes(PAIRING_SECRET_BYTES)
    const secret = toBase64Url(secretBytes)
    secretBytes.fill(0)
    const descriptor: BrowserPairingDescriptor = {
      version: 1,
      endpoint,
      pairingId,
      secret,
    }
    const { authToken, encryptionKey } = await derivePairingMaterial(pairingId, secret)

    const profileForPairing: SecurityProfile = {
      ...current,
      failedAttempts: 0,
      lockedUntil: undefined,
      cloudSync: {
        ...current.cloudSync,
        enabled: true,
        endpoint,
        lastError: undefined,
      },
    }
    const payload = await encryptJson(
      encryptionKey,
      { profile: profileForPairing } satisfies PairingPayload,
      pairingContext(pairingId),
    )
    const client = new BrowserPairingClient(endpoint)
    const expiresAt = await client.put(pairingId, authToken, payload)

    return {
      session: { ...session, profile: current },
      url: buildPairingUrl(descriptor),
      expiresAt,
    }
  }

  async redeem(rawLink: string): Promise<SecurityProfile> {
    const descriptor = parseBrowserPairingLink(rawLink)
    if (!descriptor) throw new Error('A ligação de associação não é válida.')

    const { authToken, encryptionKey } = await derivePairingMaterial(descriptor.pairingId, descriptor.secret)
    const client = new BrowserPairingClient(descriptor.endpoint)
    const envelope = await client.get(descriptor.pairingId, authToken)
    if (Date.parse(envelope.expiresAt) <= Date.now()) {
      throw new Error('Esta ligação de associação expirou. Cria uma nova no dispositivo que já tem os dados.')
    }

    let payload: PairingPayload
    try {
      payload = await decryptJson<PairingPayload>(
        encryptionKey,
        envelope.payload,
        pairingContext(descriptor.pairingId),
      )
    } catch {
      throw new Error('A ligação de associação não pôde ser autenticada ou desencriptada.')
    }
    if (!payload?.profile || typeof payload.profile !== 'object') {
      throw new Error('A associação não contém um perfil válido.')
    }

    await client.remove(descriptor.pairingId, authToken)
    return payload.profile
  }
}

export const browserPairingManager = new BrowserPairingManager()
