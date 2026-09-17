import { describe, expect, it } from 'vitest'
import { collectVacationDatesForYear } from './VacationYearRecords'

describe('collectVacationDatesForYear', () => {
  it('reutiliza horas, turnos e plano existentes sem duplicar datas', () => {
    const records: Record<string, string> = {
      'foco-jornada-shift-map-v1-2027-07': JSON.stringify([
        { date: '2027-07-12', kind: 'vacation' }, { date: '2027-07-12', kind: 'vacation' },
        { date: '2027-07-13', kind: 'work' },
      ]),
      'foco-jornada-payroll-plan-v1-2027-07': JSON.stringify([{ date: '2027-07-12', kind: 'vacation' }]),
    }
    expect(collectVacationDatesForYear(2027, [
      { date: '2027-07-05', reason: 'ferias' },
      { date: '2026-07-05', reason: 'ferias' },
    ], (key) => records[key] ?? null)).toEqual(['2027-07-05', '2027-07-12'])
  })

  it('não inventa férias quando fontes estão indisponíveis ou inválidas', () => {
    expect(collectVacationDatesForYear(2027, [], () => '{')).toEqual([])
    expect(collectVacationDatesForYear(2027, [], () => { throw new Error('cofre bloqueado') })).toEqual([])
    expect(collectVacationDatesForYear(0, [], () => null)).toEqual([])
  })
})
