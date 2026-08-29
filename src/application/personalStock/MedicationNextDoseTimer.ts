import type { MedicationDoseEvent } from '../../domain/personalStock/models'

export interface MedicationNextDoseCountdown {
  nextDoseAt: string
  remainingSeconds: number
  due: boolean
  progressPercent: number | null
}

function validTimestamp(value?: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function calculateMedicationNextDoseCountdown(
  nextDoseAt: string | null,
  now = new Date(),
  lastConfirmedAt?: string | null,
): MedicationNextDoseCountdown | null {
  const nextMs = validTimestamp(nextDoseAt)
  if (nextMs === null) return null

  const nowMs = now.getTime()
  const remainingSeconds = Math.max(0, Math.ceil((nextMs - nowMs) / 1000))
  const lastMs = validTimestamp(lastConfirmedAt)

  let progressPercent: number | null = null
  if (lastMs !== null && lastMs < nextMs) {
    const totalMs = nextMs - lastMs
    const elapsedMs = Math.max(0, Math.min(totalMs, nowMs - lastMs))
    progressPercent = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100))
  }

  return {
    nextDoseAt: new Date(nextMs).toISOString(),
    remainingSeconds,
    due: nowMs >= nextMs,
    progressPercent,
  }
}

export function formatMedicationCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function resolveLastActiveTakenEvent(events: MedicationDoseEvent[]): MedicationDoseEvent | null {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )

  const activeTaken = events
    .filter((event) => event.status === 'taken' && !correctedIds.has(event.id))
    .sort((left, right) => {
      const createdOrder = right.createdAt.localeCompare(left.createdAt)
      return createdOrder || right.id.localeCompare(left.id)
    })

  return activeTaken[0] ?? null
}
