interface VacationRecord {
  date?: string
  kind?: string
}

interface WorkHoursVacationRecord {
  date: string
  reason: string
}

export type VacationEvidenceSource = 'horas' | 'turnos' | 'plano'

export interface VacationDayEvidence {
  date: string
  sources: VacationEvidenceSource[]
}

const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'
const SOURCE_ORDER: VacationEvidenceSource[] = ['horas', 'turnos', 'plano']

function validDateInYear(dateKey: unknown, year: number): dateKey is string {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
    !dateKey.startsWith(`${year}-`)) return false
  const [y, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, month - 1, day))
  return date.getUTCFullYear() === y && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** One entry per valid civil date. Sources are labels, not separate vacation days. */
export function collectVacationEvidenceForYear(
  year: number,
  entries: WorkHoursVacationRecord[],
  readEncryptedItem: (key: string) => string | null,
): VacationDayEvidence[] {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) return []
  const sourcesByDate = new Map<string, Set<VacationEvidenceSource>>()
  function record(date: unknown, source: VacationEvidenceSource) {
    if (!validDateInYear(date, year)) return
    const sources = sourcesByDate.get(date) ?? new Set<VacationEvidenceSource>()
    sources.add(source)
    sourcesByDate.set(date, sources)
  }

  for (const entry of entries) {
    if (entry?.reason === 'ferias') record(entry.date, 'horas')
  }

  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    for (const [prefix, source] of [
      [SHIFT_MAP_PREFIX, 'turnos'], [PAYROLL_PLAN_PREFIX, 'plano'],
    ] as const) {
      try {
        const raw = readEncryptedItem(`${prefix}${monthKey}`)
        if (!raw) continue
        const data: unknown = JSON.parse(raw)
        if (!Array.isArray(data)) continue
        for (const item of data as VacationRecord[]) {
          // Preserve the previous collector's behaviour: a record can contain a valid
          // date from another month of the same year. The actual date is authoritative.
          if (item?.kind === 'vacation') record(item.date, source)
        }
      } catch {
        // Indisponibilidade/corrupção de um mês não inventa dias nem bloqueia os restantes.
      }
    }
  }

  return [...sourcesByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, sources]) => ({ date, sources: SOURCE_ORDER.filter((source) => sources.has(source)) }))
}

/** Same source reconciliation for the planner and the audit panel. */
export function collectVacationDatesForYear(
  year: number,
  entries: WorkHoursVacationRecord[],
  readEncryptedItem: (key: string) => string | null,
): string[] {
  return collectVacationEvidenceForYear(year, entries, readEncryptedItem).map((item) => item.date)
}
