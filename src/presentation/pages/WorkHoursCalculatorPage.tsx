import { useEffect, useMemo, useState } from 'react'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import {
  calculateWorkHours,
  formatHoursMinutes,
  OCCURRENCE_LABELS,
  PAY_TREATMENT_LABELS,
  WORK_PROOF_LABELS,
  type ClockInterval,
  type PayTreatment,
  type WorkHoursEntry,
  type WorkHoursEntryInput,
  type WorkOccurrenceReason,
  type WorkProofType,
} from '../../domain/work-hours/WorkHours'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useSettingsController } from '../hooks/useSettingsController'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'
import { useWorkHoursStore } from '../store/useWorkHoursStore'

function intervalMinutes(start: string, end: string) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  let endMinutes = eh * 60 + em
  if (endMinutes < startMinutes) endMinutes += 24 * 60
  return Math.max(0, endMinutes - startMinutes)
}

function totalIntervalMinutes(intervals: ClockInterval[]) {
  return intervals.reduce((sum, item) => sum + intervalMinutes(item.start, item.end), 0)
}

function clockFromIso(value: string) {
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function isClockBefore(left: string, right: string) {
  return left.localeCompare(right) < 0
}

export function WorkHoursCalculatorPage() {
  const services = useAppServices()
  const { settings } = useSettingsController()
  const entries = useWorkHoursStore((state) => state.entries)
  const addEntry = useWorkHoursStore((state) => state.add)
  const updateEntry = useWorkHoursStore((state) => state.update)
  const removeEntry = useWorkHoursStore((state) => state.remove)
  const clearMonth = useWorkHoursStore((state) => state.clearMonth)
  const today = toLocalDateKey(new Date())
  const [monthKey, setMonthKey] = useState(today.slice(0, 7))
  const [isImporting, setIsImporting] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [form, setForm] = useState<WorkHoursEntryInput>({
    date: today,
    plannedStart: '08:00',
    plannedEnd: '17:00',
    plannedBreakMinutes: 15,
    plannedBreaks: [{ start: '12:00', end: '12:15' }],
    actualStart: '08:00',
    actualEnd: '17:00',
    actualBreakMinutes: 15,
    reason: 'normal',
    payTreatment: 'apenas_registo',
    proofType: 'nao_indicado',
    source: 'manual',
    occurrenceStart: '',
    occurrenceEnd: '',
    notes: '',
  })

  useEffect(() => {
    if (editingEntryId) return

    const schedule = settings.workSchedule
    const resolvedSchedule = resolveWorkScheduleForDate(schedule, form.date)
    const plannedBreaks: ClockInterval[] = [schedule.break1, schedule.break2]
      .filter(
        (item) =>
          item.enabled &&
          item.startTime >= resolvedSchedule.startTime &&
          item.endTime <= resolvedSchedule.endTime,
      )
      .map((item) => ({ start: item.startTime, end: item.endTime }))
    const breakMinutes = totalIntervalMinutes(plannedBreaks)

    setForm((current) => ({
      ...current,
      plannedStart: resolvedSchedule.startTime,
      plannedEnd: resolvedSchedule.endTime,
      plannedBreakMinutes: breakMinutes,
      plannedBreaks,
      actualStart: current.source === 'manual' ? resolvedSchedule.startTime : current.actualStart,
      actualEnd: current.source === 'manual' ? resolvedSchedule.endTime : current.actualEnd,
      actualBreakMinutes: current.source === 'manual' ? breakMinutes : current.actualBreakMinutes,
    }))
  }, [editingEntryId, form.date, settings.workSchedule])

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
          if (entry.reason === 'doenca') total.illness += value.nonWorkedMinutes
          return total
        },
        { planned: 0, worked: 0, nonWorked: 0, overtime: 0, considered: 0, illness: 0 },
      ),
    [monthEntries],
  )

  function update<K extends keyof WorkHoursEntryInput>(key: K, value: WorkHoursEntryInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updatePlan(
    key: 'plannedStart' | 'plannedEnd' | 'plannedBreakMinutes',
    value: string | number,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      plannedBreaks: undefined,
      source: 'manual',
    }))
  }

  function updateActual(
    key: 'actualStart' | 'actualEnd' | 'actualBreakMinutes',
    value: string | number,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      actualSegments: undefined,
      actualBreaks: undefined,
      source: 'manual',
    }))
  }

  function markSicknessFromActual() {
    setForm((current) => ({
      ...current,
      reason: 'doenca',
      proofType: current.proofType ?? 'nao_indicado',
      occurrenceStart: current.actualEnd || current.plannedStart,
      occurrenceEnd: current.plannedEnd,
      payTreatment: 'apenas_registo',
      notes: current.notes || 'Saída antecipada por doença/indisposição. Registar o comprovativo aplicável, se existir.',
    }))
  }

  function loadSicknessExample() {
    setForm((current) => {
      const actualBreaks = (current.plannedBreaks ?? []).filter((item) => isClockBefore(item.start, '14:00'))
      return {
        ...current,
        date: today,
        actualStart: current.plannedStart,
        actualEnd: '14:00',
        actualBreakMinutes: totalIntervalMinutes(actualBreaks),
        actualBreaks,
        actualSegments: undefined,
        reason: 'doenca',
        proofType: 'nao_indicado',
        source: 'manual',
        payTreatment: 'apenas_registo',
        occurrenceStart: '14:00',
        occurrenceEnd: current.plannedEnd,
        notes: 'Exemplo: saída antecipada por doença/indisposição às 14:00.',
      }
    })
  }

  async function importDayRecord() {
    try {
      setIsImporting(true)
      const report = await buildDayReport({
        journeyRepository: services.journeyRepository,
        breakRepository: services.breakRepository,
        activityRepository: services.activityRepository,
        focusRepository: services.focusRepository,
        coffeeRepository: services.coffeeRepository,
        date: form.date,
      })

      if (!report.journeys.length) {
        pushAppNotification('info', 'Sem registos nesse dia', 'Não há uma jornada com entrada e saída para importar.')
        return
      }

      const nowIso = new Date().toISOString()
      const journeyTimes = report.journeys
        .map((journey) => ({
          start: journey.startedAt,
          end: journey.endedAt ?? nowIso,
        }))
        .sort((a, b) => a.start.localeCompare(b.start))
      const actualSegments = journeyTimes.map((item) => ({
        start: clockFromIso(item.start),
        end: clockFromIso(item.end),
      }))
      const actualBreaks = report.breaks
        .filter((item) => item.status !== 'cancelled')
        .map((item) => ({
          start: clockFromIso(item.startedAt),
          end: clockFromIso(item.endedAt ?? nowIso),
        }))
      const actualStart = clockFromIso(journeyTimes[0].start)
      const actualEnd = clockFromIso(journeyTimes[journeyTimes.length - 1].end)

      setForm((current) => ({
        ...current,
        actualStart,
        actualEnd,
        actualBreakMinutes: Math.round(report.summary.breakMs / 60000),
        actualBreaks,
        actualSegments,
        source: 'jornada',
        occurrenceStart:
          current.reason === 'doenca' && !current.occurrenceStart && isClockBefore(actualEnd, current.plannedEnd)
            ? actualEnd
            : current.occurrenceStart,
        occurrenceEnd:
          current.reason === 'doenca' && !current.occurrenceEnd && isClockBefore(actualEnd, current.plannedEnd)
            ? current.plannedEnd
            : current.occurrenceEnd,
      }))

      pushAppNotification(
        'success',
        'Jornada importada',
        `${form.date}: entrada ${actualStart}, saída ${actualEnd}, ${Math.round(report.summary.breakMs / 60000)} min de pausas.`,
      )
    } catch (error) {
      pushAppNotification(
        'error',
        'Não foi possível importar',
        error instanceof Error ? error.message : 'Tenta novamente.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  function saveEntry(event: React.FormEvent) {
    event.preventDefault()

    if (editingEntryId) {
      updateEntry(editingEntryId, form)
      pushAppNotification(
        'success',
        'Registo atualizado',
        `${form.date} · ${OCCURRENCE_LABELS[form.reason]} · ${formatHoursMinutes(calculation.workedMinutes)} trabalhadas`,
      )
      setEditingEntryId(null)
    } else {
      addEntry(form)
      pushAppNotification(
        'success',
        'Registo guardado',
        `${form.date} · ${OCCURRENCE_LABELS[form.reason]} · ${formatHoursMinutes(calculation.workedMinutes)} trabalhadas`,
      )
    }

    setMonthKey(form.date.slice(0, 7))
  }

  function handleEdit(entry: WorkHoursEntry) {
    const { id, createdAt, ...input } = entry
    void id
    void createdAt
    setEditingEntryId(entry.id)
    setForm(input)
    setMonthKey(entry.date.slice(0, 7))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingEntryId(null)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Eliminar este registo de horas?')) return
    removeEntry(id)
    if (editingEntryId === id) setEditingEntryId(null)
    pushAppNotification('info', 'Registo eliminado', 'O registo foi removido de Horas.')
  }

  function handleClearMonth() {
    if (!monthEntries.length) return
    if (!window.confirm(`Eliminar todos os registos de ${monthKey}?`)) return
    clearMonth(monthKey)
    setEditingEntryId(null)
    pushAppNotification('info', 'Mês limpo', `Foram removidos os registos de ${monthKey}.`)
  }

  const sourceLabel = form.source === 'jornada' ? 'Dados da jornada' : 'Preenchimento manual'

  return (
    <section className="reportPage workHoursPage" aria-labelledby="work-hours-title">
      <header className="reportHeader workHoursHeader">
        <div>
          <span className="eyebrow">HORAS</span>
          <h1 id="work-hours-title">Horas & ausências</h1>
          <p>Compara o horário previsto com o que realmente trabalhaste e regista ausências ou horas extra.</p>
        </div>
      </header>

      <section className="workHoursVerifier" aria-label="Preenchimento das horas">
        <div>
          <span className="sectionKicker">PREENCHIMENTO</span>
          <strong>{editingEntryId ? 'A editar um registo' : sourceLabel}</strong>
          <p>Preenche manualmente ou importa a jornada já guardada na aplicação.</p>
        </div>
        <div className="workHoursVerifierActions">
          <button type="button" onClick={() => void importDayRecord()} disabled={isImporting}>
            {isImporting ? 'A importar…' : 'Importar jornada'}
          </button>
          <button type="button" onClick={markSicknessFromActual}>Registar saída por doença</button>
        </div>
      </section>

      <div className="workHoursSummary" aria-label="Resumo das horas">
        <article><span>Previstas</span><strong>{formatHoursMinutes(calculation.plannedMinutes)}</strong></article>
        <article className="workHoursWorked"><span>Trabalhadas</span><strong>{formatHoursMinutes(calculation.workedMinutes)}</strong></article>
        <article className="workHoursWarning"><span>Não trabalhadas</span><strong>{formatHoursMinutes(calculation.nonWorkedMinutes)}</strong></article>
        <article><span>Ausência</span><strong>{formatHoursMinutes(calculation.occurrenceMinutes)}</strong></article>
        <article className="workHoursPositive"><span>Horas extra</span><strong>{formatHoursMinutes(calculation.overtimeMinutes)}</strong></article>
        <article><span>Saldo</span><strong>{formatHoursMinutes(calculation.balanceMinutes)}</strong></article>
      </div>

      {form.reason === 'doenca' ? (
        <section className="workHoursIllnessResult" aria-label="Ausência por doença">
          <div><span>Trabalhaste</span><strong>{formatHoursMinutes(calculation.workedMinutes)}</strong></div>
          <span className="workHoursEquation">+</span>
          <div><span>Ausência por doença</span><strong>{formatHoursMinutes(calculation.nonWorkedMinutes)}</strong></div>
          <span className="workHoursEquation">=</span>
          <div><span>Previsto</span><strong>{formatHoursMinutes(calculation.plannedMinutes)}</strong></div>
        </section>
      ) : null}

      <form className="workHoursForm" onSubmit={saveEntry}>
        <div className="workHoursSectionHeading">
          <div><span className="sectionKicker">DETALHES</span><h2>{editingEntryId ? 'Editar registo' : 'Registar horas'}</h2></div>
          <button type="button" className="workHoursExampleButton" onClick={loadSicknessExample}>Usar exemplo de doença</button>
        </div>

        <div className="workHoursPlanNote">
          <strong>Horário previsto</strong>
          <span>{form.plannedStart} → {form.plannedEnd}</span>
          <small>
            {form.plannedBreaks?.length
              ? `Pausas: ${form.plannedBreaks.map((item) => `${item.start}–${item.end}`).join(' · ')}`
              : `${form.plannedBreakMinutes} min de pausa previstos`}
          </small>
        </div>

        <div className="workHoursFieldGrid">
          <label><span>Data</span><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required /></label>
          <label><span>Entrada prevista</span><input type="time" value={form.plannedStart} onChange={(e) => updatePlan('plannedStart', e.target.value)} required /></label>
          <label><span>Saída prevista</span><input type="time" value={form.plannedEnd} onChange={(e) => updatePlan('plannedEnd', e.target.value)} required /></label>
          <label><span>Pausas previstas</span><div className="inputWithSuffix"><input type="number" min="0" max="600" value={form.plannedBreakMinutes} onChange={(e) => updatePlan('plannedBreakMinutes', Number(e.target.value))} /><span>min</span></div></label>

          <label><span>Entrada real</span><input type="time" value={form.actualStart} onChange={(e) => updateActual('actualStart', e.target.value)} /></label>
          <label><span>Saída real</span><input type="time" value={form.actualEnd} onChange={(e) => updateActual('actualEnd', e.target.value)} /></label>
          <label><span>Pausas feitas</span><div className="inputWithSuffix"><input type="number" min="0" max="600" value={form.actualBreakMinutes} onChange={(e) => updateActual('actualBreakMinutes', Number(e.target.value))} /><span>min</span></div><small>Se saíste antes da pausa e não a fizeste, coloca 0.</small></label>
          <label><span>Motivo</span><select value={form.reason} onChange={(e) => update('reason', e.target.value as WorkOccurrenceReason)}>{Object.entries(OCCURRENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

          <label><span>Início da ausência</span><input type="time" value={form.occurrenceStart ?? ''} onChange={(e) => update('occurrenceStart', e.target.value)} /><small>Ex.: hora em que saíste por doença.</small></label>
          <label><span>Fim da ausência</span><input type="time" value={form.occurrenceEnd ?? ''} onChange={(e) => update('occurrenceEnd', e.target.value)} /><small>Se não regressaste, usa a saída prevista.</small></label>
          <label><span>Comprovativo</span><select value={form.proofType ?? 'nao_indicado'} onChange={(e) => update('proofType', e.target.value as WorkProofType)}>{Object.entries(WORK_PROOF_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Efeito no vencimento</span><select value={form.payTreatment} onChange={(e) => update('payTreatment', e.target.value as PayTreatment)}>{Object.entries(PAY_TREATMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

          <label className="workHoursWide"><span>Notas</span><textarea rows={3} value={form.notes ?? ''} placeholder="Ex.: indisposição às 14:00, saída autorizada, comprovativo entregue..." onChange={(e) => update('notes', e.target.value)} /></label>
        </div>

        <div className="workHoursResultPanel">
          <div><span>Horas no horário</span><strong>{formatHoursMinutes(calculation.scheduledWorkedMinutes)}</strong></div>
          <div><span>Ausência</span><strong>{formatHoursMinutes(calculation.nonWorkedMinutes)}</strong></div>
          <div><span>Motivo registado</span><strong>{formatHoursMinutes(calculation.occurrenceMinutes)}</strong></div>
          <div><span>Tempo considerado</span><strong>{formatHoursMinutes(calculation.consideredMinutes)}</strong></div>
          <p>O cálculo é feito ao minuto. Pausas, ausências e horas extra são apuradas separadamente para não duplicar nem retirar tempo indevidamente.</p>
        </div>

        <aside className="workHoursLegalNote">
          <strong>Doença e vencimento</strong>
          <p>A aplicação calcula o tempo trabalhado e a ausência. O valor pago pode depender do tipo de ausência, comprovativos e regras laborais aplicáveis.</p>
        </aside>

        <div className="workHoursFormActions">
          {editingEntryId ? <button className="actionButton" type="button" onClick={cancelEdit}>Cancelar</button> : null}
          <button className="actionButton actionButtonPrimary" type="submit">
            {editingEntryId ? 'Guardar alterações' : 'Guardar registo'}
          </button>
        </div>
      </form>

      <section className="workHoursMonth" aria-labelledby="work-hours-month-title">
        <div className="workHoursSectionHeading">
          <div><span className="sectionKicker">MÊS</span><h2 id="work-hours-month-title">Resumo do mês</h2></div>
          <div className="workHoursMonthActions"><input aria-label="Mês" type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} /><button type="button" onClick={handleClearMonth} disabled={!monthEntries.length}>Limpar mês</button></div>
        </div>

        <div className="workHoursMonthTotals">
          <div><span>Previstas</span><strong>{formatHoursMinutes(totals.planned)}</strong></div>
          <div><span>Trabalhadas</span><strong>{formatHoursMinutes(totals.worked)}</strong></div>
          <div><span>Não trabalhadas</span><strong>{formatHoursMinutes(totals.nonWorked)}</strong></div>
          <div><span>Por doença</span><strong>{formatHoursMinutes(totals.illness)}</strong></div>
          <div><span>Extra</span><strong>{formatHoursMinutes(totals.overtime)}</strong></div>
          <div><span>Consideradas</span><strong>{formatHoursMinutes(totals.considered)}</strong></div>
        </div>

        {monthEntries.length === 0 ? <p className="workHoursEmpty">Ainda não há registos neste mês.</p> : (
          <div className="workHoursEntries">
            {monthEntries.map((entry) => {
              const item = calculateWorkHours(entry)
              return <article key={entry.id} className={editingEntryId === entry.id ? 'workHoursEntryEditing' : undefined}>
                <div className="workHoursEntryDate"><strong>{entry.date}</strong><span>{OCCURRENCE_LABELS[entry.reason]} · {entry.source === 'jornada' ? 'importado' : 'manual'}</span></div>
                <div><span>Trabalhadas</span><strong>{formatHoursMinutes(item.workedMinutes)}</strong></div>
                <div><span>Não trabalhadas</span><strong>{formatHoursMinutes(item.nonWorkedMinutes)}</strong></div>
                <div><span>Extra</span><strong>{formatHoursMinutes(item.overtimeMinutes)}</strong></div>
                <div><span>Saldo</span><strong>{formatHoursMinutes(item.balanceMinutes)}</strong></div>
                <div className="workHoursEntryActions">
                  <button type="button" onClick={() => handleEdit(entry)} aria-label={`Editar registo de ${entry.date}`}>Editar</button>
                  <button type="button" className="workHoursDeleteButton" onClick={() => handleDelete(entry.id)} aria-label={`Eliminar registo de ${entry.date}`}>Eliminar</button>
                </div>
                {entry.notes ? <p>{entry.notes}</p> : null}
              </article>
            })}
          </div>
        )}
      </section>
    </section>
  )
}
