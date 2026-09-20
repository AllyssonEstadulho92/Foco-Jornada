import { describe, expect, it } from 'vitest'
import { calculateVacationBalance, defaultVacationTrackerSettings } from './VacationBalance'
import { collectVacationDatesForYear, collectVacationEvidenceForYear, type VacationEvidenceReadIssue } from './VacationYearRecords'

describe('collectVacationDatesForYear e proveniência', () => {
  it('reutiliza horas, turnos e plano existentes sem duplicar datas nem fontes', () => {
    const records: Record<string, string> = {
      'foco-jornada-shift-map-v1-2027-07': JSON.stringify([
        { date: '2027-07-12', kind: 'vacation' }, { date: '2027-07-12', kind: 'vacation' },
        { date: '2027-07-13', kind: 'work' },
      ]),
      'foco-jornada-payroll-plan-v1-2027-07': JSON.stringify([
        { date: '2027-07-12', kind: 'vacation' }, { date: '2027-07-17', kind: 'vacation' },
      ]),
    }
    const entries = [
      { date: '2027-07-05', reason: 'ferias' },
      { date: '2027-07-12', reason: 'ferias' },
      { date: '2026-07-05', reason: 'ferias' },
    ]
    const read = (key: string) => records[key] ?? null
    expect(collectVacationEvidenceForYear(2027, entries, read)).toEqual([
      { date: '2027-07-05', sources: ['horas'] },
      { date: '2027-07-12', sources: ['horas', 'turnos', 'plano'] },
      { date: '2027-07-17', sources: ['plano'] },
    ])
    const dates = collectVacationDatesForYear(2027, entries, read)
    expect(dates).toEqual(['2027-07-05', '2027-07-12', '2027-07-17'])
    const balance = calculateVacationBalance({
      ...defaultVacationTrackerSettings,
      asOfDate: '2027-07-13',
      recordedVacationDates: dates,
    })
    expect(balance.recordedTakenDays).toBe(2)
    expect(balance.recordedPlannedDays).toBe(0)
    expect(balance.recordedIgnoredWeekendDays).toBe(1)
  })

  it('não inventa férias quando fontes estão indisponíveis ou datas são inválidas', () => {
    expect(collectVacationDatesForYear(2027, [], () => '{')).toEqual([])
    expect(collectVacationDatesForYear(2027, [], () => { throw new Error('cofre bloqueado') })).toEqual([])
    expect(collectVacationDatesForYear(0, [], () => null)).toEqual([])
    const records: Record<string, string> = {
      'foco-jornada-shift-map-v1-2027-02': JSON.stringify([
        { date: '2027-02-30', kind: 'vacation' },
        { date: '2027-03-01', kind: 'vacation' },
        { date: '2027-02-28', kind: 'vacation' },
      ]),
    }
    expect(collectVacationDatesForYear(2027, [], (key) => records[key] ?? null))
      .toEqual(['2027-02-28', '2027-03-01'])
  })

  it('assinala separadamente dados inválidos e falhas de leitura, sem apagar dias de outras fontes', () => {
    const issues: VacationEvidenceReadIssue[] = []
    const read = (key: string) => {
      if (key === 'foco-jornada-shift-map-v1-2027-02') return '{'
      if (key === 'foco-jornada-payroll-plan-v1-2027-03') return JSON.stringify({ date: '2027-03-01' })
      if (key === 'foco-jornada-shift-map-v1-2027-04') throw new Error('cofre temporariamente inacessível')
      if (key === 'foco-jornada-payroll-plan-v1-2027-05') return JSON.stringify([
        { date: '2027-05-03', kind: 'vacation' },
      ])
      return null
    }
    const evidence = collectVacationEvidenceForYear(2027, [
      { date: '2027-05-03', reason: 'ferias' },
      { date: '2027-05-04', reason: 'ferias' },
    ], read, issues)
    expect(evidence).toEqual([
      { date: '2027-05-03', sources: ['horas', 'plano'] },
      { date: '2027-05-04', sources: ['horas'] },
    ])
    expect(issues).toEqual([
      { source: 'turnos', month: '2027-02', reason: 'invalid-format' },
      { source: 'plano', month: '2027-03', reason: 'invalid-format' },
      { source: 'turnos', month: '2027-04', reason: 'unavailable' },
    ])
    expect(collectVacationDatesForYear(2027, [], () => null)).toEqual([])
  })
})
