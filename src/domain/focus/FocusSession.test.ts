import { describe, expect, it } from 'vitest'
import {
  completeFocusSession,
  createFocusSession,
  getFocusElapsedMs,
  getFocusRemainingMs,
  getNextPomodoroStep,
  pauseFocusSession,
  resumeFocusSession,
} from './FocusSession'

describe('FocusSession', () => {
  it('mantém o timer estável durante uma pausa e desconta o tempo pausado após retoma', () => {
    const session = createFocusSession({
      id: 'focus-1',
      journeyId: 'journey-1',
      mode: 'custom',
      segmentType: 'focus',
      plannedDurationSeconds: 600,
      cycle: 1,
      now: '2026-08-20T08:00:00.000Z',
    })

    const paused = pauseFocusSession(session, '2026-08-20T08:02:00.000Z')
    expect(getFocusElapsedMs(paused, '2026-08-20T08:10:00.000Z')).toBe(120_000)

    const resumed = resumeFocusSession(paused, '2026-08-20T08:07:00.000Z')
    expect(getFocusElapsedMs(resumed, '2026-08-20T08:09:00.000Z')).toBe(240_000)
    expect(getFocusRemainingMs(resumed, '2026-08-20T08:09:00.000Z')).toBe(360_000)
  })

  it('avança pelos segmentos Pomodoro e reinicia depois da pausa longa', () => {
    const focus = createFocusSession({
      id: 'focus-4',
      journeyId: 'journey-1',
      mode: 'pomodoro',
      segmentType: 'focus',
      plannedDurationSeconds: 1500,
      cycle: 4,
      now: '2026-08-20T08:00:00.000Z',
    })
    const completedFocus = completeFocusSession(focus, '2026-08-20T08:25:00.000Z')
    const longBreak = getNextPomodoroStep(completedFocus)

    expect(longBreak.segmentType).toBe('long-break')
    expect(longBreak.cycle).toBe(4)

    const breakSession = completeFocusSession(
      createFocusSession({
        id: 'break-4',
        journeyId: 'journey-1',
        mode: 'pomodoro',
        segmentType: 'long-break',
        plannedDurationSeconds: 900,
        cycle: 4,
        now: '2026-08-20T08:25:00.000Z',
      }),
      '2026-08-20T08:40:00.000Z',
    )

    expect(getNextPomodoroStep(breakSession)).toMatchObject({ segmentType: 'focus', cycle: 1 })
  })
})
