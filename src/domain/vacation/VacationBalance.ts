export interface VacationTrackerSettings {
  employmentStartDate: string
  annualEntitlementDays: number
  monthlyAccrualTargetDays: number
  carriedDays: number
  manualTakenDays: number
  adjustmentDays: number
}

export interface VacationBalanceInput extends VacationTrackerSettings {
  asOfDate: string
  asOfDayProgress?: number
  recordedVacationDates: string[]
}

export interface VacationMonthlyAccrualMonth {
  month: number
  monthEndDate: string
  cumulativeDays: number
  completed: boolean
  current: boolean
  progress: number
  progressPercent: number
  earnedDays: number
  remainingDays: number
  liveCumulativeDays: number
}

export interface VacationBalance {
  year: number
  entitlementDays: number
  carriedDays: number
  adjustmentDays: number
  recordedTakenDays: number
  recordedPlannedDays: number
  recordedIgnoredWeekendDays: number
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
  monthlyAccrualTargetDays: number
  monthlyAccrualPerMonth: number
  completedAccrualMonths: number
  monthlyAccruedDays: number
  monthlyAvailableBalanceDays: number
  monthlyProjectedBalanceDays: number
  monthlyLiveAccruedDays: number
  monthlyLiveAvailableBalanceDays: number
  monthlyLiveProjectedBalanceDays: number
  currentAccrualMonthProgress: number
  currentAccrualMonthProgressPercent: number
  currentAccrualMonthEarnedDays: number
  currentAccrualMonthRemainingDays: number
  currentAccrualMonthDailyRate: number
  currentAccrualMonthEndDate: string
  currentAccrualMonthTargetCumulativeDays: number
  monthlyAccrualSchedule: VacationMonthlyAccrualMonth[]
}

