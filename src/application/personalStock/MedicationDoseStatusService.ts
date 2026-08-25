import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { DoseEventStatus, MedicationDoseEvent } from '../../domain/personalStock/models'
import { resolveZonedLocalDateTime } from './time'

export type OperationalDoseStatus = Extract<DoseEventStatus, 'not_taken' | 'postponed'>

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function activeEvent(events: MedicationDoseEvent[]): MedicationDoseEvent | undefined {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )

  return [...events]
    .filter((event) => event.status !== 'corrected' && !correctedIds.has(event.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0]
}

function statusDescription(status: DoseEventStatus): string {
  if (status === 'taken') return 'tomada'
  if (status === 'not_taken') return 'não tomada'
  if (status === 'postponed') return 'adiada'
  return 'corrigida'
}

export class MedicationDoseStatusService {
  constructor(private readonly db: AppDatabase) {}

  async setMedicationDoseStatus(input: {
    medicationId: string
    scheduleId: string
    onDate: string
    operationId: string
    status: OperationalDoseStatus
  }): Promise<{ event: MedicationDoseEvent; duplicated: boolean }> {
    if (!isDateKey(input.onDate)) throw new Error('Data da toma inválida.')
    if (input.status !== 'not_taken' && input.status !== 'postponed') {
      throw new Error('Estado operacional inválido.')
    }

    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false

    await this.db.transaction(
      'rw',
      this.db.stockEntities,
      this.db.medicationSchedules,
      this.db.medicationDoseEvents,
      async () => {
        const occurrenceKey = `${input.scheduleId}:${input.onDate}`
        const operationDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(input.operationId).first()
        if (operationDuplicate) {
          if (
            operationDuplicate.medicationId !== input.medicationId
            || operationDuplicate.scheduleId !== input.scheduleId
            || operationDuplicate.occurrenceKey !== occurrenceKey
            || operationDuplicate.status !== input.status
          ) {
            throw new Error('operationId já existe com um conteúdo diferente.')
          }
          resultEvent = operationDuplicate
          duplicated = true
          return
        }

        const medication = await this.db.stockEntities.get(input.medicationId)
        if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

        const schedule = await this.db.medicationSchedules.get(input.scheduleId)
        if (!schedule || schedule.medicationId !== input.medicationId) throw new Error('Horário não encontrado.')
        if (schedule.effectiveFrom > input.onDate || (schedule.effectiveUntil && schedule.effectiveUntil < input.onDate)) {
          throw new Error('O horário não está válido para esta data.')
        }

        const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(occurrenceKey).toArray()
        const current = activeEvent(occurrenceEvents)
        if (current) {
          if (current.status === input.status) {
            resultEvent = current
            duplicated = true
            return
          }
          throw new Error(`Esta toma já está marcada como ${statusDescription(current.status)}. Corrige o estado atual antes de alterar.`)
        }

        const scheduledAt = resolveZonedLocalDateTime(
          input.onDate,
          schedule.localTime,
          medication.timezone,
          schedule.fold,
        )
        const event: MedicationDoseEvent = {
          id: newId(),
          operationId: input.operationId,
          occurrenceKey,
          medicationId: input.medicationId,
          scheduleId: input.scheduleId,
          scheduledAt: scheduledAt.toISOString(),
          quantityMinor: schedule.quantityMinor,
          status: input.status,
          createdAt: new Date().toISOString(),
        }
        await this.db.medicationDoseEvents.add(event)
        resultEvent = event
      },
    )

    if (!resultEvent) throw new Error('Não foi possível registar o estado da toma.')
    return { event: resultEvent, duplicated }
  }

  async correctMedicationDoseStatus(
    eventId: string,
    operationId: string,
  ): Promise<{ event: MedicationDoseEvent; duplicated: boolean }> {
    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false

    await this.db.transaction('rw', this.db.medicationDoseEvents, async () => {
      const target = await this.db.medicationDoseEvents.get(eventId)
      if (!target || (target.status !== 'not_taken' && target.status !== 'postponed')) {
        throw new Error('Estado de toma não encontrado.')
      }

      const operationDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(operationId).first()
      if (operationDuplicate) {
        if (operationDuplicate.status !== 'corrected' || operationDuplicate.correctionOf !== target.id) {
          throw new Error('operationId já existe com um conteúdo diferente.')
        }
        resultEvent = operationDuplicate
        duplicated = true
        return
      }

      const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(target.occurrenceKey).toArray()
      const previousCorrection = occurrenceEvents.find(
        (candidate) => candidate.status === 'corrected' && candidate.correctionOf === target.id,
      )
      if (previousCorrection) {
        resultEvent = previousCorrection
        duplicated = true
        return
      }

      const correctionEvent: MedicationDoseEvent = {
        id: newId(),
        operationId,
        occurrenceKey: target.occurrenceKey,
        medicationId: target.medicationId,
        scheduleId: target.scheduleId,
        scheduledAt: target.scheduledAt,
        quantityMinor: target.quantityMinor,
        status: 'corrected',
        createdAt: new Date().toISOString(),
        correctionOf: target.id,
      }
      await this.db.medicationDoseEvents.add(correctionEvent)
      resultEvent = correctionEvent
    })

    if (!resultEvent) throw new Error('Não foi possível corrigir o estado da toma.')
    return { event: resultEvent, duplicated }
  }
}
