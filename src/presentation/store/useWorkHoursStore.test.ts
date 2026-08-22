import { beforeEach, describe, expect, it } from 'vitest'
import type { WorkHoursEntryInput } from '../../domain/work-hours/WorkHours'
import { useWorkHoursStore } from './useWorkHoursStore'

const input: WorkHoursEntryInput = {
  date: '2026-08-21',
  plannedStart: '08:00',
  plannedEnd: '17:00',
  plannedBreakMinutes: 15,
  plannedBreaks: [{ start: '12:00', end: '12:15' }],
  actualStart: '08:00',
  actualEnd: '17:00',
  actualBreakMinutes: 15,
  actualBreaks: [{ start: '12:00', end: '12:15' }],
  reason: 'normal',
  payTreatment: 'apenas_registo',
  source: 'manual',
}

describe('useWorkHoursStore', () => {
  beforeEach(() => {
    useWorkHoursStore.setState({ entries: [] })
  })

  it('edita um registo mantendo o id e a data de criação', () => {
    const created = useWorkHoursStore.getState().add(input)

    useWorkHoursStore.getState().update(created.id, {
      ...input,
      actualEnd: '16:30',
      notes: 'Saída antecipada.',
    })

    const updated = useWorkHoursStore.getState().entries[0]
    expect(updated.id).toBe(created.id)
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.actualEnd).toBe('16:30')
    expect(updated.notes).toBe('Saída antecipada.')
  })

  it('substitui o apuramento anterior quando a mesma data é guardada novamente', () => {
    useWorkHoursStore.getState().add(input)
    useWorkHoursStore.getState().add({
      ...input,
      actualEnd: '16:00',
      notes: 'Apuramento corrigido.',
    })

    const entries = useWorkHoursStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].date).toBe(input.date)
    expect(entries[0].actualEnd).toBe('16:00')
    expect(entries[0].notes).toBe('Apuramento corrigido.')
  })
})
