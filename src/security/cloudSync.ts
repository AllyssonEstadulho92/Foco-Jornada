import { toBase64Url } from './crypto'
import { SecurityProfileStore, type SecurityProfile } from './profileStore'
import type { SecuritySession } from './SecurityManager'
import { EncryptedVaultStore, type EncryptedVaultRecord } from './vaultStore'

export const CLOUD_SYNC_VAULT_SAVED_EVENT = 'foco-jornada:cloud-sync-vault-saved'

export type CloudSyncStatus = 'synced' | 'conflict' | 'error'

export interface CloudSyncProfileState {
  enabled: boolean
  remoteRevision?: number
  lastSyncedFingerprint?: string
  lastSyncedAt?: string
  lastStatus?: CloudSyncStatus
  lastError?: string
}

export type CloudSyncAction = 'disabled' | 'idle' | 'synced' | 'pushed' | 'pulled' | 'conflict' | 'error'

export interface CloudSyncResult {
  action: CloudSyncAction
  session: SecuritySession
  message?: string
}

interface RemoteVaultEnvelope {
  revision: number
  updatedAt: string
  vault: EncryptedVaultRecord
}

type FetchLike = typeof fetch

class CloudSyncHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly currentRevision?: number,
  ) {
    super(message)
  }
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function normalizeEndpoint(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return null
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

function isEncryptedVaultRecord(value: unknown, profileId: string): value is EncryptedVaultRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const vault = value as Partial<EncryptedVaultRecord>
  return vault.profileId === profileId
    && vault.schemaVersion === 1
    && Number.isSafeInteger(vault.revision)
    && Number(vault.revision) >= 1
    && typeof vault.updatedAt === 'string'
    && Number.isFinite(Date.parse(vault.updatedAt))
    && typeof vault.iv === 'string'
    && vault.iv.length >= 12
    && typeof vault.ciphertext === 'string'
    && vault.ciphertext.length >= 16
}

function isRemoteVaultEnvelope(value: unknown, profileId: string): value is RemoteVaultEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const envelope = value as Partial<RemoteVaultEnvelope>
  return Number.isSafeInteger(envelope.revision)
    && Number(envelope.revision) >= 1
    && typeof envelope.updatedAt === 'string'
    && Number.isFinite(Date.parse(envelope.updatedAt))
    && isEncryptedVaultRecord(envelope.vault, profileId)
}

export function getCloudSyncEndpoint(): string | null {
  return normalizeEndpoint(import.meta.env.VITE_SYNC_API_URL)
}

export async function deriveCloudSyncToken(dataKey: CryptoKey, profileId: string): Promise<string> {
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', dataKey))
  const label = new TextEncoder().encode(`foco-jornada:cloud-sync-auth:${profileId}:v1:`)
  const material = new Uint8Array(label.length + rawKey.length)
  material.set(label)
  material.set(rawKey, label.length)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', asArrayBuffer(material)))
  rawKey.fill(0)
  material.fill(0)
  return toBase64Url(digest)
}

export async function fingerprintEncryptedVault(vault: EncryptedVaultRecord): Promise<string> {
  const canonical = JSON.stringify({
    profileId: vault.profileId,
    revision: vault.revision,
    schemaVersion: vault.schemaVersion,
    updatedAt: vault.updatedAt,
    iv: vault.iv,
    ciphertext: vault.ciphertext,
  })
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', asArrayBuffer(new TextEncoder().encode(canonical))),
  )
  return toBase64Url(digest)
}

async function parseError(response: Response): Promise<CloudSyncHttpError> {
  let message = `A sincronização remota respondeu com HTTP ${response.status}.`
  let currentRevision: number | undefined
  try {
    const body = await response.json() as { error?: unknown; currentRevision?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) message = body.error
    if (Number.isSafeInteger(body.currentRevision)) currentRevision = Number(body.currentRevision)
  } catch {
    // A resposta pode não ter JSON; mantém a mensagem HTTP segura.
  }
  return new CloudSyncHttpError(message, response.status, currentRevision)
}

async function parseRemoteEnvelope(response: Response, profileId: string): Promise<RemoteVaultEnvelope> {
  let value: unknown
  try {
    value = await response.json() as unknown
  } catch {
    throw new CloudSyncHttpError('O serviço remoto devolveu JSON inválido.', 502)
  }
  if (!isRemoteVaultEnvelope(value, profileId)) {
    throw new CloudSyncHttpError('O serviço remoto devolveu um cofre com estrutura inválida.', 502)
  }
  return value
}