export const defaultVacationTrackerSettings: VacationTrackerSettings = {
  employmentStartDate: '',
  annualEntitlementDays: 22,
  monthlyAccrualTargetDays: 28,
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

function safeDecimalDays(value: number, fallback: number, minimum = 0) {
  if (!Number.isFinite(value)) return fallback
  return Math.max(minimum, value)
}

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function roundDays(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function roundLiveDays(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function resolvedDayProgress(value: number | undefined) {
  return value === undefined ? 1 : clampUnit(value)
}

function daysInMonth(parts: DateParts) {
  return new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate()
}

function completedCalendarMonths(asOf: DateParts, dayProgress: number) {
  const lastDayOfMonth = daysInMonth(asOf)
  const currentMonthCompleted = asOf.day >= lastDayOfMonth && dayProgress >= 1
  return Math.min(12, asOf.month - 1 + (currentMonthCompleted ? 1 : 0))
}

function currentMonthProgress(asOf: DateParts, dayProgress: number) {
  const totalDays = daysInMonth(asOf)
  const elapsedCalendarDays = asOf.day - 1 + dayProgress
  return clampUnit(elapsedCalendarDays / totalDays)
}

function buildMonthlyAccrualSchedule(
  asOf: DateParts,
  targetDays: number,
  dayProgress: number,
): VacationMonthlyAccrualMonth[] {
  const completedMonths = completedCalendarMonths(asOf, dayProgress)
  const currentProgress = currentMonthProgress(asOf, dayProgress)
  const monthlyRate = targetDays / 12

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const lastDay = new Date(Date.UTC(asOf.year, month, 0)).getUTCDate()
    const current = month === asOf.month
    const completed = month <= completedMonths
    const progress = completed ? 1 : current ? currentProgress : 0
    const earnedDays = roundLiveDays(monthlyRate * progress)
    const remainingDays = roundLiveDays(monthlyRate * (1 - progress))
    const liveCumulativeDays = completed
      ? roundLiveDays((targetDays * month) / 12)
      : current
        ? roundLiveDays((targetDays * (month - 1 + progress)) / 12)
        : 0

    return {
      month,
      monthEndDate: dateKey({ year: asOf.year, month, day: lastDay }),
      cumulativeDays: roundDays((targetDays * month) / 12),
      completed,
      current,
      progress,
      progressPercent: roundPercent(progress * 100),
      earnedDays,
      remainingDays,
      liveCumulativeDays,
    }
  })
}

function uniqueVacationDatesForYear(dates: string[], year: number) {
  const prefix = `${year}-`
  return [...new Set(dates.filter((date) => parseDateKey(date) && date.startsWith(prefix)))]
}

function isStandardWeekday(date: string) {
  const parts = parseDateKey(date)
  if (!parts) return false

  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

export function calculateVacationBalance(input: VacationBalanceInput): VacationBalance {
  const asOf = parseDateKey(input.asOfDate)
  const start = parseDateKey(input.employmentStartDate)
  const year = asOf?.year ?? new Date().getFullYear()
  const dayProgress = resolvedDayProgress(input.asOfDayProgress)
  const annualEntitlementDays = safeWholeDays(input.annualEntitlementDays, 22)
  const monthlyAccrualTargetDays = safeDecimalDays(input.monthlyAccrualTargetDays, 28, 1)
  const carriedDays = safeWholeDays(input.carriedDays)
  const manualTakenDays = safeWholeDays(input.manualTakenDays)
  const adjustmentDays = Number.isFinite(input.adjustmentDays) ? Math.round(input.adjustmentDays) : 0
  const nextEntitlementDate = `${year + 1}-01-01`
  const completedAccrualMonths = asOf ? completedCalendarMonths(asOf, dayProgress) : 0
  const monthlyAccrualPerMonth = roundDays(monthlyAccrualTargetDays / 12)
  const monthlyAccruedDays = roundDays((monthlyAccrualTargetDays * completedAccrualMonths) / 12)
  const currentAccrualMonthProgress = asOf ? currentMonthProgress(asOf, dayProgress) : 0
  const currentAccrualMonthProgressPercent = roundPercent(currentAccrualMonthProgress * 100)
  const currentAccrualMonthEarnedDays = roundLiveDays(
    (monthlyAccrualTargetDays / 12) * currentAccrualMonthProgress,
  )
  const currentAccrualMonthRemainingDays = roundLiveDays(
    (monthlyAccrualTargetDays / 12) * (1 - currentAccrualMonthProgress),
  )
  const currentMonthDays = asOf ? daysInMonth(asOf) : 1
  const currentAccrualMonthDailyRate = roundLiveDays(monthlyAccrualTargetDays / 12 / currentMonthDays)
  const currentAccrualMonthEndDate = asOf
    ? dateKey({ year: asOf.year, month: asOf.month, day: currentMonthDays })
    : `${year}-12-31`
  const currentAccrualMonthTargetCumulativeDays = asOf
    ? roundDays((monthlyAccrualTargetDays * asOf.month) / 12)
    : 0
  const monthlyLiveAccruedDays = asOf
    ? roundLiveDays(
        (monthlyAccrualTargetDays * (asOf.month - 1 + currentAccrualMonthProgress)) / 12,
      )
    : 0
  const monthlyAccrualSchedule = asOf
    ? buildMonthlyAccrualSchedule(asOf, monthlyAccrualTargetDays, dayProgress)
    : []
  const currentYearVacationDates = uniqueVacationDatesForYear(input.recordedVacationDates, year)
  const standardWorkingVacationDates = currentYearVacationDates.filter(isStandardWeekday)
  const recordedIgnoredWeekendDays = currentYearVacationDates.length - standardWorkingVacationDates.length
  const recordedTakenDays = asOf
    ? standardWorkingVacationDates.filter((date) => compareDateKeys(date, input.asOfDate) <= 0).length
    : 0
  const recordedPlannedDays = asOf
    ? standardWorkingVacationDates.filter((date) => compareDateKeys(date, input.asOfDate) > 0).length
    : 0
  const takenDays = recordedTakenDays + manualTakenDays
  const monthlyLiveAvailableBalanceDays = roundLiveDays(
    monthlyLiveAccruedDays + carriedDays + adjustmentDays - takenDays,
  )
  const monthlyLiveProjectedBalanceDays = roundLiveDays(
    monthlyLiveAvailableBalanceDays - recordedPlannedDays,
  )

  if (!asOf || !start || compareDateKeys(input.asOfDate, input.employmentStartDate) < 0) {
    const monthlyAvailableBalanceDays = roundDays(
      monthlyAccruedDays + carriedDays + adjustmentDays - takenDays,
    )

    return {
      year,
      entitlementDays: 0,
      carriedDays,
      adjustmentDays,
      recordedTakenDays,
      recordedPlannedDays,
      recordedIgnoredWeekendDays,
      manualTakenDays,
      takenDays,
      availableBalanceDays: carriedDays + adjustmentDays - takenDays,
      projectedBalanceDays: carriedDays + adjustmentDays - takenDays - recordedPlannedDays,
      nextEntitlementDate,
      nextEntitlementDays: annualEntitlementDays,
      entitlementUsableFromDate: input.employmentStartDate || `${year}-01-01`,
      canUseCurrentEntitlement: false,
      isAdmissionYear: false,
      completedContractMonths: 0,
      usesCompletedMonthPolicy: false,
      hasValidEmploymentStartDate: Boolean(start),
      monthlyAccrualTargetDays,
      monthlyAccrualPerMonth,
      completedAccrualMonths,
      monthlyAccruedDays,
      monthlyAvailableBalanceDays,
      monthlyProjectedBalanceDays: roundDays(monthlyAvailableBalanceDays - recordedPlannedDays),
      monthlyLiveAccruedDays,
      monthlyLiveAvailableBalanceDays,
      monthlyLiveProjectedBalanceDays,
      currentAccrualMonthProgress,
      currentAccrualMonthProgressPercent,
      currentAccrualMonthEarnedDays,
      currentAccrualMonthRemainingDays,
      currentAccrualMonthDailyRate,
      currentAccrualMonthEndDate,
      currentAccrualMonthTargetCumulativeDays,
      monthlyAccrualSchedule,
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

  const availableBalanceDays = entitlementDays + carriedDays + adjustmentDays - takenDays
  const projectedBalanceDays = availableBalanceDays - recordedPlannedDays
  const monthlyAvailableBalanceDays = roundDays(
    monthlyAccruedDays + carriedDays + adjustmentDays - takenDays,
  )
  const monthlyProjectedBalanceDays = roundDays(monthlyAvailableBalanceDays - recordedPlannedDays)

  return {
    year,
    entitlementDays,
    carriedDays,
    adjustmentDays,
    recordedTakenDays,
    recordedPlannedDays,
    recordedIgnoredWeekendDays,
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
    monthlyAccrualTargetDays,
    monthlyAccrualPerMonth,
    completedAccrualMonths,
    monthlyAccruedDays,
    monthlyAvailableBalanceDays,
    monthlyProjectedBalanceDays,
    monthlyLiveAccruedDays,
    monthlyLiveAvailableBalanceDays,
    monthlyLiveProjectedBalanceDays,
    currentAccrualMonthProgress,
    currentAccrualMonthProgressPercent,
    currentAccrualMonthEarnedDays,
    currentAccrualMonthRemainingDays,
    currentAccrualMonthDailyRate,
    currentAccrualMonthEndDate,
    currentAccrualMonthTargetCumulativeDays,
    monthlyAccrualSchedule,
  }
}
