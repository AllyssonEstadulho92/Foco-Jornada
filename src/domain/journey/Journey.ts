export type JourneyStatus = 'active' | 'finished'

export interface Journey {
  id: string
  date: string
  startedAt: string
  endedAt?: string
  status: JourneyStatus
  createdAt: string
  updatedAt: string
}

export interface CreateJourneyInput {
  id: string
  date: string
  now: string
}

export function createJourney({ id, date, now }: CreateJourneyInput): Journey {
  return {
    id,
    date,
    startedAt: now,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

export function finishJourney(journey: Journey, now: string): Journey {
  if (journey.status !== 'active') {
    throw new Error('Apenas uma jornada ativa pode ser terminada.')
  }

  const startedAt = Date.parse(journey.startedAt)
  const endedAt = Date.parse(now)

  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
    throw new Error('A hora de saída não pode ser anterior à hora de entrada.')
  }

  return {
    ...journey,
    endedAt: now,
    status: 'finished',
    updatedAt: now,
  }
}

export function getJourneyDurationMs(journey: Journey, now = new Date().toISOString()): number {
  const start = Date.parse(journey.startedAt)
  const end = Date.parse(journey.endedAt ?? now)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }

  return Math.max(0, end - start)
}
