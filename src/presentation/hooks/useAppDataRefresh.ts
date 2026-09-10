import { useEffect } from 'react'
import { APP_DATA_CHANGED_EVENT } from '../events/appDataChanged'

export function useAppDataRefresh(refresh: () => Promise<unknown>): void {
  useEffect(() => {
    const handleRefresh = () => {
      void refresh()
    }

    window.addEventListener(APP_DATA_CHANGED_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_CHANGED_EVENT, handleRefresh)
  }, [refresh])
}
