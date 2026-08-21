import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clear: () => set({ notifications: [] }),
      remove: (id) =>
        set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
    }),
    {
      name: 'foco-jornada-notifications-v1',
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
}
