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
const PROFILE_KEY = 'foco-jornada-payroll-profile-v1'

const dayKinds: Array<{ value: PayrollDayKind; label: string; short: string }> = [
  { value: 'work', label: 'Trabalho', short: 'T' },
  { value: 'rest', label: 'Folga', short: 'F' },
  { value: 'holiday', label: 'Feriado', short: 'FER' },
  { value: 'vacation', label: 'Férias', short: 'FV' },
  { value: 'absence-justified-paid', label: 'Falta justificada paga', short: 'FJ' },
  { value: 'absence-justified-unpaid', label: 'Falta justificada não paga', short: 'FJN' },
  { value: 'absence-unjustified', label: 'Falta injustificada', short: 'FI' },
]

type NumericConfigKey =
  | 'baseSalary'
  | 'weeklyHours'
  | 'mealAllowancePerDay'
  | 'socialSecurityRate'
  | 'dependents'
  | 'overtimeHoursBeforeMonth'
  | 'vacationSubsidy'
  | 'christmasSubsidy'
  | 'otherTaxableAllowances'
  | 'otherExemptAllowances'
  | 'otherDeductions'
  | 'paymentDay'

type OptionalNumericConfigKey =
  | 'mealDaysOverride'
  | 'hourlyRateOverride'
  | 'absenceDeductionOverride'
  | 'overtimePayOverride'
  | 'socialSecurityOverride'
  | 'irsOverride'

type ReceiptProfile = {
  role: string
  category: string
  employeeNumber: string
  normalQuantity: string
}

const emptyReceiptProfile: ReceiptProfile = {
  role: '',
  category: '',
  employeeNumber: '',
  normalQuantity: '',
}

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

