import type { MedicationDataProtectionService } from '../../application/personalStock/MedicationDataProtectionService'
import type { MedicationDoseStatusService } from '../../application/personalStock/MedicationDoseStatusService'
import {
  calculateMedicationNextDoseCountdown,
  formatMedicationCountdown,
  resolveLastActiveTakenEvent,
} from '../../application/personalStock/MedicationNextDoseTimer'
import type { PersonalStockService } from '../../application/personalStock/PersonalStockService'
import type { MedicationSummary } from '../../domain/personalStock/models'

const PAGE_SELECTOR = '.medicationLinearPage'
const WORKSPACE_SELECTOR = '#medication-workspace'
const HOST_ID = 'medication-next-dose-timer-enhancement'
const REFRESH_INTERVAL_MS = 30_000
const ALERT_THRESHOLD_SECONDS = 15 * 60

interface MedicationTimerServices {
  personalStockService: PersonalStockService
  medicationDoseStatusService: MedicationDoseStatusService
  medicationDataProtectionService: MedicationDataProtectionService
}

interface NextDoseSnapshot {
  medication: MedicationSummary
  nextDoseAt: string
  quantity: string
  lastConfirmedAt: string | null
  timezone: string
}

interface TimerState {
  snapshot: NextDoseSnapshot | null
  statusMessage: string
  loading: boolean
}

function formatDateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function formatTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function createHost(): HTMLElement | null {
  const page = document.querySelector<HTMLElement>(PAGE_SELECTOR)
  const workspace = document.querySelector<HTMLElement>(WORKSPACE_SELECTOR)
  if (!page || !workspace) return null

  let host = document.getElementById(HOST_ID)
  if (host) return host

  host = document.createElement('section')
  host.id = HOST_ID
  host.className = 'medNextDoseCard'
  host.setAttribute('aria-labelledby', 'med-next-dose-title')
  workspace.insertAdjacentElement('afterend', host)
  return host
}

function renderShell(host: HTMLElement): void {
  if (host.dataset.ready === 'true') return
  host.dataset.ready = 'true'
  host.innerHTML = `
    <div class="medNextDoseHeader">
      <div>
        <span class="stockPanelTag">PRÓXIMA TOMADA</span>
        <h2 id="med-next-dose-title">Tempo até ao próximo horário</h2>
        <p>Contagem automática baseada exclusivamente nos horários de medicação que estão registados na aplicação.</p>
      </div>
      <span class="medNextDoseExactBadge">CÁLCULO POR TIMESTAMP</span>
    </div>

    <div class="medNextDoseBody">
      <div class="medNextDoseDial" aria-hidden="true">
        <div class="medNextDoseDialFace">
          <strong data-med-countdown>--:--:--</strong>
          <small>restantes</small>
        </div>
      </div>

      <div class="medNextDoseContent">
        <div class="medNextDoseMedicine">
          <span data-med-name>Sem próxima toma calculável</span>
          <strong data-med-dose>—</strong>
        </div>

        <div class="medNextDoseFacts">
          <div><span>Última confirmação</span><strong data-med-last>—</strong></div>
          <div><span>Próxima programada</span><strong data-med-next>—</strong></div>
          <div><span>Quantidade</span><strong data-med-quantity>—</strong></div>
        </div>

        <div class="medNextDoseProgress" aria-label="Progresso até ao próximo horário">
          <span data-med-progress></span>
        </div>

        <div class="medNextDoseStatus" data-med-status role="status">
          A calcular a próxima toma programada…
        </div>

        <p class="medNextDoseSafety">
          Este relógio não inventa nem decide um intervalo clínico. Mostra, ao segundo, o tempo até ao próximo horário que está configurado. Se a prescrição ou o horário mudarem, atualiza primeiro a configuração ou confirma com o médico/farmacêutico.
        </p>

        <div class="medNextDoseSources" aria-label="Fontes de segurança de medicação">
          <span>Referências de segurança:</span>
          <a href="https://www.infarmed.pt/" target="_blank" rel="noreferrer">INFARMED</a>
          <a href="https://medlineplus.gov/ency/patientinstructions/000883.htm" target="_blank" rel="noreferrer">MedlinePlus</a>
        </div>
      </div>
    </div>
  `
}

