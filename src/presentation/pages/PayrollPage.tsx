import { useEffect, useMemo, useState } from 'react'
import { calculatePayroll } from '../../application/payroll/calculatePayroll'
import {
  defaultPayrollConfig,
  type IrsProfile2026,
  type MealAllowanceMethod,
  type PayrollConfig,
  type PayrollDayKind,
  type PayrollDayPlan,
} from '../../domain/payroll/Payroll'
import { pushAppNotification } from '../store/useNotificationStore'

const CONFIG_KEY = 'foco-jornada-payroll-config-v1'
const PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

const dayKinds: Array<{ value: PayrollDayKind; label: string; short: string }> = [
  { value: 'work', label: 'Trabalho', short: 'T' },
  { value: 'rest', label: 'Folga', short: 'F' },
  { value: 'holiday', label: 'Feriado', short: 'FER' },
  { value: 'vacation', label: 'Férias', short: 'FV' },
  { value: 'absence-justified-paid', label: 'Falta justificada paga', short: 'FJ' },
  { value: 'absence-justified-unpaid', label: 'Falta justificada não paga', short: 'FJN' },
  { value: 'absence-unjustified', label: 'Falta injustificada', short: 'FI' },
]

const numericConfigKeys = [
  'baseSalary',
  'weeklyHours',
  'mealAllowancePerDay',
  'socialSecurityRate',
  'dependents',
  'overtimeHoursBeforeMonth',
  'vacationSubsidy',
  'christmasSubsidy',
  'otherTaxableAllowances',
  'otherExemptAllowances',
  'otherDeductions',
  'paymentDay',
] as const

type NumericConfigKey = (typeof numericConfigKeys)[number]

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function readStoredConfig(): PayrollConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return defaultPayrollConfig
    return { ...defaultPayrollConfig, ...(JSON.parse(raw) as Partial<PayrollConfig>) }
  } catch {
    return defaultPayrollConfig
  }
}

function buildDefaultPlan(month: string): PayrollDayPlan[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const totalDays = new Date(year, monthNumber, 0).getDate()

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1
    const date = `${month}-${String(day).padStart(2, '0')}`
    const weekday = new Date(year, monthNumber - 1, day).getDay()
    return {
      date,
      kind: weekday === 0 || weekday === 6 ? 'rest' : 'work',
      overtimeHours: 0,
      note: '',
    }
  })
}

function readStoredPlan(month: string): PayrollDayPlan[] {
  try {
    const raw = localStorage.getItem(`${PLAN_PREFIX}${month}`)
    if (!raw) return buildDefaultPlan(month)
    const parsed = JSON.parse(raw) as PayrollDayPlan[]
    const defaults = buildDefaultPlan(month)
    const byDate = new Map(parsed.map((item) => [item.date, item]))
    return defaults.map((item) => ({ ...item, ...(byDate.get(item.date) ?? {}) }))
  } catch {
    return buildDefaultPlan(month)
  }
}

function money(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  )
}

function dayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day))
}

function kindMeta(kind: PayrollDayKind) {
  return dayKinds.find((item) => item.value === kind) ?? dayKinds[0]
}

