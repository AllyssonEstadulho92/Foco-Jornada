import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryCoffeeRepository } from '../../test/InMemoryCoffeeRepository'
import { InMemoryFocusRepository } from '../../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../../test/InMemorySettingsRepository'
import { AppServicesProvider } from '../providers/AppServicesProvider'
import { ShiftMapPage } from './ShiftMapPage'

describe('ShiftMapPage', () => {
  it('abre o mapa de turnos e apresenta a estimativa do vencimento sem erro', async () => {
    render(
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

    expect(screen.getByRole('heading', { name: 'Mapa de turnos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Turnos do mês' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar mapa' })).toBeInTheDocument()

    // Aguarda o efeito assíncrono que carrega as definições e seleciona o primeiro dia.
    // Assim o teste só termina depois de o estado inicial do mapa estar estabilizado.
    expect(await screen.findByText('Situação RH')).toBeInTheDocument()
    expect(screen.getByText('VENCIMENTO ESTIMADO')).toBeInTheDocument()
  })
})
