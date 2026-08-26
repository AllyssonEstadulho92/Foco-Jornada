import type { MedicationDoseEvent, MedicationSchedule, StockEntity, StockMovement } from '../../domain/personalStock/models'
import type { AppDatabase } from '../../infrastructure/database/appDatabase'

const ROOT_PREFIX = 'medication-protection:root:'
const CHECKPOINT_PREFIX = 'medication-protection:checkpoint:'
const NOTE_CURRENT_PREFIX = 'medication-protection:note-current:'
const NOTE_HISTORY_PREFIX = 'medication-protection:note-history:'
const NOTE_MAX_LENGTH = 10_000

export type MedicationProtectionStatus = 'OK' | 'INCONSISTÊNCIA'

interface MedicationIdentitySnapshot {
  id: string
  name: string
  dosage?: string
  unit: string
  timezone: string
  startDate?: string
  createdAt: string
}

interface MedicationProtectionRoot {
  version: 1
  medicationId: string
  code: string
  protectedAt: string
  original: MedicationIdentitySnapshot
}

interface MedicationCheckpointPayload {
  version: 1
  medicationId: string
  code: string
  createdAt: string
  reason: string
  signature: string
  medication: MedicationIdentitySnapshot
  schedules: MedicationSchedule[]
  movementCount: number
  doseEventCount: number
  reconstructedMinor: string
}

interface MedicationNotePayload {
  version: 1
  medicationId: string
  note: string
  updatedAt: string
}

export interface MedicationProtectionSummary {
  medicationId: string
  code: string
  status: MedicationProtectionStatus
  protectedAt: string
  lastCheckpointAt?: string
  checkpointCount: number
  noteRevisionCount: number
  movementCount: number
  scheduleCount: number
  doseEventCount: number
  reconstructedMinor: string
  problems: string[]
}

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function medicationCode(medicationId: string): string {
  return `MED-${medicationId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`
}

function identitySnapshot(entity: StockEntity): MedicationIdentitySnapshot {
  return {
    id: entity.id,
    name: entity.name,
    dosage: entity.dosage,
    unit: entity.unit,
    timezone: entity.timezone,
    startDate: entity.startDate,
    createdAt: entity.createdAt,
  }
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T
  } catch {
    throw new Error(`INCONSISTÊNCIA: ${label} contém JSON inválido.`)
  }
}

function compareMovements(left: StockMovement, right: StockMovement): number {
  if (left.sequence !== right.sequence) return left.sequence - right.sequence
  return left.id.localeCompare(right.id)
}

function reconstruct(movements: StockMovement[], problems: string[]): bigint {
  let total = 0n
  ;[...movements].sort(compareMovements).forEach((movement, index) => {
    if (movement.sequence !== index) problems.push(`Sequência do ledger interrompida no movimento ${movement.id}.`)
    let before: bigint
    let quantity: bigint
    let after: bigint
    try {
      before = BigInt(movement.balanceBeforeMinor)
      quantity = BigInt(movement.quantityMinor)
      after = BigInt(movement.balanceAfterMinor)
    } catch {
      problems.push(`Movimento ${movement.id} contém valores não inteiros.`)
      return
    }
    if (before !== total) problems.push(`Saldo anterior incoerente no movimento ${movement.id}.`)
    total += quantity
    if (total < 0n) problems.push(`O ledger produz stock negativo no movimento ${movement.id}.`)
    if (after !== total) problems.push(`Saldo posterior incoerente no movimento ${movement.id}.`)
  })
  return total
}

function checkpointSignature(input: {
  medication: StockEntity
  schedules: MedicationSchedule[]
  movements: StockMovement[]
  events: MedicationDoseEvent[]
  reconstructedMinor: string
}): string {
  const lastMovement = [...input.movements].sort(compareMovements).at(-1)
  const lastEvent = [...input.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).at(-1)
  const scheduleSignature = [...input.schedules]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((schedule) => `${schedule.id}:${schedule.localTime}:${schedule.quantityMinor}:${schedule.effectiveFrom}:${schedule.effectiveUntil ?? ''}`)
    .join('|')
  return [
    input.medication.id,
    input.medication.name,
    input.medication.dosage ?? '',
    input.medication.unit,
    input.medication.startDate ?? '',
    scheduleSignature,
    input.movements.length,
    lastMovement?.id ?? '',
    input.events.length,
    lastEvent?.id ?? '',
    input.reconstructedMinor,
  ].join('::')
}

