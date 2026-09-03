import {
  fromBase64Url,
  importRawAesKey,
  randomBytes,
  toBase64Url,
  unwrapDataKey,
  wrapDataKey,
  type WrappedKey,
} from './crypto'

interface PrfExtensionResult {
  prf?: {
    enabled?: boolean
    results?: {
      first?: ArrayBuffer
    }
  }
}

export interface PasskeyMaterial {
  credentialId: string
  prfSalt: string
  wrappedDataKey: WrappedKey
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function getPrfResult(credential: PublicKeyCredential): Uint8Array | null {
  const results = credential.getClientExtensionResults() as AuthenticationExtensionsClientOutputs & PrfExtensionResult
  const first = results.prf?.results?.first
  return first ? new Uint8Array(first) : null
}

export function canAttemptPasskey(): boolean {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && 'PublicKeyCredential' in window
    && Boolean(navigator.credentials)
}

async function evaluatePrf(credentialId: string, salt: Uint8Array): Promise<Uint8Array> {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: asArrayBuffer(randomBytes(32)),
      allowCredentials: [{
        type: 'public-key',
        id: asArrayBuffer(fromBase64Url(credentialId)),
      }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: {
        prf: {
          eval: {
            first: asArrayBuffer(salt),
          },
        },
      } as AuthenticationExtensionsClientInputs,
    },
  }) as PublicKeyCredential | null

  if (!credential) throw new Error('A autenticação por passkey foi cancelada.')
  const result = getPrfResult(credential)
  if (!result || result.byteLength < 32) {
    throw new Error('Este navegador ou autenticador não disponibiliza a extensão PRF necessária para proteger o cofre.')
  }
  return result.slice(0, 32)
}

export async function createPasskeyMaterial(profileId: string, dataKey: CryptoKey): Promise<PasskeyMaterial> {
  if (!canAttemptPasskey()) throw new Error('WebAuthn/passkeys não estão disponíveis neste navegador.')

  const prfSalt = randomBytes(32)
  const userId = randomBytes(32)
  const created = await navigator.credentials.create({
    publicKey: {
      challenge: asArrayBuffer(randomBytes(32)),
      rp: { name: 'Foco Jornada' },
      user: {
        id: asArrayBuffer(userId),
        name: `foco-jornada-${profileId}`,
        displayName: 'Foco Jornada · Uso pessoal',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60_000,
      attestation: 'none',
      extensions: {
        prf: {
          eval: {
            first: asArrayBuffer(prfSalt),
          },
        },
      } as AuthenticationExtensionsClientInputs,
    },
  }) as PublicKeyCredential | null

  if (!created) throw new Error('A criação da passkey foi cancelada.')
  const credentialId = toBase64Url(new Uint8Array(created.rawId))
  let prfOutput = getPrfResult(created)
  if (!prfOutput || prfOutput.byteLength < 32) prfOutput = await evaluatePrf(credentialId, prfSalt)

  const wrappingKey = await importRawAesKey(prfOutput.slice(0, 32))
  const wrappedDataKey = await wrapDataKey(
    dataKey,
    wrappingKey,
    `foco-jornada:passkey-wrap:${profileId}`,
  )
  return {
    credentialId,
    prfSalt: toBase64Url(prfSalt),
    wrappedDataKey,
  }
}

export async function unwrapWithPasskey(
  profileId: string,
  material: PasskeyMaterial,
): Promise<CryptoKey> {
  if (!canAttemptPasskey()) throw new Error('WebAuthn/passkeys não estão disponíveis neste navegador.')
  const output = await evaluatePrf(material.credentialId, fromBase64Url(material.prfSalt))
  const wrappingKey = await importRawAesKey(output)
  return unwrapDataKey(
    material.wrappedDataKey,
    wrappingKey,
    `foco-jornada:passkey-wrap:${profileId}`,
  )
}
