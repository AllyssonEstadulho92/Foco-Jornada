/* eslint-disable react-refresh/only-export-components -- contexto e hook pertencem à mesma unidade de segurança. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  securityManager,
  type SecuritySession,
} from './SecurityManager'

interface SecurityContextValue {
  session: SecuritySession
  lock: () => Promise<void>
  setAutoLockMinutes: (minutes: number) => Promise<void>
  enablePasskey: () => Promise<void>
  disablePasskey: () => Promise<void>
  changeSecret: (
    currentSecret: string,
    nextSecret: string,
    nextType: 'pin' | 'password',
  ) => Promise<void>
  rotateRecoveryCode: () => Promise<string>
}

const SecurityContext = createContext<SecurityContextValue | null>(null)

export function SecurityProvider({
  session,
  onSessionChange,
  onLock,
  children,
}: {
  session: SecuritySession
  onSessionChange: (session: SecuritySession) => void
  onLock: () => Promise<void>
  children: ReactNode
}) {
  const lastActivityAt = useRef(Date.now())
  const hiddenAt = useRef<number | null>(null)

  const lock = useCallback(async () => {
    await onLock()
  }, [onLock])

  useEffect(() => {
    const markActivity = () => {
      lastActivityAt.current = Date.now()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
        return
      }
      const hiddenDuration = hiddenAt.current ? Date.now() - hiddenAt.current : 0
      hiddenAt.current = null
      const inactivityLimit = session.profile.autoLockMinutes * 60_000
      if (hiddenDuration >= Math.min(60_000, inactivityLimit)) {
        void lock()
        return
      }
      markActivity()
    }

    const interval = window.setInterval(() => {
      const inactivityLimit = session.profile.autoLockMinutes * 60_000
      if (Date.now() - lastActivityAt.current >= inactivityLimit) void lock()
    }, 10_000)

    window.addEventListener('pointerdown', markActivity, { passive: true })
    window.addEventListener('keydown', markActivity)
    window.addEventListener('touchstart', markActivity, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pointerdown', markActivity)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('touchstart', markActivity)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [lock, session.profile.autoLockMinutes])

  const value = useMemo<SecurityContextValue>(() => ({
    session,
    lock,
    setAutoLockMinutes: async (minutes) => {
      onSessionChange(await securityManager.setAutoLockMinutes(session, minutes))
    },
    enablePasskey: async () => {
      onSessionChange(await securityManager.enablePasskey(session))
    },
    disablePasskey: async () => {
      onSessionChange(await securityManager.disablePasskey(session))
    },
    changeSecret: async (currentSecret, nextSecret, nextType) => {
      onSessionChange(await securityManager.changeSecret(session, currentSecret, nextSecret, nextType))
    },
    rotateRecoveryCode: async () => {
      const result = await securityManager.rotateRecoveryCode(session)
      onSessionChange(result.session)
      return result.recoveryCode
    },
  }), [lock, onSessionChange, session])

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>
}

export function useSecurity(): SecurityContextValue {
  const value = useContext(SecurityContext)
  if (!value) throw new Error('SecurityProvider não foi configurado.')
  return value
}
