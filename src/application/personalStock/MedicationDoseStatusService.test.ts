import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDoseStatusService } from './MedicationDoseStatusService'
import { PersonalStockService } from './PersonalStockService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-dose-status-test-${operationId()}`)
}

async function makeMedication(db: AppDatabase) {
  const stock = new PersonalStockService(db)
  const medicationId = operationId()
  await stock.createMedication({
    medicationId,
    operationId: operationId(),
    name: 'Teste',
    dosage: '100 mg',
    unit: 'comprimidos',
    initialStock: '5',
    startDate: '2026-08-25',
  })
  const schedule = await stock.addMedicationSchedule({
    medicationId,
    localTime: '08:00',
    quantity: '1',
    effectiveFrom: '2026-08-25',
  })
  return { stock, medicationId, schedule }
}

describe('MedicationDoseStatusService', () => {
  it('regista uma toma não tomada sem descontar stock e permite corrigi-la', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)

      const result = await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })

      expect(result.duplicated).toBe(false)
      expect(result.event.status).toBe('not_taken')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      const corrected = await statuses.correctMedicationDoseStatus(result.event.id, operationId())
      expect(corrected.event.status).toBe('corrected')
      expect(corrected.event.correctionOf).toBe(result.event.id)
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      const taken = await stock.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })
      expect(taken.stock).toBe('4')
    } finally {
      await db.delete()
    }
  })

  it('regista uma toma adiada sem descontar stock e bloqueia um segundo estado ativo', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)

      const postponed = await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
      })

      expect(postponed.event.status).toBe('postponed')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      await expect(statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })).rejects.toThrow('já está marcada como adiada')

      expect(await stock.listDoseEvents(medicationId)).toHaveLength(1)
    } finally {
      await db.delete()
    }
  })

  it('trata o mesmo estado da mesma ocorrência como idempotente', async () => {
    const db = makeDatabase()
    try {
      const { medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)

      const first = await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })
      const second = await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })

      expect(first.duplicated).toBe(false)
      expect(second.duplicated).toBe(true)
      expect(second.event.id).toBe(first.event.id)
    } finally {
      await db.delete()
    }
  })

  it('não permite marcar como adiada uma ocorrência que já foi confirmada como tomada', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)
      await stock.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })

      await expect(statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
      })).rejects.toThrow('já está marcada como tomada')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('4')
    } finally {
      await db.delete()
    }
  })
})
