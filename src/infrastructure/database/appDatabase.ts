import Dexie, { type Table } from 'dexie'
import type { Journey } from '../../domain/journey/Journey'

export interface AppMetadataRecord {
  key: string
  value: string
  updatedAt: string
}

export class AppDatabase extends Dexie {
  metadata!: Table<AppMetadataRecord, string>
  journeys!: Table<Journey, string>

  constructor(name = 'foco-jornada') {
    super(name)

    this.version(1).stores({
      metadata: '&key,updatedAt',
    })

    this.version(2).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
    })
  }
}

export const db = new AppDatabase()
