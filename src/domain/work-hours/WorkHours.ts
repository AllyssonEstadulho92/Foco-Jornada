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
export type WorkRecordSource = 'manual' | 'jornada'
export type WorkProofType =
  | 'nao_indicado'
  | 'autodeclaracao_doenca'
  | 'cit'
  | 'declaracao_medica'
  | 'outro'

export interface ClockInterval {
  start: string
  end: string
}

export interface WorkHoursEntryInput {
  date: string
  plannedStart: string
  plannedEnd: string
  plannedBreakMinutes: number
  plannedBreaks?: ClockInterval[]
  /** False quando a configuração do calendário define o dia como folga/sem trabalho planeado. */
  plannedWorkingDay?: boolean
  actualStart: string
  actualEnd: string
  actualBreakMinutes: number
  actualBreaks?: ClockInterval[]
  actualSegments?: ClockInterval[]
  reason: WorkOccurrenceReason
  payTreatment: PayTreatment
  occurrenceStart?: string
  occurrenceEnd?: string
  proofType?: WorkProofType
  source?: WorkRecordSource
  notes?: string
}

export interface WorkHoursEntry extends WorkHoursEntryInput {
  id: string
  createdAt: string
}

export interface WorkHoursCalculation {
  plannedMinutes: number
  presenceMinutes: number
  workedMinutes: number
  scheduledWorkedMinutes: number
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

export const WORK_PROOF_LABELS: Record<WorkProofType, string> = {
  nao_indicado: 'Não indicado',
  autodeclaracao_doenca: 'Autodeclaração de doença (ADD)',
  cit: 'CIT / baixa médica',
  declaracao_medica: 'Declaração / comprovativo médico',
  outro: 'Outro comprovativo',
}

interface NumericInterval {
  start: number
  end: number
}

function clockToMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

function safeMinutes(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

function mergeIntervals(intervals: NumericInterval[]): NumericInterval[] {
  const sorted = intervals
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start)

  const merged: NumericInterval[] = []
  for (const current of sorted) {
    const last = merged[merged.length - 1]
    if (!last || current.start > last.end) {
      merged.push({ ...current })
    } else {
      last.end = Math.max(last.end, current.end)
    }
  }
  return merged
}

function totalDuration(intervals: NumericInterval[]) {
  return mergeIntervals(intervals).reduce((sum, item) => sum + (item.end - item.start), 0)
}

function subtractIntervals(base: NumericInterval[], cuts: NumericInterval[]): NumericInterval[] {
  let result = mergeIntervals(base)
  for (const cut of mergeIntervals(cuts)) {
    const next: NumericInterval[] = []
    for (const interval of result) {
      if (cut.end <= interval.start || cut.start >= interval.end) {
        next.push(interval)
        continue
      }
      if (cut.start > interval.start) next.push({ start: interval.start, end: Math.min(cut.start, interval.end) })
      if (cut.end < interval.end) next.push({ start: Math.max(cut.end, interval.start), end: interval.end })
    }
    result = next
  }
  return mergeIntervals(result)
}

function intersectionDuration(left: NumericInterval[], right: NumericInterval[]) {
  let total = 0
  const a = mergeIntervals(left)
  const b = mergeIntervals(right)
  for (const first of a) {
    for (const second of b) {
      const start = Math.max(first.start, second.start)
      const end = Math.min(first.end, second.end)
      if (end > start) total += end - start
    }
  }
  return total
}

function normalizeClockInterval(
  interval: ClockInterval,
  plannedStartMinutes: number,
  overnightShift: boolean,
): NumericInterval | null {
  const startRaw = clockToMinutes(interval.start)
  const endRaw = clockToMinutes(interval.end)
  if (startRaw === null || endRaw === null) return null

  let start = startRaw
  let end = endRaw
  if (overnightShift && start < plannedStartMinutes) start += 24 * 60
  if (overnightShift && end < plannedStartMinutes) end += 24 * 60
  // Horas iguais representam duração zero. Só uma saída realmente anterior à entrada atravessa a meia-noite.
  if (end < start) end += 24 * 60
  return { start, end }
}

function normalizeIntervals(
  intervals: ClockInterval[] | undefined,
  plannedStartMinutes: number,
  overnightShift: boolean,
) {
  return mergeIntervals(
    (intervals ?? [])
      .map((item) => normalizeClockInterval(item, plannedStartMinutes, overnightShift))
      .filter((item): item is NumericInterval => item !== null),
  )
}

function presenceFromLegacyTimes(
  startValue: string,
  endValue: string,
  plannedStartMinutes: number,
  overnightShift: boolean,
): NumericInterval[] {
  if (!startValue || !endValue) return []
  const interval = normalizeClockInterval(
    { start: startValue, end: endValue },
    plannedStartMinutes,
    overnightShift,
  )
  return interval ? [interval] : []
}

export function calculateWorkHours(input: WorkHoursEntryInput): WorkHoursCalculation {
  const plannedStartRaw = clockToMinutes(input.plannedStart)
  const plannedEndRaw = clockToMinutes(input.plannedEnd)
  if (plannedStartRaw === null || plannedEndRaw === null) {
    return {
      plannedMinutes: 0,
      presenceMinutes: 0,
      workedMinutes: 0,
      scheduledWorkedMinutes: 0,
      nonWorkedMinutes: 0,
      overtimeMinutes: 0,
      balanceMinutes: 0,
      occurrenceMinutes: 0,
      consideredMinutes: 0,
    }
  }

  const plannedWorkingDay = input.plannedWorkingDay !== false
  const overnightShift = plannedWorkingDay && plannedEndRaw < plannedStartRaw
  const plannedEnd = overnightShift ? plannedEndRaw + 24 * 60 : plannedEndRaw
  const plannedShift: NumericInterval[] = plannedWorkingDay && plannedEnd > plannedStartRaw
    ? [{ start: plannedStartRaw, end: plannedEnd }]
    : []
  const exactPlannedBreaks = normalizeIntervals(input.plannedBreaks, plannedStartRaw, overnightShift)
  const hasExactPlannedBreaks = Array.isArray(input.plannedBreaks)
  const plannedWorkIntervals = hasExactPlannedBreaks
    ? subtractIntervals(plannedShift, exactPlannedBreaks)
    : plannedShift
  const plannedMinutes = hasExactPlannedBreaks
    ? totalDuration(plannedWorkIntervals)
    : Math.max(0, totalDuration(plannedShift) - safeMinutes(input.plannedBreakMinutes))

  const actualPresence = input.actualSegments?.length
    ? normalizeIntervals(input.actualSegments, plannedStartRaw, overnightShift)
    : presenceFromLegacyTimes(input.actualStart, input.actualEnd, plannedStartRaw, overnightShift)
  const presenceMinutes = totalDuration(actualPresence)

  const occurrenceIntervals = input.occurrenceStart && input.occurrenceEnd
    ? normalizeIntervals(
        [{ start: input.occurrenceStart, end: input.occurrenceEnd }],
        plannedStartRaw,
        overnightShift,
      )
    : []
  const exactActualBreaks = normalizeIntervals(input.actualBreaks, plannedStartRaw, overnightShift)
  const hasExactActualBreaks = Array.isArray(input.actualBreaks)

  const presenceWithoutOccurrence = subtractIntervals(actualPresence, occurrenceIntervals)
  const exactWorkIntervals = subtractIntervals(presenceWithoutOccurrence, exactActualBreaks)
  const workedMinutes = hasExactActualBreaks
    ? totalDuration(exactWorkIntervals)
    : Math.max(0, totalDuration(presenceWithoutOccurrence) - safeMinutes(input.actualBreakMinutes))

  let scheduledWorkedMinutes: number
  if (!plannedWorkingDay) {
    scheduledWorkedMinutes = 0
  } else if (hasExactPlannedBreaks && hasExactActualBreaks) {
    scheduledWorkedMinutes = intersectionDuration(exactWorkIntervals, plannedWorkIntervals)
  } else {
    const outsideScheduledShift = Math.max(
      0,
      totalDuration(presenceWithoutOccurrence) - intersectionDuration(presenceWithoutOccurrence, plannedShift),
    )
    scheduledWorkedMinutes = Math.max(0, Math.min(plannedMinutes, workedMinutes - outsideScheduledShift))
  }

  const nonWorkedMinutes = Math.max(0, plannedMinutes - scheduledWorkedMinutes)
  const overtimeMinutes = Math.max(0, workedMinutes - scheduledWorkedMinutes)
  const balanceMinutes = workedMinutes - plannedMinutes

  const occurrenceMinutes = occurrenceIntervals.length > 0
    ? hasExactPlannedBreaks
      ? intersectionDuration(occurrenceIntervals, plannedWorkIntervals)
      : Math.min(totalDuration(occurrenceIntervals), nonWorkedMinutes || totalDuration(occurrenceIntervals))
    : input.reason === 'normal'
      ? 0
      : nonWorkedMinutes

  const consideredMinutes = input.payTreatment === 'remunerada'
    ? workedMinutes + nonWorkedMinutes
    : workedMinutes

  return {
    plannedMinutes,
    presenceMinutes,
    workedMinutes,
    scheduledWorkedMinutes,
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