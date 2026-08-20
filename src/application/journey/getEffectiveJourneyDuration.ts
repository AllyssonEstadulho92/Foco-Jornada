import { getBreakDurationMs, type BreakRecord } from '../../domain/breaks/BreakRecord'
import { getJourneyDurationMs, type Journey } from '../../domain/journey/Journey'

export function getEffectiveJourneyDurationMs(
  journey: Journey,
  breaks: BreakRecord[],
  now = new Date().toISOString(),
): number {
  const journeyDuration = getJourneyDurationMs(journey, now)
  const breakDuration = breaks
    .filter((record) => record.status !== 'cancelled')
    .reduce((total, record) => total + getBreakDurationMs(record, now), 0)

  return Math.max(0, journeyDuration - breakDuration)
}
