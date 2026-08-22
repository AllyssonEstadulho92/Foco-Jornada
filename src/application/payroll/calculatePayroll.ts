import type {
  IrsProfile2026,
  PayrollConfig,
  PayrollDayPlan,
  PayrollResult,
} from '../../domain/payroll/Payroll'

type IrsRow = {
  max: number
  rate: number
  allowance: number | ((remuneration: number) => number)
  dependentAllowance: number
}

const TABLE_1: IrsRow[] = [
  { max: 920, rate: 0, allowance: 0, dependentAllowance: 0 },
  { max: 1042, rate: 0.125, allowance: (r) => 0.125 * 2.6 * (1273.85 - r), dependentAllowance: 21.43 },
  { max: 1108, rate: 0.157, allowance: (r) => 0.157 * 1.35 * (1554.83 - r), dependentAllowance: 21.43 },
  { max: 1154, rate: 0.157, allowance: 94.71, dependentAllowance: 21.43 },
  { max: 1212, rate: 0.212, allowance: 158.18, dependentAllowance: 21.43 },
  { max: 1819, rate: 0.241, allowance: 193.33, dependentAllowance: 21.43 },
  { max: 2119, rate: 0.311, allowance: 320.66, dependentAllowance: 21.43 },
  { max: 2499, rate: 0.349, allowance: 401.19, dependentAllowance: 21.43 },
  { max: 3305, rate: 0.3836, allowance: 487.66, dependentAllowance: 21.43 },
  { max: 5547, rate: 0.3969, allowance: 531.62, dependentAllowance: 21.43 },
  { max: 20221, rate: 0.4495, allowance: 823.4, dependentAllowance: 21.43 },
  { max: Number.POSITIVE_INFINITY, rate: 0.4717, allowance: 1272.31, dependentAllowance: 21.43 },
]

const TABLE_2: IrsRow[] = TABLE_1.map((row, index) => ({
  ...row,
  dependentAllowance: index === 0 ? 0 : 34.29,
}))

const TABLE_3: IrsRow[] = [
  { max: 991, rate: 0, allowance: 0, dependentAllowance: 0 },
  { max: 1042, rate: 0.125, allowance: (r) => 0.125 * 2.6 * (1372.15 - r), dependentAllowance: 42.86 },
  { max: 1108, rate: 0.125, allowance: (r) => 0.125 * 1.35 * (1677.85 - r), dependentAllowance: 42.86 },
  { max: 1119, rate: 0.125, allowance: 96.17, dependentAllowance: 42.86 },
  { max: 1432, rate: 0.1272, allowance: 98.64, dependentAllowance: 42.86 },
  { max: 1962, rate: 0.157, allowance: 141.32, dependentAllowance: 42.86 },
  { max: 2240, rate: 0.1938, allowance: 213.53, dependentAllowance: 42.86 },
  { max: 2773, rate: 0.2277, allowance: 289.47, dependentAllowance: 42.86 },
  { max: 3389, rate: 0.257, allowance: 370.72, dependentAllowance: 42.86 },
  { max: 5965, rate: 0.2881, allowance: 476.12, dependentAllowance: 42.86 },
  { max: 20265, rate: 0.3843, allowance: 1049.96, dependentAllowance: 42.86 },
  { max: Number.POSITIVE_INFINITY, rate: 0.4717, allowance: 2821.13, dependentAllowance: 42.86 },
]

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function manualValue(value: number | null, automaticValue: number) {
  return value === null ? automaticValue : round2(nonNegative(value))
}

function tableFor(profile: IrsProfile2026) {
  if (profile === 'table-2') return TABLE_2
  if (profile === 'table-3') return TABLE_3
  return TABLE_1
}

export function calculateIrs2026(remuneration: number, profile: IrsProfile2026, dependents: number) {
  const r = nonNegative(remuneration)
  if (r === 0) return 0

  const table = tableFor(profile)
  const row = table.find((item) => r <= item.max) ?? table.at(-1)!
  const allowance = typeof row.allowance === 'function' ? row.allowance(r) : row.allowance
  const adjustedRate = Math.max(0, row.rate - (dependents >= 3 ? 0.01 : 0))
  const result = r * adjustedRate - allowance - row.dependentAllowance * Math.max(0, dependents)
  return round2(Math.max(0, result))
}

function calculateOvertimePay(
  plans: PayrollDayPlan[],
  hourlyRateForCalculation: number,
  overtimeHoursBeforeMonth: number,
) {
  let annualHours = nonNegative(overtimeHoursBeforeMonth)
  let totalPay = 0
  let totalHours = 0

  function paySegment(hours: number, premiumUntil100: number, premiumAfter100: number) {
    const remaining = nonNegative(hours)
    if (remaining === 0) return

    const lowerRateCapacity = Math.max(0, 100 - annualHours)
    const lowerHours = Math.min(remaining, lowerRateCapacity)
    const higherHours = remaining - lowerHours

    totalPay += lowerHours * hourlyRateForCalculation * (1 + premiumUntil100)
    totalPay += higherHours * hourlyRateForCalculation * (1 + premiumAfter100)
    annualHours += remaining
    totalHours += remaining
  }

  plans
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((day) => {
      const hours = nonNegative(day.overtimeHours)
      if (hours === 0) return

      if (day.kind === 'work') {
        const firstHour = Math.min(1, hours)
        const followingHours = Math.max(0, hours - firstHour)
        paySegment(firstHour, 0.25, 0.5)
        paySegment(followingHours, 0.375, 0.75)
        return
      }

      paySegment(hours, 0.5, 1)
    })

  return { overtimePay: round2(totalPay), overtimeHours: round2(totalHours) }
}

