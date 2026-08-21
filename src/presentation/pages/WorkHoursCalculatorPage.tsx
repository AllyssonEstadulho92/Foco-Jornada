import { useEffect, useMemo, useState } from 'react'
import {
  calculateWorkHours,
  formatHoursMinutes,
  OCCURRENCE_LABELS,
  PAY_TREATMENT_LABELS,
  type PayTreatment,
  type WorkHoursEntryInput,
  type WorkOccurrenceReason,
} from '../../domain/work-hours/WorkHours'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useSettingsController } from '../hooks/useSettingsController'
import { pushAppNotification } from '../store/useNotificationStore'
import { useWorkHoursStore } from '../store/useWorkHoursStore'

function plannedBreakMinutes(start: string, end: string, enabled: boolean) {
  if (!enabled || !start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  return Math.max(0, endMinutes - startMinutes)
}

export function WorkHoursCalculatorPage() {
  const { settings } = useSettingsController()
  const entries = useWorkHoursStore((state) => state.entries)
  const addEntry = useWorkHoursStore((state) => state.add)
  const removeEntry = useWorkHoursStore((state) => state.remove)
  const clearMonth = useWorkHoursStore((state) => state.clearMonth)
  const today = toLocalDateKey(new Date())
  const [monthKey, setMonthKey] = useState(today.slice(0, 7))
  const [form, setForm] = useState<WorkHoursEntryInput>({
    date: today,
    plannedStart: '08:00',
    plannedEnd: '17:00',
    plannedBreakMinutes: 15,
    actualStart: '08:00',
    actualEnd: '17:00',
    actualBreakMinutes: 15,
    reason: 'normal',
    payTreatment: 'apenas_registo',
    occurrenceStart: '',
    occurrenceEnd: '',
    notes: '',
  })

  useEffect(() => {
    const schedule = settings.workSchedule
    const breakMinutes =
      plannedBreakMinutes(schedule.break1.startTime, schedule.break1.endTime, schedule.break1.enabled) +
      plannedBreakMinutes(schedule.break2.startTime, schedule.break2.endTime, schedule.break2.enabled)
    setForm((current) => ({
      ...current,
      plannedStart: schedule.startTime,
      plannedEnd: schedule.endTime,
      plannedBreakMinutes: breakMinutes,
    }))
  }, [settings.workSchedule])

  const calculation = useMemo(() => calculateWorkHours(form), [form])
  const monthEntries = useMemo(
    () => entries.filter((entry) => entry.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date)),
    [entries, monthKey],
  )

  const totals = useMemo(
    () =>
      monthEntries.reduce(
        (total, entry) => {
          const value = calculateWorkHours(entry)
          total.planned += value.plannedMinutes
          total.worked += value.workedMinutes
          total.nonWorked += value.nonWorkedMinutes
          total.overtime += value.overtimeMinutes
          total.considered += value.consideredMinutes
          return total
        },
        { planned: 0, worked: 0, nonWorked: 0, overtime: 0, considered: 0 },
      ),
    [monthEntries],
  )

  function update<K extends keyof WorkHoursEntryInput>(key: K, value: WorkHoursEntryInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function loadSicknessExample() {
    setForm((current) => ({
      ...current,
      date: today,
      actualStart: current.plannedStart,
      actualEnd: '14:00',
      actualBreakMinutes: current.plannedBreakMinutes,
      reason: 'doenca',
      payTreatment: 'apenas_registo',
      occurrenceStart: '14:00',
      occurrenceEnd: current.plannedEnd,
      notes: 'Exemplo: saída antecipada por doença/indisposição. Confirmar justificativo e tratamento salarial aplicável.',
    }))
  }

  function saveEntry(event: React.FormEvent) {
    event.preventDefault()
    addEntry(form)
    setMonthKey(form.date.slice(0, 7))
    pushAppNotification('success', 'Registo de horas guardado', `${form.date} · ${OCCURRENCE_LABELS[form.reason]}`)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Eliminar este registo de horas?')) return
    removeEntry(id)
    pushAppNotification('info', 'Registo eliminado', 'O registo foi removido da calculadora de horas.')
  }

  function handleClearMonth() {
    if (!monthEntries.length) return
    if (!window.confirm(`Eliminar todos os registos de ${monthKey}?`)) return
    clearMonth(monthKey)
    pushAppNotification('info', 'Mês limpo', `Foram removidos os registos de ${monthKey}.`)
  }

  return (
    <section className="reportPage workHoursPage" aria-labelledby="work-hours-title">
      <header className="reportHeader workHoursHeader">
        <div>
          <span className="eyebrow">TEMPO E OCORRÊNCIAS</span>
          <h1 id="work-hours-title">Calculadora de horas</h1>
          <p>Regista horas previstas, horas realmente trabalhadas, horas não trabalhadas, saídas antecipadas e o motivo da ocorrência.</p>
        </div>
      </header>

      <div className="workHoursSummary" aria-label="Resumo do cálculo atual">
        <article><span>Previstas</span><strong>{formatHoursMinutes(calculation.plannedMinutes)}</strong></article>
        <article><span>Trabalhadas</span><strong>{formatHoursMinutes(calculation.workedMinutes)}</strong></article>
        <article className="workHoursWarning"><span>Não trabalhadas</span><strong>{formatHoursMinutes(calculation.nonWorkedMinutes)}</strong></article>
        <article className="workHoursPositive"><span>Horas extra</span><strong>{formatHoursMinutes(calculation.overtimeMinutes)}</strong></article>
        <article><span>Saldo</span><strong>{formatHoursMinutes(calculation.balanceMinutes)}</strong></article>
      </div>

      <form className="workHoursForm" onSubmit={saveEntry}>
        <div className="workHoursSectionHeading">
          <div><span className="sectionKicker">REGISTO PROFISSIONAL</span><h2>Dia e horário</h2></div>
          <button type="button" className="workHoursExampleButton" onClick={loadSicknessExample}>Exemplo: saída por doença</button>
        </div>

        <div className="workHoursFieldGrid">
          <label><span>Data</span><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required /></label>
          <label><span>Entrada prevista</span><input type="time" value={form.plannedStart} onChange={(e) => update('plannedStart', e.target.value)} required /></label>
          <label><span>Saída prevista</span><input type="time" value={form.plannedEnd} onChange={(e) => update('plannedEnd', e.target.value)} required /></label>
          <label><span>Pausas previstas</span><div className="inputWithSuffix"><input type="number" min="0" max="600" value={form.plannedBreakMinutes} onChange={(e) => update('plannedBreakMinutes', Number(e.target.value))} /><span>min</span></div></label>
          <label><span>Entrada real</span><input type="time" value={form.actualStart} onChange={(e) => update('actualStart', e.target.value)} /></label>
          <label><span>Saída real</span><input type="time" value={form.actualEnd} onChange={(e) => update('actualEnd', e.target.value)} /></label>
          <label><span>Pausas reais</span><div className="inputWithSuffix"><input type="number" min="0" max="600" value={form.actualBreakMinutes} onChange={(e) => update('actualBreakMinutes', Number(e.target.value))} /><span>min</span></div></label>
          <label><span>Motivo / ocorrência</span><select value={form.reason} onChange={(e) => update('reason', e.target.value as WorkOccurrenceReason)}>{Object.entries(OCCURRENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Início da ocorrência</span><input type="time" value={form.occurrenceStart ?? ''} onChange={(e) => update('occurrenceStart', e.target.value)} /></label>
          <label><span>Fim da ocorrência</span><input type="time" value={form.occurrenceEnd ?? ''} onChange={(e) => update('occurrenceEnd', e.target.value)} /></label>
          <label className="workHoursWide"><span>Tratamento para estimativa</span><select value={form.payTreatment} onChange={(e) => update('payTreatment', e.target.value as PayTreatment)}>{Object.entries(PAY_TREATMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="workHoursWide"><span>Observações / justificativo</span><textarea rows={3} value={form.notes ?? ''} placeholder="Ex.: indisposição às 14:00, saída autorizada pela chefia, declaração médica entregue..." onChange={(e) => update('notes', e.target.value)} /></label>
        </div>

        <div className="workHoursResultPanel">
          <div><span>Ocorrência</span><strong>{formatHoursMinutes(calculation.occurrenceMinutes)}</strong></div>
          <div><span>Tempo considerado na estimativa</span><strong>{formatHoursMinutes(calculation.consideredMinutes)}</strong></div>
          <p>A classificação remunerada/não remunerada é manual. A aplicação não presume o enquadramento legal de doença, faltas ou justificações; esse tratamento depende do contrato, CCT, documentação e regras aplicáveis.</p>
        </div>

        <button className="actionButton actionButtonPrimary" type="submit">Guardar registo</button>
      </form>

      <section className="workHoursMonth" aria-labelledby="work-hours-month-title">
        <div className="workHoursSectionHeading">
          <div><span className="sectionKicker">ACUMULADO</span><h2 id="work-hours-month-title">Resumo mensal</h2></div>
          <div className="workHoursMonthActions"><input aria-label="Mês" type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} /><button type="button" onClick={handleClearMonth} disabled={!monthEntries.length}>Limpar mês</button></div>
        </div>

        <div className="workHoursMonthTotals">
          <div><span>Previstas</span><strong>{formatHoursMinutes(totals.planned)}</strong></div>
          <div><span>Trabalhadas</span><strong>{formatHoursMinutes(totals.worked)}</strong></div>
          <div><span>Não trabalhadas</span><strong>{formatHoursMinutes(totals.nonWorked)}</strong></div>
          <div><span>Extra</span><strong>{formatHoursMinutes(totals.overtime)}</strong></div>
          <div><span>Consideradas</span><strong>{formatHoursMinutes(totals.considered)}</strong></div>
        </div>

        {monthEntries.length === 0 ? <p className="workHoursEmpty">Ainda não existem registos neste mês.</p> : (
          <div className="workHoursEntries">
            {monthEntries.map((entry) => {
              const item = calculateWorkHours(entry)
              return <article key={entry.id}>
                <div className="workHoursEntryDate"><strong>{entry.date}</strong><span>{OCCURRENCE_LABELS[entry.reason]}</span></div>
                <div><span>Trabalhadas</span><strong>{formatHoursMinutes(item.workedMinutes)}</strong></div>
                <div><span>Não trabalhadas</span><strong>{formatHoursMinutes(item.nonWorkedMinutes)}</strong></div>
                <div><span>Saldo</span><strong>{formatHoursMinutes(item.balanceMinutes)}</strong></div>
                <button type="button" onClick={() => handleDelete(entry.id)} aria-label={`Eliminar registo de ${entry.date}`}>Eliminar</button>
                {entry.notes ? <p>{entry.notes}</p> : null}
              </article>
            })}
          </div>
        )}
      </section>
    </section>
  )
}
