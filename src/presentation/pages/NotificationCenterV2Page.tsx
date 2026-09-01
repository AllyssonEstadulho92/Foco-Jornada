import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDeadlineNotificationCapability,
  requestDeadlineNotificationPermission,
  sendDeadlineNotificationTest,
  type DeadlineNotificationCapability,
} from '../../shared/notifications/deadlineNotifications'
import { useAppServices } from '../providers/AppServicesProvider'
import { useNotificationStore } from '../store/useNotificationStore'

type Filter = 'all' | 'unread' | 'today' | 'success' | 'info' | 'error'

const initialCapability: DeadlineNotificationCapability = {
  permission: 'unsupported',
  notificationsSupported: false,
  serviceWorkerSupported: false,
  serviceWorkerRegistered: false,
  pushSupported: false,
  pushSubscribed: false,
  standalone: false,
  platform: 'other',
}

function BellIcon({ checked = false }: { checked?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 6.5-2.5 7-2.5 7h17S18 15.5 18 9Z" />
      <path d="M9.8 20h4.4" />
      {checked ? <path d="m15.2 13.1 1.5 1.5 3-3.1" className="notificationHeroCheck" /> : null}
    </svg>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

function capabilityLabel(capability: DeadlineNotificationCapability) {
  if (capability.platform === 'ios' && !capability.standalone) return 'iOS · instalar no Ecrã Principal'
  if (!capability.notificationsSupported) return 'Não suportado neste navegador'
  if (capability.permission === 'denied') return 'Bloqueado nas definições do navegador'
  if (capability.permission === 'default') return 'A aguardar autorização'
  if (!capability.serviceWorkerRegistered) return 'Autorizado · canal PWA não detetado'
  if (capability.pushSubscribed) return 'Web Push ativo'
  return 'Automação local ativa'
}

export function NotificationCenterV2Page() {
  const { journeyRepository, focusRepository } = useAppServices()
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clear = useNotificationStore((state) => state.clear)
  const remove = useNotificationStore((state) => state.remove)
  const [filter, setFilter] = useState<Filter>('all')
  const [capability, setCapability] = useState<DeadlineNotificationCapability>(initialCapability)
  const [activeJourney, setActiveJourney] = useState<string | null>(null)
  const [activeFocus, setActiveFocus] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [lastTestAt, setLastTestAt] = useState<string | null>(() => window.localStorage.getItem('foco-jornada:last-notification-test'))

  const refreshRuntime = useCallback(async () => {
    try {
      const [nextCapability, journey] = await Promise.all([
        getDeadlineNotificationCapability(),
        journeyRepository.getActive(),
      ])
      setCapability(nextCapability)
      setActiveJourney(journey?.startedAt ?? null)
      if (!journey) {
        setActiveFocus(false)
        return
      }
      setActiveFocus(Boolean(await focusRepository.getOpenForJourney(journey.id)))
    } catch {
      setTestMessage('Não foi possível atualizar o diagnóstico agora. O histórico local continua disponível.')
    }
  }, [focusRepository, journeyRepository])

  useEffect(() => {
    void refreshRuntime()
    const onFocus = () => void refreshRuntime()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshRuntime()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshRuntime])

  const filtered = useMemo(() => notifications.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !item.read
    if (filter === 'today') return isToday(item.createdAt)
    return item.tone === filter
  }), [filter, notifications])

  const unread = notifications.filter((item) => !item.read).length
  const todayCount = notifications.filter((item) => isToday(item.createdAt)).length

  async function enableNotifications() {
    setTestMessage('')
    const next = await requestDeadlineNotificationPermission()
    await refreshRuntime()
    if (next === 'granted') {
      setTestMessage('Notificações do sistema autorizadas neste navegador.')
    } else if (next === 'denied') {
      setTestMessage('A autorização foi bloqueada. Altera a permissão nas definições do navegador para voltares a ativá-la.')
    } else if (next === 'unsupported') {
      setTestMessage('Este navegador não expõe a API de notificações do sistema. O centro local continua funcional.')
    } else {
      setTestMessage('A autorização não foi concedida.')
    }
  }

  async function testSystemNotification() {
    setTestMessage('')
    if (capability.permission !== 'granted') {
      setTestMessage('Autoriza primeiro as notificações do sistema para executar o teste.')
      return
    }

    setIsTesting(true)
    try {
      const shown = await sendDeadlineNotificationTest()
      if (!shown) {
        setTestMessage('O navegador não conseguiu apresentar a notificação de teste. O aviso local continua guardado na aplicação.')
        return
      }
      const testedAt = new Date().toISOString()
      window.localStorage.setItem('foco-jornada:last-notification-test', testedAt)
      setLastTestAt(testedAt)
      setTestMessage('Teste enviado com sucesso ao sistema operativo.')
    } finally {
      setIsTesting(false)
      await refreshRuntime()
    }
  }

  const systemOperational = capability.notificationsSupported && capability.permission === 'granted'
  const localOperational = true

  return (
    <section className="notificationV3Page" aria-labelledby="notifications-v3-title">
      <header className="notificationV3Header">
        <div className="notificationV3TitleGroup">
          <span className="notificationV3Logo" aria-hidden="true"><BellIcon /></span>
          <div>
            <span className="notificationV3Eyebrow">NOTIFICAÇÕES</span>
            <h1 id="notifications-v3-title">Centro de notificações</h1>
            <p>Acompanha os avisos importantes da jornada e confirma o estado das notificações do dispositivo.</p>
          </div>
        </div>
        <div className="notificationV3HeaderActions">
          <div className="notificationUnreadCard" aria-label={`${unread} notificações não lidas`}>
            <BellIcon />
            <strong>{unread}</strong>
            <span>Não lidas</span>
          </div>
          <button className="notificationMarkRead" type="button" onClick={markAllRead} disabled={!unread}>
            ✓ Marcar todas como lidas
          </button>
        </div>
      </header>

      <div className="notificationV3FilterRow" role="group" aria-label="Filtrar notificações">
        {([
          ['all', 'Todas'],
          ['unread', `Não lidas${unread ? ` · ${unread}` : ''}`],
          ['today', `Hoje${todayCount ? ` · ${todayCount}` : ''}`],
          ['success', 'Concluídas'],
          ['info', 'Informação'],
          ['error', 'Erros'],
        ] as Array<[Filter, string]>).map(([value, label]) => (
          <button key={value} type="button" className={filter === value ? 'isActive' : ''} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>

      <div className="notificationV3Layout">
        <div className="notificationV3MainColumn">
          <section className="notificationInboxCard" aria-label="Caixa de notificações">
            {filtered.length === 0 ? (
              <div className="notificationEmptyHero">
                <span className="notificationEmptyIcon" aria-hidden="true"><BellIcon checked /></span>
                <strong>{filter === 'unread' ? 'Sem notificações por ler' : 'Sem notificações neste filtro'}</strong>
                <p>{filter === 'unread'
                  ? 'Quando surgir um novo aviso, ele ficará guardado aqui para consulta.'
                  : 'Os próximos avisos que correspondam a este filtro aparecerão aqui.'}</p>
                <div className="notificationHowItWorks">
                  <span aria-hidden="true">ⓘ</span>
                  <div>
                    <strong>Como funciona</strong>
                    <p>O histórico local é independente da notificação do sistema. Mesmo quando o navegador não pode mostrar um popup, os avisos gerados pela aplicação continuam disponíveis neste centro.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="notificationHistoryList">
                {filtered.map((item) => (
                  <article key={item.id} className={`notificationHistoryItem tone-${item.tone}${item.read ? '' : ' isUnread'}`}>
                    <span className="notificationHistoryDot" aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      {item.detail ? <p>{item.detail}</p> : null}
                      <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                    </div>
                    <button type="button" onClick={() => remove(item.id)} aria-label={`Eliminar notificação: ${item.title}`}>×</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="notificationHistoryCard" aria-labelledby="notification-history-title">
            <header>
              <div>
                <span className="notificationV3Eyebrow">HISTÓRICO</span>
                <h2 id="notification-history-title">Histórico de notificações</h2>
              </div>
              <span>{notifications.length} registo{notifications.length === 1 ? '' : 's'}</span>
            </header>
            {notifications.length === 0 ? (
              <div className="notificationHistoryEmpty">
                <span aria-hidden="true">▱</span>
                <div><strong>Ainda não existem notificações</strong><p>Quando receberes avisos, eles aparecerão aqui.</p></div>
              </div>
            ) : (
              <div className="notificationHistoryActions">
                <span>O histórico fica guardado localmente neste dispositivo.</span>
                <button type="button" onClick={() => window.confirm('Limpar o histórico local de notificações?') && clear()}>Limpar histórico</button>
              </div>
            )}
          </section>
        </div>

        <aside className="notificationV3SideColumn" aria-label="Estado das notificações">
          <section className={`notificationSystemCard${systemOperational ? ' isOperational' : ' isLimited'}`}>
            <span className="notificationV3Eyebrow">NOTIFICAÇÕES DO SISTEMA</span>
            <h2>{systemOperational ? 'Canal do dispositivo disponível' : 'Canal do dispositivo limitado'}</h2>
            <p>{capability.notificationsSupported
              ? capability.permission === 'denied'
                ? 'O navegador suporta notificações, mas a permissão está bloqueada nas definições.'
                : capability.permission === 'default'
                  ? 'O navegador suporta notificações. Falta autorizar o envio de avisos para o dispositivo.'
                  : 'A permissão foi concedida. A entrega depende das regras do navegador e do sistema operativo.'
              : 'Este navegador não disponibiliza notificações do sistema. Os avisos locais continuam ativos na aplicação.'}</p>
            <span className="notificationStatusPill">{systemOperational ? '✓ OPERACIONAL' : 'CENTRO LOCAL ATIVO'}</span>
            {capability.notificationsSupported && capability.permission === 'default' ? (
              <button type="button" onClick={() => void enableNotifications()}>Ativar notificações</button>
            ) : null}
          </section>

          <section className="notificationStatusCard">
            <h2>Estado das notificações</h2>
            <dl>
              <div><dt>Centro local</dt><dd className="isGood">Ativo ✓</dd></div>
              <div><dt>Permissão do dispositivo</dt><dd className={capability.permission === 'granted' ? 'isGood' : ''}>{capability.permission === 'granted' ? 'Autorizada ✓' : capability.permission === 'denied' ? 'Bloqueada' : capability.permission === 'default' ? 'Pendente' : 'Não suportada'}</dd></div>
              <div><dt>Service Worker</dt><dd className={capability.serviceWorkerRegistered ? 'isGood' : ''}>{capability.serviceWorkerRegistered ? 'Ativo ✓' : capability.serviceWorkerSupported ? 'Não registado' : 'Não suportado'}</dd></div>
              <div><dt>Plataforma</dt><dd>{capability.platform === 'ios' ? 'iOS / iPadOS' : capability.platform === 'android' ? 'Android' : capability.platform === 'desktop' ? 'Computador' : 'Web'}</dd></div>
              <div><dt>Modo</dt><dd>{capability.standalone ? 'PWA instalada' : 'Browser'}</dd></div>
              <div><dt>Web Push</dt><dd className={capability.pushSubscribed ? 'isGood' : ''}>{capability.pushSubscribed ? 'Subscrito ✓' : capability.pushSupported ? 'Por configurar' : 'Indisponível'}</dd></div>
              <div><dt>Jornada</dt><dd>{activeJourney ? 'Em curso' : 'Inativa'}</dd></div>
              <div><dt>Foco</dt><dd>{activeFocus ? 'Em curso' : 'Inativo'}</dd></div>
              <div><dt>Último teste</dt><dd>{lastTestAt ? formatDateTime(lastTestAt) : 'Ainda não executado'}</dd></div>
            </dl>
            <button type="button" className="notificationTestButton" onClick={() => void testSystemNotification()} disabled={isTesting || capability.permission !== 'granted'}>
              {isTesting ? 'A testar…' : 'Testar notificação'}
            </button>
            {testMessage ? <p className="notificationTestStatus" role="status">{testMessage}</p> : null}
          </section>

          <section className="notificationQuickCard">
            <h2>Preferências rápidas</h2>
            <div><span>Centro local</span><strong className="isGood">Ativo</strong></div>
            <div><span>Reconciliação ao retomar</span><strong className="isGood">Automática</strong></div>
            <div><span>Avisos do sistema</span><strong>{systemOperational ? 'Ativos' : 'Limitados'}</strong></div>
            <small>Som e vibração das notificações do sistema são controlados pelo navegador e pelo sistema operativo.</small>
          </section>
        </aside>
      </div>

      <footer className="notificationPrivacyCard">
        <span aria-hidden="true">◆</span>
        <div><strong>Os teus dados permanecem no dispositivo</strong><p>O histórico deste centro é guardado localmente. As notificações não alteram jornadas, prescrições, stock nem outros registos.</p></div>
        <span>{localOperational ? 'Proteção local ativa' : ''}</span>
      </footer>

      <p className="notificationTechnicalNote">Limite técnico: os deadlines locais são exatos por timestamp, mas a entrega com a aplicação totalmente fechada só é garantível com uma subscrição Web Push ligada a um serviço de envio. No iOS/iPadOS, Web Push exige a web app adicionada ao Ecrã Principal. Ao retomar a aplicação, deadlines vencidos continuam a ser reconciliados pelos timestamps guardados.</p>
      <span className="notificationCapabilitySummary" aria-hidden="true">{capabilityLabel(capability)}</span>
    </section>
  )
}
