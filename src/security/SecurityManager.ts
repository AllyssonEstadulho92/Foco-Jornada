import {
  PBKDF2_ITERATIONS,
  deriveSecretKey,
  formatRecoveryCode,
  fromBase64Url,
  generateDataKey,
  importRawAesKey,
  normalizeRecoveryCode,
  randomBytes,
  randomToken,
  toBase64Url,
  unwrapDataKey,
  validateSecret,
  wrapDataKey,
} from './crypto'
import { SecurityProfileStore, type SecurityProfile } from './profileStore'
import { EncryptedVaultStore } from './vaultStore'
import { canAttemptPasskey, createPasskeyMaterial, unwrapWithPasskey } from './webauthn'

const ACTIVE_PROFILE_KEY = 'foco-jornada-security-active-profile-v1'

export interface SecuritySession {
  profile: SecurityProfile
  dataKey: CryptoKey
}

export interface CreatedSecuritySession extends SecuritySession {
  recoveryCode: string
}

export interface UnlockFailure {
  ok: false
  message: string
  lockedUntil?: string
}

export type UnlockResult =
  | { ok: true; session: SecuritySession }
  | UnlockFailure

function secretContext(profileId: string): string {
  return `foco-jornada:secret-wrap:${profileId}:v1`
}

function recoveryContext(profileId: string): string {
  return `foco-jornada:recovery-wrap:${profileId}:v1`
}

function delayForAttempts(attempts: number): number {
  if (attempts < 5) return 0
  if (attempts === 5) return 30_000
  if (attempts === 6) return 60_000
  if (attempts === 7) return 5 * 60_000
  return 15 * 60_000
}

function isLocked(profile: SecurityProfile, now = Date.now()): boolean {
  if (!profile.lockedUntil) return false
  return Date.parse(profile.lockedUntil) > now
}

export class SecurityManager {
  private readonly profiles = new SecurityProfileStore()
  private readonly vaults = new EncryptedVaultStore()

  canAttemptPasskey(): boolean {
    return canAttemptPasskey()
  }

  async listProfiles(): Promise<SecurityProfile[]> {
    return this.profiles.list()
  }

