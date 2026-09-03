export interface SecureStorageBackend {
  getStorageItem(key: string): string | null
  setStorageItem(key: string, value: string): void
  removeStorageItem(key: string): void
  flushStorage(): Promise<void>
}

class SecureStorage implements Storage {
  private backend: SecureStorageBackend | null = null

  get length(): number {
    return 0
  }

  bind(backend: SecureStorageBackend): void {
    this.backend = backend
  }

  unbind(): void {
    this.backend = null
  }

  clear(): void {
    throw new Error('Limpeza global do armazenamento seguro não é permitida.')
  }

  getItem(key: string): string | null {
    return this.backend?.getStorageItem(key) ?? null
  }

  key(_index: number): string | null {
    return null
  }

  removeItem(key: string): void {
    this.backend?.removeStorageItem(key)
  }

  setItem(key: string, value: string): void {
    this.backend?.setStorageItem(key, value)
  }

  async flush(): Promise<void> {
    await this.backend?.flushStorage()
  }
}

export const secureStorage = new SecureStorage()
