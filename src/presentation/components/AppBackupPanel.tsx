import { useRef, useState, type ChangeEvent } from 'react'
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

export function AppBackupPanel() {
  const { backupService, personalStockService } = useAppServices()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function exportBackup() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const content = await backupService.exportText()
      downloadText(content, backupFileName())
      setMessage('Cópia integral criada com todos os dados locais, incluindo stock pessoal.')
      pushAppNotification('success', 'Cópia de segurança criada', 'O ficheiro integral foi guardado no dispositivo.')
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
      const total = Object.values(summary.tableCounts).reduce((sum, count) => sum + count, 0)
      setMessage(`Restauro concluído: ${total} registos recuperados. A aplicação será recarregada.`)
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

  return (
    <section className="stockPanel appBackupPanel" aria-labelledby="app-backup-title">
      <div className="stockPanelHeading">
        <div>
          <span className="stockPanelTag">DADOS · INTEGRAL</span>
          <h2 id="app-backup-title">Cópia de segurança e restauro</h2>
        </div>
        <span className="stockStatusOk">LOCAL</span>
      </div>

      <p>
        A cópia inclui jornada, pausas, atividades, foco, café, definições e as quatro tabelas do stock pessoal:
        entidades, movimentos, horários de medicação e eventos de toma.
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
          <span>Stock</span>
          <strong>Incluído</strong>
          <small>Ledger, horários e estados das tomas seguem no mesmo ficheiro.</small>
        </article>
      </div>

      <div className="appBackupActions">
        <button className="stockPrimaryAction" type="button" disabled={busy} onClick={() => void exportBackup()}>
          {busy ? 'A processar…' : 'Criar cópia integral'}
        </button>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          Restaurar cópia
        </button>
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
      <p><strong>Aviso:</strong> antes de restaurar uma cópia antiga, cria primeiro uma cópia do estado atual se pretenderes preservá-lo.</p>
    </section>
  )
}
