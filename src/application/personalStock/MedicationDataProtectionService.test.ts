import { describe, expect, it } from 'vitest'
import { AppBackupService } from '../data/AppBackupService'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDataProtectionService } from './MedicationDataProtectionService'
import { MedicationDoseStatusService } from './MedicationDoseStatusService'
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

  it('keeps protected profile revisions and exposes them in the never-delete timeline', async () => {
    const db = makeDatabase('profile-history')
    try {
      const { medicationId } = await createMedication(db)
      const protection = new MedicationDataProtectionService(db)

      await protection.saveProfile(medicationId, {
        status: 'active',
        prescribedBy: 'Profissional A',
        observation: 'Primeira observação.',
      })
      await protection.saveProfile(medicationId, {
        status: 'paused',
        prescribedBy: 'Profissional A',
        observation: 'Segunda observação sem apagar a primeira.',
      })

      const profile = await protection.getProfile(medicationId)
      const revisions = await protection.listProfileRevisions(medicationId)
      const timeline = await protection.getMedicationTimeline(medicationId)
      const summary = await protection.verifyMedication(medicationId)

      expect(profile.status).toBe('paused')
      expect(profile.observation).toContain('Segunda')
      expect(revisions).toHaveLength(2)
      expect(revisions[0].observation).toContain('Primeira')
      expect(summary.profileRevisionCount).toBe(2)
      expect(timeline.filter((item) => item.kind === 'profile')).toHaveLength(2)
    } finally {
      await db.delete()
    }
  })

  it('merges a protected medication backup without clearing unrelated local data', async () => {
    const source = makeDatabase('merge-source')
    const target = makeDatabase('merge-target')
    try {
      const { stock, medicationId } = await createMedication(source)
      await stock.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '1',
        effectiveFrom: '2026-08-26',
      })
      const sourceProtection = new MedicationDataProtectionService(source)
      await sourceProtection.saveProtectedNote(medicationId, 'Nota que tem de sobreviver.')
      await sourceProtection.saveProfile(medicationId, {
        status: 'active',
        prescribedBy: 'Profissional B',
        observation: 'Tomar conforme prescrição registada.',
      })
      await sourceProtection.recordCheckpoint(medicationId, 'antes de exportar')

      const text = await sourceProtection.exportMedicationSnapshotText()
      await target.metadata.put({ key: 'sentinel', value: 'não apagar', updatedAt: new Date().toISOString() })

      const targetProtection = new MedicationDataProtectionService(target)
      const first = await targetProtection.mergeMedicationSnapshotText(text)
      const second = await targetProtection.mergeMedicationSnapshotText(text)

      expect(first.medicationCount).toBe(1)
      expect(first.addedRecords).toBeGreaterThan(0)
      expect(second.addedRecords).toBe(0)
      expect((await target.metadata.get('sentinel'))?.value).toBe('não apagar')
      expect(await targetProtection.getProtectedNote(medicationId)).toBe('Nota que tem de sobreviver.')
      expect((await targetProtection.getProfile(medicationId)).prescribedBy).toBe('Profissional B')
      expect((await targetProtection.verifyMedication(medicationId)).status).toBe('OK')
    } finally {
      await source.delete()
      await target.delete()
    }
  })

  it('calculates the today dashboard from active scheduled dose records without clinical inference', async () => {
    const db = makeDatabase('dashboard')
    try {
      const { stock, medicationId } = await createMedication(db)
      const first = await stock.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '1',
        effectiveFrom: '2026-08-26',
      })
      const second = await stock.addMedicationSchedule({
        medicationId,
        localTime: '20:00',
        quantity: '1',
        effectiveFrom: '2026-08-26',
      })
      await stock.confirmMedicationDose({
        medicationId,
        scheduleId: first.id,
        onDate: '2026-08-26',
        operationId: operationId(),
      })
      await new MedicationDoseStatusService(db).setMedicationDoseStatus({
        medicationId,
        scheduleId: second.id,
        onDate: '2026-08-26',
        operationId: operationId(),
        status: 'not_taken',
      })

      const dashboard = await new MedicationDataProtectionService(db).getTodayDashboard('2026-08-26')
      expect(dashboard.medicationCount).toBe(1)
      expect(dashboard.scheduledDoseCount).toBe(2)
      expect(dashboard.takenDoseCount).toBe(1)
      expect(dashboard.notTakenDoseCount).toBe(1)
      expect(dashboard.pendingDoseCount).toBe(0)
    } finally {
      await db.delete()
    }
  })

})
