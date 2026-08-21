import { getScheduleSummary, formatPlannedMinutes } from '../../domain/journey/WorkSchedule'
import { useSettingsController } from '../hooks/useSettingsController'

export function SettingsPage() {
  const { settings, setSettings, save, isLoading, isBusy, error } = useSettingsController()
  const scheduleSummary = getScheduleSummary(settings.workSchedule)

  return (
    <section className="reportPage" aria-labelledby="settings-title">
      <header className="reportHeader">
        <div>
          <span className="eyebrow">DEFINIÇÕES</span>
          <h1 id="settings-title">Preferências</h1>
          <p>Valores persistidos localmente no dispositivo.</p>
        </div>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}

      <form
        className="settingsPanel"
        onSubmit={(event) => {
          event.preventDefault()
          void save({ ...settings, currency: 'EUR' })
        }}
      >
        <section className="settingsGroup" aria-labelledby="work-schedule-settings">
          <div className="settingsGroupHeader">
            <div>
              <span>JORNADA PLANEADA</span>
              <h2 id="work-schedule-settings">Horário fixo</h2>
            </div>
            <div className="settingsScheduleSummary" aria-label="Resumo do horário">
              <span>{formatPlannedMinutes(scheduleSummary.totalMinutes)} jornada</span>
              <span>{formatPlannedMinutes(scheduleSummary.breakMinutes)} pausas</span>
              <strong>{formatPlannedMinutes(scheduleSummary.effectiveMinutes)} efetivo</strong>
            </div>
          </div>

          <div className="settingsTimeGrid">
            <label>
              <span>Entrada prevista</span>
              <input
                type="time"
                value={settings.workSchedule.startTime}
                disabled={isLoading || isBusy}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    workSchedule: { ...settings.workSchedule, startTime: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span>Saída prevista</span>
              <input
                type="time"
                value={settings.workSchedule.endTime}
                disabled={isLoading || isBusy}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    workSchedule: { ...settings.workSchedule, endTime: event.target.value },
                  })
                }
              />
            </label>
          </div>

          <div className="settingsBreakCard">
            <label className="settingsToggleRow">
              <input
                type="checkbox"
                checked={settings.workSchedule.break1.enabled}
                disabled={isLoading || isBusy}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    workSchedule: {
                      ...settings.workSchedule,
                      break1: { ...settings.workSchedule.break1, enabled: event.target.checked },
                    },
                  })
                }
              />
              <span><strong>Pausa 1</strong><small>Ex.: 11:00 até 11:15</small></span>
            </label>
            <div className="settingsTimeGrid">
              <label>
                <span>Saída para intervalo</span>
                <input
                  type="time"
                  value={settings.workSchedule.break1.startTime}
                  disabled={isLoading || isBusy || !settings.workSchedule.break1.enabled}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: {
                        ...settings.workSchedule,
                        break1: { ...settings.workSchedule.break1, startTime: event.target.value },
                      },
                    })
                  }
                />
              </label>
              <label>
                <span>Regresso</span>
                <input
                  type="time"
                  value={settings.workSchedule.break1.endTime}
                  disabled={isLoading || isBusy || !settings.workSchedule.break1.enabled}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: {
                        ...settings.workSchedule,
                        break1: { ...settings.workSchedule.break1, endTime: event.target.value },
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className="settingsBreakCard">
            <label className="settingsToggleRow">
              <input
                type="checkbox"
                checked={settings.workSchedule.break2.enabled}
                disabled={isLoading || isBusy}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    workSchedule: {
                      ...settings.workSchedule,
                      break2: { ...settings.workSchedule.break2, enabled: event.target.checked },
                    },
                  })
                }
              />
              <span><strong>Pausa 2</strong><small>Opcional. Mantém desligada quando não a fizeres.</small></span>
            </label>
            <div className="settingsTimeGrid">
              <label>
                <span>Saída para intervalo</span>
                <input
                  type="time"
                  value={settings.workSchedule.break2.startTime}
                  disabled={isLoading || isBusy || !settings.workSchedule.break2.enabled}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: {
                        ...settings.workSchedule,
                        break2: { ...settings.workSchedule.break2, startTime: event.target.value },
                      },
                    })
                  }
                />
              </label>
              <label>
                <span>Regresso</span>
                <input
                  type="time"
                  value={settings.workSchedule.break2.endTime}
                  disabled={isLoading || isBusy || !settings.workSchedule.break2.enabled}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: {
                        ...settings.workSchedule,
                        break2: { ...settings.workSchedule.break2, endTime: event.target.value },
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>

          <p className="settingsScheduleNote">
            O horário é fixo: atrasos ou entradas diferentes não alteram automaticamente a saída prevista. A aplicação mantém os registos reais separados do plano.
          </p>
        </section>

        <label>
          <span>Preço por café (€)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={settings.coffeeUnitPrice}
            disabled={isLoading || isBusy}
            onChange={(event) =>
              setSettings({ ...settings, coffeeUnitPrice: Number(event.target.value), currency: 'EUR' })
            }
          />
        </label>

        <label>
          <span>Intervalo sugerido entre pausas</span>
          <div className="inputWithSuffix">
            <input
              type="number"
              min="15"
              max="480"
              step="5"
              value={settings.suggestedBreakIntervalMinutes}
              disabled={isLoading || isBusy}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  suggestedBreakIntervalMinutes: Number(event.target.value),
                  currency: 'EUR',
                })
              }
            />
            <span>min</span>
          </div>
        </label>

        <div className="settingsInfo">
          <strong>Foco/Pomodoro</strong>
          <p>Na V1 mantém o ciclo padrão de 25 min de foco, 5 min de pausa curta e 15 min de pausa longa.</p>
        </div>

        <div className="settingsInfo">
          <strong>Moeda</strong>
          <p>A V1 utiliza Euro (EUR) para manter os totais de café consistentes.</p>
        </div>

        <button className="actionButton actionButtonPrimary" type="submit" disabled={isLoading || isBusy}>
          {isBusy ? 'A guardar…' : 'Guardar definições'}
        </button>
      </form>
    </section>
  )
}
