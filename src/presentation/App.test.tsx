import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../test/InMemoryBreakRepository'
import { InMemoryCoffeeRepository } from '../test/InMemoryCoffeeRepository'
import { InMemoryFocusRepository } from '../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../test/InMemorySettingsRepository'
import { App } from './App'
import { useNotificationStore } from './store/useNotificationStore'

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

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegação móvel' })
    expect(within(mobileNavigation).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '#/')
    expect(within(mobileNavigation).getByRole('link', { name: 'Jornada' })).toHaveAttribute('href', '#/calendario')
    expect(within(mobileNavigation).getByRole('link', { name: 'Foco' })).toHaveAttribute('href', '#/foco')
    expect(within(mobileNavigation).getByRole('link', { name: 'Notificações' })).toHaveAttribute('href', '#/notificacoes')
    expect(within(mobileNavigation).getByRole('link', { name: 'Mais' })).toHaveAttribute('href', '#/mais')

    view.unmount()
  })
  it('mantém o painel rápido de notificações limpo e usa o estado animado local', () => {
    useNotificationStore.setState({ notifications: [] })

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

    fireEvent.click(screen.getByRole('button', { name: 'Abrir centro de notificações' }))

    const panel = screen.getByRole('dialog', { name: 'Centro de notificações' })
    expect(within(panel).getByRole('status', { name: 'Tudo em dia. Sem notificações novas.' })).toBeInTheDocument()
    expect(within(panel).queryByText('Tudo em dia')).not.toBeInTheDocument()
    expect(within(panel).queryByText('Sem notificações novas.')).not.toBeInTheDocument()
    expect(panel.querySelector('.appIcon--check.appIcon--motion-draw')).not.toBeNull()
    expect(screen.queryByText('Instala a app para receber alertas')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Abrir centro completo' })).not.toBeInTheDocument()

    view.unmount()
  })

})
