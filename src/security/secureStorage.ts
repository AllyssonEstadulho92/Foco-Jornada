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
    return this.backend?.getStorageItem(key) ?? this.fallback()?.getItem(key) ?? null
  }

  key(_index: number): string | null {
    return null
  }

  removeItem(key: string): void {
    if (this.backend) this.backend.removeStorageItem(key)\n    else this.fallback()?.removeItem(key)
  }

  setItem(key: string, value: string): void {
    if (this.backend) this.backend.setStorageItem(key, value)\n    else this.fallback()?.setItem(key, value)
  }

  async flush(): Promise<void> {
    await this.backend?.flushStorage()
  }
}

export const secureStorage = new SecureStorage()
