import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../test/InMemoryBreakRepository'
import { InMemoryCoffeeRepository } from '../test/InMemoryCoffeeRepository'
import { InMemoryFocusRepository } from '../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../test/InMemorySettingsRepository'
import { App } from './App'

describe('App', () => {
  it('renderiza o dashboard de referência e a navegação principal', async () => {
    const view = render(
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

    expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite), foco!$/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resumo do dia' })).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: 'Iniciar jornada' })).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Ações rápidas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Café +1 registo' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Atividades' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Foco' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Calendário' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Relatórios' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Mais' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '#/historico')

    const moreButton = screen.getByRole('button', { name: 'Abrir menu Mais' })
    expect(moreButton).toHaveTextContent('Mais')
    expect(moreButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(moreButton)

    const closeMoreButton = screen.getByRole('button', { name: 'Fechar menu Mais' })
    expect(closeMoreButton).toHaveTextContent('Mais')
    expect(closeMoreButton).not.toHaveTextContent('Fechar')
    expect(closeMoreButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Acesso rápido' })).toBeInTheDocument()

    view.unmount()
  })
})
