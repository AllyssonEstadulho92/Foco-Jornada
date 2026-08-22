import { describe, expect, it } from 'vitest'
import { getTimeGreeting } from './timeGreeting'

describe('getTimeGreeting', () => {
  it('usa Boa noite durante a madrugada', () => {
    expect(getTimeGreeting(new Date(2026, 7, 23, 0, 20))).toBe('Boa noite')
    expect(getTimeGreeting(new Date(2026, 7, 23, 4, 59))).toBe('Boa noite')
  })

  it('usa Bom dia entre as 05:00 e as 11:59', () => {
    expect(getTimeGreeting(new Date(2026, 7, 23, 5, 0))).toBe('Bom dia')
    expect(getTimeGreeting(new Date(2026, 7, 23, 11, 59))).toBe('Bom dia')
  })

  it('usa Boa tarde entre as 12:00 e as 19:59', () => {
    expect(getTimeGreeting(new Date(2026, 7, 23, 12, 0))).toBe('Boa tarde')
    expect(getTimeGreeting(new Date(2026, 7, 23, 19, 59))).toBe('Boa tarde')
  })

  it('volta a Boa noite a partir das 20:00', () => {
    expect(getTimeGreeting(new Date(2026, 7, 23, 20, 0))).toBe('Boa noite')
  })
})
