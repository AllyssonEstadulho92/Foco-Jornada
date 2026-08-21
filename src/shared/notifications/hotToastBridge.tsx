/* eslint-disable react-refresh/only-export-components -- este ficheiro adapta a API de react-hot-toast ao centro de notificações interno. */
import { pushAppNotification } from '../../presentation/store/useNotificationStore'

function textOf(message: unknown): string {
  if (typeof message === 'string') return message
  if (typeof message === 'number') return String(message)
  if (message instanceof Error) return message.message
  return 'Atualização da aplicação.'
}

function baseToast(message: unknown) {
  pushAppNotification('info', textOf(message))
  return String(Date.now())
}

const toast = Object.assign(baseToast, {
  success(message: unknown) {
    pushAppNotification('success', textOf(message))
    return String(Date.now())
  },
  error(message: unknown) {
    pushAppNotification('error', textOf(message))
    return String(Date.now())
  },
  loading(message: unknown) {
    pushAppNotification('info', textOf(message))
    return String(Date.now())
  },
  dismiss() {
    return undefined
  },
})

export default toast

export function Toaster() {
  return null
}
