import { describe, expect, it } from 'vitest'
import { decryptJson, encryptJson, generateDataKey } from './crypto'
import {
  CloudSyncManager,
  type CloudSyncRemoteClient,
  type RemoteVaultEnvelope,
} from './cloudSync'
import type { SecurityProfile } from './profileStore'
import type { SecuritySession } from './SecurityManager'
import type { EncryptedVaultRecord } from './vaultStore'

const PROFILE_ID = 'profile-mobile-web-12345678'
const ENDPOINT = 'https://foco-jornada.test.workers.dev'

interface TestJourney {
  id: string
  note: string
}

interface TestSnapshot {
  schemaVersion: 1
  tables: {
    journeys: TestJourney[]
  }
  secureStorage: Record<string, string>
}

function vaultContext(profileId: string): string {
  return `foco-jornada:vault:${profileId}:v1`
}

function testProfile(): SecurityProfile {
  const now = '2026-09-07T10:00:00.000Z'
  const wrapped = {
    iv: 'abcdefghijklmnop',
    ciphertext: 'abcdefghijklmnopqrstuvwxyz0123456789',
  }
  return {
    id: PROFILE_ID,
    label: 'Perfil sincronizado',
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    secretType: 'pin',
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 600_000,
      salt: 'abcdefghijklmnop',
    },
    wrappedDataKey: wrapped,
    recoveryWrappedDataKey: wrapped,
    failedAttempts: 0,
    autoLockMinutes: 5,
    cloudSync: {
      enabled: true,
      endpoint: ENDPOINT,
    },
  }
}

async function makeVault(
  dataKey: CryptoKey,
  revision: number,
  snapshot: TestSnapshot,
): Promise<EncryptedVaultRecord> {
  const encrypted = await encryptJson(dataKey, snapshot, vaultContext(PROFILE_ID))
  return {
    profileId: PROFILE_ID,
    revision,
    schemaVersion: 1,
    updatedAt: new Date(Date.UTC(2026, 8, 7, 10, 0, revision)).toISOString(),
    ...encrypted,
  }
}

class MemoryProfileStore {
  constructor(private profile: SecurityProfile) {}

  async get(id: string): Promise<SecurityProfile | undefined> {
    return id === this.profile.id ? this.profile : undefined
  }

  async put(profile: SecurityProfile): Promise<void> {
    this.profile = profile
  }
}

class MemoryVaultStore {
  constructor(public record?: EncryptedVaultRecord) {}

  async readRecord(profileId: string): Promise<EncryptedVaultRecord | undefined> {
    return this.record?.profileId === profileId ? this.record : undefined
  }

  async replace(profileId: string, record: EncryptedVaultRecord): Promise<void> {
    if (profileId !== record.profileId) throw new Error('Perfil incompatível no teste.')
    this.record = record
  }

  async decryptRecord<T>(
    profileId: string,
    key: CryptoKey,
    record: EncryptedVaultRecord,
  ): Promise<{ value: T; revision: number }> {
    const value = await decryptJson<T>(key, record, vaultContext(profileId))
    return { value, revision: record.revision }
  }

  async snapshot(dataKey: CryptoKey): Promise<TestSnapshot> {
    if (!this.record) throw new Error('Cofre local inexistente no teste.')
    return (await this.decryptRecord<TestSnapshot>(PROFILE_ID, dataKey, this.record)).value
  }
}

class MemoryRemote {
  record: RemoteVaultEnvelope | null = null
  private authToken: string | null = null

  createClient = (): CloudSyncRemoteClient => ({
    checkHealth: async () => undefined,
    getVault: async (profileId, token) => {
      if (profileId !== PROFILE_ID) throw new Error('Perfil remoto inesperado no teste.')
      if (this.record && token !== this.authToken) throw new Error('Token remoto incompatível no teste.')
      return this.record
    },
    putVault: async (profileId, token, expectedRevision, vault) => {
      if (profileId !== PROFILE_ID || vault.profileId !== PROFILE_ID) {
        throw new Error('Perfil remoto inesperado no teste.')
      }
      const currentRevision = this.record?.revision ?? 0
      if (expectedRevision !== currentRevision) {
        throw new Error(`Revisão remota esperada ${expectedRevision}, atual ${currentRevision}.`)
      }
      if (this.authToken && token !== this.authToken) throw new Error('Token remoto incompatível no teste.')
      this.authToken ??= token
      this.record = {
        revision: currentRevision + 1,
        updatedAt: new Date(Date.UTC(2026, 8, 7, 11, 0, currentRevision + 1)).toISOString(),
        vault,
      }
      return this.record
    },
  })

  async snapshot(dataKey: CryptoKey): Promise<TestSnapshot> {
    if (!this.record) throw new Error('Cofre remoto inexistente no teste.')
    return decryptJson<TestSnapshot>(dataKey, this.record.vault, vaultContext(PROFILE_ID))
  }
}

