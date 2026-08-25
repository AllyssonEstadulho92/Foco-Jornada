import { describe, expect, it } from 'vitest'
import {
  AmbiguousLocalTimeError,
  NonexistentLocalTimeError,
  addCalendarDays,
  dateKeyInZone,
  resolveZonedLocalDateTime,
} from './time'

describe('Europe/Lisbon stock scheduling', () => {
  it('crosses month, year and leap day using calendar dates', () => {
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addCalendarDays('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('identifies the Lisbon local date around midnight', () => {
    expect(dateKeyInZone(new Date('2026-08-24T23:30:00Z'), 'Europe/Lisbon')).toBe('2026-08-25')
  })

  it('rejects a nonexistent local time during spring DST transition', () => {
    expect(() => resolveZonedLocalDateTime('2026-03-29', '01:30', 'Europe/Lisbon')).toThrow(
      NonexistentLocalTimeError,
    )
  })

  it('requires fold for an ambiguous local time during autumn DST transition', () => {
    expect(() => resolveZonedLocalDateTime('2026-10-25', '01:30', 'Europe/Lisbon')).toThrow(
      AmbiguousLocalTimeError,
    )

    const first = resolveZonedLocalDateTime('2026-10-25', '01:30', 'Europe/Lisbon', 0)
    const second = resolveZonedLocalDateTime('2026-10-25', '01:30', 'Europe/Lisbon', 1)
    expect(second.getTime() - first.getTime()).toBe(3_600_000)
  })
})
