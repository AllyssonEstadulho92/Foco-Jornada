import { describe, expect, it } from 'vitest'
import { dueDeadlines, validateDeadline, type DeadlineNotification } from './deadlineNotifications'

const deadline = (id: string, at: string): DeadlineNotification => ({
  id,
  deadlineAt: at,
  title: 'Tempo concluído',
  detail: 'Detalhe',
})

describe('deadlineNotifications', () => {
  it('normaliza um deadline válido para ISO absoluto', () => {
    expect(validateDeadline(deadline('focus:1', '2026-08-30T10:00:00+02:00'))).toMatchObject({
      id: 'focus:1',
      deadlineAt: '2026-08-30T08:00:00.000Z',
      title: 'Tempo concluído',
      tone: 'info',
    })
  })

  it('rejeita timestamps inválidos em vez de inventar uma hora', () => {
    expect(validateDeadline(deadline('focus:1', 'hora-desconhecida'))).toBeNull()
  })

  it('considera devido exatamente no timestamp e nunca antes', () => {
    const item = deadline('pomodoro:1', '2026-08-30T08:25:00.000Z')
    expect(dueDeadlines([item], new Date('2026-08-30T08:24:59.999Z'))).toHaveLength(0)
    expect(dueDeadlines([item], new Date('2026-08-30T08:25:00.000Z'))).toHaveLength(1)
  })

  it('não volta a entregar um deadline já marcado como entregue', () => {
    const item = deadline('break:1', '2026-08-30T08:15:00.000Z')
    expect(
      dueDeadlines(
        [item],
        new Date('2026-08-30T08:16:00.000Z'),
        { 'break:1': Date.parse('2026-08-30T08:15:00.000Z') },
      ),
    ).toHaveLength(0)
  })

  it('ordena vários prazos vencidos pela hora real em que terminaram', () => {
    const due = dueDeadlines(
      [
        deadline('second', '2026-08-30T08:20:00.000Z'),
        deadline('first', '2026-08-30T08:10:00.000Z'),
      ],
      new Date('2026-08-30T08:30:00.000Z'),
    )
    expect(due.map((item) => item.id)).toEqual(['first', 'second'])
  })
})
