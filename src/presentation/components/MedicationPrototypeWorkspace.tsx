import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  MedicationDashboardSummary,
  MedicationLifecycleStatus,
  MedicationProtectedProfile,
  MedicationProtectionSummary,
  MedicationTimelineItem,
} from '../../application/personalStock/MedicationDataProtectionService'
import { minorToDecimal } from '../../application/personalStock/decimal'
import type { MedicationDoseEvent, MedicationSchedule, MedicationSummary } from '../../domain/personalStock/models'
import { useAppServices } from '../providers/AppServicesProvider'

type WorkspaceTab = 'history' | 'evolution' | 'information'
type StatusFilter = 'all' | MedicationLifecycleStatus

interface MedicationPrototypeWorkspaceProps {
  medications: MedicationSummary[]
  selectedId: string | null
  today: string
  onSelect: (medicationId: string) => void
  onAddMedication: () => void
  onDataChanged: () => Promise<void>
}

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


function timelineIcon(kind: MedicationTimelineItem['kind']): string {
  if (kind === 'dose') return '✓'
  if (kind === 'schedule') return '◷'
  if (kind === 'stock') return '±'
  if (kind === 'note') return '✎'
  if (kind === 'profile') return 'i'
  if (kind === 'protection') return '◆'
  return '+'
}

