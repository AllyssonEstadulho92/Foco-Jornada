import type { PayrollDayKind } from '../../../domain/payroll/Payroll'

type DayKindOption = { value: PayrollDayKind; label: string }
type WeekendOption = 'weekend-saturday' | 'weekend-sunday'

/** Identifica a data civil sem depender do fuso horário do dispositivo. */
export function payrollWeekday(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null
  return parsed.getUTCDay()
}

/** Sábado e domingo são opções de interface, nunca novos tipos gravados no plano salarial. */
export function payrollSelection(kind: PayrollDayKind, date: string): PayrollDayKind | WeekendOption {
  if (kind !== 'work') return kind
  const weekday = payrollWeekday(date)
  return weekday === 6 ? 'weekend-saturday' : weekday === 0 ? 'weekend-sunday' : 'work'
}

export function PayrollDayKindSelect({
  date,
  kind,
  options,
  onChange,
}: {
  date: string
  kind: PayrollDayKind
  options: DayKindOption[]
  onChange: (kind: PayrollDayKind) => void
}) {
  const weekday = payrollWeekday(date)
  const selected = payrollSelection(kind, date)

  function change(value: string) {
    if (value === 'weekend-saturday') {
      if (weekday === 6) onChange('work')
      return
    }
    if (value === 'weekend-sunday') {
      if (weekday === 0) onChange('work')
      return
    }
    if (options.some((option) => option.value === value)) onChange(value as PayrollDayKind)
  }

  return (
    <select value={selected} onChange={(event) => change(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
      <option value="weekend-saturday" disabled={weekday !== 6}>Sábado (trabalho normal)</option>
      <option value="weekend-sunday" disabled={weekday !== 0}>Domingo (trabalho normal)</option>
    </select>
  )
}
