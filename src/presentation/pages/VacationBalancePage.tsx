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

function daysLabel(value: number) {
  return `${value} ${Math.abs(value) === 1 ? 'dia' : 'dias'}`
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
      carriedDays: Math.max(0, Math.round(safeNumber(settings.carriedDays))),
      manualTakenDays: Math.max(0, Math.round(safeNumber(settings.manualTakenDays))),
      adjustmentDays: Math.round(safeNumber(settings.adjustmentDays)),
    }
    secureStorage.setItem(VACATION_SETTINGS_KEY, JSON.stringify(normalized))
    setSettings(normalized)
    setSavedAt(new Date().toISOString())
  }

  const noStartDate = !settings.employmentStartDate || !balance.hasValidEmploymentStartDate
  const balanceTone = balance.availableBalanceDays < 0 ? ' vacationMetricDanger' : ''
  const projectedTone = balance.projectedBalanceDays < 0 ? ' vacationMetricDanger' : ''

  return (
    <div className="vacationPage">
      <header className="vacationHero">
        <div>
          <span className="vacationEyebrow">FÉRIAS · CONTROLO PESSOAL</span>
          <h1>Saldo de férias</h1>
          <p>
            Calcula o direito estimado, o que já foi registado como férias e o saldo que permanece
            disponível, sem confundir projeção com o registo oficial da entidade empregadora.
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
          <span>Preenche a data de início do contrato para ativar o cálculo legal do ano de admissão.</span>
        </section>
      ) : null}

      <section className="vacationMetricGrid" aria-label="Resumo do saldo de férias">
        <article className={`vacationMetricCard vacationMetricPrimary${balanceTone}`}>
          <span>Saldo hoje</span>
          <strong>{daysLabel(balance.availableBalanceDays)}</strong>
          <small>Direito + transitados + ajustes − férias já gozadas/registadas.</small>
        </article>
        <article className={`vacationMetricCard${projectedTone}`}>
          <span>Após planeadas</span>
          <strong>{daysLabel(balance.projectedBalanceDays)}</strong>
          <small>Desconta também {daysLabel(balance.recordedPlannedDays)} marcados para datas futuras.</small>
        </article>
        <article className="vacationMetricCard">
          <span>Direito de {balance.year}</span>
          <strong>{daysLabel(balance.entitlementDays)}</strong>
          <small>
            {balance.isAdmissionYear
              ? `${balance.completedContractMonths} meses completos considerados.`
              : 'Período anual configurado, nunca abaixo do mínimo geral de 22 dias.'}
          </small>
        </article>
        <article className="vacationMetricCard">
          <span>Gozadas/registadas</span>
          <strong>{daysLabel(balance.takenDays)}</strong>
          <small>
            {balance.recordedTakenDays} detetados na app + {balance.manualTakenDays} fora do registo.
          </small>
        </article>
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
              <span>Data de admissão</span>
              <input
                type="date"
                value={settings.employmentStartDate}
                max={today}
                onChange={(event) => update('employmentStartDate', event.target.value)}
              />
              <small>Usada para distinguir o ano de admissão dos anos seguintes.</small>
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
              <small>22 é o mínimo geral. Usa um valor superior apenas se contrato/CCT o confirmar.</small>
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

            <label className="vacationFieldWide">
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
              <small>
                Para correções documentadas, dias adicionais ou acertos. Valores negativos reduzem o saldo.
              </small>
            </label>
          </div>

          <button className="vacationSaveButton" type="button" onClick={saveSettings}>
            Guardar configuração
          </button>
        </section>

        <section className="vacationPanel vacationRules" aria-labelledby="vacation-rules-title">
          <div className="vacationPanelHeader">
            <div>
              <span>LEITURA CORRETA</span>
              <h2 id="vacation-rules-title">Como o cálculo funciona</h2>
            </div>
          </div>

          {balance.isAdmissionYear ? (
            <div className="vacationRuleHighlight">
              <strong>Ano de admissão</strong>
              <p>
                A ferramenta usa 2 dias por cada mês completo de contrato, até 20 dias. O gozo do
                direito do ano de admissão é apresentado como disponível a partir de{' '}
                <strong>{formatDate(balance.entitlementUsableFromDate)}</strong>.
              </p>
            </div>
          ) : (
            <div className="vacationRuleHighlight">
              <strong>Não existe acumulação mensal normal</strong>
              <p>
                Depois do ano de admissão, o período anual vence, em regra, a 1 de janeiro. A próxima
                referência será <strong>{daysLabel(balance.nextEntitlementDays)}</strong> em{' '}
                <strong>{formatDate(balance.nextEntitlementDate)}</strong>, salvo regra mais favorável.
              </p>
            </div>
          )}

          {!balance.canUseCurrentEntitlement && !noStartDate ? (
            <div className="vacationNotice vacationNoticeWarning">
              <strong>Período de espera ainda não concluído.</strong>
              <span>
                O cálculo separa dias adquiridos da possibilidade de os gozar antes dos seis meses completos.
              </span>
            </div>
          ) : null}

          <dl className="vacationBreakdown">
            <div><dt>Direito do ano</dt><dd>{daysLabel(balance.entitlementDays)}</dd></div>
            <div><dt>Transitados</dt><dd>{daysLabel(balance.carriedDays)}</dd></div>
            <div><dt>Ajustes</dt><dd>{daysLabel(balance.adjustmentDays)}</dd></div>
            <div><dt>Gozadas até hoje</dt><dd>− {daysLabel(balance.takenDays)}</dd></div>
            <div><dt>Planeadas futuras</dt><dd>− {daysLabel(balance.recordedPlannedDays)}</dd></div>
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

      <section className="vacationLegalNote" aria-label="Enquadramento legal e limitações">
        <strong>Precisão e limites</strong>
        <p>
          Este é um controlo pessoal. O saldo oficial deve ser confirmado com a entidade empregadora,
          sobretudo em situações de instrumento de regulamentação coletiva, impedimento prolongado,
          cessação do contrato ou transferência de férias. Em meses incompletos no ano de admissão existe
          discussão jurisprudencial; por prudência, esta ferramenta usa meses completos e assinala essa regra.
        </p>
        <p>
          Referência geral: Código do Trabalho, artigos 237.º a 240.º. O período anual mínimo é de 22 dias
          úteis; no ano de admissão aplicam-se regras especiais e a transferência para o ano seguinte depende
          das condições legalmente previstas.
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
