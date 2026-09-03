import type { MedicationDoseEvent } from '../../domain/personalStock/models'
import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService } from './PersonalStockService'

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

function statusDescription(status: MedicationDoseEvent['status']): string {
  if (status === 'taken') return 'tomada'
  if (status === 'not_taken') return 'não tomada'
  if (status === 'postponed') return 'adiada'
  return 'corrigida'
}

export class OperationalPersonalStockService extends PersonalStockService {
  constructor(private readonly operationalDb: AppDatabase) {
    super(operationalDb)
  }

  override async confirmMedicationDose(input: {
    medicationId: string
    scheduleId: string
    onDate: string
    operationId: string
  }): Promise<{ event: MedicationDoseEvent; duplicated: boolean; stock: string }> {
    return this.operationalDb.transaction(
      'rw',
      this.operationalDb.stockEntities,
      this.operationalDb.stockMovements,
      this.operationalDb.medicationSchedules,
      this.operationalDb.medicationDoseEvents,
      async () => {
        const occurrenceKey = `${input.scheduleId}:${input.onDate}`
        const occurrenceEvents = await this.operationalDb.medicationDoseEvents
          .where('occurrenceKey')
          .equals(occurrenceKey)
          .toArray()
        const current = activeEvent(occurrenceEvents)

        if (current && current.status !== 'taken') {
          throw new Error(
            `Esta toma já está marcada como ${statusDescription(current.status)}. Corrige o estado atual antes de confirmar a toma.`,
          )
        }

        const result = await this.confirmMedicationDoseWithinTransaction(input)
        const summary = await this.getMedicationSummary(input.medicationId)
        return { ...result, stock: summary.stock }
      },
    )
  }
}
