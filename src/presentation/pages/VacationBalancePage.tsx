import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  calculateVacationBalance,
  defaultVacationTrackerSettings,
  type VacationTrackerSettings,
} from '../../domain/vacation/VacationBalance'
import { secureStorage } from '../../security/secureStorage'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useWorkHoursStore } from '../store/useWorkHoursStore'
import { VacationPlannerPanel } from './VacationPlannerPanel'

const VACATION_SETTINGS_KEY = 'foco-jornada-vacation-settings-v1'
const SHIFT_MAP_PREFIX = 'foco-jornada-shift-map-v1-'
const PAYROLL_PLAN_PREFIX = 'foco-jornada-payroll-plan-v1-'
const DAY_MS = 24 * 60 * 60 * 1000

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

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function localDayProgress(value: Date) {
  const elapsedMs =
    value.getHours() * 60 * 60 * 1000 +
    value.getMinutes() * 60 * 1000 +
    value.getSeconds() * 1000 +
    value.getMilliseconds()
  return Math.min(1, Math.max(0, elapsedMs / DAY_MS))
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

function preciseDaysLabel(value: number) {
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)
  return `${formatted} ${Math.abs(value - 1) < 0.0001 ? 'dia' : 'dias'}`
}

function percentLabel(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function VacationBalancePage() {
  const entries = useWorkHoursStore((state) => state.entries)
  const [now, setNow] = useState(() => new Date())
  const today = toLocalDateKey(now)
  const year = Number(today.slice(0, 4))
  const [settings, setSettings] = useState<VacationTrackerSettings>(readVacationSettings)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    const refreshNow = () => setNow(new Date())
    const intervalId = window.setInterval(refreshNow, 60_000)
    const handleVisibility = () => {
      if (!document.hidden) refreshNow()
    }

    window.addEventListener('focus', refreshNow)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshNow)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const recordedVacationDates = useMemo(
    () => collectVacationDates(year, entries),
    [entries, year],
  )

  const balance = useMemo(
    () =>
      calculateVacationBalance({
        ...settings,
        asOfDate: today,
        asOfDayProgress: localDayProgress(now),
        recordedVacationDates,
      }),
    [now, recordedVacationDates, settings, today],
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
  const monthlyBalanceTone =
    balance.monthlyLiveAvailableBalanceDays < 0 ? ' vacationMetricDanger' : ''
  const monthlyProjectedTone =
    balance.monthlyLiveProjectedBalanceDays < 0 ? ' vacationMetricDanger' : ''
  const yearEndTone = balance.yearEndProjectedBalanceDays < 0 ? ' vacationInsightDanger' : ''
  const currentMonthName = monthLabel(Number(today.slice(5, 7)))

  return (
    <div className="vacationPage">
      <header className="vacationHero">
        <div>
          <span className="vacationEyebrow">FÉRIAS · EVOLUÇÃO EM TEMPO REAL</span>
          <h1>Férias acumuladas mês a mês</h1>
          <p>
            Acompanha uma meta pessoal anual de {daysLabel(balance.monthlyAccrualTargetDays)}. Os meses já
            terminados ficam fechados e o mês atual evolui proporcionalmente ao tempo decorrido, sem esperar
            pelo último dia para veres a progressão.
          </p>
        </div>
        <div
          className="vacationHeroDate vacationLiveClock"
          aria-label={`Cálculo atualizado em ${formatDate(today)} às ${formatTime(now)}`}
        >
          <span>Atualizado</span>
          <strong>{formatDate(today)}</strong>
          <small>{formatTime(now)} · atualização automática a cada minuto</small>
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
          <span>Saldo agora</span>
          <strong>{preciseDaysLabel(balance.monthlyLiveAvailableBalanceDays)}</strong>
          <small>Acumulação em tempo real + transitados + ajustes − férias já gozadas.</small>
        </article>
        <article className="vacationMetricCard">
          <span>Acumulado agora</span>
          <strong>{preciseDaysLabel(balance.monthlyLiveAccruedDays)}</strong>
          <small>
            {daysLabel(balance.monthlyAccruedDays)} fechados + {preciseDaysLabel(balance.currentAccrualMonthEarnedDays)} em {currentMonthName}.
          </small>
        </article>
        <article className={`vacationMetricCard${monthlyProjectedTone}`}>
          <span>Após planeadas</span>
          <strong>{preciseDaysLabel(balance.monthlyLiveProjectedBalanceDays)}</strong>
          <small>Desconta também {daysLabel(balance.recordedPlannedDays)} já marcados para o futuro.</small>
        </article>
        <article className="vacationMetricCard vacationMetricProgress">
          <span>Progresso de {currentMonthName}</span>
          <strong>{percentLabel(balance.currentAccrualMonthProgressPercent)}%</strong>
          <small>
            +{preciseDaysLabel(balance.currentAccrualMonthEarnedDays)} de cerca de {daysLabel(balance.monthlyAccrualPerMonth)} neste mês.
          </small>
        </article>
      </section>

      <section className="vacationPanel vacationInsightsPanel" aria-labelledby="vacation-insights-title">
        <div className="vacationPanelHeader">
          <div>
            <span>LEITURA RÁPIDA · {balance.year}</span>
            <h2 id="vacation-insights-title">O que tens, o que falta e o que vem a seguir</h2>
          </div>
          <strong>{percentLabel(balance.annualAccrualProgressPercent)}% da meta anual</strong>
        </div>

        <div className="vacationAnnualProgress" aria-label="Progresso anual da meta pessoal">
          <div className="vacationAnnualProgressHeader">
            <span>{preciseDaysLabel(balance.monthlyLiveAccruedDays)} acumulados</span>
            <strong>{daysLabel(balance.monthlyAccrualTargetDays)} de meta</strong>
          </div>
          <div
            className="vacationAnnualProgressTrack"
            role="progressbar"
            aria-label="Progresso anual da acumulação pessoal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(balance.annualAccrualProgressPercent)}
          >
            <span style={{ width: `${Math.min(100, balance.annualAccrualProgressPercent)}%` }} />
          </div>
          <small>
            Faltam {preciseDaysLabel(balance.annualAccrualRemainingDays)} para completares a meta pessoal de {balance.year}.
          </small>
        </div>

        <div className="vacationInsightsGrid">
          <article className="vacationInsightCard vacationInsightPrimary">
            <span>Próximo marco</span>
            <strong>
              {balance.hasReachedAccrualTarget || balance.nextAccrualMilestoneDays === null
                ? 'Meta atingida'
                : daysLabel(balance.nextAccrualMilestoneDays)}
            </strong>
            <small>
              {balance.nextAccrualMilestoneDate
                ? `Previsão pelo ritmo atual: ${formatDate(balance.nextAccrualMilestoneDate)}.`
                : 'A meta anual pessoal já está completamente acumulada.'}
            </small>
          </article>

          <article className="vacationInsightCard">
            <span>Já gozadas</span>
            <strong>{daysLabel(balance.takenDays)}</strong>
            <small>
              {daysLabel(balance.recordedTakenDays)} detetados na app + {daysLabel(balance.manualTakenDays)} lançados manualmente.
            </small>
          </article>

          <article className="vacationInsightCard">
            <span>Planeadas</span>
            <strong>{daysLabel(balance.recordedPlannedDays)}</strong>
            <small>Dias úteis futuros já marcados nas fontes da aplicação.</small>
          </article>

          <article className="vacationInsightCard">
            <span>Gozadas + planeadas</span>
            <strong>{daysLabel(balance.usedAndPlannedDays)}</strong>
            <small>{percentLabel(balance.usedAndPlannedPercentOfTarget)}% da meta pessoal anual.</small>
          </article>

          <article className={`vacationInsightCard${yearEndTone}`}>
            <span>Previsão em 31 de dezembro</span>
            <strong>{preciseDaysLabel(balance.yearEndProjectedBalanceDays)}</strong>
            <small>Meta anual + transitados + ajustes − gozadas − planeadas.</small>
          </article>

          <article className="vacationInsightCard">
            <span>Fins de semana ignorados</span>
            <strong>{daysLabel(balance.recordedIgnoredWeekendDays)}</strong>
            <small>Sábados e domingos marcados como férias que não descontam no regime padrão.</small>
          </article>

          <article className="vacationInsightCard">
            <span>Fecho de {currentMonthName}</span>
            <strong>{daysLabel(balance.currentAccrualMonthTargetCumulativeDays)}</strong>
            <small>Marco previsto para {formatDate(balance.currentAccrualMonthEndDate)}.</small>
          </article>

          <article className="vacationInsightCard">
            <span>Falta neste mês</span>
            <strong>{preciseDaysLabel(balance.currentAccrualMonthRemainingDays)}</strong>
            <small>Ritmo aproximado de {preciseDaysLabel(balance.currentAccrualMonthDailyRate)} por dia de calendário.</small>
          </article>
        </div>

        <p className="vacationInsightsProjection">
          Mantendo a meta atual e sem novos ajustes ou férias adicionais, a projeção pessoal termina {balance.year}
          {' '}com <strong>{preciseDaysLabel(balance.yearEndProjectedBalanceDays)}</strong> depois dos dias já gozados e planeados.
        </p>
      </section>

      <VacationPlannerPanel
        today={today}
        asOfDayProgress={localDayProgress(now)}
        settings={settings}
        recordedVacationDates={recordedVacationDates}
        formatDate={formatDate}
        daysLabel={daysLabel}
        preciseDaysLabel={preciseDaysLabel}
      />

      <section className="vacationPanel vacationAccrualPanel" aria-labelledby="vacation-accrual-title">
        <div className="vacationPanelHeader">
          <div>
            <span>ACUMULAÇÃO AUTOMÁTICA · {balance.year}</span>
            <h2 id="vacation-accrual-title">Evolução por mês</h2>
          </div>
          <strong>{preciseDaysLabel(balance.monthlyLiveAccruedDays)} agora</strong>
        </div>

        <p className="vacationAccrualIntro">
          Cada mês vale exatamente 1/12 da meta anual. Os meses concluídos mantêm o marco fechado; no mês em
          curso, a aplicação calcula a fração do mês já decorrida e atualiza o acumulado enquanto a página está
          aberta ou quando regressas à aplicação. O cálculo parte sempre da meta anual, sem somar valores já
          arredondados.
        </p>

        <div className="vacationLiveSummary" aria-label={`Progresso atual de ${currentMonthName}`}>
          <div>
            <span>Meta no fecho de {currentMonthName}</span>
            <strong>{daysLabel(balance.currentAccrualMonthTargetCumulativeDays)}</strong>
          </div>
          <div>
            <span>Ganho neste mês</span>
            <strong>+{preciseDaysLabel(balance.currentAccrualMonthEarnedDays)}</strong>
          </div>
          <div>
            <span>Falta neste mês</span>
            <strong>{preciseDaysLabel(balance.currentAccrualMonthRemainingDays)}</strong>
          </div>
          <div>
            <span>Ritmo diário aproximado</span>
            <strong>{preciseDaysLabel(balance.currentAccrualMonthDailyRate)}/dia</strong>
          </div>
        </div>

        <div className="vacationMonthGrid" role="list" aria-label="Acumulação de férias por mês">
          {balance.monthlyAccrualSchedule.map((item) => {
            const state = item.completed
              ? 'Concluído'
              : item.current
                ? `Em curso · ${percentLabel(item.progressPercent)}%`
                : 'Futuro'
            const stateClass = item.completed
              ? ' vacationMonthCompleted'
              : item.current
                ? ' vacationMonthCurrent'
                : ''
            const displayedDays = item.current && !item.completed
              ? preciseDaysLabel(item.liveCumulativeDays)
              : daysLabel(item.cumulativeDays)

            return (
              <article className={`vacationMonthCard${stateClass}`} key={item.month} role="listitem">
                <div>
                  <span className="vacationMonthName">{monthLabel(item.month)}</span>
                  <span className="vacationMonthState">{state}</span>
                </div>
                <strong>{displayedDays}</strong>
                <div
                  className="vacationMonthProgressTrack"
                  role="progressbar"
                  aria-label={`Progresso de ${monthLabel(item.month)}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.progressPercent)}
                >
                  <span style={{ width: `${item.progressPercent}%` }} />
                </div>
                {item.current && !item.completed ? (
                  <>
                    <small>
                      +{preciseDaysLabel(item.earnedDays)} neste mês · meta acumulada de {daysLabel(item.cumulativeDays)}.
                    </small>
                    <small>
                      Faltam {preciseDaysLabel(item.remainingDays)} até {formatDate(item.monthEndDate)}.
                    </small>
                  </>
                ) : item.completed ? (
                  <small>Marco fechado em {formatDate(item.monthEndDate)}.</small>
                ) : (
                  <small>Meta prevista no fecho de {formatDate(item.monthEndDate)}.</small>
                )}
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
              Serve para veres a progressão mês a mês, incluindo a evolução do mês atual. Não altera sozinho
              o número oficial de dias de férias reconhecido pela entidade empregadora, contrato ou instrumento
              coletivo.
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
            <div><dt>Acumulado em tempo real</dt><dd>{preciseDaysLabel(balance.monthlyLiveAccruedDays)}</dd></div>
            <div><dt>Meses já fechados</dt><dd>{daysLabel(balance.monthlyAccruedDays)}</dd></div>
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
          A meta anual continua distribuída em 12 partes exatas. No mês atual, essa parcela é multiplicada pela
          fração do mês já decorrida, incluindo a fração do dia local. O resultado vivo usa até quatro casas
          decimais na apresentação e é recalculado diretamente a partir da meta, evitando drift de arredondamento.
        </p>
        <p>
          Os indicadores de progresso anual, próximo marco e previsão para 31 de dezembro são derivados da mesma
          projeção pessoal. O próximo marco indica quando o modelo de acumulação alcança o próximo dia inteiro;
          não representa uma nova regra laboral nem uma garantia emitida pela entidade empregadora.
        </p>
        <p>
          A atualização automática ocorre a cada minuto enquanto a página está ativa e também quando regressas
          à aplicação. Como qualquer PWA, o sistema operativo pode suspender JavaScript em segundo plano; por
          isso, a aplicação recalcula imediatamente a partir da hora atual quando volta ao primeiro plano, em vez
          de depender de um timer que tenha continuado a executar em background.
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
