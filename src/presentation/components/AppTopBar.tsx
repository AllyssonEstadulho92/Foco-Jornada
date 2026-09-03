import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSecurityOptional } from '../../security/SecurityContext'
import { emitAppFeedback } from '../../shared/notifications/appFeedback'
import { useNow } from '../hooks/useNow'
import { useAppServices } from '../providers/AppServicesProvider'
import { useNotificationStore, type AppNotification } from '../store/useNotificationStore'
import { AppIcon } from './ui/AppIcon'

type StatusNotification = {
  id: string
  title: string
  detail: string
  tone: 'info' | 'success'
}

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function AppTopBar({ onOpenMenu, menuButtonRef }: { onOpenMenu?: () => void; menuButtonRef?: RefObject<HTMLButtonElement | null> }) {
  const { journeyRepository, focusRepository } = useAppServices()
  const security = useSecurityOptional()
  const now = useNow(1000)
  const [isOpen, setIsOpen] = useState(false)
  const [activeJourneyStartedAt, setActiveJourneyStartedAt] = useState<string | null>(null)
  const [hasActiveFocus, setHasActiveFocus] = useState(false)
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDetail, setEditDetail] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const notifications = useNotificationStore((state) => state.notifications)
  const updateNotification = useNotificationStore((state) => state.update)
  const removeNotification = useNotificationStore((state) => state.remove)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clearNotifications = useNotificationStore((state) => state.clear)

  const refreshStatus = useCallback(async () => {
    try {
      const activeJourney = await journeyRepository.getActive()
      setActiveJourneyStartedAt(activeJourney?.startedAt ?? null)

      if (!activeJourney) {
        setHasActiveFocus(false)
        return
      }

      const focus = await focusRepository.getOpenForJourney(activeJourney.id)
      setHasActiveFocus(Boolean(focus))
    } catch {
      // O centro de notificações é auxiliar e nunca deve bloquear a aplicação.
    }
  }, [focusRepository, journeyRepository])

  useEffect(() => {
    void refreshStatus()
    const timer = window.setInterval(() => void refreshStatus(), 15000)
    return () => window.clearInterval(timer)
  }, [refreshStatus])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (editingNotificationId) {
          setEditingNotificationId(null)
        } else {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingNotificationId, isOpen])

  const statusNotifications = useMemo<StatusNotification[]>(() => {
    const items: StatusNotification[] = []

    if (hasActiveFocus) {
      items.push({
        id: 'focus-active',
        title: 'Sessão de foco em curso',
        detail: 'O temporizador de foco está ativo.',
        tone: 'info',
      })
    }

    if (activeJourneyStartedAt) {
      const entryTime = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(activeJourneyStartedAt))
      items.push({
        id: 'journey-active',
        title: 'Jornada em curso',
        detail: `Entrada registada às ${entryTime}.`,
        tone: 'success',
      })
    }

    return items
  }, [activeJourneyStartedAt, hasActiveFocus])

  const clock = new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)

  const unreadCount = notifications.filter((item) => !item.read).length

  function toggleNotifications() {
    setIsOpen((current) => {
      const next = !current
      if (next) {
        markAllRead()
        void refreshStatus()
      } else {
        setEditingNotificationId(null)
      }
      return next
    })
  }

  function startEditingNotification(item: AppNotification) {
    setEditingNotificationId(item.id)
    setEditTitle(item.title)
    setEditDetail(item.detail)
  }

  function cancelEditingNotification() {
    setEditingNotificationId(null)
    setEditTitle('')
    setEditDetail('')
  }

  function saveEditingNotification(event: React.FormEvent) {
    event.preventDefault()
    if (!editingNotificationId) return
    const title = editTitle.trim()
    if (!title) return

    updateNotification(editingNotificationId, {
      title,
      detail: editDetail.trim(),
    })
    cancelEditingNotification()
    emitAppFeedback('success', 'Alteração guardada', 'A notificação foi atualizada neste dispositivo.')
  }

  function handleRemoveNotification(id: string) {
    removeNotification(id)
    if (editingNotificationId === id) cancelEditingNotification()
  }

  function handleClearNotifications() {
    clearNotifications()
    cancelEditingNotification()
  }

  return (
    <div className="appTopBar" aria-label="Estado da aplicação">
      <div className="mobileAppIdentity">
        <button ref={menuButtonRef} className="mobileMenuButton" type="button" onClick={onOpenMenu} aria-label="Abrir menu principal" aria-controls="mobile-main-drawer">
          <AppIcon name="menu" />
        </button>
        <strong>Foco Jornada</strong>
      </div>

      <div className="topBarStatusGroup">
        <div className="appClock" aria-label={`Hora atual ${clock}`}>
          <AppIcon name="clock" />
          <time dateTime={now.toISOString()}>{clock}</time>
        </div>

        {security ? (
          <button
            type="button"
            className="securityTopLock"
            onClick={() => void security.lock()}
            aria-label="Bloquear aplicação agora"
            title="Bloquear agora"
          >
            <AppIcon name="lock" />
          </button>
        ) : null}

        <div className="notificationCenter" ref={panelRef}>
          <button
            type="button"
            className={`notificationButton${isOpen ? ' notificationButtonActive' : ''}`}
            onClick={toggleNotifications}
            aria-label="Abrir centro de notificações"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <AppIcon name="bell" motion={isOpen || unreadCount > 0 ? "ring" : "none"} />
            {unreadCount > 0 ? (
              <span className="notificationBadge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            ) : null}
          </button>

          {isOpen ? (
            <section className="notificationPanel" role="dialog" aria-label="Centro de notificações">
              <header className="notificationPanelHeader">
                <div>
                  <strong>Notificações</strong>
                </div>
                <div className="notificationHeaderActions">
                  <span className="notificationCount">{notifications.length}</span>
                  {notifications.length > 0 ? (
                    <button type="button" onClick={handleClearNotifications}>Limpar</button>
                  ) : null}
                </div>
              </header>

              {statusNotifications.length > 0 ? (
                <div className="notificationStatusStrip">
                  {statusNotifications.map((item) => (
                    <article className="notificationItem notificationStatusItem" key={item.id}>
                      <span className={`notificationDot notificationDot-${item.tone}`} aria-hidden="true" />
                      <div className="notificationItemContent">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}


              <div className="notificationList">
                {notifications.length === 0 ? (
                  <div
                    className="notificationEmpty notificationEmptyIconOnly"
                    role="status"
                    aria-label="Tudo em dia. Sem notificações novas."
                  >
                    <span className="notificationEmptyAnimatedIcon" aria-hidden="true">
                      <AppIcon name="check" motion="draw" />
                    </span>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isEditing = editingNotificationId === item.id
                    return (
                      <article className={`notificationItem${item.read ? '' : ' notificationItemUnread'}`} key={item.id}>
                        <span className={`notificationDot notificationDot-${item.tone}`} aria-hidden="true" />
                        {isEditing ? (
                          <form className="notificationEditForm" onSubmit={saveEditingNotification}>
                            <label>
                              <span>Título</span>
                              <input
                                autoFocus
                                maxLength={80}
                                value={editTitle}
                                onChange={(event) => setEditTitle(event.target.value)}
                                required
                              />
                            </label>
                            <label>
                              <span>Detalhe</span>
                              <textarea
                                rows={2}
                                maxLength={220}
                                value={editDetail}
                                onChange={(event) => setEditDetail(event.target.value)}
                              />
                            </label>
                            <div className="notificationEditActions">
                              <button type="button" onClick={cancelEditingNotification}>Cancelar</button>
                              <button type="submit">Guardar</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="notificationItemContent">
                              <strong>{item.title}</strong>
                              {item.detail ? <span>{item.detail}</span> : null}
                              <time dateTime={item.createdAt}>{formatNotificationTime(item.createdAt)}</time>
                            </div>
                            <div className="notificationItemActions" aria-label={`Ações para ${item.title}`}>
                              <button
                                type="button"
                                onClick={() => startEditingNotification(item)}
                                aria-label={`Editar notificação: ${item.title}`}
                                title="Editar"
                              >
                                <AppIcon name="edit" />
                              </button>
                              <button
                                type="button"
                                className="notificationDeleteButton"
                                onClick={() => handleRemoveNotification(item.id)}
                                aria-label={`Eliminar notificação: ${item.title}`}
                                title="Eliminar"
                              >
                                <AppIcon name="trash" />
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    )
                  })
                )}
              </div>

            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
