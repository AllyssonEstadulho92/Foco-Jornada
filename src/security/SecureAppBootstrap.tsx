import { useCallback, useEffect, useRef, useState } from 'react'
import { AppDataIntegrityService } from '../application/data/AppDataIntegrityService'
import { ReleaseAppBackupService } from '../application/data/ReleaseAppBackupService'
import { MedicationDataProtectionService } from '../application/personalStock/MedicationDataProtectionService'
import { MedicationDoseStatusService } from '../application/personalStock/MedicationDoseStatusService'
import { NicotineAwarenessService } from '../application/personalStock/NicotineAwarenessService'
import { OperationalPersonalStockService } from '../application/personalStock/OperationalPersonalStockService'
import { StickDataProtectionService } from '../application/personalStock/StickDataProtectionService'
import { StickPackPlannerService } from '../application/personalStock/StickPackPlannerService'
import { StickUsageAnalyticsService } from '../application/personalStock/StickUsageAnalyticsService'
import { StockReconciliationService } from '../application/personalStock/StockReconciliationService'
import { AppDatabase } from '../infrastructure/database/appDatabase'
import { DexieActivityRepository } from '../infrastructure/repositories/DexieActivityRepository'
import { DexieBreakRepository } from '../infrastructure/repositories/DexieBreakRepository'
import { DexieCoffeeRepository } from '../infrastructure/repositories/DexieCoffeeRepository'
import { DexieFocusRepository } from '../infrastructure/repositories/DexieFocusRepository'
import { DexieJourneyRepository } from '../infrastructure/repositories/DexieJourneyRepository'
import { DexieSettingsRepository } from '../infrastructure/repositories/DexieSettingsRepository'
import { App } from '../presentation/App'
import type { AppServices } from '../presentation/providers/AppServicesProvider'
import { useNotificationStore } from '../presentation/store/useNotificationStore'
import { useWorkHoursStore } from '../presentation/store/useWorkHoursStore'
import { installDataIntegrityMonitoring } from '../presentation/utils/installDataIntegrityMonitoring'
import { installDeadlineNotificationCoordinator } from '../presentation/utils/installDeadlineNotificationCoordinator'
import { installGloSessionPrototypeEnhancement } from '../presentation/utils/installGloSessionPrototypeEnhancement'
import { installMedicationNextDoseTimerEnhancement } from '../presentation/utils/installMedicationNextDoseTimerEnhancement'
import {
  migrateLegacyDataIfNeeded,
  type LegacyMigrationResult,
} from './legacyMigration'
import type { SecurityProfile } from './profileStore'
import { secureStorage } from './secureStorage'
import { SecurityProvider } from './SecurityContext'
import { SecurityGate } from './SecurityGate'
import {
  securityManager,
  type SecuritySession,
} from './SecurityManager'

interface Runtime {
  db: AppDatabase
  services: AppServices
  cleanup: () => void
  migration: LegacyMigrationResult
}

function createServices(db: AppDatabase): AppServices {
  const personalStockService = new OperationalPersonalStockService(db)
  const medicationDoseStatusService = new MedicationDoseStatusService(db)
  const medicationDataProtectionService = new MedicationDataProtectionService(db)
  const dataIntegrityService = new AppDataIntegrityService(db)

  return {
    journeyRepository: new DexieJourneyRepository(db),
    breakRepository: new DexieBreakRepository(db),
    activityRepository: new DexieActivityRepository(db),
    focusRepository: new DexieFocusRepository(db),
    coffeeRepository: new DexieCoffeeRepository(db),
    settingsRepository: new DexieSettingsRepository(db),
    personalStockService,
    medicationDoseStatusService,
    medicationDataProtectionService,
    stockReconciliationService: new StockReconciliationService(db),
    nicotineAwarenessService: new NicotineAwarenessService(db),
    stickDataProtectionService: new StickDataProtectionService(db),
    stickPackPlannerService: new StickPackPlannerService(db),
    stickUsageAnalyticsService: new StickUsageAnalyticsService(db),
    backupService: new ReleaseAppBackupService(db),
    dataIntegrityService,
  }
}

