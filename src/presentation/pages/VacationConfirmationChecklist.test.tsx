import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VacationConfirmationChecklist } from './VacationConfirmationChecklist'

describe('VacationConfirmationChecklist', () => {
  it('começa por confirmar e não interpreta os vistos como aprovação externa', () => {
    render(<VacationConfirmationChecklist periodLabel="5 a 16 jul de 2027" />)
    const partner = screen.getByRole('checkbox', { name: /parceira/i })
    const employer = screen.getByRole('checkbox', { name: /entidade empregadora/i })
    expect(partner).not.toBeChecked()
    expect(employer).not.toBeChecked()
    expect(screen.getByText('0 de 2 assinaladas')).toBeInTheDocument()
    expect(screen.getByText(/não representam aprovação e não são guardados/i)).toBeInTheDocument()

    fireEvent.click(partner)
    fireEvent.click(employer)
    expect(screen.getByText('2 de 2 assinaladas')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/não é enviado qualquer pedido à empresa/i)
  })

  it('limpa ambas as assinalações quando muda a identidade do cenário', () => {
    const { rerender } = render(
      <VacationConfirmationChecklist key="periodo-a" periodLabel="5 a 16 jul de 2027" />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /parceira/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /entidade empregadora/i }))
    expect(screen.getByText('2 de 2 assinaladas')).toBeInTheDocument()

    rerender(<VacationConfirmationChecklist key="periodo-b" periodLabel="12 a 23 jul de 2027" />)
    expect(screen.getByRole('checkbox', { name: /parceira/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /entidade empregadora/i })).not.toBeChecked()
    expect(screen.getByText('0 de 2 assinaladas')).toBeInTheDocument()
    expect(screen.getByText(/12 a 23 jul de 2027/i)).toBeInTheDocument()
  })
})
