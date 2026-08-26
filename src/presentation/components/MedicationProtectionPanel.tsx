import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MedicationProtectionSummary } from '../../application/personalStock/MedicationDataProtectionService'
import type { MedicationSummary } from '../../domain/personalStock/models'
import { useAppServices } from '../providers/AppServicesProvider'

type StorageProtection = 'checking' | 'persistent' | 'best-effort' | 'unsupported'

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

function storageLabel(value: StorageProtection): string {
  if (value === 'persistent') return 'PERSISTENTE'
  if (value === 'checking') return 'A VERIFICAR'
  if (value === 'unsupported') return 'NÃO SUPORTADO'
  return 'MELHOR ESFORÇO'
}

export function MedicationProtectionPanel() {
  const { personalStockService, medicationDataProtectionService } = useAppServices()
  const [medications, setMedications] = useState<MedicationSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [summary, setSummary] = useState<MedicationProtectionSummary | null>(null)
  const [note, setNote] = useState('')
  const [noteReady, setNoteReady] = useState(false)
  const [noteState, setNoteState] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [storageProtection, setStorageProtection] = useState<StorageProtection>('checking')

  const selected = useMemo(
    () => medications.find((item) => item.medication.id === selectedId) ?? null,
    [medications, selectedId],
  )

  const load = useCallback(async () => {
    const list = await personalStockService.listMedications()
    setMedications(list)
    const nextId = selectedId && list.some((item) => item.medication.id === selectedId)
      ? selectedId
      : list[0]?.medication.id ?? ''
    setSelectedId(nextId)
    if (!nextId) {
      setSummary(null)
      setNote('')
      setNoteReady(false)
      return
    }
    const [nextSummary, nextNote] = await Promise.all([
      medicationDataProtectionService.verifyMedication(nextId),
      medicationDataProtectionService.getProtectedNote(nextId),
    ])
    setSummary(nextSummary)
    setNote(nextNote)
    setNoteReady(true)
  }, [medicationDataProtectionService, personalStockService, selectedId])

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a proteção da medicação.'))
  }, [load])

  useEffect(() => {
    if (!selectedId || !noteReady) return
    setNoteState('A guardar…')
    const timer = window.setTimeout(() => {
      void medicationDataProtectionService.saveProtectedNote(selectedId, note)
        .then(async (result) => {
          setNoteState(result.changed
            ? 'Nota guardada. A versão anterior permanece no histórico protegido.'
            : 'Nota já guardada.')
          setSummary(await medicationDataProtectionService.verifyMedication(selectedId))
        })
        .catch((error: unknown) => {
          setNoteState(error instanceof Error ? error.message : 'Não foi possível guardar a nota protegida.')
        })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [medicationDataProtectionService, note, noteReady, selectedId])

  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setStorageProtection('unsupported')
      return
    }
    void navigator.storage.persisted()
      .then((persistent) => setStorageProtection(persistent ? 'persistent' : 'best-effort'))
      .catch(() => setStorageProtection('unsupported'))
  }, [])

  async function switchMedication(medicationId: string) {
    setSelectedId(medicationId)
    setNoteReady(false)
    setNoteState('')
    setMessage('')
    if (!medicationId) return
    try {
      const [nextSummary, nextNote] = await Promise.all([
        medicationDataProtectionService.verifyMedication(medicationId),
        medicationDataProtectionService.getProtectedNote(medicationId),
      ])
      setSummary(nextSummary)
      setNote(nextNote)
      setNoteReady(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a proteção deste medicamento.')
    }
  }

  async function createCheckpoint() {
    if (!selectedId || busy) return
    setBusy(true)
    setMessage('')
    try {
      const result = await medicationDataProtectionService.recordCheckpoint(selectedId, 'ponto de proteção manual')
      setSummary(result.summary)
      setMessage(result.created
        ? 'Novo ponto de proteção criado sem apagar os registos anteriores.'
        : 'Os dados protegidos não mudaram; o último ponto já representa exatamente este estado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar o ponto de proteção.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyAll() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const summaries = await medicationDataProtectionService.protectAllMedications()
      if (selectedId) {
        const current = summaries.find((item) => item.medicationId === selectedId)
        if (current) setSummary(current)
      }
      const inconsistent = summaries.filter((item) => item.status !== 'OK')
      setMessage(inconsistent.length
        ? `${inconsistent.length} medicamento(s) apresentam inconsistências e exigem verificação.`
        : `${summaries.length} medicamento(s) verificados. Nenhum registo foi apagado ou reescrito.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível verificar a proteção.')
    } finally {
      setBusy(false)
    }
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      setStorageProtection('unsupported')
      setMessage('Este navegador não permite pedir armazenamento persistente. Mantém também uma cópia integral externa.')
      return
    }
    try {
      const granted = await navigator.storage.persist()
      setStorageProtection(granted ? 'persistent' : 'best-effort')
      setMessage(granted
        ? 'O navegador marcou o armazenamento local como persistente neste dispositivo.'
        : 'O navegador não concedeu persistência permanente. A cópia integral externa continua recomendada.')
    } catch {
      setStorageProtection('unsupported')
      setMessage('Não foi possível pedir persistência ao navegador.')
    }
  }

  if (!medications.length) return null

  return (
    <section className="medicationProtectionPanel" id="medication-protection-integrated" aria-labelledby="medication-protection-title">
      <div className="medicationProtectionHeading">
        <div>
          <span className="stockPanelTag">PROTEÇÃO INTEGRADA · MEDICAÇÃO</span>
          <h2 id="medication-protection-title">Preservação permanente dentro da aplicação</h2>
          <p>
            O medicamento recebe um código estável, os registos clínico-operacionais permanecem append-only e as notas mantêm
            todas as revisões. Atualizar ou corrigir acrescenta informação; não apaga o histórico anterior.
          </p>
        </div>
        <span className={summary?.status === 'OK' ? 'stockStatusOk' : 'stockStatusError'}>
          {summary?.status ?? 'A VERIFICAR'}
        </span>
      </div>

      <label className="medicationProtectionSelector">
        Medicamento protegido
        <select value={selectedId} onChange={(event) => void switchMedication(event.target.value)}>
          {medications.map((item) => (
            <option key={item.medication.id} value={item.medication.id}>
              {item.medication.name} · {item.medication.dosage}
            </option>
          ))}
        </select>
      </label>

      {selected && summary ? (
        <>
          <div className="medicationProtectionGrid">
            <article>
              <span>Código único</span>
              <strong className="medicationProtectionCode">{summary.code}</strong>
              <small>Derivado do ID imutável do medicamento</small>
            </article>
            <article>
              <span>Stock auditável</span>
              <strong>{selected.stock} {selected.medication.unit}</strong>
              <small>{summary.movementCount} movimentos preservados</small>
            </article>
            <article>
              <span>Horários</span>
              <strong>{summary.scheduleCount}</strong>
              <small>Registos persistentes em IndexedDB</small>
            </article>
            <article>
              <span>Eventos de toma</span>
              <strong>{summary.doseEventCount}</strong>
              <small>Tomadas, adiamentos e correções</small>
            </article>
            <article>
              <span>Pontos de proteção</span>
              <strong>{summary.checkpointCount}</strong>
              <small>{summary.lastCheckpointAt ? `Último: ${formatDateTime(summary.lastCheckpointAt)}` : 'Ainda sem checkpoint manual'}</small>
            </article>
            <article>
              <span>Proteção do navegador</span>
              <strong>{storageLabel(storageProtection)}</strong>
              <small>Persistência local do dispositivo</small>
            </article>
          </div>

          <label className="medicationProtectedNotes">
            Notas protegidas deste medicamento
            <textarea
              maxLength={10_000}
              value={note}
              placeholder="Informações importantes sobre este medicamento. Cada alteração guardada mantém a versão anterior no histórico."
              onChange={(event) => setNote(event.target.value)}
            />
            <small>{noteState || `${summary.noteRevisionCount} revisão(ões) protegida(s). Guardado automaticamente.`}</small>
          </label>

          {summary.problems.length ? (
            <div className="medicationProtectionProblems" role="alert">
              <strong>Inconsistências encontradas</strong>
              {summary.problems.slice(0, 5).map((problem) => <span key={problem}>{problem}</span>)}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="medicationProtectionActions">
        <button type="button" className="stockPrimaryAction" disabled={busy || !selectedId} onClick={() => void createCheckpoint()}>
          {busy ? 'A verificar…' : 'Criar ponto de proteção'}
        </button>
        <button type="button" disabled={busy} onClick={() => void verifyAll()}>Verificar todos</button>
        {storageProtection !== 'persistent' ? (
          <button type="button" disabled={busy} onClick={() => void requestPersistentStorage()}>Proteger armazenamento</button>
        ) : null}
      </div>

      {message ? <div className="stockIntegrityMessage" role="status">{message}</div> : null}

      <p className="medicationProtectionFootnote">
        A proteção integrada evita eliminações no fluxo normal, mantém revisões de notas e verifica referências entre medicamento,
        horários, movimentos e eventos de toma. Os dados permanecem após sair ou atualizar a página porque são guardados em
        IndexedDB e entram na cópia integral. Para perda zero perante avaria, perda do telemóvel ou limpeza total do navegador,
        continua a ser necessária uma cópia externa atualizada.
      </p>
    </section>
  )
}