async function setupReplicas() {
  const dataKey = await generateDataKey()
  const initial: TestSnapshot = {
    schemaVersion: 1,
    tables: { journeys: [] },
    secureStorage: {
      'foco-jornada-work-hours-v1': '{"state":{"entries":[]}}',
      'foco-jornada-notifications-v1': '{"state":{"notifications":[]}}',
    },
  }
  const localA = new MemoryVaultStore(await makeVault(dataKey, 1, initial))
  const localB = new MemoryVaultStore()
  const profileA = new MemoryProfileStore(testProfile())
  const profileB = new MemoryProfileStore(testProfile())
  const remote = new MemoryRemote()
  const managerA = new CloudSyncManager({
    profiles: profileA,
    vaults: localA,
    createClient: remote.createClient,
  })
  const managerB = new CloudSyncManager({
    profiles: profileB,
    vaults: localB,
    createClient: remote.createClient,
  })

  let sessionA: SecuritySession = { profile: testProfile(), dataKey }
  const firstPush = await managerA.reconcile(sessionA)
  expect(firstPush.action).toBe('pushed')
  sessionA = firstPush.session

  await profileB.put({ ...sessionA.profile })
  let sessionB: SecuritySession = { profile: { ...sessionA.profile }, dataKey }
  const firstPull = await managerB.reconcile(sessionB)
  expect(firstPull.action).toBe('pulled')
  sessionB = firstPull.session

  expect(await localB.snapshot(dataKey)).toEqual(initial)

  return {
    dataKey,
    localA,
    localB,
    managerA,
    managerB,
    remote,
    sessionA,
    sessionB,
  }
}

describe('cloud sync entre duas réplicas do mesmo perfil', () => {
  it('converge criação, edição e eliminação nos dois sentidos sem duplicar registos', async () => {
    const state = await setupReplicas()

    const created: TestSnapshot = {
      schemaVersion: 1,
      tables: {
        journeys: [{ id: 'journey-1', note: 'criado no mobile' }],
      },
      secureStorage: {
        'foco-jornada-work-hours-v1': '{"state":{"entries":[{"id":"hours-mobile"}]}}',
        'foco-jornada-notifications-v1': '{"state":{"notifications":[{"id":"notice-mobile"}]}}',
      },
    }
    state.localA.record = await makeVault(state.dataKey, 2, created)
    const pushCreated = await state.managerA.reconcile(state.sessionA)
    expect(pushCreated.action).toBe('pushed')
    state.sessionA = pushCreated.session

    const pullCreated = await state.managerB.reconcile(state.sessionB)
    expect(pullCreated.action).toBe('pulled')
    state.sessionB = pullCreated.session
    expect(await state.localB.snapshot(state.dataKey)).toEqual(created)

    const edited: TestSnapshot = {
      schemaVersion: 1,
      tables: {
        journeys: [{ id: 'journey-1', note: 'editado na web' }],
      },
      secureStorage: {
        ...created.secureStorage,
        'foco-jornada-notifications-v1': '{"state":{"notifications":[{"id":"notice-web"}]}}',
      },
    }
    state.localB.record = await makeVault(state.dataKey, 3, edited)
    const pushEdited = await state.managerB.reconcile(state.sessionB)
    expect(pushEdited.action).toBe('pushed')
    state.sessionB = pushEdited.session

    const pullEdited = await state.managerA.reconcile(state.sessionA)
    expect(pullEdited.action).toBe('pulled')
    state.sessionA = pullEdited.session
    expect(await state.localA.snapshot(state.dataKey)).toEqual(edited)

    const deleted: TestSnapshot = {
      schemaVersion: 1,
      tables: { journeys: [] },
      secureStorage: {
        'foco-jornada-work-hours-v1': edited.secureStorage['foco-jornada-work-hours-v1'],
        'foco-jornada-notifications-v1': '{"state":{"notifications":[]}}',
      },
    }
    state.localA.record = await makeVault(state.dataKey, 4, deleted)
    const pushDeleted = await state.managerA.reconcile(state.sessionA)
    expect(pushDeleted.action).toBe('pushed')
    state.sessionA = pushDeleted.session

    const pullDeleted = await state.managerB.reconcile(state.sessionB)
    expect(pullDeleted.action).toBe('pulled')
    state.sessionB = pullDeleted.session

    const finalA = await state.localA.snapshot(state.dataKey)
    const finalB = await state.localB.snapshot(state.dataKey)
    const finalRemote = await state.remote.snapshot(state.dataKey)
    expect(finalA).toEqual(deleted)
    expect(finalB).toEqual(deleted)
    expect(finalRemote).toEqual(deleted)
    expect(finalB.tables.journeys).toHaveLength(0)
  })

  it('deteta edição simultânea e não sobrescreve a cópia local divergente', async () => {
    const state = await setupReplicas()

    const mobileChange: TestSnapshot = {
      schemaVersion: 1,
      tables: { journeys: [{ id: 'journey-mobile', note: 'alteração mobile' }] },
      secureStorage: {},
    }
    const webChange: TestSnapshot = {
      schemaVersion: 1,
      tables: { journeys: [{ id: 'journey-web', note: 'alteração web' }] },
      secureStorage: {},
    }

    state.localA.record = await makeVault(state.dataKey, 2, mobileChange)
    state.localB.record = await makeVault(state.dataKey, 2, webChange)

    const mobilePush = await state.managerA.reconcile(state.sessionA)
    expect(mobilePush.action).toBe('pushed')
    state.sessionA = mobilePush.session

    const webConflict = await state.managerB.reconcile(state.sessionB)
    expect(webConflict.action).toBe('conflict')
    expect(webConflict.message).toContain('alterações independentes')

    expect(await state.localB.snapshot(state.dataKey)).toEqual(webChange)
    expect(await state.remote.snapshot(state.dataKey)).toEqual(mobileChange)
  })
})
