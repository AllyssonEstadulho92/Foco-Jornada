import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryCoffeeRepository } from '../../test/InMemoryCoffeeRepository'
import { InMemoryFocusRepository } from '../../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../../test/InMemorySettingsRepository'
import { AppServicesProvider } from '../providers/AppServicesProvider'
import { ShiftMapPage } from './ShiftMapPage'

function renderMap() {
  return render(
    <AppServicesProvider
      services={{
        journeyRepository: new InMemoryJourneyRepository(),
        breakRepository: new InMemoryBreakRepository(),
        activityRepository: new InMemoryActivityRepository(),
        focusRepository: new InMemoryFocusRepository(),
        coffeeRepository: new InMemoryCoffeeRepository(),
        settingsRepository: new InMemorySettingsRepository(),
      }}
    >
      <MemoryRouter>
        <ShiftMapPage />
      </MemoryRouter>
    </AppServicesProvider>,
  )
}

afterEach(() => cleanup())

describe('ShiftMapPage', () => {
  it('abre o mapa de turnos e apresenta a estimativa do vencimento sem erro', async () => {
    renderMap()

    expect(screen.getByRole('heading', { name: 'Mapa de turnos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Turnos do mês' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar mapa' })).toBeInTheDocument()

    // Aguarda o efeito assíncrono que carrega as definições e seleciona o primeiro dia.
    expect(await screen.findByText('Situação RH')).toBeInTheDocument()
    expect(screen.getByText('VENCIMENTO ESTIMADO')).toBeInTheDocument()
  })

  it('permite aceder e editar sábado e domingo pela data no iPhone sem alterar o tipo persistido', async () => {
    renderMap()
    const monthInput = await screen.findByLabelText('Mês')
    fireEvent.change(monthInput, { target: { value: '2026-09' } })
    await waitFor(() => expect(screen.getByLabelText('Escolher dia do mês')).toBeInTheDocument())

    const dateInput = screen.getByLabelText('Escolher dia do mês')
    fireEvent.change(dateInput, { target: { value: '2026-09-19' } })
    const kindSelect = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Situação RH' })
    expect(screen.getByRole('option', { name: 'Sábado (trabalho normal)' })).not.toBeDisabled()
    expect(screen.getByRole('option', { name: 'Domingo (trabalho normal)' })).toBeDisabled()
    fireEvent.change(kindSelect, { target: { value: 'weekend-saturday' } })
    expect(kindSelect).toHaveValue('weekend-saturday')

    fireEvent.change(dateInput, { target: { value: '2026-09-20' } })
    expect(screen.getByRole('option', { name: 'Sábado (trabalho normal)' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Domingo (trabalho normal)' })).not.toBeDisabled()
    fireEvent.change(kindSelect, { target: { value: 'weekend-sunday' } })
    expect(kindSelect).toHaveValue('weekend-sunday')

    fireEvent.change(dateInput, { target: { value: '2026-09-21' } })
    expect(screen.getByRole('option', { name: 'Sábado (trabalho normal)' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Domingo (trabalho normal)' })).toBeDisabled()
  })
})
