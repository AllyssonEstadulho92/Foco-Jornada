export type WorkOccurrenceReason =
  | 'normal'
  | 'doenca'
  | 'consulta_medica'
  | 'saida_autorizada'
  | 'falta_justificada'
  | 'falta_injustificada'
  | 'ferias'
  | 'feriado'
  | 'folga'
  | 'outro'

export type PayTreatment = 'apenas_registo' | 'remunerada' | 'nao_remunerada'

export interface WorkHoursEntryInput {
  date: string
  plannedStart: string
  plannedEnd: string
  plannedBreakMinutes: number
  actualStart: string
  actualEnd: string
  actualBreakMinutes: number
  reason: WorkOccurrenceReason
  payTreatment: PayTreatment
  occurrenceStart?: string
  occurrenceEnd?: string
  notes?: string
}

export interface WorkHoursEntry extends WorkHoursEntryInput {
  id: string
  createdAt: string
}

export interface WorkHoursCalculation {
  plannedMinutes: number
  workedMinutes: number
  nonWorkedMinutes: number
  overtimeMinutes: number
  balanceMinutes: number
  occurrenceMinutes: number
  consideredMinutes: number
}

export const OCCURRENCE_LABELS: Record<WorkOccurrenceReason, string> = {
  normal: 'Dia normal',
  doenca: 'Doença / indisposição',
  consulta_medica: 'Consulta / assistência médica',
  saida_autorizada: 'Saída antecipada autorizada',
  falta_justificada: 'Falta justificada',
  falta_injustificada: 'Falta injustificada',
  ferias: 'Férias',
  feriado: 'Feriado',
  folga: 'Folga',
  outro: 'Outro motivo',
}

export const PAY_TREATMENT_LABELS: Record<PayTreatment, string> = {
  apenas_registo: 'Apenas registo — sem presumir impacto salarial',
  remunerada: 'Considerar remunerada para estimativa',
  nao_remunerada: 'Considerar não remunerada para estimativa',
}

function clockToMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

function durationBetween(start: string, end: string): number {
  const startMinutes = clockToMinutes(start)
  const endMinutes = clockToMinutes(end)
  if (startMinutes === null || endMinutes === null) return 0
  const adjustedEnd = endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes
  return Math.max(0, adjustedEnd - startMinutes)
}

function safeMinutes(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

export function calculateWorkHours(input: WorkHoursEntryInput): WorkHoursCalculation {
  const plannedGross = durationBetween(input.plannedStart, input.plannedEnd)
  const plannedMinutes = Math.max(0, plannedGross - safeMinutes(input.plannedBreakMinutes))

  const workedGross = input.actualStart && input.actualEnd
    ? durationBetween(input.actualStart, input.actualEnd)
    : 0
  const workedMinutes = Math.max(0, workedGross - safeMinutes(input.actualBreakMinutes))

  const nonWorkedMinutes = Math.max(0, plannedMinutes - workedMinutes)
  const overtimeMinutes = Math.max(0, workedMinutes - plannedMinutes)
  const balanceMinutes = workedMinutes - plannedMinutes

  const occurrenceMinutes = input.occurrenceStart && input.occurrenceEnd
    ? durationBetween(input.occurrenceStart, input.occurrenceEnd)
    : nonWorkedMinutes

  const consideredMinutes = input.payTreatment === 'remunerada'
    ? workedMinutes + nonWorkedMinutes
    : workedMinutes

  return {
    plannedMinutes,
    workedMinutes,
    nonWorkedMinutes,
    overtimeMinutes,
    balanceMinutes,
    occurrenceMinutes,
    consideredMinutes,
  }
}

export function formatHoursMinutes(totalMinutes: number) {
  const sign = totalMinutes < 0 ? '-' : ''
  const absolute = Math.abs(Math.round(totalMinutes))
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
