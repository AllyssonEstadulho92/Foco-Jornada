import { describe, expect, it } from 'vitest'
import { AppBackupService } from '../data/AppBackupService'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDataProtectionService } from './MedicationDataProtectionService'
import { PersonalStockService } from './PersonalStockService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(label: string): AppDatabase {
  return new AppDatabase(`foco-jornada-medication-protection-${label}-${operationId()}`)
}

async function createMedication(db: AppDatabase, medicationId = operationId()) {
  const stock = new PersonalStockService(db)
  await stock.createMedication({
    medicationId,
    operationId: operationId(),
    name: 'Medicamento protegido',
    dosage: '400 mg',
    unit: 'comprimidos',
    initialStock: '30',
    startDate: '2026-08-26',
  })
  return { stock, medicationId }
}

describe('MedicationDataProtectionService', () => {
  it('creates one stable medication code and keeps note revisions append-only', async () => {
    const db = makeDatabase('notes')
    try {
      const { medicationId } = await createMedication(db)
      const protection = new MedicationDataProtectionService(db)
      const first = await protection.verifyMedication(medicationId)

      await protection.saveProtectedNote(medicationId, 'Primeira nota importante.')
      await protection.saveProtectedNote(medicationId, 'Segunda nota sem apagar a anterior.')
      const second = await protection.verifyMedication(medicationId)

      expect(first.code).toBe(second.code)
      expect(first.code.startsWith('MED-')).toBe(true)
      expect(second.noteRevisionCount).toBe(2)
      expect(await protection.getProtectedNote(medicationId)).toBe('Segunda nota sem apagar a anterior.')

      const history = (await db.metadata.toArray())
        .filter((record) => record.key.startsWith(`medication-protection:note-history:${medicationId}:`))
      expect(history).toHaveLength(2)
      expect(history.some((record) => record.value.includes('Primeira nota importante.'))).toBe(true)
      expect(history.some((record) => record.value.includes('Segunda nota sem apagar a anterior.'))).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('does not duplicate a protection checkpoint when the protected state did not change', async () => {
    const db = makeDatabase('checkpoint')
    try {
      const { stock, medicationId } = await createMedication(db)
      const protection = new MedicationDataProtectionService(db)
      const first = await protection.recordCheckpoint(medicationId, 'primeira verificação')
      const duplicate = await protection.recordCheckpoint(medicationId, 'segunda verificação')

      expect(first.created).toBe(true)
      expect(duplicate.created).toBe(false)
      expect(duplicate.summary.checkpointCount).toBe(1)

      await stock.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '2',
        effectiveFrom: '2026-08-26',
      })
      const changed = await protection.recordCheckpoint(medicationId, 'horário acrescentado')
      expect(changed.created).toBe(true)
      expect(changed.summary.checkpointCount).toBe(2)
      expect(changed.summary.scheduleCount).toBe(1)
    } finally {
      await db.delete()
    }
  })

  it('restores protection roots, checkpoints and protected notes through the integral backup', async () => {
    const source = makeDatabase('backup-source')
    const target = makeDatabase('backup-target')
    try {
      const { stock, medicationId } = await createMedication(source)
      await stock.addMedicationSchedule({
        medicationId,
        localTime: '20:00',
        quantity: '1',
        effectiveFrom: '2026-08-26',
      })
      const protection = new MedicationDataProtectionService(source)
      await protection.saveProtectedNote(medicationId, 'Informação que tem de sobreviver ao restauro.')
      const before = await protection.recordCheckpoint(medicationId, 'antes da cópia')

      const text = await new AppBackupService(source).exportText()
      await new AppBackupService(target).restoreFromText(text)

      const restoredProtection = new MedicationDataProtectionService(target)
      const after = await restoredProtection.verifyMedication(medicationId)
      expect(after.code).toBe(before.summary.code)
      expect(after.status).toBe('OK')
      expect(after.checkpointCount).toBe(1)
      expect(after.noteRevisionCount).toBe(1)
      expect(after.scheduleCount).toBe(1)
      expect(await restoredProtection.getProtectedNote(medicationId)).toBe('Informação que tem de sobreviver ao restauro.')
    } finally {
      await source.delete()
      await target.delete()
    }
  })
})
