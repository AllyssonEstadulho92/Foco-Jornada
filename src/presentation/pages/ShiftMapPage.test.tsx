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
  it('abre o mapa de turnos e apresenta o planeamento salarial sem erro', async () => {
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
    expect(screen.getByRole('heading', { name: 'Calendário do mês' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar mapa e cálculo' })).toBeInTheDocument()
    expect(await screen.findByText('VALOR DA PLANIFICAÇÃO')).toBeInTheDocument()
  })
})
