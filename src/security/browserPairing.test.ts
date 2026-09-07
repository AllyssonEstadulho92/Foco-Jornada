import { describe, expect, it } from 'vitest'
import { toBase64Url } from './crypto'
import { parseBrowserPairingLink } from './browserPairing'

function pairingLink(overrides: Partial<{ endpoint: string; pairingId: string; secret: string }> = {}): string {
  const descriptor = {
    v: 1,
    e: overrides.endpoint ?? 'https://foco-jornada.example.workers.dev',
    i: overrides.pairingId ?? 'ABCDEFGHIJKLMNOPQRSTUV',
    s: overrides.secret ?? toBase64Url(new Uint8Array(32).fill(7)),
  }
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(descriptor)))
  return `https://allyssonestadulho92.github.io/Foco-Jornada/#pair=${encoded}`
}

describe('browser pairing', () => {
  it('aceita uma ligação com endpoint workers.dev, id e segredo de 256 bits', () => {
    expect(parseBrowserPairingLink(pairingLink())).toEqual({
      version: 1,
      endpoint: 'https://foco-jornada.example.workers.dev',
      pairingId: 'ABCDEFGHIJKLMNOPQRSTUV',
      secret: toBase64Url(new Uint8Array(32).fill(7)),
    })
  })

  it('rejeita endpoints fora de workers.dev', () => {
    expect(parseBrowserPairingLink(pairingLink({ endpoint: 'https://example.com' }))).toBeNull()
  })

  it('rejeita segredos com entropia insuficiente', () => {
    expect(parseBrowserPairingLink(pairingLink({
      secret: toBase64Url(new Uint8Array(16).fill(7)),
    }))).toBeNull()
  })

  it('rejeita fragmentos corrompidos', () => {
    expect(parseBrowserPairingLink('https://allyssonestadulho92.github.io/Foco-Jornada/#pair=%%%')).toBeNull()
  })
})
