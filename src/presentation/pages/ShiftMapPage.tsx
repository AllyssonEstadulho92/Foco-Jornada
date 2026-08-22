import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { calculatePayroll } from '../../application/payroll/calculatePayroll'
import {
  formatPlannedMinutes,
  getScheduleSummary,
  resolveWorkScheduleForDate,
} from '../../domain/journey/WorkSchedule'
import {
  defaultPayrollConfig,
  type PayrollConfig,
  type PayrollDayKind,
  type PayrollDayPlan,
} from '../../domain/payroll/Payroll'
import {
  getShiftEffectiveMinutes,
  summarizeShiftMap,
  toPayrollDayPlan,
  type ShiftMapDay,
} from '../../domain/shifts/ShiftMap'
import type { AppSettings } from '../../domain/settings/AppSettings'
import { useSettingsController } from '../hooks/useSettingsController'
import { pushAppNotification } from '../store/useNotificationStore'

const PAYROLL_CONFIG_KEY = 'foco-jornada-payroll-config-v1'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'
const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'

const dayKinds: Array<{ value: PayrollDayKind; label: string; code: string }> = [
  { value: 'work', label: 'Trabalho', code: 'T' },
  { value: 'rest', label: 'Folga', code: 'F' },
  { value: 'holiday', label: 'Feriado', code: 'FER' },
  { value: 'vacation', label: 'Férias', code: 'FV' },
  { value: 'absence-justified-paid', label: 'Falta justificada paga', code: 'FJ' },
  { value: 'absence-justified-unpaid', label: 'Falta justificada não paga', code: 'FJN' },
  { value: 'absence-unjustified', label: 'Falta injustificada', code: 'FI' },
]

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthDates(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return []
  const totalDays = new Date(year, monthNumber, 0).getDate()
  return Array.from({ length: totalDays }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)
}

function mondayFirstIndex(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const jsDay = new Date(year, monthNumber - 1, 1).getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  )
}

function dateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function money(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

function readPayrollConfig(): PayrollConfig {
  try {
    const raw = localStorage.getItem(PAYROLL_CONFIG_KEY)
    if (!raw) return defaultPayrollConfig
    return { ...defaultPayrollConfig, ...(JSON.parse(raw) as Partial<PayrollConfig>) }
  } catch {
    return defaultPayrollConfig
  }
}

function readPayrollPlan(month: string): PayrollDayPlan[] {
  try {
    const raw = localStorage.getItem(`${PAYROLL_PLAN_PREFIX}${month}`)
    return raw ? (JSON.parse(raw) as PayrollDayPlan[]) : []
  } catch {
    return []
  }
}

function readShiftMap(month: string): Partial<ShiftMapDay>[] {
  try {
    const raw = localStorage.getItem(`${SHIFT_MAP_PREFIX}${month}`)
    return raw ? (JSON.parse(raw) as Partial<ShiftMapDay>[]) : []
  } catch {
    return []
  }
}

function baseDays(month: string, settings: AppSettings): ShiftMapDay[] {
  return monthDates(month).map((date) => {
    const resolved = resolveWorkScheduleForDate(settings.workSchedule, date)
    const summary = getScheduleSummary(settings.workSchedule, date)
    return {
      date,
      kind: resolved.isWorkingDay ? 'work' : 'rest',
      startTime: resolved.isWorkingDay ? resolved.startTime : '',
      endTime: resolved.isWorkingDay ? resolved.endTime : '',
      breakMinutes: resolved.isWorkingDay ? summary.breakMinutes : 0,
      overtimeHours: 0,
      note: '',
    }
  })
}

function loadMonth(month: string, settings: AppSettings): ShiftMapDay[] {
  const payrollByDate = new Map(readPayrollPlan(month).map((item) => [item.date, item]))
  const shiftByDate = new Map(
    readShiftMap(month)
      .filter((item): item is Partial<ShiftMapDay> & { date: string } => Boolean(item.date))
      .map((item) => [item.date, item]),
  )

  return baseDays(month, settings).map((base) => {
    const payroll = payrollByDate.get(base.date)
    const payrollKind = payroll?.kind ?? base.kind
    const initial: ShiftMapDay = {
      ...base,
      kind: payrollKind,
      startTime: payrollKind === 'work' ? base.startTime : '',
      endTime: payrollKind === 'work' ? base.endTime : '',
      breakMinutes: payrollKind === 'work' ? base.breakMinutes : 0,
      overtimeHours: Math.max(0, payroll?.overtimeHours ?? 0),
      note: payroll?.note ?? '',
    }
    const merged = { ...initial, ...(shiftByDate.get(base.date) ?? {}), date: base.date }

    return {
      ...merged,
      date: base.date,
      breakMinutes: Math.max(0, Number(merged.breakMinutes) || 0),
      overtimeHours: Math.max(0, Number(merged.overtimeHours) || 0),
      note: String(merged.note ?? ''),
    }
  })
}

function kindMeta(kind: PayrollDayKind) {
  return dayKinds.find((item) => item.value === kind) ?? dayKinds[0]
}

function shiftTimeLabel(day: ShiftMapDay) {
  if (!day.startTime || !day.endTime) return kindMeta(day.kind).label
  return `${day.startTime}–${day.endTime}`
}

export function ShiftMapPage() {
  const { settings, isLoading: settingsLoading } = useSettingsController()
  const [month, setMonth] = useState(currentMonthKey)
  const [days, setDays] = useState<ShiftMapDay[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig>(readPayrollConfig)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (settingsLoading) return
    const loaded = loadMonth(month, settings)
    setDays(loaded)
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setSelectedDate(loaded.some((item) => item.date === todayKey) ? todayKey : loaded[0]?.date ?? '')
    setPayrollConfig(readPayrollConfig())
    setLastSavedAt(null)
  }, [month, settings, settingsLoading])

  const selectedDay = days.find((item) => item.date === selectedDate)
  const firstWeekday = useMemo(() => mondayFirstIndex(month), [month])
  const summary = useMemo(() => summarizeShiftMap(days), [days])
  const payrollPlan = useMemo(() => days.map(toPayrollDayPlan), [days])
  const payrollResult = useMemo(
    () => calculatePayroll(payrollConfig, payrollPlan),
    [payrollConfig, payrollPlan],
  )

  function updateSelected(patch: Partial<ShiftMapDay>) {
    if (!selectedDate) return
    setDays((current) =>
      current.map((item) => (item.date === selectedDate ? { ...item, ...patch } : item)),
    )
  }

  function updateSelectedKind(kind: PayrollDayKind) {
    if (!selectedDay) return

    if (kind === 'work') {
      const resolved = resolveWorkScheduleForDate(settings.workSchedule, selectedDay.date)
      const plan = getScheduleSummary(settings.workSchedule, selectedDay.date)
      updateSelected({
        kind,
        startTime: selectedDay.startTime || resolved.startTime,
        endTime: selectedDay.endTime || resolved.endTime,
        breakMinutes:
          selectedDay.startTime && selectedDay.endTime ? selectedDay.breakMinutes : plan.breakMinutes,
      })
      return
    }

    if (kind === 'vacation' || kind.startsWith('absence-')) {
      updateSelected({ kind, startTime: '', endTime: '', breakMinutes: 0, overtimeHours: 0 })
      return
    }

    updateSelected({ kind, startTime: '', endTime: '', breakMinutes: 0 })
  }

  function applyBaseToSelected() {
    if (!selectedDay) return
    const resolved = resolveWorkScheduleForDate(settings.workSchedule, selectedDay.date)
    const plan = getScheduleSummary(settings.workSchedule, selectedDay.date)
    updateSelected({
      kind: resolved.isWorkingDay ? 'work' : 'rest',
      startTime: resolved.isWorkingDay ? resolved.startTime : '',
      endTime: resolved.isWorkingDay ? resolved.endTime : '',
      breakMinutes: resolved.isWorkingDay ? plan.breakMinutes : 0,
      overtimeHours: 0,
    })
  }

  function copySelectedShiftToWorkDays() {
    if (!selectedDay?.startTime || !selectedDay.endTime) return
    if (!window.confirm('Aplicar este turno aos restantes dias marcados como Trabalho neste mês?')) return
    setDays((current) =>
      current.map((item) =>
        item.kind === 'work'
          ? {
              ...item,
              startTime: selectedDay.startTime,
              endTime: selectedDay.endTime,
              breakMinutes: selectedDay.breakMinutes,
            }
          : item,
      ),
    )
  }

  function resetMonthToBase() {
    if (!window.confirm('Repor este mês com o horário base e os fins de semana definidos?')) return
    const next = baseDays(month, settings)
    setDays(next)
    setSelectedDate(next[0]?.date ?? '')
    pushAppNotification(
      'info',
      'Horário reposto',
      'O horário base foi aplicado ao mês. Carrega em Guardar mapa para confirmar.',
    )
  }

  function saveMap() {
    localStorage.setItem(`${SHIFT_MAP_PREFIX}${month}`, JSON.stringify(days))
    localStorage.setItem(`${PAYROLL_PLAN_PREFIX}${month}`, JSON.stringify(payrollPlan))
    const now = new Date()
    setLastSavedAt(now.toISOString())
    pushAppNotification(
      'success',
      'Mapa guardado',
      `${monthLabel(month)} · ${formatPlannedMinutes(summary.effectiveMinutes)} efetivas · líquido estimado ${money(payrollResult.netEstimate)}.`,
    )
  }

  const selectedEffective = selectedDay ? getShiftEffectiveMinutes(selectedDay) : 0

  return (
    <section className="shiftMapPage" aria-labelledby="shift-map-title">
      <header className="shiftMapHeader">
        <div>
          <span className="eyebrow">TURNOS & VENCIMENTO</span>
          <h1 id="shift-map-title">Mapa de turnos</h1>
          <p>Organiza os teus turnos do mês e vê o impacto no vencimento.</p>
        </div>
        <label className="shiftMapMonthPicker">
          <span>Mês</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

      <section className="shiftMapCommand" aria-label="Ações do mapa">
        <div>
          <span>ESTE MÊS</span>
          <strong>{monthLabel(month)}</strong>
          <small>
            {lastSavedAt
              ? `Guardado às ${new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSavedAt))}`
              : 'Alterações ainda não guardadas'}
          </small>
        </div>
        <div className="shiftMapCommandActions">
          <button type="button" onClick={resetMonthToBase}>Repor horário</button>
          <button type="button" className="shiftMapSaveButton" onClick={saveMap}>Guardar mapa</button>
        </div>
      </section>

      <section className="shiftMapOverview" aria-label="Resumo do mês">
        <article><span>Turnos</span><strong>{summary.workDays}</strong></article>
        <article><span>Horas</span><strong>{formatPlannedMinutes(summary.plannedMinutes)}</strong></article>
        <article><span>Pausas</span><strong>{formatPlannedMinutes(summary.breakMinutes)}</strong></article>
        <article className="shiftMapOverviewPrimary"><span>Efetivo</span><strong>{formatPlannedMinutes(summary.effectiveMinutes)}</strong></article>
        <article><span>Horas extra</span><strong>{summary.overtimeHours.toFixed(2)} h</strong></article>
      </section>

      <section className="shiftMapPanel" aria-labelledby="monthly-map-title">
        <div className="shiftMapSectionHeader">
          <div><span>CALENDÁRIO</span><h2 id="monthly-map-title">Turnos do mês</h2></div>
          <small>Toca num dia para ver ou editar o turno.</small>
        </div>

        <div className="shiftMapCalendarScroll" tabIndex={0} aria-label="Mapa mensal de turnos com deslocação horizontal">
          <div className="shiftMapCalendar">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((weekday) => (
              <div className="shiftMapWeekday" key={weekday}>{weekday}</div>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span className="shiftMapBlank" key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const meta = kindMeta(day.kind)
              const effective = getShiftEffectiveMinutes(day)
              return (
                <button
                  type="button"
                  key={day.date}
                  className={`shiftMapDay shiftMapDay-${day.kind}${selectedDate === day.date ? ' shiftMapDaySelected' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                  aria-label={`${dateLabel(day.date)}: ${meta.label}, ${shiftTimeLabel(day)}`}
                >
                  <span className="shiftMapDayNumber">{Number(day.date.slice(-2))}</span>
                  <strong>{meta.code}</strong>
                  <small>{shiftTimeLabel(day)}</small>
                  {effective > 0 ? <em>{formatPlannedMinutes(effective)} efet.</em> : null}
                  {day.overtimeHours > 0 ? <b>{day.overtimeHours}h extra</b> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="shiftMapLegend" aria-label="Legenda">
          {dayKinds.map((item) => (
            <span key={item.value}>
              <i className={`shiftMapLegendDot shiftMapLegendDot-${item.value}`} />
              {item.code} · {item.label}
            </span>
          ))}
        </div>
      </section>

      {selectedDay ? (
        <section className="shiftMapEditor" aria-labelledby="shift-day-editor-title">
          <div className="shiftMapSectionHeader">
            <div><span>DIA SELECIONADO</span><h2 id="shift-day-editor-title">{dateLabel(selectedDay.date)}</h2></div>
            <strong className="shiftMapEffectiveBadge">{formatPlannedMinutes(selectedEffective)} efetivas</strong>
          </div>

          <div className="shiftMapEditorGrid">
            <label>
              <span>Situação RH</span>
              <select value={selectedDay.kind} onChange={(event) => updateSelectedKind(event.target.value as PayrollDayKind)}>
                {dayKinds.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Entrada</span>
              <input type="time" value={selectedDay.startTime} onChange={(event) => updateSelected({ startTime: event.target.value })} />
            </label>
            <label>
              <span>Saída</span>
              <input type="time" value={selectedDay.endTime} onChange={(event) => updateSelected({ endTime: event.target.value })} />
            </label>
            <label>
              <span>Pausa total</span>
              <div className="inputWithSuffix">
                <input type="number" min="0" max="720" value={selectedDay.breakMinutes} onChange={(event) => updateSelected({ breakMinutes: Math.max(0, Number(event.target.value) || 0) })} />
                <span>min</span>
              </div>
            </label>
            <label>
              <span>Horas extra remuneráveis</span>
              <div className="inputWithSuffix">
                <input type="number" min="0" max="24" step="0.25" value={selectedDay.overtimeHours} onChange={(event) => updateSelected({ overtimeHours: Math.max(0, Number(event.target.value) || 0) })} />
                <span>h</span>
              </div>
            </label>
            <label className="shiftMapEditorWide">
              <span>Nota</span>
              <input type="text" maxLength={180} value={selectedDay.note} placeholder="Ex.: troca de turno, consulta, autorização..." onChange={(event) => updateSelected({ note: event.target.value })} />
            </label>
          </div>

          <div className="shiftMapEditorActions">
            <button type="button" onClick={applyBaseToSelected}>Usar horário base</button>
            <button type="button" onClick={copySelectedShiftToWorkDays} disabled={!selectedDay.startTime || !selectedDay.endTime}>Aplicar a dias de trabalho</button>
          </div>
        </section>
      ) : null}

      <div className="shiftMapLowerGrid">
        <section className="shiftMapPanel shiftMapRhPanel" aria-labelledby="rh-summary-title">
          <div className="shiftMapSectionHeader">
            <div><span>RESUMO</span><h2 id="rh-summary-title">Situações do mês</h2></div>
          </div>
          <dl>
            <div><dt>Trabalho</dt><dd>{summary.workDays}</dd></div>
            <div><dt>Folgas</dt><dd>{summary.restDays}</dd></div>
            <div><dt>Feriados</dt><dd>{summary.holidayDays}</dd></div>
            <div><dt>Férias</dt><dd>{summary.vacationDays}</dd></div>
            <div><dt>Faltas justificadas pagas</dt><dd>{summary.paidAbsenceDays}</dd></div>
            <div><dt>Faltas não remuneradas</dt><dd>{summary.unpaidAbsenceDays}</dd></div>
          </dl>
        </section>

        <section className="shiftMapSalaryPanel" aria-labelledby="salary-map-title">
          <div className="shiftMapSalaryHero">
            <span>VENCIMENTO ESTIMADO</span>
            <strong id="salary-map-title">{money(payrollResult.netEstimate)}</strong>
            <small>Estimativa líquida com os dados guardados</small>
          </div>
          <div className="shiftMapSalaryBreakdown">
            <div><span>Bruto</span><strong>{money(payrollResult.grossTotal)}</strong></div>
            <div><span>Subsídio refeição</span><strong>{money(payrollResult.mealAllowanceGross)}</strong></div>
            <div><span>Horas extra</span><strong>{money(payrollResult.overtimePay)}</strong></div>
            <div><span>Ausências não pagas</span><strong>-{money(payrollResult.absenceDeduction)}</strong></div>
            <div><span>Segurança Social</span><strong>-{money(payrollResult.socialSecurity)}</strong></div>
            <div><span>IRS</span><strong>-{money(payrollResult.irsTotal)}</strong></div>
          </div>
          <p>
            A estimativa usa os turnos, faltas, horas extra e dados fiscais guardados. Mantém estes dados atualizados para comparar com o recibo real.
          </p>
          <NavLink className="shiftMapPayrollLink" to="/vencimento">Rever dados do vencimento</NavLink>
        </section>
      </div>

      <section className="shiftMapAccountingNote" aria-label="Como é calculado o vencimento">
        <strong>Como é calculado</strong>
        <p>
          O mapa envia a situação de cada dia e as horas extra para o cálculo do vencimento. Entrada, saída e pausa servem para apurar o tempo do turno. Regista em “Horas extra remuneráveis” apenas o tempo suplementar que deve ser pago.
        </p>
      </section>
    </section>
  )
}
