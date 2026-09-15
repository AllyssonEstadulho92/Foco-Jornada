import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  calculateVacationBalance,
  defaultVacationTrackerSettings,
  type VacationTrackerSettings,
} from '../../domain/vacation/VacationBalance'
import { secureStorage } from '../../security/secureStorage'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useWorkHoursStore } from '../store/useWorkHoursStore'

const VACATION_SETTINGS_KEY = 'foco-jornada-vacation-settings-v1'
const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'

interface VacationLikeRecord {
  date?: string
  kind?: string
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function readVacationSettings(): VacationTrackerSettings {
  try {
    const raw = secureStorage.getItem(VACATION_SETTINGS_KEY)
    if (!raw) return defaultVacationTrackerSettings
    const parsed = JSON.parse(raw) as Partial<VacationTrackerSettings>
    return {
      employmentStartDate: String(parsed.employmentStartDate ?? ''),
      annualEntitlementDays: Math.max(22, Math.round(safeNumber(parsed.annualEntitlementDays, 22))),
      monthlyAccrualTargetDays: Math.max(1, safeNumber(parsed.monthlyAccrualTargetDays, 28)),
      carriedDays: Math.max(0, Math.round(safeNumber(parsed.carriedDays))),
      manualTakenDays: Math.max(0, Math.round(safeNumber(parsed.manualTakenDays))),
      adjustmentDays: Math.round(safeNumber(parsed.adjustmentDays)),
    }
  } catch {
    return defaultVacationTrackerSettings
  }
}

function readArray(key: string): VacationLikeRecord[] {
  try {
    const raw = secureStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as VacationLikeRecord[]) : []
  } catch {
    return []
  }
}

function collectVacationDates(year: number, workHoursEntries: Array<{ date: string; reason: string }>) {
  const dates = new Set<string>()

  for (const entry of workHoursEntries) {
    if (entry.reason === 'ferias' && entry.date.startsWith(`${year}-`)) dates.add(entry.date)
  }

  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const records = [
      ...readArray(`${SHIFT_MAP_PREFIX}${monthKey}`),
      ...readArray(`${PAYROLL_PLAN_PREFIX}${monthKey}`),
    ]

    for (const record of records) {
      if (record.kind === 'vacation' && record.date?.startsWith(`${year}-`)) dates.add(record.date)
    }
  }

  return [...dates].sort()
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return dateKey
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function monthLabel(month: number) {
  return new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(new Date(2026, month - 1, 1))
}

function daysLabel(value: number) {
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
  return `${formatted} ${Math.abs(value - 1) < 0.0001 ? 'dia' : 'dias'}`
}

