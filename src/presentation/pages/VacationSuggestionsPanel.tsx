import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { VacationTrackerSettings } from '../../domain/vacation/VacationBalance'
import {
  suggestVacationPeriods,
  type VacationSuggestion,
  type VacationSuggestionPreference,
} from '../../domain/vacation/VacationSuggestions'

interface VacationSuggestionsPanelProps {
  today: string
  asOfDayProgress: number
  settings: VacationTrackerSettings
  recordedVacationDates: string[]
  formatDate: (dateKey: string) => string
  daysLabel: (days: number) => string
  onSimulate: (startDate: string, endDate: string) => void
}

const DAY_MS = 86_400_000
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const monthFormatter = new Intl.DateTimeFormat('pt-PT', { month: 'long' })

function monthLabel(month: number, year: number) {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

function dateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function formatShortDate(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' })
    .format(new Date(Date.UTC(year, month - 1, day)))
}

function intervalLabel(option: VacationSuggestion) {
  return `${formatShortDate(option.startDate)} – ${formatShortDate(option.endDate)}`
}

export function VacationSuggestionsPanel({
  today,
  asOfDayProgress,
  settings,
  recordedVacationDates,
  formatDate,
  daysLabel,
  onSimulate,
}: VacationSuggestionsPanelProps) {
  const year = Number(today.slice(0, 4))
  const [requestedDays, setRequestedDays] = useState(10)
  const [excludedMonth, setExcludedMonth] = useState(0)
  const [preference, setPreference] = useState<VacationSuggestionPreference>('rest')
  const [selectedStart, setSelectedStart] = useState('')
  const [shownMonth, setShownMonth] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const suggestions = useMemo(() => suggestVacationPeriods({
    ...settings,
    asOfDate: today,
    asOfDayProgress,
    recordedVacationDates,
    requestedDays,
    excludedMonth,
    preference,
  }), [settings, today, asOfDayProgress, recordedVacationDates, requestedDays, excludedMonth, preference])

  const selected = suggestions.find((item) => item.startDate === selectedStart) ?? suggestions[0]
  const displayedMonth = shownMonth ?? selected?.month ?? Number(today.slice(5, 7))
  const calendarCells = useMemo(() => {
    const first = Date.UTC(year, displayedMonth - 1, 1)
    const firstWeekday = (new Date(first).getUTCDay() + 6) % 7
    const days = new Date(Date.UTC(year, displayedMonth, 0)).getUTCDate()
    return [...Array.from({ length: firstWeekday }, () => ''),
      ...Array.from({ length: days }, (_, index) => dateKey(first + index * DAY_MS))]
  }, [year, displayedMonth])
  const recorded = useMemo(() => new Set(recordedVacationDates), [recordedVacationDates])
  const minMonth = Number(today.slice(5, 7))

  function choose(item: VacationSuggestion) {
    setSelectedStart(item.startDate)
    setShownMonth(item.month)
  }

  function applySuggestion() {
    if (!selected) return
    onSimulate(selected.startDate, selected.endDate)
    document.getElementById('vacation-planner-dates')?.scrollIntoView({ block: 'start' })
  }

  return (
    <section className="vacationSuggest" aria-labelledby="vacation-suggest-title">
      <header className="vacationSuggestHeader">
        <div>
          <span className="vacationSuggestEyebrow">FOCO JORNADA · PLANEAMENTO</span>
          <h3 id="vacation-suggest-title">Sugestão de férias</h3>
          <p>Compara períodos de descanso tendo em conta a tua meta e as férias já marcadas.</p>
        </div>
        <div className="vacationSuggestSun" aria-hidden="true"><span /></div>
      </header>

      <div className="vacationSuggestFilters" aria-label="Preferências para sugestões">
        <label>
          <span>Dias úteis pretendidos</span>
          <input type="number" min="1" max="30" step="1" inputMode="numeric"
            value={requestedDays || ''} onChange={(event) => setRequestedDays(Number(event.target.value))} />
        </label>
        <label>
          <span>Evitar mês</span>
          <select value={excludedMonth} onChange={(event) => setExcludedMonth(Number(event.target.value))}>
            <option value={0}>Nenhum</option>
            {Array.from({ length: 12 }, (_, month) => <option key={month + 1} value={month + 1}>
              {monthLabel(month + 1, year)}
            </option>)}
          </select>
        </label>
        <label>
          <span>Preferência</span>
          <select value={preference} onChange={(event) => setPreference(event.target.value as VacationSuggestionPreference)}>
            <option value="rest">Juntar fins de semana</option>
            <option value="soon">Mais cedo</option>
            <option value="balance">Maior saldo no fim</option>
          </select>
        </label>
      </div>

      {selected ? (
        <>
          <article className="vacationSuggestFeatured">
            <div className="vacationSuggestFeaturedContent">
              <span className="vacationSuggestFeaturedTag">Sugestão pelo critério escolhido</span>
              <strong>{intervalLabel(selected)}</strong>
              <b>{daysLabel(selected.workingDays)} úteis · {daysLabel(selected.restDays)} de descanso potencial</b>
              <small>Saldo pessoal estimado no fim: {daysLabel(selected.afterPeriodBalanceDays)}.</small>
              <small>Previsão pessoal em dezembro: {daysLabel(selected.afterYearEndBalanceDays)}.</small>
            </div>
            <div className="vacationSuggestLandscape" aria-hidden="true"><span /><i /></div>
          </article>

          <div className="vacationSuggestSectionTitle">
            <h4>Meses com períodos disponíveis</h4>
            {suggestions.length > 3 ? <button type="button" onClick={() => setShowAll((value) => !value)}
              aria-expanded={showAll}>{showAll ? 'Mostrar menos' : 'Ver todos'}</button> : null}
          </div>
          <div className="vacationSuggestMonths">
            {suggestions.slice(0, showAll ? undefined : 3).map((item, index) => (
              <button key={item.startDate} type="button"
                className={`vacationSuggestMonth${selected.startDate === item.startDate ? ' isSelected' : ''}`}
                onClick={() => choose(item)} aria-pressed={selected.startDate === item.startDate}>
                <span className="vacationSuggestMonthNumber">{index + 1}</span>
                <span><strong>{monthLabel(item.month, year)}</strong><small>{daysLabel(item.restDays)} de descanso potencial</small></span>
              </button>
            ))}
          </div>

          <div className="vacationSuggestSectionTitle"><h4>Calendário sugerido</h4></div>
          <div className="vacationSuggestCalendarLayout">
            <div className="vacationSuggestCalendar">
              <div className="vacationSuggestCalendarHeader">
                <strong>{monthLabel(displayedMonth, year)} {year}</strong>
                <div className="vacationSuggestCalendarNavigation">
                  <button type="button" aria-label="Mês anterior" disabled={displayedMonth <= minMonth}
                    onClick={() => setShownMonth(displayedMonth - 1)}>‹</button>
                  <button type="button" aria-label="Mês seguinte" disabled={displayedMonth >= 12}
                    onClick={() => setShownMonth(displayedMonth + 1)}>›</button>
                </div>
              </div>
              <div className="vacationSuggestCalendarGrid" aria-label={`Calendário de ${monthLabel(displayedMonth, year)} de ${year}`}>
                {WEEKDAYS.map((day) => <span key={day} className="vacationSuggestWeekday">{day}</span>)}
                {calendarCells.map((key, index) => {
                  if (!key) return <span aria-hidden="true" key={`empty-${index}`} />
                  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay()
                  const weekend = weekday === 0 || weekday === 6
                  const inRange = key >= selected.startDate && key <= selected.endDate
                  const state = recorded.has(key) && !weekend ? ' isBooked' :
                    inRange && weekend ? ' isRest' : inRange ? ' isSuggested' : ''
                  return <span key={key} className={`vacationSuggestDay${state}`}
                    aria-label={`${formatDate(key)}${state === ' isBooked' ? ', já marcado' :
                      state === ' isRest' ? ', fim de semana' : state === ' isSuggested' ? ', dia sugerido' : ''}`}>
                    {Number(key.slice(-2))}
                  </span>
                })}
              </div>
              <p className="vacationSuggestCalendarNote">{formatDate(selected.startDate)} a {formatDate(selected.endDate)}.
                {selected.month !== Number(selected.endDate.slice(5, 7)) ? ' O período atravessa dois meses.' : ''}</p>
            </div>
            <aside className="vacationSuggestCalendarAside">
              <div className="vacationSuggestLegend">
                <span><i className="isSuggested" />Dias sugeridos</span>
                <span><i className="isRest" />Fins de semana no período</span>
                <span><i className="isBooked" />Férias já marcadas</span>
              </div>
              <div className="vacationSuggestCalendarSummary">
                <strong>{intervalLabel(selected)}</strong>
                <span>{daysLabel(selected.workingDays)} úteis para {daysLabel(selected.restDays)} de descanso potencial.</span>
                <small>Inclui fins de semana adjacentes, caso sejam dias de descanso na tua escala.</small>
              </div>
            </aside>
          </div>

          {suggestions.length > 1 ? <>
            <div className="vacationSuggestSectionTitle"><h4>Outras sugestões</h4></div>
            <div className="vacationSuggestAlternatives">
              {suggestions.filter((item) => item.startDate !== selected.startDate).slice(0, 2).map((item) => (
                <button key={item.startDate} type="button" onClick={() => choose(item)}>
                  <span className="vacationSuggestAlternativeIcon" aria-hidden="true">▦</span>
                  <span><strong>{intervalLabel(item)}</strong><small>{daysLabel(item.workingDays)} úteis · {daysLabel(item.restDays)} de descanso potencial</small></span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </> : null}

          <div className="vacationSuggestActions">
            <button className="vacationSuggestPrimaryAction" type="button" onClick={applySuggestion}>Simular este período</button>
            <NavLink to="/turnos">Ver no mapa de turnos</NavLink>
          </div>
        </>
      ) : <div className="vacationSuggestEmpty" role="status">
        {requestedDays < 1 || requestedDays > 30 || !Number.isInteger(requestedDays)
          ? 'Escolhe um número inteiro entre 1 e 30 dias úteis.'
          : 'Não existe um período futuro que cumpra estes filtros e mantenha o saldo pessoal projetado não negativo. Reduz os dias, altera o mês a evitar ou confirma a configuração.'}
      </div>}

      <p className="vacationSuggestDisclaimer">
        Sugestões calculadas só com dias úteis de segunda a sexta, períodos já registados e projeção pessoal de férias.
        Não analisam feriados, escala de trabalho, preços, disponibilidade ou aprovação da entidade empregadora.
        Não reservam nem marcam férias; a meta de 28 dias não substitui o direito contratual.
      </p>
    </section>
  )
}
