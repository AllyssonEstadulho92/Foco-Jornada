import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { AppBackupService, type AppBackupPayload } from './AppBackupService'

export class ReleaseAppBackupService extends AppBackupService {
  constructor(database: AppDatabase) {
    super(database)
  }

  override async exportText(): Promise<string> {
    const raw = await super.exportText()
    const payload = JSON.parse(raw) as AppBackupPayload & { format?: string }
    if (payload.format !== 'foco-jornada-backup') return raw
    payload.appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : payload.appVersion
    return JSON.stringify(payload, null, 2)
  }
}
