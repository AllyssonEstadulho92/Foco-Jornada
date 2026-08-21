import type { ActivityRepository } from '../activities/ActivityRepository'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { CoffeeRepository } from '../coffee/CoffeeRepository'
import type { FocusRepository } from '../focus/FocusRepository'
import type { JourneyRepository } from '../journey/JourneyRepository'
import type { DayEvent } from './buildDayReport'

export async function deleteDayEventRecord({
  event,
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  coffeeRepository,
}: {
  event: DayEvent
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  coffeeRepository: CoffeeRepository
}): Promise<void> {
  if (!event.deletable) {
    throw new Error('Termina primeiro o registo ativo antes de o eliminar.')
  }

  switch (event.recordType) {
    case 'journey':
      if (!journeyRepository.deleteById) throw new Error('Não foi possível eliminar esta jornada.')
      await journeyRepository.deleteById(event.recordId)
      return
    case 'break':
      if (!breakRepository.deleteById) throw new Error('Não foi possível eliminar esta pausa.')
      await breakRepository.deleteById(event.recordId)
      return
    case 'activity':
      if (!activityRepository.deleteById) throw new Error('Não foi possível eliminar esta atividade.')
      await activityRepository.deleteById(event.recordId)
      return
    case 'focus':
      if (!focusRepository.deleteById) throw new Error('Não foi possível eliminar esta sessão de foco.')
      await focusRepository.deleteById(event.recordId)
      return
    case 'coffee':
      if (!coffeeRepository.deleteById) throw new Error('Não foi possível eliminar este café.')
      await coffeeRepository.deleteById(event.recordId)
      return
  }
}
