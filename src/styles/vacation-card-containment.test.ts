import { describe, expect, it } from 'vitest'
import vacationAccrualCss from './vacation-accrual.css?raw'

describe('contenção dos cartões mensais de férias', () => {
  it('permite que o cabeçalho do cartão quebre linha sem sair da secção', () => {
    expect(vacationAccrualCss).toContain('.vacationMonthCard > div:first-child')
    expect(vacationAccrualCss).toContain('flex-wrap: wrap')
    expect(vacationAccrualCss).toContain('.vacationMonthState')
    expect(vacationAccrualCss).toContain('white-space: normal')
    expect(vacationAccrualCss).toContain('overflow-wrap: anywhere')
  })

  it('mantém valores, descrições e barras limitados à largura do cartão', () => {
    expect(vacationAccrualCss).toContain('.vacationMonthCard > strong')
    expect(vacationAccrualCss).toContain('.vacationMonthCard small')
    expect(vacationAccrualCss).toContain('.vacationMonthProgressTrack')
    expect(vacationAccrualCss).toContain('max-width: 100%')
    expect(vacationAccrualCss).toContain('min-width: 0')
  })

  it('passa para uma coluna em ecrãs estreitos sem truncar o estado do mês', () => {
    expect(vacationAccrualCss).toContain('@media (max-width: 520px)')
    expect(vacationAccrualCss).toContain('grid-template-columns: 1fr')
    expect(vacationAccrualCss).not.toContain('text-overflow: ellipsis')
  })
})
