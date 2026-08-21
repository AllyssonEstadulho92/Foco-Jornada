import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_APP_SETTINGS, normalizeSettings, type AppSettings } from '../../domain/settings/AppSettings'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'

export function useSettingsController() {
  const { settingsRepository } = useAppServices()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const value = await settingsRepository.get()
        if (!cancelled) setSettings(value)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar definições.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [settingsRepository])

  const save = useCallback(
    async (next: AppSettings) => {
      try {
        setIsBusy(true)
        setError(null)
        const normalized = normalizeSettings(next)
        await settingsRepository.save(normalized)
        setSettings(normalized)
        pushAppNotification('success', 'Definições guardadas', 'As preferências foram atualizadas neste dispositivo.')
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : 'Erro ao guardar definições.'
        setError(message)
        pushAppNotification('error', 'Erro nas definições', message)
      } finally {
        setIsBusy(false)
      }
    },
    [settingsRepository],
  )

  return { settings, setSettings, save, isLoading, isBusy, error }
}
