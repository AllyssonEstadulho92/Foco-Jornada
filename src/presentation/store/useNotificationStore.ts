import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'\nimport { secureStorage } from '../../security/secureStorage'
import { emitAppFeedback } from '../../shared/notifications/appFeedback'

export type NotificationTone = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  title: string
  detail: string
  tone: NotificationTone
  createdAt: string
  read: boolean
}

interface NotificationState {
  notifications: AppNotification[]
  add: (input: { title: string; detail?: string; tone?: NotificationTone }) => void
  update: (id: string, input: { title: string; detail?: string; tone?: NotificationTone }) => void
  markAllRead: () => void
  clear: () => void
  remove: (id: string) => void
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      add: ({ title, detail = '', tone = 'info' }) =>
        set((state) => ({
          notifications: [
            {
              id: createId(),
              title,
              detail,
              tone,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 80),
        })),
      update: (id, { title, detail = '', tone }) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title,
                  detail,
                  tone: tone ?? item.tone,
                }
              : item,
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clear: () => set({ notifications: [] }),
      remove: (id) =>
        set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
    }),
    {
      name: 'foco-jornada-notifications-v1',\n      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
)

export function pushAppNotification(
  tone: NotificationTone,
  title: string,
  detail = '',
) {
  useNotificationStore.getState().add({ tone, title, detail })
  emitAppFeedback(tone, title, detail)
}
