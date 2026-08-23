export function installTodayScheduleMenuReveal() {
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest('.referenceMoreMenu button')
    if (!(button instanceof HTMLButtonElement)) return
    if (button.textContent?.trim() !== 'Horário de hoje') return

    button.closest('details.referenceMoreMenu')?.removeAttribute('open')

    window.setTimeout(() => {
      const panel = document.querySelector('details.referenceWorkPanel')
      if (!(panel instanceof HTMLDetailsElement)) return

      panel.open = true

      const editor = panel.querySelector('.referenceManualSchedule')
      editor?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const firstTimeInput = editor?.querySelector('input[type="time"]')
      if (firstTimeInput instanceof HTMLInputElement) {
        firstTimeInput.focus({ preventScroll: true })
      }
    }, 0)
  })
}