function setText(host: HTMLElement, selector: string, value: string): void {
  const element = host.querySelector<HTMLElement>(selector)
  if (element && element.textContent !== value) element.textContent = value
}

function updateLiveTimer(host: HTMLElement, state: TimerState, now = new Date()): void {
  const snapshot = state.snapshot
  host.classList.toggle('isLoading', state.loading)

  if (!snapshot) {
    host.classList.remove('isDue', 'isSoon', 'hasExactDose')
    setText(host, '[data-med-countdown]', '--:--:--')
    setText(host, '[data-med-name]', 'Sem próxima toma calculável')
    setText(host, '[data-med-dose]', '—')
    setText(host, '[data-med-last]', '—')
    setText(host, '[data-med-next]', '—')
    setText(host, '[data-med-quantity]', '—')
    setText(host, '[data-med-status]', state.statusMessage || 'Configura um horário válido para obter uma contagem exata.')
    const progress = host.querySelector<HTMLElement>('[data-med-progress]')
    if (progress) progress.style.width = '0%'
    return
  }

  const countdown = calculateMedicationNextDoseCountdown(
    snapshot.nextDoseAt,
    now,
    snapshot.lastConfirmedAt,
  )

  if (!countdown) {
    state.snapshot = null
    state.statusMessage = 'O horário da próxima toma é inválido. Revê a configuração antes de continuar.'
    updateLiveTimer(host, state, now)
    return
  }

  const medicineName = `${snapshot.medication.medication.name} ${snapshot.medication.medication.dosage ?? ''}`.trim()
  const unit = snapshot.medication.medication.unit

  host.classList.toggle('isDue', countdown.due)
  host.classList.toggle('isSoon', !countdown.due && countdown.remainingSeconds <= ALERT_THRESHOLD_SECONDS)
  host.classList.add('hasExactDose')

  setText(host, '[data-med-countdown]', formatMedicationCountdown(countdown.remainingSeconds))
  setText(host, '[data-med-name]', medicineName)
  setText(host, '[data-med-dose]', `Próximo horário: ${formatTime(snapshot.nextDoseAt, snapshot.timezone)}`)
  setText(
    host,
    '[data-med-last]',
    snapshot.lastConfirmedAt ? formatDateTime(snapshot.lastConfirmedAt, snapshot.timezone) : 'Sem confirmação anterior',
  )
  setText(host, '[data-med-next]', formatDateTime(snapshot.nextDoseAt, snapshot.timezone))
  setText(host, '[data-med-quantity]', `${snapshot.quantity} ${unit}`)

  const status = countdown.due
    ? 'A hora programada foi atingida. Usa o registo da toma existente; o temporizador não autoriza nem recomenda uma dose adicional.'
    : countdown.remainingSeconds <= ALERT_THRESHOLD_SECONDS
      ? `Próxima toma programada em ${formatMedicationCountdown(countdown.remainingSeconds)}.`
      : `Faltam exatamente ${formatMedicationCountdown(countdown.remainingSeconds)} para o próximo horário configurado.`
  setText(host, '[data-med-status]', status)

  const progress = host.querySelector<HTMLElement>('[data-med-progress]')
  if (progress) progress.style.width = `${countdown.progressPercent ?? 0}%`

  const dial = host.querySelector<HTMLElement>('.medNextDoseDial')
  if (dial) {
    const degrees = (countdown.progressPercent ?? 0) * 3.6
    dial.style.setProperty('--med-next-dose-progress', `${degrees}deg`)
  }
}

