import { describe, expect, it } from 'vitest'
import {
  createAbsoluteTimer,
  elapsedMilliseconds,
  formatCountdown,
  progressPercent,
  remainingMilliseconds,
} from './TrustedTimeEngine'

describe('TrustedTimeEngine', () => {
  it('calcula o prazo a partir de um timestamp absoluto', () => {
    const timer = createAbsoluteTimer('2026-08-30T10:00:00.000Z', 90)
    expect(timer.deadlineAt).toBe('2026-08-30T10:01:30.000Z')
  })

  it('recalcula o tempo restante sem depender de decrementos acumulados', () => {
    const deadline = '2026-08-30T10:05:00.000Z'
    expect(remainingMilliseconds(deadline, '2026-08-30T10:03:10.000Z')).toBe(110_000)
    expect(remainingMilliseconds(deadline, '2026-08-30T10:06:00.000Z')).toBe(0)
  })

  it('mede tempo decorrido por timestamps reais', () => {
    expect(elapsedMilliseconds('2026-08-30T10:00:00.000Z', '2026-08-30T10:00:12.250Z')).toBe(12_250)
  })

  it('limita o progresso ao intervalo de 0 a 100', () => {
    const timer = createAbsoluteTimer('2026-08-30T10:00:00.000Z', 100)
    expect(progressPercent(timer, '2026-08-30T10:00:50.000Z')).toBe(50)
    expect(progressPercent(timer, '2026-08-30T10:03:00.000Z')).toBe(100)
  })

  it('formata contagem em horas, minutos e segundos', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
    expect(formatCountdown(-1)).toBe('00:00:00')
  })
})
