import { useCallback, useEffect, useMemo, useState } from 'react'
import { minorToDecimal } from '../../application/personalStock/decimal'
import { dateKeyInZone } from '../../application/personalStock/time'
import type {
  MedicationDoseEvent,
  MedicationForecast,
  MedicationSchedule,
  MedicationSummary,
} from '../../domain/personalStock/models'
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

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds < 0) return '—'
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  if (days) return `${days} d${hours ? ` ${hours} h` : ''}`
  const minutes = Math.floor((seconds % 3_600) / 60)
  return `${hours} h ${minutes} min`
}

interface TodayDose {
  schedule: MedicationSchedule
  taken?: MedicationDoseEvent
}

export function MedicationsStockPage() {
  const { personalStockService } = useAppServices()
  const [medications, setMedications] = useState<MedicationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [events, setEvents] = useState<MedicationDoseEvent[]>([])
  const [forecast, setForecast] = useState<MedicationForecast | null>(null)
  const [forecastMessage, setForecastMessage] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    dosage: '',
    unit: 'comprimidos',
    initialStock: '',
    startDate: dateKeyInZone(new Date(), TIMEZONE),
  })
  const [scheduleForm, setScheduleForm] = useState({ localTime: '08:00', quantity: '1' })
  const [restockQuantity, setRestockQuantity] = useState('')

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
    const [daySchedules, doseEvents] = await Promise.all([
      personalStockService.schedulesForDate(medicationId, today),
      personalStockService.listDoseEvents(medicationId),
    ])
    setSchedules(daySchedules)
    setEvents(doseEvents)
    try {
      const result = await personalStockService.forecastMedication(medicationId)
      setForecast(result)
      setForecastMessage('')
    } catch (error) {
      setForecast(null)
      setForecastMessage(error instanceof Error ? error.message : 'Não foi possível calcular a autonomia.')
    }
  }, [personalStockService, today])

  useEffect(() => {
    void loadList().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Erro ao carregar medicamentos.'))
  }, [loadList])

  useEffect(() => {
    if (!selectedId) {
      setSchedules([])
      setEvents([])
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
      setMessage(success)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  const correctedIds = useMemo(
    () => new Set(events.filter((event) => event.status === 'corrected' && event.correctionOf).map((event) => event.correctionOf)),
    [events],
  )

  const todayDoses: TodayDose[] = schedules.map((schedule) => ({
    schedule,
    taken: events.find(
      (event) => event.scheduleId === schedule.id
        && event.occurrenceKey === `${schedule.id}:${today}`
        && event.status === 'taken'
        && !correctedIds.has(event.id),
    ),
  }))

  async function createMedication() {
    const medicationId = globalThis.crypto.randomUUID()
    await personalStockService.createMedication({
      ...createForm,
      medicationId,
      operationId: operationId(),
    })
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

      {showCreate || medications.length === 0 ? (
        <section className="stockPanel">
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

          <section className="stockPanel">
            <div className="stockPanelHeading">
              <div><span className="stockPanelTag">HOJE</span><h2>Tomas programadas</h2></div>
              <span>{today}</span>
            </div>
            {todayDoses.length ? (
              <div className="stockDoseList">
                {todayDoses.map(({ schedule, taken }) => (
                  <article className="stockDoseRow" key={schedule.id}>
                    <div>
                      <strong>{schedule.localTime}</strong>
                      <small>{minorToDecimal(schedule.quantityMinor)} {selected.medication.unit}</small>
                    </div>
                    {taken ? (
                      <div className="stockDoseActions">
                        <span className="stockStatusOk">TOMADA</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void run(
                            async () => { await personalStockService.undoMedicationDose(taken.id, operationId()) },
                            'Toma corrigida. O stock foi reposto através de um movimento de correção.',
                          )}
                        >
                          Corrigir
                        </button>
                      </div>
                    ) : (
                      <button
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
                        Confirmar toma
                      </button>
                    )}
                  </article>
                ))}
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
            </section>
          </div>

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