export class MedicationDataProtectionService {
  constructor(private readonly db: AppDatabase) {}

  private async medication(medicationId: string): Promise<StockEntity> {
    const medication = await this.db.stockEntities.get(medicationId)
    if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    return medication
  }

  private async protectionRecords(prefix: string) {
    const records = await this.db.metadata.toArray()
    return records.filter((record) => record.key.startsWith(prefix)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.key.localeCompare(b.key))
  }

  async ensureProtected(medicationId: string): Promise<MedicationProtectionRoot> {
    const medication = await this.medication(medicationId)
    const key = `${ROOT_PREFIX}${medicationId}`
    const existing = await this.db.metadata.get(key)
    if (existing) {
      const root = parseJson<MedicationProtectionRoot>(existing.value, 'registo raiz de proteção')
      if (root.version !== 1 || root.medicationId !== medicationId || root.code !== medicationCode(medicationId)) {
        throw new Error('INCONSISTÊNCIA: o registo raiz de proteção do medicamento não corresponde à entidade.')
      }
      return root
    }

    const protectedAt = new Date().toISOString()
    const root: MedicationProtectionRoot = {
      version: 1,
      medicationId,
      code: medicationCode(medicationId),
      protectedAt,
      original: identitySnapshot(medication),
    }
    await this.db.metadata.add({ key, value: JSON.stringify(root), updatedAt: protectedAt })
    return root
  }

  async getProtectedNote(medicationId: string): Promise<string> {
    await this.ensureProtected(medicationId)
    const record = await this.db.metadata.get(`${NOTE_CURRENT_PREFIX}${medicationId}`)
    if (!record) return ''
    const payload = parseJson<MedicationNotePayload>(record.value, 'nota protegida')
    if (payload.medicationId !== medicationId) throw new Error('INCONSISTÊNCIA: nota protegida associada ao medicamento errado.')
    return payload.note
  }

  async saveProtectedNote(medicationId: string, note: string): Promise<{ changed: boolean; updatedAt: string }> {
    await this.ensureProtected(medicationId)
    if (note.length > NOTE_MAX_LENGTH) throw new Error(`A nota pode ter no máximo ${NOTE_MAX_LENGTH} caracteres.`)
    const normalized = note.replace(/\r\n/g, '\n')
    const currentKey = `${NOTE_CURRENT_PREFIX}${medicationId}`
    const currentRecord = await this.db.metadata.get(currentKey)
    if (currentRecord) {
      const current = parseJson<MedicationNotePayload>(currentRecord.value, 'nota protegida')
      if (current.note === normalized) return { changed: false, updatedAt: current.updatedAt }
    }

    const updatedAt = new Date().toISOString()
    const payload: MedicationNotePayload = { version: 1, medicationId, note: normalized, updatedAt }
    const historyKey = `${NOTE_HISTORY_PREFIX}${medicationId}:${updatedAt}:${newId()}`
    await this.db.transaction('rw', this.db.metadata, async () => {
      await this.db.metadata.add({ key: historyKey, value: JSON.stringify(payload), updatedAt })
      await this.db.metadata.put({ key: currentKey, value: JSON.stringify(payload), updatedAt })
    })
    return { changed: true, updatedAt }
  }