export function calculatePayroll(config: PayrollConfig, plans: PayrollDayPlan[]): PayrollResult {
  const baseSalary = nonNegative(config.baseSalary)
  const weeklyHours = Math.max(1, nonNegative(config.weeklyHours))
  const automaticHourlyRateExact = (baseSalary * 12) / (52 * weeklyHours)
  const hourlyRateForCalculation =
    config.hourlyRateOverride === null
      ? automaticHourlyRateExact
      : nonNegative(config.hourlyRateOverride)
  const hourlyRate = round2(hourlyRateForCalculation)
  const dailyHours = weeklyHours / 5

  const workDays = plans.filter((day) => day.kind === 'work').length
  const automaticMealDays = plans.filter(
    (day) =>
      day.kind === 'work' ||
      ((day.kind === 'rest' || day.kind === 'holiday') && day.overtimeHours > 0),
  ).length
  const mealDays =
    config.mealDaysOverride === null
      ? automaticMealDays
      : Math.round(nonNegative(config.mealDaysOverride))
  const restDays = plans.filter((day) => day.kind === 'rest').length
  const holidayDays = plans.filter((day) => day.kind === 'holiday').length
  const vacationDays = plans.filter((day) => day.kind === 'vacation').length
  const justifiedPaidAbsenceDays = plans.filter(
    (day) => day.kind === 'absence-justified-paid',
  ).length
  const justifiedUnpaidAbsenceDays = plans.filter(
    (day) => day.kind === 'absence-justified-unpaid',
  ).length
  const unjustifiedAbsenceDays = plans.filter((day) => day.kind === 'absence-unjustified').length

  const unpaidAbsenceHours = round2(
    plans.reduce((total, day) => {
      if (Number.isFinite(day.unpaidAbsenceHours)) {
        return total + nonNegative(day.unpaidAbsenceHours ?? 0)
      }
      if (day.kind === 'absence-justified-unpaid' || day.kind === 'absence-unjustified') {
        return total + dailyHours
      }
      return total
    }, 0),
  )
  const automaticAbsenceDeduction = round2(unpaidAbsenceHours * hourlyRateForCalculation)
  const absenceDeduction = manualValue(
    config.absenceDeductionOverride,
    automaticAbsenceDeduction,
  )
  const automaticOvertime = calculateOvertimePay(
    plans,
    hourlyRateForCalculation,
    config.overtimeHoursBeforeMonth,
  )
  const overtimeHours = automaticOvertime.overtimeHours
  const overtimePay = manualValue(config.overtimePayOverride, automaticOvertime.overtimePay)

  const mealAllowanceGross = round2(mealDays * nonNegative(config.mealAllowancePerDay))
  const mealExemptDailyLimit = config.mealAllowanceMethod === 'card' ? 10.46 : 6.15
  const mealAllowanceTaxable = round2(
    mealDays * Math.max(0, nonNegative(config.mealAllowancePerDay) - mealExemptDailyLimit),
  )

  const normalTaxableGross = round2(
    Math.max(0, baseSalary - absenceDeduction) +
      nonNegative(config.otherTaxableAllowances) +
      mealAllowanceTaxable,
  )

  const vacationSubsidy = nonNegative(config.vacationSubsidy)
  const christmasSubsidy = nonNegative(config.christmasSubsidy)
  const contributoryGross = round2(
    normalTaxableGross + overtimePay + vacationSubsidy + christmasSubsidy,
  )
  const automaticSocialSecurity = round2(
    contributoryGross * (nonNegative(config.socialSecurityRate) / 100),
  )
  const socialSecurity = manualValue(config.socialSecurityOverride, automaticSocialSecurity)

  const automaticIrsNormal = calculateIrs2026(
    normalTaxableGross,
    config.irsProfile,
    config.dependents,
  )
  const normalEffectiveRate =
    normalTaxableGross > 0 ? automaticIrsNormal / normalTaxableGross : 0
  const automaticIrsOvertime = round2(overtimePay * normalEffectiveRate * 0.5)
  const automaticIrsVacation = calculateIrs2026(
    vacationSubsidy,
    config.irsProfile,
    config.dependents,
  )
  const automaticIrsChristmas = calculateIrs2026(
    christmasSubsidy,
    config.irsProfile,
    config.dependents,
  )

  const hasManualIrs = config.irsOverride !== null
  const irsNormal = hasManualIrs ? manualValue(config.irsOverride, 0) : automaticIrsNormal
  const irsOvertime = hasManualIrs ? 0 : automaticIrsOvertime
  const irsVacation = hasManualIrs ? 0 : automaticIrsVacation
  const irsChristmas = hasManualIrs ? 0 : automaticIrsChristmas
  const irsTotal = round2(irsNormal + irsOvertime + irsVacation + irsChristmas)

  const grossTotal = round2(
    Math.max(0, baseSalary - absenceDeduction) +
      mealAllowanceGross +
      overtimePay +
      vacationSubsidy +
      christmasSubsidy +
      nonNegative(config.otherTaxableAllowances) +
      nonNegative(config.otherExemptAllowances),
  )

  const netEstimate = round2(
    grossTotal - socialSecurity - irsTotal - nonNegative(config.otherDeductions),
  )

  return {
    workDays,
    mealDays,
    restDays,
    holidayDays,
    vacationDays,
    justifiedPaidAbsenceDays,
    justifiedUnpaidAbsenceDays,
    unjustifiedAbsenceDays,
    unpaidAbsenceHours,
    overtimeHours,
    hourlyRate,
    absenceDeduction,
    overtimePay,
    mealAllowanceGross,
    mealAllowanceTaxable,
    normalTaxableGross,
    contributoryGross,
    socialSecurity,
    irsNormal,
    irsOvertime,
    irsVacation,
    irsChristmas,
    irsTotal,
    grossTotal,
    netEstimate,
  }
}