async function resolveNextSnapshot(services: MedicationTimerServices, now = new Date()): Promise<{ snapshot: NextDoseSnapshot | null; message: string }> {
  const medications = await services.personalStockService.listMedications()
  if (!medications.length) return { snapshot: null, message: 'Ainda não existem medicamentos registados.' }

  const candidates: NextDoseSnapshot[] = []
  let blockedByUnconfirmedPostponement = false

  await Promise.all(medications.map(async (medication) => {
    try {
      const profile = await services.medicationDataProtectionService.getProfile(medication.medication.id)
      if (profile.status !== 'active') return

      const [forecast, events] = await Promise.all([
        services.medicationDoseStatusService.forecastMedication(medication.medication.id, now),
        services.personalStockService.listDoseEvents(medication.medication.id),
      ])
      const lastTaken = resolveLastActiveTakenEvent(events)
      candidates.push({
        medication,
        nextDoseAt: forecast.nextDose.scheduledAt,
        quantity: forecast.nextDose.quantity,
        lastConfirmedAt: lastTaken?.createdAt ?? null,
        timezone: medication.medication.timezone,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('toma adiada ainda por confirmar')) blockedByUnconfirmedPostponement = true
    }
  }))

  candidates.sort((left, right) => Date.parse(left.nextDoseAt) - Date.parse(right.nextDoseAt))
  const snapshot = candidates[0] ?? null
  if (snapshot) return { snapshot, message: '' }
  if (blockedByUnconfirmedPostponement) {
    return {
      snapshot: null,
      message: 'Existe uma toma adiada ainda por confirmar. Confirma ou corrige esse registo para a aplicação voltar a calcular a próxima toma sem fazer suposições.',
    }
  }
  return {
    snapshot: null,
    message: 'Não existem dados suficientes para calcular a próxima toma com precisão. Confirma os horários dos medicamentos em uso.',
  }
}

export function installMedicationNextDoseTimerEnhancement(services: MedicationTimerServices): () => void {
  const state: TimerState = {
    snapshot: null,
    statusMessage: '',
    loading: false,
  }
  let refreshTimer: number | null = null
  let tickTimer: number | null = null
  let refreshScheduled = false
  let refreshing = false

  const tick = () => {
    const host = createHost()
    if (!host) return
    renderShell(host)
    updateLiveTimer(host, state)
  }

  const refresh = async () => {
    if (refreshing || !document.querySelector(PAGE_SELECTOR)) return
    refreshing = true
    state.loading = true
    tick()
    try {
      const result = await resolveNextSnapshot(services)
      state.snapshot = result.snapshot
      state.statusMessage = result.message
    } catch (error) {
      state.snapshot = null
      state.statusMessage = error instanceof Error
        ? error.message
        : 'Não foi possível calcular a próxima toma com precisão.'
    } finally {
      state.loading = false
      refreshing = false
      tick()
    }
  }

  const scheduleRefresh = () => {
    if (refreshScheduled) return
    refreshScheduled = true
    window.setTimeout(() => {
      refreshScheduled = false
      void refresh()
    }, 180)
  }

  const observer = new MutationObserver((mutations) => {
    const host = document.getElementById(HOST_ID)
    const onlyOwnChanges = host && mutations.every((mutation) => host.contains(mutation.target))
    if (onlyOwnChanges) return

    if (!document.querySelector(PAGE_SELECTOR)) return
    createHost()
    scheduleRefresh()
  })
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })

  const handleClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element) || !target.closest(PAGE_SELECTOR)) return
    if (!target.closest('button')) return
    window.setTimeout(scheduleRefresh, 350)
    window.setTimeout(scheduleRefresh, 1200)
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      tick()
      scheduleRefresh()
    }
  }

  document.addEventListener('click', handleClick, true)
  document.addEventListener('visibilitychange', handleVisibility)

  tickTimer = window.setInterval(tick, 1000)
  refreshTimer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
  void refresh()

  const cleanup = () => {
    if (tickTimer !== null) window.clearInterval(tickTimer)
    if (refreshTimer !== null) window.clearInterval(refreshTimer)
    observer.disconnect()
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('beforeunload', cleanup)
  }
  window.addEventListener('beforeunload', cleanup, { once: true })
  return cleanup
}
