import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

function adjustmentClass(value?: string): string {
  if (!value || value === '0') return 'stockPhysicalAdjustmentZero'
  return value.startsWith('-') ? 'stockPhysicalAdjustmentNegative' : 'stockPhysicalAdjustmentPositive'
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
    <section className="personalStockPage medicationsStockPage" aria-labelledby="medications-title">
      <header className="personalStockHeader personalStockHeaderActions">
        <div>
          <span className="eyebrow">STOCK PESSOAL · EXATO</span>
          <h1 id="medications-title">Medicamentos</h1>
          <p>Gestão de stock e horários prescritos. A aplicação não recomenda nem altera tratamentos.</p>
        </div>
        <button type="button" onClick={() => setShowCreate((value) => !value)}>
          {showCreate ? 'Fechar' : '+ Medicamento'}
        </button>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

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

      {showCreate || medications.length === 0 ? (
        <section className="stockPanel" id="medication-create-form">
          <h2>Novo medicamento</h2>
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

      {medications.length > 0 ? (
        <div className="stockMedicationSelector" role="tablist" aria-label="Medicamentos">
          {medications.map((item) => (
            <button
              type="button"
              key={item.medication.id}
              className={item.medication.id === selectedId ? 'active' : ''}
              onClick={() => setSelectedId(item.medication.id)}
            >
              <strong>{item.medication.name}</strong>
              <small>{item.stock} {item.medication.unit}</small>
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <>
          <section className="stockMedicationHero">
            <div>
              <span className="stockPanelTag">{selected.medication.dosage}</span>
              <h2>{selected.medication.name}</h2>
              <p>Stock atual</p>
              <strong>{selected.stock} <small>{selected.medication.unit}</small></strong>
            </div>
            <span className={selected.ok ? 'stockStatusOk' : 'stockStatusError'}>
              {selected.ok ? 'RECONCILIADO' : 'INCONSISTÊNCIA'}
            </span>
          </section>

          <div className="stockMetricGrid stockMedicationMetrics">
            <article className="stockMetric">
              <span>Próxima toma</span>
              <strong>{formatDateTime(forecast?.nextDose.scheduledAt)}</strong>
              <small>{forecast ? `${forecast.nextDose.quantity} ${selected.medication.unit}` : forecastMessage}</small>
            </article>
            <article className="stockMetric">
              <span>Autonomia programada</span>
              <strong>{formatDuration(forecast?.autonomySeconds)}</strong>
              <small>Simulação cronológica</small>
            </article>
            <article className="stockMetric">
              <span>Última toma possível</span>
              <strong>{formatDateTime(forecast?.lastPossibleDose?.scheduledAt)}</strong>
              <small>{forecast ? `${forecast.stockAfterLastPossible} ${selected.medication.unit} restantes` : '—'}</small>
            </article>
            <article className="stockMetric">
              <span>Primeira toma impossível</span>
              <strong>{formatDateTime(forecast?.firstImpossibleDose.scheduledAt)}</strong>
              <small>{forecast ? `Em falta: ${forecast.missingQuantity} ${selected.medication.unit}` : '—'}</small>
            </article>
          </div>

          <section className="stockPanel stockDosePanel" id="medication-today-doses">
            <div className="stockPanelHeading">
              <div><span className="stockPanelTag">HOJE</span><h2>Tomas programadas</h2></div>
              <span>{today}</span>
            </div>

            <details className="stockDoseGuide">
              <summary>Como funcionam as ações?</summary>
              <div className="stockDoseGuideGrid">
                <div><strong>Tomada / Tomada agora</strong><span>Confirma a toma e desconta exatamente a quantidade programada.</span></div>
                <div><strong>Adiar</strong><span>Escolhe +15 min, +30 min, +1 h ou uma hora manual. Adiar não desconta stock.</span></div>
                <div><strong>Atrasada</strong><span>Aparece automaticamente quando a hora passa sem registo. É apenas um aviso e não altera stock.</span></div>
                <div><strong>Menu ···</strong><span>Reúne Não tomada, correções e o histórico daquela ocorrência.</span></div>
              </div>
              <p>Os atalhos de tempo servem apenas para agenda. Não são uma recomendação clínica nem alteram a prescrição.</p>
              <Link className="stockDoseGuideLink" to="/guia#medicamentos">Abrir guia completo</Link>
            </details>

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
                              <span>Escolhe a hora. O stock só muda quando confirmares a toma.</span>
                            </div>
                            <div className="stockPostponePresets" aria-label="Atalhos para nova hora">
                              <button type="button" disabled={busy || !quick15} onClick={() => quick15 && setPostponeTime(quick15)}>+15 min</button>
                              <button type="button" disabled={busy || !quick30} onClick={() => quick30 && setPostponeTime(quick30)}>+30 min</button>
                              <button type="button" disabled={busy || !quick60} onClick={() => quick60 && setPostponeTime(quick60)}>+1 h</button>
                            </div>
                            <label>
                              Escolher hora
                              <input
                                type="time"
                                value={postponeTime}
                                onChange={(changeEvent) => setPostponeTime(changeEvent.target.value)}
                              />
                            </label>
                            <span className="stockPostponeHint">Os atalhos são apenas opções de agenda e não constituem indicação sobre quando deves tomar o medicamento.</span>
                            <div className="stockPostponeButtons">
                              <button type="button" disabled={busy} onClick={closePostponeEditor}>Cancelar</button>
                              <button
                                type="button"
                                className="stockPrimaryAction"
                                disabled={busy || !postponeTime}
                                onClick={() => void run(
                                  async () => { await savePostpone(schedule) },
                                  postponeEventId
                                    ? 'Nova hora guardada. O adiamento anterior ficou no histórico e o stock não foi alterado.'
                                    : 'Toma adiada para a nova hora. O stock não foi alterado.',
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
                                      'Toma confirmada. O stock foi descontado na transação.',
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
                                      'Toma adiada confirmada. O stock foi descontado uma única vez e o reagendamento ficou auditado.',
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
                                              'A toma adiada foi marcada como não tomada. O stock não foi alterado e a alteração ficou auditada.',
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
                                              'Adiamento corrigido. A toma voltou a ficar disponível para registo.',
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
                                            'Toma corrigida. O stock foi reposto através de um movimento de correção.',
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
                                            'Estado corrigido. A toma voltou a ficar disponível para registo.',
                                          )
                                        }}
                                      >
                                        Corrigir estado
                                      </button>
                                    ) : null}

                                    <button type="button" role="menuitem" onClick={() => toggleDetails(schedule.id)}>
                                      {detailsOpen ? 'Fechar detalhes' : 'Ver detalhes e histórico'}
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
                                          ? 'Mantém o registo original e anula o seu estado ativo.'
                                          : 'Sem alteração de stock.'}
                                  </small>
                                </div>
                              </div>
                            )) : <p>Ainda não existem eventos registados para esta toma.</p>}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : <p className="stockEmpty">Ainda não existem horários válidos para hoje.</p>}
          </section>

          <div className="stockTwoPanels">
            <section className="stockPanel">
              <h2>Adicionar horário</h2>
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
                    'Horário adicionado. As previsões foram recalculadas.',
                  )}
                >
                  Adicionar horário
                </button>
              </div>
            </section>

            <section className="stockPanel">
              <h2>Repor stock</h2>
              <div className="stockInlineForm stockInlineFormStack">
                <label>Quantidade<input inputMode="decimal" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} /></label>
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
              <div className="stockCorrectionActions">
                <button
                  type="button"
                  className="stockSecondaryAction"
                  disabled={busy}
                  onClick={() => void run(
                    async () => {
                      await stockReconciliationService.undoLastMedicationRestock(selected.medication.id, operationId())
                    },
                    'Última reposição corrigida através de um novo movimento auditável.',
                  )}
                >
                  Corrigir última reposição
                </button>
              </div>
            </section>
          </div>

          <section className="stockPanel stockPhysicalPanel">
            <span className="stockPanelTag">CONFERÊNCIA REAL</span>
            <h2>Contagem física do medicamento</h2>
            <p>Indica a quantidade que tens realmente. A aplicação compara com o ledger e, se necessário, cria uma correção auditável.</p>
            <div className="stockInlineForm stockInlineFormStack stockPhysicalInline">
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
                  'Contagem física guardada. O stock ficou reconciliado com a quantidade contada.',
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
            ) : <p className="stockPhysicalCheckTime">Ainda não foi feita uma contagem física deste medicamento.</p>}
          </section>

          <section className="stockProjectionPanel stockExactPanel">
            <span>EXATO</span>
            <strong>stock inicial + entradas − consumos ± correções = {selected.stock} {selected.medication.unit}</strong>
            <p>{selected.movementCount} movimentos. Stock reconstruído: {minorToDecimal(selected.reconstructedMinor)} {selected.medication.unit}.</p>
          </section>
        </>
      ) : null}
    </section>
  )
}
