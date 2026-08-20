import type { AppSettings } from '../../domain/settings/AppSettings'

export interface SettingsRepository {
  get(): Promise<AppSettings>
  save(settings: AppSettings): Promise<void>
}
