import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { VacationMonthlyAccrualMonth } from '../../domain/vacation/VacationBalance'
import { VacationMonthlyVisualization } from './VacationMonthlyVisualization'

afterEach(cleanup)

const schedule: VacationMonthlyAccrualMonth[] = [
  { month: 1, monthEndDate: '2026-01-31', cumulativeDays: 2.33, completed: true, current: false, progress: 1, progressPercent: 100, earnedDays: 2.33, remainingDays: 0, liveCumulativeDays: 2.33 },
  { month: 2, monthEndDate: '2026-02-28', cumulativeDays: 4.67, completed: false, current: true, progress: .5, progressPercent: 50, earnedDays: 1.17, remainingDays: 1.17, liveCumulativeDays: 3.5 },
  { month: 3, monthEndDate: '2026-03-31', cumulativeDays: 7, completed: false, current: false, progress: 0, progressPercent: 0, earnedDays: 0, remainingDays: 2.33, liveCumulativeDays: 4.67 },
]

function view() {
  return render(<VacationMonthlyVisualization schedule={schedule} targetDays={28}
    formatDate={(date) => date} daysLabel={(value) => `${value} dias`}
    preciseDaysLabel={(value) => `${value.toFixed(4)} dias`} monthLabel={(month) => ['janeiro', 'fevereiro', 'março'][month - 1]} />)
}

describe('gráfico e tabela de férias', () => {
  it('mostra os valores do domínio, incluindo o mês atual sem arredondar previamente', () => {
    const { container } = view()
    expect(screen.getByRole('button', { name: 'Gráfico' })).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelectorAll('.vacationMonthlyBar')).toHaveLength(3)
    expect(screen.getByText('3.5000 dias')).toBeInTheDocument()
    expect(screen.getByText('7 dias')).toBeInTheDocument()
    expect(container.querySelector('.isCurrent .vacationMonthlyBarTrack > span')).toHaveStyle('--vacation-bar-height: 12.5%')
  })

  it('alterna para tabela acessível e regressa ao gráfico, sem ações de gravação', () => {
    view()
    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }))
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute('aria-pressed', 'true')
    const table = screen.getByRole('table', { name: 'Acumulação da meta pessoal, por mês' })
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(within(table).getByRole('rowheader', { name: 'fevereiro' })).toBeInTheDocument()
    expect(within(table).getByText('3.5000 dias')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar|submeter|aprovar/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gráfico' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
