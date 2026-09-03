import type { WrappedKey } from './crypto'

export interface PasskeyProfile {
  credentialId: string
  prfSalt: string
  wrappedDataKey: WrappedKey
  createdAt: string
}

export interface SecurityProfile {
  id: string
  label: string
  createdAt: string
  updatedAt: string
  lastUsedAt: string
  secretType: 'pin' | 'password'
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
  }
  wrappedDataKey: WrappedKey
  recoveryWrappedDataKey: WrappedKey
  passkey?: PasskeyProfile
  failedAttempts: number
  lockedUntil?: string
  autoLockMinutes: number
}

const DB_NAME = 'foco-jornada-security-v1'
const STORE_NAME = 'profiles'
const DB_VERSION = 1

function openSecurityDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o armazenamento de segurança.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha no armazenamento de segurança.'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('Operação de segurança cancelada.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha no armazenamento de segurança.'))
  })
}

export class SecurityProfileStore {
  async list(): Promise<SecurityProfile[]> {
    const db = await openSecurityDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const values = await requestResult(transaction.objectStore(STORE_NAME).getAll() as IDBRequest<SecurityProfile[]>)
      await transactionDone(transaction)
      return values.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    } finally {
      db.close()
    }
  }

  async get(id: string): Promise<SecurityProfile | undefined> {
    const db = await openSecurityDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const value = await requestResult(transaction.objectStore(STORE_NAME).get(id) as IDBRequest<SecurityProfile | undefined>)
      await transactionDone(transaction)
      return value
    } finally {
      db.close()
    }
  }

  async put(profile: SecurityProfile): Promise<void> {
    const db = await openSecurityDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(profile)
      await transactionDone(transaction)
    } finally {
      db.close()
    }
  }

  async delete(id: string): Promise<void> {
    const db = await openSecurityDb()
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(id)
      await transactionDone(transaction)
    } finally {
      db.close()
    }
  }
}
