import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  notificationCategoryEnabled,
  notificationScheduleAllows,
  shouldDeliverSystemNotification,
  type NotificationPreferences,
} from './notificationPreferences'

function preferences(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    ...structuredClone(DEFAULT_NOTIFICATION_PREFERENCES),
    ...overrides,
  }
}

describe('notificationPreferences', () => {
  it('mantém defaults seguros quando recebe configuração inválida', () => {
    const normalized = normalizeNotificationPreferences({
      setupComplete: true,
      categories: { journey: false },
      schedule: {
        mode: 'invalid',
        startTime: '99:00',
        endTime: 'texto',
        weekdays: [],
      },
    })

    expect(normalized.setupComplete).toBe(true)
    expect(normalized.categories.journey).toBe(false)
    expect(normalized.categories.medication).toBe(true)
    expect(normalized.schedule.mode).toBe('always')
    expect(normalized.schedule.startTime).toBe('08:00')
    expect(normalized.schedule.endTime).toBe('20:00')
    expect(normalized.schedule.weekdays).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('respeita categorias desativadas sem afetar as restantes', () => {
    const value = preferences({
      categories: {
        journey: true,
        break: true,
        focus: false,
        medication: true,
        glo: false,
        system: true,
      },
    })

    expect(notificationCategoryEnabled('focus', value)).toBe(false)
    expect(notificationCategoryEnabled('medication', value)).toBe(true)
    expect(shouldDeliverSystemNotification('glo', new Date(2026, 8, 1, 10, 0), value)).toBe(false)
  })

  it('permite apenas a janela personalizada nos dias selecionados', () => {
    const value = preferences({
      schedule: {
        mode: 'window',
        startTime: '08:00',
        endTime: '20:00',
        weekdays: [2],
      },
    })

    expect(notificationScheduleAllows(new Date(2026, 8, 1, 9, 0), value)).toBe(true)
    expect(notificationScheduleAllows(new Date(2026, 8, 1, 21, 0), value)).toBe(false)
    expect(notificationScheduleAllows(new Date(2026, 8, 2, 9, 0), value)).toBe(false)
  })

  it('suporta não perturbar a atravessar a meia-noite', () => {
    const value = preferences({
      schedule: {
        mode: 'quiet',
        startTime: '22:00',
        endTime: '07:00',
        weekdays: [2],
      },
    })

    expect(notificationScheduleAllows(new Date(2026, 8, 1, 23, 0), value)).toBe(false)
    expect(notificationScheduleAllows(new Date(2026, 8, 2, 1, 0), value)).toBe(false)
    expect(notificationScheduleAllows(new Date(2026, 8, 1, 12, 0), value)).toBe(true)
  })
})
