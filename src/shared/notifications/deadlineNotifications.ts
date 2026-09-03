import { secureStorage } from '../../security/secureStorage'
import { pushAppNotification, type NotificationTone } from '../../presentation/store/useNotificationStore'
import { shouldDeliverSystemNotification } from './notificationPreferences'

export type DeadlineNotificationPermission = NotificationPermission | 'unsupported'
export type DeadlineNotificationPlatform = 'ios' | 'android' | 'desktop' | 'other'
export type DeadlineNotificationCategory = 'journey' | 'break' | 'focus' | 'medication' | 'glo' | 'system'

export interface DeadlineNotification {
  id: string
  deadlineAt: string
  title: string
  detail: string
  tone?: NotificationTone
  tag?: string
  category?: DeadlineNotificationCategory
  url?: string
}

export interface DeadlineNotificationCapability {
  permission: DeadlineNotificationPermission
  notificationsSupported: boolean
  serviceWorkerSupported: boolean
  serviceWorkerRegistered: boolean
  pushSupported: boolean
  pushSubscribed: boolean
  standalone: boolean
  platform: DeadlineNotificationPlatform
}

const DELIVERED_STORAGE_KEY = 'foco-jornada:deadline-notifications:v1'
const MAX_DELIVERED_AGE_MS = 14 * 24 * 60 * 60 * 1000
const PERMISSION_EVENT = 'foco-jornada:notification-permission-changed'

function loadDelivered(now = Date.now()): Record<string, number> {
  try {
    const raw = secureStorage.getItem(DELIVERED_STORAGE_KEY)
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
    secureStorage.setItem(DELIVERED_STORAGE_KEY, JSON.stringify(delivered))
  } catch {
    // O histórico local de entrega é auxiliar. A aplicação continua funcional sem armazenamento.
  }
}

export function detectDeadlineNotificationPlatform(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
): DeadlineNotificationPlatform {
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  if (/Windows|Macintosh|Linux/i.test(userAgent)) return 'desktop'
  return 'other'
}

export function isStandaloneWebApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const mediaStandalone = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches
  const navigatorStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return mediaStandalone || navigatorStandalone
}

export function getDeadlineNotificationPermission(): DeadlineNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function getDeadlineNotificationCapability(): Promise<DeadlineNotificationCapability> {
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window
  const serviceWorkerSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  const registration = serviceWorkerSupported
    ? await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL).catch(() => undefined)
    : undefined
  const pushSupported = Boolean(registration && 'pushManager' in registration)
  const subscription = pushSupported
    ? await registration?.pushManager.getSubscription().catch(() => null)
    : null

  return {
    permission: getDeadlineNotificationPermission(),
    notificationsSupported,
    serviceWorkerSupported,
    serviceWorkerRegistered: Boolean(registration),
    pushSupported,
    pushSubscribed: Boolean(subscription),
    standalone: isStandaloneWebApp(),
    platform: detectDeadlineNotificationPlatform(),
  }
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
    category: input.category ?? 'system',
    url: input.url?.trim() || undefined,
  }
}

function notificationTargetUrl(item: DeadlineNotification): string {
  const target = item.url?.trim()
  if (!target) return import.meta.env.BASE_URL
  if (target.startsWith('#')) return `${import.meta.env.BASE_URL}${target}`
  return target
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

async function showSystemNotification(item: DeadlineNotification, force = false): Promise<boolean> {
  if (getDeadlineNotificationPermission() !== 'granted') return false
  if (!force && !shouldDeliverSystemNotification(item.category, new Date())) return false

  const options: NotificationOptions = {
    body: item.detail,
    tag: item.tag ?? item.id,
    icon: `${import.meta.env.BASE_URL}icon.svg`,
    badge: `${import.meta.env.BASE_URL}icon.svg`,
    data: {
      deadlineId: item.id,
      deadlineAt: item.deadlineAt,
      category: item.category ?? 'system',
      url: notificationTargetUrl(item),
    },
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
      if (registration) {
        await registration.showNotification(item.title, options)
        return true
      }
    }

    const notification = new Notification(item.title, options)
    notification.onclick = () => {
      window.focus()
      if (item.url?.startsWith('#')) window.location.hash = item.url.slice(1)
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

export async function sendDeadlineNotificationTest(): Promise<boolean> {
  const now = new Date()
  const item: DeadlineNotification = {
    id: `notification-test:${now.toISOString()}`,
    deadlineAt: now.toISOString(),
    title: 'Teste de notificações concluído',
    detail: 'O Foco Jornada consegue apresentar notificações do sistema neste dispositivo enquanto o browser/PWA permite execução.',
    tone: 'success',
    tag: 'foco-jornada-notification-test',
    category: 'system',
    url: '#/notificacoes',
  }
  const shown = await showSystemNotification(item, true)
  if (shown) pushAppNotification('success', item.title, item.detail)
  return shown
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
