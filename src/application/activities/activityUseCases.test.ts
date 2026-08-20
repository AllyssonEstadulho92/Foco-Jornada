import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { startJourney } from '../journey/startJourney'
import { cancelActivity } from './cancelActivity'
import { completeActivity } from './completeActivity'
import { createActivity } from './createActivity'
import { editActivity } from './editActivity'
import { startActivity } from './startActivity'

describe('casos de uso de Atividades', () => {
  it('não cria atividade sem jornada ativa', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const activityRepository = new InMemoryActivityRepository()

    const result = await createActivity({
      journeyRepository,
      activityRepository,
      name: 'Atendimento',
      createId: () => 'activity-1',
    })

    expect(result.status).toBe('no-active-journey')
    expect(activityRepository.snapshot()).toHaveLength(0)
  })

  it('permite apenas uma atividade ativa por jornada', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const activityRepository = new InMemoryActivityRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    await createActivity({
      journeyRepository,
      activityRepository,
      name: 'Atividade A',
      now: () => new Date('2026-08-20T08:01:00.000Z'),
      createId: () => 'activity-1',
    })
    await createActivity({
      journeyRepository,
      activityRepository,
      name: 'Atividade B',
      now: () => new Date('2026-08-20T08:02:00.000Z'),
      createId: () => 'activity-2',
    })

    const first = await startActivity({
      journeyRepository,
      activityRepository,
      activityId: 'activity-1',
      now: () => new Date('2026-08-20T09:00:00.000Z'),
    })
    const second = await startActivity({
      journeyRepository,
      activityRepository,
      activityId: 'activity-2',
      now: () => new Date('2026-08-20T09:01:00.000Z'),
    })

    expect(first.status).toBe('started')
    expect(second.status).toBe('another-active')
    expect(activityRepository.snapshot().filter((activity) => activity.status === 'active')).toHaveLength(1)
  })

  it('permite editar uma atividade aberta e cancelar uma atividade pendente', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const activityRepository = new InMemoryActivityRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })
    await createActivity({
      journeyRepository,
      activityRepository,
      name: 'Nome inicial',
      createId: () => 'activity-1',
    })

    const edited = await editActivity({
      activityRepository,
      activityId: 'activity-1',
      name: 'Nome final',
      description: 'Descrição',
    })
    const cancelled = await cancelActivity({
      activityRepository,
      activityId: 'activity-1',
    })

    expect(edited.status).toBe('updated')
    expect(cancelled.status).toBe('cancelled')
    expect((await activityRepository.getById('activity-1'))?.name).toBe('Nome final')
  })

  it('permite iniciar outra atividade depois de concluir a atual', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const activityRepository = new InMemoryActivityRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    for (const [id, name] of [
      ['activity-1', 'A'],
      ['activity-2', 'B'],
    ] as const) {
      await createActivity({
        journeyRepository,
        activityRepository,
        name,
        createId: () => id,
      })
    }

    await startActivity({ journeyRepository, activityRepository, activityId: 'activity-1' })
    const completed = await completeActivity({ activityRepository, activityId: 'activity-1' })
    const next = await startActivity({ journeyRepository, activityRepository, activityId: 'activity-2' })

    expect(completed.status).toBe('completed')
    expect(next.status).toBe('started')
  })
})
