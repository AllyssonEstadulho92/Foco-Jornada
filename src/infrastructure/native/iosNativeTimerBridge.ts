import type { NativeTimerSnapshot } from '../../application/native/createNativeTimerSnapshot'

interface IOSMessageHandler {
  postMessage(message: unknown): void
}

interface IOSWebKitBridge {
  messageHandlers?: {
    focoJornadaTimer?: IOSMessageHandler
  }
}

type IOSBridgeWindow = Window & {
  webkit?: IOSWebKitBridge
}

function getHandler(): IOSMessageHandler | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as IOSBridgeWindow).webkit?.messageHandlers?.focoJornadaTimer
}

export function isIOSNativeTimerBridgeAvailable(): boolean {
  return Boolean(getHandler())
}

export function syncIOSNativeTimers(snapshot: NativeTimerSnapshot): boolean {
  const handler = getHandler()
  if (!handler) return false

  try {
    handler.postMessage(snapshot)
    return true
  } catch {
    // O bridge é uma melhoria opcional. Uma falha nativa nunca deve interromper a PWA.
    return false
  }
}
