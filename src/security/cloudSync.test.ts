import { describe, expect, it, vi } from 'vitest'
import { generateDataKey } from './crypto'
import {
  CloudSyncClient,
  deriveCloudSyncToken,
  getCloudSyncEndpoint,
  normalizeCloudSyncEndpoint,
} from './cloudSync'
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

  it('aceita apenas endpoint runtime HTTPS de workers.dev e remove barra final', () => {
    expect(normalizeCloudSyncEndpoint('https://foco-jornada.conta.workers.dev/'))
      .toBe('https://foco-jornada.conta.workers.dev')
    expect(normalizeCloudSyncEndpoint('http://foco-jornada.conta.workers.dev')).toBeNull()
    expect(normalizeCloudSyncEndpoint('https://example.com')).toBeNull()
    expect(normalizeCloudSyncEndpoint('https://user:pass@foco-jornada.conta.workers.dev')).toBeNull()
    expect(normalizeCloudSyncEndpoint('https://foco-jornada.conta.workers.dev?token=segredo')).toBeNull()
  })

  it('usa o endpoint guardado no perfil quando a publicação não fornece outro endereço operacional', () => {
    const endpoint = getCloudSyncEndpoint({
      cloudSync: {
        enabled: false,
        endpoint: 'https://foco-jornada.conta.workers.dev/',
      },
    })
    expect(endpoint).toBe('https://foco-jornada.conta.workers.dev')
  })

  it('valida a identidade do endpoint através de health antes de o usar', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://foco-jornada.conta.workers.dev/health')
      expect(init?.method).toBe('GET')
      return new Response(JSON.stringify({ ok: true, service: 'foco-jornada-sync' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as unknown as typeof fetch
    const client = new CloudSyncClient('https://foco-jornada.conta.workers.dev', fetcher)

    await expect(client.checkHealth()).resolves.toBeUndefined()
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('rejeita um endpoint que responde mas não é o serviço Foco Jornada', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true, service: 'outro-servico' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
    const client = new CloudSyncClient('https://foco-jornada.conta.workers.dev', fetcher)

    await expect(client.checkHealth()).rejects.toThrow('não corresponde ao serviço de sincronização')
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

  it('rejeita uma resposta remota que não contém um cofre válido para o perfil', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      revision: 2,
      updatedAt: '2026-09-07T10:00:00.000Z',
      vault: { profileId: 'outro-perfil' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
    const client = new CloudSyncClient('https://sync.example.test', fetcher)

    await expect(client.getVault('profile-a-12345678', 'token')).rejects.toThrow('estrutura inválida')
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
