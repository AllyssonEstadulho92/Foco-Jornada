import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSecurityOptional } from '../../security/SecurityContext'
import { emitAppFeedback } from '../../shared/notifications/appFeedback'
import { useNow } from '../hooks/useNow'
import { useAppServices } from '../providers/AppServicesProvider'
import { useNotificationStore, type AppNotification } from '../store/useNotificationStore'

type StatusNotification = {
  id: string
  title: string
  detail: string
  tone: 'info' | 'success'
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.5" y="10" width="13" height="10" rx="2" />
      <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  )
}

function BellIcon({ animated = false }: { animated?: boolean }) {
  return (
    <svg
      className={animated ? 'notificationBellGlyph isAnimated' : 'notificationBellGlyph'}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <g className="notificationBellBody">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M10 20h4" className="notificationBellClapper" />
      </g>
      <path d="M4.8 6.5c.45-.95 1.05-1.8 1.8-2.5" className="notificationBellWave notificationBellWaveLeft" />
      <path d="M19.2 6.5c-.45-.95-1.05-1.8-1.8-2.5" className="notificationBellWave notificationBellWaveRight" />
    </svg>
  )
}

function EmptyStateIcon() {
  return (
    <svg className="notificationEmptyGlyph" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="notificationEmptyHalo" cx="32" cy="32" r="24" />
      <circle className="notificationEmptyRing" cx="32" cy="32" r="18" />
      <path className="notificationEmptyCheck" d="m23.5 32.5 6 6L41.5 25" />
      <circle className="notificationEmptySpark notificationEmptySparkOne" cx="50" cy="18" r="1.8" />
      <circle className="notificationEmptySpark notificationEmptySparkTwo" cx="16" cy="20" r="1.4" />
      <circle className="notificationEmptySpark notificationEmptySparkThree" cx="47" cy="46" r="1.2" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16-.5 4.5L8 20l10.2-10.2-4-4L4 16Z" />
      <path d="m12.8 7.2 4 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 13h8l1-13" />
    </svg>
  )
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
          <MenuIcon />
        </button>
        <strong>Foco Jornada</strong>
      </div>

      <div className="topBarStatusGroup">
        <div className="appClock" aria-label={`Hora atual ${clock}`}>
          <ClockIcon />
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
            <LockIcon />
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
            <BellIcon animated={isOpen || unreadCount > 0} />
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
                      <EmptyStateIcon />
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
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                className="notificationDeleteButton"
                                onClick={() => handleRemoveNotification(item.id)}
                                aria-label={`Eliminar notificação: ${item.title}`}
                                title="Eliminar"
                              >
                                <TrashIcon />
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
