import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { useAppServices } from '../providers/AppServicesProvider'

type NotificationItem = {
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 20h4" />
    </svg>
  )
}

export function AppTopBar() {
  const { journeyRepository, focusRepository } = useAppServices()
  const now = useNow(1000)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)
  const [activeJourneyStartedAt, setActiveJourneyStartedAt] = useState<string | null>(null)
  const [hasActiveFocus, setHasActiveFocus] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    if (hasActiveFocus) {
      items.push({
        id: 'focus-active',
        title: 'Sessão de foco em curso',
        detail: 'O temporizador de foco está ativo.',
        tone: 'info',
      })
    }

    if (activeJourneyStartedAt) {
      const startedAt = new Date(activeJourneyStartedAt)
      const entryTime = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(startedAt)
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

  const unreadCount = hasSeen ? 0 : notifications.length

  function toggleNotifications() {
    setIsOpen((current) => {
      const next = !current
      if (next) {
        setHasSeen(true)
        void refreshStatus()
      }
      return next
    })
  }

  return (
    <div className="appTopBar" aria-label="Estado da aplicação">
      <div className="appClock" aria-label={`Hora atual ${clock}`}>
        <ClockIcon />
        <time dateTime={now.toISOString()}>{clock}</time>
      </div>

      <div className="notificationCenter" ref={panelRef}>
        <button
          type="button"
          className={`notificationButton${isOpen ? ' notificationButtonActive' : ''}`}
          onClick={toggleNotifications}
          aria-label="Abrir centro de notificações"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <BellIcon />
          {unreadCount > 0 ? <span className="notificationBadge">{unreadCount}</span> : null}
        </button>

        {isOpen ? (
          <section className="notificationPanel" role="dialog" aria-label="Centro de notificações">
            <header className="notificationPanelHeader">
              <div>
                <span>NOTIFICAÇÕES</span>
                <strong>Centro de notificações</strong>
              </div>
              <span className="notificationCount">{notifications.length}</span>
            </header>

            <div className="notificationList">
              {notifications.length === 0 ? (
                <div className="notificationEmpty">
                  <strong>Sem novas notificações</strong>
                  <span>Jornada, pausas e foco aparecerão aqui quando estiverem ativos.</span>
                </div>
              ) : (
                notifications.map((item) => (
                  <article className="notificationItem" key={item.id}>
                    <span className={`notificationDot notificationDot-${item.tone}`} aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                  </article>
                ))
              )}
            </div>

            <footer className="notificationPanelFooter">Atualização automática</footer>
          </section>
        ) : null}
      </div>
    </div>
  )
}
