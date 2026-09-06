import { useEffect, useMemo } from 'react'
import {
  createNativeTimerSnapshot,
  type CreateNativeTimerSnapshotInput,
} from '../../application/native/createNativeTimerSnapshot'
import { syncIOSNativeTimers } from '../../infrastructure/native/iosNativeTimerBridge'

export function useIOSNativeTimerBridge({
  activeJourney,
  activeBreak,
  activeFocus,
}: CreateNativeTimerSnapshotInput): void {
  const snapshot = useMemo(
    () => createNativeTimerSnapshot({ activeJourney, activeBreak, activeFocus }),
    [activeBreak, activeFocus, activeJourney],
  )

  useEffect(() => {
    syncIOSNativeTimers(snapshot)
  }, [snapshot])
}
