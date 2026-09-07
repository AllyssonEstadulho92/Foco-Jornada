/* global crypto, Response, TextEncoder, URL */

const MAX_BODY_CHARS = 6_500_000
const MAX_CIPHERTEXT_CHARS = 6_000_000
const PROFILE_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function originAllowed(origin, env) {
  if (!origin) return true
  return allowedOrigins(env).includes(origin)
}

function withCors(response, origin, env) {
  if (!origin || !originAllowed(origin, env)) return response
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Vary', 'Origin')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function bearerToken(request) {
  const authorization = request.headers.get('Authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  const token = match?.[1]?.trim() || ''
  return TOKEN_PATTERN.test(token) ? token : null
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function secureEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false
  let different = 0
  for (let index = 0; index < left.length; index += 1) {
    different |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return different === 0
}

function validVault(vault, profileId) {
  return Boolean(
    vault
    && typeof vault === 'object'
    && !Array.isArray(vault)
    && vault.profileId === profileId
    && vault.schemaVersion === 1
    && Number.isSafeInteger(vault.revision)
    && vault.revision >= 1
    && typeof vault.updatedAt === 'string'
    && Number.isFinite(Date.parse(vault.updatedAt))
    && typeof vault.iv === 'string'
    && vault.iv.length >= 12
    && vault.iv.length <= 256
    && BASE64URL_PATTERN.test(vault.iv)
    && typeof vault.ciphertext === 'string'
    && vault.ciphertext.length >= 16
    && vault.ciphertext.length <= MAX_CIPHERTEXT_CHARS
    && BASE64URL_PATTERN.test(vault.ciphertext)
  )
}

function envelope(record) {
  return {
    revision: record.revision,
    updatedAt: record.updatedAt,
    vault: record.vault,
  }
}

export class SyncVault {
  constructor(state) {
    this.state = state
  }

  async fetch(request) {
    const url = new URL(request.url)
    const profileId = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || '')
    if (!PROFILE_ID_PATTERN.test(profileId)) return jsonResponse({ error: 'Identificador de perfil inválido.' }, 400)

    const current = await this.state.storage.get('record')
    const token = bearerToken(request)
    if (!token) return jsonResponse({ error: 'Autenticação de sincronização em falta ou inválida.' }, 401)

    if (request.method === 'GET') {
      if (!current) return jsonResponse({ error: 'Cofre remoto ainda não existe.' }, 404)
      const authHash = await hashToken(token)
      if (!secureEqual(authHash, current.authHash)) {
        return jsonResponse({ error: 'Autenticação de sincronização inválida.' }, 401)
      }
      return jsonResponse(envelope(current))
    }

    if (request.method !== 'PUT') return jsonResponse({ error: 'Método não permitido.' }, 405)

    const contentLength = Number(request.headers.get('Content-Length') || '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_CHARS) {
      return jsonResponse({ error: 'Pedido de sincronização demasiado grande.' }, 413)
    }

    if (current) {
      const authHash = await hashToken(token)
      if (!secureEqual(authHash, current.authHash)) {
        return jsonResponse({ error: 'Autenticação de sincronização inválida.' }, 401)
      }
    }

    let body
    try {
      const text = await request.text()
      if (text.length > MAX_BODY_CHARS) return jsonResponse({ error: 'Pedido de sincronização demasiado grande.' }, 413)
      body = JSON.parse(text)
    } catch {
      return jsonResponse({ error: 'JSON de sincronização inválido.' }, 400)
    }

    if (!Number.isSafeInteger(body?.expectedRevision) || body.expectedRevision < 0) {
      return jsonResponse({ error: 'Revisão remota esperada inválida.' }, 400)
    }
    if (!validVault(body.vault, profileId)) {
      return jsonResponse({ error: 'Cofre cifrado inválido ou incompatível com o perfil.' }, 400)
    }

    const currentRevision = current?.revision ?? 0
    if (body.expectedRevision !== currentRevision) {
      return jsonResponse({
        error: 'A cópia remota foi alterada por outro dispositivo.',
        currentRevision,
      }, 409)
    }

    const next = {
      authHash: current?.authHash ?? await hashToken(token),
      revision: currentRevision + 1,
      updatedAt: new Date().toISOString(),
      vault: body.vault,
    }
    await this.state.storage.put('record', next)
    return jsonResponse(envelope(next))
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      if (!originAllowed(origin, env)) return jsonResponse({ error: 'Origem não autorizada.' }, 403)
      return withCors(new Response(null, { status: 204 }), origin, env)
    }

    if (!originAllowed(origin, env)) return jsonResponse({ error: 'Origem não autorizada.' }, 403)

    if (url.pathname === '/health' && request.method === 'GET') {
      return withCors(jsonResponse({ ok: true, service: 'foco-jornada-sync' }), origin, env)
    }

    const match = /^\/v1\/vault\/([A-Za-z0-9_-]{16,128})$/.exec(url.pathname)
    if (!match) return withCors(jsonResponse({ error: 'Rota não encontrada.' }, 404), origin, env)

    const profileId = match[1]
    const id = env.SYNC_VAULTS.idFromName(profileId)
    const response = await env.SYNC_VAULTS.get(id).fetch(request)
    return withCors(response, origin, env)
  },
}
