import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { VacationTrackerSettings } from '../../domain/vacation/VacationBalance'
import { listUpcomingVacationPeriods, simulateVacationPeriod } from '../../domain/vacation/VacationPlanner'
import { VacationSuggestionsPanel } from './VacationSuggestionsPanel'

interface VacationPlannerPanelProps {
  today: string
  asOfDayProgress: number
  settings: VacationTrackerSettings
  recordedVacationDates: string[]
  formatDate: (dateKey: string) => string
  daysLabel: (days: number) => string
  preciseDaysLabel: (days: number) => string
}

function nextCivilDay(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

export function VacationPlannerPanel({
  today,
  asOfDayProgress,
  settings,
  recordedVacationDates,
  formatDate,
  daysLabel,
  preciseDaysLabel,
}: VacationPlannerPanelProps) {
  const tomorrow = nextCivilDay(today)
  const yearEnd = `${today.slice(0, 4)}-12-31`
  const [startDate, setStartDate] = useState(tomorrow <= yearEnd ? tomorrow : '')
  const [endDate, setEndDate] = useState(tomorrow <= yearEnd ? tomorrow : '')
  const periods = useMemo(
    () => listUpcomingVacationPeriods(today, recordedVacationDates),
    [today, recordedVacationDates],
  )
  const simulation = useMemo(
    () => simulateVacationPeriod({
      ...settings,
      asOfDate: today,
      asOfDayProgress,
      recordedVacationDates,
      startDate,
      endDate,
    }),
    [settings, today, asOfDayProgress, recordedVacationDates, startDate, endDate],
  )

  return (
    <section className="vacationPanel vacationPlannerPanel" aria-labelledby="vacation-planner-title">
      <div className="vacationPanelHeader">
        <div>
          <span>PLANEAMENTO · {today.slice(0, 4)}</span>
          <h2 id="vacation-planner-title">Planeia as próximas férias</h2>
        </div>
        <strong>Pré-visualização sem guardar</strong>
      </div>

      <VacationSuggestionsPanel
        today={today}
        asOfDayProgress={asOfDayProgress}
        settings={settings}
        recordedVacationDates={recordedVacationDates}
        formatDate={formatDate}
        daysLabel={daysLabel}
        onSimulate={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
      />

      <p className="vacationPlannerIntro">
        Escolhe um período ou utiliza uma sugestão acima para veres quantos dias úteis acrescentaria às férias
        já marcadas, o saldo pessoal estimado no início e no fim e o efeito na previsão de dezembro.
        A simulação não reserva nem regista férias.
      </p>

      {tomorrow > yearEnd ? (
        <p className="vacationPlannerNotice" role="status">
          Não há datas futuras neste ano. A simulação fica disponível no início do próximo ano.
        </p>
      ) : (
        <>
          <div className="vacationPlannerForm" id="vacation-planner-dates">
            <label>
              <span>Início do período</span>
              <input
                type="date"
                value={startDate}
                min={tomorrow}
                max={yearEnd}
                onChange={(event) => {
                  const value = event.target.value
                  setStartDate(value)
                  if (endDate < value) setEndDate(value)
                }}
              />
            </label>
            <label>
              <span>Fim do período</span>
              <input
                type="date"
                value={endDate}
                min={startDate || tomorrow}
                max={yearEnd}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          {simulation.valid ? (
            <div className="vacationPlannerResults" aria-live="polite">
              <div className="vacationPlannerGrid">
                <div className="vacationPlannerResult">
                  <span>Dias úteis do período</span>
                  <strong>{daysLabel(simulation.workingDays)}</strong>
                  <small>{daysLabel(simulation.calendarDays)} de calendário · {daysLabel(simulation.weekendDays)} de fim de semana.</small>
                </div>
                <div className="vacationPlannerResult vacationPlannerResultAccent">
                  <span>Dias adicionais a descontar</span>
                  <strong>{daysLabel(simulation.additionalDays)}</strong>
                  <small>{daysLabel(simulation.alreadyRecordedDays)} já marcados e não descontados outra vez.</small>
                </div>
                <div className="vacationPlannerResult">
                  <span>Saldo no início</span>
                  <strong>{preciseDaysLabel(simulation.beforePeriodBalanceDays)}</strong>
                  <small>Projeção pessoal ao início de {formatDate(simulation.startDate)}.</small>
                </div>
                <div className={`vacationPlannerResult${simulation.afterPeriodBalanceDays < 0 ? ' vacationPlannerNegative' : ''}`}>
                  <span>Saldo no fim</span>
                  <strong>{preciseDaysLabel(simulation.afterPeriodBalanceDays)}</strong>
                  <small>Projeção pessoal ao fim de {formatDate(simulation.endDate)}.</small>
                </div>
                <div className={`vacationPlannerResult vacationPlannerYearEnd${simulation.afterYearEndBalanceDays < 0 ? ' vacationPlannerNegative' : ''}`}>
                  <span>Previsão para 31 de dezembro</span>
                  <strong>{preciseDaysLabel(simulation.afterYearEndBalanceDays)}</strong>
                  <small>Antes: {preciseDaysLabel(simulation.beforeYearEndBalanceDays)} · impacto: −{daysLabel(simulation.additionalDays)}.</small>
                </div>
              </div>
              {simulation.workingDays === 0 ? (
                <p className="vacationPlannerNotice" role="status">Este período contém apenas fins de semana; não desconta dias úteis.</p>
              ) : simulation.additionalDays === 0 ? (
                <p className="vacationPlannerNotice" role="status">Todos os dias úteis escolhidos já estão marcados. A simulação não os duplica.</p>
              ) : null}
              {simulation.afterYearEndBalanceDays < 0 ? (
                <p className="vacationPlannerNotice vacationPlannerWarning" role="status">
                  A previsão pessoal do final do ano fica negativa. Confirma a disponibilidade real com a entidade empregadora antes de marcares férias.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="vacationPlannerNotice" role="status">{simulation.message}</p>
          )}
        </>
      )}

      <div className="vacationPlannerUpcoming">
        <h3>Próximos períodos já registados</h3>
        {periods.length === 0 ? (
          <p>Ainda não há dias úteis futuros marcados como férias nas áreas da aplicação.</p>
        ) : (
          <ol className="vacationPlannerPeriodList">
            {periods.map((period) => (
              <li key={`${period.startDate}-${period.endDate}`}>
                <span>{formatDate(period.startDate)} — {formatDate(period.endDate)}</span>
                <strong>{daysLabel(period.workingDays)}</strong>
              </li>
            ))}
          </ol>
        )}
        <p>
          Os períodos agrupam dias úteis consecutivos, incluindo a passagem de sexta para segunda-feira;
          as datas apresentadas são o primeiro e o último dia útil marcado, não necessariamente o intervalo completo de descanso.
        </p>
      </div>

      <div className="vacationPlannerFooter">
        <span>Regime padrão: segunda–sexta. Feriados e escalas especiais não são inferidos; o contador de 28 dias é uma projeção pessoal.</span>
        <NavLink to="/turnos">Marcar no mapa de turnos</NavLink>
      </div>
    </section>
  )
}
