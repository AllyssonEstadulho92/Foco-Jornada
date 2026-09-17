import { useMemo, useState } from 'react'
import { suggestJointVacationPeriods } from '../../domain/vacation/VacationJointPlanning'
import { collectVacationDatesForYear } from '../../domain/vacation/VacationYearRecords'
import type { VacationTrackerSettings } from '../../domain/vacation/VacationBalance'
import { secureStorage } from '../../security/secureStorage'
import { useWorkHoursStore } from '../store/useWorkHoursStore'
import { VacationConfirmationChecklist } from './VacationConfirmationChecklist'
import '../../styles/vacation-joint-planner.css'

interface VacationJointPlannerProps {
  today: string
  asOfDayProgress: number
  year: number
  settings: VacationTrackerSettings
}

const DAY_MS = 86_400_000
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const BLOCKED_MONTHS = [11, 12] as const
const monthFormatter = new Intl.DateTimeFormat('pt-PT', { month: 'long', timeZone: 'UTC' })
const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
})
const shortDateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric', month: 'short', timeZone: 'UTC',
})
const numberFormatter = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 })

function monthLabel(month: number, year: number) {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

function dateLabel(key: string) {
  return dateFormatter.format(new Date(`${key}T00:00:00Z`))
}

function shortDate(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return shortDateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

function dateKey(stamp: number) {
  return new Date(stamp).toISOString().slice(0, 10)
}

function clockLabel(progress: number) {
  const safeProgress = Number.isFinite(progress) ? progress : 0
  const minute = Math.min(1439, Math.max(0, Math.floor(safeProgress * 1440)))
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export function VacationJointPlanner({ today, asOfDayProgress, year, settings }: VacationJointPlannerProps) {
  const entries = useWorkHoursStore((state) => state.entries)
  const [requestedDays, setRequestedDays] = useState(10)
  const [month, setMonth] = useState(7)
  const [selectedStart, setSelectedStart] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  // The parent clock drives a fresh read from the encrypted vault each minute
  // and on focus/visibility. Never read unencrypted browser storage here.
  const recorded = useMemo(() => {
    if (!Number.isFinite(asOfDayProgress)) return []
    return collectVacationDatesForYear(year, entries, (key) => secureStorage.getItem(key))
  }, [year, entries, asOfDayProgress])

  const suggestions = useMemo(() => suggestJointVacationPeriods({
    today,
    year,
    month,
    requestedDays,
    excludedMonths: BLOCKED_MONTHS,
    recordedVacationDates: recorded,
    settings,
  }), [today, year, month, requestedDays, recorded, settings])
  const selected = suggestions.find((item) => item.startDate === selectedStart) ?? suggestions[0]
  // A different scenario remounts the checklist; stale ticks never carry to another period.
  const confirmationScope = selected ? JSON.stringify({
    year, month, requestedDays, start: selected.startDate, end: selected.endDate,
    settings, recorded,
  }) : ''
  const date = new Date(Date.UTC(year, month - 1, 1))
  const startOffset = (date.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstStamp = Date.UTC(year, month - 1, 1)
  const cells = [
    ...Array.from({ length: startOffset }, () => ''),
    ...Array.from({ length: daysInMonth }, (_, index) => dateKey(firstStamp + index * DAY_MS)),
  ]
  const updatedAt = clockLabel(asOfDayProgress)

  return (
    <section className="vacationJoint" aria-labelledby="vacation-joint-title">
      <header className="vacationJointHeader">
        <div>
          <span className="vacationJointEyebrow">PROPOSTAS · {year}</span>
          <h3 id="vacation-joint-title">Organiza as férias a dois</h3>
          <p>Compara datas e saldos estimados. As sugestões não criam pedidos nem reservas.</p>
        </div>
        <span className="vacationJointLive">Cálculo local às <time dateTime={`${today}T${updatedAt}`}>{updatedAt}</time></span>
      </header>

      <div className="vacationJointFilters" aria-label="Preferências do período de férias">
        <label>
          <span>Mês pretendido</span>
          <select value={month} onChange={(event) => {
            setMonth(Number(event.target.value))
            setSelectedStart('')
            setShowCalendar(false)
          }}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value} disabled={BLOCKED_MONTHS.includes(value as 11 | 12)}>
                {monthLabel(value, year)}{BLOCKED_MONTHS.includes(value as 11 | 12) ? ' · indisponível' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dias úteis que pretendes tirar</span>
          <input type="number" min="1" max="30" step="1" inputMode="numeric"
            value={requestedDays || ''} onChange={(event) => {
              setRequestedDays(Number(event.target.value))
              setSelectedStart('')
              setShowCalendar(false)
            }} />
        </label>
        <div className="vacationJointRestriction" role="note">
          <strong>Meses excluídos</strong>
          <span>Novembro · Dezembro</span>
          <small>Restrição indicada por ti; confirma se se mantém na tua escala em {year}.</small>
        </div>
      </div>

      {selected ? (
        <>
          <div className="vacationJointSectionHeading">
            <div>
              <h4>Períodos para comparar</h4>
              <p>{monthLabel(month, year)} de {year} · {requestedDays} dias úteis por opção</p>
            </div>
            <span>{suggestions.length} {suggestions.length === 1 ? 'alternativa' : 'alternativas'}</span>
          </div>

          <div className="vacationJointOptions" role="group" aria-label="Escolher uma proposta de férias">
            {suggestions.map((item, index) => {
              const active = selected.startDate === item.startDate
              return (
                <button type="button" key={item.startDate}
                  className={`vacationJointOption${active ? ' isSelected' : ''}`}
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedStart(item.startDate)
                    setShowCalendar(true)
                  }}>
                  <span className="vacationJointOptionTag">{index === 0 ? 'Primeira opção' : `Alternativa ${index + 1}`}</span>
                  <strong>{shortDate(item.startDate)} – {shortDate(item.endDate)}</strong>
                  <span>{item.workingDays} dias úteis · {item.restDays} dias de descanso potencial</span>
                  <small>Saldo pessoal estimado no fim: {numberFormatter.format(item.afterPeriodBalanceDays)} dias</small>
                  <span className="vacationJointOptionAction">{active ? 'Período selecionado' : 'Selecionar período'} <span aria-hidden="true">→</span></span>
                </button>
              )
            })}
          </div>

          <div className="vacationJointDetail" aria-live="polite">
            <div className="vacationJointDetailHeader">
              <div>
                <span className="vacationJointEyebrow">SIMULAÇÃO PESSOAL · {year}</span>
                <h4>{shortDate(selected.startDate)} a {shortDate(selected.endDate)}</h4>
                <p>{selected.workingDays} dias úteis de férias · {selected.restDays} dias de descanso apenas se os fins de semana forem livres.</p>
              </div>
              <button type="button" onClick={() => setShowCalendar((current) => !current)}
                aria-expanded={showCalendar} aria-controls="vacation-joint-calendar">
                {showCalendar ? 'Ocultar calendário' : 'Ver calendário'}
              </button>
            </div>
            <dl className="vacationJointFigures">
              <div><dt>Saldo pessoal estimado no fim</dt><dd>{numberFormatter.format(selected.afterPeriodBalanceDays)} dias</dd></div>
              <div><dt>Projeção pessoal em dezembro</dt><dd>{numberFormatter.format(selected.afterYearEndBalanceDays)} dias</dd></div>
              <div><dt>Datas já registadas neste período</dt><dd>{selected.alreadyRecordedDays} dias úteis</dd></div>
            </dl>
            {showCalendar ? (
              <div className="vacationJointCalendar" id="vacation-joint-calendar">
                <strong>{monthLabel(month, year)} {year}</strong>
                <div className="vacationJointCalendarGrid" role="group" aria-label={`Calendário de ${monthLabel(month, year)} de ${year}`}>
                  {WEEKDAYS.map((day) => <span className="vacationJointWeekday" key={day}>{day}</span>)}
                  {cells.map((key, index) => {
                    if (!key) return <span key={`empty-${index}`} aria-hidden="true" />
                    const day = new Date(`${key}T00:00:00Z`).getUTCDay()
                    const weekend = day === 0 || day === 6
                    const active = key >= selected.startDate && key <= selected.endDate
                    const booked = recorded.includes(key) && !weekend
                    return <span key={key}
                      className={`vacationJointDay${booked ? ' isBooked' : active ? weekend ? ' isRest' : ' isSuggested' : ''}`}
                      aria-label={`${dateLabel(key)}${booked ? ', férias já registadas' : active ? weekend ? ', fim de semana no intervalo' : ', dia de férias simulado' : ''}`}>
                      {Number(key.slice(-2))}
                    </span>
                  })}
                </div>
                <p>Verde: úteis simulados · bege: fim de semana · contorno: já registados. O calendário não grava nem reserva datas.</p>
              </div>
            ) : null}
          </div>
          <VacationConfirmationChecklist
            key={confirmationScope}
            periodLabel={`${shortDate(selected.startDate)} a ${shortDate(selected.endDate)} de ${year}`}
          />
        </>
      ) : (
        <p className="vacationJointEmpty" role="status">
          {requestedDays < 1 || requestedDays > 30 || !Number.isInteger(requestedDays)
            ? 'Introduz um número inteiro entre 1 e 30 dias úteis.'
            : 'Não há períodos disponíveis com estas condições e com saldo pessoal projetado não negativo. Confirma os registos, escolhe outro mês ou reduz os dias.'}
        </p>
      )}

      <p className="vacationJointDisclaimer">
        <strong>Estimativa, não direito adquirido.</strong> Para {year}, a meta pessoal de {numberFormatter.format(settings.monthlyAccrualTargetDays)} dias é usada sem transportar automaticamente saldo, ajustes ou dias manuais de {year - 1}. Feriados, escala efetiva, disponibilidade da parceira e aprovação da ILUNION não são verificados. O tempo real refere-se ao recálculo local, não à confirmação da empresa nem à sincronização instantânea entre dispositivos.
      </p>
    </section>
  )
}
