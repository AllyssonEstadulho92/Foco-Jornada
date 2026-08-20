import { describe, expect, it } from 'vitest'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { finishJourney } from './finishJourney'
import { startJourney } from './startJourney'

describe('casos de uso de Jornada', () => {
  it('inicia uma jornada e impede uma segunda jornada ativa', async () => {
    const repository = new InMemoryJourneyRepository()
    const firstNow = new Date('2026-08-20T08:00:00.000Z')

    const first = await startJourney({
      repository,
      now: () => firstNow,
      createId: () => 'journey-1',
    })

    const second = await startJourney({
      repository,
      now: () => new Date('2026-08-20T08:01:00.000Z'),
      createId: () => 'journey-2',
    })

    expect(first.status).toBe('started')
    expect(second.status).toBe('already-active')
    expect(repository.snapshot()).toHaveLength(1)
    expect(repository.snapshot()[0]?.id).toBe('journey-1')
  })

  it('termina a jornada ativa e permite iniciar outra depois', async () => {
    const repository = new InMemoryJourneyRepository()

    await startJourney({
      repository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    const result = await finishJourney({
      repository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T16:00:00.000Z'),
    })

    expect(result.status).toBe('finished')
    expect(await repository.getActive()).toBeUndefined()

    const next = await startJourney({
      repository,
      now: () => new Date('2026-08-20T16:05:00.000Z'),
      createId: () => 'journey-2',
    })

    expect(next.status).toBe('started')
    expect(repository.snapshot()).toHaveLength(2)
  })
})
