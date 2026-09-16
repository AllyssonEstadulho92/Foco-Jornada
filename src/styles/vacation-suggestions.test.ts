import { describe, expect, it } from 'vitest'
import suggestionsCss from './vacation-suggestions.css?raw'
import suggestionsPage from '../presentation/pages/VacationSuggestionsPanel.tsx?raw'
import plannerPage from '../presentation/pages/VacationPlannerPanel.tsx?raw'
import entry from '../main.tsx?raw'

describe('sugestões de férias — integração e acessibilidade', () => {
  it('recebe configuração/datas existentes e envia a escolha ao simulador sem escrever férias', () => {
    expect(plannerPage).toContain('<VacationSuggestionsPanel')
    expect(plannerPage).toContain('recordedVacationDates={recordedVacationDates}')
    expect(plannerPage).toContain('onSimulate={(start, end) => {')
    expect(plannerPage).toContain('setStartDate(start)')
    expect(plannerPage).toContain('setEndDate(end)')
    expect(suggestionsPage).toContain('suggestVacationPeriods({')
    expect(suggestionsPage).toContain('onSimulate(selected.startDate, selected.endDate)')
    expect(suggestionsPage).toContain('to="/turnos"')
    expect(suggestionsPage).not.toContain('secureStorage.setItem')
    expect(suggestionsPage).not.toContain('localStorage.setItem')
  })

  it('mostra escolhas reais, calendário por ano atual, estados e explicação dos limites', () => {
    expect(suggestionsPage).toContain('Sugestão de férias')
    expect(suggestionsPage).toContain('Dias úteis pretendidos')
    expect(suggestionsPage).toContain('Evitar mês')
    expect(suggestionsPage).toContain('Juntar fins de semana')
    expect(suggestionsPage).toContain('Calendário sugerido')
    expect(suggestionsPage).toContain('year = Number(today.slice(0, 4))')
    expect(suggestionsPage).toContain('aria-pressed=')
    expect(suggestionsPage).toContain('aria-expanded=')
    expect(suggestionsPage).toContain('aria-label="Mês anterior"')
    expect(suggestionsPage).toContain('Não analisam feriados, escala de trabalho')
  })

  it('contém cartões e textos e preserva alvos, uma coluna e modos acessíveis', () => {
    expect(entry).toContain("import './styles/vacation-suggestions.css'")
    expect(suggestionsCss).toContain('.vacationSuggest, .vacationSuggest * { box-sizing: border-box; min-width: 0; }')
    expect(suggestionsCss).toContain('overflow-wrap: anywhere')
    expect(suggestionsCss).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr))')
    expect(suggestionsCss).toContain('min-height: 44px')
    expect(suggestionsCss).toContain('focus-visible')
    expect(suggestionsCss).toContain('@media (max-width: 520px)')
    expect(suggestionsCss).toContain('@media (forced-colors: active)')
    expect(suggestionsCss).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
