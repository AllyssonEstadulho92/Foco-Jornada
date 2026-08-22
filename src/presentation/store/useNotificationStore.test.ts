import { beforeEach, describe, expect, it } from 'vitest'
import { useNotificationStore } from './useNotificationStore'

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] })
  })

  it('permite editar e eliminar uma notificação guardada', () => {
    useNotificationStore.getState().add({
      tone: 'info',
      title: 'Título original',
      detail: 'Detalhe original',
    })

    const created = useNotificationStore.getState().notifications[0]
    expect(created).toBeDefined()

    useNotificationStore.getState().update(created.id, {
      title: 'Título corrigido',
      detail: 'Detalhe corrigido',
    })

    const updated = useNotificationStore.getState().notifications[0]
    expect(updated.title).toBe('Título corrigido')
    expect(updated.detail).toBe('Detalhe corrigido')
    expect(updated.tone).toBe('info')

    useNotificationStore.getState().remove(created.id)
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })
})
