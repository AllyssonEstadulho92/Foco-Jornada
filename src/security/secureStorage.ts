export interface SecureStorageBackend {
  getStorageItem(key: string): string | null
  setStorageItem(key: string, value: string): void
  removeStorageItem(key: string): void
  flushStorage(): Promise<void>
}

class SecureStorage implements Storage {
  private backend: SecureStorageBackend | null = null

  private fallback(): Storage | null {
    if (import.meta.env.MODE !== 'test') return null
    try {
      return window.localStorage
    } catch {
      return null
    }
  }

  get length(): number {
    return this.backend ? 0 : (this.fallback()?.length ?? 0)
  }

  bind(backend: SecureStorageBackend): void {
    this.backend = backend
  }

  unbind(): void {
    this.backend = null
  }

  clear(): void {
    if (!this.backend) {
      this.fallback()?.clear()
      return
    }
    throw new Error('Limpeza global do armazenamento seguro não é permitida.')
  }

  getItem(key: string): string | null {
    return this.backend?.getStorageItem(key) ?? this.fallback()?.getItem(key) ?? null
  }

  key(index: number): string | null {
    return this.backend ? null : (this.fallback()?.key(index) ?? null)
  }

  removeItem(key: string): void {
    if (this.backend) this.backend.removeStorageItem(key)
    else this.fallback()?.removeItem(key)
  }

  setItem(key: string, value: string): void {
    if (this.backend) this.backend.setStorageItem(key, value)
    else this.fallback()?.setItem(key, value)
  }

  async flush(): Promise<void> {
    await this.backend?.flushStorage()
  }
}

export const secureStorage = new SecureStorage()
