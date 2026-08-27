import { useCallback, useEffect, useMemo, useState } from 'react'
import { minorToDecimal } from '../../application/personalStock/decimal'
import { dateKeyInZone, resolveZonedLocalDateTime } from '../../application/personalStock/time'
import type {
  MedicationDoseEvent,
  MedicationForecast,
  MedicationSchedule,
  MedicationSummary,
  PhysicalStockCheck,
} from '../../domain/personalStock/models'
import { MedicationPrototypeWorkspace } from '../components/MedicationPrototypeWorkspace'
import { useAppServices } from '../providers/AppServicesProvider'

const TIMEZONE = 'Europe/Lisbon'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds < 0) return '—'
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  if (days) return `${days} d${hours ? ` ${hours} h` : ''}`
  const minutes = Math.floor((seconds % 3_600) / 60)
  return `${hours} h ${minutes} min`
}

function formatDelay(target: Date, now: Date): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - target.getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} h ${String(remainder).padStart(2, '0')} min` : `${hours} h`
}

function formatPhysicalCheckTime(value?: string): string {
  if (!value) return 'Nunca verificado'
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function doseStatusLabel(status: MedicationDoseEvent['status']): string {
  if (status === 'taken') return 'TOMADA'
  if (status === 'not_taken') return 'NÃO TOMADA'
  if (status === 'postponed') return 'ADIADA'
  return 'CORRIGIDA'
}

function historyStatusLabel(event: MedicationDoseEvent): string {
  if (event.status === 'taken' && event.rescheduledFrom) return 'TOMADA REAGENDADA'
  if (event.status === 'corrected') return 'CORREÇÃO'
  return doseStatusLabel(event.status)
}

function doseStatusClass(status: MedicationDoseEvent['status']): string {
  if (status === 'taken') return 'stockStatusOk'
  if (status === 'postponed') return 'stockStatusWarning'
  if (status === 'not_taken') return 'stockStatusNeutral'
  return 'stockStatusNeutral'
}


function signed(value?: string): string {
  if (!value) return '—'
  if (value === '0' || value.startsWith('-')) return value
  return `+${value}`
}

interface TodayDose {
  schedule: MedicationSchedule
  event?: MedicationDoseEvent
}

export function MedicationsStockPage() {
  const { personalStockService, medicationDoseStatusService, stockReconciliationService, medicationDataProtectionService } = useAppServices()
  const [medications, setMedications] = useState<MedicationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [events, setEvents] = useState<MedicationDoseEvent[]>([])
  const [physicalCheck, setPhysicalCheck] = useState<PhysicalStockCheck | null>(null)
  const [forecast, setForecast] = useState<MedicationForecast | null>(null)
  const [forecastMessage, setForecastMessage] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [createForm, setCreateForm] = useState({
    name: '',
    dosage: '',
    unit: 'comprimidos',
    initialStock: '',
    startDate: dateKeyInZone(new Date(), TIMEZONE),
  })
  const [scheduleForm, setScheduleForm] = useState({ localTime: '08:00', quantity: '1' })
  const [restockQuantity, setRestockQuantity] = useState('')
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [postponeScheduleId, setPostponeScheduleId] = useState<string | null>(null)
  const [postponeEventId, setPostponeEventId] = useState<string | null>(null)
  const [postponeTime, setPostponeTime] = useState('')
  const [openMenuScheduleId, setOpenMenuScheduleId] = useState<string | null>(null)
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null)

  const today = useMemo(() => dateKeyInZone(new Date(), TIMEZONE), [])
  const selected = medications.find((item) => item.medication.id === selectedId) ?? null

  const loadList = useCallback(async (preferredId?: string) => {
    const list = await personalStockService.listMedications()
    setMedications(list)
    setSelectedId((current) => {
      const candidate = preferredId ?? current
      return candidate && list.some((item) => item.medication.id === candidate)
        ? candidate
        : list[0]?.medication.id ?? null
    })
  }, [personalStockService])

  const loadSelected = useCallback(async (medicationId: string) => {
    const [daySchedules, doseEvents, nextPhysicalCheck] = await Promise.all([
      personalStockService.schedulesForDate(medicationId, today),
      personalStockService.listDoseEvents(medicationId),
      stockReconciliationService.getPhysicalCheck(medicationId),
    ])
    setSchedules(daySchedules)
    setEvents(doseEvents)
    setPhysicalCheck(nextPhysicalCheck)
    try {
      const result = await medicationDoseStatusService.forecastMedication(medicationId)
      setForecast(result)
      setForecastMessage('')
    } catch (error) {
      setForecast(null)
      setForecastMessage(error instanceof Error ? error.message : 'Não foi possível calcular a autonomia.')
    }
  }, [medicationDoseStatusService, personalStockService, stockReconciliationService, today])

  useEffect(() => {
    void (async () => {
      const recovery = await medicationDataProtectionService.recoverFromRedundantSnapshotIfNeeded()
      await loadList()
      if (recovery.recovered) {
        setMessage('Dados de medicação recuperados automaticamente a partir da cópia redundante local.')
      }
    })().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar medicamentos.'))
  }, [loadList, medicationDataProtectionService])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-dose-menu-root]')) return
      setOpenMenuScheduleId(null)
    }
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [])

  useEffect(() => {
    setPhysicalQuantity('')
    setPostponeScheduleId(null)
    setPostponeEventId(null)
    setPostponeTime('')
    setOpenMenuScheduleId(null)
    setDetailScheduleId(null)
    if (!selectedId) {
      setSchedules([])
      setEvents([])
      setPhysicalCheck(null)
      setForecast(null)
      return
    }
    void loadSelected(selectedId).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar medicamento.'))
  }, [loadSelected, selectedId])

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
      await loadList(selectedId ?? undefined)
      if (selectedId) await loadSelected(selectedId)
      let protectionWarning = ''
      try {
        if (selectedId) await medicationDataProtectionService.recordCheckpoint(selectedId, 'operação de medicação concluída')
        const snapshot = await medicationDataProtectionService.syncRedundantSnapshot()
        if (!snapshot.available) protectionWarning = ' A cópia redundante local não ficou disponível neste navegador.'
      } catch (protectionError) {
        protectionWarning = ` Proteção adicional: ${protectionError instanceof Error ? protectionError.message : 'não foi possível atualizar o ponto de proteção.'}`
      }
      setMessage(`${success}${protectionWarning}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  const activeEvents = useMemo(() => {
    const correctedIds = new Set(
      events
        .filter((event) => event.status === 'corrected' && event.correctionOf)
        .map((event) => event.correctionOf as string),
    )
    const map = new Map<string, MedicationDoseEvent>()
    for (const event of events) {
      if (event.status === 'corrected' || correctedIds.has(event.id)) continue
      const current = map.get(event.occurrenceKey)
      if (!current || current.createdAt < event.createdAt || (current.createdAt === event.createdAt && current.id < event.id)) {
        map.set(event.occurrenceKey, event)
      }
    }
    return map
  }, [events])

  const todayDoses: TodayDose[] = useMemo(
    () => schedules.map((schedule) => ({
      schedule,
      event: activeEvents.get(`${schedule.id}:${today}`),
    })),
    [activeEvents, schedules, today],
  )

  function scrollToMedicationSection(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  function toggleCreateMedication() {
    if (showCreate) {
      setShowCreate(false)
      return
    }
    setShowCreate(true)
    scrollToMedicationSection('medication-create-form')
  }

  async function createMedication() {
    const medicationId = globalThis.crypto.randomUUID()
    await personalStockService.createMedication({
      ...createForm,
      medicationId,
      operationId: operationId(),
    })
    await medicationDataProtectionService.ensureProtected(medicationId)
    await medicationDataProtectionService.recordCheckpoint(medicationId, 'medicamento criado')
    await medicationDataProtectionService.syncRedundantSnapshot()
    setCreateForm({
      name: '',
      dosage: '',
      unit: 'comprimidos',
      initialStock: '',
      startDate: today,
    })
    setShowCreate(false)
    await loadList(medicationId)
    setSelectedId(medicationId)
    scrollToMedicationSection('medication-workspace')
  }

  async function correctDoseEvent(event: MedicationDoseEvent) {
    if (event.status === 'taken') {
      await personalStockService.undoMedicationDose(event.id, operationId())
      return
    }
    if (event.status === 'not_taken' || event.status === 'postponed') {
      await medicationDoseStatusService.correctMedicationDoseStatus(event.id, operationId())
      return
    }
    throw new Error('Este estado já está corrigido.')
  }

  function scheduledAt(schedule: MedicationSchedule): Date {
    return resolveZonedLocalDateTime(today, schedule.localTime, TIMEZONE, schedule.fold)
  }

  function quickPostponeTime(schedule: MedicationSchedule, event: MedicationDoseEvent | undefined, minutes: number): string | null {
    const original = scheduledAt(schedule)
    const postponed = event?.postponedTo ? new Date(event.postponedTo) : null
    const base = Math.max(now.getTime(), original.getTime(), postponed?.getTime() ?? 0)
    const target = new Date(base + minutes * 60_000)
    if (dateKeyInZone(target, TIMEZONE) !== today) return null
    return formatTime(target.toISOString())
  }

  function openPostponeEditor(schedule: MedicationSchedule, event?: MedicationDoseEvent) {
    setOpenMenuScheduleId(null)
    setPostponeScheduleId(schedule.id)
    setPostponeEventId(event?.status === 'postponed' ? event.id : null)
    setPostponeTime(event?.status === 'postponed' && event.postponedTo ? formatTime(event.postponedTo) : '')
  }

  function closePostponeEditor() {
    setPostponeScheduleId(null)
    setPostponeEventId(null)
    setPostponeTime('')
  }

  async function savePostpone(schedule: MedicationSchedule) {
    if (!selected || !postponeTime) return
    if (postponeEventId) {
      await medicationDoseStatusService.replaceMedicationDoseStatus({
        eventId: postponeEventId,
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: postponeTime,
      })
    } else {
      await medicationDoseStatusService.setMedicationDoseStatus({
        medicationId: selected.medication.id,
        scheduleId: schedule.id,
        onDate: today,
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: postponeTime,
      })
    }
    closePostponeEditor()
  }

  async function markNotTaken(schedule: MedicationSchedule, event?: MedicationDoseEvent) {
    if (!selected) return
    if (event?.status === 'postponed') {
      await medicationDoseStatusService.replaceMedicationDoseStatus({
        eventId: event.id,
        operationId: operationId(),
        status: 'not_taken',
      })
      return
    }
    await medicationDoseStatusService.setMedicationDoseStatus({
      medicationId: selected.medication.id,
      scheduleId: schedule.id,
      onDate: today,
      operationId: operationId(),
      status: 'not_taken',
    })
  }

  function toggleDetails(scheduleId: string) {
    setOpenMenuScheduleId(null)
    setDetailScheduleId((current) => current === scheduleId ? null : scheduleId)
  }

  return (
    <section className="personalStockPage medicationsStockPage medicationLinearPage" aria-labelledby="medications-title">
      <header className="personalStockHeader personalStockHeaderActions">
        <div>
          <span className="eyebrow">ORGANIZAÇÃO PESSOAL · MEDICAÇÃO</span>
          <h1 id="medications-title">Medicamentos</h1>
          <p>Stock, horários e tomas baseados apenas nos registos configurados. A aplicação não altera nem inventa a prescrição.</p>
        </div>
        <button
          type="button"
          aria-expanded={showCreate}
          aria-controls="medication-create-form"
          onClick={toggleCreateMedication}
        >
          {showCreate ? 'Fechar' : '+ Medicamento'}
        </button>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      {showCreate || medications.length === 0 ? (
        <section className="stockPanel medicationLinearCreate" id="medication-create-form" tabIndex={-1}>
          <span className="stockPanelTag">NOVO MEDICAMENTO</span>
          <h2>Registar informação base</h2>
          <p>Nome, dosagem, unidade e stock inicial ficam associados ao registo original protegido.</p>
          <div className="stockFormGrid">
            <label>Nome<input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} /></label>
            <label>Dosagem<input placeholder="ex.: 400 mg" value={createForm.dosage} onChange={(event) => setCreateForm({ ...createForm, dosage: event.target.value })} /></label>
            <label>Unidade<input value={createForm.unit} onChange={(event) => setCreateForm({ ...createForm, unit: event.target.value })} /></label>
            <label>Stock inicial<input inputMode="decimal" value={createForm.initialStock} onChange={(event) => setCreateForm({ ...createForm, initialStock: event.target.value })} /></label>
            <label>Data de início<input type="date" value={createForm.startDate} onChange={(event) => setCreateForm({ ...createForm, startDate: event.target.value })} /></label>
          </div>
          <button
            className="stockPrimaryAction"
            type="button"
            disabled={busy}
            onClick={() => void run(createMedication, 'Medicamento criado com stock inicial auditável.')}
          >
            Guardar medicamento
          </button>
        </section>
      ) : null}

      <div id="medication-workspace">
        <MedicationPrototypeWorkspace
          medications={medications}
          selectedId={selectedId}
          today={today}
          onSelect={setSelectedId}
          onDataChanged={async () => {
            await loadList(selectedId ?? undefined)
            if (selectedId) await loadSelected(selectedId)
          }}
        />
      </div>

      {selected ? (
        <>
          <section className="medicationLinearForecast" aria-labelledby="medication-forecast-title">
            <div className="medicationLinearHeading">
              <div>
                <span className="stockPanelTag">PROJEÇÃO PROGRAMADA</span>
                <h2 id="medication-forecast-title">Até onde pode chegar o stock configurado</h2>
              </div>
              <span className={forecast?.exact ? 'stockStatusOk' : 'stockStatusNeutral'}>
                {forecast?.exact ? 'CÁLCULO DETERMINÍSTICO' : 'SEM PROJEÇÃO'}
              </span>
            </div>
            {forecast ? (
              <div className="medicationLinearForecastGrid">
                <article>
                  <span>Autonomia</span>
                  <strong>{formatDuration(forecast.autonomySeconds)}</strong>
                  <small>stock real aplicado cronologicamente aos horários configurados</small>
                </article>
                <article>
                  <span>Última toma possível</span>
                  <strong>{formatDateTime(forecast.lastPossibleDose?.scheduledAt)}</strong>
                  <small>{forecast.stockAfterLastPossible} {selected.medication.unit} restantes depois dessa toma</small>
                </article>
                <article>
                  <span>Primeira toma sem stock suficiente</span>
                  <strong>{formatDateTime(forecast.firstImpossibleDose.scheduledAt)}</strong>
                  <small>faltariam {forecast.missingQuantity} {selected.medication.unit}</small>
                </article>
              </div>
            ) : (
              <p className="medicationLinearNoForecast">
                {forecastMessage || 'Configura pelo menos um horário válido para calcular a autonomia sem suposições.'}
              </p>
            )}
            <p className="medicationLinearRule">
              Esta projeção usa apenas stock real + horários e quantidades configuradas. O cálculo é determinístico, mas a data futura depende de as tomas ocorrerem conforme essa configuração.
            </p>
          </section>

          <section className="stockPanel stockDosePanel medicationLinearToday" id="medication-today-doses">
            <div className="stockPanelHeading">
              <div><span className="stockPanelTag">HOJE</span><h2>Tomas programadas</h2></div>
              <span>{today}</span>
            </div>
            <p className="medicationLinearDoseRule">
              Só “Tomada” desconta stock. Adiar ou marcar “Não tomada” preserva o stock e cria um evento auditável.
            </p>

            {todayDoses.length ? (
              <div className="stockDoseList">
                {todayDoses.map(({ schedule, event }) => {
                  const originalAt = scheduledAt(schedule)
                  const isLate = !event && now.getTime() > originalAt.getTime()
                  const occurrenceKey = `${schedule.id}:${today}`
                  const history = events
                    .filter((item) => item.occurrenceKey === occurrenceKey)
                    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
                  const quick15 = quickPostponeTime(schedule, event, 15)
                  const quick30 = quickPostponeTime(schedule, event, 30)
                  const quick60 = quickPostponeTime(schedule, event, 60)
                  const menuOpen = openMenuScheduleId === schedule.id
                  const detailsOpen = detailScheduleId === schedule.id

                  return (
                    <article className="stockDoseCard" key={schedule.id}>
                      <div className="stockDoseRow stockDoseRowMain">
                        <div className="stockDoseIdentity">
                          <strong>{schedule.localTime}</strong>
                          <small>{minorToDecimal(schedule.quantityMinor)} {selected.medication.unit}</small>
                          {event?.status === 'postponed' ? (
                            <span className="stockDosePostponedTime">
                              {event.postponedTo ? `Adiada para ${formatTime(event.postponedTo)}` : 'Adiada sem nova hora definida'}
                            </span>
                          ) : null}
                        </div>

                        {postponeScheduleId === schedule.id ? (
                          <div className="stockPostponeEditor">
                            <div className="stockPostponeTitle">
                              <strong>{postponeEventId ? 'Alterar nova hora' : 'Adiar toma'}</strong>
                              <span>O stock não muda até a toma ser confirmada.</span>
                            </div>
                            <div className="stockPostponePresets" aria-label="Atalhos para nova hora">
                              <button type="button" disabled={busy || !quick15} onClick={() => quick15 && setPostponeTime(quick15)}>+15 min</button>
                              <button type="button" disabled={busy || !quick30} onClick={() => quick30 && setPostponeTime(quick30)}>+30 min</button>
                              <button type="button" disabled={busy || !quick60} onClick={() => quick60 && setPostponeTime(quick60)}>+1 h</button>
                            </div>
                            <label>
                              Nova hora
                              <input type="time" value={postponeTime} onChange={(changeEvent) => setPostponeTime(changeEvent.target.value)} />
                            </label>
                            <span className="stockPostponeHint">Os atalhos são ferramentas de agenda, não indicação clínica.</span>
                            <div className="stockPostponeButtons">
                              <button type="button" disabled={busy} onClick={closePostponeEditor}>Cancelar</button>
                              <button
                                type="button"
                                className="stockPrimaryAction"
                                disabled={busy || !postponeTime}
                                onClick={() => void run(
                                  async () => { await savePostpone(schedule) },
                                  postponeEventId
                                    ? 'Nova hora guardada. O adiamento anterior ficou no histórico.'
                                    : 'Toma adiada. O stock não foi alterado.',
                                )}
                              >
                                Guardar hora
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="stockDoseActionCluster">
                            <div className="stockDoseStateLine">
                              {event ? (
                                <span className={doseStatusClass(event.status)}>{doseStatusLabel(event.status)}</span>
                              ) : isLate ? (
                                <span className="stockStatusLate">ATRASADA · {formatDelay(originalAt, now)}</span>
                              ) : (
                                <span className="stockStatusPending">PENDENTE</span>
                              )}
                            </div>

                            <div className="stockDoseQuickActions">
                              {!event ? (
                                <>
                                  <button
                                    className="stockPrimaryAction"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void run(
                                      async () => {
                                        await personalStockService.confirmMedicationDose({
                                          medicationId: selected.medication.id,
                                          scheduleId: schedule.id,
                                          onDate: today,
                                          operationId: operationId(),
                                        })
                                      },
                                      'Toma confirmada. O stock foi descontado exatamente uma vez.',
                                    )}
                                  >
                                    {isLate ? 'Tomada agora' : 'Tomada'}
                                  </button>
                                  <button type="button" disabled={busy} onClick={() => openPostponeEditor(schedule)}>Adiar</button>
                                </>
                              ) : event.status === 'postponed' ? (
                                <>
                                  <button
                                    type="button"
                                    className="stockPrimaryAction"
                                    disabled={busy}
                                    onClick={() => void run(
                                      async () => {
                                        await medicationDoseStatusService.confirmPostponedMedicationDose(event.id, operationId())
                                      },
                                      'Toma adiada confirmada. O stock foi descontado uma única vez.',
                                    )}
                                  >
                                    Tomada agora
                                  </button>
                                  <button type="button" disabled={busy} onClick={() => openPostponeEditor(schedule, event)}>Alterar hora</button>
                                </>
                              ) : null}

                              <div className="stockDoseMenuRoot" data-dose-menu-root>
                                <button
                                  type="button"
                                  className="stockDoseMenuButton"
                                  aria-label={`Mais ações para a toma das ${schedule.localTime}`}
                                  aria-expanded={menuOpen}
                                  onClick={() => setOpenMenuScheduleId((current) => current === schedule.id ? null : schedule.id)}
                                >
                                  ···
                                </button>
                                {menuOpen ? (
                                  <div className="stockDoseMenu" role="menu">
                                    {!event ? (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        disabled={busy}
                                        onClick={() => {
                                          setOpenMenuScheduleId(null)
                                          void run(
                                            async () => { await markNotTaken(schedule) },
                                            'Toma marcada como não tomada. O stock não foi alterado.',
                                          )
                                        }}
                                      >
                                        Não tomada
                                      </button>
                                    ) : null}

                                    {event?.status === 'postponed' ? (
                                      <>
                                        <button
                                          type="button"
                                          role="menuitem"
                                          disabled={busy}
                                          onClick={() => {
                                            setOpenMenuScheduleId(null)
                                            void run(
                                              async () => { await markNotTaken(schedule, event) },
                                              'A toma adiada foi marcada como não tomada. O histórico foi preservado.',
                                            )
                                          }}
                                        >
                                          Não tomada
                                        </button>
                                        <button
                                          type="button"
                                          role="menuitem"
                                          disabled={busy}
                                          onClick={() => {
                                            setOpenMenuScheduleId(null)
                                            void run(
                                              async () => { await correctDoseEvent(event) },
                                              'Adiamento corrigido. O evento original permanece no histórico.',
                                            )
                                          }}
                                        >
                                          Corrigir adiamento
                                        </button>
                                      </>
                                    ) : null}

                                    {event?.status === 'taken' ? (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        disabled={busy}
                                        onClick={() => {
                                          setOpenMenuScheduleId(null)
                                          void run(
                                            async () => { await correctDoseEvent(event) },
                                            'Toma corrigida. O stock foi reposto por movimento de correção.',
                                          )
                                        }}
                                      >
                                        Corrigir toma
                                      </button>
                                    ) : null}

                                    {event?.status === 'not_taken' ? (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        disabled={busy}
                                        onClick={() => {
                                          setOpenMenuScheduleId(null)
                                          void run(
                                            async () => { await correctDoseEvent(event) },
                                            'Estado corrigido. O evento original permanece no histórico.',
                                          )
                                        }}
                                      >
                                        Corrigir estado
                                      </button>
                                    ) : null}

                                    <button type="button" role="menuitem" onClick={() => toggleDetails(schedule.id)}>
                                      {detailsOpen ? 'Fechar histórico' : 'Ver histórico desta toma'}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {detailsOpen ? (
                        <div className="stockDoseDetails" id={`dose-details-${schedule.id}`}>
                          <div className="stockDoseDetailsGrid">
                            <div><span>Estado atual</span><strong>{event ? doseStatusLabel(event.status) : isLate ? 'ATRASADA' : 'PENDENTE'}</strong></div>
                            <div><span>Hora original</span><strong>{schedule.localTime}</strong></div>
                            <div><span>Quantidade</span><strong>{minorToDecimal(schedule.quantityMinor)} {selected.medication.unit}</strong></div>
                            <div>
                              <span>Efeito atual no stock</span>
                              <strong>{event?.status === 'taken' ? `−${minorToDecimal(schedule.quantityMinor)} ${selected.medication.unit}` : 'Sem alteração'}</strong>
                            </div>
                          </div>
                          {event?.status === 'postponed' && event.postponedTo ? (
                            <p className="stockDoseDetailNote">Nova hora ativa: <strong>{formatTime(event.postponedTo)}</strong>.</p>
                          ) : null}
                          <div className="stockDoseHistory">
                            <strong>Histórico desta ocorrência</strong>
                            {history.length ? history.map((historyEvent) => (
                              <div className="stockDoseHistoryRow" key={historyEvent.id}>
                                <span className={doseStatusClass(historyEvent.status)}>{historyStatusLabel(historyEvent)}</span>
                                <div>
                                  <strong>{formatDateTime(historyEvent.createdAt)}</strong>
                                  <small>
                                    {historyEvent.status === 'postponed' && historyEvent.postponedTo
                                      ? `Nova hora: ${formatTime(historyEvent.postponedTo)}`
                                      : historyEvent.status === 'taken'
                                        ? `Stock: −${minorToDecimal(historyEvent.quantityMinor)} ${selected.medication.unit}`
                                        : historyEvent.status === 'corrected'
                                          ? 'O registo original foi mantido e corrigido por um novo evento.'
                                          : 'Sem alteração de stock.'}
                                  </small>
                                </div>
                              </div>
                            )) : <p>Ainda não existem eventos para esta toma.</p>}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="stockEmpty">Ainda não existem horários válidos para hoje. Configura um horário em “Configuração e stock”.</p>
            )}
          </section>

          <details className="medicationLinearAdvanced">
            <summary>Configuração e stock</summary>
            <div className="medicationLinearAdvancedBody">
              <section>
                <h3>Adicionar horário</h3>
                <div className="stockInlineForm stockInlineFormStack">
                  <label>Hora<input type="time" value={scheduleForm.localTime} onChange={(event) => setScheduleForm({ ...scheduleForm, localTime: event.target.value })} /></label>
                  <label>Quantidade<input inputMode="decimal" value={scheduleForm.quantity} onChange={(event) => setScheduleForm({ ...scheduleForm, quantity: event.target.value })} /></label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(
                      async () => {
                        await personalStockService.addMedicationSchedule({
                          medicationId: selected.medication.id,
                          localTime: scheduleForm.localTime,
                          quantity: scheduleForm.quantity,
                          effectiveFrom: today,
                        })
                      },
                      'Horário adicionado. A autonomia foi recalculada apenas com a nova configuração.',
                    )}
                  >
                    Adicionar horário
                  </button>
                </div>
              </section>

              <section>
                <h3>Repor stock</h3>
                <div className="stockInlineForm stockInlineFormStack">
                  <label>
                    Quantidade ({selected.medication.unit})
                    <input inputMode="decimal" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !restockQuantity.trim()}
                    onClick={() => void run(
                      async () => {
                        await personalStockService.restockMedication(selected.medication.id, restockQuantity, operationId())
                        setRestockQuantity('')
                      },
                      'Reposição adicionada ao ledger.',
                    )}
                  >
                    Adicionar stock
                  </button>
                </div>
                <button
                  type="button"
                  className="stockSecondaryAction"
                  disabled={busy}
                  onClick={() => void run(
                    async () => {
                      await stockReconciliationService.undoLastMedicationRestock(selected.medication.id, operationId())
                    },
                    'Última reposição corrigida por um novo movimento auditável.',
                  )}
                >
                  Corrigir última reposição
                </button>
              </section>

              <section>
                <h3>Contagem física</h3>
                <p>Usa apenas se contares fisicamente o medicamento e o valor não coincidir com o ledger.</p>
                <div className="stockInlineForm stockInlineFormStack">
                  <label>
                    Quantidade contada ({selected.medication.unit})
                    <input
                      inputMode="decimal"
                      placeholder={`ex.: ${selected.stock}`}
                      value={physicalQuantity}
                      onChange={(event) => setPhysicalQuantity(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="stockPrimaryAction"
                    disabled={busy || !physicalQuantity.trim()}
                    onClick={() => void run(
                      async () => {
                        await stockReconciliationService.reconcileMedicationPhysicalCount(
                          selected.medication.id,
                          physicalQuantity,
                          operationId(),
                        )
                        setPhysicalQuantity('')
                      },
                      'Contagem física reconciliada sem apagar movimentos anteriores.',
                    )}
                  >
                    Reconciliar
                  </button>
                </div>
                {physicalCheck ? (
                  <small>
                    Última contagem: {physicalCheck.counted} · ajuste {signed(physicalCheck.adjustment)} · {formatPhysicalCheckTime(physicalCheck.checkedAt)}
                  </small>
                ) : null}
              </section>
            </div>
          </details>

          <section className="medicationLinearExact">
            <strong>Stock exato: {selected.stock} {selected.medication.unit}</strong>
            <span>
              {selected.movementCount} movimento(s) · reconstruído: {minorToDecimal(selected.reconstructedMinor)} {selected.medication.unit} · {selected.ok ? 'integridade OK' : 'verificar integridade'}
            </span>
          </section>
        </>
      ) : null}
    </section>
  )
}
