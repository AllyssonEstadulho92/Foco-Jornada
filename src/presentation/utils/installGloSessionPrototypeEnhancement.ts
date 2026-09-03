const GLO_CARD_SELECTOR = '.sticksDeviceTimerCard'
const SOURCE_ACTION_SELECTOR = '.sticksRegisterPrimary'
const ENHANCED_ACTION_CLASS = 'gloSessionStartAction'

function syncGloSessionPrototype(): void {
  const card = document.querySelector<HTMLElement>(GLO_CARD_SELECTOR)
  const sourceAction = document.querySelector<HTMLButtonElement>(SOURCE_ACTION_SELECTOR)

  if (!card || !sourceAction) return

  let action = card.querySelector<HTMLButtonElement>(`.${ENHANCED_ACTION_CLASS}`)

  if (!action) {
    action = document.createElement('button')
    action.type = 'button'
    action.className = ENHANCED_ACTION_CLASS
    action.setAttribute('aria-label', 'Registar 1 stick e iniciar sessão glo')
    action.addEventListener('click', () => {
      const currentSource = document.querySelector<HTMLButtonElement>(SOURCE_ACTION_SELECTOR)
      if (!currentSource || currentSource.disabled) return
      currentSource.click()
    })

    const timerLayout = card.querySelector('.gloSessionTimerLayout')
    if (timerLayout) card.insertBefore(action, timerLayout)
    else card.append(action)
  }

  const nextLabel = sourceAction.textContent?.trim() || 'Registar 1 stick e iniciar sessão'
  if (action.textContent !== nextLabel) action.textContent = nextLabel
  if (action.disabled !== sourceAction.disabled) action.disabled = sourceAction.disabled

  action.classList.toggle('isSessionActive', sourceAction.textContent?.includes('em curso') ?? false)

  const dial = card.querySelector<HTMLElement>('.gloSessionDial')
  const rawProgress = dial?.style.getPropertyValue('--glo-session-progress').trim() ?? ''
  const progressDegrees = Number.parseFloat(rawProgress)
  const progressPercent = Number.isFinite(progressDegrees)
    ? Math.max(0, Math.min(100, progressDegrees / 3.6))
    : 0

  card.style.setProperty('--glo-session-progress-percent', `${progressPercent}%`)
}

export function installGloSessionPrototypeEnhancement(): () => void {
  let scheduled = false

  const scheduleSync = () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      syncGloSessionPrototype()
    })
  }

  scheduleSync()

  const observer = new MutationObserver(scheduleSync)
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'class', 'style'],
  })
}
