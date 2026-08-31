import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import {
  ReleaseAppBackupService,
  type BackupKeyValueStorage,
} from './ReleaseAppBackupService'

class MemoryStorage implements BackupKeyValueStorage {
  private readonly values = new Map<string, string>()

  constructor(initial: Record<string, string> = {}) {
    Object.entries(initial).forEach(([key, value]) => this.values.set(key, value))
  }

  get length() {
    return this.values.size
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-release-backup-test-${globalThis.crypto.randomUUID()}`)
}

describe('ReleaseAppBackupService', () => {
  it('inclui apenas o estado operacional autorizado do browser', async () => {
    const db = makeDatabase()
    try {
      const storage = new MemoryStorage({
        'foco-jornada-work-hours-v1': '{"state":{"entries":[]}}',
        'foco-jornada-payroll-plan-v1-2026-08': '[{"date":"2026-08-01"}]',
        'foco-jornada-shift-map-v1-2026-08': '[{"date":"2026-08-01"}]',
        'foco-jornada-ui-v2': '{"state":{"theme":"dark"}}',
        'outra-aplicacao': 'não copiar',
      })
      const backup = new ReleaseAppBackupService(db, storage)
      const payload = JSON.parse(await backup.exportText()) as {
        clientState: { version: number; values: Record<string, string> }
      }

      expect(payload.clientState.version).toBe(1)
      expect(payload.clientState.values['foco-jornada-work-hours-v1']).toBeTruthy()
      expect(payload.clientState.values['foco-jornada-payroll-plan-v1-2026-08']).toBeTruthy()
      expect(payload.clientState.values['foco-jornada-shift-map-v1-2026-08']).toBeTruthy()
      expect(payload.clientState.values['foco-jornada-ui-v2']).toBeTruthy()
      expect(payload.clientState.values['outra-aplicacao']).toBeUndefined()
    } finally {
      await db.delete()
    }
  })

  it('restaura o estado operacional e preserva chaves externas à aplicação', async () => {
    const db = makeDatabase()
    try {
      const storage = new MemoryStorage({
        'foco-jornada-work-hours-v1': 'horas-originais',
        'foco-jornada-payroll-config-v1': 'vencimento-original',
        'foco-jornada-payroll-plan-v1-2026-08': 'plano-original',
        'foco-jornada-shift-map-v1-2026-08': 'turnos-originais',
        'foco-jornada:glo-session-timer-v2': 'glo-original',
        'outra-aplicacao': 'preservar',
      })
      const backup = new ReleaseAppBackupService(db, storage)
      const text = await backup.exportText()

      storage.setItem('foco-jornada-work-hours-v1', 'horas-alteradas')
      storage.setItem('foco-jornada-payroll-config-v1', 'vencimento-alterado')
      storage.setItem('foco-jornada-shift-map-v1-2026-09', 'remover-no-restauro')
      storage.setItem('outra-aplicacao', 'preservar')

      await backup.restoreFromText(text)

      expect(storage.getItem('foco-jornada-work-hours-v1')).toBe('horas-originais')
      expect(storage.getItem('foco-jornada-payroll-config-v1')).toBe('vencimento-original')
      expect(storage.getItem('foco-jornada-payroll-plan-v1-2026-08')).toBe('plano-original')
      expect(storage.getItem('foco-jornada-shift-map-v1-2026-08')).toBe('turnos-originais')
      expect(storage.getItem('foco-jornada:glo-session-timer-v2')).toBe('glo-original')
      expect(storage.getItem('foco-jornada-shift-map-v1-2026-09')).toBeNull()
      expect(storage.getItem('outra-aplicacao')).toBe('preservar')
    } finally {
      await db.delete()
    }
  })

  it('repõe o estado local anterior se o restauro da base de dados falhar', async () => {
    const db = makeDatabase()
    try {
      const storage = new MemoryStorage({
        'foco-jornada-work-hours-v1': 'estado-da-copia',
      })
      const backup = new ReleaseAppBackupService(db, storage)
      const payload = JSON.parse(await backup.exportText()) as {
        format: string
        clientState: { values: Record<string, string> }
      }

      storage.setItem('foco-jornada-work-hours-v1', 'estado-local-mais-recente')
      payload.format = 'formato-invalido'

      await expect(backup.restoreFromText(JSON.stringify(payload))).rejects.toThrow('não é uma cópia')
      expect(storage.getItem('foco-jornada-work-hours-v1')).toBe('estado-local-mais-recente')
    } finally {
      await db.delete()
    }
  })

  it('rejeita chaves locais não autorizadas antes de restaurar', async () => {
    const db = makeDatabase()
    try {
      const storage = new MemoryStorage({
        'foco-jornada-work-hours-v1': 'manter',
      })
      const backup = new ReleaseAppBackupService(db, storage)
      const payload = JSON.parse(await backup.exportText()) as {
        clientState: { values: Record<string, string> }
      }
      payload.clientState.values['segredo-de-outra-app'] = 'não permitido'

      await expect(backup.restoreFromText(JSON.stringify(payload))).rejects.toThrow('chave local não autorizada')
      expect(storage.getItem('foco-jornada-work-hours-v1')).toBe('manter')
    } finally {
      await db.delete()
    }
  })
})
