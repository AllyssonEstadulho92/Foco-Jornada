import { useEffect, useState } from 'react'

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 250 ? Math.round(intervalMs) : 1000
    let timer: number | null = null

    const syncNow = () => setNow(new Date())
    const scheduleNext = () => {
      if (timer !== null) window.clearTimeout(timer)
      const current = Date.now()
      const remainder = current % safeInterval
      const delay = Math.max(25, safeInterval - remainder)
      timer = window.setTimeout(() => {
        syncNow()
        scheduleNext()
      }, delay)
    }

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      syncNow()
      scheduleNext()
    }

    syncNow()
    scheduleNext()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    window.addEventListener('pageshow', handleVisibility)

    return () => {
      if (timer !== null) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
      window.removeEventListener('pageshow', handleVisibility)
    }
  }, [intervalMs])

  return now
}
