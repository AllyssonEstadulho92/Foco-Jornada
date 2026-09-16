import { describe, expect, it } from 'vitest'
import vacationAccrualCss from './vacation-accrual.css?raw'

describe('contenção e hierarquia dos cartões mensais de férias', () => {
  it('mantém o cabeçalho dentro do cartão com grelha responsiva', () => {
    expect(vacationAccrualCss).toContain('.vacationMonthCard > div:first-child')
    expect(vacationAccrualCss).toContain('grid-template-columns: minmax(0, 1fr) auto')
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
    expect(vacationAccrualCss).toContain('overflow: hidden')
  })

  it('usa grelha auto-fit para evitar cartões comprimidos', () => {
    expect(vacationAccrualCss).toContain('repeat(auto-fit, minmax(min(100%, 15rem), 1fr))')
    expect(vacationAccrualCss).toContain('repeat(auto-fit, minmax(min(100%, 13rem), 1fr))')
  })

  it('distingue visualmente o mês atual sem alterar o conteúdo', () => {
    expect(vacationAccrualCss).toContain('.vacationMonthCurrent::before')
    expect(vacationAccrualCss).toContain('.vacationMonthCurrent > strong')
    expect(vacationAccrualCss).toContain('.vacationMonthCompleted::before')
  })

  it('passa para uma coluna em ecrãs estreitos sem truncar o estado do mês', () => {
    expect(vacationAccrualCss).toContain('@media (max-width: 560px)')
    expect(vacationAccrualCss).toContain('grid-template-columns: 1fr')
    expect(vacationAccrualCss).not.toContain('text-overflow: ellipsis')
  })
})
