import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InMemoryJourneyRepository } from '../test/InMemoryJourneyRepository'
import { App } from './App'

describe('App', () => {
  it('renderiza a jornada e a navegação principal', async () => {
    render(
      <App
        services={{
          journeyRepository: new InMemoryJourneyRepository(),
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Foco & Jornada' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Iniciar jornada' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Atividades' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Foco' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Histórico' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Mais' }).length).toBeGreaterThan(0)
  })
})
