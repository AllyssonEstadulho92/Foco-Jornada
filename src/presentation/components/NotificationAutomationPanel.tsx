import { useCallback, useEffect, useState } from 'react'
import {
  getDeadlineNotificationCapability,
  requestDeadlineNotificationPermission,
  sendDeadlineNotificationTest,
  subscribeDeadlineNotificationPermission,
  type DeadlineNotificationCapability,
} from '../../shared/notifications/deadlineNotifications'
import { pushAppNotification } from '../store/useNotificationStore'

function platformLabel(capability: DeadlineNotificationCapability): string {
  if (capability.platform === 'ios') return 'iOS / iPadOS'
  if (capability.platform === 'android') return 'Android'
  if (capability.platform === 'desktop') return 'Computador'
  return 'Web'
}

function permissionLabel(capability: DeadlineNotificationCapability): string {
  if (capability.permission === 'granted') return 'Permitidas'
  if (capability.permission === 'denied') return 'Bloqueadas'
  if (capability.permission === 'default') return 'Por autorizar'
  return 'Indisponíveis'
}

type CompactState = 'ready' | 'attention' | 'blocked' | 'limited'

function compactCopy(capability: DeadlineNotificationCapability): {
  title: string
  detail: string
  state: CompactState
} {
  if (capability.platform === 'ios' && !capability.standalone) {
    return {
      title: 'Instala a app para receber alertas',
      detail: 'No iPhone/iPad, adiciona o Foco Jornada ao Ecrã Principal.',
      state: 'attention',
    }
  }

  if (capability.permission === 'granted') {
    return {
      title: 'Notificações ativas',
      detail: capability.pushSubscribed
        ? 'Alertas do sistema e Web Push estão ativos.'
        : 'Os alertas do dispositivo estão autorizados.',
      state: 'ready',
    }
  }

  if (capability.permission === 'denied') {
    return {
      title: 'Notificações bloqueadas',
      detail: 'Ativa-as nas definições do navegador ou do dispositivo.',
      state: 'blocked',
    }
  }

  if (capability.permission === 'unsupported') {
    return {
      title: 'Alertas do sistema indisponíveis',
      detail: 'Os avisos continuam guardados no Foco Jornada.',
      state: 'limited',
    }
  }

  return {
    title: 'Ativar notificações',
    detail: 'Recebe avisos de jornada, pausas, foco e medicação.',
    state: 'attention',
  }
}

export function NotificationAutomationPanel() {
  const [capability, setCapability] = useState<DeadlineNotificationCapability | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshCapability = useCallback(async () => {
    const next = await getDeadlineNotificationCapability()
    setCapability(next)
  }, [])

  useEffect(() => {
    void refreshCapability()
    const unsubscribe = subscribeDeadlineNotificationPermission(() => void refreshCapability())
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshCapability()
    }
    const handleController = () => void refreshCapability()

    document.addEventListener('visibilitychange', handleVisibility)
    navigator.serviceWorker?.addEventListener?.('controllerchange', handleController)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
      navigator.serviceWorker?.removeEventListener?.('controllerchange', handleController)
    }
  }, [refreshCapability])

  async function handleEnable() {
    setBusy(true)
    try {
      const permission = await requestDeadlineNotificationPermission()
      await refreshCapability()
      if (permission === 'denied') {
        pushAppNotification(
          'error',
          'Notificações bloqueadas',
          'A permissão foi recusada. Podes alterá-la nas definições do navegador ou da aplicação instalada.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    setBusy(true)
    try {
      const shown = await sendDeadlineNotificationTest()
      if (!shown) {
        pushAppNotification(
          'error',
          'Teste de notificação não apresentado',
          'Confirma as permissões do browser/PWA e volta a testar.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  if (!capability) {
    return (
      <section className="notificationAutomationPanel isLoading" aria-label="Estado das notificações">
        <span className="notificationAutomationStateDot" aria-hidden="true" />
        <strong>A verificar notificações…</strong>
      </section>
    )
  }

  const copy = compactCopy(capability)
  const canRequest = capability.permission === 'default'
  const canTest = capability.permission === 'granted'

  return (
    <section
      className="notificationAutomationPanel"
      data-state={copy.state}
      aria-label="Estado das notificações"
    >
      <div className="notificationAutomationCompact">
        <span className="notificationAutomationStateDot" aria-hidden="true" />
        <div className="notificationAutomationCopy">
          <strong>{copy.title}</strong>
          <p>{copy.detail}</p>
        </div>
        {canRequest ? (
          <button
            className="notificationAutomationPrimary"
            type="button"
            onClick={() => void handleEnable()}
            disabled={busy}
          >
            Ativar
          </button>
        ) : null}
      </div>

      <details className="notificationAutomationDetails">
        <summary>Detalhes</summary>
        <div className="notificationAutomationBadges" aria-label="Estado técnico das notificações">
          <span>{platformLabel(capability)}</span>
          <span>{capability.standalone ? 'App instalada' : 'Browser'}</span>
          <span>{permissionLabel(capability)}</span>
          <span>{capability.serviceWorkerRegistered ? 'Canal pronto' : 'Canal pendente'}</span>
        </div>

        {capability.platform === 'ios' && !capability.standalone ? (
          <p>
            No iOS/iPadOS, instala pelo menu Partilhar → Adicionar ao Ecrã Principal e abre depois
            a aplicação pelo novo ícone.
          </p>
        ) : null}

        {canTest ? (
          <button
            className="notificationAutomationTest"
            type="button"
            onClick={() => void handleTest()}
            disabled={busy}
          >
            Testar notificação
          </button>
        ) : null}
      </details>
    </section>
  )
}
