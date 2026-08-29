import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
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
import { getStickPacingStatus, type StickUsageAnalytics } from '../../application/personalStock/StickUsageAnalyticsService'
import type { PhysicalStockCheck, StickSummary, StockMovement } from '../../domain/personalStock/models'
import { useNow } from '../hooks/useNow'
import { useAppServices } from '../providers/AppServicesProvider'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function movementLabel(movement: StockMovement): string {
  if (movement.type === 'initial_stock') return 'Stock inicial'
  if (movement.type === 'consumption') return 'Stick utilizado'
  if (movement.type === 'restock') return 'Reposição'
  if (movement.correctionReason === 'physical_count') return 'Reconciliação física'
  if (movement.correctionReason === 'undo_restock') return 'Correção de reposição'
  return 'Correção'
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  }).format(new Date(value))
}

function formatTime(value?: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
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

function formatUsageDay(value: string): string {
  const date = new Date(`${value}T12:00:00Z`)
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

function durationLabel(minutes?: number | null): string {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

const STICK_PACING_INTERVAL_MINUTES = 30

function pacingCountdownLabel(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function localDecimal(value?: string | null): string {
  return value ? value.replace('.', ',') : '—'
}

function mgLabel(mean?: string | null, sd?: string | null): string {
  if (!mean) return '—'
  return sd ? `${localDecimal(mean)} ± ${localDecimal(sd)} mg` : `${localDecimal(mean)} mg`
}

function initialPackSettings(): StickPackSettings {
  return {
    packCount: 0,
    sticksPerPack: 20,
    updatedAt: new Date(0).toISOString(),
  }
}

function initialNicotineSettings(): NicotineAwarenessSettings {
  return {
    profileId: 'unselected',
    customContentMeanMg: '',
    customEmissionMeanMg: '',
    customSourceLabel: '',
    notes: '',
    updatedAt: new Date(0).toISOString(),
  }
}

export function SticksStockPage() {
  const {
    personalStockService,
    stockReconciliationService,
    nicotineAwarenessService,
    stickPackPlannerService,
    stickUsageAnalyticsService,
    stickDataProtectionService,
  } = useAppServices()

  const [summary, setSummary] = useState<StickSummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [physicalCheck, setPhysicalCheck] = useState<PhysicalStockCheck | null>(null)
  const [packSettings, setPackSettings] = useState<StickPackSettings>(initialPackSettings)
  const [packProjection, setPackProjection] = useState<StickPackProjection | null>(null)
  const [packSettingsReady, setPackSettingsReady] = useState(false)
  const [packSaveState, setPackSaveState] = useState('')
  const [nicotineSettings, setNicotineSettings] = useState<NicotineAwarenessSettings>(initialNicotineSettings)
  const [nicotineSummary, setNicotineSummary] = useState<NicotineAwarenessSummary | null>(null)
  const [nicotineSettingsReady, setNicotineSettingsReady] = useState(false)
  const [nicotineSaveState, setNicotineSaveState] = useState('')
  const [usageAnalytics, setUsageAnalytics] = useState<StickUsageAnalytics | null>(null)
  const [restockPacks, setRestockPacks] = useState('1')
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const pacingNow = useNow(1000)
  const [pacingZeroed, setPacingZeroed] = useState(false)

  const reload = useCallback(async () => {
    const [
      nextSummary,
      nextMovements,
      nextPhysicalCheck,
      nextPackProjection,
      nextNicotineSummary,
      nextUsageAnalytics,
    ] = await Promise.all([
      personalStockService.getSticksSummary(),
      personalStockService.listStickMovements(80),
      stockReconciliationService.getPhysicalCheck('stock:sticks:glo'),
      stickPackPlannerService.getProjection(),
      nicotineAwarenessService.getSummary(),
      stickUsageAnalyticsService.getAnalytics(),
    ])

    setSummary(nextSummary)
    setMovements(nextMovements)
    setPhysicalCheck(nextPhysicalCheck)
    setPackProjection(nextPackProjection)
    setNicotineSummary(nextNicotineSummary)
    setUsageAnalytics(nextUsageAnalytics)
  }, [
    nicotineAwarenessService,
    personalStockService,
    stickPackPlannerService,
    stickUsageAnalyticsService,
    stockReconciliationService,
  ])

  useEffect(() => {
    void (async () => {
      await stickDataProtectionService.recoverIfNeeded()
      return Promise.all([
        reload(),
        stickPackPlannerService.getSettings(),
        nicotineAwarenessService.getSettings(),
      ])
    })().then(([, nextPackSettings, nextNicotineSettings]) => {
      setPackSettings(nextPackSettings)
      setPackSettingsReady(true)
      setNicotineSettings(nextNicotineSettings)
      setNicotineSettingsReady(true)
    }).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o controlo de sticks.')
    })
  }, [nicotineAwarenessService, reload, stickDataProtectionService, stickPackPlannerService])

  useEffect(() => {
    setPacingZeroed(false)
  }, [usageAnalytics?.lastUseAt])

  useEffect(() => {
    if (!packSettingsReady) return
    if (
      !Number.isSafeInteger(packSettings.packCount)
      || packSettings.packCount < 0
      || !Number.isSafeInteger(packSettings.sticksPerPack)
      || packSettings.sticksPerPack <= 0
    ) {
      setPackSaveState('Corrige a configuração dos maços.')
      return
    }

    setPackSaveState('A guardar…')
    const timer = window.setTimeout(() => {
      void stickPackPlannerService.saveSettings({
        packCount: packSettings.packCount,
        sticksPerPack: packSettings.sticksPerPack,
      }).then(async (saved) => {
        setPackSettings(saved)
        await stickDataProtectionService.sync()
        setPackSaveState('Configuração guardada automaticamente.')
        setPackProjection(await stickPackPlannerService.getProjection())
      }).catch((error: unknown) => {
        setPackSaveState(error instanceof Error ? error.message : 'Não foi possível guardar a configuração.')
      })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [
    packSettings.packCount,
    packSettings.sticksPerPack,
    packSettingsReady,
    stickDataProtectionService,
    stickPackPlannerService,
  ])

  useEffect(() => {
    if (!nicotineSettingsReady) return
    if (
      nicotineSettings.profileId === 'custom-lab'
      && (
        !nicotineSettings.customContentMeanMg.trim()
        || !nicotineSettings.customEmissionMeanMg.trim()
        || !nicotineSettings.customSourceLabel.trim()
      )
    ) {
      setNicotineSaveState('Preenche os dois valores laboratoriais e a fonte.')
      return
    }

    setNicotineSaveState('A guardar…')
    const timer = window.setTimeout(() => {
      void nicotineAwarenessService.saveSettings({
        profileId: nicotineSettings.profileId,
        customContentMeanMg: nicotineSettings.customContentMeanMg,
        customEmissionMeanMg: nicotineSettings.customEmissionMeanMg,
        customSourceLabel: nicotineSettings.customSourceLabel,
        notes: nicotineSettings.notes,
      }).then(async (saved) => {
        setNicotineSettings(saved)
        await stickDataProtectionService.sync()
        setNicotineSaveState('Guardado automaticamente.')
        setNicotineSummary(await nicotineAwarenessService.getSummary())
      }).catch((error: unknown) => {
        setNicotineSaveState(error instanceof Error ? error.message : 'Não foi possível guardar os dados de nicotina.')
      })
    }, 550)
    return () => window.clearTimeout(timer)
  }, [
    nicotineAwarenessService,
    nicotineSettings.customContentMeanMg,
    nicotineSettings.customEmissionMeanMg,
    nicotineSettings.customSourceLabel,
    nicotineSettings.notes,
    nicotineSettings.profileId,
    nicotineSettingsReady,
    stickDataProtectionService,
  ])

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
      await stickDataProtectionService.sync()
      await reload()
      setMessage(success)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  const configuredTotal = useMemo(
    () => packSettings.packCount * packSettings.sticksPerPack,
    [packSettings.packCount, packSettings.sticksPerPack],
  )
  const validPackConfiguration = Number.isSafeInteger(packSettings.packCount)
    && packSettings.packCount >= 0
    && Number.isSafeInteger(packSettings.sticksPerPack)
    && packSettings.sticksPerPack > 0
    && Number.isSafeInteger(configuredTotal)
    && configuredTotal > 0

  const restockPackCount = Number(restockPacks)
  const restockSticks = Number.isSafeInteger(restockPackCount) && restockPackCount > 0
    ? restockPackCount * packSettings.sticksPerPack
    : 0
  const validPhysicalQuantity = /^\d+$/.test(physicalQuantity.trim())
    && BigInt(physicalQuantity.trim() || '0') <= BigInt(Number.MAX_SAFE_INTEGER)

  const displayedPackRemaining = packProjection?.currentStockSticks
    ? packProjection.currentPackStarted
      ? packProjection.currentPackRemaining ?? 0
      : Math.min(packSettings.sticksPerPack, packProjection.currentStockSticks)
    : 0
  const displayedPackLabel = packProjection?.currentStockSticks
    ? packProjection.currentPackStarted ? 'Maço atual' : 'Próximo maço fechado'
    : 'Sem stock disponível'

  const maxDailyUsage = Math.max(1, ...(usageAnalytics?.last7Days.map((item) => item.count) ?? [1]))

  const pacingStatus = getStickPacingStatus(
    usageAnalytics?.lastUseAt ?? null,
    pacingNow,
    STICK_PACING_INTERVAL_MINUTES,
  )
  const displayedPacingStatus = pacingZeroed
    ? {
        ...pacingStatus,
        remainingSeconds: 0,
        progressPercent: 100,
        ready: true,
        nextTargetAt: null,
      }
    : pacingStatus
  const pacingNextTime = displayedPacingStatus.nextTargetAt ? formatTime(displayedPacingStatus.nextTargetAt) : '—'
  const pacingCountdown = pacingCountdownLabel(displayedPacingStatus.remainingSeconds)

  const packTimelineRows = useMemo(() => {
    if (!packProjection) return []

    const completed = packProjection.packUsagePeriods
      .filter((period) => period.status === 'completed')
      .map((period) => ({
        packNumber: period.packNumber,
        status: 'completed' as const,
        sticks: period.consumedSticks,
        startValue: period.actualStartAt,
        startActual: Boolean(period.actualStartAt),
        startExact: Boolean(period.actualStartAt) && packProjection.packTrackingExact,
        endValue: period.actualEndAt,
        endActual: Boolean(period.actualEndAt),
        endExact: Boolean(period.actualEndAt) && packProjection.packTrackingExact,
      }))

    const remaining = packProjection.packForecasts.map((forecast) => ({
      packNumber: forecast.packNumber,
      status: forecast.kind === 'current' ? 'current' as const : 'future' as const,
      sticks: forecast.sticks,
      startValue: forecast.actualStartAt ?? forecast.estimatedStartDate,
      startActual: Boolean(forecast.actualStartAt),
      startExact: Boolean(forecast.actualStartAt) && packProjection.packTrackingExact,
      endValue: forecast.estimatedDepletionDate,
      endActual: false,
      endExact: false,
    }))

    return [...completed, ...remaining].sort((left, right) => left.packNumber - right.packNumber)
  }, [packProjection])

  function updateNicotineSetting<K extends keyof NicotineAwarenessSettings>(
    key: K,
    value: NicotineAwarenessSettings[K],
  ) {
    setNicotineSettings((current) => ({ ...current, [key]: value }))
  }

  async function confirmInitialStock() {
    await stickPackPlannerService.saveSettings({
      packCount: packSettings.packCount,
      sticksPerPack: packSettings.sticksPerPack,
    })
    await personalStockService.initializeSticks(configuredTotal, operationId())
  }

  async function addConfiguredPacks() {
    if (!summary?.initialized) throw new Error('Confirma primeiro o stock inicial.')
    if (!Number.isSafeInteger(restockPackCount) || restockPackCount <= 0) {
      throw new Error('Indica um número inteiro de maços a adicionar.')
    }
    await personalStockService.restockSticks(restockSticks, operationId())
    setRestockPacks('1')
  }

  async function registerStickWithPacing() {
    if (!displayedPacingStatus.ready && displayedPacingStatus.elapsedSeconds !== null) {
      const confirmed = window.confirm(
        `A tua meta de espaçamento ainda não terminou. Faltam ${pacingCountdown} para completares ${displayedPacingStatus.targetMinutes} min. Queres registar o stick na mesma? O registo deve continuar exato mesmo quando a meta não é cumprida.`,
      )
      if (!confirmed) return
    }

    await run(
      () => personalStockService.consumeStick(operationId()),
      displayedPacingStatus.ready
        ? '1 stick registado. O relógio de espaçamento começou agora.'
        : '1 stick registado. O relógio de espaçamento recomeçou a partir deste registo.',
    )
  }

  async function resetSticksControl() {
    if (busy) return
    const confirmed = window.confirm(
      'Limpar o controlo de sticks e começar de novo? O stock ativo, utilizações, configurações veo e previsões deixam de entrar nas contas. Uma cópia interna de segurança é arquivada antes da limpeza. Os medicamentos não são alterados.',
    )
    if (!confirmed) return

    setBusy(true)
    setMessage('')
    try {
      const reset = await stickDataProtectionService.archiveAndReset()
      const [nextPackSettings, nextNicotineSettings] = await Promise.all([
        stickPackPlannerService.getSettings(),
        nicotineAwarenessService.getSettings(),
      ])

      setPackSettingsReady(false)
      setNicotineSettingsReady(false)
      setPackSettings(nextPackSettings)
      setNicotineSettings(nextNicotineSettings)
      setPackSaveState('')
      setNicotineSaveState('')
      setRestockPacks('1')
      setPhysicalQuantity('')
      setPackSettingsReady(true)
      setNicotineSettingsReady(true)
      await reload()

      setMessage(
        reset.archiveKey
          ? `Controlo de sticks limpo. ${reset.archivedMovementCount} movimento(s) ficaram num arquivo interno de segurança e já não entram nas contas. Podes configurar um novo stock.`
          : 'Controlo de sticks limpo. Podes configurar um novo stock.',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível limpar o controlo de sticks.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="personalStockPage sticksStockPage sticksLinearPage" aria-labelledby="sticks-title">
      <header className="personalStockHeader sticksLinearHeader">
        <div>
          <span className="eyebrow">STOCK PESSOAL · VEO</span>
          <h1 id="sticks-title">Sticks glo veo</h1>
          <p>Contagem exata do stock e das utilizações. Nicotina separada entre conteúdo do stick, emissão laboratorial e dose corporal.</p>
        </div>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      {!summary?.initialized ? (
        <section className="sticksSetupCard" aria-labelledby="sticks-setup-title">
          <div>
            <span className="stockPanelTag">PASSO 1 · STOCK INICIAL</span>
            <h2 id="sticks-setup-title">Confirma o que tens fisicamente</h2>
            <p>O stock só entra no ledger depois desta confirmação. Antes disso a aplicação não mostra maços disponíveis nem cria previsões.</p>
          </div>

          <div className="sticksSetupEquation">
            <label>
              Maços
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
            <strong>{Number.isFinite(configuredTotal) ? configuredTotal : '—'} sticks</strong>
          </div>

          <button
            type="button"
            className="stockPrimaryAction sticksPrimaryWide"
            disabled={busy || !validPackConfiguration}
            onClick={() => void run(
              confirmInitialStock,
              `Stock inicial confirmado: ${configuredTotal} sticks. O valor ficou registado no ledger.`,
            )}
          >
            Confirmar stock inicial
          </button>
          <small className="sticksAutoSaveState">{packSaveState || 'A configuração dos maços é guardada automaticamente.'}</small>
        </section>
      ) : (
        <>
          <section className="sticksCoreSummary" aria-label="Resumo do stock de sticks">
            <article>
              <span>Stock exato</span>
              <strong>{summary.stock}</strong>
              <small>sticks reconstruídos pelo ledger</small>
            </article>
            <article>
              <span>Em maços</span>
              <strong>
                {packProjection?.currentPackStarted
                  ? `${packProjection.sealedPacksRemaining ?? 0} fechados + ${packProjection.currentPackRemaining ?? 0} sticks`
                  : `${packProjection?.sealedPacksRemaining ?? 0} maços fechados`}
              </strong>
              <small>{packSettings.sticksPerPack} sticks por maço</small>
            </article>
            <article>
              <span>Hoje</span>
              <strong>{summary.usedToday ?? 0}</strong>
              <small>utilizações líquidas após correções</small>
            </article>
          </section>

          <section className="sticksRegisterCard" aria-labelledby="sticks-register-title">
            <div>
              <span className="stockPanelTag">PASSO 2 · REGISTAR</span>
              <h2 id="sticks-register-title">Utilização</h2>
              <p>Cada registo retira exatamente 1 stick. Corrigir cria um novo movimento e preserva o original.</p>
              <div
                className={`sticksPacingClock${displayedPacingStatus.ready ? ' isReady' : ' isWaiting'}`}
                aria-label={
                  displayedPacingStatus.ready
                    ? `Meta de espaçamento de ${displayedPacingStatus.targetMinutes} minutos concluída`
                    : `Faltam ${pacingCountdown} para a meta de espaçamento`
                }
              >
                <div
                  className="sticksPacingDial"
                  style={{ '--pacing-progress': `${displayedPacingStatus.progressPercent * 3.6}deg` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="sticksPacingDialFace">
                    <strong>{displayedPacingStatus.ready ? '✓' : pacingCountdown}</strong>
                    <small>{displayedPacingStatus.targetMinutes} min</small>
                  </span>
                </div>
                <div className="sticksPacingCopy">
                  <span>INTERVALO CONSCIENTE</span>
                  <strong>{displayedPacingStatus.ready ? 'Meta de intervalo concluída' : 'Espera antes do próximo stick'}</strong>
                  <small>
                    {displayedPacingStatus.nextTargetAt
                      ? `Próximo marco às ${pacingNextTime}. `
                      : 'O relógio começa quando registares um stick. '}
                    Meta comportamental; não representa um intervalo seguro de utilização.
                  </small>
                  <button
                    type="button"
                    className="sticksPacingZeroButton"
                    disabled={displayedPacingStatus.ready}
                    onClick={() => {
                      setPacingZeroed(true)
                      setMessage('Temporizador zerado. O histórico de sticks não foi alterado.')
                    }}
                  >
                    Zerar temporizador
                  </button>
                </div>
              </div>
            </div>
            <div className="sticksRegisterActions">
              <button
                type="button"
                className="stockPrimaryAction sticksRegisterPrimary"
                disabled={busy || (summary.stock ?? 0) <= 0}
                aria-describedby="sticks-pacing-hint"
                onClick={() => void registerStickWithPacing()}
              >
                {displayedPacingStatus.ready ? 'Registar 1 stick' : 'Registar mesmo assim'}
              </button>
              <button
                type="button"
                className="stockSecondaryAction sticksRegisterSecondary"
                disabled={busy || !usageAnalytics?.recentEvents.length}
                onClick={() => void run(
                  () => personalStockService.undoLastStick(operationId()),
                  'Último registo corrigido. O movimento original permanece no histórico.',
                )}
              >
                Corrigir último registo
              </button>
              <button
                type="button"
                className="sticksClearAction"
                disabled={busy}
                onClick={() => void resetSticksControl()}
              >
                Limpar controlo
              </button>
              <small id="sticks-pacing-hint" className="sticksPacingHint">
                O relógio ajuda a criar distância entre registos sem bloquear o histórico real. Se utilizares antes do fim, regista na mesma para manter os dados corretos.
              </small>
            </div>
          </section>

          <section className="sticksCurrentPackCard" aria-labelledby="current-pack-title">
            <div className="sticksSectionHeading">
              <div>
                <span className="stockPanelTag">MAÇO</span>
                <h2 id="current-pack-title">{displayedPackLabel}</h2>
              </div>
              <strong>{displayedPackRemaining}/{packSettings.sticksPerPack}</strong>
            </div>
            <div className="sticksProgressTrack" aria-label="Proporção restante no maço apresentado">
              <span style={{ width: `${packProjection?.currentPackPercentRemaining ?? 0}%` }} />
            </div>
            <div className="sticksInlineFacts">
              <span>Maços fechados: <strong>{packProjection?.sealedPacksRemaining ?? 0}</strong></span>
              <span>Stock total: <strong>{summary.stock} sticks</strong></span>
            </div>
          </section>

          <section className="sticksNicotineCard" aria-labelledby="nicotine-title">
            <div className="sticksSectionHeading">
              <div>
                <span className="stockPanelTag">PASSO 3 · NICOTINA</span>
                <h2 id="nicotine-title">Quanto está associado a cada stick</h2>
              </div>
              <span className="sticksEstimateBadge">MEDIÇÃO LABORATORIAL</span>
            </div>

            <label className="sticksProductSelect">
              Variante veo
              <select
                value={nicotineSettings.profileId}
                onChange={(event) => updateNicotineSetting('profileId', event.target.value as NicotineProfileId)}
              >
                <option value="unselected">Selecionar variante — não assumir valor</option>
                {NICOTINE_REFERENCE_PROFILES.map((profile) => (
                  <option value={profile.id} key={profile.id}>{profile.label}</option>
                ))}
                <option value="custom-lab">Outro veo — valor laboratorial documentado</option>
              </select>
            </label>

            {nicotineSettings.profileId === 'custom-lab' ? (
              <div className="sticksCustomNicotineGrid">
                <label>
                  Conteúdo total médio por stick (mg)
                  <input
                    inputMode="decimal"
                    value={nicotineSettings.customContentMeanMg}
                    onChange={(event) => updateNicotineSetting('customContentMeanMg', event.target.value)}
                  />
                </label>
                <label>
                  Emissão média por stick (mg)
                  <input
                    inputMode="decimal"
                    value={nicotineSettings.customEmissionMeanMg}
                    onChange={(event) => updateNicotineSetting('customEmissionMeanMg', event.target.value)}
                  />
                </label>
                <label className="sticksCustomSource">
                  Fonte laboratorial
                  <input
                    value={nicotineSettings.customSourceLabel}
                    onChange={(event) => updateNicotineSetting('customSourceLabel', event.target.value)}
                    placeholder="Laboratório, relatório ou referência"
                  />
                </label>
              </div>
            ) : null}

            <div className="sticksNicotinePerStick">
              <article>
                <span>Conteúdo total no stick</span>
                <strong>{mgLabel(nicotineSummary?.contentPerStickMeanMg, nicotineSummary?.contentPerStickSdMg)}</strong>
                <small>média laboratorial ± desvio-padrão, quando publicado</small>
              </article>
              <article>
                <span>Emissão por stick no ensaio</span>
                <strong>{mgLabel(nicotineSummary?.emissionPerStickMeanMg, nicotineSummary?.emissionPerStickSdMg)}</strong>
                <small>valor de máquina; não é dose absorvida</small>
              </article>
              <article className="sticksNoBodyDose">
                <span>Dose absorvida pelo organismo</span>
                <strong>Não calculável com exatidão</strong>
                <small>depende do padrão real de utilização e não pode ser inferida destes números</small>
              </article>
            </div>

            {nicotineSummary?.selected ? (
              <div className="sticksNicotineTotals">
                <article>
                  <span>Hoje · {nicotineSummary.today.sticks} sticks</span>
                  <strong>{localDecimal(nicotineSummary.today.emissionLabMeanMg)} mg</strong>
                  <small>equivalente da média de emissão laboratorial</small>
                </article>
                <article>
                  <span>Últimos 7 dias · {nicotineSummary.last7Days.sticks} sticks</span>
                  <strong>{localDecimal(nicotineSummary.last7Days.emissionLabMeanMg)} mg</strong>
                  <small>equivalente da média de emissão laboratorial</small>
                </article>
                <article>
                  <span>Total registado · {nicotineSummary.allTime.sticks} sticks</span>
                  <strong>{localDecimal(nicotineSummary.allTime.emissionLabMeanMg)} mg</strong>
                  <small>equivalente da média de emissão laboratorial</small>
                </article>
              </div>
            ) : (
              <p className="sticksNoAssumption">
                Seleciona a variante estudada que corresponde ao teu produto. Até lá, a aplicação conta sticks mas não calcula nicotina.
              </p>
            )}

            <div className="sticksEvidenceBox">
              <strong>{nicotineSummary?.profileLabel}</strong>
              <p>{nicotineSummary?.evidenceNote}</p>
              <p>{nicotineSummary?.calculationStatement}</p>
              <p><strong>Absorção:</strong> {nicotineSummary?.absorptionStatement}</p>
              <div className="sticksEvidenceLinks">
                {nicotineSummary?.sourceUrl ? (
                  <a href={nicotineSummary.sourceUrl} target="_blank" rel="noreferrer">Estudo científico</a>
                ) : null}
                {nicotineSummary?.manufacturerUrl ? (
                  <a href={nicotineSummary.manufacturerUrl} target="_blank" rel="noreferrer">Informação oficial glo/BAT</a>
                ) : null}
              </div>
            </div>

            <label className="sticksNicotineNotes">
              Nota do produto
              <textarea
                maxLength={4000}
                value={nicotineSettings.notes}
                onChange={(event) => updateNicotineSetting('notes', event.target.value)}
                placeholder="Ex.: sabor, lote ou informação da embalagem"
              />
            </label>
            <small className="sticksAutoSaveState">{nicotineSaveState || 'Configuração e notas guardadas automaticamente.'}</small>
          </section>

          <section className="sticksDurationCard" aria-labelledby="duration-title">
            <div className="sticksSectionHeading">
              <div>
                <span className="stockPanelTag">PASSO 4 · DURAÇÃO</span>
                <h2 id="duration-title">Até quando o stock pode durar</h2>
              </div>
              <span className="sticksEstimateBadge">ESTIMATIVA</span>
            </div>

            {packProjection?.forecastAvailable ? (
              <div className="sticksDurationGrid">
                <article>
                  <span>{packProjection.historicalReliable ? 'Ritmo observado' : 'Ritmo observado provisório'}</span>
                  <strong>{localDecimal(packProjection.historicalDailyAverage)} sticks/dia</strong>
                  <small>
                    {packProjection.historicalCoverageDays} dia(s) de histórico
                    {packProjection.historicalReliable ? ' · previsão estabilizada' : ' · previsão ainda provisória'}
                  </small>
                </article>
                <article>
                  <span>Término previsto do maço atual</span>
                  <strong>{formatDateKey(packProjection.currentPackHistoricalDepletionDate)}</strong>
                  <small>≈ {localDecimal(packProjection.currentPackHistoricalDays)} dias restantes</small>
                </article>
                <article>
                  <span>Término previsto do stock total</span>
                  <strong>{formatDateKey(packProjection.historicalDepletionDate)}</strong>
                  <small>≈ {localDecimal(packProjection.historicalDays)} dias restantes</small>
                </article>
              </div>
            ) : (
              <p className="sticksNoAssumption">
                Ainda não existe ritmo observado para calcular uma data de término. Regista utilizações e a primeira previsão aparece no próprio primeiro dia.
              </p>
            )}

            {packTimelineRows.length ? (
              <div className="sticksPackForecastComparison" aria-label="Datas reais e previstas de cada maço">
                <div className="sticksPackForecastHeading">
                  <div>
                    <strong>Calendário por maço</strong>
                    <span>Início real = primeiro stick registado. Fim real = último stick registado.</span>
                  </div>
                  <div className="sticksPackDateLegend" aria-label="Legenda das datas">
                    <span className="isExact">REAL · EXATO</span>
                    <span className="isForecast">PREVISÃO</span>
                  </div>
                </div>

                <div className="sticksPackDateList">
                  {packTimelineRows.map((row) => {
                    const startLabel = row.startExact
                      ? 'REAL · EXATO'
                      : row.startActual
                        ? 'REAL · SEQUÊNCIA INCERTA'
                        : row.startValue
                          ? packProjection?.historicalReliable
                            ? 'PREVISTO'
                            : 'PREVISTO · PROVISÓRIO'
                          : 'SEM DATA'

                    const endLabel = row.endExact
                      ? 'REAL · EXATO'
                      : row.endActual
                        ? 'REAL · SEQUÊNCIA INCERTA'
                        : row.endValue
                          ? packProjection?.historicalReliable
                            ? 'PREVISTO'
                            : 'PREVISTO · PROVISÓRIO'
                          : 'SEM DATA'

                    return (
                      <article
                        className={`sticksPackDateCard${row.status === 'current' ? ' isCurrent' : row.status === 'completed' ? ' isCompleted' : ''}`}
                        key={row.packNumber}
                      >
                        <header>
                          <div>
                            <strong>Maço {row.packNumber}</strong>
                            <small>
                              {row.status === 'completed'
                                ? 'CONCLUÍDO'
                                : row.status === 'current'
                                  ? 'ATUAL'
                                  : 'FUTURO'}
                            </small>
                          </div>
                          <span>{row.sticks} sticks</span>
                        </header>

                        <div className="sticksPackDatePair">
                          <div>
                            <span>Começa</span>
                            <strong>
                              {row.startActual
                                ? formatDateTime(row.startValue)
                                : row.startValue
                                  ? formatDateKey(row.startValue)
                                  : '—'}
                            </strong>
                            <small className={row.startExact ? 'isExact' : row.startValue ? 'isForecast' : ''}>
                              {startLabel}
                            </small>
                          </div>

                          <div>
                            <span>Acaba</span>
                            <strong>
                              {row.endActual
                                ? formatDateTime(row.endValue)
                                : row.endValue
                                  ? formatDateKey(row.endValue)
                                  : '—'}
                            </strong>
                            <small className={row.endExact ? 'isExact' : row.endValue ? 'isForecast' : ''}>
                              {endLabel}
                            </small>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <small className="sticksPackForecastNote">
                  Para um maço já iniciado, a aplicação mantém a data/hora real do primeiro stick. Quando o último stick desse maço for registado, guarda a data/hora real do fim e deixa de mostrar a previsão. Para maços futuros, início e fim são necessariamente previsões e são recalculados com o histórico real de utilização.
                </small>
                {packProjection && !packProjection.packTrackingExact && packProjection.packTrackingIssue ? (
                  <p className="sticksPackTrackingWarning">
                    <strong>Sequência física dos maços não pode ser marcada como exata:</strong> {packProjection.packTrackingIssue} O stock total continua exato pelo ledger.
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="sticksEstimateRule">
              <strong>Exatidão:</strong> datas que já aconteceram são guardadas com data e hora reais. Datas que ainda não aconteceram não podem ser exatas; ficam identificadas como previsão até o primeiro ou último stick confirmar o valor real.
            </p>
          </section>

          <section className="sticksPatternCard" aria-labelledby="pattern-title">
            <div>
              <span className="stockPanelTag">HISTÓRICO ÚTIL</span>
              <h2 id="pattern-title">Padrão registado</h2>
              <p>Horários e intervalos vêm diretamente dos movimentos guardados.</p>
            </div>

            <div className="sticksPatternMetrics">
              <article>
                <span>Último registo</span>
                <strong>{formatTime(usageAnalytics?.lastUseAt)}</strong>
                <small>{usageAnalytics?.lastUseAt ? `há ${durationLabel(usageAnalytics.minutesSinceLastUse)}` : 'sem registos'}</small>
              </article>
              <article>
                <span>Intervalo médio hoje</span>
                <strong>{durationLabel(usageAnalytics?.averageIntervalMinutesToday)}</strong>
                <small>{usageAnalytics?.todayCount ?? 0} utilização(ões)</small>
              </article>
              <article>
                <span>Últimos 7 dias</span>
                <strong>{usageAnalytics?.last7Total ?? 0}</strong>
                <small>anterior: {usageAnalytics?.previous7Total ?? 0}</small>
              </article>
            </div>

            <div className="sticksWeekBars">
              {usageAnalytics?.last7Days.map((item) => (
                <div className="sticksWeekBarRow" key={item.date}>
                  <span>{formatUsageDay(item.date)}</span>
                  <div><i style={{ width: `${Math.round((item.count / maxDailyUsage) * 100)}%` }} /></div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>

            <details className="sticksSimpleDetails">
              <summary>Ver horários recentes</summary>
              <div className="sticksRecentList">
                {usageAnalytics?.recentEvents.length ? usageAnalytics.recentEvents.map((event) => (
                  <article key={event.id}>
                    <strong>{formatTime(event.effectiveAt)}</strong>
                    <span>{formatDateTime(event.effectiveAt)}</span>
                    <small>{event.count} stick{event.count === 1 ? '' : 's'}</small>
                  </article>
                )) : <p className="stockEmpty">Ainda não existem utilizações registadas.</p>}
              </div>
            </details>
          </section>

          <details className="sticksSimpleDetails sticksAdjustments">
            <summary>Stock e correções</summary>
            <div className="sticksAdjustmentsBody">
              <section>
                <h3>Adicionar maços</h3>
                <div className="sticksInlineForm">
                  <label>
                    Quantidade de maços
                    <input
                      inputMode="numeric"
                      value={restockPacks}
                      onChange={(event) => setRestockPacks(event.target.value)}
                    />
                  </label>
                  <span>= {restockSticks || 0} sticks</span>
                  <button
                    type="button"
                    disabled={busy || restockSticks <= 0}
                    onClick={() => void run(addConfiguredPacks, `${restockPackCount} maço(s) adicionados ao stock.`)}
                  >
                    Adicionar ao stock
                  </button>
                </div>
              </section>

              <section>
                <h3>Contagem física</h3>
                <p>Usa apenas quando contares fisicamente o stock e encontrares uma diferença.</p>
                <div className="sticksInlineForm">
                  <label>
                    Sticks contados
                    <input
                      inputMode="numeric"
                      value={physicalQuantity}
                      onChange={(event) => setPhysicalQuantity(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !validPhysicalQuantity}
                    onClick={() => void run(
                      async () => {
                        await stockReconciliationService.reconcileSticksPhysicalCount(physicalQuantity, operationId())
                        setPhysicalQuantity('')
                      },
                      'Contagem física reconciliada sem apagar movimentos anteriores.',
                    )}
                  >
                    Reconciliar
                  </button>
                </div>
                {physicalCheck ? (
                  <small>Última contagem: {physicalCheck.counted} sticks em {formatDateTime(physicalCheck.checkedAt)}.</small>
                ) : null}
              </section>

              <section>
                <h3>Configuração do maço</h3>
                <div className="sticksInlineForm">
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
                </div>
                <small>{packSaveState || 'Guardado automaticamente.'}</small>
              </section>

            </div>
          </details>

          <details className="sticksSimpleDetails">
            <summary>Histórico auditável · {summary.movementCount} movimentos</summary>
            <div className="stockLedgerList">
              {movements.map((movement) => (
                <article className="stockLedgerRow" key={movement.id}>
                  <div>
                    <strong>{movementLabel(movement)}</strong>
                    <small>{formatDateTime(movement.effectiveAt)}</small>
                  </div>
                  <div className="stockLedgerMath">
                    <span>{movement.balanceBeforeMinor}</span>
                    <b>{BigInt(movement.quantityMinor) > 0n ? '+' : ''}{movement.quantityMinor}</b>
                    <span>= {movement.balanceAfterMinor}</span>
                  </div>
                </article>
              ))}
            </div>
          </details>

          <p className="sticksPersistenceNote">
            <strong>Proteção automática:</strong> stock, utilizações, correções, configuração do maço, variante veo e notas ficam em IndexedDB e numa cópia redundante local atualizada após alterações.
            O histórico normal não é apagado por uma correção. Para perda do dispositivo ou limpeza total do navegador, mantém também uma cópia externa em “Mais”.
          </p>
        </>
      )}
    </section>
  )
}
