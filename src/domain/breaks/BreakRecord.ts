export type BreakType = 'short' | 'long' | 'custom'
export type BreakStatus = 'active' | 'finished' | 'cancelled'

export interface BreakRecord {
  id: string
  journeyId: string
  type: BreakType
  plannedDurationMinutes?: number
  startedAt: string
  endedAt?: string
  actualDurationSeconds?: number
  status: BreakStatus
}

export interface CreateBreakInput {
  id: string
  journeyId: string
  type: BreakType
  plannedDurationMinutes?: number
  now: string
}

export function createBreakRecord(input: CreateBreakInput): BreakRecord {
  if (input.plannedDurationMinutes !== undefined && input.plannedDurationMinutes <= 0) {
    throw new Error('A duração prevista da pausa deve ser superior a zero.')
  }

  return {
    id: input.id,
    journeyId: input.journeyId,
    type: input.type,
    plannedDurationMinutes: input.plannedDurationMinutes,
    startedAt: input.now,
    status: 'active',
  }
}

export function finishBreakRecord(record: BreakRecord, now: string): BreakRecord {
  if (record.status !== 'active') {
    throw new Error('Apenas uma pausa ativa pode ser terminada.')
  }

  const startedAt = Date.parse(record.startedAt)
  const endedAt = Date.parse(now)

  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
    throw new Error('O fim da pausa não pode ser anterior ao início.')
  }

  return {
    ...record,
    endedAt: now,
    actualDurationSeconds: Math.floor((endedAt - startedAt) / 1000),
    status: 'finished',
  }
}

export function getBreakDurationMs(record: BreakRecord, now = new Date().toISOString()): number {
  if (record.status === 'finished' && record.actualDurationSeconds !== undefined) {
    return Math.max(0, record.actualDurationSeconds * 1000)
  }

  const start = Date.parse(record.startedAt)
  const end = Date.parse(record.endedAt ?? now)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }

  return Math.max(0, end - start)
}
