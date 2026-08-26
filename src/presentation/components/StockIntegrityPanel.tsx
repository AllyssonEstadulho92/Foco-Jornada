import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { minorToDecimal } from '../../application/personalStock/decimal'
import type { ReconciliationResult } from '../../domain/personalStock/models'
import { useAppServices } from '../providers/AppServicesProvider'

type IntegrityScope = 'sticks' | 'medications'
type StorageProtection = 'checking' | 'persistent' | 'best-effort' | 'unsupported'

interface IntegrityAudit {
  status: 'OK' | 'INCONSISTÊNCIA' | 'SEM DADOS'
  reconciliation: ReconciliationResult | null
  entityCount: number
  movementCount: number
  balanceLabel: string
  backupRecords: number
  metadataRecords: number
  checkedAt: string
}

function formatCheckTime(value: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function storageLabel(value: StorageProtection): string {
  if (value === 'persistent') return 'PERSISTENTE'
  if (value === 'checking') return 'A VERIFICAR'
  return 'LOCAL'
}

export function StockIntegrityPanel({ scope }: { scope: IntegrityScope }) {
  const { personalStockService, backupService } = useAppServices()
  const [audit, setAudit] = useState<IntegrityAudit | null>(null)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [storageProtection, setStorageProtection] = useState<StorageProtection>('checking')

  const verify = useCallback(async () => {
    if (checking) return
    setChecking(true)
    setMessage('')
    try {
      const [diagnostic, backup] = await Promise.all([
        personalStockService.diagnostic(),
        backupService.createPayload(),
      ])

      const stockBackupRecords = backup.tables.stockEntities.length
        + backup.tables.stockMovements.length
        + backup.tables.medicationSchedules.length
        + backup.tables.medicationDoseEvents.length

      if (scope === 'sticks') {
        const reconciliation = diagnostic.sticks
        setAudit({
          status: reconciliation ? (reconciliation.ok ? 'OK' : 'INCONSISTÊNCIA') : 'SEM DADOS',
          reconciliation,
          entityCount: reconciliation ? 1 : 0,
          movementCount: reconciliation?.movementCount ?? 0,
          balanceLabel: reconciliation ? `${reconciliation.reconstructedMinor} sticks` : 'Stock ainda não iniciado',
          backupRecords: stockBackupRecords,
          metadataRecords: backup.tables.metadata.length,
          checkedAt: new Date().toISOString(),
        })
      } else {
        const entityCount = diagnostic.medications.length
        const movementCount = diagnostic.medications.reduce(
          (total, item) => total + item.reconciliation.movementCount,
          0,
        )
        const allOk = diagnostic.medications.every((item) => item.reconciliation.ok)
        const balanceLabel = entityCount
          ? diagnostic.medications
            .map((item) => `${item.name}: ${minorToDecimal(item.reconciliation.reconstructedMinor)}`)
            .join(' · ')
          : 'Ainda não existem medicamentos'

        setAudit({
          status: entityCount ? (allOk ? 'OK' : 'INCONSISTÊNCIA') : 'SEM DADOS',
          reconciliation: null,
          entityCount,
          movementCount,
          balanceLabel,
          backupRecords: stockBackupRecords,
          metadataRecords: backup.tables.metadata.length,
          checkedAt: new Date().toISOString(),
        })
      }

      setMessage('Verificação concluída: ledger reconstruído e cópia integral preparada em memória sem alterar dados.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível verificar a integridade.')
    } finally {
      setChecking(false)
    }
  }, [backupService, checking, personalStockService, scope])

  useEffect(() => {
    void verify()
  }, [verify])

  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setStorageProtection('unsupported')
      return
    }
    void navigator.storage.persisted()
      .then((persistent) => setStorageProtection(persistent ? 'persistent' : 'best-effort'))
      .catch(() => setStorageProtection('unsupported'))
  }, [])

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      setStorageProtection('unsupported')
      setMessage('Este navegador não permite pedir armazenamento persistente. Usa também uma cópia integral externa.')
      return
    }

    try {
      const granted = await navigator.storage.persist()
      setStorageProtection(granted ? 'persistent' : 'best-effort')
      setMessage(granted
        ? 'Armazenamento local marcado como persistente neste dispositivo.'
        : 'O navegador não concedeu persistência permanente. Os dados continuam locais; mantém também uma cópia integral externa.')
    } catch {
      setStorageProtection('unsupported')
      setMessage('Não foi possível pedir persistência ao navegador. Mantém uma cópia integral externa atualizada.')
    }
  }

  const scopeTitle = scope === 'sticks' ? 'Sticks glo' : 'Medicamentos'
  const statusClass = audit?.status === 'OK'
    ? 'stockStatusOk'
    : audit?.status === 'INCONSISTÊNCIA'
      ? 'stockStatusError'
      : 'stockStatusNeutral'

  return (
    <section className="stockIntegrityConsole" aria-labelledby={`stock-integrity-${scope}`}>
      <div className="stockIntegrityConsoleHeading">
        <div>
          <span className="stockPanelTag">REGRA DE INTEGRIDADE · FUNCIONAL</span>
          <h2 id={`stock-integrity-${scope}`}>Verificação de {scopeTitle}</h2>
          <p>
            Nas operações normais, o saldo nunca é reescrito manualmente: é reconstruído pelo ledger. Correções acrescentam
            movimentos ou eventos de correção e mantêm o registo anterior para auditoria.
          </p>
        </div>
        <span className={statusClass}>{checking ? 'A VERIFICAR' : audit?.status ?? 'A VERIFICAR'}</span>
      </div>

      <div className="stockIntegrityMetricGrid">
        <article>
          <span>Entidades verificadas</span>
          <strong>{audit?.entityCount ?? '—'}</strong>
          <small>{scope === 'sticks' ? 'Gestor de sticks' : 'Medicamentos guardados'}</small>
        </article>
        <article>
          <span>Movimentos auditados</span>
          <strong>{audit?.movementCount ?? '—'}</strong>
          <small>Sequência e saldos reconstruídos</small>
        </article>
        <article>
          <span>Resultado reconstruído</span>
          <strong>{audit?.balanceLabel ?? '—'}</strong>
          <small>{audit?.checkedAt ? `Verificado em ${formatCheckTime(audit.checkedAt)}` : 'Ainda não verificado'}</small>
        </article>
        <article>
          <span>Proteção local</span>
          <strong>{storageLabel(storageProtection)}</strong>
          <small>IndexedDB + pedido de persistência do navegador</small>
        </article>
        <article>
          <span>Cobertura da cópia</span>
          <strong>{audit?.backupRecords ?? '—'} registos</strong>
          <small>{audit?.metadataRecords ?? '—'} notas/configurações em metadata</small>
        </article>
      </div>

      <div className="stockIntegrityActions">
        <button type="button" className="stockPrimaryAction" disabled={checking} onClick={() => void verify()}>
          {checking ? 'A verificar…' : 'Verificar integridade agora'}
        </button>
        {storageProtection !== 'persistent' ? (
          <button type="button" disabled={checking} onClick={() => void requestPersistentStorage()}>
            Proteger armazenamento
          </button>
        ) : null}
        <Link to="/mais">Abrir cópia e restauro</Link>
      </div>

      {message ? <div className="stockIntegrityMessage" role="status">{message}</div> : null}

      <p className="stockIntegritySafetyNote">
        <strong>Regra de preservação:</strong> a aplicação valida a cópia antes do restauro e inclui entidades, movimentos,
        horários, eventos de toma, notas e configurações. Nenhum navegador consegue garantir perda zero sozinho; para máxima
        proteção, mantém também uma cópia integral externa atualizada.
      </p>
    </section>
  )
}
