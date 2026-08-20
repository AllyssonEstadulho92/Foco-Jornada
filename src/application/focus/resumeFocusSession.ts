import { resumeFocusSession as resumeEntity, type FocusSession } from '../../domain/focus/FocusSession'
import type { FocusRepository } from './FocusRepository'

export type ResumeFocusResult =
  | { status: 'resumed'; session: FocusSession }
  | { status: 'not-open' }
  | { status: 'not-paused'; session: FocusSession }

export async function resumeFocusSession({
  focusRepository,
  journeyId,
  now = () => new Date(),
}: {
  focusRepository: FocusRepository
  journeyId: string
  now?: () => Date
}): Promise<ResumeFocusResult> {
  const current = await focusRepository.getOpenForJourney(journeyId)
  if (!current) return { status: 'not-open' }
  if (current.status !== 'paused') return { status: 'not-paused', session: current }

  const resumed = resumeEntity(current, now().toISOString())
  const persisted = await focusRepository.updateIfStatus(resumed, ['paused'])
  if (!persisted) {
    const latest = await focusRepository.getById(current.id)
    return latest ? { status: 'not-paused', session: latest } : { status: 'not-open' }
  }

  return { status: 'resumed', session: resumed }
}
