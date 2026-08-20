import { describe, expect, it } from 'vitest'
import { createBreakRecord, finishBreakRecord } from '../../domain/breaks/BreakRecord'
import { createJourney } from '../../domain/journey/Journey'
import { getEffectiveJourneyDurationMs } from './getEffectiveJourneyDuration'

describe('getEffectiveJourneyDurationMs', () => {
  it('desconta pausas concluídas do tempo total da jornada', () => {
    const journey = createJourney({
      id: 'journey-1',
      date: '2026-08-20',
      now: '2026-08-20T08:00:00.000Z',
    })
    const breakRecord = finishBreakRecord(
      createBreakRecord({
        id: 'break-1',
        journeyId: journey.id,
        type: 'short',
        plannedDurationMinutes: 15,
        now: '2026-08-20T10:00:00.000Z',
      }),
      '2026-08-20T10:15:00.000Z',
    )

    const effective = getEffectiveJourneyDurationMs(
      journey,
      [breakRecord],
      '2026-08-20T12:00:00.000Z',
    )

    expect(effective).toBe(3 * 60 * 60 * 1000 + 45 * 60 * 1000)
  })

  it('desconta uma pausa que ainda está ativa até ao instante atual', () => {
    const journey = createJourney({
      id: 'journey-1',
      date: '2026-08-20',
      now: '2026-08-20T08:00:00.000Z',
    })
    const activeBreak = createBreakRecord({
      id: 'break-1',
      journeyId: journey.id,
      type: 'long',
      plannedDurationMinutes: 60,
      now: '2026-08-20T11:30:00.000Z',
    })

    const effective = getEffectiveJourneyDurationMs(
      journey,
      [activeBreak],
      '2026-08-20T12:00:00.000Z',
    )

    expect(effective).toBe(3.5 * 60 * 60 * 1000)
  })
})