export class CloudSyncClient {
  constructor(
    private readonly endpoint: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  private url(profileId: string): string {
    return `${this.endpoint}/v1/vault/${encodeURIComponent(profileId)}`
  }

  private headers(token: string): HeadersInit {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async getVault(profileId: string, token: string): Promise<RemoteVaultEnvelope | null> {
    const response = await this.fetcher(this.url(profileId), {
      method: 'GET',
      headers: this.headers(token),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (response.status === 404) return null
    if (!response.ok) throw await parseError(response)
    return parseRemoteEnvelope(response, profileId)
  }

  async putVault(
    profileId: string,
    token: string,
    expectedRevision: number,
    vault: EncryptedVaultRecord,
  ): Promise<RemoteVaultEnvelope> {
    const response = await this.fetcher(this.url(profileId), {
      method: 'PUT',
      headers: this.headers(token),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ expectedRevision, vault }),
    })
    if (!response.ok) throw await parseError(response)
    return parseRemoteEnvelope(response, profileId)
  }
}

export class CloudSyncManager {
  private readonly profiles = new SecurityProfileStore()
  private readonly vaults = new EncryptedVaultStore()
  private queue: Promise<void> = Promise.resolve()

  isConfigured(): boolean {
    return getCloudSyncEndpoint() !== null
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation)
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }

  private async updateSyncState(
    profileId: string,
    patch: Partial<CloudSyncProfileState>,
  ): Promise<SecurityProfile> {
    const current = await this.profiles.get(profileId)
    if (!current) throw new Error('Perfil local não encontrado durante a sincronização.')
    const updated: SecurityProfile = {
      ...current,
      cloudSync: {
        enabled: current.cloudSync?.enabled ?? false,
        ...current.cloudSync,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    }
    if (patch.lastError === undefined) delete updated.cloudSync?.lastError
    await this.profiles.put(updated)
    return updated
  }

  private async validateRemoteVault(session: SecuritySession, vault: EncryptedVaultRecord): Promise<void> {
    let candidate: unknown
    try {
      candidate = (await this.vaults.decryptRecord<unknown>(session.profile.id, session.dataKey, vault)).value
    } catch {
      throw new Error('A cópia remota não pôde ser autenticada/desencriptada com a chave deste perfil.')
    }

    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('A cópia remota desencriptada não contém um snapshot válido.')
    }
    const snapshot = candidate as { schemaVersion?: unknown; tables?: unknown; secureStorage?: unknown }
    if (
      snapshot.schemaVersion !== 1
      || !snapshot.tables
      || typeof snapshot.tables !== 'object'
      || Array.isArray(snapshot.tables)
      || !snapshot.secureStorage
      || typeof snapshot.secureStorage !== 'object'
      || Array.isArray(snapshot.secureStorage)
    ) {
      throw new Error('A cópia remota desencriptada usa uma estrutura não suportada.')
    }
  }

  async setEnabled(session: SecuritySession, enabled: boolean): Promise<SecuritySession> {
    return this.enqueue(async () => {
      if (enabled && !this.isConfigured()) {
        throw new Error('O endereço do serviço de sincronização ainda não está configurado nesta publicação.')
      }
      const profile = await this.updateSyncState(session.profile.id, {
        enabled,
        lastError: undefined,
        lastStatus: enabled ? session.profile.cloudSync?.lastStatus : undefined,
      })
      return { ...session, profile }
    })
  }

  async reconcile(session: SecuritySession): Promise<CloudSyncResult> {
    return this.enqueue(async () => this.reconcileUnsafe(session))
  }

  private async reconcileUnsafe(session: SecuritySession): Promise<CloudSyncResult> {
    const currentProfile = await this.profiles.get(session.profile.id)
    if (!currentProfile) {
      return { action: 'error', session, message: 'Perfil local não encontrado.' }
    }
    let currentSession: SecuritySession = { ...session, profile: currentProfile }
    if (!currentProfile.cloudSync?.enabled) return { action: 'disabled', session: currentSession }

    const endpoint = getCloudSyncEndpoint()
    if (!endpoint) {
      const message = 'O serviço de sincronização não está configurado nesta publicação.'
      const profile = await this.updateSyncState(currentProfile.id, {
        lastStatus: 'error',
        lastError: message,
      })
      return { action: 'error', session: { ...currentSession, profile }, message }
    }

    try {
      const localVault = await this.vaults.readRecord(currentProfile.id)
      const token = await deriveCloudSyncToken(session.dataKey, currentProfile.id)
      const client = new CloudSyncClient(endpoint)
      const remote = await client.getVault(currentProfile.id, token)
      const state = currentProfile.cloudSync

      if (!localVault && !remote) return { action: 'idle', session: currentSession }

      if (!localVault && remote) {
        await this.validateRemoteVault(currentSession, remote.vault)
        await this.vaults.replace(currentProfile.id, remote.vault)
        const fingerprint = await fingerprintEncryptedVault(remote.vault)
        const profile = await this.updateSyncState(currentProfile.id, {
          remoteRevision: remote.revision,
          lastSyncedFingerprint: fingerprint,
          lastSyncedAt: new Date().toISOString(),
          lastStatus: 'synced',
          lastError: undefined,
        })
        return { action: 'pulled', session: { ...currentSession, profile } }
      }

      if (!localVault) return { action: 'idle', session: currentSession }
      const localFingerprint = await fingerprintEncryptedVault(localVault)

      if (!remote) {
        if (state.remoteRevision !== undefined) {
          const message = 'O cofre remoto já existia anteriormente, mas deixou de estar disponível. A cópia local não foi enviada para evitar uma reposição silenciosa do histórico remoto.'
          const profile = await this.updateSyncState(currentProfile.id, {
            lastStatus: 'error',
            lastError: message,
          })
          return { action: 'error', session: { ...currentSession, profile }, message }
        }
        const uploaded = await client.putVault(currentProfile.id, token, 0, localVault)
        const profile = await this.updateSyncState(currentProfile.id, {
          remoteRevision: uploaded.revision,
          lastSyncedFingerprint: localFingerprint,
          lastSyncedAt: new Date().toISOString(),
          lastStatus: 'synced',
          lastError: undefined,
        })
        return { action: 'pushed', session: { ...currentSession, profile } }
      }

      const remoteFingerprint = await fingerprintEncryptedVault(remote.vault)
      if (remoteFingerprint === localFingerprint) {
        const profile = await this.updateSyncState(currentProfile.id, {
          remoteRevision: remote.revision,
          lastSyncedFingerprint: localFingerprint,
          lastSyncedAt: new Date().toISOString(),
          lastStatus: 'synced',
          lastError: undefined,
        })
        return { action: 'synced', session: { ...currentSession, profile } }
      }

      if (state.remoteRevision === undefined || !state.lastSyncedFingerprint) {
        const message = 'Foram encontrados dados diferentes no dispositivo e no serviço remoto sem uma base comum confirmada. Nenhuma das cópias foi sobrescrita.'
        const profile = await this.updateSyncState(currentProfile.id, {
          lastStatus: 'conflict',
          lastError: message,
        })
        return { action: 'conflict', session: { ...currentSession, profile }, message }
      }

      if (remote.revision < state.remoteRevision) {
        const message = 'A revisão remota recuou relativamente à última sincronização conhecida. A sincronização foi interrompida para proteger os dados.'
        const profile = await this.updateSyncState(currentProfile.id, {
          lastStatus: 'conflict',
          lastError: message,
        })
        return { action: 'conflict', session: { ...currentSession, profile }, message }
      }

      const localChanged = localFingerprint !== state.lastSyncedFingerprint
      const remoteChanged = remote.revision !== state.remoteRevision

      if (localChanged && remoteChanged) {
        const message = 'Existem alterações independentes neste dispositivo e noutro dispositivo. Nenhuma cópia foi sobrescrita automaticamente.'
        const profile = await this.updateSyncState(currentProfile.id, {
          lastStatus: 'conflict',
          lastError: message,
        })
        return { action: 'conflict', session: { ...currentSession, profile }, message }
      }

      if (remoteChanged && !localChanged) {
        await this.validateRemoteVault(currentSession, remote.vault)
        await this.vaults.replace(currentProfile.id, remote.vault)
        const profile = await this.updateSyncState(currentProfile.id, {
          remoteRevision: remote.revision,
          lastSyncedFingerprint: remoteFingerprint,
          lastSyncedAt: new Date().toISOString(),
          lastStatus: 'synced',
          lastError: undefined,
        })
        return { action: 'pulled', session: { ...currentSession, profile } }
      }

      if (localChanged && !remoteChanged) {
        if (remoteFingerprint !== state.lastSyncedFingerprint) {
          const message = 'A revisão remota não mudou, mas o conteúdo remoto já não corresponde à base conhecida. A sincronização foi interrompida.'
          const profile = await this.updateSyncState(currentProfile.id, {
            lastStatus: 'conflict',
            lastError: message,
          })
          return { action: 'conflict', session: { ...currentSession, profile }, message }
        }
        const uploaded = await client.putVault(currentProfile.id, token, remote.revision, localVault)
        const profile = await this.updateSyncState(currentProfile.id, {
          remoteRevision: uploaded.revision,
          lastSyncedFingerprint: localFingerprint,
          lastSyncedAt: new Date().toISOString(),
          lastStatus: 'synced',
          lastError: undefined,
        })
        return { action: 'pushed', session: { ...currentSession, profile } }
      }

      const message = 'O estado remoto não corresponde à última base sincronizada. Nenhuma cópia foi sobrescrita.'
      const profile = await this.updateSyncState(currentProfile.id, {
        lastStatus: 'conflict',
        lastError: message,
      })
      return { action: 'conflict', session: { ...currentSession, profile }, message }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha inesperada na sincronização remota.'
      const profile = await this.updateSyncState(currentProfile.id, {
        lastStatus: error instanceof CloudSyncHttpError && error.status === 409 ? 'conflict' : 'error',
        lastError: message,
      })
      currentSession = { ...currentSession, profile }
      return {
        action: error instanceof CloudSyncHttpError && error.status === 409 ? 'conflict' : 'error',
        session: currentSession,
        message,
      }
    }
  }
}

export const cloudSyncManager = new CloudSyncManager()
