export type ActivityStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export interface Activity {
  id: string
  journeyId: string
  name: string
  description?: string
  startedAt?: string
  endedAt?: string
  status: ActivityStatus
  createdAt: string
  updatedAt: string
}

export interface CreateActivityInput {
  id: string
  journeyId: string
  name: string
  description?: string
  now: string
}

function normalizeName(name: string): string {
  const normalized = name.trim()
  if (!normalized) {
    throw new Error('O nome da atividade é obrigatório.')
  }
  if (normalized.length > 120) {
    throw new Error('O nome da atividade não pode exceder 120 caracteres.')
  }
  return normalized
}

function normalizeDescription(description?: string): string | undefined {
  const normalized = description?.trim()
  if (!normalized) return undefined
  if (normalized.length > 500) {
    throw new Error('A descrição da atividade não pode exceder 500 caracteres.')
  }
  return normalized
}

export function createActivity(input: CreateActivityInput): Activity {
  return {
    id: input.id,
    journeyId: input.journeyId,
    name: normalizeName(input.name),
    description: normalizeDescription(input.description),
    status: 'pending',
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function editActivity(
  activity: Activity,
  name: string,
  description: string | undefined,
  now: string,
): Activity {
  if (activity.status === 'completed' || activity.status === 'cancelled') {
    throw new Error('Uma atividade concluída ou cancelada não pode ser editada.')
  }

  return {
    ...activity,
    name: normalizeName(name),
    description: normalizeDescription(description),
    updatedAt: now,
  }
}

export function startActivityRecord(activity: Activity, now: string): Activity {
  if (activity.status !== 'pending') {
    throw new Error('Apenas uma atividade pendente pode ser iniciada.')
  }

  return {
    ...activity,
    startedAt: now,
    status: 'active',
    updatedAt: now,
  }
}

export function completeActivityRecord(activity: Activity, now: string): Activity {
  if (activity.status !== 'active' || !activity.startedAt) {
    throw new Error('Apenas uma atividade ativa pode ser concluída.')
  }

  if (Date.parse(now) < Date.parse(activity.startedAt)) {
    throw new Error('O fim da atividade não pode ser anterior ao início.')
  }

  return {
    ...activity,
    endedAt: now,
    status: 'completed',
    updatedAt: now,
  }
}

export function cancelActivityRecord(activity: Activity, now: string): Activity {
  if (activity.status === 'completed' || activity.status === 'cancelled') {
    throw new Error('Esta atividade já está encerrada.')
  }

  if (activity.startedAt && Date.parse(now) < Date.parse(activity.startedAt)) {
    throw new Error('O cancelamento não pode ser anterior ao início.')
  }

  return {
    ...activity,
    endedAt: activity.startedAt ? now : undefined,
    status: 'cancelled',
    updatedAt: now,
  }
}

export function getActivityDurationMs(activity: Activity, now = new Date().toISOString()): number {
  if (!activity.startedAt) return 0

  const start = Date.parse(activity.startedAt)
  const end = Date.parse(activity.endedAt ?? now)

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, end - start)
}