function readStoredProfile(): ReceiptProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return emptyReceiptProfile
    return { ...emptyReceiptProfile, ...(JSON.parse(raw) as Partial<ReceiptProfile>) }
  } catch {
    return emptyReceiptProfile
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

function FieldHelp({ children }: { children: string }) {
  return <small className="payrollFieldHelp">{children}</small>
}

export function PayrollPage() {
  const [month, setMonth] = useState(currentMonthKey)
  const [config, setConfig] = useState<PayrollConfig>(readStoredConfig)
  const [profile, setProfile] = useState<ReceiptProfile>(readStoredProfile)
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
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

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
  const hasManualOverrides =
    config.mealDaysOverride !== null ||
    config.hourlyRateOverride !== null ||
    config.absenceDeductionOverride !== null ||
    config.overtimePayOverride !== null ||
    config.socialSecurityOverride !== null ||
    config.irsOverride !== null

  function setNumericConfig(key: NumericConfigKey, raw: string) {
    const number = Number(raw.replace(',', '.'))
    setConfig((current) => ({ ...current, [key]: Number.isFinite(number) ? number : 0 }))
  }

  function setOptionalNumericConfig(key: OptionalNumericConfigKey, raw: string) {
    const normalized = raw.trim().replace(',', '.')
    if (!normalized) {
      setConfig((current) => ({ ...current, [key]: null }))
      return
    }

    const number = Number(normalized)
    setConfig((current) => ({
      ...current,
      [key]: Number.isFinite(number) ? Math.max(0, number) : null,
    }))
  }

  function updateSelectedPlan(patch: Partial<PayrollDayPlan>) {
    if (!selectedPlan) return
    setPlans((current) =>
      current.map((item) => (item.date === selectedPlan.date ? { ...item, ...patch } : item)),
    )
  }

  function fillWeekPattern() {
    setPlans(buildDefaultPlan(month))
    pushAppNotification(
      'success',
      'Planificação reposta',
      'Dias úteis como trabalho e fins de semana como folga.',
    )
  }

  function useReceiptExample() {
    setConfig({
      ...defaultPayrollConfig,
      mealDaysOverride: 23,
      hourlyRateOverride: null,
      absenceDeductionOverride: 0,
      overtimePayOverride: 0,
      socialSecurityOverride: 101.2,
      irsOverride: 0,
    })
    setProfile({
      role: 'Telefonista - Central Telefónica Privada',
      category: 'Colaboradores',
      employeeNumber: '00218681',
      normalQuantity: '31',
    })
    pushAppNotification(
      'success',
      'Exemplo do recibo preenchido',
      'Os valores são apenas uma referência e podem ser alterados manualmente.',
    )
  }

  function useAutomaticCalculation() {
    setConfig((current) => ({
      ...current,
      mealDaysOverride: null,
      hourlyRateOverride: null,
      absenceDeductionOverride: null,
      overtimePayOverride: null,
      socialSecurityOverride: null,
      irsOverride: null,
    }))
    pushAppNotification(
      'success',
      'Cálculo automático ativado',
      'Os campos manuais opcionais voltaram a ser calculados pela planificação.',
    )
  }

  function savePlan() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
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
            Preenche os teus dados, planeia trabalho, folgas, feriados, faltas e horas extra e compara a
            estimativa com o recibo.
          </p>
        </div>
        <label className="payrollMonthPicker">
          <span>Mês</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

      <section className="payrollManualIntro" aria-label="Preenchimento manual">
        <div>
          <span>PREENCHE À TUA MEDIDA</span>
          <strong>Todos os dados podem ser alterados manualmente.</strong>
          <p>
            Os exemplos servem apenas para mostrar o que colocar em cada campo. Os ajustes manuais opcionais
            substituem o cálculo automático quando forem preenchidos.
          </p>
        </div>
        <div className="payrollManualActions">
          <button type="button" className="payrollGhostButton" onClick={useReceiptExample}>
            Usar exemplo do recibo
          </button>
          <button
            type="button"
            className="payrollGhostButton"
            onClick={useAutomaticCalculation}
            disabled={!hasManualOverrides}
          >
            Voltar ao automático
          </button>
        </div>
      </section>

      <section className="payrollHero" aria-label="Resumo salarial">
        <div>
          <span>PREVISÃO PARA DIA {config.paymentDay}</span>
          <strong>{money(result.netEstimate)}</strong>
          <small>{monthLabel(month)}</small>
        </div>
        <div className="payrollHeroStats">
          <span>
            <small>Abonos</small>
            <strong>{money(receiptAbonos)}</strong>
          </span>
          <span>
            <small>Seg. Social</small>
            <strong>-{money(result.socialSecurity)}</strong>
          </span>
          <span>
            <small>IRS</small>
            <strong>-{money(result.irsTotal)}</strong>
          </span>
          <span>
            <small>Horas extra</small>
            <strong>{result.overtimeHours.toFixed(2)} h</strong>
          </span>
        </div>
      </section>

      <div className="payrollLayout">
        <section className="payrollPanel payrollCalendarPanel" aria-labelledby="calendar-title">
          <div className="payrollSectionHeader">
            <div>
              <span>PLANIFICAÇÃO</span>
              <h2 id="calendar-title">{monthLabel(month)}</h2>
            </div>
            <button type="button" className="payrollGhostButton" onClick={fillWeekPattern}>
              Repor padrão
            </button>
          </div>

          <div className="payrollWeekdays" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="payrollCalendar">
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
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
              <span key={item.value}>
                <i className={`payrollLegendDot payrollLegendDot-${item.value}`} />
                {item.label}
              </span>
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
                <span>Situação do dia</span>
                <select
                  value={selectedPlan.kind}
                  onChange={(event) =>
                    updateSelectedPlan({ kind: event.target.value as PayrollDayKind })
                  }
                >
                  {dayKinds.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <FieldHelp>Ex.: Trabalho, Folga, Feriado, Férias ou tipo de falta.</FieldHelp>
              </label>

              <label>
                <span>Horas extra / trabalho em folga ou feriado</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={selectedPlan.overtimeHours}
                  onChange={(event) =>
                    updateSelectedPlan({
                      overtimeHours: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
                <FieldHelp>Ex.: 2 para duas horas suplementares nesse dia.</FieldHelp>
              </label>

              <label>
                <span>Observação</span>
                <input
                  type="text"
                  value={selectedPlan.note ?? ''}
                  placeholder="Ex.: turno 14:00–22:00"
                  onChange={(event) => updateSelectedPlan({ note: event.target.value })}
                />
                <FieldHelp>Ex.: horário, motivo da falta, trabalho em feriado ou nota interna.</FieldHelp>
              </label>

              <p className="payrollHint">
                Em folga ou feriado, as horas registadas são tratadas como trabalho suplementar nesses dias.
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

        <div className="payrollFormSection">
          <div className="payrollFormSectionTitle">
            <strong>Identificação no recibo</strong>
            <span>Informação descritiva. Não altera o cálculo.</span>
          </div>
          <div className="payrollFormGrid">
            <label>
              <span>Função / categoria profissional</span>
              <input
                type="text"
                value={profile.role}
                placeholder="Ex.: Telefonista - Central Telefónica Privada"
                onChange={(event) => setProfile((current) => ({ ...current, role: event.target.value }))}
              />
              <FieldHelp>Ex.: a designação profissional que aparece no recibo.</FieldHelp>
            </label>
            <label>
              <span>Grupo / categoria</span>
              <input
                type="text"
                value={profile.category}
                placeholder="Ex.: Colaboradores"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, category: event.target.value }))
                }
              />
              <FieldHelp>Ex.: grupo, categoria interna ou enquadramento da empresa.</FieldHelp>
            </label>
            <label>
              <span>N.º de funcionário</span>
              <input
                type="text"
                inputMode="numeric"
                value={profile.employeeNumber}
                placeholder="Ex.: 00218681"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, employeeNumber: event.target.value }))
                }
              />
              <FieldHelp>Ex.: número interno que consta do recibo.</FieldHelp>
            </label>
            <label>
              <span>Quantidade da remuneração normal</span>
              <input
                type="text"
                inputMode="decimal"
                value={profile.normalQuantity}
                placeholder="Ex.: 31"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, normalQuantity: event.target.value }))
                }
              />
              <FieldHelp>Ex.: 31,00 quando o recibo apresenta a quantidade mensal dessa rubrica.</FieldHelp>
            </label>
          </div>
        </div>

        <div className="payrollFormSection">
          <div className="payrollFormSectionTitle">
            <strong>Contrato e retenções</strong>
            <span>Valores base usados pelo cálculo automático.</span>
          </div>
          <div className="payrollFormGrid">
            <label>
              <span>Remuneração base mensal</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.baseSalary}
                onChange={(event) => setNumericConfig('baseSalary', event.target.value)}
              />
              <FieldHelp>Ex.: 920,00 € — salário base bruto mensal.</FieldHelp>
            </label>
            <label>
              <span>Horas semanais</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="0.5"
                value={config.weeklyHours}
                onChange={(event) => setNumericConfig('weeklyHours', event.target.value)}
              />
              <FieldHelp>Ex.: 40 — carga horária semanal prevista no contrato.</FieldHelp>
            </label>
            <label>
              <span>Subsídio de alimentação por dia</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.mealAllowancePerDay}
                onChange={(event) => setNumericConfig('mealAllowancePerDay', event.target.value)}
              />
              <FieldHelp>Ex.: 6,00 € por cada dia com direito ao subsídio.</FieldHelp>
            </label>
            <label>
              <span>Forma de pagamento da alimentação</span>
              <select
                value={config.mealAllowanceMethod}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    mealAllowanceMethod: event.target.value as MealAllowanceMethod,
                  }))
                }
              >
                <option value="cash">Dinheiro / recibo</option>
                <option value="card">Cartão refeição</option>
              </select>
              <FieldHelp>Escolhe a forma usada pela empresa para o subsídio de alimentação.</FieldHelp>
            </label>
            <label>
              <span>Segurança Social (%)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.socialSecurityRate}
                onChange={(event) => setNumericConfig('socialSecurityRate', event.target.value)}
              />
              <FieldHelp>Ex.: 11% no modelo de recibo enviado.</FieldHelp>
            </label>
            <label>
              <span>Dia habitual de pagamento</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={config.paymentDay}
                onChange={(event) => setNumericConfig('paymentDay', event.target.value)}
              />
              <FieldHelp>Ex.: 25 — dia em que normalmente recebes.</FieldHelp>
            </label>
            <label>
              <span>Tabela IRS 2026 — Continente</span>
              <select
                value={config.irsProfile}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    irsProfile: event.target.value as IrsProfile2026,
                  }))
                }
              >
                <option value="table-1">Não casado sem dependentes / casado 2 titulares</option>
                <option value="table-2">Não casado com dependentes</option>
                <option value="table-3">Casado, único titular</option>
              </select>
              <FieldHelp>Escolhe a situação familiar usada na retenção. Também podes indicar IRS manual abaixo.</FieldHelp>
            </label>
            <label>
              <span>N.º de dependentes</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={config.dependents}
                onChange={(event) => setNumericConfig('dependents', event.target.value)}
              />
              <FieldHelp>Ex.: 0 quando não existem dependentes para retenção.</FieldHelp>
            </label>
          </div>
        </div>

        <div className="payrollFormSection">
          <div className="payrollFormSectionTitle">
            <strong>Abonos e descontos do mês</strong>
            <span>Preenche apenas o que existir no mês em análise.</span>
          </div>
          <div className="payrollFormGrid">
            <label>
              <span>Horas extra acumuladas antes deste mês</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.25"
                value={config.overtimeHoursBeforeMonth}
                onChange={(event) => setNumericConfig('overtimeHoursBeforeMonth', event.target.value)}
              />
              <FieldHelp>Ex.: 0. Serve para considerar o total anual de trabalho suplementar.</FieldHelp>
            </label>
            <label>
              <span>Subsídio de férias pago neste recibo</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.vacationSubsidy}
                onChange={(event) => setNumericConfig('vacationSubsidy', event.target.value)}
              />
              <FieldHelp>Ex.: 920,00 € se for pago integralmente neste recibo; 0 se não for pago.</FieldHelp>
            </label>
            <label>
              <span>Subsídio de Natal pago neste recibo</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.christmasSubsidy}
                onChange={(event) => setNumericConfig('christmasSubsidy', event.target.value)}
              />
              <FieldHelp>Ex.: valor pago no mês; deixa 0 quando não existe pagamento.</FieldHelp>
            </label>
            <label>
              <span>Outros abonos sujeitos</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.otherTaxableAllowances}
                onChange={(event) => setNumericConfig('otherTaxableAllowances', event.target.value)}
              />
              <FieldHelp>Ex.: prémio, comissão ou complemento sujeito a retenções.</FieldHelp>
            </label>
            <label>
              <span>Outros abonos isentos</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.otherExemptAllowances}
                onChange={(event) => setNumericConfig('otherExemptAllowances', event.target.value)}
              />
              <FieldHelp>Ex.: reembolso ou abono que no teu recibo esteja tratado como isento.</FieldHelp>
            </label>
            <label>
              <span>Outros descontos</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.otherDeductions}
                onChange={(event) => setNumericConfig('otherDeductions', event.target.value)}
              />
              <FieldHelp>Ex.: sindicato, adiantamento, penhora ou outro desconto identificado no recibo.</FieldHelp>
            </label>
          </div>
        </div>

        <div className="payrollFormSection payrollManualOverrideSection">
          <div className="payrollFormSectionTitle">
            <strong>Ajustes manuais opcionais</strong>
            <span>Deixa em branco para calcular automaticamente pela planificação.</span>
          </div>
          <div className="payrollFormGrid">
            <label>
              <span>Dias de subsídio de alimentação</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={config.mealDaysOverride ?? ''}
                placeholder={`Automático: ${result.mealDays}`}
                onChange={(event) => setOptionalNumericConfig('mealDaysOverride', event.target.value)}
              />
              <FieldHelp>Ex.: 23, como no recibo enviado. Em branco usa os dias da planificação.</FieldHelp>
            </label>
            <label>
              <span>Valor hora base manual</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.hourlyRateOverride ?? ''}
                placeholder={`Automático: ${money(result.hourlyRate)}`}
                onChange={(event) => setOptionalNumericConfig('hourlyRateOverride', event.target.value)}
              />
              <FieldHelp>Usa apenas se o valor/hora do teu contrato ou recibo for diferente do automático.</FieldHelp>
            </label>
            <label>
              <span>Desconto por faltas manual (€)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.absenceDeductionOverride ?? ''}
                placeholder={`Automático: ${money(result.absenceDeduction)}`}
                onChange={(event) =>
                  setOptionalNumericConfig('absenceDeductionOverride', event.target.value)
                }
              />
              <FieldHelp>Ex.: valor exato descontado por faltas. Em branco calcula pelos dias marcados.</FieldHelp>
            </label>
            <label>
              <span>Trabalho suplementar manual (€)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.overtimePayOverride ?? ''}
                placeholder={`Automático: ${money(result.overtimePay)}`}
                onChange={(event) => setOptionalNumericConfig('overtimePayOverride', event.target.value)}
              />
              <FieldHelp>Ex.: valor de horas extra indicado no recibo. Em branco usa as horas da planificação.</FieldHelp>
            </label>
            <label>
              <span>Segurança Social manual (€)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.socialSecurityOverride ?? ''}
                placeholder={`Automático: ${money(result.socialSecurity)}`}
                onChange={(event) =>
                  setOptionalNumericConfig('socialSecurityOverride', event.target.value)
                }
              />
              <FieldHelp>Ex.: 101,20 € no recibo enviado. Em branco aplica a percentagem acima.</FieldHelp>
            </label>
            <label>
              <span>IRS manual (€)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={config.irsOverride ?? ''}
                placeholder={`Automático: ${money(result.irsTotal)}`}
                onChange={(event) => setOptionalNumericConfig('irsOverride', event.target.value)}
              />
              <FieldHelp>Ex.: 0,00 € se o recibo não tiver retenção. Em branco usa a tabela selecionada.</FieldHelp>
            </label>
          </div>
        </div>

        <button type="button" className="payrollPrimaryButton" onClick={savePlan}>
          Guardar planificação e cálculo
        </button>
      </section>

      <section className="payrollPanel payrollReceipt" aria-labelledby="receipt-title">
        <div className="payrollSectionHeader">
          <div>
            <span>RECIBO ESTIMADO</span>
            <h2 id="receipt-title">Detalhe do vencimento</h2>
          </div>
          <strong className="payrollReceiptNet">{money(result.netEstimate)}</strong>
        </div>

        {profile.role || profile.category || profile.employeeNumber ? (
          <div className="payrollReceiptIdentity">
            {profile.role ? (
              <span>
                <small>Função</small>
                <strong>{profile.role}</strong>
              </span>
            ) : null}
            {profile.category ? (
              <span>
                <small>Grupo</small>
                <strong>{profile.category}</strong>
              </span>
            ) : null}
            {profile.employeeNumber ? (
              <span>
                <small>N.º funcionário</small>
                <strong>{profile.employeeNumber}</strong>
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="payrollReceiptTable" role="table" aria-label="Estimativa de recibo">
          <div className="payrollReceiptRow payrollReceiptHead" role="row">
            <span>Designação</span>
            <span>Qtd.</span>
            <span>Valor unit.</span>
            <span>Abonos</span>
            <span>Descontos</span>
          </div>
          <div className="payrollReceiptRow">
            <strong>Remuneração normal</strong>
            <span>{profile.normalQuantity || '1'}</span>
            <span>—</span>
            <span>{money(config.baseSalary)}</span>
            <span>—</span>
          </div>
          <div className="payrollReceiptRow">
            <strong>Subsídio alimentação</strong>
            <span>{result.mealDays}</span>
            <span>{money(config.mealAllowancePerDay)}</span>
            <span>{money(result.mealAllowanceGross)}</span>
            <span>—</span>
          </div>
          <div className="payrollReceiptRow">
            <strong>Trabalho suplementar</strong>
            <span>{result.overtimeHours.toFixed(2)} h</span>
            <span>{money(result.hourlyRate)}/h</span>
            <span>{money(result.overtimePay)}</span>
            <span>—</span>
          </div>
          {config.vacationSubsidy > 0 ? (
            <div className="payrollReceiptRow">
              <strong>Subsídio de férias</strong>
              <span>1</span>
              <span>—</span>
              <span>{money(config.vacationSubsidy)}</span>
              <span>—</span>
            </div>
          ) : null}
          {config.christmasSubsidy > 0 ? (
            <div className="payrollReceiptRow">
              <strong>Subsídio de Natal</strong>
              <span>1</span>
              <span>—</span>
              <span>{money(config.christmasSubsidy)}</span>
              <span>—</span>
            </div>
          ) : null}
          {config.otherTaxableAllowances > 0 ? (
            <div className="payrollReceiptRow">
              <strong>Outros abonos sujeitos</strong>
              <span>—</span>
              <span>—</span>
              <span>{money(config.otherTaxableAllowances)}</span>
              <span>—</span>
            </div>
          ) : null}
          {config.otherExemptAllowances > 0 ? (
            <div className="payrollReceiptRow">
              <strong>Outros abonos isentos</strong>
              <span>—</span>
              <span>—</span>
              <span>{money(config.otherExemptAllowances)}</span>
              <span>—</span>
            </div>
          ) : null}
          {result.absenceDeduction > 0 ? (
            <div className="payrollReceiptRow payrollReceiptDeduction">
              <strong>Faltas não remuneradas</strong>
              <span>{result.justifiedUnpaidAbsenceDays + result.unjustifiedAbsenceDays}</span>
              <span>—</span>
              <span>—</span>
              <span>{money(result.absenceDeduction)}</span>
            </div>
          ) : null}
          <div className="payrollReceiptRow payrollReceiptDeduction">
            <strong>Segurança Social</strong>
            <span>{config.socialSecurityOverride !== null ? 'Manual' : `${config.socialSecurityRate}%`}</span>
            <span>—</span>
            <span>—</span>
            <span>{money(result.socialSecurity)}</span>
          </div>
          {result.irsTotal > 0 || config.irsOverride !== null ? (
            <div className="payrollReceiptRow payrollReceiptDeduction">
              <strong>{config.irsOverride !== null ? 'IRS — valor manual' : 'IRS — total'}</strong>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>{money(result.irsTotal)}</span>
            </div>
          ) : null}
          {config.otherDeductions > 0 ? (
            <div className="payrollReceiptRow payrollReceiptDeduction">
              <strong>Outros descontos</strong>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>{money(config.otherDeductions)}</span>
            </div>
          ) : null}
          <div className="payrollReceiptRow payrollReceiptTotals">
            <strong>Totais</strong>
            <span></span>
            <span></span>
            <span>{money(receiptAbonos)}</span>
            <span>{money(receiptDiscounts)}</span>
          </div>
        </div>
      </section>

      <section className="payrollFacts" aria-label="Indicadores do mês">
        <article>
          <span>Dias trabalho</span>
          <strong>{result.workDays}</strong>
        </article>
        <article>
          <span>Dias alimentação</span>
          <strong>{result.mealDays}</strong>
        </article>
        <article>
          <span>Folgas</span>
          <strong>{result.restDays}</strong>
        </article>
        <article>
          <span>Feriados</span>
          <strong>{result.holidayDays}</strong>
        </article>
        <article>
          <span>Férias</span>
          <strong>{result.vacationDays}</strong>
        </article>
        <article>
          <span>Faltas</span>
          <strong>
            {result.justifiedPaidAbsenceDays +
              result.justifiedUnpaidAbsenceDays +
              result.unjustifiedAbsenceDays}
          </strong>
        </article>
        <article>
          <span>Valor hora base</span>
          <strong>{money(result.hourlyRate)}</strong>
        </article>
      </section>

      <aside className="payrollLegalNote">
        <strong>Como usar esta área</strong>
        <p>
          A planificação faz o cálculo automático. Se o teu recibo apresentar um valor específico diferente,
          usa o campo manual correspondente para o substituir. Assim consegues aproximar a previsão do
          processamento real sem perder a planificação de trabalho, folgas, feriados, férias, faltas e horas
          extra.
        </p>
      </aside>
    </section>
  )
}
