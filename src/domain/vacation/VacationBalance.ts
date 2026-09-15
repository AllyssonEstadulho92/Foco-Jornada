export interface VacationTrackerSettings {
  employmentStartDate: string
  annualEntitlementDays: number
  carriedDays: number
  manualTakenDays: number
  adjustmentDays: number
}

export interface VacationBalanceInput extends VacationTrackerSettings {
  asOfDate: string
  recordedVacationDates: string[]
}

export interface VacationBalance {
  year: number
  entitlementDays: number
  carriedDays: number
  adjustmentDays: number
  recordedTakenDays: number
  recordedPlannedDays: number
  manualTakenDays: number
  takenDays: number
  availableBalanceDays: number
  projectedBalanceDays: number
  nextEntitlementDate: string
  nextEntitlementDays: number
  entitlementUsableFromDate: string
  canUseCurrentEntitlement: boolean
  isAdmissionYear: boolean
  completedContractMonths: number
  usesCompletedMonthPolicy: boolean
  hasValidEmploymentStartDate: boolean
}

export const defaultVacationTrackerSettings: VacationTrackerSettings = {
  employmentStartDate: '',
  annualEntitlementDays: 22,
  carriedDays: 0,
  manualTakenDays: 0,
  adjustmentDays: 0,
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

interface DateParts {
  year: number
  month: number
  day: number
}

function parseDateKey(value: string): DateParts | null {
  const match = DATE_KEY_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function dateKey(parts: DateParts) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right)
}

function addMonthsClamped(value: string, months: number) {
  const parts = parseDateKey(value)
  if (!parts) return value

  const absoluteMonth = parts.year * 12 + (parts.month - 1) + months
  const targetYear = Math.floor(absoluteMonth / 12)
  const targetMonthIndex = absoluteMonth % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate()

  return dateKey({
    year: targetYear,
    month: targetMonthIndex + 1,
    day: Math.min(parts.day, lastDay),
  })
}

function completedMonthsBetween(startDate: string, endDate: string) {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)
  if (!start || !end || compareDateKeys(endDate, startDate) < 0) return 0

  let months = (end.year - start.year) * 12 + (end.month - start.month)
  if (months <= 0) return 0

  if (compareDateKeys(addMonthsClamped(startDate, months), endDate) > 0) months -= 1
  return Math.max(0, months)
}

function safeWholeDays(value: number, minimum = 0) {
  if (!Number.isFinite(value)) return minimum
  return Math.max(minimum, Math.round(value))
}

function uniqueVacationDatesForYear(dates: string[], year: number) {
  const prefix = `${year}-`
  return [...new Set(dates.filter((date) => parseDateKey(date) && date.startsWith(prefix)))]
}

export function calculateVacationBalance(input: VacationBalanceInput): VacationBalance {
  const asOf = parseDateKey(input.asOfDate)
  const start = parseDateKey(input.employmentStartDate)
  const year = asOf?.year ?? new Date().getFullYear()
  const annualEntitlementDays = safeWholeDays(input.annualEntitlementDays, 22)
  const carriedDays = safeWholeDays(input.carriedDays)
  const manualTakenDays = safeWholeDays(input.manualTakenDays)
  const adjustmentDays = Number.isFinite(input.adjustmentDays) ? Math.round(input.adjustmentDays) : 0
  const nextEntitlementDate = `${year + 1}-01-01`

  if (!asOf || !start || compareDateKeys(input.asOfDate, input.employmentStartDate) < 0) {
    return {
      year,
      entitlementDays: 0,
      carriedDays,
      adjustmentDays,
      recordedTakenDays: 0,
      recordedPlannedDays: 0,
      manualTakenDays,
      takenDays: manualTakenDays,
      availableBalanceDays: carriedDays + adjustmentDays - manualTakenDays,
      projectedBalanceDays: carriedDays + adjustmentDays - manualTakenDays,
      nextEntitlementDate,
      nextEntitlementDays: annualEntitlementDays,
      entitlementUsableFromDate: input.employmentStartDate || `${year}-01-01`,
      canUseCurrentEntitlement: false,
      isAdmissionYear: false,
      completedContractMonths: 0,
      usesCompletedMonthPolicy: false,
      hasValidEmploymentStartDate: Boolean(start),
    }
  }

  const isAdmissionYear = start.year === year
  const completedContractMonths = completedMonthsBetween(input.employmentStartDate, input.asOfDate)
  const sixMonthAnniversary = addMonthsClamped(input.employmentStartDate, 6)
  const yearStart = `${year}-01-01`
  const entitlementUsableFromDate =
    year <= start.year + 1 && compareDateKeys(sixMonthAnniversary, yearStart) > 0
      ? sixMonthAnniversary
      : yearStart

  const entitlementDays = isAdmissionYear
    ? Math.min(20, completedContractMonths * 2)
    : annualEntitlementDays

  const currentYearVacationDates = uniqueVacationDatesForYear(input.recordedVacationDates, year)
  const recordedTakenDays = currentYearVacationDates.filter(
    (date) => compareDateKeys(date, input.asOfDate) <= 0,
  ).length
  const recordedPlannedDays = currentYearVacationDates.filter(
    (date) => compareDateKeys(date, input.asOfDate) > 0,
  ).length
  const takenDays = recordedTakenDays + manualTakenDays
  const availableBalanceDays = entitlementDays + carriedDays + adjustmentDays - takenDays
  const projectedBalanceDays = availableBalanceDays - recordedPlannedDays

  return {
    year,
    entitlementDays,
    carriedDays,
    adjustmentDays,
    recordedTakenDays,
    recordedPlannedDays,
    manualTakenDays,
    takenDays,
    availableBalanceDays,
    projectedBalanceDays,
    nextEntitlementDate,
    nextEntitlementDays: annualEntitlementDays,
    entitlementUsableFromDate,
    canUseCurrentEntitlement: compareDateKeys(input.asOfDate, entitlementUsableFromDate) >= 0,
    isAdmissionYear,
    completedContractMonths,
    usesCompletedMonthPolicy: isAdmissionYear,
    hasValidEmploymentStartDate: true,
  }
}
