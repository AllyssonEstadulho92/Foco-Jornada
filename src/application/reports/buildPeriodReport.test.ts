import { describe, expect, it } from 'vitest'
import { listDateKeys, resolvePeriod } from './buildPeriodReport'

describe('buildPeriodReport helpers', () => {
  it('resolve a semana de segunda a domingo', () => {
    expect(resolvePeriod('week', '2026-08-31')).toEqual({
      startDate: '2026-08-31',
      endDate: '2026-09-06',
    })
  })

  it('resolve corretamente um mês completo', () => {
    expect(resolvePeriod('month', '2026-02-10')).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
  })

  it('lista todas as datas sem saltos', () => {
    expect(listDateKeys('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ])
  })

  it('recusa intervalos invertidos', () => {
    expect(() => listDateKeys('2026-09-02', '2026-09-01')).toThrow()
  })
})
