import { useEffect, useRef, useState } from 'react'
import { browserPairingManager } from './browserPairing'
import { securityManager } from './SecurityManager'

type PairingState = 'pairing' | 'error'

export function BrowserPairingBootstrap({ link }: { link: string }) {
  const started = useRef(false)
  const [state, setState] = useState<PairingState>('pairing')
  const [message, setMessage] = useState('A associar este navegador ao perfil existente…')

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      try {
        const remoteProfile = await browserPairingManager.redeem(link)
        const existing = (await securityManager.listProfiles())
          .find((profile) => profile.id === remoteProfile.id)

        if (existing) {
          securityManager.setActiveProfileId(existing.id)
        } else {
          await securityManager.importPairedProfile(remoteProfile)
        }

        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
        window.location.reload()
      } catch (error) {
        setState('error')
        setMessage(error instanceof Error ? error.message : 'Não foi possível associar este navegador.')
      }
    }

    void run()
  }, [link])

  return (
    <main className="securityScreen">
      <section className="securityCard securityExistingCard" role={state === 'error' ? 'alert' : 'status'}>
        <div className="securityBrandMark" aria-hidden="true">FJ</div>
        <span className="securityEyebrow">FOCO JORNADA · ASSOCIAÇÃO SEGURA</span>
        <h1>{state === 'error' ? 'Não foi possível associar' : 'A associar este navegador'}</h1>
        <p>{message}</p>
        {state === 'error' ? (
          <button
            className="securityPrimary"
            type="button"
            onClick={() => {
              window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
              window.location.reload()
            }}
          >
            Voltar ao acesso
          </button>
        ) : null}
      </section>
    </main>
  )
}
