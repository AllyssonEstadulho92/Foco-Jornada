import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renderiza a fundação e a navegação principal', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Atividades' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Foco' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Histórico' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Mais' }).length).toBeGreaterThan(0)
  })
})