  getActiveProfileId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_PROFILE_KEY)
    } catch {
      return null
    }
  }

  setActiveProfileId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    } catch {
      // O perfil continua utilizável mesmo sem esta conveniência de seleção.
    }
  }

  async createProfile(secret: string, secretType: 'pin' | 'password'): Promise<CreatedSecuritySession> {
    const validation = validateSecret(secret, secretType)
    if (validation) throw new Error(validation)

    const existing = await this.profiles.list()
    const id = randomToken(18)
    const now = new Date().toISOString()
    const salt = randomBytes(16)
    const dataKey = await generateDataKey()
    const secretKey = await deriveSecretKey(secret, salt, PBKDF2_ITERATIONS)
    const wrappedDataKey = await wrapDataKey(dataKey, secretKey, secretContext(id))

    const recoveryBytes = randomBytes(32)
    const recoveryKey = await importRawAesKey(recoveryBytes)
    const recoveryWrappedDataKey = await wrapDataKey(dataKey, recoveryKey, recoveryContext(id))

    const profile: SecurityProfile = {
      id,
      label: `Perfil ${existing.length + 1}`,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      secretType,
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: PBKDF2_ITERATIONS,
        salt: toBase64Url(salt),
      },
      wrappedDataKey,
      recoveryWrappedDataKey,
      failedAttempts: 0,
      autoLockMinutes: 5,
    }

    await this.profiles.put(profile)
    this.setActiveProfileId(profile.id)
    return {
      profile,
      dataKey,
      recoveryCode: formatRecoveryCode(recoveryBytes),
    }
  }

  private async successfulUnlock(profile: SecurityProfile, dataKey: CryptoKey): Promise<SecuritySession> {
    const updated: SecurityProfile = {
      ...profile,
      failedAttempts: 0,
      lockedUntil: undefined,
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    this.setActiveProfileId(updated.id)
    return { profile: updated, dataKey }
  }

  private async failedUnlock(profile: SecurityProfile): Promise<UnlockFailure> {
    const failedAttempts = profile.failedAttempts + 1
    const delay = delayForAttempts(failedAttempts)
    const lockedUntil = delay ? new Date(Date.now() + delay).toISOString() : undefined
    await this.profiles.put({
      ...profile,
      failedAttempts,
      lockedUntil,
      updatedAt: new Date().toISOString(),
    })

    return {
      ok: false,
      message: delay
        ? 'Acesso temporariamente bloqueado após várias tentativas incorretas.'
        : 'PIN ou palavra-passe incorretos.',
      lockedUntil,
    }
  }

  async unlockWithSecret(profileId: string, secret: string): Promise<UnlockResult> {
    const profile = await this.profiles.get(profileId)
    if (!profile) return { ok: false, message: 'Perfil local não encontrado.' }
    if (isLocked(profile)) {
      return {
        ok: false,
        message: 'Acesso temporariamente bloqueado após várias tentativas incorretas.',
        lockedUntil: profile.lockedUntil,
      }
    }

    try {
      const key = await deriveSecretKey(secret, fromBase64Url(profile.kdf.salt), profile.kdf.iterations)
      const dataKey = await unwrapDataKey(profile.wrappedDataKey, key, secretContext(profile.id))
      return { ok: true, session: await this.successfulUnlock(profile, dataKey) }
    } catch {
      return this.failedUnlock(profile)
    }
  }

  async unlockWithPasskey(profileId: string): Promise<UnlockResult> {
    const profile = await this.profiles.get(profileId)
    if (!profile) return { ok: false, message: 'Perfil local não encontrado.' }
    if (!profile.passkey) return { ok: false, message: 'Este perfil ainda não tem uma passkey configurada.' }
    if (isLocked(profile)) {
      return {
        ok: false,
        message: 'Acesso temporariamente bloqueado. Aguarda antes de tentar novamente.',
        lockedUntil: profile.lockedUntil,
      }
    }

    try {
      const dataKey = await unwrapWithPasskey(profile.id, profile.passkey)
      return { ok: true, session: await this.successfulUnlock(profile, dataKey) }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Não foi possível utilizar a passkey.',
      }
    }
  }

  async enablePasskey(session: SecuritySession): Promise<SecuritySession> {
    const material = await createPasskeyMaterial(session.profile.id, session.dataKey)
    const updated: SecurityProfile = {
      ...session.profile,
      passkey: {
        ...material,
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    return { ...session, profile: updated }
  }

  async disablePasskey(session: SecuritySession): Promise<SecuritySession> {
    const { passkey: _passkey, ...withoutPasskey } = session.profile
    const updated: SecurityProfile = {
      ...withoutPasskey,
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    return { ...session, profile: updated }
  }

  async changeSecret(
    session: SecuritySession,
    currentSecret: string,
    nextSecret: string,
    nextType: 'pin' | 'password',
  ): Promise<SecuritySession> {
    const validation = validateSecret(nextSecret, nextType)
    if (validation) throw new Error(validation)

    const verified = await this.unlockWithSecret(session.profile.id, currentSecret)
    if (!verified.ok) throw new Error(verified.message)

    const salt = randomBytes(16)
    const nextKey = await deriveSecretKey(nextSecret, salt, PBKDF2_ITERATIONS)
    const wrappedDataKey = await wrapDataKey(session.dataKey, nextKey, secretContext(session.profile.id))
    const updated: SecurityProfile = {
      ...session.profile,
      secretType: nextType,
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: PBKDF2_ITERATIONS,
        salt: toBase64Url(salt),
      },
      wrappedDataKey,
      failedAttempts: 0,
      lockedUntil: undefined,
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    return { ...session, profile: updated }
  }

  async recoverAndChangeSecret(
    profileId: string,
    recoveryCode: string,
    nextSecret: string,
    nextType: 'pin' | 'password',
  ): Promise<SecuritySession> {
    const validation = validateSecret(nextSecret, nextType)
    if (validation) throw new Error(validation)
    const profile = await this.profiles.get(profileId)
    if (!profile) throw new Error('Perfil local não encontrado.')

    let recoveryBytes: Uint8Array
    try {
      recoveryBytes = fromBase64Url(normalizeRecoveryCode(recoveryCode))
    } catch {
      throw new Error('Código de recuperação inválido.')
    }
    if (recoveryBytes.byteLength !== 32) throw new Error('Código de recuperação inválido.')

    try {
      const recoveryKey = await importRawAesKey(recoveryBytes)
      const dataKey = await unwrapDataKey(
        profile.recoveryWrappedDataKey,
        recoveryKey,
        recoveryContext(profile.id),
      )
      const salt = randomBytes(16)
      const nextKey = await deriveSecretKey(nextSecret, salt, PBKDF2_ITERATIONS)
      const wrappedDataKey = await wrapDataKey(dataKey, nextKey, secretContext(profile.id))
      const updated: SecurityProfile = {
        ...profile,
        secretType: nextType,
        kdf: {
          name: 'PBKDF2',
          hash: 'SHA-256',
          iterations: PBKDF2_ITERATIONS,
          salt: toBase64Url(salt),
        },
        wrappedDataKey,
        failedAttempts: 0,
        lockedUntil: undefined,
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      }
      await this.profiles.put(updated)
      this.setActiveProfileId(updated.id)
      return { profile: updated, dataKey }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('O ')) throw error
      throw new Error('O código de recuperação não corresponde a este perfil.')
    }
  }

  async rotateRecoveryCode(session: SecuritySession): Promise<{ session: SecuritySession; recoveryCode: string }> {
    const recoveryBytes = randomBytes(32)
    const recoveryKey = await importRawAesKey(recoveryBytes)
    const recoveryWrappedDataKey = await wrapDataKey(
      session.dataKey,
      recoveryKey,
      recoveryContext(session.profile.id),
    )
    const updated: SecurityProfile = {
      ...session.profile,
      recoveryWrappedDataKey,
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    return {
      session: { ...session, profile: updated },
      recoveryCode: formatRecoveryCode(recoveryBytes),
    }
  }

  async setAutoLockMinutes(session: SecuritySession, minutes: number): Promise<SecuritySession> {
    const allowed = [1, 5, 10, 15, 30]
    if (!allowed.includes(minutes)) throw new Error('Intervalo de bloqueio inválido.')
    const updated = {
      ...session.profile,
      autoLockMinutes: minutes,
      updatedAt: new Date().toISOString(),
    }
    await this.profiles.put(updated)
    return { ...session, profile: updated }
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.vaults.delete(profileId)
    await this.profiles.delete(profileId)
    if (this.getActiveProfileId() === profileId) {
      try {
        localStorage.removeItem(ACTIVE_PROFILE_KEY)
      } catch {
        // Sem ação adicional.
      }
    }
  }
}

export const securityManager = new SecurityManager()
