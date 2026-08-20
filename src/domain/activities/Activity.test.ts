import { describe, expect, it } from 'vitest'
import {
  cancelActivityRecord,
  completeActivityRecord,
  createActivity,
  editActivity,
  getActivityDurationMs,
  startActivityRecord,
} from './Activity'

describe('Activity', () => {
  it('cria, edita, inicia e conclui uma atividade', () => {
    const created = createActivity({
      id: 'activity-1',
      journeyId: 'journey-1',
      name: '  Atendimento  ',
      description: '  Chamadas  ',
      now: '2026-08-20T08:00:00.000Z',
    })

    expect(created.name).toBe('Atendimento')
    expect(created.status).toBe('pending')

    const edited = editActivity(
      created,
      'Atendimento técnico',
      'Chamadas e registos',
      '2026-08-20T08:05:00.000Z',
    )
    const active = startActivityRecord(edited, '2026-08-20T09:00:00.000Z')
    const completed = completeActivityRecord(active, '2026-08-20T10:30:00.000Z')

    expect(completed.status).toBe('completed')
    expect(getActivityDurationMs(completed)).toBe(90 * 60 * 1000)
  })

  it('cancela uma atividade ativa preservando a duração realizada', () => {
    const activity = startActivityRecord(
      createActivity({
        id: 'activity-1',
        journeyId: 'journey-1',
        name: 'Formação',
        now: '2026-08-20T08:00:00.000Z',
      }),
      '2026-08-20T09:00:00.000Z',
    )

    const cancelled = cancelActivityRecord(activity, '2026-08-20T09:25:00.000Z')

    expect(cancelled.status).toBe('cancelled')
    expect(getActivityDurationMs(cancelled)).toBe(25 * 60 * 1000)
  })

  it('rejeita nome vazio', () => {
    expect(() =>
      createActivity({
        id: 'activity-1',
        journeyId: 'journey-1',
        name: '   ',
        now: '2026-08-20T08:00:00.000Z',
      }),
    ).toThrow('obrigatório')
  })
})