export function PayrollPage() {
  const [month, setMonth] = useState(currentMonthKey)
  const [config, setConfig] = useState<PayrollConfig>(readStoredConfig)
  const [plans, setPlans] = useState<PayrollDayPlan[]>(() => readStoredPlan(currentMonthKey()))
  const [selectedDate, setSelectedDate] = useState(() => `${currentMonthKey()}-01`)

  useEffect(() => {
    const next = readStoredPlan(month)
    setPlans(next)
    setSelectedDate(next[0]?.date ?? `${month}-01`)
  }, [month])

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }, [config])

  useEffect(() => {
    localStorage.setItem(`${PLAN_PREFIX}${month}`, JSON.stringify(plans))
  }, [month, plans])

  const result = useMemo(() => calculatePayroll(config, plans), [config, plans])
  const selectedPlan = plans.find((item) => item.date === selectedDate) ?? plans[0]
  const firstWeekday = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const jsDay = new Date(year, monthNumber - 1, 1).getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  }, [month])

  const receiptAbonos = result.grossTotal + result.absenceDeduction
  const receiptDiscounts =
    result.socialSecurity + result.irsTotal + config.otherDeductions + result.absenceDeduction

  function setNumericConfig(key: NumericConfigKey, raw: string) {
    const number = Number(raw.replace(',', '.'))
    setConfig((current) => ({ ...current, [key]: Number.isFinite(number) ? number : 0 }))
  }

  function updateSelectedPlan(patch: Partial<PayrollDayPlan>) {
    if (!selectedPlan) return
    setPlans((current) =>
      current.map((item) => (item.date === selectedPlan.date ? { ...item, ...patch } : item)),
    )
  }

  function fillWeekPattern() {
    setPlans(buildDefaultPlan(month))
    pushAppNotification('success', 'Planificação reposta', 'Dias úteis como trabalho e fins de semana como folga.')
  }

  function savePlan() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    localStorage.setItem(`${PLAN_PREFIX}${month}`, JSON.stringify(plans))
    pushAppNotification(
      'success',
      'Planificação salarial guardada',
      `Previsão líquida de ${money(result.netEstimate)} para pagamento no dia ${config.paymentDay}.`,
    )
  }

  return (
    <section className="payrollPage" aria-labelledby="payroll-title">
      <header className="payrollHeader">
        <div>
          <span className="eyebrow">SALÁRIO & PLANIFICAÇÃO</span>
          <h1 id="payroll-title">Previsão do vencimento</h1>
          <p>
            Planeia trabalho, folgas, feriados, faltas e horas extra e acompanha uma estimativa do recibo.
          </p>
        </div>
        <label className="payrollMonthPicker">
          <span>Mês</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

      <section className="payrollHero" aria-label="Resumo salarial">
        <div>
          <span>PREVISÃO PARA DIA {config.paymentDay}</span>
          <strong>{money(result.netEstimate)}</strong>
          <small>{monthLabel(month)}</small>
        </div>
        <div className="payrollHeroStats">
          <span><small>Abonos</small><strong>{money(receiptAbonos)}</strong></span>
          <span><small>Seg. Social</small><strong>-{money(result.socialSecurity)}</strong></span>
          <span><small>IRS</small><strong>-{money(result.irsTotal)}</strong></span>
          <span><small>Horas extra</small><strong>{result.overtimeHours.toFixed(2)} h</strong></span>
        </div>
      </section>

      <div className="payrollLayout">
        <section className="payrollPanel payrollCalendarPanel" aria-labelledby="calendar-title">
          <div className="payrollSectionHeader">
            <div>
              <span>PLANIFICAÇÃO</span>
              <h2 id="calendar-title">{monthLabel(month)}</h2>
            </div>
            <button type="button" className="payrollGhostButton" onClick={fillWeekPattern}>Repor padrão</button>
          </div>

          <div className="payrollWeekdays" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => <span key={label}>{label}</span>)}
          </div>

          <div className="payrollCalendar">
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
            {plans.map((day) => {
              const meta = kindMeta(day.kind)
              const dayNumber = Number(day.date.slice(-2))
              return (
                <button
                  type="button"
                  key={day.date}
                  className={`payrollDay payrollDay-${day.kind}${selectedDate === day.date ? ' payrollDaySelected' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                  aria-label={`${dayNumber}, ${meta.label}`}
                >
                  <span>{dayNumber}</span>
                  <small>{meta.short}</small>
                  {day.overtimeHours > 0 ? <b>{day.overtimeHours}h+</b> : null}
                </button>
              )
            })}
          </div>

          <div className="payrollLegend">
            {dayKinds.map((item) => (
              <span key={item.value}><i className={`payrollLegendDot payrollLegendDot-${item.value}`} />{item.label}</span>
            ))}
          </div>
        </section>

        <section className="payrollPanel payrollDayEditor" aria-labelledby="day-editor-title">
          <div className="payrollSectionHeader">
            <div>
              <span>DIA SELECIONADO</span>
              <h2 id="day-editor-title">{selectedPlan ? dayLabel(selectedPlan.date) : 'Dia'}</h2>
            </div>
          </div>

          {selectedPlan ? (
            <div className="payrollFormGrid payrollFormGridSingle">
              <label>
                <span>Situação</span>
                <select
                  value={selectedPlan.kind}
                  onChange={(event) => updateSelectedPlan({ kind: event.target.value as PayrollDayKind })}
                >
                  {dayKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label>
                <span>Horas extra / trabalho em folga ou feriado</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={selectedPlan.overtimeHours}
                  onChange={(event) => updateSelectedPlan({ overtimeHours: Math.max(0, Number(event.target.value) || 0) })}
                />
              </label>

              <label>
                <span>Observação</span>
                <input
                  type="text"
                  value={selectedPlan.note ?? ''}
                  placeholder="Ex.: turno 14:00–22:00"
                  onChange={(event) => updateSelectedPlan({ note: event.target.value })}
                />
              </label>

              <p className="payrollHint">
                Em folga ou feriado, as horas registadas são calculadas como trabalho suplementar nesses dias.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="payrollPanel" aria-labelledby="config-title">
        <div className="payrollSectionHeader">
          <div>
            <span>CONTRATO E RECIBO</span>
            <h2 id="config-title">Dados para o cálculo</h2>
          </div>
        </div>

        <div className="payrollFormGrid">
          <label><span>Remuneração base mensal</span><input type="number" min="0" step="0.01" value={config.baseSalary} onChange={(e) => setNumericConfig('baseSalary', e.target.value)} /></label>
          <label><span>Horas semanais</span><input type="number" min="1" step="0.5" value={config.weeklyHours} onChange={(e) => setNumericConfig('weeklyHours', e.target.value)} /></label>
          <label><span>Subsídio alimentação / dia</span><input type="number" min="0" step="0.01" value={config.mealAllowancePerDay} onChange={(e) => setNumericConfig('mealAllowancePerDay', e.target.value)} /></label>
          <label>
            <span>Pagamento alimentação</span>
            <select value={config.mealAllowanceMethod} onChange={(e) => setConfig((c) => ({ ...c, mealAllowanceMethod: e.target.value as MealAllowanceMethod }))}>
              <option value="cash">Dinheiro / recibo</option>
              <option value="card">Cartão refeição</option>
            </select>
          </label>
          <label><span>Segurança Social (%)</span><input type="number" min="0" step="0.01" value={config.socialSecurityRate} onChange={(e) => setNumericConfig('socialSecurityRate', e.target.value)} /></label>
          <label><span>Dia habitual de pagamento</span><input type="number" min="1" max="31" value={config.paymentDay} onChange={(e) => setNumericConfig('paymentDay', e.target.value)} /></label>
          <label>
            <span>Tabela IRS 2026 — Continente</span>
            <select value={config.irsProfile} onChange={(e) => setConfig((c) => ({ ...c, irsProfile: e.target.value as IrsProfile2026 }))}>
              <option value="table-1">Não casado sem dependentes / casado 2 titulares</option>
              <option value="table-2">Não casado com dependentes</option>
              <option value="table-3">Casado, único titular</option>
            </select>
          </label>
          <label><span>N.º de dependentes</span><input type="number" min="0" step="1" value={config.dependents} onChange={(e) => setNumericConfig('dependents', e.target.value)} /></label>
          <label><span>Horas extra acumuladas antes deste mês</span><input type="number" min="0" step="0.25" value={config.overtimeHoursBeforeMonth} onChange={(e) => setNumericConfig('overtimeHoursBeforeMonth', e.target.value)} /></label>
          <label><span>Subsídio de férias pago neste recibo</span><input type="number" min="0" step="0.01" value={config.vacationSubsidy} onChange={(e) => setNumericConfig('vacationSubsidy', e.target.value)} /></label>
          <label><span>Subsídio de Natal pago neste recibo</span><input type="number" min="0" step="0.01" value={config.christmasSubsidy} onChange={(e) => setNumericConfig('christmasSubsidy', e.target.value)} /></label>
          <label><span>Outros abonos sujeitos</span><input type="number" min="0" step="0.01" value={config.otherTaxableAllowances} onChange={(e) => setNumericConfig('otherTaxableAllowances', e.target.value)} /></label>
          <label><span>Outros abonos isentos</span><input type="number" min="0" step="0.01" value={config.otherExemptAllowances} onChange={(e) => setNumericConfig('otherExemptAllowances', e.target.value)} /></label>
          <label><span>Outros descontos</span><input type="number" min="0" step="0.01" value={config.otherDeductions} onChange={(e) => setNumericConfig('otherDeductions', e.target.value)} /></label>
        </div>

        <button type="button" className="payrollPrimaryButton" onClick={savePlan}>Guardar planificação e cálculo</button>
      </section>

      <section className="payrollPanel payrollReceipt" aria-labelledby="receipt-title">
        <div className="payrollSectionHeader">
          <div>
            <span>RECIBO ESTIMADO</span>
            <h2 id="receipt-title">Detalhe do vencimento</h2>
          </div>
          <strong className="payrollReceiptNet">{money(result.netEstimate)}</strong>
        </div>

        <div className="payrollReceiptTable" role="table" aria-label="Estimativa de recibo">
          <div className="payrollReceiptRow payrollReceiptHead" role="row">
            <span>Designação</span><span>Qtd.</span><span>Valor unit.</span><span>Abonos</span><span>Descontos</span>
          </div>
          <div className="payrollReceiptRow"><strong>Remuneração normal</strong><span>1</span><span>—</span><span>{money(config.baseSalary)}</span><span>—</span></div>
          <div className="payrollReceiptRow"><strong>Subsídio alimentação</strong><span>{result.mealDays}</span><span>{money(config.mealAllowancePerDay)}</span><span>{money(result.mealAllowanceGross)}</span><span>—</span></div>
          <div className="payrollReceiptRow"><strong>Trabalho suplementar</strong><span>{result.overtimeHours.toFixed(2)} h</span><span>{money(result.hourlyRate)}/h</span><span>{money(result.overtimePay)}</span><span>—</span></div>
          {config.vacationSubsidy > 0 ? <div className="payrollReceiptRow"><strong>Subsídio de férias</strong><span>1</span><span>—</span><span>{money(config.vacationSubsidy)}</span><span>—</span></div> : null}
          {config.christmasSubsidy > 0 ? <div className="payrollReceiptRow"><strong>Subsídio de Natal</strong><span>1</span><span>—</span><span>{money(config.christmasSubsidy)}</span><span>—</span></div> : null}
          {config.otherTaxableAllowances > 0 ? <div className="payrollReceiptRow"><strong>Outros abonos sujeitos</strong><span>—</span><span>—</span><span>{money(config.otherTaxableAllowances)}</span><span>—</span></div> : null}
          {config.otherExemptAllowances > 0 ? <div className="payrollReceiptRow"><strong>Outros abonos isentos</strong><span>—</span><span>—</span><span>{money(config.otherExemptAllowances)}</span><span>—</span></div> : null}
          {result.absenceDeduction > 0 ? <div className="payrollReceiptRow payrollReceiptDeduction"><strong>Faltas não remuneradas</strong><span>{result.justifiedUnpaidAbsenceDays + result.unjustifiedAbsenceDays}</span><span>—</span><span>—</span><span>{money(result.absenceDeduction)}</span></div> : null}
          <div className="payrollReceiptRow payrollReceiptDeduction"><strong>Segurança Social</strong><span>{config.socialSecurityRate}%</span><span>—</span><span>—</span><span>{money(result.socialSecurity)}</span></div>
          {result.irsNormal > 0 ? <div className="payrollReceiptRow payrollReceiptDeduction"><strong>IRS — remuneração</strong><span>—</span><span>—</span><span>—</span><span>{money(result.irsNormal)}</span></div> : null}
          {result.irsOvertime > 0 ? <div className="payrollReceiptRow payrollReceiptDeduction"><strong>IRS — trabalho suplementar</strong><span>—</span><span>—</span><span>—</span><span>{money(result.irsOvertime)}</span></div> : null}
          {result.irsVacation + result.irsChristmas > 0 ? <div className="payrollReceiptRow payrollReceiptDeduction"><strong>IRS — subsídios</strong><span>—</span><span>—</span><span>—</span><span>{money(result.irsVacation + result.irsChristmas)}</span></div> : null}
          {config.otherDeductions > 0 ? <div className="payrollReceiptRow payrollReceiptDeduction"><strong>Outros descontos</strong><span>—</span><span>—</span><span>—</span><span>{money(config.otherDeductions)}</span></div> : null}
          <div className="payrollReceiptRow payrollReceiptTotals"><strong>Totais</strong><span></span><span></span><span>{money(receiptAbonos)}</span><span>{money(receiptDiscounts)}</span></div>
        </div>
      </section>

      <section className="payrollFacts" aria-label="Indicadores do mês">
        <article><span>Dias trabalho</span><strong>{result.workDays}</strong></article>
        <article><span>Dias alimentação</span><strong>{result.mealDays}</strong></article>
        <article><span>Folgas</span><strong>{result.restDays}</strong></article>
        <article><span>Feriados</span><strong>{result.holidayDays}</strong></article>
        <article><span>Férias</span><strong>{result.vacationDays}</strong></article>
        <article><span>Faltas</span><strong>{result.justifiedPaidAbsenceDays + result.justifiedUnpaidAbsenceDays + result.unjustifiedAbsenceDays}</strong></article>
        <article><span>Valor hora base</span><strong>{money(result.hourlyRate)}</strong></article>
      </section>

      <aside className="payrollLegalNote">
        <strong>Critérios usados nesta versão</strong>
        <p>
          Segurança Social configurada a 11% por defeito. IRS usa as tabelas de retenção de 2026 do Continente para trabalhador sem deficiência. Trabalho suplementar aplica os acréscimos gerais do Código do Trabalho, distinguindo até 100 horas anuais e acima de 100 horas. O subsídio de alimentação usa como referência fiscal 6,15 € em dinheiro e 10,46 € em cartão. Convenções coletivas, regras internas, duodécimos, deficiência, Açores/Madeira e abonos especiais podem alterar o recibo final.
        </p>
      </aside>
    </section>
  )
}
