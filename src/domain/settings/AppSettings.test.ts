import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_SETTINGS, normalizeSettings } from './AppSettings'

describe('normalizeSettings', () => {
  it('usa a pausa exata 11:00-11:15 por defeito', () => {
    expect(DEFAULT_APP_SETTINGS.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '11:00',
      endTime: '11:15',
    })
  })

  it('migra o padrão anterior 12:00-12:15 da revisão 2 para 11:00-11:15', () => {
    const normalized = normalizeSettings({
      settingsRevision: 2,
      coffeeUnitPrice: 0.7,
      currency: 'EUR',
      suggestedBreakIntervalMinutes: 90,
      workSchedule: {
        ...DEFAULT_APP_SETTINGS.workSchedule,
        break1: { enabled: true, startTime: '12:00', endTime: '12:15' },
      },
    })

    expect(normalized.settingsRevision).toBe(3)
    expect(normalized.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '11:00',
      endTime: '11:15',
    })
  })

  it('mantém a pausa 11:00-11:15 já guardada em revisões antigas', () => {
    const normalized = normalizeSettings({
      settingsRevision: 1,
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

  it('respeita uma edição explícita para 12:00-12:15 quando já está na revisão atual', () => {
    const normalized = normalizeSettings({
      settingsRevision: 3,
      coffeeUnitPrice: 0.7,
      currency: 'EUR',
      suggestedBreakIntervalMinutes: 90,
      workSchedule: {
        ...DEFAULT_APP_SETTINGS.workSchedule,
        break1: { enabled: true, startTime: '12:00', endTime: '12:15' },
      },
    })

    expect(normalized.workSchedule.break1).toEqual({
      enabled: true,
      startTime: '12:00',
      endTime: '12:15',
    })
  })
})
