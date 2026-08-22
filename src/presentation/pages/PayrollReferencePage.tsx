import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculatePayroll } from '../../application/payroll/calculatePayroll'
import { defaultPayrollConfig, type PayrollConfig, type PayrollDayPlan } from '../../domain/payroll/Payroll'
import { pushAppNotification } from '../store/useNotificationStore'

const CONFIG_KEY = 'foco-jornada-payroll-config-v1'
const PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function defaultPlan(month: string): PayrollDayPlan[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const totalDays = new Date(year, monthNumber, 0).getDate()
  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1
    const date = `${month}-${String(day).padStart(2, '0')}`
    const weekday = new Date(year, monthNumber - 1, day).getDay()
    return { date, kind: weekday === 0 || weekday === 6 ? 'rest' : 'work', overtimeHours: 0, note: '' }
  })
}

function readConfig(): PayrollConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? { ...defaultPayrollConfig, ...(JSON.parse(raw) as Partial<PayrollConfig>) } : defaultPayrollConfig
  } catch {
    return defaultPayrollConfig
  }
}

function readPlan(month: string): PayrollDayPlan[] {
  try {
    const raw = localStorage.getItem(`${PLAN_PREFIX}${month}`)
    return raw ? (JSON.parse(raw) as PayrollDayPlan[]) : defaultPlan(month)
  } catch {
    return defaultPlan(month)
  }
}

function money(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1))
}

function PayrollRow({ icon, label, hint, value, positive = false, negative = false }: {
  icon: string
  label: string
  hint?: string
  value: string
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="referencePayrollRow">
      <span className="referencePayrollIcon" aria-hidden="true">{icon}</span>
      <span><strong>{label}</strong>{hint ? <small>{hint}</small> : null}</span>
      <b className={negative ? 'negative' : positive ? 'positive' : ''}>{value}</b>
    </div>
  )
}

export function PayrollReferencePage() {
  const [month, setMonth] = useState(currentMonthKey)
  const [revision, setRevision] = useState(0)
  const config = useMemo(() => readConfig(), [revision])
  const plan = useMemo(() => readPlan(month), [month, revision])
  const result = useMemo(() => calculatePayroll(config, plan), [config, plan])

  const otherAllowances = config.vacationSubsidy + config.christmasSubsidy + config.otherTaxableAllowances + config.otherExemptAllowances
  const totalDiscounts = result.socialSecurity + result.irsTotal + config.otherDeductions

  function refreshCalculation() {
    setRevision((value) => value + 1)
    pushAppNotification('success', 'Cálculo atualizado', `Vencimento de ${monthLabel(month)} recalculado com a planificação guardada.`)
  }

  function saveCalculation() {
    pushAppNotification('success', 'Planificação e cálculo guardados', `${monthLabel(month)} · líquido estimado ${money(result.netEstimate)}.`)
  }

  return (
    <section className="referencePayrollPage" aria-labelledby="reference-payroll-title">
      <header className="referencePayrollHeader">
        <div className="referencePayrollTitleIcon" aria-hidden="true">▣</div>
        <div>
          <h1 id="reference-payroll-title">Vencimento</h1>
          <p>Detalhe da planificação e cálculo do teu vencimento.</p>
        </div>
        <label className="referencePayrollMonth"><span className="referenceVisuallyHidden">Mês</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </header>

      <div className="referencePayrollToolbar">
        <span>{monthLabel(month)}</span>
        <button type="button" onClick={refreshCalculation}>Atualizar cálculo</button>
        <Link to="/vencimento/configurar">Configurar</Link>
      </div>

      <section className="referencePayrollDetails" aria-labelledby="reference-payroll-detail-title">
        <h2 id="reference-payroll-detail-title">Detalhe do vencimento</h2>
        <div className="referencePayrollRows">
          <PayrollRow icon="○" label="Salário base" value={money(config.baseSalary)} positive />
          <PayrollRow icon="♨" label="Subsídio de alimentação" hint={`${result.mealDays} dias`} value={money(result.mealAllowanceGross)} positive />
          <PayrollRow icon="◷" label="Horas extra" hint={`${result.overtimeHours.toFixed(2)} h`} value={money(result.overtimePay)} positive={result.overtimePay > 0} />
          <PayrollRow icon="□" label="Faltas/ausências" hint={`${result.unpaidAbsenceHours.toFixed(2)} h não remuneradas`} value={result.absenceDeduction > 0 ? `−${money(result.absenceDeduction)}` : money(0)} negative={result.absenceDeduction > 0} />
          <PayrollRow icon="◇" label="Segurança Social" hint={`${config.socialSecurityRate.toFixed(2)}%`} value={`−${money(result.socialSecurity)}`} negative />
          <PayrollRow icon="▤" label="IRS" hint="retenção" value={`−${money(result.irsTotal)}`} negative={result.irsTotal > 0} />
          <PayrollRow icon="✦" label="Outros abonos" value={money(otherAllowances)} positive={otherAllowances > 0} />
          <PayrollRow icon="⊖" label="Outros descontos" value={config.otherDeductions > 0 ? `−${money(config.otherDeductions)}` : money(0)} negative={config.otherDeductions > 0} />
        </div>

        <div className="referencePayrollTotals">
          <span><small>Bruto</small><strong>{money(result.grossTotal)}</strong></span>
          <span><small>Descontos</small><strong className="negative">−{money(totalDiscounts)}</strong></span>
          <span><small>Líquido estimado</small><strong className="positive">{money(result.netEstimate)}</strong></span>
        </div>
      </section>

      <div className="referencePayrollNotice">
        <span aria-hidden="true">ⓘ</span>
        <p>O valor usa a planificação guardada e o perfil fiscal configurado. Confere sempre as rubricas do recibo real.</p>
      </div>

      <div className="referencePayrollActions">
        <button type="button" onClick={saveCalculation}>Guardar planificação e cálculo</button>
        <Link to="/vencimento/configurar">Conferir / configurar recibo</Link>
      </div>
    </section>
  )
}
