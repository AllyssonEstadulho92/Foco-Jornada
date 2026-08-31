import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getResolvedScheduledBreaks, resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import { formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useDayReport } from '../hooks/useDayReport'
import { useSettingsController } from '../hooks/useSettingsController'

function dateFromKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildMonthCells(monthKey: string): Array<{ key: string; inMonth: boolean }> {
  const [year, month] = monthKey.split('-').map(Number)
  const first = new Date(year, month - 1, 1, 12)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - mondayOffset, 12)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { key: toLocalDateKey(date), inMonth: date.getMonth() === month - 1 }
  })
}

export function OperationalCalendarPage() {
  const today = new Date()
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(today))
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(today))
  const { settings } = useSettingsController()
  const { report, isLoading, error } = useDayReport(selectedDate)
  const cells = useMemo(() => buildMonthCells(monthKey), [monthKey])

  const selectedDay = dateFromKey(selectedDate)
  const selectedPlan = resolveWorkScheduleForDate(settings.workSchedule, selectedDay)
  const selectedBreaks = getResolvedScheduledBreaks(settings.workSchedule, selectedDay)
  const selectedLabel = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDay)

  function moveMonth(offset: number) {
    const [year, month] = monthKey.split('-').map(Number)
    const next = new Date(year, month - 1 + offset, 1, 12)
    setMonthKey(monthKeyFromDate(next))
  }

  return (
    <section className="opsPage" aria-labelledby="calendar-title">
      <header className="opsPageHeader">
        <div>
          <span className="opsEyebrow">CALENDÁRIO OPERACIONAL</span>
          <h1 id="calendar-title">Plano e registos por dia</h1>
          <p>O calendário usa o horário configurado como plano e os registos reais como histórico. Medicação mantém a própria agenda prescrita.</p>
        </div>
        <div className="opsControls">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior">←</button>
          <input type="month" value={monthKey} onChange={(event) => setMonthKey(event.target.value)} aria-label="Mês" />
          <button type="button" onClick={() => moveMonth(1)} aria-label="Mês seguinte">→</button>
        </div>
      </header>

      <div className="opsCalendarLayout">
        <div className="opsCalendarCard">
          <div className="opsWeekdays" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="opsCalendarGrid">
            {cells.map((cell) => {
              const date = dateFromKey(cell.key)
              const plan = resolveWorkScheduleForDate(settings.workSchedule, date)
              const plannedBreaks = getResolvedScheduledBreaks(settings.workSchedule, date)
              const isToday = cell.key === toLocalDateKey(today)
              const isSelected = cell.key === selectedDate
              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`opsCalendarDay${cell.inMonth ? '' : ' isOutside'}${isToday ? ' isToday' : ''}${isSelected ? ' isSelected' : ''}`}
                  onClick={() => setSelectedDate(cell.key)}
                  aria-pressed={isSelected}
                >
                  <strong>{date.getDate()}</strong>
                  <span>{plan.isWorkingDay ? `${plan.startTime}–${plan.endTime}` : 'Sem turno'}</span>
                  {plannedBreaks.length > 0 ? <small>{plannedBreaks.length} pausa{plannedBreaks.length > 1 ? 's' : ''}</small> : null}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="opsDayPanel" aria-label={`Detalhes de ${selectedLabel}`}>
          <span className="opsEyebrow">DIA SELECIONADO</span>
          <h2>{selectedLabel}</h2>
          <div className="opsDayPlan">
            <article><span>Jornada planeada</span><strong>{selectedPlan.isWorkingDay ? `${selectedPlan.startTime}–${selectedPlan.endTime}` : 'Sem jornada planeada'}</strong></article>
            <article><span>Pausas planeadas</span><strong>{selectedBreaks.length || 'Nenhuma'}</strong></article>
          </div>

          {isLoading ? <div className="opsLoading">A carregar registos…</div> : null}
          {error ? <div className="errorBanner">{error}</div> : null}
          {report ? (
            <>
              <div className="opsDayActual">
                <article><span>Jornada real</span><strong>{formatDuration(report.summary.journeyMs)}</strong></article>
                <article><span>Efetivo</span><strong>{formatDuration(report.summary.effectiveMs)}</strong></article>
                <article><span>Pausas reais</span><strong>{formatDuration(report.summary.breakMs)}</strong></article>
                <article><span>Foco</span><strong>{formatDuration(report.summary.focusMs)}</strong></article>
              </div>
              <div className="opsTimelineMini">
                <div><strong>Linha do tempo</strong><span>{report.events.length} registos</span></div>
                {report.events.slice(0, 8).map((event) => (
                  <article key={event.id}>
                    <time>{new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.timestamp))}</time>
                    <span><strong>{event.label}</strong>{event.detail ? <small>{event.detail}</small> : null}</span>
                  </article>
                ))}
                {report.events.length === 0 ? <p>Sem registos reais neste dia.</p> : null}
              </div>
            </>
          ) : null}

          <div className="opsDayLinks">
            <Link to="/medicamentos">Agenda de medicação</Link>
            <Link to="/relatorios">Relatório do período</Link>
          </div>
        </aside>
      </div>
    </section>
  )
}
