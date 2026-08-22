import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_SETTINGS, normalizeSettings } from './AppSettings'

describe('normalizeSettings', () => {
  it('usa a pausa exata 12:00-12:15 por defeito', () => {
    expect(DEFAULT_APP_SETTINGS.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '12:00',
      endTime: '12:15',
    })
  })

  it('migra a pausa antiga 11:00-11:15 guardada antes da revisão 2', () => {
    const normalized = normalizeSettings({
      coffeeUnitPrice: 0.7,
      currency: 'EUR',
      suggestedBreakIntervalMinutes: 90,
      workSchedule: {
        ...DEFAULT_APP_SETTINGS.workSchedule,
        break1: { enabled: true, startTime: '11:00', endTime: '11:15' },
      },
    })

    expect(normalized.settingsRevision).toBe(2)
    expect(normalized.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '12:00',
      endTime: '12:15',
    })
  })

  it('respeita uma edição posterior para 11:00-11:15 quando já está na revisão atual', () => {
    const normalized = normalizeSettings({
      settingsRevision: 2,
      coffeeUnitPrice: 0.7,
      currency: 'EUR',
      suggestedBreakIntervalMinutes: 90,
      workSchedule: {
        ...DEFAULT_APP_SETTINGS.workSchedule,
        break1: { enabled: true, startTime: '11:00', endTime: '11:15' },
      },
    })

    expect(normalized.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '11:00',
      endTime: '11:15',
    })
  })
})
