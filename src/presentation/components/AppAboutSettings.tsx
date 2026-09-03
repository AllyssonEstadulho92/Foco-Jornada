import { useState } from 'react'
import { AppIcon } from './ui/AppIcon'

type VersionCheckState = 'idle' | 'checking' | 'current' | 'update' | 'unavailable' | 'error'

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || Boolean(navigatorWithStandalone.standalone)
}

function formatBuildDate() {
  const buildDate = new Date(__APP_BUILD_DATE__)
  if (Number.isNaN(buildDate.getTime())) return 'Data da compilação indisponível'

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(buildDate)
}

function AboutChevron() {
  return <span className="referenceChevron" aria-hidden="true"><AppIcon name="chevron-right" /></span>
}

async function waitForWorkerState(worker: ServiceWorker | null, timeoutMs = 4000) {
  if (!worker) return
  if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') return

  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, timeoutMs)
    const onStateChange = () => {
      if (worker.state !== 'installed' && worker.state !== 'activated' && worker.state !== 'redundant') return
      window.clearTimeout(timer)
      worker.removeEventListener('statechange', onStateChange)
      resolve()
    }
    worker.addEventListener('statechange', onStateChange)
  })
}

export function AppAboutSettings() {
  const [versionState, setVersionState] = useState<VersionCheckState>('idle')
  const [versionMessage, setVersionMessage] = useState('As atualizações são verificadas automaticamente quando a aplicação está online.')
  const standalone = isStandaloneMode()
  const serviceWorkerActive = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator)) {
      setVersionState('unavailable')
      setVersionMessage('Este navegador não suporta a atualização automática da aplicação.')
      return
    }

    if (!navigator.onLine) {
      setVersionState('unavailable')
      setVersionMessage('Sem ligação à Internet. A versão atual continua disponível e a verificação será repetida quando voltares a ficar online.')
      return
    }

    try {
      setVersionState('checking')
      setVersionMessage('A comparar esta compilação com a versão publicada…')

      const registration = await navigator.serviceWorker.ready
      let updateFound = false
      const onUpdateFound = () => {
        updateFound = true
      }
      registration.addEventListener('updatefound', onUpdateFound, { once: true })

      await registration.update()
      await waitForWorkerState(registration.installing)

      if (registration.waiting) {
        setVersionState('update')
        setVersionMessage('Nova compilação encontrada. A atualização está a ser aplicada automaticamente…')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }

      if (updateFound || registration.installing) {
        setVersionState('update')
        setVersionMessage('Foi detetada uma nova compilação. A aplicação será atualizada assim que o novo Service Worker assumir o controlo.')
        return
      }

      setVersionState('current')
      setVersionMessage(`Compilação ${__APP_BUILD_ID__} verificada. Não existe uma atualização pendente.`)
    } catch {
      setVersionState('error')
      setVersionMessage('Não foi possível verificar a atualização agora. A aplicação volta a tentar automaticamente quando estiver online.')
    }
  }

  return (
    <section className="referenceSettingsCard referenceAboutCard" aria-label="Sobre a aplicação">
      <details className="referenceSettingsRow referenceAboutRow">
        <summary>
          <span className="referenceAboutInfoIcon" aria-hidden="true">i</span>
          <span>
            <strong>Versão</strong>
            <small>Consulta a compilação e verifica atualizações</small>
          </span>
          <AboutChevron />
        </summary>
        <div className="referenceSettingsExpanded referenceAboutExpanded">
          <div className="referenceVersionHero">
            <div>
              <span>VERSÃO INSTALADA</span>
              <strong>Foco Jornada {__APP_VERSION__}</strong>
              <small>Build <span className="referenceVersionBuildId">{__APP_BUILD_ID__}</span> · {formatBuildDate()}</small>
            </div>
            <button
              type="button"
              className="referenceVersionBadgeButton"
              disabled={versionState === 'checking'}
              onClick={() => void checkForUpdate()}
              aria-label="Verificar e aplicar atualização da aplicação"
            >
              {versionState === 'checking' ? 'A verificar…' : standalone ? 'Instalada · ↻' : 'Navegador · ↻'}
            </button>
          </div>

          <div className="referenceVersionFacts" aria-label="Estado da versão">
            <article>
              <span>Aplicação</span>
              <strong>{standalone ? 'PWA instalada' : 'Versão Web'}</strong>
            </article>
            <article>
              <span>Atualizações</span>
              <strong>{serviceWorkerActive ? 'Automáticas' : 'Ao abrir online'}</strong>
            </article>
            <article>
              <span>Rede</span>
              <strong>{navigator.onLine ? 'Online' : 'Offline'}</strong>
            </article>
          </div>

          <p className="referenceVersionAutoNote">
            <strong>Deteção automática.</strong> A aplicação compara a compilação publicada com a que está aberta. Não é necessário alterar manualmente o número da versão para receber uma atualização.
          </p>

          <button
            type="button"
            className="referenceVersionCheckButton"
            disabled={versionState === 'checking'}
            onClick={() => void checkForUpdate()}
          >
            {versionState === 'checking' ? 'A verificar…' : 'Verificar e atualizar agora'}
          </button>

          <p className={`referenceVersionStatus is-${versionState}`} role="status" aria-live="polite">
            {versionMessage}
          </p>
        </div>
      </details>

      <details className="referenceSettingsRow referenceAboutRow">
        <summary>
          <img className="referenceSettingsLogo referenceAboutLogo" src="./logo-mark.svg" alt="" />
          <span>
            <strong>Marca da aplicação</strong>
            <small>Descobre o significado da identidade Foco Jornada</small>
          </span>
          <AboutChevron />
        </summary>
        <div className="referenceSettingsExpanded referenceAboutExpanded">
          <div className="referenceBrandHero">
            <img src="./logo-mark.svg" alt="Símbolo Foco Jornada: relógio aberto com caminho verde" />
            <div>
              <span>FOCO JORNADA</span>
              <strong>Tempo com direção.</strong>
              <p>A marca foi criada para reunir num único símbolo as duas ideias centrais da aplicação: gerir o tempo e manter o foco ao longo da jornada.</p>
            </div>
          </div>

          <div className="referenceBrandMeaningGrid">
            <article>
              <span className="referenceBrandMeaningIcon" aria-hidden="true">◷</span>
              <div>
                <strong>Relógio</strong>
                <p>Representa a jornada, os horários, as pausas e o controlo real do tempo.</p>
              </div>
            </article>
            <article>
              <span className="referenceBrandMeaningIcon" aria-hidden="true">↗</span>
              <div>
                <strong>Caminho verde</strong>
                <p>Representa foco, progresso e a continuidade do percurso ao longo do dia.</p>
              </div>
            </article>
            <article>
              <span className="referenceBrandMeaningIcon" aria-hidden="true">○</span>
              <div>
                <strong>Forma aberta</strong>
                <p>Reforça a ideia de uma jornada em movimento, com espaço para adaptar o plano ao que realmente acontece.</p>
              </div>
            </article>
          </div>

          <div className="referenceBrandPurpose">
            <strong>Porque foi criada</strong>
            <p>Para dar ao Foco Jornada uma identidade própria, simples e reconhecível, associando visualmente tempo, foco e percurso diário sem parecer uma aplicação de controlo rígido.</p>
          </div>
        </div>
      </details>
    </section>
  )
}
