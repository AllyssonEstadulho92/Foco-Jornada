import type { SettingsRepository } from '../application/settings/SettingsRepository'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '../domain/settings/AppSettings'

export class InMemorySettingsRepository implements SettingsRepository {
  constructor(private settings: AppSettings = DEFAULT_APP_SETTINGS) {}

  async get(): Promise<AppSettings> {
    return { ...this.settings }
  }

  async save(settings: AppSettings): Promise<void> {
    this.settings = { ...settings }
  }
}