export function SecureAppBootstrap() {
  const [profiles, setProfiles] = useState<SecurityProfile[]>([])
  const [profilesLoaded, setProfilesLoaded] = useState(false)
  const [session, setSession] = useState<SecuritySession | null>(null)
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [runtimeError, setRuntimeError] = useState('')
  const sessionRef = useRef<SecuritySession | null>(session)
  sessionRef.current = session
  const activeProfileId = session?.profile.id

  const refreshProfiles = useCallback(async () => {
    setProfiles(await securityManager.listProfiles())
    setProfilesLoaded(true)
  }, [])

  useEffect(() => {
    void refreshProfiles()
  }, [refreshProfiles])

  useEffect(() => {
    const activeSession = sessionRef.current
    if (!activeSession) {
      setRuntime(null)
      return
    }

    let disposed = false
    let db: AppDatabase | null = null
    let cleanup = () => {}

    const start = async () => {
      try {
        setRuntimeError('')
        db = new AppDatabase(activeSession)
        await db.ensureReady()
        if (disposed) {
          db.close()
          return
        }

        secureStorage.bind(db)
        const migration = await migrateLegacyDataIfNeeded(db)
        await useWorkHoursStore.persist.rehydrate()
        await useNotificationStore.persist.rehydrate()

        const services = createServices(db)
        const runtimeServices = services as Required<AppServices>
        const cleanupIntegrity = installDataIntegrityMonitoring(runtimeServices.dataIntegrityService)
        const cleanupDeadlines = installDeadlineNotificationCoordinator({
          journeyRepository: runtimeServices.journeyRepository,
          breakRepository: runtimeServices.breakRepository,
          focusRepository: runtimeServices.focusRepository,
          settingsRepository: runtimeServices.settingsRepository,
          personalStockService: runtimeServices.personalStockService,
          medicationDoseStatusService: runtimeServices.medicationDoseStatusService,
          medicationDataProtectionService: runtimeServices.medicationDataProtectionService,
        })
        const cleanupMedication = installMedicationNextDoseTimerEnhancement({
          personalStockService: runtimeServices.personalStockService,
          medicationDoseStatusService: runtimeServices.medicationDoseStatusService,
          medicationDataProtectionService: runtimeServices.medicationDataProtectionService,
        })
        const cleanupGlo = installGloSessionPrototypeEnhancement()

        cleanup = () => {
          cleanupIntegrity()
          cleanupDeadlines()
          cleanupMedication()
          cleanupGlo()
        }

        if (disposed) {
          cleanup()
          secureStorage.unbind()
          db.close()
          return
        }
        setRuntime({ db, services, cleanup, migration })
      } catch (error) {
        if (!disposed) {
          secureStorage.unbind()
          db?.close()
          setRuntimeError(
            error instanceof Error ? error.message : 'Não foi possível abrir o cofre local.',
          )
        }
      }
    }

    void start()

    return () => {
      disposed = true
      cleanup()
      secureStorage.unbind()
      db?.close()
    }
  }, [activeProfileId])

  const lock = useCallback(async () => {
    try {
      await secureStorage.flush()
    } catch {
      // O bloqueio tem prioridade; a auditoria seguinte detetará uma falha persistente.
    }
    secureStorage.unbind()
    useWorkHoursStore.setState({ entries: [] })
    useNotificationStore.setState({ notifications: [] })
    runtime?.cleanup()
    runtime?.db.close()
    setRuntime(null)
    setSession(null)
    await refreshProfiles()
  }, [refreshProfiles, runtime])

  if (!profilesLoaded) {
    return (
      <main className="securityScreen">
        <section className="securityCard securityLoadingCard" role="status">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <h1>Foco Jornada</h1>
          <p>A verificar o cofre local…</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <SecurityGate
        profiles={profiles}
        onProfilesChanged={refreshProfiles}
        onUnlocked={setSession}
      />
    )
  }

  if (runtimeError) {
    return (
      <main className="securityScreen">
        <section className="securityCard" role="alert">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <h1>Não foi possível abrir o cofre</h1>
          <p>{runtimeError}</p>
          <p>Os dados anteriores não foram eliminados por esta falha.</p>
          <button className="securityPrimary" type="button" onClick={() => void lock()}>
            Voltar ao acesso
          </button>
        </section>
      </main>
    )
  }

  if (!runtime) {
    return (
      <main className="securityScreen">
        <section className="securityCard securityLoadingCard" role="status">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <h1>A proteger os seus dados</h1>
          <p>
            A abrir e validar o cofre encriptado. Se existirem dados antigos, são copiados e
            verificados antes de o formato em texto simples ser removido.
          </p>
        </section>
      </main>
    )
  }

  return (
    <SecurityProvider
      session={session}
      onSessionChange={setSession}
      onLock={lock}
    >
      {runtime.migration.migrated ? (
        <div className="securityMigrationNotice" role="status">
          Migração segura concluída: {runtime.migration.tableRecords} registos e{' '}
          {runtime.migration.storageRecords} itens auxiliares foram cifrados e verificados.
        </div>
      ) : null}
      <App services={runtime.services} />
    </SecurityProvider>
  )
}
