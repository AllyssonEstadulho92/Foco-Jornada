import { secureStorage } from '../../security/secureStorage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { calculatePayroll } from '../../application/payroll/calculatePayroll'
import { defaultPayrollConfig, type PayrollConfig, type PayrollDayPlan } from '../../domain/payroll/Payroll'
import { AppIcon, type AppIconName } from '../components/ui/AppIcon'
import { pushAppNotification } from '../store/useNotificationStore'
import '../../styles/weekend-pay.css'

const CONFIG_KEY = 'foco-jornada-payroll-config-v1'
const PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

type WeekendRateKey = 'saturdayPremiumRate' | 'sundayPremiumRate'

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
    const raw = secureStorage.getItem(CONFIG_KEY)
    return raw ? { ...defaultPayrollConfig, ...(JSON.parse(raw) as Partial<PayrollConfig>) } : defaultPayrollConfig
  } catch {
    return defaultPayrollConfig
  }
}

function readPlan(month: string): PayrollDayPlan[] {
  try {
    const raw = secureStorage.getItem(`${PLAN_PREFIX}${month}`)
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
  icon: AppIconName
  label: string
  hint?: string
  value: string
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="referencePayrollRow">
      <span className="referencePayrollIcon" aria-hidden="true"><AppIcon name={icon} /></span>
      <span><strong>{label}</strong>{hint ? <small>{hint}</small> : null}</span>
      <b className={negative ? 'negative' : positive ? 'positive' : ''}>{value}</b>
    </div>
  )
}

