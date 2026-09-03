import { secureStorage } from '../../security/secureStorage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDeadlineNotificationCapability,
  requestDeadlineNotificationPermission,
  sendDeadlineNotificationTest,
  type DeadlineNotificationCapability,
} from '../../shared/notifications/deadlineNotifications'
import {
  activeCategoryCount,
  loadNotificationPreferences,
  notificationScheduleSummary,
  saveNotificationPreferences,
  type NotificationCategoryPreferences,
  type NotificationPreferences,
  type NotificationScheduleMode,
} from '../../shared/notifications/notificationPreferences'
import { AppIcon, type AppIconName } from '../components/ui/AppIcon'
import { useNotificationStore } from '../store/useNotificationStore'

type NotificationView =
  | 'center'
  | 'device'
  | 'permissions'
  | 'categories'
  | 'schedule'
  | 'test'
  | 'summary'
  | 'help'

const initialCapability: DeadlineNotificationCapability = {
  permission: 'unsupported',
  notificationsSupported: false,
  serviceWorkerSupported: false,
  serviceWorkerRegistered: false,
  pushSupported: false,
  pushSubscribed: false,
  standalone: false,
  platform: 'other',
}

const categoryOptions: Array<{
  key: keyof NotificationCategoryPreferences
  title: string
  detail: string
  icon: AppIconName
}> = [
  { key: 'journey', title: 'Jornada', detail: 'Início, fim, lembretes e turnos', icon: 'journey' },
  { key: 'break', title: 'Pausas', detail: 'Lembretes e fim de pausa', icon: 'break' },
  { key: 'focus', title: 'Foco', detail: 'Sessões, objetivos e avisos', icon: 'focus' },
  { key: 'medication', title: 'Medicação', detail: 'Horários e lembretes configurados', icon: 'medication' },
  { key: 'glo', title: 'glo', detail: 'Alertas das sessões configuradas', icon: 'status' },
  { key: 'system', title: 'Geral', detail: 'Atualizações e avisos importantes', icon: 'bell' },
]

const weekdays = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function platformLabel(capability: DeadlineNotificationCapability): string {
  if (capability.platform === 'ios') return 'iOS / iPadOS'
  if (capability.platform === 'android') return 'Android'
  if (capability.platform === 'desktop') return 'Computador'
  return 'Web'
}

function platformIcon(capability: DeadlineNotificationCapability): AppIconName {
  if (capability.platform === 'ios' || capability.platform === 'android') return 'phone'
  if (capability.platform === 'desktop') return 'monitor'
  return 'globe'
}

function statusIcon(state: 'good' | 'warning' | 'muted'): AppIconName {
  if (state === 'good') return 'check'
  if (state === 'warning') return 'warning'
  return 'info'
}

function permissionStatus(capability: DeadlineNotificationCapability): {
  label: string
  state: 'good' | 'warning' | 'muted'
} {
  if (capability.permission === 'granted') return { label: 'Ativas', state: 'good' }
  if (capability.permission === 'denied') return { label: 'Bloqueadas', state: 'warning' }
  if (capability.permission === 'default') return { label: 'Verificar', state: 'warning' }
  return { label: 'Indisponível', state: 'muted' }
}

function setupStep(view: NotificationView): number {
  if (view === 'device') return 1
  if (view === 'permissions') return 2
  if (view === 'categories') return 3
  if (view === 'schedule') return 4
  if (view === 'test') return 5
  if (view === 'summary') return 6
  return 0
}

function SetupProgress({ view }: { view: NotificationView }) {
  const current = setupStep(view)
  if (!current) return null
  return (
    <div className="notificationSetupProgress" aria-label={'Passo ' + current + ' de 6'}>
      {Array.from({ length: 6 }, (_, index) => {
        const step = index + 1
        return (
          <span
            key={step}
            className={step < current ? 'isComplete' : step === current ? 'isCurrent' : ''}
          >
            {step < current ? <AppIcon name="check" /> : step}
          </span>
        )
      })}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="notificationBackButton" type="button" onClick={onClick} aria-label="Voltar">
      <AppIcon name="chevron-left" />
    </button>
  )
}

