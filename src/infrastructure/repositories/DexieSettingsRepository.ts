import type { SettingsRepository } from '../../application/settings/SettingsRepository'
import {
  DEFAULT_APP_SETTINGS,
  normalizeSettings,
  type AppSettings,
} from '../../domain/settings/AppSettings'
import type { AppDatabase } from '../database/appDatabase'

const SETTINGS_KEY = 'app-settings'

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly database: AppDatabase) {}

  async get(): Promise<AppSettings> {
    const record = await this.database.metadata.get(SETTINGS_KEY)
    if (!record) return DEFAULT_APP_SETTINGS

    try {
      return normalizeSettings(JSON.parse(record.value) as Partial<AppSettings>)
    } catch {
      return DEFAULT_APP_SETTINGS
    }
  }

  async save(settings: AppSettings): Promise<void> {
    const normalized = normalizeSettings(settings)
    await this.database.metadata.put({
      key: SETTINGS_KEY,
      value: JSON.stringify(normalized),
      updatedAt: new Date().toISOString(),
    })
  }
}
