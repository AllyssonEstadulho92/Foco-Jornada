import Dexie, { type Table } from 'dexie'
import type { Activity } from '../../domain/activities/Activity'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { Journey } from '../../domain/journey/Journey'

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

  constructor(name = 'foco-jornada') {
    super(name)

    this.version(1).stores({
      metadata: '&key,updatedAt',
    })

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
  }
}

export const db = new AppDatabase()
