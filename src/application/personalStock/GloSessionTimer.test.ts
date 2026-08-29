import { describe, expect, it } from 'vitest'
import {
  createGloSessionSnapshot,
  getGloSessionPreset,
  getGloSessionStatus,
  parseGloSessionTimerState,
  serializeGloSessionTimerState,
} from './GloSessionTimer'

describe('GloSessionTimer', () => {
  it('mantém as durações publicadas configuradas por aparelho e modo', () => {
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

  it('congela aparelho, modo, durações e três timestamps quando a sessão começa', () => {
    const session = createGloSessionSnapshot({
      device: 'hyper-pro',
      mode: 'standard',
      startedAt: '2026-08-29T03:14:31.000Z',
      consumptionOperationId: 'operation-1',
    })

    expect(session).toMatchObject({
      device: 'hyper-pro',
      mode: 'standard',
      warmupSeconds: 20,
      sessionSeconds: 270,
      startedAt: '2026-08-29T03:14:31.000Z',
      readyAt: '2026-08-29T03:14:51.000Z',
      endsAt: '2026-08-29T03:19:21.000Z',
      consumptionOperationId: 'operation-1',
    })
  })

  it('transita por aquecimento e utilização usando apenas timestamps absolutos da sessão congelada', () => {
    const session = createGloSessionSnapshot({
      device: 'hyper-pro',
      mode: 'standard',
      startedAt: '2026-08-29T00:00:00.000Z',
    })

    const heating = getGloSessionStatus(session, new Date('2026-08-29T00:00:12.000Z'))
    expect(heating.phase).toBe('heating')
    expect(heating.phaseRemainingSeconds).toBe(8)
    expect(heating.overallRemainingSeconds).toBe(278)

    const active = getGloSessionStatus(session, new Date('2026-08-29T00:00:20.000Z'))
    expect(active.phase).toBe('session')
    expect(active.phaseRemainingSeconds).toBe(270)
    expect(active.readyAt).toBe('2026-08-29T00:00:20.000Z')
    expect(active.endsAt).toBe('2026-08-29T00:04:50.000Z')
  })

  it('fica concluído exatamente no timestamp técnico final', () => {
    const session = createGloSessionSnapshot({
      device: 'hyper-pro-plus',
      mode: 'standard',
      startedAt: '2026-08-29T00:00:00.000Z',
    })

    const oneSecondBefore = getGloSessionStatus(session, new Date('2026-08-29T00:05:09.000Z'))
    expect(oneSecondBefore.phase).toBe('session')
    expect(oneSecondBefore.phaseRemainingSeconds).toBe(1)

    const completed = getGloSessionStatus(session, new Date('2026-08-29T00:05:10.000Z'))
    expect(completed.phase).toBe('completed')
    expect(completed.phaseRemainingSeconds).toBe(0)
    expect(completed.overallRemainingSeconds).toBe(0)
    expect(completed.progressPercent).toBe(100)
  })

  it('migra o estado antigo para snapshot v2 sem perder uma sessão em curso', () => {
    const legacy = JSON.stringify({
      device: 'hyper-pro',
      mode: 'standard',
      startedAt: '2026-08-29T03:14:31.000Z',
    })

    const migrated = parseGloSessionTimerState(legacy)
    expect(migrated.version).toBe(2)
    expect(migrated.session?.startedAt).toBe('2026-08-29T03:14:31.000Z')
    expect(migrated.session?.readyAt).toBe('2026-08-29T03:14:51.000Z')
    expect(migrated.session?.endsAt).toBe('2026-08-29T03:19:21.000Z')
  })

  it('mantém o snapshot congelado ao serializar e restaurar', () => {
    const session = createGloSessionSnapshot({
      device: 'hyper-pro',
      mode: 'boost',
      startedAt: '2026-08-29T03:00:00.000Z',
      consumptionOperationId: 'operation-2',
    })
    const restored = parseGloSessionTimerState(serializeGloSessionTimerState({
      version: 2,
      device: 'hyper-pro',
      mode: 'boost',
      session,
    }))

    expect(restored.session).toEqual(session)
  })

  it('recusa snapshot persistido cujos timestamps não correspondem às durações congeladas', () => {
    const invalid = JSON.stringify({
      version: 2,
      device: 'hyper-pro',
      mode: 'standard',
      session: {
        version: 1,
        device: 'hyper-pro',
        deviceLabel: 'glo Hyper Pro',
        mode: 'standard',
        modeLabel: 'Standard',
        warmupSeconds: 20,
        sessionSeconds: 270,
        startedAt: '2026-08-29T00:00:00.000Z',
        readyAt: '2026-08-29T00:00:21.000Z',
        endsAt: '2026-08-29T00:04:51.000Z',
      },
    })

    expect(parseGloSessionTimerState(invalid).session).toBeNull()
  })

  it('fica inativo quando ainda não existe sessão', () => {
    expect(getGloSessionStatus(null, new Date())).toMatchObject({
      phase: 'idle',
      elapsedSeconds: null,
      progressPercent: 0,
    })
  })
})
