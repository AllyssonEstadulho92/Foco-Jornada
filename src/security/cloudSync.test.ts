import { describe, expect, it, vi } from 'vitest'
import { generateDataKey } from './crypto'
import { CloudSyncClient, deriveCloudSyncToken } from './cloudSync'
import type { EncryptedVaultRecord } from './vaultStore'

describe('cloud sync', () => {
  it('deriva um token estável por perfil sem reutilizar a chave AES em claro', async () => {
    const key = await generateDataKey()
    const first = await deriveCloudSyncToken(key, 'profile-a-12345678')
    const repeated = await deriveCloudSyncToken(key, 'profile-a-12345678')
    const otherProfile = await deriveCloudSyncToken(key, 'profile-b-12345678')

    expect(first).toBe(repeated)
    expect(first).not.toBe(otherProfile)
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('trata 404 como ausência de cópia remota', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
    const client = new CloudSyncClient('https://sync.example.test', fetcher)

    await expect(client.getVault('profile-a-12345678', 'token')).resolves.toBeNull()
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('envia o cofre cifrado com revisão remota esperada', async () => {
    const vault: EncryptedVaultRecord = {
      profileId: 'profile-a-12345678',
      revision: 4,
      schemaVersion: 1,
      updatedAt: '2026-09-07T10:00:00.000Z',
      iv: 'abcdefghijklmnop',
      ciphertext: 'abcdefghijklmnopqrstuvwxyz0123456789_-',
    }
    const remote = {
      revision: 8,
      updatedAt: '2026-09-07T10:00:01.000Z',
      vault,
    }
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('PUT')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer derived-token' })
      expect(JSON.parse(String(init?.body))).toMatchObject({ expectedRevision: 7, vault })
      return new Response(JSON.stringify(remote), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch
    const client = new CloudSyncClient('https://sync.example.test', fetcher)

    await expect(client.putVault(vault.profileId, 'derived-token', 7, vault)).resolves.toEqual(remote)
  })
})