function SetupHeader({
  view,
  title,
  onBack,
}: {
  view: NotificationView
  title: string
  onBack: () => void
}) {
  return (
    <>
      <div className="notificationSetupHeader">
        <BackButton onClick={onBack} />
        <h1>{title}</h1>
        <span aria-hidden="true" />
      </div>
      <SetupProgress view={view} />
    </>
  )
}

export function NotificationCenterPage() {
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clear = useNotificationStore((state) => state.clear)
  const remove = useNotificationStore((state) => state.remove)

  const [view, setView] = useState<NotificationView>('center')
  const [capability, setCapability] = useState<DeadlineNotificationCapability>(initialCapability)
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadNotificationPreferences())
  const [draft, setDraft] = useState<NotificationPreferences>(() => loadNotificationPreferences())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [lastTestAt, setLastTestAt] = useState<string | null>(
    () => secureStorage.getItem('foco-jornada:last-notification-test'),
  )

  const refreshCapability = useCallback(async () => {
    try {
      setCapability(await getDeadlineNotificationCapability())
    } catch {
      setCapability(initialCapability)
    }
  }, [])

  useEffect(() => {
    void refreshCapability()
    const handleRefresh = () => void refreshCapability()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshCapability()
    }
    window.addEventListener('focus', handleRefresh)
    window.addEventListener('pageshow', handleRefresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('pageshow', handleRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshCapability])

  const unread = notifications.filter((item) => !item.read).length
  const recent = useMemo(() => notifications.slice(0, 8), [notifications])
  const permission = permissionStatus(capability)
  const systemReady = capability.permission === 'granted' && capability.serviceWorkerRegistered
  const iosNeedsInstall = capability.platform === 'ios' && !capability.standalone

  function startSetup() {
    const current = loadNotificationPreferences()
    setPreferences(current)
    setDraft(structuredClone(current))
    setMessage('')
    setView('device')
  }

  function changeCategory(key: keyof NotificationCategoryPreferences, value: boolean) {
    setDraft((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [key]: value,
      },
    }))
  }

  function changeScheduleMode(mode: NotificationScheduleMode) {
    setDraft((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        mode,
      },
    }))
  }

  function toggleWeekday(day: number) {
    setDraft((current) => {
      const selected = current.schedule.weekdays.includes(day)
      const nextDays = selected
        ? current.schedule.weekdays.filter((value) => value !== day)
        : [...current.schedule.weekdays, day].sort((left, right) => left - right)
      return {
        ...current,
        schedule: {
          ...current.schedule,
          weekdays: nextDays.length ? nextDays : [day],
        },
      }
    })
  }

  async function requestPermission() {
    setBusy(true)
    setMessage('')
    try {
      const result = await requestDeadlineNotificationPermission()
      await refreshCapability()
      if (result === 'granted') setMessage('Permissão concedida neste dispositivo.')
      else if (result === 'denied') setMessage('A permissão está bloqueada. Altera-a nas definições do navegador ou da aplicação instalada.')
      else if (result === 'unsupported') setMessage('Este navegador não disponibiliza a API de notificações do sistema.')
      else setMessage('A permissão ainda não foi concedida.')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true)
    setMessage('')
    try {
      const shown = await sendDeadlineNotificationTest()
      if (!shown) {
        setMessage('Não foi possível apresentar a notificação de teste. Confirma a permissão e volta a tentar.')
        return
      }
      const testedAt = new Date().toISOString()
      secureStorage.setItem('foco-jornada:last-notification-test', testedAt)
      setLastTestAt(testedAt)
      setMessage('Notificação de teste enviada com sucesso.')
    } finally {
      setBusy(false)
      await refreshCapability()
    }
  }

  function finishSetup() {
    const saved = saveNotificationPreferences({
      ...draft,
      setupComplete: true,
    })
    setPreferences(saved)
    setDraft(saved)
    setMessage('')
    setView('center')
  }

  if (view === 'help') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view="help" title="Como funciona" onBack={() => setView('center')} />
          <div className="notificationHelpContent">
            <div className="notificationHelpIcon"><AppIcon name="bell" /></div>
            <h2>Notificações móveis no Foco Jornada</h2>
            <p>
              O centro local guarda os avisos dentro da aplicação. As notificações do dispositivo
              dependem da permissão do navegador e das regras do sistema operativo.
            </p>
            <article>
              <strong>iPhone / iPad</strong>
              <span>Para Web Push no iOS/iPadOS, usa a aplicação adicionada ao Ecrã Principal e autoriza as notificações quando solicitado.</span>
            </article>
            <article>
              <strong>Android</strong>
              <span>No Chrome/PWA, autoriza as notificações quando o navegador apresentar o pedido.</span>
            </article>
            <article>
              <strong>Aplicação totalmente fechada</strong>
              <span>A entrega remota exige Web Push com uma subscrição e serviço de envio. Sem backend, os deadlines são reconciliados quando a aplicação volta a executar.</span>
            </article>
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={() => setView('center')}>
            Voltar ao centro
          </button>
        </div>
      </section>
    )
  }

  if (view === 'device') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Ativar notificações" onBack={() => setView('center')} />
          <div className="notificationSetupSection">
            <div className="notificationPlatformHeading">
              <span className="notificationPlatformIcon" aria-hidden="true">
                <AppIcon name={platformIcon(capability)} />
              </span>
              <div>
                <span>DISPOSITIVO</span>
                <h2>
                  {capability.platform === 'ios'
                    ? 'No iPhone/iPad'
                    : capability.platform === 'android'
                      ? 'No Android'
                      : 'No computador / browser'}
                </h2>
              </div>
            </div>

            {capability.platform === 'ios' ? (
              <ol className="notificationInstructionList">
                <li><span>1</span><p>Abre o Foco Jornada no Safari.</p></li>
                <li><span>2</span><p>No menu Partilhar, escolhe <strong>Adicionar ao Ecrã Principal</strong>.</p></li>
                <li><span>3</span><p>Abre a aplicação pelo ícone instalado.</p></li>
                <li><span>4</span><p>Quando solicitado, permite o envio de notificações.</p></li>
              </ol>
            ) : (
              <ol className="notificationInstructionList">
                <li><span>1</span><p>Mantém o Foco Jornada aberto neste navegador ou instala a PWA.</p></li>
                <li><span>2</span><p>No passo seguinte, autoriza as notificações quando o navegador solicitar.</p></li>
                <li><span>3</span><p>Podes alterar a permissão mais tarde nas definições do navegador ou sistema.</p></li>
              </ol>
            )}

            <div className="notificationInfoCallout">
              <span aria-hidden="true"><AppIcon name="info" /></span>
              <p>No browser, o centro local da aplicação continua disponível mesmo sem notificações do sistema.</p>
            </div>

            <div className="notificationPlatformChoices">
              <span>PLATAFORMA DETETADA</span>
              <button type="button" disabled>
                <strong>{platformLabel(capability)}</strong>
                <small>{capability.standalone ? 'Aplicação instalada' : 'Browser'}</small>
              </button>
            </div>
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={() => setView('permissions')}>
            Continuar
          </button>
        </div>
      </section>
    )
  }

  if (view === 'permissions') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Permissões" onBack={() => setView('device')} />
          <div className="notificationSetupSection">
            <span className="notificationSectionLead">Confirma os canais disponíveis neste dispositivo.</span>
            <div className="notificationStatusList">
              <div>
                <span className={'notificationStatusDot state-' + permission.state}><AppIcon name={statusIcon(permission.state)} /></span>
                <div><strong>Permissão do navegador</strong><small>Controla os avisos apresentados pelo sistema.</small></div>
                <b className={'state-' + permission.state}>{permission.label}</b>
              </div>
              <div>
                <span className={'notificationStatusDot ' + (capability.serviceWorkerRegistered ? 'state-good' : 'state-warning')}><AppIcon name={capability.serviceWorkerRegistered ? 'check' : 'warning'} /></span>
                <div><strong>Service Worker</strong><small>Canal PWA para notificações persistentes.</small></div>
                <b className={capability.serviceWorkerRegistered ? 'state-good' : 'state-warning'}>
                  {capability.serviceWorkerRegistered ? 'Pronto' : capability.serviceWorkerSupported ? 'Pendente' : 'Indisponível'}
                </b>
              </div>
              <div>
                <span className={'notificationStatusDot ' + (capability.pushSubscribed ? 'state-good' : 'state-muted')}><AppIcon name={capability.pushSubscribed ? 'check' : 'info'} /></span>
                <div><strong>Web Push</strong><small>Entrega remota com a aplicação fechada.</small></div>
                <b className={capability.pushSubscribed ? 'state-good' : 'state-muted'}>
                  {capability.pushSubscribed ? 'Ativo' : capability.pushSupported ? 'Sem subscrição' : 'Indisponível'}
                </b>
              </div>
            </div>

            {iosNeedsInstall ? (
              <div className="notificationWarningCallout">
                <strong>Instala primeiro no Ecrã Principal</strong>
                <p>No iPhone/iPad, a autorização de Web Push deve ser feita a partir da web app instalada.</p>
              </div>
            ) : capability.permission === 'default' ? (
              <button className="notificationOutlineAction" type="button" disabled={busy} onClick={() => void requestPermission()}>
                {busy ? 'A pedir autorização…' : 'Autorizar notificações'}
              </button>
            ) : capability.permission === 'denied' ? (
              <div className="notificationWarningCallout">
                <strong>Permissão bloqueada</strong>
                <p>Abre as definições do site/aplicação no sistema e permite notificações. Depois volta a esta página.</p>
              </div>
            ) : null}

            {message ? <p className="notificationSetupMessage" role="status">{message}</p> : null}
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={() => setView('categories')}>
            Continuar
          </button>
        </div>
      </section>
    )
  }

  if (view === 'categories') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Categorias" onBack={() => setView('permissions')} />
          <div className="notificationSetupSection">
            <span className="notificationSectionLead">Escolhe sobre o que desejas receber notificações do dispositivo.</span>
            <div className="notificationCategoryList">
              {categoryOptions.map((option) => (
                <label key={option.key}>
                  <span className={'notificationCategorySymbol category-' + option.key}><AppIcon name={option.icon} /></span>
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.detail}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.categories[option.key]}
                    onChange={(event) => changeCategory(option.key, event.target.checked)}
                  />
                  <i aria-hidden="true" />
                </label>
              ))}
            </div>
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={() => setView('schedule')}>
            Guardar e continuar
          </button>
        </div>
      </section>
    )
  }

  if (view === 'schedule') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Horários" onBack={() => setView('categories')} />
          <div className="notificationSetupSection">
            <span className="notificationSectionLead">Define quando desejas receber notificações do dispositivo.</span>
            <div className="notificationScheduleModes">
              {([
                ['always', 'Sempre', 'Receber a qualquer hora'],
                ['window', 'Horário personalizado', 'Receber apenas no período definido'],
                ['quiet', 'Não perturbar', 'Bloquear alertas durante o período definido'],
              ] as Array<[NotificationScheduleMode, string, string]>).map(([mode, title, detail]) => (
                <label key={mode}>
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  <input
                    type="radio"
                    name="notification-schedule-mode"
                    checked={draft.schedule.mode === mode}
                    onChange={() => changeScheduleMode(mode)}
                  />
                  <i aria-hidden="true" />
                </label>
              ))}
            </div>

            {draft.schedule.mode !== 'always' ? (
              <>
                <div className="notificationTimeGrid">
                  <label>
                    <span>{draft.schedule.mode === 'quiet' ? 'Não perturbar desde' : 'Das'}</span>
                    <input
                      type="time"
                      value={draft.schedule.startTime}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        schedule: { ...current.schedule, startTime: event.target.value },
                      }))}
                    />
                  </label>
                  <label>
                    <span>Até</span>
                    <input
                      type="time"
                      value={draft.schedule.endTime}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        schedule: { ...current.schedule, endTime: event.target.value },
                      }))}
                    />
                  </label>
                </div>

                <div className="notificationWeekdays">
                  <strong>Dias da semana</strong>
                  <div>
                    {weekdays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        className={draft.schedule.weekdays.includes(day.value) ? 'isActive' : ''}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={() => setView('test')}>
            Guardar e continuar
          </button>
        </div>
      </section>
    )
  }

  if (view === 'test') {
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Teste" onBack={() => setView('schedule')} />
          <div className="notificationTestStage">
            <span className="notificationTestHero"><AppIcon name="bell" motion="ring" /></span>
            <h2>Enviar notificação de teste</h2>
            <p>Vamos enviar uma notificação para verificar se está a funcionar corretamente.</p>
            <div className="notificationInfoCallout">
              <span aria-hidden="true"><AppIcon name="info" /></span>
              <p>O teste ignora temporariamente as categorias e horários para validar apenas o canal do dispositivo.</p>
            </div>
            {lastTestAt ? <small>Último teste: {formatDateTime(lastTestAt)}</small> : null}
            {message ? <p className="notificationSetupMessage" role="status">{message}</p> : null}
          </div>
          <button
            className="notificationPrimaryAction"
            type="button"
            disabled={busy || capability.permission !== 'granted'}
            onClick={() => void sendTest()}
          >
            {busy ? 'A enviar…' : 'Enviar teste'}
          </button>
          <button className="notificationSecondaryAction" type="button" onClick={() => setView('summary')}>
            {capability.permission === 'granted' ? 'Continuar' : 'Continuar sem teste'}
          </button>
        </div>
      </section>
    )
  }

  if (view === 'summary') {
    const selectedCount = activeCategoryCount(draft)
    return (
      <section className="notificationMobilePage">
        <div className="notificationPhoneCard">
          <SetupHeader view={view} title="Resumo" onBack={() => setView('test')} />
          <div className="notificationSummaryStage">
            <span className="notificationSummaryCheck"><AppIcon name="check" motion="draw" /></span>
            <h2>Tudo pronto!</h2>
            <p>Revê a configuração e conclui para aplicar as preferências neste perfil.</p>
            <div className="notificationSummaryList">
              <div><span>Categorias</span><strong>{selectedCount} ativas</strong></div>
              <div><span>Horários</span><strong>{notificationScheduleSummary(draft)}</strong></div>
              <div><span>Plataforma</span><strong>{platformLabel(capability)}</strong></div>
              <div><span>Estado</span><strong className={systemReady ? 'state-good' : 'state-warning'}>{systemReady ? 'Ativo' : 'Centro local ativo'}</strong></div>
            </div>
          </div>
          <button className="notificationPrimaryAction" type="button" onClick={finishSetup}>
            Concluir
          </button>
          <button className="notificationSecondaryAction" type="button" onClick={() => setView('center')}>
            Voltar ao centro
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="notificationCenterPage" aria-labelledby="notification-center-title">
      <header className="notificationCenterHeader">
        <div>
          <span>NOTIFICAÇÕES</span>
          <h1 id="notification-center-title">Centro de notificações</h1>
        </div>
        <div className="notificationCenterUnread" aria-label={unread + ' notificações não lidas'}>
          <strong>{unread}</strong>
          <span>Não lidas</span>
        </div>
      </header>

      <section className="notificationCenterOverview">
        <div className="notificationCenterIdentity">
          <span className="notificationCenterBell"><AppIcon name="bell" /></span>
          <div>
            <h2>Centro de notificações</h2>
            <p>As notificações ajudam a manter o foco e a não perder nada importante.</p>
          </div>
        </div>

        <div className="notificationCenterState">
          <h3>Estado atual</h3>
          <div className="notificationStatusList">
            <div>
              <span className={'notificationStatusDot state-' + permission.state}><AppIcon name={statusIcon(permission.state)} /></span>
              <div><strong>Notificações do dispositivo</strong><small>Permissão do navegador / PWA</small></div>
              <b className={'state-' + permission.state}>{permission.label}</b>
              <AppIcon name="chevron-right" />
            </div>
            <div>
              <span className={'notificationStatusDot ' + (capability.serviceWorkerRegistered ? 'state-good' : 'state-warning')}>✓</span>
              <div><strong>Service Worker</strong><small>Canal local da PWA</small></div>
              <b className={capability.serviceWorkerRegistered ? 'state-good' : 'state-warning'}>
                {capability.serviceWorkerRegistered ? 'Pronto' : 'Verificar'}
              </b>
              <AppIcon name="chevron-right" />
            </div>
            <div>
              <span className={'notificationStatusDot ' + (capability.pushSubscribed ? 'state-good' : 'state-muted')}>•</span>
              <div><strong>Web Push (PWA)</strong><small>Entrega remota com a app fechada</small></div>
              <b className={capability.pushSubscribed ? 'state-good' : 'state-muted'}>
                {capability.pushSubscribed ? 'Ativo' : 'Inativo'}
              </b>
              <AppIcon name="chevron-right" />
            </div>
          </div>
        </div>

        <div className="notificationCenterSummary">
          <h3>Resumo</h3>
          <p>
            {systemReady
              ? 'O canal do dispositivo está autorizado. As categorias e os horários abaixo controlam os alertas do sistema.'
              : iosNeedsInstall
                ? 'No iPhone/iPad, adiciona a aplicação ao Ecrã Principal e conclui a configuração para receber alertas do dispositivo.'
                : 'O centro local está ativo. Conclui os passos de configuração para ativar os alertas do dispositivo.'}
          </p>
          {preferences.setupComplete ? (
            <div className="notificationPreferenceSummary">
              <span>{activeCategoryCount(preferences)} categorias</span>
              <span>{notificationScheduleSummary(preferences)}</span>
              <span>{platformLabel(capability)}</span>
            </div>
          ) : null}
        </div>

        <div className="notificationCenterActions">
          <button className="notificationPrimaryAction" type="button" onClick={startSetup}>
            <AppIcon name="bell" />
            {preferences.setupComplete ? 'Reconfigurar notificações' : 'Ativar notificações'}
          </button>
          <button className="notificationSecondaryAction" type="button" onClick={() => setView('help')}>
            Saiba como funciona
          </button>
        </div>
      </section>

      <section className="notificationInboxSection" aria-labelledby="notification-inbox-title">
        <header>
          <div>
            <span>HISTÓRICO LOCAL</span>
            <h2 id="notification-inbox-title">Notificações recentes</h2>
          </div>
          <div>
            <button type="button" onClick={markAllRead} disabled={!unread}>Marcar lidas</button>
            <button type="button" onClick={() => window.confirm('Limpar o histórico local de notificações?') && clear()} disabled={!notifications.length}>Limpar</button>
          </div>
        </header>

        {recent.length === 0 ? (
          <div className="notificationInboxEmpty">
            <span><AppIcon name="check" motion="draw" /></span>
            <strong>Sem notificações por ler</strong>
            <p>As ações da aplicação passam a ficar guardadas aqui, sem popups no ecrã.</p>
          </div>
        ) : (
          <div className="notificationInboxList">
            {recent.map((item) => (
              <article key={item.id} className={item.read ? '' : 'isUnread'}>
                <span className={'notificationInboxTone tone-' + item.tone} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  {item.detail ? <p>{item.detail}</p> : null}
                  <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                </div>
                <button type="button" onClick={() => remove(item.id)} aria-label={'Eliminar notificação: ' + item.title}><AppIcon name="trash" /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="notificationPrivacyNote">
        <strong>Privacidade</strong>
        <span>O histórico e as preferências ficam cifrados no cofre local deste perfil.</span>
      </footer>
    </section>
  )
}
