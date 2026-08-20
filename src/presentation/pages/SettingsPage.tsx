import { useSettingsController } from '../hooks/useSettingsController'

export function SettingsPage() {
  const { settings, setSettings, save, isLoading, isBusy, error } = useSettingsController()

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
