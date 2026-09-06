import { createNativeTimerSnapshot } from '../../application/native/createNativeTimerSnapshot'
import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { JourneyRepository } from '../../application/journey/JourneyRepository'
import {
  isIOSNativeTimerBridgeAvailable,
  syncIOSNativeTimers,
} from '../../infrastructure/native/iosNativeTimerBridge'

interface IOSNativeTimerCoordinatorServices {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  focusRepository: FocusRepository
}

const PROVIDER_REFRESH_MS = 15_000
const ACTION_SETTLE_MS = 250

const EMPTY_SNAPSHOT = createNativeTimerSnapshot({})

async function collectSnapshot(services: IOSNativeTimerCoordinatorServices) {
  const activeJourney = await services.journeyRepository.getActive()
  if (!activeJourney) return EMPTY_SNAPSHOT

  const [activeBreak, activeFocus] = await Promise.all([
    services.breakRepository.getActiveForJourney(activeJourney.id),
    services.focusRepository.getOpenForJourney(activeJourney.id),
  ])

  return createNativeTimerSnapshot({
    activeJourney,
    activeBreak,
    activeFocus,
  })
}

export function installIOSNativeTimerCoordinator(
  services: IOSNativeTimerCoordinatorServices,
): () => void {
  if (!isIOSNativeTimerBridgeAvailable()) return () => {}

  let refreshTimer: number | null = null
  let actionTimer: number | null = null
  let syncing = false
  let stopped = false

  const syncNow = async () => {
    if (stopped || syncing) return
    syncing = true
    try {
      syncIOSNativeTimers(await collectSnapshot(services))
    } catch {
      // A camada nativa é opcional: falhas de sincronização não podem alterar o domínio Web.
    } finally {
      syncing = false
    }
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void syncNow()
  }
  const handleUserAction = () => {
    if (actionTimer !== null) window.clearTimeout(actionTimer)
    actionTimer = window.setTimeout(() => void syncNow(), ACTION_SETTLE_MS)
  }

  void syncNow()
  refreshTimer = window.setInterval(() => void syncNow(), PROVIDER_REFRESH_MS)
  document.addEventListener('visibilitychange', handleVisibility)
  document.addEventListener('click', handleUserAction, true)
  window.addEventListener('focus', syncNow)
  window.addEventListener('pageshow', syncNow)
  window.addEventListener('storage', syncNow)

  return () => {
    stopped = true
    if (refreshTimer !== null) window.clearInterval(refreshTimer)
    if (actionTimer !== null) window.clearTimeout(actionTimer)
    document.removeEventListener('visibilitychange', handleVisibility)
    document.removeEventListener('click', handleUserAction, true)
    window.removeEventListener('focus', syncNow)
    window.removeEventListener('pageshow', syncNow)
    window.removeEventListener('storage', syncNow)
    syncIOSNativeTimers(EMPTY_SNAPSHOT)
  }
}
