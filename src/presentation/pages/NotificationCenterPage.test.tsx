import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadNotificationPreferences } from '../../shared/notifications/notificationPreferences'
import { useNotificationStore } from '../store/useNotificationStore'
import { NotificationCenterPage } from './NotificationCenterPage'

describe('NotificationCenterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useNotificationStore.setState({ notifications: [] })
  })

  it('apresenta o novo centro e conclui o fluxo de configuração móvel', async () => {
    render(<NotificationCenterPage />)

    expect(screen.getByRole('heading', { name: 'Centro de notificações', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ativar notificações/i }))

    expect(screen.getByRole('heading', { name: 'Ativar notificações', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('heading', { name: 'Permissões', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('heading', { name: 'Categorias', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Medicação')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar e continuar' }))

    expect(screen.getByRole('heading', { name: 'Horários', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Horário personalizado/))
    fireEvent.change(screen.getByLabelText('Das'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '20:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar e continuar' }))

    expect(screen.getByRole('heading', { name: 'Teste', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar sem teste' }))

    expect(screen.getByRole('heading', { name: 'Resumo', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    expect(screen.getByRole('button', { name: /Reconfigurar notificações/i })).toBeInTheDocument()
    expect(loadNotificationPreferences()).toMatchObject({
      setupComplete: true,
      schedule: {
        mode: 'window',
        startTime: '08:00',
        endTime: '20:00',
      },
    })
  })
})
