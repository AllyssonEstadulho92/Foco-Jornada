import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeadlineNotificationPermission, requestDeadlineNotificationPermission } from '../../shared/notifications/deadlineNotifications'
import { useAppServices } from '../providers/AppServicesProvider'
import { useNotificationStore } from '../store/useNotificationStore'

type Filter = 'all' | 'unread' | 'success' | 'info' | 'error'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}

export function NotificationCenterV2Page() {
  const { journeyRepository, focusRepository } = useAppServices()
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clear = useNotificationStore((state) => state.clear)
  const remove = useNotificationStore((state) => state.remove)
  const [filter, setFilter] = useState<Filter>('all')
  const [permission, setPermission] = useState(() => getDeadlineNotificationPermission())
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false)
  const [activeJourney, setActiveJourney] = useState<string | null>(null)
  const [activeFocus, setActiveFocus] = useState(false)
  const [testMessage, setTestMessage] = useState('')

  const refreshRuntime = useCallback(async () => {
    setPermission(getDeadlineNotificationPermission())
    setServiceWorkerActive('serviceWorker' in navigator && Boolean(await navigator.serviceWorker.getRegistration()))
    const journey = await journeyRepository.getActive()
    setActiveJourney(journey?.startedAt ?? null)
    if (!journey) {
      setActiveFocus(false)
      return
    }
    setActiveFocus(Boolean(await focusRepository.getOpenForJourney(journey.id)))
  }, [focusRepository, journeyRepository])

  useEffect(() => {
    void refreshRuntime()
    const onFocus = () => void refreshRuntime()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refreshRuntime])

  const filtered = useMemo(() => notifications.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !item.read
    return item.tone === filter
  }), [filter, notifications])

  const unread = notifications.filter((item) => !item.read).length

  async function enableNotifications() {
    const next = await requestDeadlineNotificationPermission()
    setPermission(next)
    setTestMessage(next === 'granted' ? 'Permissão concedida.' : 'A permissão não foi concedida.')
  }

  async function testSystemNotification() {
    setTestMessage('')
    if (getDeadlineNotificationPermission() !== 'granted') {
      setTestMessage('Ativa primeiro as notificações do telemóvel.')
      return
    }
    try {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
      if (registration) {
        await registration.showNotification('Foco Jornada · teste', {
          body: 'As notificações deste dispositivo estão operacionais.',
          tag: 'foco-jornada-notification-test-v2',
          icon: `${import.meta.env.BASE_URL}icon.svg`,
        })
      } else {
        new Notification('Foco Jornada · teste', { body: 'As notificações deste dispositivo estão operacionais.' })
      }
      setTestMessage('Teste enviado ao sistema operativo.')
    } catch {
      setTestMessage('O navegador não conseguiu apresentar a notificação de teste.')
    }
  }

  return (
    <section className="opsPage" aria-labelledby="notifications-v2-title">
      <header className="opsPageHeader">
        <div>
          <span className="opsEyebrow">NOTIFICAÇÕES V2</span>
          <h1 id="notifications-v2-title">Estado, histórico e diagnóstico</h1>
          <p>Os avisos ficam guardados no dispositivo e os deadlines continuam baseados em timestamps absolutos.</p>
        </div>
      </header>

      <div className="opsSummaryGrid opsNotificationHealth">
        <article><span>Permissão</span><strong>{permission}</strong><small>Notificações do sistema</small></article>
        <article><span>Service Worker</span><strong>{serviceWorkerActive ? 'Ativo' : 'Não detetado'}</strong><small>Canal PWA</small></article>
        <article><span>Não lidas</span><strong>{unread}</strong><small>{notifications.length} no histórico</small></article>
        <article><span>Jornada</span><strong>{activeJourney ? 'Em curso' : 'Inativa'}</strong><small>{activeJourney ? `Desde ${formatDateTime(activeJourney)}` : 'Sem jornada ativa'}</small></article>
        <article><span>Foco</span><strong>{activeFocus ? 'Em curso' : 'Inativo'}</strong><small>Estado atual</small></article>
      </div>

      <div className="opsNotificationActions">
        {permission !== 'granted' ? <button type="button" onClick={() => void enableNotifications()}>Ativar notificações</button> : null}
        <button type="button" onClick={() => void testSystemNotification()}>Testar notificação</button>
        <button type="button" onClick={markAllRead} disabled={!unread}>Marcar tudo como lido</button>
        <button type="button" onClick={() => window.confirm('Limpar o histórico local de notificações?') && clear()} disabled={!notifications.length}>Limpar histórico</button>
      </div>
      {testMessage ? <p className="opsInlineStatus" role="status">{testMessage}</p> : null}

      <div className="opsFilterBar" role="group" aria-label="Filtrar notificações">
        {(['all', 'unread', 'success', 'info', 'error'] as Filter[]).map((value) => (
          <button key={value} type="button" className={filter === value ? 'isActive' : ''} onClick={() => setFilter(value)}>
            {value === 'all' ? 'Todas' : value === 'unread' ? 'Não lidas' : value === 'success' ? 'Sucesso' : value === 'info' ? 'Informação' : 'Erro'}
          </button>
        ))}
      </div>

      <div className="opsNotificationTimeline">
        {filtered.length === 0 ? <div className="opsEmptyState"><strong>Sem notificações neste filtro</strong><span>Os próximos avisos aparecerão aqui quando forem gerados pela aplicação.</span></div> : null}
        {filtered.map((item) => (
          <article key={item.id} className={`opsNotificationEntry tone-${item.tone}${item.read ? '' : ' isUnread'}`}>
            <span className="opsNotificationMarker" aria-hidden="true" />
            <div>
              <strong>{item.title}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
              <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
            </div>
            <button type="button" onClick={() => remove(item.id)} aria-label={`Eliminar ${item.title}`}>×</button>
          </article>
        ))}
      </div>

      <p className="opsTechnicalNote">Limite técnico: uma PWA estática não garante entrega no segundo exato quando o sistema operativo encerrou totalmente o navegador. Ao retomar, os deadlines vencidos são reconciliados pela aplicação.</p>
    </section>
  )
}
