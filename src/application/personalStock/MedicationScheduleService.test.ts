import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationScheduleService } from './MedicationScheduleService'
import { PersonalStockService } from './PersonalStockService'

function id(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-medication-schedule-test-${id()}`)
}

async function createMedicationAndSchedule(db: AppDatabase) {
  const stock = new PersonalStockService(db)
  const medicationId = id()
  await stock.createMedication({
    medicationId,
    operationId: id(),
    name: 'Medicamento de teste',
    dosage: '10 mg',
    unit: 'comprimidos',
    initialStock: '30',
    startDate: '2026-09-01',
  })
  const schedule = await stock.addMedicationSchedule({
    medicationId,
    localTime: '08:00',
    quantity: '2',
    effectiveFrom: '2026-09-01',
  })
  return { stock, medicationId, schedule }
}

describe('MedicationScheduleService', () => {
  it('removes a schedule immediately while preserving its audit record', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await createMedicationAndSchedule(db)
      const service = new MedicationScheduleService(db)

      const result = await service.endOnDate({
        medicationId,
        scheduleId: schedule.id,
        effectiveUntil: '2026-09-05',
      })

      const stored = await db.medicationSchedules.get(schedule.id)
      expect(result.changed).toBe(true)
      expect(result.removedCount).toBe(1)
      expect(stored?.effectiveUntil).toBe('2026-09-04')
      expect(stored?.deletedAt).toBeTruthy()
      expect(await stock.schedulesForDate(medicationId, '2026-09-05')).toEqual([])
      expect(await db.medicationSchedules.count()).toBe(1)
    } finally {
      await db.delete()
    }
  })

  it('removes the current schedule and its already-planned successor as one schedule chain', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await createMedicationAndSchedule(db)
      const service = new MedicationScheduleService(db)
      const defined = await service.defineFromDate({
        medicationId,
        scheduleId: schedule.id,
        localTime: '09:15',
        quantity: '1.5',
        effectiveFrom: '2026-09-06',
      })

      const result = await service.endOnDate({
        medicationId,
        scheduleId: schedule.id,
        effectiveUntil: '2026-09-05',
      })

      const previous = await db.medicationSchedules.get(schedule.id)
      const successor = await db.medicationSchedules.get(defined.replacement.id)
      expect(result.changed).toBe(true)
      expect(result.removedCount).toBe(2)
      expect(previous?.deletedAt).toBeTruthy()
      expect(successor?.deletedAt).toBe(previous?.deletedAt)
      expect(await stock.schedulesForDate(medicationId, '2026-09-05')).toEqual([])
      expect(await stock.schedulesForDate(medicationId, '2026-09-06')).toEqual([])
      expect(await db.medicationSchedules.count()).toBe(2)
    } finally {
      await db.delete()
    }
  })

  it('removes a schedule created on the same day without exposing a terminal row', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const medicationId = id()
      await stock.createMedication({
        medicationId,
        operationId: id(),
        name: 'Medicamento do próprio dia',
        dosage: '20 mg',
        unit: 'comprimidos',
        initialStock: '10',
        startDate: '2026-09-05',
      })
      const schedule = await stock.addMedicationSchedule({
        medicationId,
        localTime: '15:37',
        quantity: '2',
        effectiveFrom: '2026-09-05',
      })
      const service = new MedicationScheduleService(db)

      await service.endOnDate({
        medicationId,
        scheduleId: schedule.id,
        effectiveUntil: '2026-09-05',
      })

      const stored = await db.medicationSchedules.get(schedule.id)
      expect(stored?.effectiveUntil).toBe('2026-09-04')
      expect(stored?.deletedAt).toBeTruthy()
      expect(await stock.schedulesForDate(medicationId, '2026-09-05')).toEqual([])
    } finally {
      await db.delete()
    }
  })

  it('creates a successor while preserving the previous schedule', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await createMedicationAndSchedule(db)
      const service = new MedicationScheduleService(db)

      const result = await service.defineFromDate({
        medicationId,
        scheduleId: schedule.id,
        localTime: '09:15',
        quantity: '1.5',
        effectiveFrom: '2026-09-06',
      })

      expect(result.changed).toBe(true)
      expect(result.previous.id).toBe(schedule.id)
      expect(result.previous.effectiveUntil).toBe('2026-09-05')
      expect(result.replacement.id).not.toBe(schedule.id)
      expect(result.replacement.localTime).toBe('09:15')
      expect(result.replacement.effectiveFrom).toBe('2026-09-06')
      expect(await db.medicationSchedules.count()).toBe(2)

      const before = await stock.schedulesForDate(medicationId, '2026-09-05')
      const after = await stock.schedulesForDate(medicationId, '2026-09-06')
      expect(before.map((item) => item.id)).toEqual([schedule.id])
      expect(after.map((item) => item.id)).toEqual([result.replacement.id])
    } finally {
      await db.delete()
    }
  })

  it('is idempotent when the same successor already exists', async () => {
    const db = makeDatabase()
    try {
      const { medicationId, schedule } = await createMedicationAndSchedule(db)
      const service = new MedicationScheduleService(db)
      const input = {
        medicationId,
        scheduleId: schedule.id,
        localTime: '09:15',
        quantity: '1.5',
        effectiveFrom: '2026-09-06',
      }

      const first = await service.defineFromDate(input)
      const second = await service.defineFromDate(input)

      expect(first.changed).toBe(true)
      expect(second.changed).toBe(false)
      expect(second.replacement.id).toBe(first.replacement.id)
      expect(await db.medicationSchedules.count()).toBe(2)
    } finally {
      await db.delete()
    }
  })
})
