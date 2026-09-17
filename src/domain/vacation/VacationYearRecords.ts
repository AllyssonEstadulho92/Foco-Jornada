interface VacationRecord {
  date?: string
  kind?: string
}

interface WorkHoursVacationRecord {
  date: string
  reason: string
}

const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

/** The reader is injected so this module never accesses unencrypted browser storage directly. */
export function collectVacationDatesForYear(
  year: number,
  entries: WorkHoursVacationRecord[],
  readEncryptedItem: (key: string) => string | null,
): string[] {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) return []
  const prefix = `${year}-`
  const dates = new Set<string>()
  for (const entry of entries) {
    if (entry.reason === 'ferias' && entry.date.startsWith(prefix)) dates.add(entry.date)
  }
  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    for (const source of [SHIFT_MAP_PREFIX, PAYROLL_PLAN_PREFIX]) {
      try {
        const raw = readEncryptedItem(`${source}${monthKey}`)
        if (!raw) continue
        const data: unknown = JSON.parse(raw)
        if (!Array.isArray(data)) continue
        for (const item of data as VacationRecord[]) {
          if (item?.kind === 'vacation' && typeof item.date === 'string' &&
            item.date.startsWith(prefix)) dates.add(item.date)
        }
      } catch {
        // Corrupt/locked data does not create synthetic vacation days.
      }
    }
  }
  return [...dates].sort()
}
