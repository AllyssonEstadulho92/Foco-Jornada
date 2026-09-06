import { describe, expect, it } from 'vitest'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { FocusSession } from '../../domain/focus/FocusSession'
import type { Journey } from '../../domain/journey/Journey'
import { createNativeTimerSnapshot } from './createNativeTimerSnapshot'

function activeJourney(startedAt = '2026-09-06T08:00:00.000Z'): Journey {
  return {
    id: 'journey-1',
    date: '2026-09-06',
    startedAt,
    status: 'active',
    createdAt: startedAt,
    updatedAt: startedAt,
  }
}

function activeBreak(overrides: Partial<BreakRecord> = {}): BreakRecord {
  return {
    id: 'break-1',
    journeyId: 'journey-1',
    type: 'short',
    plannedDurationMinutes: 15,
    startedAt: '2026-09-06T10:00:00.000Z',
    status: 'active',
    ...overrides,
  }
}

function runningFocus(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'focus-1',
    journeyId: 'journey-1',
    mode: 'pomodoro',
    segmentType: 'focus',
    plannedDurationSeconds: 25 * 60,
    startedAt: '2026-09-06T11:00:00.000Z',
    totalPausedSeconds: 0,
    status: 'running',
    cycle: 1,
    createdAt: '2026-09-06T11:00:00.000Z',
    updatedAt: '2026-09-06T11:00:00.000Z',
    ...overrides,
  }
}

describe('createNativeTimerSnapshot', () => {
  it('mantém a jornada baseada no startedAt persistido', () => {
    expect(createNativeTimerSnapshot({ activeJourney: activeJourney() })).toEqual({
      version: 1,
      command: 'sync',
      journey: {
        id: 'journey-1',
        startedAt: '2026-09-06T08:00:00.000Z',
      },
      phase: null,
    })
  })

  it('calcula o deadline de uma pausa apenas quando existe duração planeada', () => {
    const snapshot = createNativeTimerSnapshot({
      activeJourney: activeJourney(),
      activeBreak: activeBreak(),
    })

    expect(snapshot.phase).toMatchObject({
      kind: 'break',
      id: 'break-1',
      state: 'running',
      startedAt: '2026-09-06T10:00:00.000Z',
      deadlineAt: '2026-09-06T10:15:00.000Z',
    })

    const withoutPlan = createNativeTimerSnapshot({
      activeJourney: activeJourney(),
      activeBreak: activeBreak({ plannedDurationMinutes: undefined }),
    })
    expect(withoutPlan.phase).not.toHaveProperty('deadlineAt')
  })

  it('inclui pausas acumuladas no deadline do foco em execução', () => {
    const snapshot = createNativeTimerSnapshot({
      activeJourney: activeJourney(),
      activeFocus: runningFocus({ totalPausedSeconds: 120 }),
    })

    expect(snapshot.phase).toMatchObject({
      kind: 'focus',
      title: 'Pomodoro · Foco',
      state: 'running',
      deadlineAt: '2026-09-06T11:27:00.000Z',
    })
  })

  it('preserva o tempo restante quando o foco está pausado sem criar deadline móvel', () => {
    const snapshot = createNativeTimerSnapshot({
      activeJourney: activeJourney(),
      activeFocus: runningFocus({
        status: 'paused',
        pausedAt: '2026-09-06T11:10:00.000Z',
        totalPausedSeconds: 60,
      }),
    })

    expect(snapshot.phase).toMatchObject({
      kind: 'focus',
      state: 'paused',
      remainingSeconds: 960,
    })
    expect(snapshot.phase).not.toHaveProperty('deadlineAt')
  })

  it('dá prioridade à pausa ativa quando existe também uma sessão de foco aberta', () => {
    const snapshot = createNativeTimerSnapshot({
      activeJourney: activeJourney(),
      activeBreak: activeBreak(),
      activeFocus: runningFocus({ status: 'paused', pausedAt: '2026-09-06T10:00:00.000Z' }),
    })

    expect(snapshot.phase?.kind).toBe('break')
  })

  it('não envia timestamps inválidos para o lado nativo', () => {
    const snapshot = createNativeTimerSnapshot({
      activeJourney: activeJourney('inválido'),
      activeFocus: runningFocus({ startedAt: 'inválido' }),
    })

    expect(snapshot.journey).toBeNull()
    expect(snapshot.phase).toBeNull()
  })
})
