import { useState, type CSSProperties } from 'react'
import type { VacationMonthlyAccrualMonth } from '../../domain/vacation/VacationBalance'

interface Props {
  schedule: VacationMonthlyAccrualMonth[]
  targetDays: number
  formatDate: (date: string) => string
  daysLabel: (days: number) => string
  preciseDaysLabel: (days: number) => string
  monthLabel: (month: number) => string
}

const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** Uma visualização dos dados já calculados no domínio: não lê nem grava outros registos. */
export function VacationMonthlyVisualization({ schedule, targetDays, formatDate, daysLabel, preciseDaysLabel, monthLabel }: Props) {
  const [mode, setMode] = useState<'chart' | 'table'>('chart')

  return (
    <div className="vacationMonthlyVisualization">
      <div className="vacationMonthlyVisualizationTop">
        <p>Acumulação mensal da meta pessoal · valores fechados, atuais e previstos.</p>
        <div className="vacationMonthlyViewSwitch" role="group" aria-label="Apresentação da acumulação mensal">
          <button type="button" aria-pressed={mode === 'chart'} onClick={() => setMode('chart')}>Gráfico</button>
          <button type="button" aria-pressed={mode === 'table'} onClick={() => setMode('table')}>Tabela</button>
        </div>
      </div>
      {mode === 'chart' ? (
        <div className="vacationMonthlyChart" aria-label="Gráfico da acumulação mensal">
          {schedule.map((item) => {
            const value = item.current && !item.completed ? item.liveCumulativeDays : item.cumulativeDays
            const percentage = targetDays > 0 ? Math.min(100, Math.max(0, value / targetDays * 100)) : 0
            const state = item.completed ? 'Fechado' : item.current ? 'Em curso' : 'Previsto'
            const style = { '--vacation-bar-height': `${percentage}%` } as CSSProperties
            return (
              <div className={`vacationMonthlyBar${item.current ? ' isCurrent' : ''}${item.completed ? ' isCompleted' : ''}`} key={item.month}
                aria-label={`${monthLabel(item.month)}: ${preciseDaysLabel(value)}; ${state.toLowerCase()}`}>
                <span className="vacationMonthlyBarAmount">{item.current ? preciseDaysLabel(value) : daysLabel(value)}</span>
                <span className="vacationMonthlyBarTrack" aria-hidden="true"><span style={style} /></span>
                <span className="vacationMonthlyBarMonth">{shortMonths[item.month - 1]}</span>
                <small>{state}</small>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="vacationMonthlyTableFrame">
          <table className="vacationMonthlyTable">
            <caption>Acumulação da meta pessoal, por mês</caption>
            <thead><tr><th scope="col">Mês</th><th scope="col">Acumulado</th><th scope="col">Estado</th><th scope="col">Fecho</th></tr></thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.month}>
                  <th scope="row">{monthLabel(item.month)}</th>
                  <td>{item.current && !item.completed ? preciseDaysLabel(item.liveCumulativeDays) : daysLabel(item.cumulativeDays)}</td>
                  <td>{item.completed ? 'Fechado' : item.current ? 'Em curso' : 'Previsto'}</td>
                  <td>{formatDate(item.monthEndDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
