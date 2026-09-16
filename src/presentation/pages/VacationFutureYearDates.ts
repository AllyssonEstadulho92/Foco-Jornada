import { secureStorage } from '../../security/secureStorage'

const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

interface VacationLikeRecord {
  date?: string
  kind?: string
}

function readVacationRecords(key: string): VacationLikeRecord[] {
  try {
    const raw = secureStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as VacationLikeRecord[]) : []
  } catch {
    return []
  }
}

/**
 * Lê o próximo ano nas MESMAS três fontes da vista de acumulação. Não grava
 * nem presume que férias de 2026 se transferem automaticamente para 2027.
 * Futuro refactor: partilhar esta agregação com VacationBalancePage.
 */
export function collectFutureYearVacationDates(
  year: number,
  workHoursEntries: Array<{ date: string; reason: string }>,
): string[] {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return []
  const dates = new Set<string>()
  const prefix = `${year}-`
  for (const entry of workHoursEntries) {
    if (entry.reason === 'ferias' && entry.date.startsWith(prefix)) dates.add(entry.date)
  }
  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    for (const record of [
      ...readVacationRecords(`${SHIFT_MAP_PREFIX}${monthKey}`),
      ...readVacationRecords(`${PAYROLL_PLAN_PREFIX}${monthKey}`),
    ]) {
      if (record.kind === 'vacation' && record.date?.startsWith(prefix)) dates.add(record.date)
    }
  }
  return [...dates].sort()
}
