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
  if (capability.permission === 'granted') return 'Sistema permitido'
  if (capability.permission === 'denied') return 'Sistema bloqueado'
  if (capability.permission === 'default') return 'Por autorizar'
  return 'API indisponível'
}

function backgroundLabel(capability: DeadlineNotificationCapability): string {
  if (capability.pushSubscribed) return 'Push em segundo plano ativo'
  if (capability.platform === 'ios' && !capability.standalone) return 'Instalar no Ecrã Principal'
  if (capability.pushSupported) return 'Push por configurar'
  return 'Automação local'
}

function statusCopy(capability: DeadlineNotificationCapability): { title: string; detail: string } {
  if (capability.platform === 'ios' && !capability.standalone) {
    return {
      title: 'Notificações no iPhone/iPad',
      detail: 'Para Web Push no iOS/iPadOS, adiciona o Foco Jornada ao Ecrã Principal, abre-o pelo ícone instalado e autoriza as notificações. No browser, o centro da aplicação continua disponível.',
    }
  }

  if (capability.permission === 'granted') {
    const backgroundDetail = capability.pushSubscribed
      ? 'A subscrição Web Push deste dispositivo está ativa.'
      : 'A automação local está ativa. Sem uma subscrição Web Push ligada a um serviço de envio, um aviso com a aplicação totalmente fechada não pode ser garantido.'

    return {
      title: 'Automação de notificações ativa',
      detail: `Entrada, pausas planeadas, regresso, saída, pausas temporizadas, foco, medicação e sessão glo são acompanhados automaticamente. ${backgroundDetail}`,
    }
  }

  if (capability.permission === 'denied') {
    return {
      title: 'Notificações bloqueadas no dispositivo',
      detail: 'Ativa a permissão nas definições do browser ou da aplicação instalada. Os avisos continuam a ser guardados no centro de notificações do Foco Jornada.',
    }
  }

  if (capability.permission === 'unsupported') {
    return {
      title: 'Notificações do sistema indisponíveis neste modo',
      detail: 'O Foco Jornada continua a registar avisos internamente. Para notificações fora da página é necessário um browser/PWA com Notifications API e Service Worker.',
    }
  }

  return {
    title: 'Ativar notificações automáticas',
    detail: 'Autoriza uma vez para receber avisos do sistema para jornada e horário, pausas, foco, medicação e sessão glo quando o browser/PWA puder executar.',
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
          'A permissão foi recusada. Podes alterá-la nas definições do browser ou da aplicação instalada.',
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
      <section className="notificationAutomationPanel" aria-label="Automação de notificações">
        <strong>A verificar notificações…</strong>
      </section>
    )
  }

  const copy = statusCopy(capability)
  const canRequest = capability.permission === 'default'
  const canTest = capability.permission === 'granted'

  return (
    <section className="notificationAutomationPanel" aria-label="Automação de notificações">
      <div className="notificationAutomationHeading">
        <div>
          <span>AUTOMAÇÃO</span>
          <strong>{copy.title}</strong>
        </div>
        <span className="releaseStatusBadge">{backgroundLabel(capability)}</span>
      </div>

      <p>{copy.detail}</p>

      <div className="notificationAutomationBadges" aria-label="Estado técnico das notificações">
        <span className="releaseStatusBadge">{platformLabel(capability)}</span>
        <span className="releaseStatusBadge">{capability.standalone ? 'PWA instalada' : 'Browser'}</span>
        <span className="releaseStatusBadge">{permissionLabel(capability)}</span>
        <span className="releaseStatusBadge">{capability.serviceWorkerRegistered ? 'Service Worker pronto' : 'Service Worker pendente'}</span>
      </div>

      <div className="notificationAutomationCoverage" aria-label="Áreas automatizadas">
        <span>Jornada</span>
        <span>Pausas</span>
        <span>Foco</span>
        <span>Medicação</span>
        <span>glo</span>
      </div>

      <div className="deadlineNotificationActions">
        {canRequest ? (
          <button type="button" onClick={() => void handleEnable()} disabled={busy}>
            Ativar notificações
          </button>
        ) : null}
        {canTest ? (
          <button type="button" onClick={() => void handleTest()} disabled={busy}>
            Testar notificação
          </button>
        ) : null}
      </div>
    </section>
  )
}