export function PayrollReferencePage() {
  const [month, setMonth] = useState(currentMonthKey)
  const [config, setConfig] = useState(readConfig)
  const [, forceRefresh] = useState(0)
  const plan = readPlan(month)
  const result = calculatePayroll(config, plan)

  const otherAllowances = config.vacationSubsidy + config.christmasSubsidy + config.otherTaxableAllowances + config.otherExemptAllowances
  const totalDiscounts = result.socialSecurity + result.irsTotal + config.otherDeductions

  function updateWeekendRate(key: WeekendRateKey, raw: string) {
    const normalized = raw.trim().replace(',', '.')
    if (normalized !== '' && (!Number.isFinite(Number(normalized)) || Number(normalized) < 0 || Number(normalized) > 1000)) return
    const next = { ...config, [key]: normalized === '' ? null : Number(normalized) }
    secureStorage.setItem(CONFIG_KEY, JSON.stringify(next))
    setConfig(next)
  }

  function refreshCalculation() {
    setConfig(readConfig())
    forceRefresh((value) => value + 1)
    pushAppNotification('success', 'Cálculo atualizado', `Estimativa de ${monthLabel(month)} atualizada com os dados guardados.`)
  }

  function saveCalculation() {
    pushAppNotification('success', 'Cálculo guardado', `${monthLabel(month)} · estimativa líquida ${money(result.netEstimate)}.`)
  }

  return (
    <section className="referencePayrollPage" aria-labelledby="reference-payroll-title">
      <header className="referencePayrollHeader">
        <div className="referencePayrollTitleIcon" aria-hidden="true"><AppIcon name="payroll" /></div>
        <div>
          <h1 id="reference-payroll-title">Vencimento</h1>
          <p>Consulta a estimativa do que vais receber.</p>
        </div>
        <label className="referencePayrollMonth"><span className="referenceVisuallyHidden">Mês</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </header>

      <div className="referencePayrollToolbar">
        <span>{monthLabel(month)}</span>
        <button type="button" onClick={refreshCalculation}>Recalcular</button>
        <Link to="/vencimento/configurar">Editar dados</Link>
      </div>

      <section className="referencePayrollDetails" aria-labelledby="reference-payroll-detail-title">
        <h2 id="reference-payroll-detail-title">Resumo do vencimento</h2>
        <div className="referencePayrollRows">
          <PayrollRow icon="wallet" label="Salário base" value={money(config.baseSalary)} positive />
          <PayrollRow icon="meal" label="Subsídio de alimentação" hint={`${result.mealDays} dias`} value={money(result.mealAllowanceGross)} positive />
          <PayrollRow icon="clock" label="Horas extra" hint={`${result.overtimeHours.toFixed(2)} h`} value={money(result.overtimePay)} positive={result.overtimePay > 0} />
          <PayrollRow icon="clock" label="Acréscimo de sábado" hint={`${result.saturdayWorkHours.toFixed(2)} h normais · ${config.saturdayPremiumRate === null ? 'taxa por confirmar' : `${config.saturdayPremiumRate}%`}`} value={money(result.saturdayPremiumPay)} positive={result.saturdayPremiumPay > 0} />
          <PayrollRow icon="clock" label="Acréscimo de domingo" hint={`${result.sundayWorkHours.toFixed(2)} h normais · ${config.sundayPremiumRate === null ? 'taxa por confirmar' : `${config.sundayPremiumRate}%`}`} value={money(result.sundayPremiumPay)} positive={result.sundayPremiumPay > 0} />
          <PayrollRow icon="minus-circle" label="Faltas/ausências" hint={`${result.unpaidAbsenceHours.toFixed(2)} h não remuneradas`} value={result.absenceDeduction > 0 ? `−${money(result.absenceDeduction)}` : money(0)} negative={result.absenceDeduction > 0} />
          <PayrollRow icon="shield" label="Segurança Social" hint={`${config.socialSecurityRate.toFixed(2)}%`} value={`−${money(result.socialSecurity)}`} negative />
          <PayrollRow icon="document" label="IRS" hint="retenção" value={`−${money(result.irsTotal)}`} negative={result.irsTotal > 0} />
          <PayrollRow icon="plus" label="Outros abonos" value={money(otherAllowances)} positive={otherAllowances > 0} />
          <PayrollRow icon="minus-circle" label="Outros descontos" value={config.otherDeductions > 0 ? `−${money(config.otherDeductions)}` : money(0)} negative={config.otherDeductions > 0} />
        </div>

        <details className="referenceWeekendSettings">
          <summary>Configurar percentagens de sábado e domingo</summary>
          <p>Indica apenas as percentagens confirmadas no teu recibo, contrato ou acordo coletivo. Não existe um acréscimo único para todos os turnos de fim de semana.</p>
          <div className="referenceWeekendFields">
            <label>
              <span>Acréscimo de sábado (%)</span>
              <input type="number" inputMode="decimal" min="0" max="1000" step="0.01" placeholder="Por confirmar" value={config.saturdayPremiumRate ?? ''} onChange={(event) => updateWeekendRate('saturdayPremiumRate', event.target.value)} />
            </label>
            <label>
              <span>Acréscimo de domingo (%)</span>
              <input type="number" inputMode="decimal" min="0" max="1000" step="0.01" placeholder="Por confirmar" value={config.sundayPremiumRate ?? ''} onChange={(event) => updateWeekendRate('sundayPremiumRate', event.target.value)} />
            </label>
          </div>
          <p>As horas normais marcadas como Trabalho são contadas automaticamente. As horas lançadas como trabalho suplementar continuam exclusivamente na rubrica Horas extra, sem duplicar o acréscimo.</p>
        </details>

        <div className="referencePayrollTotals">
          <span><small>Bruto</small><strong>{money(result.grossTotal)}</strong></span>
          <span><small>Descontos</small><strong className="negative">−{money(totalDiscounts)}</strong></span>
          <span><small>Líquido estimado</small><strong className="positive">{money(result.netEstimate)}</strong></span>
        </div>
      </section>

      <div className="referencePayrollNotice">
        <span aria-hidden="true"><AppIcon name="info" /></span>
        <p>Estimativa baseada nos turnos e nos dados fiscais guardados. Confirma as taxas de fim de semana e compara com o recibo quando o receberes.</p>
      </div>

      <div className="referencePayrollActions">
        <button type="button" onClick={saveCalculation}>Guardar cálculo</button>
        <Link to="/vencimento/configurar">Rever dados do vencimento</Link>
      </div>
    </section>
  )
}