  async verifyMedication(medicationId: string): Promise<MedicationProtectionSummary> {
    const medication = await this.medication(medicationId)
    const root = await this.ensureProtected(medicationId)
    const [movements, schedules, events, checkpoints, noteHistory] = await Promise.all([
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
      this.protectionRecords(`${CHECKPOINT_PREFIX}${medicationId}:`),
      this.protectionRecords(`${NOTE_HISTORY_PREFIX}${medicationId}:`),
    ])

    const problems: string[] = []
    const reconstructed = reconstruct(movements, problems)
    const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]))
    const movementById = new Map(movements.map((movement) => [movement.id, movement]))
    const eventById = new Map(events.map((event) => [event.id, event]))

    for (const schedule of schedules) {
      if (schedule.medicationId !== medicationId) problems.push(`Horário ${schedule.id} pertence a outro medicamento.`)
    }
    for (const event of events) {
      if (!scheduleById.has(event.scheduleId)) problems.push(`Evento ${event.id} refere um horário inexistente.`)
      if (event.correctionOf && !eventById.has(event.correctionOf)) problems.push(`Correção ${event.id} refere um evento inexistente.`)
      if (event.status === 'taken') {
        if (!event.stockMovementId) {
          problems.push(`Toma ${event.id} não tem movimento de stock associado.`)
        } else {
          const movement = movementById.get(event.stockMovementId)
          if (!movement) problems.push(`Toma ${event.id} refere um movimento de stock inexistente.`)
          else if (movement.type !== 'consumption' || BigInt(movement.quantityMinor) !== -BigInt(event.quantityMinor)) {
            problems.push(`Toma ${event.id} não coincide com a quantidade do movimento de stock.`)
          }
        }
      }
    }

    if (root.original.id !== medication.id) problems.push('A identidade original protegida não corresponde ao medicamento atual.')
    const lastCheckpoint = checkpoints.at(-1)

    return {
      medicationId,
      code: root.code,
      status: problems.length ? 'INCONSISTÊNCIA' : 'OK',
      protectedAt: root.protectedAt,
      lastCheckpointAt: lastCheckpoint?.updatedAt,
      checkpointCount: checkpoints.length,
      noteRevisionCount: noteHistory.length,
      movementCount: movements.length,
      scheduleCount: schedules.length,
      doseEventCount: events.length,
      reconstructedMinor: reconstructed.toString(),
      problems,
    }
  }

  async recordCheckpoint(medicationId: string, reason = 'verificação manual'): Promise<{ created: boolean; summary: MedicationProtectionSummary }> {
    const medication = await this.medication(medicationId)
    const root = await this.ensureProtected(medicationId)
    const [movements, schedules, events] = await Promise.all([
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
    ])
    const problems: string[] = []
    const reconstructed = reconstruct(movements, problems)
    if (problems.length) throw new Error(`INCONSISTÊNCIA: ${problems[0]}`)
    const signature = checkpointSignature({ medication, schedules, movements, events, reconstructedMinor: reconstructed.toString() })
    const previous = (await this.protectionRecords(`${CHECKPOINT_PREFIX}${medicationId}:`)).at(-1)
    if (previous) {
      const previousPayload = parseJson<MedicationCheckpointPayload>(previous.value, 'ponto de proteção')
      if (previousPayload.signature === signature) {
        return { created: false, summary: await this.verifyMedication(medicationId) }
      }
    }

    const createdAt = new Date().toISOString()
    const payload: MedicationCheckpointPayload = {
      version: 1,
      medicationId,
      code: root.code,
      createdAt,
      reason: reason.slice(0, 200),
      signature,
      medication: identitySnapshot(medication),
      schedules: [...schedules].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
      movementCount: movements.length,
      doseEventCount: events.length,
      reconstructedMinor: reconstructed.toString(),
    }
    await this.db.metadata.add({
      key: `${CHECKPOINT_PREFIX}${medicationId}:${createdAt}:${newId()}`,
      value: JSON.stringify(payload),
      updatedAt: createdAt,
    })
    return { created: true, summary: await this.verifyMedication(medicationId) }
  }

  async protectAllMedications(): Promise<MedicationProtectionSummary[]> {
    const medications = await this.db.stockEntities.where('kind').equals('medication').toArray()
    const summaries: MedicationProtectionSummary[] = []
    for (const medication of medications.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
      await this.ensureProtected(medication.id)
      summaries.push(await this.verifyMedication(medication.id))
    }
    return summaries
  }
}
