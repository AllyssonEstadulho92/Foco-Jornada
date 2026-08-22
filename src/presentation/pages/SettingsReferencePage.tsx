import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPlannedMinutes, getScheduleSummary } from '../../domain/journey/WorkSchedule'
import { AppAboutSettings } from '../components/AppAboutSettings'
import { useSettingsController } from '../hooks/useSettingsController'
import { useUiStore } from '../store/useUiStore'

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
      const label = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
      return { dateKey, label, isSunday: weekday === 0 }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function SettingsIcon({ children }: { children: string }) {
  return <span className="referenceSettingsIcon" aria-hidden="true">{children}</span>
}

export function SettingsReferencePage() {
  const { settings, setSettings, save, isLoading, isBusy, error } = useSettingsController()
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const [scheduleMonth, setScheduleMonth] = useState(currentMonthKey)
  const weekendDates = weekendDatesForMonth(scheduleMonth)
  const weekdaySummary = getScheduleSummary(settings.workSchedule, '2026-08-17')

  function toggleWeekend(dateKey: string, checked: boolean) {
    const current = settings.workSchedule.weekendWorkDates
    setSettings({
      ...settings,
      workSchedule: {
        ...settings.workSchedule,
        weekendWorkDates: checked
          ? [...new Set([...current, dateKey])].sort()
          : current.filter((item) => item !== dateKey),
      },
    })
  }

  async function handleSave() {
    await save({ ...settings, currency: 'EUR' })
  }

  return (
    <section className="referenceSettingsPage" aria-labelledby="settings-reference-title">
      <header className="referencePageTitle">
        <h1 id="settings-reference-title">Definições</h1>
        <p>Ajusta o horário, as pausas, o tema e os dados da aplicação.</p>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}

      <div className="referenceSettingsGroups">
        <section className="referenceSettingsCard" aria-label="Preferências principais">
          <div className="referenceSettingsStaticRow">
            <SettingsIcon>○</SettingsIcon>
            <span><strong>Perfil</strong><small>Consulta os dados guardados neste dispositivo</small></span>
            <span className="referenceChevron">›</span>
          </div>

          <details className="referenceSettingsRow">
            <summary>
              <SettingsIcon>◷</SettingsIcon>
              <span><strong>Horário base</strong><small>Define o teu horário habitual de trabalho</small></span>
              <span className="referenceChevron">›</span>
            </summary>
            <div className="referenceSettingsExpanded">
              <div className="referenceSettingsGrid">
                <label><span>Seg–Sáb entrada</span><input type="time" value={settings.workSchedule.startTime} disabled={isLoading || isBusy} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, startTime: event.target.value } })} /></label>
                <label><span>Seg–Sáb saída</span><input type="time" value={settings.workSchedule.endTime} disabled={isLoading || isBusy} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, endTime: event.target.value } })} /></label>
                <label><span>Domingo entrada</span><input type="time" value={settings.workSchedule.sundayStartTime} disabled={isLoading || isBusy} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, sundayStartTime: event.target.value } })} /></label>
                <label><span>Domingo saída</span><input type="time" value={settings.workSchedule.sundayEndTime} disabled={isLoading || isBusy} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, sundayEndTime: event.target.value } })} /></label>
              </div>
              <p>{formatPlannedMinutes(weekdaySummary.effectiveMinutes)} de trabalho efetivo previsto num dia normal.</p>
              <label className="referenceMonthField"><span>Fins de semana</span><input type="month" value={scheduleMonth} onChange={(event) => setScheduleMonth(event.target.value)} /></label>
              <div className="referenceWeekendGrid">
                {weekendDates.map((item) => {
                  const checked = settings.workSchedule.weekendWorkDates.includes(item.dateKey)
                  return (
                    <label key={item.dateKey}>
                      <input type="checkbox" checked={checked} onChange={(event) => toggleWeekend(item.dateKey, event.target.checked)} />
                      <span><strong>{item.label}</strong><small>{checked ? `Trabalho · ${item.isSunday ? settings.workSchedule.sundayStartTime : settings.workSchedule.startTime}` : 'Folga'}</small></span>
                    </label>
                  )
                })}
              </div>
            </div>
          </details>

          <details className="referenceSettingsRow">
            <summary>
              <SettingsIcon>☕</SettingsIcon>
              <span><strong>Pausas</strong><small>Configura os teus intervalos de trabalho</small></span>
              <span className="referenceChevron">›</span>
            </summary>
            <div className="referenceSettingsExpanded">
              {[1, 2].map((number) => {
                const key = number === 1 ? 'break1' : 'break2'
                const value = settings.workSchedule[key]
                return (
                  <div className="referenceBreakEditor" key={key}>
                    <label className="referenceToggleLine"><input type="checkbox" checked={value.enabled} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, [key]: { ...value, enabled: event.target.checked } } })} /><span>Pausa {number}</span></label>
                    <div className="referenceSettingsGrid">
                      <label><span>Início</span><input type="time" value={value.startTime} disabled={!value.enabled} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, [key]: { ...value, startTime: event.target.value } } })} /></label>
                      <label><span>Fim</span><input type="time" value={value.endTime} disabled={!value.enabled} onChange={(event) => setSettings({ ...settings, workSchedule: { ...settings.workSchedule, [key]: { ...value, endTime: event.target.value } } })} /></label>
                    </div>
                  </div>
                )
              })}
              <label><span>Intervalo sugerido</span><div className="referenceInputSuffix"><input type="number" min="15" max="480" step="5" value={settings.suggestedBreakIntervalMinutes} onChange={(event) => setSettings({ ...settings, suggestedBreakIntervalMinutes: Number(event.target.value) })} /><span>min</span></div></label>
            </div>
          </details>

          <div className="referenceSettingsStaticRow referenceThemeRow">
            <SettingsIcon>◐</SettingsIcon>
            <span><strong>Tema</strong><small>Escolhe o aspeto da aplicação</small></span>
            <div className="referenceThemeSwitch" aria-label="Tema da aplicação">
              <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>Claro</button>
              <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>Escuro</button>
            </div>
          </div>
        </section>

        <section className="referenceSettingsCard">
          <Link className="referenceSettingsLinkRow" to="/mais"><SettingsIcon>♢</SettingsIcon><span><strong>Notificações</strong><small>Gere os alertas que queres receber</small></span><span className="referenceChevron">›</span></Link>
        </section>

        <section className="referenceSettingsCard">
          <Link className="referenceSettingsLinkRow" to="/mais"><SettingsIcon>⌁</SettingsIcon><span><strong>Estado da aplicação</strong><small>Verifica se está tudo a funcionar</small></span><span className="referenceChevron">›</span></Link>
          <Link className="referenceSettingsLinkRow" to="/mais"><SettingsIcon>⇧</SettingsIcon><span><strong>Exportar dados</strong><small>Guarda uma cópia dos teus dados</small></span><span className="referenceChevron">›</span></Link>
          <Link className="referenceSettingsLinkRow" to="/mais"><SettingsIcon>⇩</SettingsIcon><span><strong>Importar dados</strong><small>Recupera dados de outro dispositivo</small></span><span className="referenceChevron">›</span></Link>
          <Link className="referenceSettingsLinkRow" to="/mais"><SettingsIcon>☁</SettingsIcon><span><strong>Cópia de segurança</strong><small>Protege e recupera os teus dados</small></span><span className="referenceChevron">›</span></Link>
        </section>

        <AppAboutSettings />
      </div>

      <div className="referenceSettingsSave">
        <label><span>Preço por café (€)</span><input type="number" min="0" max="100" step="0.01" value={settings.coffeeUnitPrice} onChange={(event) => setSettings({ ...settings, coffeeUnitPrice: Number(event.target.value), currency: 'EUR' })} /></label>
        <button type="button" onClick={() => void handleSave()} disabled={isLoading || isBusy}>{isBusy ? 'A guardar…' : 'Guardar alterações'}</button>
      </div>
    </section>
  )
}
