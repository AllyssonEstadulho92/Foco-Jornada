import Dexie, { type Table } from 'dexie'

export interface AppMetadataRecord {
  key: string
  value: string
  updatedAt: string
}

export class AppDatabase extends Dexie {
  metadata!: Table<AppMetadataRecord, string>

  constructor() {
    super('foco-jornada')

    this.version(1).stores({
      metadata: '&key,updatedAt',
    })
  }
}

export const db = new AppDatabase()
