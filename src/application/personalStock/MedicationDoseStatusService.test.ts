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

  it('regista uma toma adiada com nova hora sem descontar stock e bloqueia um segundo estado ativo', async () => {
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
        postponedToLocalTime: '10:30',
      })

      expect(postponed.event.status).toBe('postponed')
      expect(postponed.event.postponedTo).toBe('2026-08-25T09:30:00.000Z')
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

  it('obriga a escolher uma nova hora posterior ao horário original', async () => {
    const db = makeDatabase()
    try {
      const { medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)

      await expect(statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
      })).rejects.toThrow('Escolhe a nova hora')

      await expect(statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: '07:30',
      })).rejects.toThrow('posterior')
    } finally {
      await db.delete()
    }
  })

  it('confirma uma toma adiada uma única vez e mantém o reagendamento auditável', async () => {
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
        postponedToLocalTime: '10:30',
      })

      const confirmOperation = operationId()
      const first = await statuses.confirmPostponedMedicationDose(postponed.event.id, confirmOperation)
      const second = await statuses.confirmPostponedMedicationDose(postponed.event.id, confirmOperation)

      expect(first.duplicated).toBe(false)
      expect(first.stock).toBe('4')
      expect(first.event.status).toBe('taken')
      expect(first.event.scheduledAt).toBe('2026-08-25T09:30:00.000Z')
      expect(first.event.rescheduledFrom).toBe(postponed.event.id)
      expect(second.duplicated).toBe(true)
      expect(second.stock).toBe('4')
      expect((await stock.getMedicationSummary(medicationId)).movementCount).toBe(2)

      const events = await stock.listDoseEvents(medicationId)
      expect(events.filter((event) => event.status === 'postponed')).toHaveLength(1)
      expect(events.filter((event) => event.status === 'corrected')).toHaveLength(1)
      expect(events.filter((event) => event.status === 'taken')).toHaveLength(1)
    } finally {
      await db.delete()
    }
  })

  it('inclui a nova hora de uma toma adiada na simulação cronológica', async () => {
    const db = makeDatabase()
    try {
      const { medicationId, schedule } = await makeMedication(db)
      const statuses = new MedicationDoseStatusService(db)
      await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: '10:30',
      })

      const forecast = await statuses.forecastMedication(medicationId, new Date('2026-08-25T08:00:00.000Z'))
      expect(forecast.nextDose.scheduledAt).toBe('2026-08-25T09:30:00.000Z')
      expect(forecast.nextDose.quantity).toBe('1')
      expect(forecast.exact).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('altera a hora de uma toma adiada sem apagar o registo anterior nem alterar stock', async () => {
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
        postponedToLocalTime: '10:30',
      })

      const changed = await statuses.replaceMedicationDoseStatus({
        eventId: postponed.event.id,
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: '11:45',
      })

      expect(changed.duplicated).toBe(false)
      expect(changed.event.status).toBe('postponed')
      expect(changed.event.postponedTo).toBe('2026-08-25T10:45:00.000Z')
      expect(changed.event.rescheduledFrom).toBe(postponed.event.id)
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      const events = await stock.listDoseEvents(medicationId)
      expect(events.filter((event) => event.status === 'postponed')).toHaveLength(2)
      expect(events.filter((event) => event.status === 'corrected')).toHaveLength(1)

      const forecast = await statuses.forecastMedication(medicationId, new Date('2026-08-25T08:00:00.000Z'))
      expect(forecast.nextDose.scheduledAt).toBe('2026-08-25T10:45:00.000Z')

      const taken = await statuses.confirmPostponedMedicationDose(changed.event.id, operationId())
      expect(taken.stock).toBe('4')
    } finally {
      await db.delete()
    }
  })

  it('permite trocar uma toma adiada para não tomada numa única transação auditável', async () => {
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
        postponedToLocalTime: '10:30',
      })

      const replaced = await statuses.replaceMedicationDoseStatus({
        eventId: postponed.event.id,
        operationId: operationId(),
        status: 'not_taken',
      })

      expect(replaced.event.status).toBe('not_taken')
      expect(replaced.event.rescheduledFrom).toBe(postponed.event.id)
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      const events = await stock.listDoseEvents(medicationId)
      expect(events.filter((event) => event.status === 'corrected')).toHaveLength(1)
      expect(events.filter((event) => event.status === 'not_taken')).toHaveLength(1)
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
        postponedToLocalTime: '10:30',
      })).rejects.toThrow('já está marcada como tomada')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('4')
    } finally {
      await db.delete()
    }
  })
})
