import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  MedicationDashboardSummary,
  MedicationLifecycleStatus,
  MedicationProtectedProfile,
  MedicationProtectionSummary,
  MedicationSnapshotStatus,
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
  onDataChanged: () => Promise<void>
}

const EMPTY_DASHBOARD: MedicationDashboardSummary = {
  medicationCount: 0,
  scheduledDoseCount: 0,
  takenDoseCount: 0,
  pendingDoseCount: 0,
  notTakenDoseCount: 0,
}

const EMPTY_SNAPSHOT: MedicationSnapshotStatus = {
  available: false,
  valid: false,
  medicationCount: 0,
  recordCount: 0,
  sizeBytes: 0,
  source: 'none',
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

function bytesLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  onDataChanged,
}: MedicationPrototypeWorkspaceProps) {
  const {
    personalStockService,
    medicationDataProtectionService,
  } = useAppServices()
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [profiles, setProfiles] = useState<Record<string, MedicationProtectedProfile>>({})
  const [dashboard, setDashboard] = useState<MedicationDashboardSummary>(EMPTY_DASHBOARD)
  const [snapshot, setSnapshot] = useState<MedicationSnapshotStatus>(EMPTY_SNAPSHOT)
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
    const [nextDashboard, nextSnapshot, profileEntries] = await Promise.all([
      medicationDataProtectionService.getTodayDashboard(today),
      medicationDataProtectionService.getRedundantSnapshotStatus(),
      Promise.all(medications.map(async (item) => [
        item.medication.id,
        await medicationDataProtectionService.getProfile(item.medication.id),
      ] as const)),
    ])
    const profileMap = Object.fromEntries(profileEntries) as Record<string, MedicationProtectedProfile>
    setDashboard(nextDashboard)
    setSnapshot(nextSnapshot)
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

  async function verifySelected() {
    if (!selectedId) return
    await medicationDataProtectionService.recordCheckpoint(selectedId, 'verificação manual no centro de medicação')
    await medicationDataProtectionService.syncRedundantSnapshot()
  }

  async function downloadMedicationBackup() {
    const text = await medicationDataProtectionService.exportMedicationSnapshotText()
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `foco-jornada-medicacao-${today}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
    await medicationDataProtectionService.syncRedundantSnapshot()
  }

  async function restoreMedicationBackup(file: File) {
    const text = await file.text()
    const result = await medicationDataProtectionService.mergeMedicationSnapshotText(text)
    setMessage(
      `Restauro protegido concluído: ${result.addedRecords} registo(s) acrescentado(s), sem apagar os dados locais existentes.`,
    )
    await onDataChanged()
    await loadWorkspace()
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="medProtoWorkspace" aria-labelledby="med-proto-title">
      <div className={`medProtoProtectionBanner ${protection?.status === 'OK' ? 'isOk' : 'needsCheck'}`}>
        <div className="medProtoShield" aria-hidden="true">✓</div>
        <div>
          <strong>{protection?.status === 'OK' ? 'PROTEÇÃO ATIVA' : 'PROTEÇÃO A VERIFICAR'}</strong>
          <span>
            Guardado em IndexedDB, histórico append-only e cópia redundante local. Nenhuma correção apaga o registo anterior.
          </span>
        </div>
        <button type="button" disabled={busy || !selectedId} onClick={() => void execute(verifySelected, 'Proteção verificada e ponto de proteção atualizado.')}>
          Verificar
        </button>
      </div>

      <header className="medProtoHeader">
        <div>
          <span className="stockPanelTag">GESTOR DE MEDICAÇÃO · COMPLETO</span>
          <h2 id="med-proto-title">Medicação</h2>
          <p>Registos persistentes, ações auditáveis e informação protegida. O sistema não altera nem recomenda tratamentos.</p>
        </div>
        <button type="button" className="medProtoAddButton" onClick={() => scrollTo('medication-create-form')}>+ Medicamento</button>
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
                <button type="button" onClick={() => scrollTo('medication-today-doses')}>Abrir ações completas</button>
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
                + Registar toma
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

      <section className="medProtoProtectionGrid">
        <article>
          <span>PROTEÇÃO INTEGRADA</span>
          <strong>{protection?.status === 'OK' ? 'Protegido' : 'Verificar'}</strong>
          <small>Identidade estável, checkpoints e revisões append-only.</small>
          <button type="button" onClick={() => scrollTo('medication-protection-integrated')}>Abrir proteção</button>
        </article>
        <article>
          <span>INTEGRIDADE DOS DADOS</span>
          <strong>{protection?.status ?? 'A VERIFICAR'}</strong>
          <small>{protection ? `${protection.movementCount + protection.scheduleCount + protection.doseEventCount} registos verificados` : 'Seleciona um medicamento'}</small>
          <button type="button" disabled={busy || !selectedId} onClick={() => void execute(verifySelected, 'Integridade verificada sem apagar ou reescrever registos.')}>
            Verificar agora
          </button>
        </article>
        <article>
          <span>LEDGER</span>
          <strong>{protection?.movementCount ?? 0} movimentos</strong>
          <small>{protection?.checkpointCount ?? 0} ponto(s) de proteção · {protection?.noteRevisionCount ?? 0} revisão(ões) de nota.</small>
          <button type="button" onClick={() => setTab('history')}>Ver histórico</button>
        </article>
        <article>
          <span>BACKUP E RESTAURO</span>
          <strong>{snapshot.valid ? 'Cópia local válida' : 'Criar cópia'}</strong>
          <small>
            {snapshot.valid
              ? `${snapshot.medicationCount} medicamento(s) · ${snapshot.recordCount} registos · ${bytesLabel(snapshot.sizeBytes)}`
              : 'A cópia externa permite recuperar dados mesmo fora deste navegador.'}
          </small>
          <div className="medProtoBackupActions">
            <button
              type="button"
              className="stockPrimaryAction"
              disabled={busy}
              onClick={() => void execute(downloadMedicationBackup, 'Cópia protegida criada e descarregada.')}
            >
              Fazer backup agora
            </button>
            <button type="button" disabled={busy} onClick={() => restoreInputRef.current?.click()}>
              Restaurar sem apagar
            </button>
            <input
              ref={restoreInputRef}
              className="medProtoHiddenInput"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.currentTarget.value = ''
                if (file) void execute(() => restoreMedicationBackup(file), 'Restauro protegido concluído.')
              }}
            />
          </div>
        </article>
      </section>

      {message ? <div className="medProtoMessage" role="status">{message}</div> : null}

      <p className="medProtoSafety">
        <strong>Regra principal:</strong> o fluxo de medicação não tem botão de eliminação. Correções acrescentam eventos,
        as notas mantêm revisões e o restauro desta área é feito por fusão, sem limpar os dados existentes. Atualizar a página
        ou fechar o navegador mantém os dados locais. Limpar todos os dados do site, perder o dispositivo ou desinstalar sem
        uma cópia externa ainda pode causar perda; por isso o backup externo continua disponível.
      </p>
    </section>
  )
}
