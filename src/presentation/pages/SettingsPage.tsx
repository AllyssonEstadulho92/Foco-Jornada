import { useState } from 'react'
import { formatPlannedMinutes, getScheduleSummary } from '../../domain/journey/WorkSchedule'
import { useSettingsController } from '../hooks/useSettingsController'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function weekendDatesForMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return []
  const totalDays = new Date(year, month, 0).getDate()

  return Array.from({ length: totalDays }, (_, index) => index + 1)
    .map((day) => {
      const date = new Date(year, month - 1, day)
      const weekday = date.getDay()
      if (weekday !== 0 && weekday !== 6) return null
      const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`
      const dayLabel = new Intl.DateTimeFormat('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }).format(date)
      return { dateKey, dayLabel, isSunday: weekday === 0 }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export function SettingsPage() {
  const { settings, setSettings, save, isLoading, isBusy, error } = useSettingsController()
  const [scheduleMonth, setScheduleMonth] = useState(currentMonthKey)
  const weekdaySummary = getScheduleSummary(settings.workSchedule, '2026-08-17')
  const weekendDates = weekendDatesForMonth(scheduleMonth)

  function toggleWeekendWorkDate(dateKey: string, checked: boolean) {
    const current = settings.workSchedule.weekendWorkDates
    const next = checked
      ? [...new Set([...current, dateKey])].sort()
      : current.filter((item) => item !== dateKey)

    setSettings({
      ...settings,
      workSchedule: {
        ...settings.workSchedule,
        weekendWorkDates: next,
      },
    })
  }

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
              <h2 id="work-schedule-settings">Horário semanal e escala mensal</h2>
            </div>
            <div className="settingsScheduleSummary" aria-label="Resumo do horário">
              <span>Seg–Sáb {settings.workSchedule.startTime}–{settings.workSchedule.endTime}</span>
              <span>Dom {settings.workSchedule.sundayStartTime}–{settings.workSchedule.sundayEndTime}</span>
              <strong>{formatPlannedMinutes(weekdaySummary.effectiveMinutes)} efetivo em dia de trabalho</strong>
            </div>
          </div>

          <div className="settingsBreakCard">
            <strong>Segunda a sábado</strong>
            <small>O sábado só conta como trabalho quando estiver marcado na escala mensal.</small>
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
          </div>

          <div className="settingsBreakCard">
            <strong>Domingo</strong>
            <small>Este horário só é aplicado aos domingos assinalados como trabalho.</small>
            <div className="settingsTimeGrid">
              <label>
                <span>Entrada prevista</span>
                <input
                  type="time"
                  value={settings.workSchedule.sundayStartTime}
                  disabled={isLoading || isBusy}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: { ...settings.workSchedule, sundayStartTime: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                <span>Saída prevista</span>
                <input
                  type="time"
                  value={settings.workSchedule.sundayEndTime}
                  disabled={isLoading || isBusy}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      workSchedule: { ...settings.workSchedule, sundayEndTime: event.target.value },
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className="settingsBreakCard">
            <div className="settingsTimeGrid">
              <label>
                <span>Mês da escala de fins de semana</span>
                <input
                  type="month"
                  value={scheduleMonth}
                  disabled={isLoading || isBusy}
                  onChange={(event) => setScheduleMonth(event.target.value)}
                />
              </label>
            </div>
            <div>
              <strong>Fins de semana em que trabalhas</strong>
              <p className="settingsScheduleNote">
                Marca apenas os sábados e domingos em que estás escalado. Os restantes ficam como folga planeada. Segunda a sexta são dias de trabalho normal.
              </p>
            </div>
            <div className="settingsTimeGrid" aria-label="Escala de fins de semana">
              {weekendDates.map((item) => {
                const checked = settings.workSchedule.weekendWorkDates.includes(item.dateKey)
                const hours = item.isSunday
                  ? `${settings.workSchedule.sundayStartTime}–${settings.workSchedule.sundayEndTime}`
                  : `${settings.workSchedule.startTime}–${settings.workSchedule.endTime}`

                return (
                  <label key={item.dateKey} className="settingsToggleRow">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isLoading || isBusy}
                      onChange={(event) => toggleWeekendWorkDate(item.dateKey, event.target.checked)}
                    />
                    <span>
                      <strong>{item.dayLabel}</strong>
                      <small>{checked ? `Trabalho · ${hours}` : 'Folga'}</small>
                    </span>
                  </label>
                )
              })}
            </div>
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
              <span><strong>Pausa 1</strong><small>Aplicada aos dias de trabalho. Ex.: 11:00 até 11:15.</small></span>
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
            Horário base: segunda a sábado {settings.workSchedule.startTime}–{settings.workSchedule.endTime}; domingo {settings.workSchedule.sundayStartTime}–{settings.workSchedule.sundayEndTime}. Aos fins de semana, a aplicação só apresenta jornada planeada nas datas que marcares acima. Os registos reais continuam separados do plano.
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
