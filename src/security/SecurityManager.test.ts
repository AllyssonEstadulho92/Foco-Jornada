import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from '../infrastructure/database/appDatabase'
import { EncryptedVaultStore } from './vaultStore'
import { SecurityManager } from './SecurityManager'

const SECURITY_DB = 'foco-jornada-security-v1'
const VAULT_DB = 'foco-jornada-vault-v1'

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error(`Falha ao eliminar ${name}.`))
    request.onblocked = () => reject(new Error(`A base ${name} ficou bloqueada durante o teste.`))
  })
}

async function resetSecurityStorage(): Promise<void> {
  localStorage.clear()
  await deleteDatabase(SECURITY_DB)
  await deleteDatabase(VAULT_DB)
}

describe('SecurityManager e cofre local', () => {
  beforeEach(async () => {
    await resetSecurityStorage()
  })

  afterEach(async () => {
    await resetSecurityStorage()
  })

  it('não persiste o PIN nem dados pessoais em texto simples', async () => {
    const manager = new SecurityManager()
    const created = await manager.createProfile('123456', 'pin')
    expect(JSON.stringify(created.profile)).not.toContain('123456')

    const db = new AppDatabase(created)
    const privateValue = 'observação pessoal que não pode aparecer em plaintext'
    await db.metadata.put({
      key: 'private-note',
      value: privateValue,
      updatedAt: new Date().toISOString(),
    })

    const record = await new EncryptedVaultStore().readRecord(created.profile.id)
    expect(record).toBeDefined()
    expect(JSON.stringify(record)).not.toContain(privateValue)

    const backup = await db.exportSecureBackupText()
    expect(backup).toContain('"format": "foco-jornada-secure-backup"')
    expect(backup).not.toContain(privateValue)
    expect(backup).not.toContain('123456')
    db.close()

    const wrong = await manager.unlockWithSecret(created.profile.id, '000000')
    expect(wrong.ok).toBe(false)

    const correct = await manager.unlockWithSecret(created.profile.id, '123456')
    expect(correct.ok).toBe(true)
  }, 15_000)

  it('recupera o mesmo cofre com código de recuperação e troca a credencial principal', async () => {
    const manager = new SecurityManager()
    const created = await manager.createProfile('246810', 'pin')
    expect(created.recoveryCode).toMatch(/^[0-9A-F]{8}(?:-[0-9A-F]{8}){7}$/)

    await expect(
      manager.recoverAndChangeSecret(
        created.profile.id,
        '00000000-00000000-00000000-00000000-00000000-00000000-00000000-00000000',
        'nova-palavra-passe-forte-2026',
        'password',
      ),
    ).rejects.toThrow('não corresponde')

    const recovered = await manager.recoverAndChangeSecret(
      created.profile.id,
      created.recoveryCode,
      'nova-palavra-passe-forte-2026',
      'password',
    )
    expect(recovered.profile.secretType).toBe('password')

    const oldPin = await manager.unlockWithSecret(created.profile.id, '246810')
    expect(oldPin.ok).toBe(false)

    const newPassword = await manager.unlockWithSecret(
      created.profile.id,
      'nova-palavra-passe-forte-2026',
    )
    expect(newPassword.ok).toBe(true)
  }, 20_000)

  it('aplica bloqueio progressivo sem apagar o cofre após tentativas erradas', async () => {
    const manager = new SecurityManager()
    const created = await manager.createProfile('112233', 'pin')

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const result = await manager.unlockWithSecret(created.profile.id, '000000')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.lockedUntil).toBeUndefined()
    }

    const fifth = await manager.unlockWithSecret(created.profile.id, '000000')
    expect(fifth.ok).toBe(false)
    if (fifth.ok) throw new Error('A quinta tentativa incorreta não foi bloqueada.')
    expect(fifth.lockedUntil).toBeDefined()

    const profiles = await manager.listProfiles()
    const stored = profiles.find((profile) => profile.id === created.profile.id)
    expect(stored?.failedAttempts).toBe(5)
    expect(await new EncryptedVaultStore().readRecord(created.profile.id)).toBeDefined()

    const blockedCorrectPin = await manager.unlockWithSecret(created.profile.id, '112233')
    expect(blockedCorrectPin.ok).toBe(false)
    if (!blockedCorrectPin.ok) expect(blockedCorrectPin.lockedUntil).toBeDefined()
  }, 25_000)

  it('restaura uma cópia cifrada e mantém perfis locais isolados', async () => {
    const manager = new SecurityManager()
    const first = await manager.createProfile('135790', 'pin')
    const firstDb = new AppDatabase(first)
    await firstDb.metadata.put({
      key: 'owner-only',
      value: 'dados exclusivos do perfil A',
      updatedAt: new Date().toISOString(),
    })
    const backup = await firstDb.exportSecureBackupText()
    firstDb.close()

    await manager.deleteProfile(first.profile.id)
    const imported = await manager.importSecureBackup(backup)
    expect(imported.id).toBe(first.profile.id)

    const unlockedFirst = await manager.unlockWithSecret(imported.id, '135790')
    expect(unlockedFirst.ok).toBe(true)
    if (!unlockedFirst.ok) throw new Error('O perfil importado não desbloqueou.')

    const restoredDb = new AppDatabase(unlockedFirst.session)
    expect((await restoredDb.metadata.get('owner-only'))?.value).toBe('dados exclusivos do perfil A')
    restoredDb.close()

    const second = await manager.createProfile('975310', 'pin')
    const secondDb = new AppDatabase(second)
    expect(await secondDb.metadata.get('owner-only')).toBeUndefined()

    await expect(
      new EncryptedVaultStore().load(first.profile.id, second.dataKey),
    ).rejects.toBeTruthy()
    secondDb.close()
  }, 20_000)
})
