import Dexie, { type Table } from 'dexie'
import type { Activity } from '../../domain/activities/Activity'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import type { FocusSession } from '../../domain/focus/FocusSession'
import type { Journey } from '../../domain/journey/Journey'
import type {
  MedicationDoseEvent,
  MedicationSchedule,
  StockEntity,
  StockMovement,
} from '../../domain/personalStock/models'

export interface AppMetadataRecord {
  key: string
  value: string
  updatedAt: string
}

export class AppDatabase extends Dexie {
  metadata!: Table<AppMetadataRecord, string>
  journeys!: Table<Journey, string>
  breaks!: Table<BreakRecord, string>
  activities!: Table<Activity, string>
  focusSessions!: Table<FocusSession, string>
  coffeeRecords!: Table<CoffeeRecord, string>
  stockEntities!: Table<StockEntity, string>
  stockMovements!: Table<StockMovement, string>
  medicationSchedules!: Table<MedicationSchedule, string>
  medicationDoseEvents!: Table<MedicationDoseEvent, string>

  constructor(name = 'foco-jornada') {
    super(name)

    this.version(1).stores({ metadata: '&key,updatedAt' })
    this.version(2).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
    })
    this.version(3).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
    })
    this.version(4).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
      activities: '&id,journeyId,status,createdAt,startedAt,endedAt,updatedAt',
    })
    this.version(5).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
      activities: '&id,journeyId,status,createdAt,startedAt,endedAt,updatedAt',
      focusSessions:
        '&id,journeyId,activityId,mode,segmentType,status,cycle,createdAt,startedAt,endedAt,updatedAt',
    })
    this.version(6).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
      activities: '&id,journeyId,status,createdAt,startedAt,endedAt,updatedAt',
      focusSessions:
        '&id,journeyId,activityId,mode,segmentType,status,cycle,createdAt,startedAt,endedAt,updatedAt',
      coffeeRecords: '&id,date,journeyId,createdAt',
    })
    this.version(7).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
      activities: '&id,journeyId,status,createdAt,startedAt,endedAt,updatedAt',
      focusSessions:
        '&id,journeyId,activityId,mode,segmentType,status,cycle,createdAt,startedAt,endedAt,updatedAt',
      coffeeRecords: '&id,date,journeyId,createdAt',
      stockEntities: '&id,kind,createdAt',
      stockMovements: '&id,&operationId,entityId,[entityId+sequence],type,effectiveAt,createdAt,correctionOf',
      medicationSchedules: '&id,medicationId,[medicationId+order],effectiveFrom,effectiveUntil,createdAt',
      medicationDoseEvents: '&id,&operationId,occurrenceKey,medicationId,scheduleId,status,scheduledAt,createdAt',
    })
  }
}

export const db = new AppDatabase()
