import { pushAppNotification, type NotificationTone } from '../../presentation/store/useNotificationStore'

export type DeadlineNotificationPermission = NotificationPermission | 'unsupported'

export interface DeadlineNotification {
  id: string
  deadlineAt: string
  title: string
  detail: string
  tone?: NotificationTone
  tag?: string
}

const DELIVERED_STORAGE_KEY = 'foco-jornada:deadline-notifications:v1'
const MAX_DELIVERED_AGE_MS = 14 * 24 * 60 * 60 * 1000
const PERMISSION_EVENT = 'foco-jornada:notification-permission-changed'

function loadDelivered(now = Date.now()): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(DELIVERED_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const cutoff = now - MAX_DELIVERED_AGE_MS
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value >= cutoff),
    ) as Record<string, number>
  } catch {
    return {}
  }
}

function saveDelivered(delivered: Record<string, number>): void {
  try {
    window.localStorage.setItem(DELIVERED_STORAGE_KEY, JSON.stringify(delivered))
  } catch {
    // O histórico local de entrega é auxiliar. A aplicação continua funcional sem armazenamento.
  }
}

export function getDeadlineNotificationPermission(): DeadlineNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestDeadlineNotificationPermission(): Promise<DeadlineNotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const result = await Notification.requestPermission()
  window.dispatchEvent(new CustomEvent(PERMISSION_EVENT, { detail: result }))
  return result
}

export function subscribeDeadlineNotificationPermission(listener: (permission: DeadlineNotificationPermission) => void): () => void {
  const handler = () => listener(getDeadlineNotificationPermission())
  window.addEventListener(PERMISSION_EVENT, handler)
  window.addEventListener('focus', handler)
  return () => {
    window.removeEventListener(PERMISSION_EVENT, handler)
    window.removeEventListener('focus', handler)
  }
}

export function validateDeadline(input: DeadlineNotification): DeadlineNotification | null {
  const deadlineMs = Date.parse(input.deadlineAt)
  if (!input.id.trim() || !input.title.trim() || !Number.isFinite(deadlineMs)) return null
  return {
    ...input,
    id: input.id.trim(),
    deadlineAt: new Date(deadlineMs).toISOString(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    tone: input.tone ?? 'info',
    tag: input.tag?.trim() || input.id.trim(),
  }
}

export function dueDeadlines(
  deadlines: DeadlineNotification[],
  now = new Date(),
  delivered: Record<string, number> = {},
): DeadlineNotification[] {
  const nowMs = now.getTime()
  return deadlines
    .map(validateDeadline)
    .filter((item): item is DeadlineNotification => Boolean(item))
    .filter((item) => Date.parse(item.deadlineAt) <= nowMs && delivered[item.id] === undefined)
    .sort((left, right) => Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt))
}

async function showSystemNotification(item: DeadlineNotification): Promise<boolean> {
  if (getDeadlineNotificationPermission() !== 'granted') return false

  const options: NotificationOptions = {
    body: item.detail,
    tag: item.tag ?? item.id,
    icon: `${import.meta.env.BASE_URL}icon.svg`,
    badge: `${import.meta.env.BASE_URL}icon.svg`,
    data: {
      deadlineId: item.id,
      deadlineAt: item.deadlineAt,
      url: import.meta.env.BASE_URL,
    },
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(item.title, options)
        return true
      }
    }

    new Notification(item.title, options)
    return true
  } catch {
    return false
  }
}

export async function deliverDueDeadlines(deadlines: DeadlineNotification[], now = new Date()): Promise<DeadlineNotification[]> {
  const delivered = loadDelivered(now.getTime())
  const due = dueDeadlines(deadlines, now, delivered)

  for (const item of due) {
    pushAppNotification(item.tone ?? 'info', item.title, item.detail)
    await showSystemNotification(item)
    delivered[item.id] = now.getTime()
  }

  if (due.length > 0) saveDelivered(delivered)
  return due
}

export function nextPendingDeadlineAt(deadlines: DeadlineNotification[], now = new Date()): string | null {
  const nowMs = now.getTime()
  const delivered = loadDelivered(nowMs)
  const next = deadlines
    .map(validateDeadline)
    .filter((item): item is DeadlineNotification => Boolean(item))
    .filter((item) => Date.parse(item.deadlineAt) > nowMs && delivered[item.id] === undefined)
    .sort((left, right) => Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt))[0]
  return next?.deadlineAt ?? null
}
