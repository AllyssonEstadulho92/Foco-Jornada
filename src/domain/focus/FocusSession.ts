export type FocusMode = 'pomodoro' | 'custom'
export type FocusSegmentType = 'focus' | 'short-break' | 'long-break'
export type FocusStatus = 'running' | 'paused' | 'completed' | 'cancelled'

export interface FocusSession {
  id: string
  journeyId: string
  activityId?: string
  mode: FocusMode
  segmentType: FocusSegmentType
  plannedDurationSeconds: number
  startedAt: string
  pausedAt?: string
  totalPausedSeconds: number
  endedAt?: string
  status: FocusStatus
  cycle: number
  createdAt: string
  updatedAt: string
}

export interface CreateFocusSessionInput {
  id: string
  journeyId: string
  activityId?: string
  mode: FocusMode
  segmentType: FocusSegmentType
  plannedDurationSeconds: number
  cycle: number
  now: string
}

export interface PomodoroStep {
  segmentType: FocusSegmentType
  cycle: number
  plannedDurationSeconds: number
}

export const POMODORO_FOCUS_SECONDS = 25 * 60
export const POMODORO_SHORT_BREAK_SECONDS = 5 * 60
export const POMODORO_LONG_BREAK_SECONDS = 15 * 60
export const POMODORO_CYCLES = 4

function parseTimestamp(timestamp: string, message: string): number {
  const value = Date.parse(timestamp)
  if (!Number.isFinite(value)) throw new Error(message)
  return value
}

function assertCycle(cycle: number): void {
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > POMODORO_CYCLES) {
    throw new Error(`O ciclo deve estar entre 1 e ${POMODORO_CYCLES}.`)
  }
}

export function getPomodoroDurationSeconds(segmentType: FocusSegmentType): number {
  if (segmentType === 'focus') return POMODORO_FOCUS_SECONDS
  if (segmentType === 'short-break') return POMODORO_SHORT_BREAK_SECONDS
  return POMODORO_LONG_BREAK_SECONDS
}

export function createFocusSession(input: CreateFocusSessionInput): FocusSession {
  parseTimestamp(input.now, 'A hora de início da sessão é inválida.')
  assertCycle(input.cycle)

  if (!Number.isInteger(input.plannedDurationSeconds) || input.plannedDurationSeconds <= 0) {
    throw new Error('A duração da sessão deve ser superior a zero.')
  }

  if (input.mode === 'pomodoro') {
    const expected = getPomodoroDurationSeconds(input.segmentType)
    if (input.plannedDurationSeconds !== expected) {
      throw new Error('A duração da sessão Pomodoro não corresponde ao segmento selecionado.')
    }
  }

  if (input.mode === 'custom' && input.segmentType !== 'focus') {
    throw new Error('O modo personalizado suporta apenas sessões de foco.')
  }

  return {
    id: input.id,
    journeyId: input.journeyId,
    activityId: input.activityId,
    mode: input.mode,
    segmentType: input.segmentType,
    plannedDurationSeconds: input.plannedDurationSeconds,
    startedAt: input.now,
    totalPausedSeconds: 0,
    status: 'running',
    cycle: input.cycle,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export function pauseFocusSession(session: FocusSession, now: string): FocusSession {
  if (session.status !== 'running') {
    throw new Error('Apenas uma sessão em execução pode ser pausada.')
  }

  const startedAt = parseTimestamp(session.startedAt, 'A hora de início da sessão é inválida.')
  const pausedAt = parseTimestamp(now, 'A hora de pausa da sessão é inválida.')
  if (pausedAt < startedAt) throw new Error('A pausa não pode ser anterior ao início da sessão.')

  return {
    ...session,
    pausedAt: now,
    status: 'paused',
    updatedAt: now,
  }
}

export function resumeFocusSession(session: FocusSession, now: string): FocusSession {
  if (session.status !== 'paused' || !session.pausedAt) {
    throw new Error('Apenas uma sessão pausada pode ser retomada.')
  }

  const pausedAt = parseTimestamp(session.pausedAt, 'A hora de pausa da sessão é inválida.')
  const resumedAt = parseTimestamp(now, 'A hora de retoma da sessão é inválida.')
  if (resumedAt < pausedAt) throw new Error('A retoma não pode ser anterior à pausa.')

  const pauseSeconds = Math.floor((resumedAt - pausedAt) / 1000)

  return {
    ...session,
    pausedAt: undefined,
    totalPausedSeconds: session.totalPausedSeconds + pauseSeconds,
    status: 'running',
    updatedAt: now,
  }
}

export function getFocusElapsedMs(session: FocusSession, now = new Date().toISOString()): number {
  const startedAt = Date.parse(session.startedAt)
  const reference = Date.parse(
    session.endedAt ?? (session.status === 'paused' && session.pausedAt ? session.pausedAt : now),
  )

  if (!Number.isFinite(startedAt) || !Number.isFinite(reference)) return 0

  return Math.max(0, reference - startedAt - session.totalPausedSeconds * 1000)
}

export function getFocusRemainingMs(session: FocusSession, now = new Date().toISOString()): number {
  return Math.max(0, session.plannedDurationSeconds * 1000 - getFocusElapsedMs(session, now))
}

export function completeFocusSession(session: FocusSession, now: string): FocusSession {
  if (session.status !== 'running' && session.status !== 'paused') {
    throw new Error('A sessão já está encerrada.')
  }

  let normalized = session
  if (session.status === 'paused') {
    normalized = resumeFocusSession(session, now)
  }

  parseTimestamp(now, 'A hora de fim da sessão é inválida.')

  return {
    ...normalized,
    endedAt: now,
    pausedAt: undefined,
    status: 'completed',
    updatedAt: now,
  }
}

export function cancelFocusSession(session: FocusSession, now: string): FocusSession {
  if (session.status !== 'running' && session.status !== 'paused') {
    throw new Error('A sessão já está encerrada.')
  }

  let totalPausedSeconds = session.totalPausedSeconds
  if (session.status === 'paused' && session.pausedAt) {
    const pausedAt = parseTimestamp(session.pausedAt, 'A hora de pausa da sessão é inválida.')
    const cancelledAt = parseTimestamp(now, 'A hora de cancelamento da sessão é inválida.')
    if (cancelledAt < pausedAt) throw new Error('O cancelamento não pode ser anterior à pausa.')
    totalPausedSeconds += Math.floor((cancelledAt - pausedAt) / 1000)
  } else {
    parseTimestamp(now, 'A hora de cancelamento da sessão é inválida.')
  }

  return {
    ...session,
    endedAt: now,
    pausedAt: undefined,
    totalPausedSeconds,
    status: 'cancelled',
    updatedAt: now,
  }
}

export function getNextPomodoroStep(session?: FocusSession): PomodoroStep {
  if (!session || session.mode !== 'pomodoro' || session.status !== 'completed') {
    return {
      segmentType: 'focus',
      cycle: 1,
      plannedDurationSeconds: POMODORO_FOCUS_SECONDS,
    }
  }

  if (session.segmentType === 'focus') {
    const segmentType = session.cycle === POMODORO_CYCLES ? 'long-break' : 'short-break'
    return {
      segmentType,
      cycle: session.cycle,
      plannedDurationSeconds: getPomodoroDurationSeconds(segmentType),
    }
  }

  const nextCycle = session.segmentType === 'long-break' ? 1 : Math.min(POMODORO_CYCLES, session.cycle + 1)
  return {
    segmentType: 'focus',
    cycle: nextCycle,
    plannedDurationSeconds: POMODORO_FOCUS_SECONDS,
  }
}
