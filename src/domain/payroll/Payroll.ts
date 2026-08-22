export type PayrollDayKind =
  | 'work'
  | 'rest'
  | 'holiday'
  | 'vacation'
  | 'absence-justified-paid'
  | 'absence-justified-unpaid'
  | 'absence-unjustified'

export interface PayrollDayPlan {
  date: string
  kind: PayrollDayKind
  overtimeHours: number
  /** Horas de ausência não remunerada apuradas ao minuto. Quando omitido num dia de falta integral, usa a duração diária contratual. */
  unpaidAbsenceHours?: number
  note?: string
}

export type IrsProfile2026 = 'table-1' | 'table-2' | 'table-3'
export type MealAllowanceMethod = 'cash' | 'card'

export interface PayrollConfig {
  baseSalary: number
  weeklyHours: number
  mealAllowancePerDay: number
  mealAllowanceMethod: MealAllowanceMethod
  socialSecurityRate: number
  irsProfile: IrsProfile2026
  dependents: number
  overtimeHoursBeforeMonth: number
  vacationSubsidy: number
  christmasSubsidy: number
  otherTaxableAllowances: number
  otherExemptAllowances: number
  otherDeductions: number
  paymentDay: number
  mealDaysOverride: number | null
  hourlyRateOverride: number | null
  absenceDeductionOverride: number | null
  overtimePayOverride: number | null
  socialSecurityOverride: number | null
  irsOverride: number | null
}

export interface PayrollResult {
  workDays: number
  mealDays: number
  restDays: number
  holidayDays: number
  vacationDays: number
  justifiedPaidAbsenceDays: number
  justifiedUnpaidAbsenceDays: number
  unjustifiedAbsenceDays: number
  unpaidAbsenceHours: number
  overtimeHours: number
  hourlyRate: number
  absenceDeduction: number
  overtimePay: number
  mealAllowanceGross: number
  mealAllowanceTaxable: number
  normalTaxableGross: number
  contributoryGross: number
  socialSecurity: number
  irsNormal: number
  irsOvertime: number
  irsVacation: number
  irsChristmas: number
  irsTotal: number
  grossTotal: number
  netEstimate: number
}

export const defaultPayrollConfig: PayrollConfig = {
  baseSalary: 920,
  weeklyHours: 40,
  mealAllowancePerDay: 6,
  mealAllowanceMethod: 'cash',
  socialSecurityRate: 11,
  irsProfile: 'table-1',
  dependents: 0,
  overtimeHoursBeforeMonth: 0,
  vacationSubsidy: 0,
  christmasSubsidy: 0,
  otherTaxableAllowances: 0,
  otherExemptAllowances: 0,
  otherDeductions: 0,
  paymentDay: 25,
  mealDaysOverride: null,
  hourlyRateOverride: null,
  absenceDeductionOverride: null,
  overtimePayOverride: null,
  socialSecurityOverride: null,
  irsOverride: null,
}
