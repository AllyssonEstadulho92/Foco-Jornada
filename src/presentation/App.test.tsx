import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../test/InMemoryBreakRepository'
import { InMemoryCoffeeRepository } from '../test/InMemoryCoffeeRepository'
import { InMemoryFocusRepository } from '../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../test/InMemorySettingsRepository'
import { App } from './App'

describe('App', () => {
  it('renderiza o dashboard e a navegação principal', async () => {
    render(
      <App
        services={{
          journeyRepository: new InMemoryJourneyRepository(),
          breakRepository: new InMemoryBreakRepository(),
          activityRepository: new InMemoryActivityRepository(),
          focusRepository: new InMemoryFocusRepository(),
          coffeeRepository: new InMemoryCoffeeRepository(),
          settingsRepository: new InMemorySettingsRepository(),
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Foco & Jornada' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Iniciar jornada' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gestão de pausas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Café' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Atividades' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Foco' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Histórico' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Mais' }).length).toBeGreaterThan(0)
  })
})
