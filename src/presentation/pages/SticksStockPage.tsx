import { useCallback, useEffect, useState } from 'react'
import {
  NICOTINE_REFERENCE_PROFILES,
  type NicotineAwarenessSettings,
  type NicotineAwarenessSummary,
  type NicotineProfileId,
} from '../../application/personalStock/NicotineAwarenessService'
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

export function SticksStockPage() {
  const { personalStockService, stockReconciliationService, nicotineAwarenessService } = useAppServices()
  const [summary, setSummary] = useState<StickSummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [physicalCheck, setPhysicalCheck] = useState<PhysicalStockCheck | null>(null)
  const [nicotineSummary, setNicotineSummary] = useState<NicotineAwarenessSummary | null>(null)
  const [nicotineSettings, setNicotineSettings] = useState<NicotineAwarenessSettings | null>(null)
  const [nicotineSettingsReady, setNicotineSettingsReady] = useState(false)
  const [nicotineSaveState, setNicotineSaveState] = useState('')
  const [quantity, setQuantity] = useState('20')
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const reload = useCallback(async () => {
    const [nextSummary, nextMovements, nextPhysicalCheck, nextNicotineSummary] = await Promise.all([
      personalStockService.getSticksSummary(),
      personalStockService.listStickMovements(30),
      stockReconciliationService.getPhysicalCheck('stock:sticks:glo'),
      nicotineAwarenessService.getSummary(),
    ])
    setSummary(nextSummary)
    setMovements(nextMovements)
    setPhysicalCheck(nextPhysicalCheck)
    setNicotineSummary(nextNicotineSummary)
  }, [nicotineAwarenessService, personalStockService, stockReconciliationService])

  useEffect(() => {
    void reload().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar o stock.'))
    void nicotineAwarenessService.getSettings()
      .then((settings) => {
        setNicotineSettings(settings)
        setNicotineSettingsReady(true)
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar a configuração de nicotina.'))
  }, [nicotineAwarenessService, reload])

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
        setNicotineSaveState('Guardado automaticamente no dispositivo e incluído no backup.')
        setNicotineSummary(await nicotineAwarenessService.getSummary())
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
          ? 'Meta pessoal atingida'
          : `Abaixo da meta pessoal por ${reductionPlan.remainingToTarget}`
    : 'A carregar…'
  const trendValue = reductionPlan ? Number(reductionPlan.trendDelta) : 0
  const trendText = reductionPlan
    ? `${trendValue > 0 ? '+' : ''}${localDecimal(reductionPlan.trendDelta)} sticks/dia`
    : '—'

  return (
    <section className="personalStockPage sticksStockPage" aria-labelledby="sticks-title">
      <header className="personalStockHeader">
        <span className="eyebrow">STOCK PESSOAL · EXATO</span>
        <h1 id="sticks-title">Sticks glo</h1>
        <p>Um stick é sempre uma unidade inteira. O saldo é reconstruído através do histórico de movimentos.</p>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      <div className="stockMetricGrid">
        <article className="stockMetric stockMetricPrimary">
          <span>Stock atual</span>
          <strong>{summary?.initialized ? summary.stock : '—'}</strong>
          <small>{summary?.initialized ? 'sticks' : 'Define o stock inicial'}</small>
        </article>
        <article className="stockMetric">
          <span>Utilizados hoje</span>
          <strong>{summary?.initialized ? summary.usedToday : '—'}</strong>
          <small>EXATO</small>
        </article>
        <article className="stockMetric">
          <span>Reconciliação</span>
          <strong>{summary?.ok ? 'OK' : 'INCONSISTÊNCIA'}</strong>
          <small>{summary?.movementCount ?? 0} movimentos</small>
        </article>
        <article className="stockMetric">
          <span>Última contagem física</span>
          <strong>{physicalCheck ? physicalCheck.counted : '—'}</strong>
          <small>{formatPhysicalCheckTime(physicalCheck?.checkedAt)}</small>
        </article>
      </div>

      <section className="stockPanel nicotineAwarenessPanel" aria-labelledby="nicotine-awareness-title">
        <div className="nicotineAwarenessHeading">
          <div>
            <span className="stockPanelTag">CONSCIÊNCIA DE NICOTINA</span>
            <h2 id="nicotine-awareness-title">Nicotina estimada associada às utilizações</h2>
          </div>
          <span className="nicotineAwarenessBadge">ESTIMATIVA</span>
        </div>
        <p>
          A contagem de sticks é exata porque vem do ledger. A nicotina é apresentada como estimativa de emissão no aerossol,
          multiplicando apenas utilizações válidas pelo valor laboratorial por stick do perfil selecionado.
        </p>

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

        {nicotineSettings && reductionPlan ? (
          <section className="nicotineReductionPlan" aria-labelledby="nicotine-reduction-title">
            <div className="nicotineReductionHeading">
              <div>
                <span className="stockPanelTag">PLANO PESSOAL DE REDUÇÃO</span>
                <h3 id="nicotine-reduction-title">Linha de base: 13 sticks/dia</h3>
              </div>
              <span className="nicotineReductionBadge">META PESSOAL</span>
            </div>

            <div className="nicotineReductionGrid">
              <article>
                <span>Hoje</span>
                <strong>{reductionPlan.consumedToday} / {reductionPlan.targetToday}</strong>
                <small>registados / meta pessoal</small>
              </article>
              <article>
                <span>Situação</span>
                <strong>{reductionStatus}</strong>
                <small>não é um limite seguro</small>
              </article>
              <article>
                <span>Média dos últimos 7 dias</span>
                <strong>{localDecimal(reductionPlan.last7DaysAverage)}</strong>
                <small>sticks/dia</small>
              </article>
              <article>
                <span>Tendência vs. 7 dias anteriores</span>
                <strong className={trendValue > 0 ? 'nicotineTrendUp' : trendValue < 0 ? 'nicotineTrendDown' : ''}>{trendText}</strong>
                <small>{reductionPlan.daysOverTargetLast7} dias acima da meta nos últimos 7</small>
              </article>
            </div>

            <div className="nicotinePlanSettings">
              <label className="nicotinePlanToggle">
                <input
                  type="checkbox"
                  checked={nicotineSettings.reductionPlanEnabled}
                  onChange={(event) => updateNicotineSetting('reductionPlanEnabled', event.target.checked)}
                />
                Plano automático ativo
              </label>
              <label>
                Linha de base diária
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
                Redução por semana
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
                Início do plano
                <input
                  type="date"
                  value={nicotineSettings.reductionPlanStartDate}
                  onChange={(event) => updateNicotineSetting('reductionPlanStartDate', event.target.value)}
                />
              </label>
            </div>

            <div className="nicotinePlanProjection">
              <strong>Semana {reductionPlan.weekNumber}: meta pessoal {reductionPlan.targetToday}/dia</strong>
              <span>Próxima semana: {reductionPlan.nextWeekTarget}/dia · trajetória matemática até 0 em {reductionPlan.zeroTargetDate}.</span>
            </div>
            <p className="nicotinePlanSafety">
              Esta meta serve apenas para acompanhar uma redução pessoal. Não significa que seja seguro consumir até esse número e a aplicação não usa a meta para incentivar novas utilizações.
            </p>
          </section>
        ) : null}

        {nicotineSettings ? (
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
        ) : null}

        {nicotineSettings ? (
          <label className="nicotineNotesLabel">
            Notas sobre o produto / referência utilizada
            <textarea
              maxLength={4000}
              placeholder="Ex.: Neo variante X; confirmar valor da embalagem ou laboratório."
              value={nicotineSettings.notes}
              onChange={(event) => updateNicotineSetting('notes', event.target.value)}
            />
          </label>
        ) : null}

        <div className="nicotineSaveRow">
          <span className="nicotineSaveState" role="status">{nicotineSaveState || 'As alterações ficam guardadas automaticamente.'}</span>
        </div>

        <p className="nicotineWarning">
          <strong>Importante:</strong> mg por stick medidos numa máquina não são a mesma coisa que a dose absorvida pelo organismo.
          A absorção depende do dispositivo, modo, produto e padrão de utilização; por isso a aplicação não apresenta este valor como dose corporal exata.
        </p>
        <p className="nicotineWhoNote">
          A OMS refere que todas as formas de tabaco são nocivas, que não existe nível seguro de exposição ao tabaco e que a nicotina é altamente aditiva.{' '}
          <a href="https://www.who.int/en/news-room/fact-sheets/detail/tobacco" target="_blank" rel="noreferrer">Consultar OMS</a>.
        </p>
      </section>

      {!summary?.initialized ? (
        <section className="stockPanel">
          <h2>Definir stock inicial</h2>
          <p>Este valor cria o primeiro movimento do ledger. Depois disso, as alterações são feitas apenas por novos movimentos.</p>
          <div className="stockInlineForm">
            <label>
              Quantidade
              <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <button
              type="button"
              disabled={busy || !canSubmitQuantity}
              onClick={() => void run(
                () => personalStockService.initializeSticks(parsedQuantity, operationId()),
                'Stock inicial guardado e reconciliado.',
              )}
            >
              Criar stock
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="stockPanel stockActionPanel">
            <div>
              <span className="stockPanelTag">REGISTAR UTILIZAÇÃO</span>
              <h2>Movimento real</h2>
              <p>O botão só confirma depois de a transação IndexedDB terminar.</p>
            </div>
            <button
              type="button"
              className="stockPrimaryAction"
              disabled={busy || (summary.stock ?? 0) <= 0}
              onClick={() => void run(
                () => personalStockService.consumeStick(operationId()),
                '1 stick utilizado. Stock, meta pessoal e estimativa de nicotina atualizados.',
              )}
            >
              + 1 stick utilizado
            </button>
            <button
              type="button"
              className="stockSecondaryAction"
              disabled={busy}
              onClick={() => void run(
                () => personalStockService.undoLastStick(operationId()),
                'Última utilização anulada através de um movimento de correção.',
              )}
            >
              Desfazer último registo
            </button>
          </section>

          <div className="stockTwoPanels">
            <section className="stockPanel">
              <h2>Adicionar stock</h2>
              <div className="stockInlineForm stockInlineFormStack">
                <label>
                  Sticks a adicionar
                  <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                </label>
                <button
                  type="button"
                  disabled={busy || !canSubmitQuantity}
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
                  disabled={busy}
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
              <p>Conta os sticks que tens fisicamente. Se existir diferença, a aplicação cria uma correção no ledger; nunca altera o saldo silenciosamente.</p>
              <div className="stockInlineForm stockInlineFormStack stockPhysicalInline">
                <label>
                  Quantidade contada
                  <input
                    inputMode="numeric"
                    placeholder="ex.: 18"
                    value={physicalQuantity}
                    onChange={(event) => setPhysicalQuantity(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="stockPrimaryAction"
                  disabled={busy || !canSubmitPhysical}
                  onClick={() => void run(
                    async () => {
                      await stockReconciliationService.reconcileSticksPhysicalCount(physicalQuantity, operationId())
                      setPhysicalQuantity('')
                    },
                    'Contagem física guardada. O saldo ficou reconciliado com a quantidade contada.',
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
        </>
      )}

      <section className="stockPanel">
        <div className="stockPanelHeading">
          <div>
            <span className="stockPanelTag">AUDITORIA</span>
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

      <section className="stockProjectionPanel">
        <span>PROJEÇÃO</span>
        <strong>Não existem dados suficientes para calcular este resultado com precisão.</strong>
        <p>Uma média histórica só será apresentada quando existir uma regra de projeção explícita e identificada.</p>
      </section>
    </section>
  )
}
