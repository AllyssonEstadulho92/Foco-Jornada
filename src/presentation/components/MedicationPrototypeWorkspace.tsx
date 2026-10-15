import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  MedicationDashboardSummary,
  MedicationLifecycleStatus,
  MedicationProtectedProfile,
  MedicationProtectionSummary,
  MedicationTimelineItem,
} from '../../application/personalStock/MedicationDataProtectionService'
import { minorToDecimal } from '../../application/personalStock/decimal'
import { addCalendarDays } from '../../application/personalStock/time'
import type { MedicationDoseEvent, MedicationSchedule, MedicationSummary } from '../../domain/personalStock/models'
import '../../styles/medication-history-compact.css'
import { AppIcon, type AppIconName } from './ui/AppIcon'
import { MedicationScheduleActionDialog, type MedicationScheduleActionMode } from './MedicationDoseSwipeActions'
import { useAppServices } from '../providers/AppServicesProvider'

type WorkspaceTab = 'history' | 'evolution' | 'information'
type StatusFilter = 'all' | MedicationLifecycleStatus
type HistoryView = 'summary' | 'technical'
type HistoryFilter = 'all' | 'dose' | 'schedule' | 'stock' | 'other'
type HistoryAction =
  | { kind: 'schedule'; mode: MedicationScheduleActionMode; schedule: MedicationSchedule }
  | { kind: 'dose'; mode: 'edit' | 'cancel'; event: MedicationDoseEvent }

interface MedicationPrototypeWorkspaceProps {
  medications: MedicationSummary[]
  selectedId: string | null
  today: string
  onSelect: (medicationId: string) => void
  onDataChanged: () => Promise<void>
}

const HISTORY_STEP = 8
const EMPTY_DASHBOARD: MedicationDashboardSummary = {
  medicationCount: 0,
  scheduledDoseCount: 0,
  takenDoseCount: 0,
  pendingDoseCount: 0,
  notTakenDoseCount: 0,
}

function statusLabel(status: MedicationLifecycleStatus): string {
  if (status === 'active') return 'EM USO'
  if (status === 'paused') return 'PAUSADO'
  return 'FINALIZADO'
}

