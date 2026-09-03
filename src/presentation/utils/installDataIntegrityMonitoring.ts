import { secureStorage } from '../../security/secureStorage'
import type { AppDataIntegrityService } from '../../application/data/AppDataIntegrityService'
import { pushAppNotification } from '../store/useNotificationStore'

const STORAGE_KEY = 'foco-jornada:data-integrity:last-alert:v1'
const MIN_AUDIT_INTERVAL_MS = 5 * 60 * 1000

function fingerprint(codes: string[]): string {
  return [...new Set(codes)].sort().join('|')
}

export function installDataIntegrityMonitoring(service: AppDataIntegrityService): () => void {
  let running = false
  let lastAuditAt = 0

  const audit = async (force = false) => {
    const now = Date.now()
    if (running || (!force && now - lastAuditAt < MIN_AUDIT_INTERVAL_MS)) return
    running = true
    lastAuditAt = now
    try {
      const report = await service.audit()
      if (report.ok) {
        secureStorage.removeItem(STORAGE_KEY)
        return
      }

      const currentFingerprint = fingerprint(report.issues.map((item) => item.code))
      const previousFingerprint = secureStorage.getItem(STORAGE_KEY)
      if (currentFingerprint === previousFingerprint) return

      secureStorage.setItem(STORAGE_KEY, currentFingerprint)
      pushAppNotification(
        'error',
        'Verificação de dados requer atenção',
        `Foram detetadas ${report.issues.length} inconsistência(s). Não foram alterados dados automaticamente. Faz uma cópia de segurança antes de corrigir ou restaurar registos.`,
      )
    } catch {
      pushAppNotification(
        'error',
        'Não foi possível verificar os dados',
        'A auditoria local de integridade falhou. Os dados não foram modificados.',
      )
    } finally {
      running = false
    }
  }

  void audit(true)

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void audit()
  }
  const handleFocus = () => void audit()

  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleFocus)
  window.addEventListener('pageshow', handleFocus)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('pageshow', handleFocus)
  }
}
