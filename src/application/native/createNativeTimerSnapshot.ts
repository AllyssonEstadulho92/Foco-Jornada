import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { FocusSession } from '../../domain/focus/FocusSession'
import { getFocusRemainingMs } from '../../domain/focus/FocusSession'
import type { Journey } from '../../domain/journey/Journey'

export type NativeTimerPhaseKind = 'break' | 'focus'
export type NativeTimerPhaseState = 'running' | 'paused'

export interface NativeTimerJourneySnapshot {
  id: string
  startedAt: string
}

export interface NativeTimerPhaseSnapshot {
  kind: NativeTimerPhaseKind
  id: string
  title: string
  subtitle?: string
  startedAt: string
  deadlineAt?: string
  remainingSeconds?: number
  state: NativeTimerPhaseState
}

export interface NativeTimerSnapshot {
  version: 1
  command: 'sync'
  journey: NativeTimerJourneySnapshot | null
  phase: NativeTimerPhaseSnapshot | null
}

export interface CreateNativeTimerSnapshotInput {
  activeJourney?: Journey | null
  activeBreak?: BreakRecord | null
  activeFocus?: FocusSession | null
}

function toIsoTimestamp(timestamp: string): string | null {
  const value = Date.parse(timestamp)
  if (!Number.isFinite(value)) return null
  return new Date(value).toISOString()
}

function createJourneySnapshot(journey?: Journey | null): NativeTimerJourneySnapshot | null {
  if (!journey || journey.status !== 'active') return null
  const startedAt = toIsoTimestamp(journey.startedAt)
  if (!startedAt) return null

  return {
    id: journey.id,
    startedAt,
  }
}

function createBreakSnapshot(record?: BreakRecord | null): NativeTimerPhaseSnapshot | null {
  if (!record || record.status !== 'active') return null
  const startedAt = toIsoTimestamp(record.startedAt)
  if (!startedAt) return null

  const phase: NativeTimerPhaseSnapshot = {
    kind: 'break',
    id: record.id,
    title: 'Pausa da jornada',
    subtitle: record.plannedDurationMinutes
      ? `${record.plannedDurationMinutes} min planeados`
      : 'Sem duração definida',
    startedAt,
    state: 'running',
  }

  if (record.plannedDurationMinutes && Number.isFinite(record.plannedDurationMinutes) && record.plannedDurationMinutes > 0) {
    const deadlineMs = Date.parse(startedAt) + record.plannedDurationMinutes * 60 * 1000
    phase.deadlineAt = new Date(deadlineMs).toISOString()
  }

  return phase
}

function focusTitle(session: FocusSession): string {
  if (session.segmentType === 'short-break') return 'Pomodoro · Pausa'
  if (session.segmentType === 'long-break') return 'Pomodoro · Pausa longa'
  return session.mode === 'pomodoro' ? 'Pomodoro · Foco' : 'Foco'
}

function createFocusSnapshot(session?: FocusSession | null): NativeTimerPhaseSnapshot | null {
  if (!session || (session.status !== 'running' && session.status !== 'paused')) return null
  const startedAt = toIsoTimestamp(session.startedAt)
  if (!startedAt) return null

  const phase: NativeTimerPhaseSnapshot = {
    kind: 'focus',
    id: session.id,
    title: focusTitle(session),
    subtitle: session.activityId ? 'Atividade em foco' : undefined,
    startedAt,
    state: session.status,
  }

  if (session.status === 'paused') {
    const pausedAt = session.pausedAt ? toIsoTimestamp(session.pausedAt) : null
    if (pausedAt) {
      phase.remainingSeconds = Math.max(0, Math.ceil(getFocusRemainingMs(session, pausedAt) / 1000))
    }
    return phase
  }

  const deadlineMs = Date.parse(startedAt)
    + session.plannedDurationSeconds * 1000
    + session.totalPausedSeconds * 1000
  if (Number.isFinite(deadlineMs)) phase.deadlineAt = new Date(deadlineMs).toISOString()

  return phase
}

export function createNativeTimerSnapshot({
  activeJourney,
  activeBreak,
  activeFocus,
}: CreateNativeTimerSnapshotInput): NativeTimerSnapshot {
  return {
    version: 1,
    command: 'sync',
    journey: createJourneySnapshot(activeJourney),
    phase: createBreakSnapshot(activeBreak) ?? createFocusSnapshot(activeFocus),
  }
}
