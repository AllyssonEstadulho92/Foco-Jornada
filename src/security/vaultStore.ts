import { decryptJson, encryptJson, type EncryptedValue } from './crypto'

export interface EncryptedVaultRecord extends EncryptedValue {
  profileId: string
  revision: number
  schemaVersion: 1
  updatedAt: string
}

const DB_NAME = 'foco-jornada-vault-v1'
const STORE_NAME = 'vaults'
const DB_VERSION = 1

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'profileId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o cofre local.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha ao aceder ao cofre local.'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('Operação do cofre cancelada.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha no cofre local.'))
  })
}

function context(profileId: string): string {
  return `foco-jornada:vault:${profileId}:v1`
}

export class EncryptedVaultStore {
  async readRecord(profileId: string): Promise<EncryptedVaultRecord | undefined> {
    const db = await openVaultDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const value = await requestResult(
        transaction.objectStore(STORE_NAME).get(profileId) as IDBRequest<EncryptedVaultRecord | undefined>,
      )
      await transactionDone(transaction)
      return value
    } finally {
      db.close()
    }
  }

  async decryptRecord<T>(
    profileId: string,
    key: CryptoKey,
    record: EncryptedVaultRecord,
  ): Promise<{ value: T; revision: number }> {
    if (record.profileId !== profileId || record.schemaVersion !== 1) {
      throw new Error('O cofre encriptado não pertence a este perfil ou usa uma versão inválida.')
    }
    if (!Number.isSafeInteger(record.revision) || record.revision < 1) {
      throw new Error('A revisão do cofre encriptado é inválida.')
    }
    const value = await decryptJson<T>(key, record, context(profileId))
    return { value, revision: record.revision }
  }

  async load<T>(profileId: string, key: CryptoKey): Promise<{ value: T; revision: number } | null> {
    const record = await this.readRecord(profileId)
    if (!record) return null
    return this.decryptRecord<T>(profileId, key, record)
  }

  async save<T>(profileId: string, key: CryptoKey, value: T, expectedRevision: number): Promise<number> {
    const encrypted = await encryptJson(key, value, context(profileId))
    const db = await openVaultDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const current = await requestResult(store.get(profileId) as IDBRequest<EncryptedVaultRecord | undefined>)
      const currentRevision = current?.revision ?? 0
      if (currentRevision !== expectedRevision) {
        transaction.abort()
        throw new Error('O cofre foi alterado noutra janela. Atualiza a aplicação antes de continuar.')
      }
      const revision = currentRevision + 1
      const record: EncryptedVaultRecord = {
        profileId,
        revision,
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        ...encrypted,
      }
      store.put(record)
      await transactionDone(transaction)
      return revision
    } finally {
      db.close()
    }
  }

  async replace(profileId: string, record: EncryptedVaultRecord): Promise<void> {
    if (record.profileId !== profileId) throw new Error('A cópia pertence a outro perfil.')
    const db = await openVaultDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(record)
      await transactionDone(transaction)
    } finally {
      db.close()
    }
  }

  async delete(profileId: string): Promise<void> {
    const db = await openVaultDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(profileId)
      await transactionDone(transaction)
    } finally {
      db.close()
    }
  }
}
