import { describe, expect, it } from 'vitest'
import { getGloSessionPreset, getGloSessionStatus } from './GloSessionTimer'

describe('GloSessionTimer', () => {
  it('mantém os tempos oficiais configurados para os dois aparelhos e modos', () => {
    expect(getGloSessionPreset('hyper-pro', 'standard')).toMatchObject({
      warmupSeconds: 20,
      sessionSeconds: 270,
    })
    expect(getGloSessionPreset('hyper-pro', 'boost')).toMatchObject({
      warmupSeconds: 15,
      sessionSeconds: 180,
    })
    expect(getGloSessionPreset('hyper-pro-plus', 'standard')).toMatchObject({
      warmupSeconds: 10,
      sessionSeconds: 300,
    })
    expect(getGloSessionPreset('hyper-pro-plus', 'boost')).toMatchObject({
      warmupSeconds: 10,
      sessionSeconds: 180,
    })
  })

  it('transita do aquecimento para a sessão usando timestamps absolutos', () => {
    const preset = getGloSessionPreset('hyper-pro', 'standard')
    const heating = getGloSessionStatus(
      '2026-08-29T00:00:00.000Z',
      new Date('2026-08-29T00:00:12.000Z'),
      preset,
    )
    expect(heating.phase).toBe('heating')
    expect(heating.phaseRemainingSeconds).toBe(8)

    const active = getGloSessionStatus(
      '2026-08-29T00:00:00.000Z',
      new Date('2026-08-29T00:00:20.000Z'),
      preset,
    )
    expect(active.phase).toBe('session')
    expect(active.phaseRemainingSeconds).toBe(270)
    expect(active.readyAt).toBe('2026-08-29T00:00:20.000Z')
    expect(active.endsAt).toBe('2026-08-29T00:04:50.000Z')
  })

  it('fica concluído no fim do tempo total da sessão', () => {
    const preset = getGloSessionPreset('hyper-pro-plus', 'standard')
    const completed = getGloSessionStatus(
      '2026-08-29T00:00:00.000Z',
      new Date('2026-08-29T00:05:10.000Z'),
      preset,
    )
    expect(completed.phase).toBe('completed')
    expect(completed.phaseRemainingSeconds).toBe(0)
    expect(completed.overallRemainingSeconds).toBe(0)
    expect(completed.progressPercent).toBe(100)
  })

  it('fica inativo quando ainda não existe início válido', () => {
    const preset = getGloSessionPreset('hyper-pro', 'boost')
    expect(getGloSessionStatus(null, new Date(), preset)).toMatchObject({
      phase: 'idle',
      elapsedSeconds: null,
      progressPercent: 0,
    })
  })
})
