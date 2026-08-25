export type StockEntityKind = 'sticks' | 'medication'
export type StockMovementType = 'initial_stock' | 'consumption' | 'restock' | 'correction'
export type StockCorrectionReason = 'physical_count' | 'undo_restock'
export type DoseEventStatus = 'taken' | 'not_taken' | 'postponed' | 'corrected'

export interface StockEntity {
  id: string
  kind: StockEntityKind
  name: string
  unit: string
  dosage?: string
  timezone: string
  startDate?: string
  createdAt: string
  lastPhysicalCountMinor?: string
  lastPhysicalExpectedMinor?: string
  lastPhysicalAdjustmentMinor?: string
  lastPhysicalCountAt?: string
}

export interface StockMovement {
  id: string
  operationId: string
  entityId: string
  type: StockMovementType
  quantityMinor: string
  balanceBeforeMinor: string
  balanceAfterMinor: string
  sequence: number
  effectiveAt: string
  createdAt: string
  correctionOf?: string
  correctionReason?: StockCorrectionReason
}

export interface MedicationSchedule {
  id: string
  medicationId: string
  localTime: string
  quantityMinor: string
  effectiveFrom: string
  effectiveUntil?: string
  order: number
  fold?: 0 | 1
  createdAt: string
}

export interface MedicationDoseEvent {
  id: string
  operationId: string
  occurrenceKey: string
  medicationId: string
  scheduleId: string
  scheduledAt: string
  quantityMinor: string
  status: DoseEventStatus
  createdAt: string
  correctionOf?: string
  stockMovementId?: string
  postponedTo?: string
  rescheduledFrom?: string
}

export interface ReconciliationResult {
  storedMinor: string
  reconstructedMinor: string
  movementCount: number
  ok: boolean
}

export interface StickSummary extends ReconciliationResult {
  initialized: boolean
  stock: number | null
  usedToday: number | null
}

export interface MedicationSummary extends ReconciliationResult {
  medication: StockEntity
  stock: string
}

export interface ForecastDose {
  scheduleId: string
  scheduledAt: string
  quantity: string
}

export interface MedicationForecast {
  nextDose: ForecastDose
  lastPossibleDose: ForecastDose | null
  stockAfterLastPossible: string
  firstImpossibleDose: ForecastDose
  missingQuantity: string
  autonomySeconds: number
  exact: true
}

export interface PhysicalStockCheck {
  entityId: string
  checkedAt: string
  expected: string
  counted: string
  adjustment: string
}
