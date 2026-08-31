import {
  getDeadlineNotificationCapability,
  sendDeadlineNotificationTest,
  subscribeDeadlineNotificationPermission,
} from '../../shared/notifications/deadlineNotifications'
import { pushAppNotification } from '../store/useNotificationStore'

const CONTROL_ID = 'deadline-mobile-notification-permission'
const DIAGNOSTIC_ID = 'deadline-mobile-notification-diagnostics'

export function installNotificationPermissionDiagnostics(): void {
  let rendering = false

  const render = async () => {
    if (rendering) return
    const control = document.getElementById(CONTROL_ID)
    if (!control) return
    rendering = true
    try {
      const capability = await getDeadlineNotificationCapability()
      let host = document.getElementById(DIAGNOSTIC_ID)
      if (!host) {
        host = document.createElement('div')
        host.id = DIAGNOSTIC_ID
        host.className = 'deadlineNotificationActions'
        control.appendChild(host)
      }
      host.innerHTML = ''

      const badge = document.createElement('span')
      badge.className = 'releaseStatusBadge'
      badge.textContent = capability.permission === 'granted'
        ? capability.serviceWorkerRegistered ? 'Sistema pronto' : 'Permissão ativa · SW pendente'
        : capability.permission === 'denied' ? 'Bloqueado' : capability.permission === 'unsupported' ? 'Não suportado' : 'Por autorizar'
      host.appendChild(badge)

      if (capability.permission === 'granted') {
        const testButton = document.createElement('button')
        testButton.type = 'button'
        testButton.textContent = 'Testar notificação'
        testButton.addEventListener('click', () => {
          testButton.disabled = true
          void sendDeadlineNotificationTest()
            .then((shown) => {
              if (!shown) {
                pushAppNotification(
                  'error',
                  'Teste de notificação não apresentado',
                  'Confirma as permissões do browser/PWA e volta a testar.',
                )
              }
            })
            .finally(() => {
              testButton.disabled = false
            })
        })
        host.appendChild(testButton)
      }
    } finally {
      rendering = false
    }
  }

  const observer = new MutationObserver(() => void render())
  observer.observe(document.body, { subtree: true, childList: true })
  const unsubscribePermission = subscribeDeadlineNotificationPermission(() => void render())

  void render()

  window.addEventListener('beforeunload', () => {
    observer.disconnect()
    unsubscribePermission()
  }, { once: true })
}