export function VacationBalancePage() {
  const entries = useWorkHoursStore((state) => state.entries)
  const today = toLocalDateKey(new Date())
  const year = Number(today.slice(0, 4))
  const [settings, setSettings] = useState<VacationTrackerSettings>(readVacationSettings)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const recordedVacationDates = useMemo(
    () => collectVacationDates(year, entries),
    [entries, year],
  )

  const balance = useMemo(
    () =>
      calculateVacationBalance({
        ...settings,
        asOfDate: today,
        recordedVacationDates,
      }),
    [recordedVacationDates, settings, today],
  )

  function update<K extends keyof VacationTrackerSettings>(
    key: K,
    value: VacationTrackerSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }))
    setSavedAt(null)
  }

  function saveSettings() {
    const normalized: VacationTrackerSettings = {
      employmentStartDate: settings.employmentStartDate,
      annualEntitlementDays: Math.max(22, Math.round(safeNumber(settings.annualEntitlementDays, 22))),
      monthlyAccrualTargetDays: Math.min(
        60,
        Math.max(1, safeNumber(settings.monthlyAccrualTargetDays, 28)),
      ),
      carriedDays: Math.max(0, Math.round(safeNumber(settings.carriedDays))),
      manualTakenDays: Math.max(0, Math.round(safeNumber(settings.manualTakenDays))),
      adjustmentDays: Math.round(safeNumber(settings.adjustmentDays)),
    }
    secureStorage.setItem(VACATION_SETTINGS_KEY, JSON.stringify(normalized))
    setSettings(normalized)
    setSavedAt(new Date().toISOString())
  }

  const noStartDate = !settings.employmentStartDate || !balance.hasValidEmploymentStartDate
  const monthlyBalanceTone = balance.monthlyAvailableBalanceDays < 0 ? ' vacationMetricDanger' : ''
  const monthlyProjectedTone = balance.monthlyProjectedBalanceDays < 0 ? ' vacationMetricDanger' : ''

  return (
    <div className="vacationPage">
      <header className="vacationHero">
        <div>
          <span className="vacationEyebrow">FÉRIAS · CONTADOR AUTOMÁTICO</span>
          <h1>Férias acumuladas mês a mês</h1>
          <p>
            Acompanha automaticamente uma meta pessoal anual de {daysLabel(balance.monthlyAccrualTargetDays)}.
            Cada mês de calendário só é creditado quando termina, evitando contar antecipadamente dias que
            ainda não foram acumulados.
          </p>
        </div>
        <div className="vacationHeroDate" aria-label={`Cálculo à data de ${formatDate(today)}`}>
          <span>À data de</span>
          <strong>{formatDate(today)}</strong>
        </div>
      </header>

      {noStartDate ? (
        <section className="vacationNotice vacationNoticeWarning" role="status">
          <strong>Falta a data de admissão.</strong>
          <span>
            O contador mensal pessoal continua disponível, mas a referência laboral do ano de admissão só
            fica completa depois de preencheres a data de início do contrato.
          </span>
        </section>
      ) : null}

      <section className="vacationMetricGrid" aria-label="Resumo da acumulação mensal de férias">
        <article className={`vacationMetricCard vacationMetricPrimary${monthlyBalanceTone}`}>
          <span>Saldo acumulado</span>
          <strong>{daysLabel(balance.monthlyAvailableBalanceDays)}</strong>
          <small>Acumulado mensal + transitados + ajustes − férias já gozadas.</small>
        </article>
        <article className="vacationMetricCard">
          <span>Acumulado bruto</span>
          <strong>{daysLabel(balance.monthlyAccruedDays)}</strong>
          <small>{balance.completedAccrualMonths} de 12 meses concluídos em {balance.year}.</small>
        </article>
        <article className={`vacationMetricCard${monthlyProjectedTone}`}>
          <span>Após planeadas</span>
          <strong>{daysLabel(balance.monthlyProjectedBalanceDays)}</strong>
          <small>Desconta também {daysLabel(balance.recordedPlannedDays)} já marcados para o futuro.</small>
        </article>
        <article className="vacationMetricCard">
          <span>Meta anual</span>
          <strong>{daysLabel(balance.monthlyAccrualTargetDays)}</strong>
          <small>Cerca de {daysLabel(balance.monthlyAccrualPerMonth)} por mês concluído.</small>
        </article>
      </section>

      <section className="vacationPanel vacationAccrualPanel" aria-labelledby="vacation-accrual-title">
        <div className="vacationPanelHeader">
          <div>
            <span>ACUMULAÇÃO AUTOMÁTICA · {balance.year}</span>
            <h2 id="vacation-accrual-title">Evolução por mês</h2>
          </div>
          <strong>{daysLabel(balance.monthlyAccruedDays)} acumulados</strong>
        </div>

        <p className="vacationAccrualIntro">
          O cálculo usa a fração exata da meta anual e arredonda apenas a apresentação a duas casas decimais.
          Com uma meta de 28 dias, março fecha em 7 dias, junho em 14, setembro em 21 e dezembro em 28.
        </p>

        <div className="vacationMonthGrid" role="list" aria-label="Acumulação de férias por mês">
          {balance.monthlyAccrualSchedule.map((item) => {
            const state = item.completed ? 'Concluído' : item.current ? 'Em curso' : 'Futuro'
            const stateClass = item.completed
              ? ' vacationMonthCompleted'
              : item.current
                ? ' vacationMonthCurrent'
                : ''

            return (
              <article className={`vacationMonthCard${stateClass}`} key={item.month} role="listitem">
                <div>
                  <span className="vacationMonthName">{monthLabel(item.month)}</span>
                  <span className="vacationMonthState">{state}</span>
                </div>
                <strong>{daysLabel(item.cumulativeDays)}</strong>
                <small>Crédito fechado em {formatDate(item.monthEndDate)}</small>
              </article>
            )
          })}
        </div>
      </section>

      <div className="vacationColumns">
        <section className="vacationPanel" aria-labelledby="vacation-config-title">
          <div className="vacationPanelHeader">
            <div>
              <span>BASE DO CÁLCULO</span>
              <h2 id="vacation-config-title">Configuração</h2>
            </div>
            {savedAt ? <small>Guardado agora</small> : null}
          </div>

          <div className="vacationFormGrid">
            <label>
              <span>Meta anual da acumulação mensal</span>
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                inputMode="numeric"
                value={settings.monthlyAccrualTargetDays}
                onChange={(event) => update('monthlyAccrualTargetDays', safeNumber(event.target.value, 28))}
              />
              <small>Está definida em 28 dias conforme o teu objetivo. É uma projeção pessoal.</small>
            </label>

            <label>
              <span>Data de admissão</span>
              <input
                type="date"
                value={settings.employmentStartDate}
                max={today}
                onChange={(event) => update('employmentStartDate', event.target.value)}
              />
              <small>Usada na referência laboral e na regra específica do ano de admissão.</small>
            </label>

            <label>
              <span>Dias anuais confirmados</span>
              <input
                type="number"
                min="22"
                max="60"
                step="1"
                inputMode="numeric"
                value={settings.annualEntitlementDays}
                onChange={(event) => update('annualEntitlementDays', safeNumber(event.target.value, 22))}
              />
              <small>Valor oficial/contratual conhecido. Não é substituído automaticamente pela meta de 28.</small>
            </label>

            <label>
              <span>Dias transitados confirmados</span>
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                inputMode="numeric"
                value={settings.carriedDays}
                onChange={(event) => update('carriedDays', safeNumber(event.target.value))}
              />
              <small>Introduz apenas dias do ano anterior cuja utilização esteja confirmada.</small>
            </label>

            <label>
              <span>Dias gozados fora do registo da app</span>
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                inputMode="numeric"
                value={settings.manualTakenDays}
                onChange={(event) => update('manualTakenDays', safeNumber(event.target.value))}
              />
              <small>Evita perder férias já gozadas que não tenham sido lançadas no Foco Jornada.</small>
            </label>

            <label>
              <span>Ajuste confirmado</span>
              <input
                type="number"
                min="-60"
                max="60"
                step="1"
                inputMode="numeric"
                value={settings.adjustmentDays}
                onChange={(event) => update('adjustmentDays', safeNumber(event.target.value))}
              />
              <small>Para correções documentadas. Valores negativos reduzem o saldo.</small>
            </label>
          </div>

          <button className="vacationSaveButton" type="button" onClick={saveSettings}>
            Guardar configuração
          </button>
        </section>

        <section className="vacationPanel vacationRules" aria-labelledby="vacation-rules-title">
          <div className="vacationPanelHeader">
            <div>
              <span>REFERÊNCIA LABORAL</span>
              <h2 id="vacation-rules-title">Direito e contador pessoal</h2>
            </div>
          </div>

          <div className="vacationRuleHighlight">
            <strong>O contador de 28 dias é uma projeção pessoal</strong>
            <p>
              Serve para veres a progressão mês a mês. Não altera sozinho o número oficial de dias de férias
              reconhecido pela entidade empregadora, contrato ou instrumento coletivo.
            </p>
          </div>

          {balance.isAdmissionYear ? (
            <div className="vacationNotice vacationNoticeWarning">
              <strong>Ano de admissão</strong>
              <span>
                A referência legal separada usa 2 dias por cada mês completo de contrato, até 20 dias, e o
                marco dos seis meses completos. O contador pessoal de 28 continua identificado à parte.
              </span>
            </div>
          ) : (
            <div className="vacationNotice">
              <strong>Referência anual</strong>
              <span>
                O cálculo laboral configurado mantém {daysLabel(balance.entitlementDays)} para {balance.year}.
                A meta mensal de {daysLabel(balance.monthlyAccrualTargetDays)} não substitui esse valor.
              </span>
            </div>
          )}

          <dl className="vacationBreakdown">
            <div><dt>Acumulado mensal bruto</dt><dd>{daysLabel(balance.monthlyAccruedDays)}</dd></div>
            <div><dt>Transitados</dt><dd>{daysLabel(balance.carriedDays)}</dd></div>
            <div><dt>Ajustes</dt><dd>{daysLabel(balance.adjustmentDays)}</dd></div>
            <div><dt>Gozadas até hoje</dt><dd>− {daysLabel(balance.takenDays)}</dd></div>
            <div><dt>Planeadas futuras</dt><dd>− {daysLabel(balance.recordedPlannedDays)}</dd></div>
            <div><dt>Referência anual configurada</dt><dd>{daysLabel(balance.entitlementDays)}</dd></div>
          </dl>
        </section>
      </div>

      <section className="vacationPanel vacationSources" aria-labelledby="vacation-data-title">
        <div className="vacationPanelHeader">
          <div>
            <span>DADOS DA APLICAÇÃO</span>
            <h2 id="vacation-data-title">Onde são detetados os dias de férias</h2>
          </div>
          <strong>{recordedVacationDates.length} datas únicas em {year}</strong>
        </div>
        <p>
          O saldo reutiliza os registos existentes: dias marcados como <strong>Férias</strong> no mapa de
          turnos e ocorrências <strong>Férias</strong> na calculadora de horas. A mesma data encontrada nas
          duas áreas conta apenas uma vez.
        </p>
        <div className="vacationActions">
          <NavLink to="/turnos">Abrir mapa de turnos</NavLink>
          <NavLink to="/horas">Abrir calculadora de horas</NavLink>
        </div>
      </section>

      <section className="vacationLegalNote" aria-label="Precisão e limitações">
        <strong>Precisão e limites</strong>
        <p>
          O contador mensal foi criado para a tua meta de 28 dias: cada mês completo corresponde a 28 ÷ 12,
          e o total chega exatamente a 28 no fim de dezembro. O valor intermédio pode ter casas decimais e é
          apresentado com no máximo duas casas sem acumular erros de arredondamento mês após mês.
        </p>
        <p>
          Esta projeção é um controlo pessoal. O saldo oficial deve continuar a ser confirmado com a entidade
          empregadora quando existirem regras contratuais, CCT, transferências de férias, impedimentos ou outras
          situações especiais. A referência laboral geral permanece separada para não apresentar a meta de 28
          como um direito legal automaticamente adquirido.
        </p>
        <div className="vacationLegalLinks">
          <a href="https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46747075" target="_blank" rel="noreferrer">
            Código do Trabalho — férias
          </a>
          <a href="https://www.gov.pt/guias/trabalhar-em-portugal" target="_blank" rel="noreferrer">
            gov.pt — trabalhar em Portugal
          </a>
        </div>
      </section>
    </div>
  )
}
