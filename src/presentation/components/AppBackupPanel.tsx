import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'

function backupFileName(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `foco-jornada-backup-${date}.json`
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

type StorageProtection = 'checking' | 'persistent' | 'best-effort' | 'unsupported'
type IntegrityState = 'idle' | 'checking' | 'ok' | 'error'

export function AppBackupPanel() {
  const { backupService, personalStockService, dataIntegrityService } = useAppServices()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [storageProtection, setStorageProtection] = useState<StorageProtection>('checking')
  const [integrityState, setIntegrityState] = useState<IntegrityState>('idle')
  const [integrityDetail, setIntegrityDetail] = useState('Ainda não verificado nesta página.')

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
      setMessage('Este navegador não disponibiliza a API de armazenamento persistente. Mantém cópias integrais externas atualizadas.')
      return
    }
    try {
      const granted = await navigator.storage.persist()
      setStorageProtection(granted ? 'persistent' : 'best-effort')
      setMessage(granted
        ? 'O navegador marcou o armazenamento local como persistente neste dispositivo.'
        : 'O navegador não concedeu persistência permanente. Os dados continuam guardados localmente; cria também cópias integrais externas.')
    } catch {
      setStorageProtection('unsupported')
      setMessage('Não foi possível pedir armazenamento persistente neste navegador. Cria também cópias integrais externas.')
    }
  }

  async function verifyIntegrity() {
    if (busy || integrityState === 'checking') return
    setIntegrityState('checking')
    setIntegrityDetail('A verificar referências, estados ativos, ledger de stock e eventos de medicação…')
    try {
      const report = await dataIntegrityService.audit()
      if (report.ok) {
        setIntegrityState('ok')
        setIntegrityDetail(
          `Integridade OK · ${report.counts.journeys} jornadas · ${report.counts.stockMovements} movimentos de stock · ${report.counts.medicationDoseEvents} eventos de medicação.`,
        )
        pushAppNotification('success', 'Integridade dos dados verificada', 'Não foram encontradas inconsistências estruturais.')
      } else {
        setIntegrityState('error')
        setIntegrityDetail(`${report.issues.length} inconsistência(s) detetada(s). Os dados não foram alterados. Cria uma cópia antes de qualquer correção.`)
        pushAppNotification('error', 'Integridade dos dados requer atenção', report.issues[0]?.detail ?? 'Foram detetadas inconsistências.')
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Não foi possível verificar a integridade dos dados.'
      setIntegrityState('error')
      setIntegrityDetail(detail)
      pushAppNotification('error', 'Falha na verificação de integridade', detail)
    }
  }

  async function exportBackup() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const report = await dataIntegrityService.audit()
      if (!report.ok) {
        throw new Error('A cópia não foi criada porque a auditoria encontrou inconsistências. Revê o estado dos dados antes de exportar.')
      }
      const content = await backupService.exportText()
      downloadText(content, backupFileName())
      setMessage('Cópia integral criada com os dados persistentes da base de dados e o estado operacional suportado do browser.')
      setIntegrityState('ok')
      setIntegrityDetail('Integridade verificada imediatamente antes da exportação.')
      pushAppNotification('success', 'Cópia de segurança criada', 'O ficheiro integral foi validado e guardado no dispositivo.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Não foi possível criar a cópia de segurança.'
      setMessage(detail)
      pushAppNotification('error', 'Falha no backup', detail)
    } finally {
      setBusy(false)
    }
  }

  async function restoreFile(file: File) {
    if (busy) return
    const confirmed = window.confirm(
      'Restaurar esta cópia substitui todos os dados locais atuais do Foco Jornada neste dispositivo. Queres continuar?',
    )
    if (!confirmed) return

    setBusy(true)
    setMessage('')
    try {
      const content = await file.text()
      const summary = await backupService.restoreFromText(content)
      const diagnostic = await personalStockService.diagnostic()
      if (diagnostic.integrity !== 'OK') {
        throw new Error('O restauro terminou, mas a reconciliação do stock detetou uma inconsistência.')
      }
      const integrity = await dataIntegrityService.audit()
      if (!integrity.ok) {
        throw new Error(`O restauro terminou, mas a auditoria global encontrou ${integrity.issues.length} inconsistência(s).`)
      }
      const total = Object.values(summary.tableCounts).reduce((sum, count) => sum + count, 0)
      setMessage(`Restauro concluído: ${total} registos recuperados e validados. A aplicação será recarregada.`)
      setIntegrityState('ok')
      setIntegrityDetail('Restauro validado pela reconciliação de stock e pela auditoria global.')
      pushAppNotification('success', 'Dados restaurados', 'A cópia integral foi validada e restaurada.')
      window.setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Não foi possível restaurar esta cópia.'
      setMessage(detail)
      pushAppNotification('error', 'Falha no restauro', detail)
    } finally {
      setBusy(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void restoreFile(file)
  }

  const storageLabel = storageProtection === 'persistent'
    ? 'PERSISTENTE'
    : storageProtection === 'best-effort'
      ? 'LOCAL'
      : storageProtection === 'unsupported'
        ? 'LOCAL'
        : 'A VERIFICAR'

  const integrityLabel = integrityState === 'ok'
    ? 'ÍNTEGRO'
    : integrityState === 'error'
      ? 'ATENÇÃO'
      : integrityState === 'checking'
        ? 'A VERIFICAR'
        : 'VERIFICAR'

  return (
    <section className="stockPanel appBackupPanel" aria-labelledby="app-backup-title">
      <div className="stockPanelHeading">
        <div>
          <span className="stockPanelTag">DADOS · INTEGRAL</span>
          <h2 id="app-backup-title">Cópia de segurança e restauro</h2>
        </div>
        <span className="stockStatusOk">{storageLabel}</span>
      </div>

      <p>
        A cópia inclui jornada, pausas, atividades, foco, café, definições, notas e as quatro tabelas do stock pessoal:
        entidades, movimentos, horários de medicação e eventos de toma. Inclui ainda horas registadas, configuração e planos de vencimento,
        mapa de turnos, preferências da aplicação, centro de notificações e o estado técnico de uma sessão glo em curso.
      </p>

      <div className="stockMetricGrid appBackupMetrics">
        <article className="stockMetric">
          <span>Formato</span>
          <strong>JSON versionado</strong>
          <small>Preparado para validação antes do restauro.</small>
        </article>
        <article className="stockMetric">
          <span>Restauro</span>
          <strong>Transação única</strong>
          <small>Ou restaura o conjunto completo, ou a operação falha.</small>
        </article>
        <article className="stockMetric">
          <span>Integridade</span>
          <strong>{integrityLabel}</strong>
          <small>{integrityDetail}</small>
        </article>
      </div>

      <div className="appBackupActions">
        <button className="stockPrimaryAction" type="button" disabled={busy} onClick={() => void exportBackup()}>
          {busy ? 'A processar…' : 'Criar cópia integral'}
        </button>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          Restaurar cópia
        </button>
        <button type="button" disabled={busy || integrityState === 'checking'} onClick={() => void verifyIntegrity()}>
          {integrityState === 'checking' ? 'A verificar…' : 'Verificar integridade'}
        </button>
        {storageProtection !== 'persistent' ? (
          <button type="button" disabled={busy} onClick={() => void requestPersistentStorage()}>
            Proteger armazenamento neste dispositivo
          </button>
        ) : null}
        <input
          ref={inputRef}
          className="appBackupFileInput"
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          aria-label="Selecionar cópia de segurança do Foco Jornada"
        />
      </div>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}
      <p><strong>Aviso:</strong> nenhum armazenamento apenas no navegador permite garantir perda zero. Para proteção máxima, mantém uma cópia integral externa atualizada antes de limpar dados do browser, trocar de dispositivo ou restaurar uma cópia antiga.</p>
    </section>
  )
}