function activeEvent(events: MedicationDoseEvent[], occurrenceKey: string): MedicationDoseEvent | undefined {
  const occurrenceEvents = events.filter((event) => event.occurrenceKey === occurrenceKey)
  const correctedIds = new Set(
    occurrenceEvents
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )
  return occurrenceEvents
    .filter((event) => event.status !== 'corrected' && !correctedIds.has(event.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0]
}

export function MedicationPrototypeWorkspace({
  medications,
  selectedId,
  today,
  onSelect,
  onAddMedication,
  onDataChanged,
}: MedicationPrototypeWorkspaceProps) {
  const {
    personalStockService,
    medicationDataProtectionService,
  } = useAppServices()
  const [profiles, setProfiles] = useState<Record<string, MedicationProtectedProfile>>({})
  const [dashboard, setDashboard] = useState<MedicationDashboardSummary>(EMPTY_DASHBOARD)
  const [protection, setProtection] = useState<MedicationProtectionSummary | null>(null)
  const [timeline, setTimeline] = useState<MedicationTimelineItem[]>([])
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [doseEvents, setDoseEvents] = useState<MedicationDoseEvent[]>([])
  const [profileForm, setProfileForm] = useState({
    status: 'active' as MedicationLifecycleStatus,
    prescribedBy: '',
    observation: '',
  })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [tab, setTab] = useState<WorkspaceTab>('history')
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
      setDoseEvents([])
      return
    }

    const [nextProtection, nextTimeline, nextSchedules, nextDoseEvents, profile] = await Promise.all([
      medicationDataProtectionService.verifyMedication(selectedId),
      medicationDataProtectionService.getMedicationTimeline(selectedId),
      personalStockService.schedulesForDate(selectedId, today),
      personalStockService.listDoseEvents(selectedId),
      medicationDataProtectionService.getProfile(selectedId),
    ])
    setProtection(nextProtection)
    setTimeline(nextTimeline)
    setSchedules(nextSchedules)
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

  const todayDoseRows = useMemo(() => schedules.map((schedule) => ({
    schedule,
    event: activeEvent(doseEvents, `${schedule.id}:${today}`),
  })), [doseEvents, schedules, today])

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
      setMessage(success)
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


  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="medProtoWorkspace" aria-labelledby="med-proto-title">
      <header className="medProtoHeader">
        <div>
          <span className="stockPanelTag">GESTOR DE MEDICAÇÃO · COMPLETO</span>
          <h2 id="med-proto-title">Medicação</h2>
          <p>Registos persistentes, ações auditáveis e informação protegida. O sistema não altera nem recomenda tratamentos.</p>
        </div>
        <button type="button" className="medProtoAddButton" onClick={onAddMedication}>+ Medicamento</button>
      </header>

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
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar medicamento, dosagem, prescritor ou observação"
          />
        </label>
        <div className="medProtoFilters" role="group" aria-label="Filtrar medicamentos">
          {([
            ['all', 'Todos'],
            ['active', 'Em uso'],
            ['paused', 'Pausados'],
            ['finished', 'Finalizados'],
          ] as Array<[StatusFilter, string]>).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
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
              >
                <span className="medProtoPill" aria-hidden="true">●</span>
                <span className="medProtoMedicationText">
                  <strong>{item.medication.name} {item.medication.dosage}</strong>
                  <small>{item.stock} {item.medication.unit} em stock · código protegido</small>
                </span>
                <span className={statusClass(profile.status)}>{statusLabel(profile.status)}</span>
                <span className="medProtoChevron" aria-hidden="true">›</span>
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
              <div><span>Início registado</span><strong>{formatDate(selected.medication.startDate)}</strong></div>
              <div><span>Prescrito por</span><strong>{selectedProfile?.prescribedBy || 'Não registado'}</strong></div>
              <div><span>Observação</span><strong>{selectedProfile?.observation || 'Sem observação protegida'}</strong></div>
            </div>

            <section className="medProtoToday">
              <div className="medProtoSectionHeading">
                <div><span>HOJE</span><h4>Tomas programadas</h4></div>
              </div>
              {todayDoseRows.length ? todayDoseRows.map(({ schedule, event }) => (
                <div className="medProtoDoseRow" key={schedule.id}>
                  <strong>{schedule.localTime}</strong>
                  <span>{minorToDecimal(schedule.quantityMinor)} {selected.medication.unit}</span>
                  <span className={event?.status === 'taken' ? 'medProtoDoseTaken' : event?.status === 'not_taken' ? 'medProtoDoseNotTaken' : 'medProtoDosePending'}>
                    {event?.status === 'taken'
                      ? 'Tomada'
                      : event?.status === 'not_taken'
                        ? 'Não tomada'
                        : event?.status === 'postponed'
                          ? 'Adiada'
                          : 'Pendente'}
                  </span>
                </div>
              )) : <p className="medProtoEmptyInline">Sem horários válidos para hoje.</p>}
              <button type="button" className="stockPrimaryAction medProtoRegisterButton" onClick={() => scrollTo('medication-today-doses')}>
                Gerir tomas de hoje
              </button>
            </section>

            <nav className="medProtoTabs" aria-label="Detalhes do medicamento">
              <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Histórico</button>
              <button type="button" className={tab === 'evolution' ? 'active' : ''} onClick={() => setTab('evolution')}>Evolução</button>
              <button type="button" className={tab === 'information' ? 'active' : ''} onClick={() => setTab('information')}>Informações</button>
            </nav>

            {tab === 'history' ? (
              <div className="medProtoTimeline">
                <div className="medProtoTimelineNotice">Nada é apagado. Alterações, correções e configurações permanecem auditáveis.</div>
                {timeline.length ? timeline.slice(0, 80).map((item) => (
                  <div className="medProtoTimelineRow" key={item.id}>
                    <span className="medProtoTimelineIcon" aria-hidden="true">{timelineIcon(item.kind)}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                      <small>{formatDateTime(item.createdAt)}</small>
                    </div>
                  </div>
                )) : <p className="medProtoEmptyInline">Ainda não existe histórico protegido.</p>}
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

      {message ? <div className="medProtoMessage" role="status">{message}</div> : null}

      <p className="medProtoSafety">
        <strong>Regra principal:</strong> stock e tomas vêm dos registos guardados; não são inferidos. Correções acrescentam eventos,
        as notas mantêm revisões e os dados permanecem após atualizar a página. A cópia externa continua disponível em “Mais”
        para proteger contra perda do dispositivo ou limpeza total do navegador.
      </p>
    </section>
  )
}
