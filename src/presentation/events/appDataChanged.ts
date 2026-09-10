export const APP_DATA_CHANGED_EVENT = 'foco-jornada:app-data-changed'

export function notifyAppDataChanged(): void {
  window.dispatchEvent(new Event(APP_DATA_CHANGED_EVENT))
}