function statusClass(status: MedicationLifecycleStatus): string {
  if (status === 'active') return 'medProtoStatusActive'
  if (status === 'paused') return 'medProtoStatusPaused'
  return 'medProtoStatusFinished'
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function historyDay(value: string): string {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return 'Data por confirmar'
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(timestamp)
}

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function formatDate(value?: string): string {
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

function timelineIcon(kind: MedicationTimelineItem['kind']): AppIconName {
  if (kind === 'dose') return 'check'
  if (kind === 'schedule') return 'clock'
  if (kind === 'stock') return 'list'
  if (kind === 'note') return 'note'
  if (kind === 'profile') return 'user'
  if (kind === 'protection') return 'shield'
  return 'plus'
}

function timelineItemIcon(item: MedicationTimelineItem): AppIconName {
  return item.title === 'Horário eliminado' ? 'trash' : timelineIcon(item.kind)
}

export function MedicationPrototypeWorkspace({
  medications,
  selectedId,
  today,
  onSelect,
  onDataChanged,
}: MedicationPrototypeWorkspaceProps) {
  const {
    personalStockService,
    medicationDataProtectionService,
    medicationDoseStatusService,
  } = useAppServices()
  const [profiles, setProfiles] = useState<Record<string, MedicationProtectedProfile>>({})
  const [dashboard, setDashboard] = useState<MedicationDashboardSummary>(EMPTY_DASHBOARD)
  const [protection, setProtection] = useState<MedicationProtectionSummary | null>(null)
  const [timeline, setTimeline] = useState<MedicationTimelineItem[]>([])
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [scheduleHistory, setScheduleHistory] = useState<MedicationSchedule[]>([])
  const [doseEvents, setDoseEvents] = useState<MedicationDoseEvent[]>([])
  const [profileForm, setProfileForm] = useState({
    status: 'active' as MedicationLifecycleStatus,
    prescribedBy: '',
    observation: '',
  })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [tab, setTab] = useState<WorkspaceTab>('history')
  const [historyView, setHistoryView] = useState<HistoryView>('summary')
  const [historyVisible, setHistoryVisible] = useState(HISTORY_STEP)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [historyAction, setHistoryAction] = useState<HistoryAction | null>(null)
  const [historyDoseStatus, setHistoryDoseStatus] = useState<'not_taken' | 'postponed'>('not_taken')
  const [historyDoseTime, setHistoryDoseTime] = useState('')
  const historyCancelRef = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const selected = medications.find((item) => item.medication.id === selectedId) ?? null

  const loadWorkspace = useCallback(async () => {
    const [nextDashboard, profileEntries] = await Promise.all([
      medicationDataProtectionService.getTodayDashboard(today),
      Promise.all(medications.map(async (item) => [
        item.medication.id,
        await medicationDataProtectionService.getProfile(item.medication.id),
      ] as const)),
    ])
    const profileMap = Object.fromEntries(profileEntries) as Record<string, MedicationProtectedProfile>
    setDashboard(nextDashboard)
    setProfiles(profileMap)

    if (!selectedId || !medications.some((item) => item.medication.id === selectedId)) {
      setProtection(null)
      setTimeline([])
      setSchedules([])
      setScheduleHistory([])
      setDoseEvents([])
      return
    }

    const [nextProtection, nextTimeline, nextSchedules, nextScheduleHistory, nextDoseEvents, profile] = await Promise.all([
      medicationDataProtectionService.verifyMedication(selectedId),
      medicationDataProtectionService.getMedicationTimeline(selectedId),
      personalStockService.schedulesForDate(selectedId, today),
      personalStockService.listMedicationScheduleHistory(selectedId),
      personalStockService.listDoseEvents(selectedId),
      medicationDataProtectionService.getProfile(selectedId),
    ])
    setProtection(nextProtection)
    setTimeline(nextTimeline)
    setSchedules(nextSchedules)
    setScheduleHistory(nextScheduleHistory)
    setDoseEvents(nextDoseEvents)
    setProfileForm({
      status: profile.status,
      prescribedBy: profile.prescribedBy,
      observation: profile.observation,
    })
  }, [medicationDataProtectionService, medications, personalStockService, selectedId, today])

  useEffect(() => {
    void loadWorkspace().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o centro de medicação.')
    })
  }, [loadWorkspace])

  useEffect(() => {
    setHistoryView('summary')
    setHistoryVisible(HISTORY_STEP)
    setHistoryFilter('all')
    setHistoryAction(null)
  }, [selectedId])

  useEffect(() => {
    if (historyAction?.kind !== 'dose') return
    historyCancelRef.current?.focus()
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setHistoryAction(null)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [busy, historyAction])

  const filteredMedications = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-PT')
    return medications.filter((item) => {
      const profile = profiles[item.medication.id]
      const status = profile?.status ?? 'active'
      if (filter !== 'all' && status !== filter) return false
      if (!normalizedSearch) return true
      return [
        item.medication.name,
        item.medication.dosage ?? '',
        profile?.prescribedBy ?? '',
        profile?.observation ?? '',
      ].some((value) => value.toLocaleLowerCase('pt-PT').includes(normalizedSearch))
    })
  }, [filter, medications, profiles, search])

  const selectedProfile = selectedId ? profiles[selectedId] : undefined
  const frequencyLabel = schedules.length ? `${schedules.length}× por dia` : 'Sem horário ativo'
  const scheduleLabel = schedules.length ? schedules.map((item) => item.localTime).join(' · ') : '—'
  const doseLabel = schedules[0] && selected
    ? `${minorToDecimal(schedules[0].quantityMinor)} ${selected.medication.unit}`
    : '—'

  const combinedTimeline = useMemo(() => {
    const firstScheduleIdByOrder = new Map<number, string>()
    for (const schedule of scheduleHistory) {
      if (!firstScheduleIdByOrder.has(schedule.order)) firstScheduleIdByOrder.set(schedule.order, schedule.id)
    }

    const scheduleById = new Map(scheduleHistory.map((schedule) => [schedule.id, schedule]))
    const functionalItems = timeline.map((item) => {
      if (item.kind !== 'schedule' || !item.id.startsWith('schedule:')) return item
      const schedule = scheduleById.get(item.id.slice('schedule:'.length))
      if (!schedule || firstScheduleIdByOrder.get(schedule.order) === schedule.id) return item
      return {
        ...item,
        title: 'Horário alterado',
        description: `${schedule.localTime} · ${minorToDecimal(schedule.quantityMinor)} ${selected?.medication.unit ?? ''} · válido desde ${schedule.effectiveFrom}.`,
      }
    })

    const deletionKeys = new Set<string>()
    const deletionItems: MedicationTimelineItem[] = []
    for (const schedule of scheduleHistory) {
      if (!schedule.deletedAt) continue
      const key = `${schedule.order}:${schedule.deletedAt}`
      if (deletionKeys.has(key)) continue
      deletionKeys.add(key)
      deletionItems.push({
        id: `schedule-deleted:${key}`,
        medicationId: schedule.medicationId,
        kind: 'schedule',
        title: 'Horário eliminado',
        description: `${schedule.localTime} · ${minorToDecimal(schedule.quantityMinor)} ${selected?.medication.unit ?? ''} · removido da lista de tomas; registos anteriores preservados.`,
        createdAt: schedule.deletedAt,
      })
    }

    return [...functionalItems, ...deletionItems]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))
  }, [scheduleHistory, selected?.medication.unit, timeline])

  const activeHistoryDoseIds = useMemo(() => {
    const correctedIds = new Set(doseEvents.filter((event) => event.status === 'corrected' && event.correctionOf).map((event) => event.correctionOf))
    const activeByOccurrence = new Map<string, MedicationDoseEvent>()
    for (const event of doseEvents) {
      if (event.status === 'corrected' || correctedIds.has(event.id)) continue
      const current = activeByOccurrence.get(event.occurrenceKey)
      if (!current || event.createdAt > current.createdAt) activeByOccurrence.set(event.occurrenceKey, event)
    }
    return new Set([...activeByOccurrence.values()].map((event) => event.id))
  }, [doseEvents])

  const summaryTimeline = useMemo(
    () => combinedTimeline.filter((item) => {
      if (item.kind === 'protection') return false
      if (item.kind === 'dose' && item.id.startsWith('dose:')) {
        return activeHistoryDoseIds.has(item.id.slice('dose:'.length))
      }
      return true
    }),
    [activeHistoryDoseIds, combinedTimeline],
  )
  const technicalTimeline = combinedTimeline
  const timelineForView = historyView === 'summary' ? summaryTimeline : technicalTimeline
  const activeTimeline = timelineForView.filter((item) => {
    if (historyFilter === 'all') return true
    if (historyFilter === 'other') return item.kind === 'profile' || item.kind === 'note' || item.kind === 'created' || item.kind === 'protection'
    return item.kind === historyFilter
  })
  const visibleTimeline = activeTimeline.slice(0, historyVisible)

  const lastSevenDays = useMemo(() => {
    const now = new Date()
    const start = now.getTime() - 7 * 86_400_000
    const events = doseEvents.filter((event) => new Date(event.createdAt).getTime() >= start)
    return {
      taken: events.filter((event) => event.status === 'taken').length,
      notTaken: events.filter((event) => event.status === 'not_taken').length,
      postponed: events.filter((event) => event.status === 'postponed').length,
      corrected: events.filter((event) => event.status === 'corrected').length,
    }
  }, [doseEvents])

  async function execute(action: () => Promise<void>, success: string) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
      await onDataChanged()
      await loadWorkspace()
      let protectionWarning = ''
      try {
        if (selectedId) await medicationDataProtectionService.recordCheckpoint(selectedId, 'alteração de registo de medicação')
        const snapshot = await medicationDataProtectionService.syncRedundantSnapshot()
        if (!snapshot.available) protectionWarning = ' A cópia redundante não está disponível neste navegador.'
      } catch {
        protectionWarning = ' Não foi possível atualizar a proteção adicional; verifica as cópias de segurança.'
      }
      setMessage(success + protectionWarning)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  async function saveProtectedInformation() {
    if (!selectedId) return
    await medicationDataProtectionService.saveProfile(selectedId, profileForm)
    await medicationDataProtectionService.recordCheckpoint(selectedId, 'informação protegida atualizada')
  }


  function beginHistoryDoseAction(mode: 'edit' | 'cancel', event: MedicationDoseEvent) {
    setHistoryDoseStatus(event.status === 'postponed' ? 'postponed' : 'not_taken')
    setHistoryDoseTime(event.postponedTo
      ? new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(event.postponedTo))
      : '')
    setHistoryAction({ kind: 'dose', mode, event })
  }

  async function confirmHistoryDoseAction() {
    if (!historyAction || historyAction.kind !== 'dose') return
    const { event, mode } = historyAction
    if (mode === 'edit') {
      await medicationDoseStatusService.replaceMedicationDoseStatus({
        eventId: event.id,
        operationId: operationId(),
        status: historyDoseStatus,
        postponedToLocalTime: historyDoseStatus === 'postponed' ? historyDoseTime : undefined,
      })
    } else if (event.status === 'taken') {
      await personalStockService.undoMedicationDose(event.id, operationId())
    } else {
      await medicationDoseStatusService.correctMedicationDoseStatus(event.id, operationId())
    }
    setHistoryAction(null)
  }

  async function confirmHistoryScheduleEdit(localTime: string, quantity: string) {
    if (!selectedId || !historyAction || historyAction.kind !== 'schedule') return
    await personalStockService.defineMedicationScheduleFromDate({
      medicationId: selectedId,
      scheduleId: historyAction.schedule.id,
      localTime,
      quantity,
      effectiveFrom: addCalendarDays(today, 1),
    })
    setHistoryAction(null)
  }

  async function confirmHistoryScheduleDelete() {
    if (!selectedId || !historyAction || historyAction.kind !== 'schedule') return
    await personalStockService.endMedicationScheduleOnDate({
      medicationId: selectedId,
      scheduleId: historyAction.schedule.id,
      effectiveUntil: today,
    })
    setHistoryAction(null)
  }

  function selectHistoryView(view: HistoryView) {
    setHistoryView(view)
    setHistoryVisible(HISTORY_STEP)
  }

  function selectHistoryFilter(value: HistoryFilter) {
    setHistoryFilter(value)
    setHistoryVisible(HISTORY_STEP)
  }

  function toggleHistorySize() {
    if (historyVisible >= activeTimeline.length) {
      setHistoryVisible(HISTORY_STEP)
      return
    }
    setHistoryVisible((current) => Math.min(current + HISTORY_STEP, activeTimeline.length))
  }

  return (
    <section className="medProtoWorkspace" aria-label="Resumo e detalhes dos medicamentos">
      <div className="medProtoIntro">
        <div>
          <span className="medProtoKicker">REGISTOS GUARDADOS</span>
          <h2>Os meus medicamentos</h2>
          <p>Pesquisa, escolhe um medicamento e consulta os respetivos dados e histórico.</p>
        </div>
      </div>
      <div className="medProtoSummary">
        <article><strong>{dashboard.medicationCount}</strong><span>Medicamentos em uso</span></article>
        <article>
          <strong>{dashboard.takenDoseCount}/{dashboard.scheduledDoseCount}</strong>
          <span>Tomas registadas hoje</span>
        </article>
        <article className={dashboard.pendingDoseCount ? 'isPending' : ''}>
          <strong>{dashboard.pendingDoseCount}</strong><span>Pendentes hoje</span>
        </article>
      </div>

      <div className="medProtoListTools">
        <label className="medProtoSearch">
          <span aria-hidden="true"><AppIcon name="search" /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Pesquisar medicamentos"
            placeholder="Pesquisar pelo nome, dosagem ou nota"
          />
        </label>
        <label className="medProtoFilterSelect">
          Estado
          <select value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)}>
            <option value="all">Todos</option>
            <option value="active">Em uso</option>
            <option value="paused">Pausados</option>
            <option value="finished">Finalizados</option>
          </select>
        </label>
      </div>

      <div className="medProtoBody">
        <div className="medProtoMedicationList" aria-label="Lista de medicamentos">
          {filteredMedications.length ? filteredMedications.map((item) => {
            const profile = profiles[item.medication.id] ?? {
              status: 'active',
              prescribedBy: '',
              observation: '',
            }
            const isSelected = item.medication.id === selectedId
            return (
              <button
                type="button"
                key={item.medication.id}
                className={`medProtoMedicationCard${isSelected ? ' selected' : ''}`}
                onClick={() => onSelect(item.medication.id)}
                aria-pressed={isSelected}
              >
                <span className="medProtoPill" aria-hidden="true">●</span>
                <span className="medProtoMedicationText">
                  <strong>{item.medication.name} {item.medication.dosage}</strong>
                  <small>{item.stock} {item.medication.unit} em stock</small>
                </span>
                <span className={statusClass(profile.status)}>{statusLabel(profile.status)}</span>
                <span className="medProtoChevron" aria-hidden="true"><AppIcon name="chevron-right" /></span>
              </button>
            )
          }) : (
            <div className="medProtoEmpty">Nenhum medicamento corresponde à pesquisa e ao filtro escolhidos.</div>
          )}
        </div>

        {selected ? (
          <article className="medProtoDetail">
            <div className="medProtoDetailTitle">
              <div className="medProtoPillLarge" aria-hidden="true">●</div>
              <div>
                <h3>{selected.medication.name} {selected.medication.dosage}</h3>
                <span className={statusClass(selectedProfile?.status ?? 'active')}>
                  {statusLabel(selectedProfile?.status ?? 'active')}
                </span>
              </div>
              <strong className="medProtoStock">{selected.stock} <small>{selected.medication.unit}</small></strong>
            </div>

            <div className="medProtoInformationGrid">
              <div><span>Dose programada</span><strong>{doseLabel}</strong></div>
              <div><span>Frequência ativa</span><strong>{frequencyLabel}</strong></div>
              <div><span>Horários de hoje</span><strong>{scheduleLabel}</strong></div>
            </div>

            <details className="medProtoAdditionalInfo">
              <summary>Ver informação adicional</summary>
              <div className="medProtoInformationGrid medProtoInformationGridExtra">
                <div><span>Início registado</span><strong>{formatDate(selected.medication.startDate)}</strong></div>
                <div><span>Prescrito por</span><strong>{selectedProfile?.prescribedBy || 'Não registado'}</strong></div>
                <div><span>Observação</span><strong>{selectedProfile?.observation || 'Sem observação protegida'}</strong></div>
              </div>
            </details>

            <nav className="medProtoTabs" aria-label="Detalhes do medicamento">
              <button type="button" className={tab === 'history' ? 'active' : ''} aria-pressed={tab === 'history'} onClick={() => setTab('history')}>Histórico</button>
              <button type="button" className={tab === 'evolution' ? 'active' : ''} aria-pressed={tab === 'evolution'} onClick={() => setTab('evolution')}>Evolução</button>
              <button type="button" className={tab === 'information' ? 'active' : ''} aria-pressed={tab === 'information'} onClick={() => setTab('information')}>Informações</button>
            </nav>

            {tab === 'history' ? (
              <div className="medProtoTimeline">
                <div className="medProtoHistorySwitch" role="group" aria-label="Tipo de histórico">
                  <button
                    type="button"
                    className={historyView === 'summary' ? 'active' : ''}
                    aria-pressed={historyView === 'summary'}
                    onClick={() => selectHistoryView('summary')}
                  >
                    Resumo
                  </button>
                  <button
                    type="button"
                    className={historyView === 'technical' ? 'active' : ''}
                    aria-pressed={historyView === 'technical'}
                    onClick={() => selectHistoryView('technical')}
                  >
                    Detalhes técnicos
                  </button>
                </div>
                <div className="medHistoryHeader">
                  <div>
                    <strong>Registos por data</strong>
                    <span>{activeTimeline.length} registo(s) · mais recentes primeiro</span>
                  </div>
                  <label>
                    Tipo de registo
                    <select value={historyFilter} onChange={(event) => selectHistoryFilter(event.target.value as HistoryFilter)}>
                      <option value="all">Todos</option>
                      <option value="dose">Tomas</option>
                      <option value="schedule">Horários</option>
                      <option value="stock">Stock</option>
                      <option value="other">Outros</option>
                    </select>
                  </label>
                </div>
                <p className="medProtoTimelineNotice">
                  {historyView === 'summary'
                    ? 'Registos atuais organizados por data. As correções e versões anteriores ficam na vista técnica.'
                    : 'Histórico integral, incluindo versões anteriores, correções, proteção e rastreabilidade. Não é eliminado definitivamente.'}
                </p>
                {activeTimeline.length ? visibleTimeline.map((item, index) => {
                  const scheduleId = item.id.startsWith('schedule:') ? item.id.slice('schedule:'.length) : ''
                  const activeSchedule = item.kind === 'schedule' ? schedules.find((schedule) => schedule.id === scheduleId && !schedule.deletedAt && !schedule.effectiveUntil) : undefined
                  const event = item.id.startsWith('dose:') ? doseEvents.find((dose) => dose.id === item.id.slice('dose:'.length)) : undefined
                  const actionableEvent = event && activeHistoryDoseIds.has(event.id)
                  const dateGroup = historyDay(item.createdAt)
                  return (
                    <Fragment key={item.id}>
                      {index === 0 || historyDay(visibleTimeline[index - 1].createdAt) !== dateGroup ? (
                        <h4 className="medHistoryDate">{dateGroup}</h4>
                      ) : null}
                      <article className={`medProtoTimelineRow medHistoryRecord${item.title === 'Horário eliminado' ? ' isDeleted' : ''}`}>
                        <span className="medProtoTimelineIcon" aria-hidden="true"><AppIcon name={timelineItemIcon(item)} /></span>
                        <div className="medHistoryRecordBody">
                          <div className="medHistoryRecordTop">
                            <strong>{item.title}</strong>
                            <small>{formatDateTime(item.createdAt)}</small>
                          </div>
                          <p>{item.description}</p>
                          {activeSchedule || actionableEvent ? (
                            <div className="medHistoryActions" role="group" aria-label={`Ações para ${item.title}`}>
                              {activeSchedule ? (
                                <>
                                  <button type="button" disabled={busy} onClick={() => setHistoryAction({ kind: 'schedule', mode: 'define', schedule: activeSchedule })}>Editar</button>
                                  <button type="button" className="medHistoryDanger" disabled={busy} onClick={() => setHistoryAction({ kind: 'schedule', mode: 'delete', schedule: activeSchedule })}>Eliminar</button>
                                </>
                              ) : null}
                              {actionableEvent && event ? (
                                <>
                                  {event.status !== 'taken' ? (
                                    <button type="button" disabled={busy} onClick={() => beginHistoryDoseAction('edit', event)}>Editar</button>
                                  ) : null}
                                  <button type="button" className="medHistoryDanger" disabled={busy} onClick={() => beginHistoryDoseAction('cancel', event)}>
                                    'Eliminar'
                                  </button>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    </Fragment>
                  )
                }) : (
                  <p className="medProtoEmptyInline">
                    'Não existem registos para este filtro.'
                  </p>
                )}
                {activeTimeline.length > HISTORY_STEP ? (
                  <button type="button" className="medProtoHistoryMore" onClick={toggleHistorySize}>
                    {historyVisible < activeTimeline.length ? 'Ver mais eventos' : 'Mostrar menos'}
                    <AppIcon name={historyVisible < activeTimeline.length ? 'chevron-down' : 'chevron-left'} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {tab === 'evolution' ? (
              <div className="medProtoEvolution">
                <p>Resumo dos registos dos últimos 7 dias. Estes números descrevem o histórico; não são avaliação ou recomendação clínica.</p>
                <div className="medProtoEvolutionGrid">
                  <article><strong>{lastSevenDays.taken}</strong><span>Tomadas registadas</span></article>
                  <article><strong>{lastSevenDays.postponed}</strong><span>Adiamentos registados</span></article>
                  <article><strong>{lastSevenDays.notTaken}</strong><span>Não tomadas</span></article>
                  <article><strong>{lastSevenDays.corrected}</strong><span>Correções preservadas</span></article>
                </div>
                <div className="medProtoLedgerLine">
                  <span>Stock reconstruído</span>
                  <strong>{selected.stock} {selected.medication.unit}</strong>
                  <small>{selected.movementCount} movimentos no ledger.</small>
                </div>
              </div>
            ) : null}

            {tab === 'information' ? (
              <div className="medProtoInformationTab">
                <div className="medProtoImmutableInfo">
                  <strong>Identidade base protegida</strong>
                  <span>Nome: {selected.medication.name}</span>
                  <span>Dosagem: {selected.medication.dosage || '—'}</span>
                  <span>Unidade: {selected.medication.unit}</span>
                  <span>Data de início: {formatDate(selected.medication.startDate)}</span>
                  <small>Estes campos formam o registo original. Alterações operacionais são acrescentadas ao histórico em vez de substituir a origem.</small>
                </div>
                <div className="medProtoProfileForm">
                  <label>
                    Estado organizacional
                    <select
                      value={profileForm.status}
                      onChange={(event) => setProfileForm({ ...profileForm, status: event.target.value as MedicationLifecycleStatus })}
                    >
                      <option value="active">Em uso</option>
                      <option value="paused">Pausado</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </label>
                  <label>
                    Prescrito por
                    <input
                      value={profileForm.prescribedBy}
                      onChange={(event) => setProfileForm({ ...profileForm, prescribedBy: event.target.value })}
                      placeholder="Nome do profissional, se quiseres registar"
                    />
                  </label>
                  <label>
                    Observação protegida
                    <textarea
                      maxLength={4000}
                      value={profileForm.observation}
                      onChange={(event) => setProfileForm({ ...profileForm, observation: event.target.value })}
                      placeholder="Informação importante que deve permanecer associada a este medicamento"
                    />
                  </label>
                  <button
                    type="button"
                    className="stockPrimaryAction"
                    disabled={busy || !selectedId}
                    onClick={() => void execute(saveProtectedInformation, 'Informação guardada. A versão anterior permanece no histórico protegido.')}
                  >
                    Guardar sem apagar histórico
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ) : (
          <article className="medProtoDetail medProtoNoSelection">
            <strong>Seleciona um medicamento</strong>
            <span>Os detalhes, histórico e ações protegidas aparecerão aqui.</span>
          </article>
        )}
      </div>

      <div className="medProtoPassiveProtection" role="status">
        <strong>{protection?.status === 'OK' ? 'Dados protegidos automaticamente' : 'Proteção a verificar'}</strong>
        <span>
          IndexedDB + histórico append-only + cópia redundante local. Correções acrescentam registos; não apagam o anterior.
          {protection ? ` ${protection.movementCount + protection.scheduleCount + protection.doseEventCount} registo(s) operacionais verificados.` : ''}
        </span>
      </div>

      {historyAction?.kind === 'schedule' ? (
        <MedicationScheduleActionDialog
          key={historyAction.schedule.id + historyAction.mode}
          mode={historyAction.mode}
          schedule={historyAction.schedule}
          unit={selected?.medication.unit ?? ''}
          busy={busy}
          onCancel={() => setHistoryAction(null)}
          onDefine={(localTime, quantity) => void execute(
            () => confirmHistoryScheduleEdit(localTime, quantity),
            'Horário atualizado para amanhã. O histórico foi preservado.',
          )}
          onDelete={() => void execute(
            confirmHistoryScheduleDelete,
            'Horário eliminado da agenda ativa, sem apagar os registos anteriores.',
          )}
        />
      ) : null}

      {historyAction?.kind === 'dose' ? (
        <div className="medHistoryDialogBackdrop" onPointerDown={(event) => {
          if (event.target === event.currentTarget && !busy) setHistoryAction(null)
        }}>
          <section className="medHistoryDialog" role="dialog" aria-modal="true" aria-labelledby="med-history-action-title">
            <h3 id="med-history-action-title">{historyAction.mode === 'edit' ? 'Editar estado da toma' : 'Eliminar registo da vista atual'}</h3>
            <p>
              {historyAction.mode === 'edit'
                ? 'A alteração fica registada como nova versão, sem modificar a ocorrência original.'
                : historyAction.event.status === 'taken'
                  ? 'O registo deixará de estar ativo no resumo e o stock descontado será reposto por um movimento de correção. O histórico original fica protegido.'
                  : 'O estado atual será removido do resumo, mantendo uma correção auditável no histórico técnico.'}
            </p>
            {historyAction.mode === 'edit' ? (
              <div className="medHistoryDialogFields">
                <label>Estado
                  <select value={historyDoseStatus} disabled={busy} onChange={(event) => setHistoryDoseStatus(event.target.value as 'not_taken' | 'postponed')}>
                    <option value="not_taken">Não tomada</option>
                    <option value="postponed">Adiada</option>
                  </select>
                </label>
                {historyDoseStatus === 'postponed' ? (
                  <label>Nova hora
                    <input type="time" required value={historyDoseTime} disabled={busy} onChange={(event) => setHistoryDoseTime(event.target.value)} />
                  </label>
                ) : null}
              </div>
            ) : null}
            <div className="medHistoryDialogActions">
              <button type="button" ref={historyCancelRef} disabled={busy} onClick={() => setHistoryAction(null)}>Cancelar</button>
              <button
                type="button"
                className={historyAction.mode === 'cancel' ? 'medHistoryDanger' : 'medHistorySave'}
                disabled={busy || (historyAction.mode === 'edit' && historyDoseStatus === 'postponed' && !historyDoseTime)}
                onClick={() => void execute(
                  confirmHistoryDoseAction,
                  historyAction.mode === 'edit' ? 'Estado editado. A versão anterior continua no histórico.'  : 'Registo retirado do resumo através de correção auditável.',
                )}
              >
                {historyAction.mode === 'edit' ? 'Guardar alteração' : 'Confirmar eliminação'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {message ? <div className="medProtoMessage" role="status">{message}</div> : null}

      <p className="medProtoSafety">
        <strong>Regra principal:</strong> stock e tomas vêm dos registos guardados; não são inferidos. Correções acrescentam eventos,
        as notas mantêm revisões e os dados permanecem após atualizar a página. A cópia externa continua disponível em “Mais”
        para proteger contra perda do dispositivo ou limpeza total do navegador.
      </p>
    </section>
  )
}
