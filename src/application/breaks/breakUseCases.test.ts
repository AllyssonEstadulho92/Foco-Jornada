import { describe, expect, it } from 'vitest'
import { startJourney } from '../journey/startJourney'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { finishBreak } from './finishBreak'
import { startBreak } from './startBreak'

describe('casos de uso de Pausas', () => {
  it('não inicia pausa sem uma jornada ativa', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()

    const result = await startBreak({
      journeyRepository,
      breakRepository,
      type: 'short',
      plannedDurationMinutes: 15,
      createId: () => 'break-1',
    })

    expect(result.status).toBe('no-active-journey')
    expect(breakRepository.snapshot()).toHaveLength(0)
  })

  it('inicia uma pausa e impede uma segunda pausa ativa na mesma jornada', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    const first = await startBreak({
      journeyRepository,
      breakRepository,
      type: 'short',
      plannedDurationMinutes: 15,
      now: () => new Date('2026-08-20T10:00:00.000Z'),
      createId: () => 'break-1',
    })

    const second = await startBreak({
      journeyRepository,
      breakRepository,
      type: 'long',
      plannedDurationMinutes: 60,
      now: () => new Date('2026-08-20T10:01:00.000Z'),
      createId: () => 'break-2',
    })

    expect(first.status).toBe('started')
    expect(second.status).toBe('already-active')
    expect(breakRepository.snapshot()).toHaveLength(1)
  })

  it('termina uma pausa e persiste a duração real', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    await startBreak({
      journeyRepository,
      breakRepository,
      type: 'custom',
      plannedDurationMinutes: 20,
      now: () => new Date('2026-08-20T10:00:00.000Z'),
      createId: () => 'break-1',
    })

    const result = await finishBreak({
      breakRepository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T10:20:30.000Z'),
    })

    expect(result.status).toBe('finished')
    if (result.status === 'finished') {
      expect(result.breakRecord.actualDurationSeconds).toBe(1230)
    }
    expect(await breakRepository.getActiveForJourney('journey-1')).toBeUndefined()
  })
})
