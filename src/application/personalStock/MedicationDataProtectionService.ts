import { secureStorage } from '../../security/secureStorage'
import type { MedicationDoseEvent, MedicationSchedule, StockEntity, StockMovement } from '../../domain/personalStock/models'
import type { AppDatabase, AppMetadataRecord } from '../../infrastructure/database/appDatabase'
import { minorToDecimal } from './decimal'

const ROOT_PREFIX = 'medication-protection:root:'
const CHECKPOINT_PREFIX = 'medication-protection:checkpoint:'
const NOTE_CURRENT_PREFIX = 'medication-protection:note-current:'
const NOTE_HISTORY_PREFIX = 'medication-protection:note-history:'
const PROFILE_CURRENT_PREFIX = 'medication-protection:profile-current:'
const PROFILE_HISTORY_PREFIX = 'medication-protection:profile-history:'
const REDUNDANT_SNAPSHOT_KEY = 'foco-jornada:medication-protection:snapshot:v1'
const REDUNDANT_SNAPSHOT_PREVIOUS_KEY = 'foco-jornada:medication-protection:snapshot:previous:v1'
const NOTE_MAX_LENGTH = 10_000
const PROFILE_TEXT_MAX_LENGTH = 4_000

export type MedicationProtectionStatus = 'OK' | 'INCONSISTÊNCIA'
export type MedicationLifecycleStatus = 'active' | 'paused' | 'finished'
export type MedicationTimelineKind =
  | 'created'
  | 'profile'
  | 'note'
  | 'schedule'
  | 'stock'
  | 'dose'
  | 'protection'

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
  profile?: MedicationProtectedProfile
  noteRevisionCount?: number
}

interface MedicationNotePayload {
  version: 1
  medicationId: string
  note: string
  updatedAt: string
}

export interface MedicationProtectedProfile {
  version: 1
  medicationId: string
  status: MedicationLifecycleStatus
  prescribedBy: string
  observation: string
  updatedAt: string
}

export interface MedicationTimelineItem {
  id: string
  medicationId: string
  kind: MedicationTimelineKind
  title: string
  description: string
  createdAt: string
}

export interface MedicationDashboardSummary {
  medicationCount: number
  scheduledDoseCount: number
  takenDoseCount: number
  pendingDoseCount: number
  notTakenDoseCount: number
}

export interface MedicationSnapshotStatus {
  available: boolean
  valid: boolean
  createdAt?: string
  medicationCount: number
  recordCount: number
  sizeBytes: number
  source: 'current' | 'previous' | 'none'
  error?: string
}

interface MedicationSnapshotCore {
  version: 1
  createdAt: string
  medications: StockEntity[]
  movements: StockMovement[]
  schedules: MedicationSchedule[]
  events: MedicationDoseEvent[]
  metadata: AppMetadataRecord[]
}

interface MedicationRedundantSnapshot extends MedicationSnapshotCore {
  checksum: string
}

export interface MedicationProtectionSummary {
  medicationId: string
  code: string
  status: MedicationProtectionStatus
  protectedAt: string
  lastCheckpointAt?: string
  checkpointCount: number
  noteRevisionCount: number
  profileRevisionCount: number
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
  profile: MedicationProtectedProfile
  note: string
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
    input.profile.status,
    input.profile.prescribedBy,
    input.profile.observation,
    input.note,
  ].join('::')
}

function isLifecycleStatus(value: unknown): value is MedicationLifecycleStatus {
  return value === 'active' || value === 'paused' || value === 'finished'
}

function normalizeProfileText(value: string, label: string): string {
  const normalized = value.replace(/\r\n/g, '\n').trim()
  if (normalized.length > PROFILE_TEXT_MAX_LENGTH) {
    throw new Error(`${label} pode ter no máximo ${PROFILE_TEXT_MAX_LENGTH} caracteres.`)
  }
  return normalized
}

function nextIsoTimestamp(previous?: string): string {
  const now = Date.now()
  const previousMs = previous ? Date.parse(previous) : Number.NaN
  const nextMs = Number.isFinite(previousMs) && now <= previousMs ? previousMs + 1 : now
  return new Date(nextMs).toISOString()
}

