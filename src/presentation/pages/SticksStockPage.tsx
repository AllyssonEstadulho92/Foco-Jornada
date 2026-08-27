import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  NICOTINE_REFERENCE_PROFILES,
  type NicotineAwarenessSettings,
  type NicotineAwarenessSummary,
  type NicotineProfileId,
} from '../../application/personalStock/NicotineAwarenessService'
import type {
  StickPackProjection,
  StickPackSettings,
} from '../../application/personalStock/StickPackPlannerService'
import type { PhysicalStockCheck, StickSummary, StockMovement } from '../../domain/personalStock/models'
import { useAppServices } from '../providers/AppServicesProvider'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function movementLabel(movement: StockMovement): string {
  if (movement.type === 'initial_stock') return 'Stock inicial'
  if (movement.type === 'consumption') return 'Utilização'
  if (movement.type === 'restock') return 'Reposição'
  if (movement.correctionReason === 'physical_count') return 'Reconciliação física'
  if (movement.correctionReason === 'undo_restock') return 'Correção de reposição'
  return 'Correção'
}

function formatPhysicalCheckTime(value?: string): string {
  if (!value) return 'Nunca verificado'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateKey(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function adjustmentClass(value?: string): string {
  if (!value || value === '0') return 'stockPhysicalAdjustmentZero'
  return value.startsWith('-') ? 'stockPhysicalAdjustmentNegative' : 'stockPhysicalAdjustmentPositive'
}

function signed(value?: string): string {
  if (!value) return '—'
  if (value === '0' || value.startsWith('-')) return value
  return `+${value}`
}

function nicotineAmount(minMg?: string, maxMg?: string): string {
  if (minMg === undefined || maxMg === undefined) return '—'
  const local = (value: string) => value.replace('.', ',')
  return minMg === maxMg ? `${local(minMg)} mg` : `${local(minMg)}–${local(maxMg)} mg`
}

function localDecimal(value: string): string {
  return value.replace('.', ',')
}

function initialPackSettings(): StickPackSettings {
  return {
    packCount: 12,
    sticksPerPack: 20,
    updatedAt: new Date(0).toISOString(),
  }
}

export function SticksStockPage() {
  const {
    personalStockService,
    stockReconciliationService,
    nicotineAwarenessService,
    stickPackPlannerService,
  } = useAppServices()
  const [summary, setSummary] = useState<StickSummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [physicalCheck, setPhysicalCheck] = useState<PhysicalStockCheck | null>(null)
  const [nicotineSummary, setNicotineSummary] = useState<NicotineAwarenessSummary | null>(null)
  const [nicotineSettings, setNicotineSettings] = useState<NicotineAwarenessSettings | null>(null)
  const [nicotineSettingsReady, setNicotineSettingsReady] = useState(false)
  const [nicotineSaveState, setNicotineSaveState] = useState('')
  const [packSettings, setPackSettings] = useState<StickPackSettings>(initialPackSettings)
  const [packSettingsReady, setPackSettingsReady] = useState(false)
  const [packSaveState, setPackSaveState] = useState('')
  const [packProjection, setPackProjection] = useState<StickPackProjection | null>(null)
  const [quantity, setQuantity] = useState('20')
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const reload = useCallback(async () => {
    const [
      nextSummary,
      nextMovements,
      nextPhysicalCheck,
      nextNicotineSummary,
      nextPackProjection,
    ] = await Promise.all([
      personalStockService.getSticksSummary(),
      personalStockService.listStickMovements(50),
      stockReconciliationService.getPhysicalCheck('stock:sticks:glo'),
      nicotineAwarenessService.getSummary(),
      stickPackPlannerService.getProjection(),
    ])
    setSummary(nextSummary)
    setMovements(nextMovements)
    setPhysicalCheck(nextPhysicalCheck)
    setNicotineSummary(nextNicotineSummary)
    setPackProjection(nextPackProjection)
  }, [
    nicotineAwarenessService,
    personalStockService,
    stickPackPlannerService,
    stockReconciliationService,
  ])

  useEffect(() => {
    void reload().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar o stock.'))

    void Promise.all([
      nicotineAwarenessService.getSettings(),
      stickPackPlannerService.getSettings(),
    ]).then(([settings, packs]) => {
      setNicotineSettings(settings)
      setNicotineSettingsReady(true)
      setPackSettings(packs)
      setPackSettingsReady(true)
    }).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar a configuração.')
    })
  }, [nicotineAwarenessService, reload, stickPackPlannerService])

  useEffect(() => {
    if (!nicotineSettings || !nicotineSettingsReady) return
    setNicotineSaveState('A guardar…')
    const timer = window.setTimeout(() => {
      void nicotineAwarenessService.saveSettings({
        profileId: nicotineSettings.profileId,
        customMinMg: nicotineSettings.customMinMg,
        customMaxMg: nicotineSettings.customMaxMg,
        notes: nicotineSettings.notes,
        reductionPlanEnabled: nicotineSettings.reductionPlanEnabled,
        dailyBaselineSticks: nicotineSettings.dailyBaselineSticks,
        weeklyReductionStep: nicotineSettings.weeklyReductionStep,
        reductionPlanStartDate: nicotineSettings.reductionPlanStartDate,
      }).then(async () => {
        setNicotineSaveState('Guardado automaticamente e incluído no backup.')
        const [nextNicotine, nextProjection] = await Promise.all([
          nicotineAwarenessService.getSummary(),
          stickPackPlannerService.getProjection(),
        ])
        setNicotineSummary(nextNicotine)
        setPackProjection(nextProjection)
      }).catch((error: unknown) => {
        setNicotineSaveState(error instanceof Error ? error.message : 'Não foi possível guardar esta configuração.')
      })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [
    nicotineAwarenessService,
    nicotineSettings?.profileId,
    nicotineSettings?.customMinMg,
    nicotineSettings?.customMaxMg,
    nicotineSettings?.notes,
    nicotineSettings?.reductionPlanEnabled,
    nicotineSettings?.dailyBaselineSticks,
    nicotineSettings?.weeklyReductionStep,
    nicotineSettings?.reductionPlanStartDate,
    nicotineSettingsReady,
    stickPackPlannerService,
  ])

  useEffect(() => {
    if (!packSettingsReady) return
    setPackSaveState('A guardar…')
    const timer = window.setTimeout(() => {
      void stickPackPlannerService.saveSettings({
        packCount: packSettings.packCount,
        sticksPerPack: packSettings.sticksPerPack,
      }).then(async (saved) => {
        setPackSettings(saved)
        setPackSaveState('Configuração dos maços guardada automaticamente.')
        setPackProjection(await stickPackPlannerService.getProjection())
      }).catch((error: unknown) => {
        setPackSaveState(error instanceof Error ? error.message : 'Não foi possível guardar a configuração dos maços.')
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [
    packSettings.packCount,
    packSettings.sticksPerPack,
    packSettingsReady,
    stickPackPlannerService,
  ])

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
      await reload()
      setMessage(success)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  const parsedQuantity = Number(quantity)
  const canSubmitQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0
  const canSubmitPhysical = /^\d+$/.test(physicalQuantity.trim())
    && BigInt(physicalQuantity.trim() || '0') <= BigInt(Number.MAX_SAFE_INTEGER)

  const configuredPackTotal = useMemo(
    () => packSettings.packCount * packSettings.sticksPerPack,
    [packSettings.packCount, packSettings.sticksPerPack],
  )
  const packConfigurationValid = Number.isSafeInteger(packSettings.packCount)
    && packSettings.packCount >= 0
    && Number.isSafeInteger(packSettings.sticksPerPack)
    && packSettings.sticksPerPack > 0
    && Number.isSafeInteger(configuredPackTotal)
    && configuredPackTotal > 0

  const updateNicotineSetting = <K extends keyof NicotineAwarenessSettings>(
    key: K,
    value: NicotineAwarenessSettings[K],
  ) => {
    setNicotineSettings((current) => current ? { ...current, [key]: value } : current)
  }

  const reductionPlan = nicotineSummary?.reductionPlan
  const reductionStatus = reductionPlan
    ? !reductionPlan.enabled
      ? 'Plano pausado'
      : reductionPlan.overTargetBy > 0
        ? `Acima da meta pessoal por ${reductionPlan.overTargetBy}`
        : reductionPlan.consumedToday === reductionPlan.targetToday
          ? 'Na meta pessoal'
          : 'Abaixo da meta pessoal'
    : 'A carregar…'
  const trendValue = reductionPlan ? Number(reductionPlan.trendDelta) : 0
  const trendText = reductionPlan
    ? `${trendValue > 0 ? '+' : ''}${localDecimal(reductionPlan.trendDelta)} sticks/dia`
    : '—'

  const currentPackText = packProjection?.currentStockSticks === null || packProjection?.currentStockSticks === undefined
    ? '—'
    : `${packProjection.fullPacksRemaining ?? 0} maço(s) + ${packProjection.looseSticksRemaining ?? 0} stick(s)`

  async function confirmConfiguredPhysicalStock() {
    const saved = await stickPackPlannerService.saveSettings({
      packCount: packSettings.packCount,
      sticksPerPack: packSettings.sticksPerPack,
    })
    const total = saved.packCount * saved.sticksPerPack
    if (summary?.initialized) {
      await stockReconciliationService.reconcileSticksPhysicalCount(String(total), operationId())
    } else {
      await personalStockService.initializeSticks(total, operationId())
    }
  }

  async function addOneConfiguredPack() {
    if (!summary?.initialized) throw new Error('Confirma primeiro o stock físico inicial.')
    await personalStockService.restockSticks(packSettings.sticksPerPack, operationId())
  }

  return (
    <section className="personalStockPage sticksStockPage sticksControlV2" aria-labelledby="sticks-title">
      <header className="personalStockHeader sticksControlHeader">
        <div>
          <span className="eyebrow">STOCK PESSOAL · EXATO</span>
          <h1 id="sticks-title">Controlo de sticks glo</h1>
          <p>Stock em maços e sticks, registo rápido de utilização, projeção de duração e ledger auditável.</p>
        </div>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      <div className="stickHeroMetrics">
        <article className="stickHeroMetric isPrimary">
          <span>Stock atual</span>
          <strong>{summary?.initialized ? summary.stock : configuredPackTotal}</strong>
          <small>{summary?.initialized ? 'sticks no ledger' : 'sticks configurados, ainda por confirmar'}</small>
        </article>
        <article className="stickHeroMetric">
          <span>Equivalente em maços</span>
          <strong>{currentPackText}</strong>
          <small>{packSettings.sticksPerPack} sticks por maço</small>
        </article>
        <article className="stickHeroMetric">
          <span>Utilizados hoje</span>
          <strong>{summary?.initialized ? summary.usedToday : 0}</strong>
          <small>contagem exata</small>
        </article>
        <article className="stickHeroMetric">
          <span>Previsão à linha de base</span>
          <strong>{formatDateKey(packProjection?.baselineDepletionDate)}</strong>
          <small>
            {packProjection?.baselineDays
              ? `≈ ${localDecimal(packProjection.baselineDays)} dias a ${packProjection.baselineDailySticks}/dia`
              : 'confirma primeiro o stock'}
          </small>
        </article>
      </div>

      <section className="stickPackSetup" aria-labelledby="stick-pack-title">
        <div className="stickPackSetupHeading">
          <div>
            <span className="stockPanelTag">STOCK EM MAÇOS</span>
            <h2 id="stick-pack-title">{packSettings.packCount} maço(s) × {packSettings.sticksPerPack} sticks</h2>
            <p>Esta configuração fica guardada. Confirmar o stock cria ou reconcilia o ledger sem apagar movimentos anteriores.</p>
          </div>
          <span className={packProjection?.configuredMatchesCurrent ? 'stickPackBadge isOk' : 'stickPackBadge'}>
            {packProjection?.configuredMatchesCurrent ? 'CONFIRMADO' : 'POR CONFIRMAR'}
          </span>
        </div>

        <div className="stickPackInputs">
          <label>
            Maços físicos
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="10000"
              value={packSettings.packCount}
              onChange={(event) => setPackSettings((current) => ({
                ...current,
                packCount: Number(event.target.value),
              }))}
            />
          </label>
          <span aria-hidden="true">×</span>
          <label>
            Sticks por maço
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="1000"
              value={packSettings.sticksPerPack}
              onChange={(event) => setPackSettings((current) => ({
                ...current,
                sticksPerPack: Number(event.target.value),
              }))}
            />
          </label>
          <span aria-hidden="true">=</span>
          <div className="stickPackTotal">
            <strong>{Number.isFinite(configuredPackTotal) ? configuredPackTotal : '—'}</strong>
            <span>sticks</span>
          </div>
        </div>

        <div className="stickPackCompare">
          <div>
            <span>Configurado</span>
            <strong>{configuredPackTotal} sticks</strong>
          </div>
          <div>
            <span>Ledger atual</span>
            <strong>{summary?.initialized ? summary.stock : 'não iniciado'}</strong>
          </div>
          <div>
            <span>Diferença</span>
            <strong>
              {packProjection?.configuredDifference === null || packProjection?.configuredDifference === undefined
                ? '—'
                : signed(String(packProjection.configuredDifference))}
            </strong>
          </div>
        </div>

        <div className="stickPackActions">
          <button
            type="button"
            className="stockPrimaryAction"
            disabled={busy || !packConfigurationValid}
            onClick={() => void run(
              confirmConfiguredPhysicalStock,
              `Stock físico confirmado: ${configuredPackTotal} sticks. O ledger foi atualizado sem apagar o histórico.`,
            )}
          >
            Confirmar {configuredPackTotal} sticks no stock
          </button>
          <button
            type="button"
            className="stockSecondaryAction"
            disabled={busy || !summary?.initialized || !Number.isSafeInteger(packSettings.sticksPerPack)}
            onClick={() => void run(
              addOneConfiguredPack,
              `1 maço adicionado: +${packSettings.sticksPerPack} sticks.`,
            )}
          >
            + Adicionar 1 maço
          </button>
        </div>
        <span className="stickPackSaveState" role="status">
          {packSaveState || `${packSettings.packCount} maço(s) de ${packSettings.sticksPerPack} correspondem a ${configuredPackTotal} sticks.`}
        </span>
      </section>

      <section className="stickQuickUse" aria-labelledby="stick-use-title">
        <div>
          <span className="stockPanelTag">REGISTO RÁPIDO</span>
          <h2 id="stick-use-title">Utilização</h2>
          <p>Cada toque confirmado grava um movimento de −1 stick. Desfazer cria uma correção; não apaga o movimento anterior.</p>
        </div>
        <div className="stickQuickButtons">
          <button
            type="button"
            className="stockPrimaryAction stickUseMainButton"
            disabled={busy || !summary?.initialized || (summary.stock ?? 0) <= 0}
            onClick={() => void run(
              () => personalStockService.consumeStick(operationId()),
              '1 stick registado. Stock, projeções e histórico atualizados.',
            )}
          >
            + 1 stick utilizado
          </button>
          <button
            type="button"
            className="stockSecondaryAction"
            disabled={busy || !summary?.initialized}
            onClick={() => void run(
              () => personalStockService.undoLastStick(operationId()),
              'Última utilização corrigida por um novo movimento auditável.',
            )}
          >
            Corrigir último registo
          </button>
        </div>
      </section>

      <section className="stickForecastPanel" aria-labelledby="stick-forecast-title">
        <div className="stickForecastHeading">
          <div>
            <span className="stockPanelTag">DURAÇÃO DO STOCK</span>
            <h2 id="stick-forecast-title">Até quando pode durar</h2>
          </div>
          <span className="stickForecastBadge">PROJEÇÃO</span>
        </div>

        <div className="stickForecastGrid">
          <article>
            <span>Linha de base pessoal</span>
            <strong>{formatDateKey(packProjection?.baselineDepletionDate)}</strong>
            <small>
              {packProjection?.baselineDays
                ? `${localDecimal(packProjection.baselineDays)} dias a ${packProjection.baselineDailySticks} sticks/dia`
                : 'Sem stock confirmado'}
            </small>
          </article>
          <article>
            <span>Média dos últimos 7 dias</span>
            <strong>{formatDateKey(packProjection?.historicalDepletionDate)}</strong>
            <small>
              {packProjection?.historicalDailyAverage && packProjection?.historicalDays
                ? `${localDecimal(packProjection.historicalDailyAverage)} sticks/dia · ≈ ${localDecimal(packProjection.historicalDays)} dias`
                : 'Ainda sem histórico suficiente'}
            </small>
          </article>
          <article>
            <span>Trajetória de redução</span>
            <strong>
              {packProjection?.reductionPlanStopsBeforeDepletion
                ? 'Stock excedente'
                : formatDateKey(packProjection?.reductionPlanDepletionDate)}
            </strong>
            <small>
              {packProjection?.reductionPlanDays !== null && packProjection?.reductionPlanDays !== undefined
                ? `≈ ${packProjection.reductionPlanDays} dias seguindo a meta pessoal`
                : packProjection?.reductionPlanStopsBeforeDepletion
                  ? 'a meta matemática chega a 0 antes de o stock acabar'
                  : 'Sem projeção disponível'}
            </small>
          </article>
        </div>

        <p className="stickForecastRule">
          <strong>Regra:</strong> estas datas são projeções matemáticas do stock, não recomendações de consumo.
          O stock exato vem do ledger; a data muda sempre que registas uma utilização, reposição ou correção.
        </p>
      </section>

      {nicotineSettings && reductionPlan ? (
        <section className="stickReductionCompact" aria-labelledby="stick-reduction-title">
          <div className="stickReductionCompactHeading">
            <div>
              <span className="stockPanelTag">REDUÇÃO PESSOAL</span>
              <h2 id="stick-reduction-title">Plano atual</h2>
            </div>
            <span className="nicotineReductionBadge">META PESSOAL</span>
          </div>
          <div className="stickReductionCompactGrid">
            <article><span>Hoje</span><strong>{reductionPlan.consumedToday}</strong><small>sticks registados</small></article>
            <article><span>Meta da semana</span><strong>{reductionPlan.targetToday}/dia</strong><small>não é limite seguro</small></article>
            <article><span>Situação</span><strong>{reductionStatus}</strong><small>comparação com a meta</small></article>
            <article><span>Tendência</span><strong className={trendValue > 0 ? 'nicotineTrendUp' : trendValue < 0 ? 'nicotineTrendDown' : ''}>{trendText}</strong><small>vs. 7 dias anteriores</small></article>
          </div>
          <div className="stickReductionSettings">
            <label className="nicotinePlanToggle">
              <input
                type="checkbox"
                checked={nicotineSettings.reductionPlanEnabled}
                onChange={(event) => updateNicotineSetting('reductionPlanEnabled', event.target.checked)}
              />
              Plano automático ativo
            </label>
            <label>
              Linha de base
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="200"
                value={nicotineSettings.dailyBaselineSticks}
                onChange={(event) => updateNicotineSetting('dailyBaselineSticks', Number(event.target.value))}
              />
            </label>
            <label>
              Redução semanal
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="50"
                value={nicotineSettings.weeklyReductionStep}
                onChange={(event) => updateNicotineSetting('weeklyReductionStep', Number(event.target.value))}
              />
            </label>
            <label>
              Início
              <input
                type="date"
                value={nicotineSettings.reductionPlanStartDate}
                onChange={(event) => updateNicotineSetting('reductionPlanStartDate', event.target.value)}
              />
            </label>
          </div>
          <span className="nicotineSaveState" role="status">
            {nicotineSaveState || 'Alterações guardadas automaticamente.'}
          </span>
        </section>
      ) : null}

      <details className="stickAdvancedDetails">
        <summary>
          <span>Nicotina e fontes</span>
          <small>Estimativa separada da contagem exata de sticks</small>
        </summary>
        <section className="stockPanel nicotineAwarenessPanel" aria-labelledby="nicotine-awareness-title">
          <div className="nicotineAwarenessHeading">
            <div>
              <span className="stockPanelTag">CONSCIÊNCIA DE NICOTINA</span>
              <h2 id="nicotine-awareness-title">Nicotina estimada associada às utilizações</h2>
            </div>
            <span className="nicotineAwarenessBadge">ESTIMATIVA</span>
          </div>

          <div className="nicotineMetricGrid">
            <article className="nicotineMetric">
              <span>Hoje</span>
              <strong>{nicotineAmount(nicotineSummary?.today.minMg, nicotineSummary?.today.maxMg)}</strong>
              <small>{nicotineSummary?.today.sticks ?? 0} sticks registados</small>
            </article>
            <article className="nicotineMetric">
              <span>Últimos 7 dias</span>
              <strong>{nicotineAmount(nicotineSummary?.last7Days.minMg, nicotineSummary?.last7Days.maxMg)}</strong>
              <small>{nicotineSummary?.last7Days.sticks ?? 0} sticks registados</small>
            </article>
            <article className="nicotineMetric">
              <span>Total registado</span>
              <strong>{nicotineAmount(nicotineSummary?.allTime.minMg, nicotineSummary?.allTime.maxMg)}</strong>
              <small>{nicotineSummary?.allTime.sticks ?? 0} sticks líquidos após correções</small>
            </article>
          </div>

          {nicotineSettings ? (
            <>
              <div className="nicotineSettingsGrid">
                <label>
                  Perfil do stick
                  <select
                    value={nicotineSettings.profileId}
                    onChange={(event) => updateNicotineSetting('profileId', event.target.value as NicotineProfileId)}
                  >
                    {NICOTINE_REFERENCE_PROFILES.map((profile) => (
                      <option value={profile.id} key={profile.id}>{profile.label}</option>
                    ))}
                    <option value="custom">Personalizado — usar valor confirmado</option>
                  </select>
                </label>

                <div className="nicotineSourceBox">
                  <strong>{nicotineSummary?.profileLabel ?? 'A carregar referência…'}</strong>
                  <p>{nicotineSummary?.evidenceNote}</p>
                  {nicotineSummary?.sourceUrl ? (
                    <a href={nicotineSummary.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte científica</a>
                  ) : null}
                </div>

                {nicotineSettings.profileId === 'custom' ? (
                  <div className="nicotineCustomRange">
                    <label>
                      Nicotina mínima por stick (mg)
                      <input
                        inputMode="decimal"
                        value={nicotineSettings.customMinMg}
                        onChange={(event) => updateNicotineSetting('customMinMg', event.target.value)}
                      />
                    </label>
                    <label>
                      Nicotina máxima por stick (mg)
                      <input
                        inputMode="decimal"
                        value={nicotineSettings.customMaxMg}
                        onChange={(event) => updateNicotineSetting('customMaxMg', event.target.value)}
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <label className="nicotineNotesLabel">
                Notas sobre o produto / referência utilizada
                <textarea
                  maxLength={4000}
                  placeholder="Ex.: variante do produto; confirmar valor da embalagem ou laboratório."
                  value={nicotineSettings.notes}
                  onChange={(event) => updateNicotineSetting('notes', event.target.value)}
                />
              </label>
            </>
          ) : null}

          <p className="nicotineWarning">
            <strong>Importante:</strong> mg por stick medidos em máquina não equivalem à dose absorvida pelo organismo.
            A aplicação mantém esta informação como estimativa de emissão, nunca como dose corporal exata.
          </p>
          <p className="nicotineWhoNote">
            A OMS refere que todas as formas de tabaco são nocivas, que não existe nível seguro de exposição ao tabaco e que a nicotina é altamente aditiva.{' '}
            <a href="https://www.who.int/en/news-room/fact-sheets/detail/tobacco" target="_blank" rel="noreferrer">Consultar OMS</a>.
          </p>
        </section>
      </details>

      <details className="stickAdvancedDetails">
        <summary>
          <span>Stock, reposições e contagem física</span>
          <small>Ferramentas de correção e conferência</small>
        </summary>
        <div className="stockTwoPanels stickAdvancedPanelGrid">
          <section className="stockPanel">
            <span className="stockPanelTag">REPOSIÇÃO MANUAL</span>
            <h2>Adicionar sticks avulsos</h2>
            <div className="stockInlineForm stockInlineFormStack">
              <label>
                Sticks a adicionar
                <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
              <button
                type="button"
                disabled={busy || !summary?.initialized || !canSubmitQuantity}
                onClick={() => void run(
                  () => personalStockService.restockSticks(parsedQuantity, operationId()),
                  'Reposição adicionada ao ledger.',
                )}
              >
                Adicionar
              </button>
            </div>
            <div className="stockCorrectionActions">
              <button
                type="button"
                className="stockSecondaryAction"
                disabled={busy || !summary?.initialized}
                onClick={() => void run(
                  () => stockReconciliationService.undoLastStickRestock(operationId()),
                  'Última reposição corrigida através de um novo movimento auditável.',
                )}
              >
                Corrigir última reposição
              </button>
            </div>
          </section>

          <section className="stockPanel stockPhysicalPanel">
            <span className="stockPanelTag">CONFERÊNCIA REAL</span>
            <h2>Contagem física</h2>
            <p>Se a quantidade física for diferente do ledger, é criado um movimento corretivo. O histórico anterior permanece.</p>
            <div className="stockInlineForm stockInlineFormStack stockPhysicalInline">
              <label>
                Quantidade contada
                <input
                  inputMode="numeric"
                  placeholder="ex.: 240"
                  value={physicalQuantity}
                  onChange={(event) => setPhysicalQuantity(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="stockPrimaryAction"
                disabled={busy || !summary?.initialized || !canSubmitPhysical}
                onClick={() => void run(
                  async () => {
                    await stockReconciliationService.reconcileSticksPhysicalCount(physicalQuantity, operationId())
                    setPhysicalQuantity('')
                  },
                  'Contagem física guardada e ledger reconciliado.',
                )}
              >
                Reconciliar contagem
              </button>
            </div>

            {physicalCheck ? (
              <>
                <div className="stockPhysicalGrid" aria-label="Última conferência física">
                  <div className="stockPhysicalMetric"><span>Calculado antes</span><strong>{physicalCheck.expected}</strong></div>
                  <div className="stockPhysicalMetric"><span>Contado</span><strong>{physicalCheck.counted}</strong></div>
                  <div className="stockPhysicalMetric">
                    <span>Ajuste aplicado</span>
                    <strong className={adjustmentClass(physicalCheck.adjustment)}>{signed(physicalCheck.adjustment)}</strong>
                  </div>
                </div>
                <p className="stockPhysicalCheckTime">Verificado em {formatPhysicalCheckTime(physicalCheck.checkedAt)}.</p>
              </>
            ) : null}
          </section>
        </div>
      </details>

      <details className="stickAdvancedDetails">
        <summary>
          <span>Histórico auditável</span>
          <small>{summary?.movementCount ?? 0} movimentos · {summary?.ok ? 'integridade OK' : 'verificar integridade'}</small>
        </summary>
        <section className="stockPanel">
          <div className="stockPanelHeading">
            <div>
              <span className="stockPanelTag">LEDGER</span>
              <h2>Histórico de movimentos</h2>
            </div>
            <span className={summary?.ok ? 'stockStatusOk' : 'stockStatusError'}>{summary?.ok ? 'OK' : 'VERIFICAR'}</span>
          </div>

          {movements.length ? (
            <div className="stockLedgerList">
              {movements.map((movement) => (
                <article className="stockLedgerRow" key={movement.id}>
                  <div>
                    <strong>{movementLabel(movement)}</strong>
                    <small>{new Date(movement.effectiveAt).toLocaleString('pt-PT')}</small>
                  </div>
                  <div className="stockLedgerMath">
                    <span>{movement.balanceBeforeMinor}</span>
                    <b>{BigInt(movement.quantityMinor) > 0n ? '+' : ''}{movement.quantityMinor}</b>
                    <span>= {movement.balanceAfterMinor}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="stockEmpty">Ainda não existem movimentos.</p>}
        </section>
      </details>
    </section>
  )
}
