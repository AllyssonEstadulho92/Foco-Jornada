import { useState } from 'react'

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
  return <span className="referenceChevron" aria-hidden="true">›</span>
}

export function AppAboutSettings() {
  const [versionState, setVersionState] = useState<VersionCheckState>('idle')
  const [versionMessage, setVersionMessage] = useState('Podes verificar agora se existe uma atualização da aplicação.')
  const standalone = isStandaloneMode()
  const serviceWorkerActive = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator)) {
      setVersionState('unavailable')
      setVersionMessage('Este navegador não permite verificar atualizações PWA. A versão aberta continua indicada acima.')
      return
    }

    try {
      setVersionState('checking')
      setVersionMessage('A verificar a versão disponível…')

      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setVersionState('unavailable')
        setVersionMessage('A aplicação está aberta no navegador e não tem um Service Worker ativo para verificar atualizações.')
        return
      }

      await registration.update()

      if (registration.waiting) {
        setVersionState('update')
        setVersionMessage('Foi encontrada uma atualização. Será aplicada automaticamente quando a nova versão ficar ativa.')
        return
      }

      setVersionState('current')
      setVersionMessage(`Versão ${__APP_VERSION__} verificada. Não foi encontrada uma atualização pendente.`)
    } catch {
      setVersionState('error')
      setVersionMessage('Não foi possível verificar a atualização agora. Tenta novamente quando tiveres ligação à Internet.')
    }
  }

  return (
    <section className="referenceSettingsCard referenceAboutCard" aria-label="Sobre a aplicação">
      <details className="referenceSettingsRow referenceAboutRow">
        <summary>
          <span className="referenceAboutInfoIcon" aria-hidden="true">i</span>
          <span>
            <strong>Versão</strong>
            <small>Consulta e verifica a versão instalada</small>
          </span>
          <AboutChevron />
        </summary>
        <div className="referenceSettingsExpanded referenceAboutExpanded">
          <div className="referenceVersionHero">
            <div>
              <span>VERSÃO INSTALADA</span>
              <strong>Foco Jornada {__APP_VERSION__}</strong>
              <small>Compilação de {formatBuildDate()}</small>
            </div>
            <span className="referenceVersionBadge">{standalone ? 'Instalada' : 'Navegador'}</span>
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

          <button
            type="button"
            className="referenceVersionCheckButton"
            disabled={versionState === 'checking'}
            onClick={() => void checkForUpdate()}
          >
            {versionState === 'checking' ? 'A verificar…' : 'Verificar atualização'}
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