function statusLabel(status: MedicationLifecycleStatus): string {
  if (status === 'active') return 'Em uso'
  if (status === 'paused') return 'Pausado'
  return 'Finalizado'
}

function currentActiveEvent(events: MedicationDoseEvent[]): MedicationDoseEvent | undefined {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )
  return [...events]
    .filter((event) => event.status !== 'corrected' && !correctedIds.has(event.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0]
}

function checksum(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function snapshotCore(snapshot: MedicationSnapshotCore): MedicationSnapshotCore {
  return {
    version: 1,
    createdAt: snapshot.createdAt,
    medications: snapshot.medications,
    movements: snapshot.movements,
    schedules: snapshot.schedules,
    events: snapshot.events,
    metadata: snapshot.metadata,
  }
}

function snapshotText(core: MedicationSnapshotCore): string {
  const normalized = snapshotCore(core)
  return JSON.stringify({ ...normalized, checksum: checksum(JSON.stringify(normalized)) })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sameRecord(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function parseSnapshot(text: string): MedicationRedundantSnapshot {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error('A cópia protegida de medicação não contém JSON válido.')
  }
  if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.createdAt !== 'string') {
    throw new Error('Formato de cópia protegida de medicação inválido.')
  }
  if (
    !Array.isArray(parsed.medications)
    || !Array.isArray(parsed.movements)
    || !Array.isArray(parsed.schedules)
    || !Array.isArray(parsed.events)
    || !Array.isArray(parsed.metadata)
    || typeof parsed.checksum !== 'string'
  ) {
    throw new Error('A cópia protegida de medicação está incompleta.')
  }

  const snapshot = parsed as unknown as MedicationRedundantSnapshot
  const core = snapshotCore(snapshot)
  if (checksum(JSON.stringify(core)) !== snapshot.checksum) {
    throw new Error('A cópia protegida de medicação falhou a verificação de integridade.')
  }

  const medicationIds = new Set<string>()
  for (const medication of snapshot.medications) {
    if (!isRecord(medication) || medication.kind !== 'medication' || typeof medication.id !== 'string' || !medication.id) {
      throw new Error('A cópia contém um medicamento inválido.')
    }
    if (medicationIds.has(medication.id)) throw new Error(`A cópia contém o medicamento duplicado ${medication.id}.`)
    medicationIds.add(medication.id)
  }

  const movementIds = new Set<string>()
  const movementOperationIds = new Set<string>()
  const byEntity = new Map<string, StockMovement[]>()
  for (const movement of snapshot.movements) {
    if (
      !isRecord(movement)
      || typeof movement.id !== 'string'
      || typeof movement.operationId !== 'string'
      || typeof movement.entityId !== 'string'
      || !medicationIds.has(movement.entityId)
    ) {
      throw new Error('A cópia contém um movimento de medicação inválido.')
    }
    if (movementIds.has(movement.id) || movementOperationIds.has(movement.operationId)) {
      throw new Error('A cópia contém movimentos de medicação duplicados.')
    }
    movementIds.add(movement.id)
    movementOperationIds.add(movement.operationId)
    const group = byEntity.get(movement.entityId) ?? []
    group.push(movement as StockMovement)
    byEntity.set(movement.entityId, group)
  }

  for (const [medicationId, movements] of byEntity) {
    const problems: string[] = []
    reconstruct(movements, problems)
    if (problems.length) throw new Error(`Cópia inválida para ${medicationId}: ${problems[0]}`)
  }

  const scheduleIds = new Set<string>()
  for (const schedule of snapshot.schedules) {
    if (
      !isRecord(schedule)
      || typeof schedule.id !== 'string'
      || typeof schedule.medicationId !== 'string'
      || !medicationIds.has(schedule.medicationId)
    ) {
      throw new Error('A cópia contém um horário de medicação inválido.')
    }
    if (scheduleIds.has(schedule.id)) throw new Error('A cópia contém horários duplicados.')
    scheduleIds.add(schedule.id)
  }

  const eventIds = new Set<string>()
  const eventOperationIds = new Set<string>()
  for (const event of snapshot.events) {
    if (
      !isRecord(event)
      || typeof event.id !== 'string'
      || typeof event.operationId !== 'string'
      || typeof event.medicationId !== 'string'
      || typeof event.scheduleId !== 'string'
      || !medicationIds.has(event.medicationId)
      || !scheduleIds.has(event.scheduleId)
    ) {
      throw new Error('A cópia contém um evento de toma inválido.')
    }
    if (eventIds.has(event.id) || eventOperationIds.has(event.operationId)) {
      throw new Error('A cópia contém eventos de toma duplicados.')
    }
    eventIds.add(event.id)
    eventOperationIds.add(event.operationId)
  }
  for (const event of snapshot.events) {
    if (event.status === 'corrected' && (!event.correctionOf || !eventIds.has(event.correctionOf))) {
      throw new Error('A cópia contém uma correção de toma sem evento original.')
    }
    if (event.status === 'taken' && (!event.stockMovementId || !movementIds.has(event.stockMovementId))) {
      throw new Error('A cópia contém uma toma sem movimento de stock correspondente.')
    }
  }

  const metadataKeys = new Set<string>()
  for (const record of snapshot.metadata) {
    if (
      !isRecord(record)
      || typeof record.key !== 'string'
      || !record.key.startsWith('medication-protection:')
      || typeof record.value !== 'string'
      || typeof record.updatedAt !== 'string'
    ) {
      throw new Error('A cópia contém metadados de proteção inválidos.')
    }
    if (metadataKeys.has(record.key)) throw new Error('A cópia contém metadados de proteção duplicados.')
    metadataKeys.add(record.key)
  }

  return snapshot
}

function localStorageValue(key: string): string | null {
  try {
    return secureStorage.getItem(key)
  } catch {
    return null
  }
}

function setLocalStorageValue(key: string, value: string): boolean {
  try {
    secureStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function snapshotRecordCount(snapshot: MedicationSnapshotCore): number {
  return snapshot.medications.length
    + snapshot.movements.length
    + snapshot.schedules.length
    + snapshot.events.length
    + snapshot.metadata.length
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
    return records
      .filter((record) => record.key.startsWith(prefix))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.key.localeCompare(b.key))
  }

  private defaultProfile(medication: StockEntity): MedicationProtectedProfile {
    return {
      version: 1,
      medicationId: medication.id,
      status: 'active',
      prescribedBy: '',
      observation: '',
      updatedAt: medication.createdAt,
    }
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

  async getProfile(medicationId: string): Promise<MedicationProtectedProfile> {
    const medication = await this.medication(medicationId)
    await this.ensureProtected(medicationId)
    const record = await this.db.metadata.get(`${PROFILE_CURRENT_PREFIX}${medicationId}`)
    if (!record) return this.defaultProfile(medication)
    const profile = parseJson<MedicationProtectedProfile>(record.value, 'perfil protegido')
    if (
      profile.version !== 1
      || profile.medicationId !== medicationId
      || !isLifecycleStatus(profile.status)
      || typeof profile.prescribedBy !== 'string'
      || typeof profile.observation !== 'string'
    ) {
      throw new Error('INCONSISTÊNCIA: perfil protegido de medicação inválido.')
    }
    return profile
  }

  async saveProfile(
    medicationId: string,
    input: { status: MedicationLifecycleStatus; prescribedBy: string; observation: string },
  ): Promise<{ changed: boolean; profile: MedicationProtectedProfile }> {
    if (!isLifecycleStatus(input.status)) throw new Error('Estado do medicamento inválido.')
    await this.ensureProtected(medicationId)
    const current = await this.getProfile(medicationId)
    const prescribedBy = normalizeProfileText(input.prescribedBy, 'Prescrito por')
    const observation = normalizeProfileText(input.observation, 'Observação')
    if (
      current.status === input.status
      && current.prescribedBy === prescribedBy
      && current.observation === observation
    ) {
      return { changed: false, profile: current }
    }

    const updatedAt = nextIsoTimestamp(current.updatedAt)
    const profile: MedicationProtectedProfile = {
      version: 1,
      medicationId,
      status: input.status,
      prescribedBy,
      observation,
      updatedAt,
    }
    const currentKey = `${PROFILE_CURRENT_PREFIX}${medicationId}`
    const historyKey = `${PROFILE_HISTORY_PREFIX}${medicationId}:${updatedAt}:${newId()}`
    await this.db.transaction('rw', this.db.metadata, async () => {
      await this.db.metadata.add({ key: historyKey, value: JSON.stringify(profile), updatedAt })
      await this.db.metadata.put({ key: currentKey, value: JSON.stringify(profile), updatedAt })
    })
    await this.syncRedundantSnapshotBestEffort()
    return { changed: true, profile }
  }

  async listProfileRevisions(medicationId: string): Promise<MedicationProtectedProfile[]> {
    await this.ensureProtected(medicationId)
    return (await this.protectionRecords(`${PROFILE_HISTORY_PREFIX}${medicationId}:`))
      .map((record) => parseJson<MedicationProtectedProfile>(record.value, 'revisão do perfil protegido'))
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
    let previousUpdatedAt: string | undefined
    if (currentRecord) {
      const current = parseJson<MedicationNotePayload>(currentRecord.value, 'nota protegida')
      previousUpdatedAt = current.updatedAt
      if (current.note === normalized) return { changed: false, updatedAt: current.updatedAt }
    }

    const updatedAt = nextIsoTimestamp(previousUpdatedAt)
    const payload: MedicationNotePayload = { version: 1, medicationId, note: normalized, updatedAt }
    const historyKey = `${NOTE_HISTORY_PREFIX}${medicationId}:${updatedAt}:${newId()}`
    await this.db.transaction('rw', this.db.metadata, async () => {
      await this.db.metadata.add({ key: historyKey, value: JSON.stringify(payload), updatedAt })
      await this.db.metadata.put({ key: currentKey, value: JSON.stringify(payload), updatedAt })
    })
    await this.syncRedundantSnapshotBestEffort()
    return { changed: true, updatedAt }
  }

  async listNoteRevisions(medicationId: string): Promise<Array<{ note: string; updatedAt: string }>> {
    await this.ensureProtected(medicationId)
    return (await this.protectionRecords(`${NOTE_HISTORY_PREFIX}${medicationId}:`))
      .map((record) => {
        const payload = parseJson<MedicationNotePayload>(record.value, 'revisão de nota protegida')
        return { note: payload.note, updatedAt: payload.updatedAt }
      })
  }

  async verifyMedication(medicationId: string): Promise<MedicationProtectionSummary> {
    const medication = await this.medication(medicationId)
    const root = await this.ensureProtected(medicationId)
    const [movements, schedules, events, checkpoints, noteHistory, profileHistory] = await Promise.all([
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
      this.protectionRecords(`${CHECKPOINT_PREFIX}${medicationId}:`),
      this.protectionRecords(`${NOTE_HISTORY_PREFIX}${medicationId}:`),
      this.protectionRecords(`${PROFILE_HISTORY_PREFIX}${medicationId}:`),
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

    for (const record of profileHistory) {
      const profile = parseJson<MedicationProtectedProfile>(record.value, 'revisão do perfil protegido')
      if (profile.medicationId !== medicationId || !isLifecycleStatus(profile.status)) {
        problems.push('Existe uma revisão de perfil protegida inválida.')
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
      profileRevisionCount: profileHistory.length,
      movementCount: movements.length,
      scheduleCount: schedules.length,
      doseEventCount: events.length,
      reconstructedMinor: reconstructed.toString(),
      problems,
    }
  }

  async recordCheckpoint(
    medicationId: string,
    reason = 'verificação manual',
  ): Promise<{ created: boolean; summary: MedicationProtectionSummary }> {
    const medication = await this.medication(medicationId)
    const root = await this.ensureProtected(medicationId)
    const [movements, schedules, events, profile, note, noteHistory] = await Promise.all([
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
      this.getProfile(medicationId),
      this.getProtectedNote(medicationId),
      this.protectionRecords(`${NOTE_HISTORY_PREFIX}${medicationId}:`),
    ])
    const problems: string[] = []
    const reconstructed = reconstruct(movements, problems)
    if (problems.length) throw new Error(`INCONSISTÊNCIA: ${problems[0]}`)
    const signature = checkpointSignature({
      medication,
      schedules,
      movements,
      events,
      reconstructedMinor: reconstructed.toString(),
      profile,
      note,
    })
    const previous = (await this.protectionRecords(`${CHECKPOINT_PREFIX}${medicationId}:`)).at(-1)
    if (previous) {
      const previousPayload = parseJson<MedicationCheckpointPayload>(previous.value, 'ponto de proteção')
      if (previousPayload.signature === signature) {
        await this.syncRedundantSnapshotBestEffort()
        return { created: false, summary: await this.verifyMedication(medicationId) }
      }
    }

    const createdAt = nextIsoTimestamp(previous?.updatedAt)
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
      profile,
      noteRevisionCount: noteHistory.length,
    }
    await this.db.metadata.add({
      key: `${CHECKPOINT_PREFIX}${medicationId}:${createdAt}:${newId()}`,
      value: JSON.stringify(payload),
      updatedAt: createdAt,
    })
    await this.syncRedundantSnapshotBestEffort()
    return { created: true, summary: await this.verifyMedication(medicationId) }
  }

  async protectAllMedications(): Promise<MedicationProtectionSummary[]> {
    const medications = await this.db.stockEntities.where('kind').equals('medication').toArray()
    const summaries: MedicationProtectionSummary[] = []
    for (const medication of medications.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
      await this.ensureProtected(medication.id)
      summaries.push(await this.verifyMedication(medication.id))
    }
    await this.syncRedundantSnapshotBestEffort()
    return summaries
  }

  async getTodayDashboard(onDate: string): Promise<MedicationDashboardSummary> {
    const medications = await this.db.stockEntities.where('kind').equals('medication').toArray()
    let medicationCount = 0
    let scheduledDoseCount = 0
    let takenDoseCount = 0
    let pendingDoseCount = 0
    let notTakenDoseCount = 0

    for (const medication of medications) {
      const profile = await this.getProfile(medication.id)
      if (profile.status !== 'active') continue
      medicationCount += 1
      const schedules = (await this.db.medicationSchedules.where('medicationId').equals(medication.id).toArray())
        .filter((schedule) => schedule.effectiveFrom <= onDate && (!schedule.effectiveUntil || schedule.effectiveUntil >= onDate))
      const events = await this.db.medicationDoseEvents.where('medicationId').equals(medication.id).toArray()
      for (const schedule of schedules) {
        scheduledDoseCount += 1
        const occurrence = currentActiveEvent(events.filter((event) => event.occurrenceKey === `${schedule.id}:${onDate}`))
        if (occurrence?.status === 'taken') takenDoseCount += 1
        else if (occurrence?.status === 'not_taken') notTakenDoseCount += 1
        else pendingDoseCount += 1
      }
    }

    return {
      medicationCount,
      scheduledDoseCount,
      takenDoseCount,
      pendingDoseCount,
      notTakenDoseCount,
    }
  }

  async getMedicationTimeline(medicationId: string): Promise<MedicationTimelineItem[]> {
    const medication = await this.medication(medicationId)
    const [movements, schedules, events, noteHistory, profileHistory, checkpoints] = await Promise.all([
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
      this.protectionRecords(`${NOTE_HISTORY_PREFIX}${medicationId}:`),
      this.protectionRecords(`${PROFILE_HISTORY_PREFIX}${medicationId}:`),
      this.protectionRecords(`${CHECKPOINT_PREFIX}${medicationId}:`),
    ])

    const items: MedicationTimelineItem[] = [{
      id: `created:${medication.id}`,
      medicationId,
      kind: 'created',
      title: 'Medicamento registado',
      description: `${medication.name} · ${medication.dosage ?? 'dosagem não indicada'} · stock inicial protegido pelo ledger.`,
      createdAt: medication.createdAt,
    }]

    for (const record of profileHistory) {
      const profile = parseJson<MedicationProtectedProfile>(record.value, 'revisão do perfil protegido')
      items.push({
        id: record.key,
        medicationId,
        kind: 'profile',
        title: 'Informação protegida atualizada',
        description: `Estado: ${statusLabel(profile.status)}${profile.prescribedBy ? ` · Prescrito por: ${profile.prescribedBy}` : ''}.`,
        createdAt: profile.updatedAt,
      })
    }

    for (const record of noteHistory) {
      const note = parseJson<MedicationNotePayload>(record.value, 'revisão de nota protegida')
      items.push({
        id: record.key,
        medicationId,
        kind: 'note',
        title: 'Nota protegida guardada',
        description: note.note ? note.note.slice(0, 180) : 'Nota limpa; a versão anterior continua preservada no histórico.',
        createdAt: note.updatedAt,
      })
    }

    for (const schedule of schedules) {
      items.push({
        id: `schedule:${schedule.id}`,
        medicationId,
        kind: 'schedule',
        title: 'Horário adicionado',
        description: `${schedule.localTime} · ${minorToDecimal(schedule.quantityMinor)} ${medication.unit} · válido desde ${schedule.effectiveFrom}.`,
        createdAt: schedule.createdAt,
      })
    }

    const doseMovementIds = new Set(events.map((event) => event.stockMovementId).filter((value): value is string => Boolean(value)))
    for (const movement of movements) {
      if (doseMovementIds.has(movement.id)) continue
      const label = movement.type === 'initial_stock'
        ? 'Stock inicial registado'
        : movement.type === 'restock'
          ? 'Reposição de stock'
          : movement.type === 'correction'
            ? 'Correção de stock'
            : 'Consumo registado'
      items.push({
        id: `movement:${movement.id}`,
        medicationId,
        kind: 'stock',
        title: label,
        description: `${minorToDecimal(movement.quantityMinor)} ${medication.unit} · saldo após movimento: ${minorToDecimal(movement.balanceAfterMinor)}.`,
        createdAt: movement.createdAt,
      })
    }

    for (const event of events) {
      const title = event.status === 'taken'
        ? (event.rescheduledFrom ? 'Toma reagendada confirmada' : 'Toma registada')
        : event.status === 'not_taken'
          ? 'Toma marcada como não tomada'
          : event.status === 'postponed'
            ? 'Toma adiada'
            : 'Registo corrigido'
      const detail = event.status === 'postponed' && event.postponedTo
        ? `Nova hora: ${new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.postponedTo))}.`
        : event.status === 'taken'
          ? `Quantidade: ${minorToDecimal(event.quantityMinor)} ${medication.unit}.`
          : event.status === 'corrected'
            ? 'O registo original permanece guardado e esta correção altera apenas o estado ativo.'
            : 'Sem alteração de stock.'
      items.push({
        id: `dose:${event.id}`,
        medicationId,
        kind: 'dose',
        title,
        description: detail,
        createdAt: event.createdAt,
      })
    }

    for (const record of checkpoints) {
      const point = parseJson<MedicationCheckpointPayload>(record.value, 'ponto de proteção')
      items.push({
        id: record.key,
        medicationId,
        kind: 'protection',
        title: 'Ponto de proteção criado',
        description: point.reason || 'Verificação protegida.',
        createdAt: point.createdAt,
      })
    }

    return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))
  }

  private async buildSnapshotCore(): Promise<MedicationSnapshotCore> {
    const medications = (await this.db.stockEntities.where('kind').equals('medication').toArray())
      .sort((a, b) => a.id.localeCompare(b.id))
    for (const medication of medications) await this.ensureProtected(medication.id)
    const medicationIds = new Set(medications.map((medication) => medication.id))
    const [allMovements, allSchedules, allEvents, allMetadata] = await Promise.all([
      this.db.stockMovements.toArray(),
      this.db.medicationSchedules.toArray(),
      this.db.medicationDoseEvents.toArray(),
      this.db.metadata.toArray(),
    ])
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      medications,
      movements: allMovements.filter((movement) => medicationIds.has(movement.entityId))
        .sort((a, b) => a.entityId.localeCompare(b.entityId) || compareMovements(a, b)),
      schedules: allSchedules.filter((schedule) => medicationIds.has(schedule.medicationId))
        .sort((a, b) => a.medicationId.localeCompare(b.medicationId) || a.order - b.order || a.id.localeCompare(b.id)),
      events: allEvents.filter((event) => medicationIds.has(event.medicationId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
      metadata: allMetadata.filter((record) => record.key.startsWith('medication-protection:'))
        .sort((a, b) => a.key.localeCompare(b.key)),
    }
  }

  async syncRedundantSnapshot(): Promise<MedicationSnapshotStatus> {
    const core = await this.buildSnapshotCore()
    const text = snapshotText(core)
    const current = localStorageValue(REDUNDANT_SNAPSHOT_KEY)
    if (core.medications.length === 0 && current) return this.getRedundantSnapshotStatus()
    if (current && current !== text) setLocalStorageValue(REDUNDANT_SNAPSHOT_PREVIOUS_KEY, current)
    const available = setLocalStorageValue(REDUNDANT_SNAPSHOT_KEY, text)
    return {
      available,
      valid: available,
      createdAt: core.createdAt,
      medicationCount: core.medications.length,
      recordCount: snapshotRecordCount(core),
      sizeBytes: new TextEncoder().encode(text).length,
      source: available ? 'current' : 'none',
      error: available ? undefined : 'O navegador não disponibilizou a cópia local redundante.',
    }
  }

  private async syncRedundantSnapshotBestEffort(): Promise<void> {
    try {
      await this.syncRedundantSnapshot()
    } catch {
      // A operação principal já ficou persistida em IndexedDB. A cópia redundante é uma camada adicional.
    }
  }

  async getRedundantSnapshotStatus(): Promise<MedicationSnapshotStatus> {
    const candidates: Array<{ source: 'current' | 'previous'; text: string | null }> = [
      { source: 'current', text: localStorageValue(REDUNDANT_SNAPSHOT_KEY) },
      { source: 'previous', text: localStorageValue(REDUNDANT_SNAPSHOT_PREVIOUS_KEY) },
    ]
    let lastError = ''
    for (const candidate of candidates) {
      if (!candidate.text) continue
      try {
        const parsed = parseSnapshot(candidate.text)
        return {
          available: true,
          valid: true,
          createdAt: parsed.createdAt,
          medicationCount: parsed.medications.length,
          recordCount: snapshotRecordCount(parsed),
          sizeBytes: new TextEncoder().encode(candidate.text).length,
          source: candidate.source,
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Cópia local inválida.'
      }
    }
    return {
      available: false,
      valid: false,
      medicationCount: 0,
      recordCount: 0,
      sizeBytes: 0,
      source: 'none',
      error: lastError || 'Ainda não existe uma cópia local redundante.',
    }
  }

  async exportMedicationSnapshotText(): Promise<string> {
    const core = await this.buildSnapshotCore()
    return JSON.stringify(JSON.parse(snapshotText(core)) as MedicationRedundantSnapshot, null, 2)
  }

  private async mergeSnapshot(snapshot: MedicationRedundantSnapshot): Promise<number> {
    const [entities, movements, schedules, events, metadata] = await Promise.all([
      this.db.stockEntities.toArray(),
      this.db.stockMovements.toArray(),
      this.db.medicationSchedules.toArray(),
      this.db.medicationDoseEvents.toArray(),
      this.db.metadata.toArray(),
    ])
    const entityById = new Map(entities.map((item) => [item.id, item]))
    const movementById = new Map(movements.map((item) => [item.id, item]))
    const movementByOperation = new Map(movements.map((item) => [item.operationId, item]))
    const scheduleById = new Map(schedules.map((item) => [item.id, item]))
    const eventById = new Map(events.map((item) => [item.id, item]))
    const eventByOperation = new Map(events.map((item) => [item.operationId, item]))
    const metadataByKey = new Map(metadata.map((item) => [item.key, item]))

    for (const item of snapshot.medications) {
      const existing = entityById.get(item.id)
      if (existing && !sameRecord(existing, item)) throw new Error(`Conflito: o medicamento ${item.id} já existe com conteúdo diferente.`)
    }
    for (const item of snapshot.movements) {
      const existing = movementById.get(item.id)
      if (existing && !sameRecord(existing, item)) throw new Error(`Conflito: o movimento ${item.id} já existe com conteúdo diferente.`)
      const sameOperation = movementByOperation.get(item.operationId)
      if (sameOperation && sameOperation.id !== item.id) throw new Error('Conflito: operationId de movimento já utilizado localmente.')
    }
    for (const item of snapshot.schedules) {
      const existing = scheduleById.get(item.id)
      if (existing && !sameRecord(existing, item)) throw new Error(`Conflito: o horário ${item.id} já existe com conteúdo diferente.`)
    }
    for (const item of snapshot.events) {
      const existing = eventById.get(item.id)
      if (existing && !sameRecord(existing, item)) throw new Error(`Conflito: o evento ${item.id} já existe com conteúdo diferente.`)
      const sameOperation = eventByOperation.get(item.operationId)
      if (sameOperation && sameOperation.id !== item.id) throw new Error('Conflito: operationId de toma já utilizado localmente.')
    }
    for (const item of snapshot.metadata) {
      const existing = metadataByKey.get(item.key)
      const replaceable = item.key.startsWith(NOTE_CURRENT_PREFIX) || item.key.startsWith(PROFILE_CURRENT_PREFIX)
      if (existing && !sameRecord(existing, item) && !replaceable) {
        throw new Error(`Conflito: o registo protegido ${item.key} já existe com conteúdo diferente.`)
      }
    }

    let added = 0
    await this.db.transaction(
      'rw',
      [this.db.stockEntities, this.db.stockMovements, this.db.medicationSchedules, this.db.medicationDoseEvents, this.db.metadata],
      async () => {
        for (const item of snapshot.medications) {
          if (!entityById.has(item.id)) {
            await this.db.stockEntities.add(item)
            added += 1
          }
        }
        for (const item of snapshot.movements) {
          if (!movementById.has(item.id)) {
            await this.db.stockMovements.add(item)
            added += 1
          }
        }
        for (const item of snapshot.schedules) {
          if (!scheduleById.has(item.id)) {
            await this.db.medicationSchedules.add(item)
            added += 1
          }
        }
        for (const item of snapshot.events) {
          if (!eventById.has(item.id)) {
            await this.db.medicationDoseEvents.add(item)
            added += 1
          }
        }
        for (const item of snapshot.metadata) {
          const existing = metadataByKey.get(item.key)
          if (!existing) {
            await this.db.metadata.add(item)
            added += 1
          } else if (
            !sameRecord(existing, item)
            && (item.key.startsWith(NOTE_CURRENT_PREFIX) || item.key.startsWith(PROFILE_CURRENT_PREFIX))
            && item.updatedAt > existing.updatedAt
          ) {
            await this.db.metadata.put(item)
          }
        }
      },
    )

    for (const medication of snapshot.medications) {
      const result = await this.verifyMedication(medication.id)
      if (result.status !== 'OK') throw new Error(`INCONSISTÊNCIA após restauro protegido de ${medication.name}.`)
    }
    return added
  }

  async mergeMedicationSnapshotText(text: string): Promise<{ addedRecords: number; medicationCount: number }> {
    const snapshot = parseSnapshot(text)
    const addedRecords = await this.mergeSnapshot(snapshot)
    await this.syncRedundantSnapshotBestEffort()
    return { addedRecords, medicationCount: snapshot.medications.length }
  }

  async recoverFromRedundantSnapshotIfNeeded(): Promise<{ recovered: boolean; source: 'current' | 'previous' | 'none' }> {
    const existingMedicationCount = await this.db.stockEntities.where('kind').equals('medication').count()
    if (existingMedicationCount > 0) {
      await this.syncRedundantSnapshotBestEffort()
      return { recovered: false, source: 'none' }
    }

    const candidates: Array<{ source: 'current' | 'previous'; text: string | null }> = [
      { source: 'current', text: localStorageValue(REDUNDANT_SNAPSHOT_KEY) },
      { source: 'previous', text: localStorageValue(REDUNDANT_SNAPSHOT_PREVIOUS_KEY) },
    ]
    for (const candidate of candidates) {
      if (!candidate.text) continue
      try {
        const snapshot = parseSnapshot(candidate.text)
        if (!snapshot.medications.length) continue
        await this.mergeSnapshot(snapshot)
        await this.syncRedundantSnapshotBestEffort()
        return { recovered: true, source: candidate.source }
      } catch {
        // Tenta a geração anterior se a cópia atual estiver corrompida ou incompatível.
      }
    }
    return { recovered: false, source: 'none' }
  }
}
