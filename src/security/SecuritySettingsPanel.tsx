import { useEffect, useState, type FormEvent } from 'react'
import { useSecurity } from './SecurityContext'

function formatSyncTime(value: string | undefined): string {
  if (!value) return 'Ainda não sincronizado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data de sincronização indisponível'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function endpointLabel(value: string | null): string {
  if (!value) return 'Sem endereço configurado'
  try {
    return new URL(value).hostname
  } catch {
    return 'Endereço inválido'
  }
}

export function SecuritySettingsPanel() {
  const security = useSecurity()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [showChange, setShowChange] = useState(false)
  const [currentSecret, setCurrentSecret] = useState('')
  const [nextSecret, setNextSecret] = useState('')
  const [confirmSecret, setConfirmSecret] = useState('')
  const [nextType, setNextType] = useState<'pin' | 'password'>(security.session.profile.secretType)
  const [syncEndpoint, setSyncEndpoint] = useState(security.cloudSyncEndpoint ?? '')
  const cloudSync = security.session.profile.cloudSync

  useEffect(() => {
    setSyncEndpoint(security.cloudSyncEndpoint ?? '')
  }, [security.cloudSyncEndpoint])

  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.')
    } finally {
      setBusy(false)
    }
  }

  function submitSecretChange(event: FormEvent) {
    event.preventDefault()
    if (nextSecret !== confirmSecret) {
      setMessage('A confirmação do novo acesso não coincide.')
      return
    }
    void run(async () => {
      await security.changeSecret(currentSecret, nextSecret, nextType)
      setCurrentSecret('')
      setNextSecret('')
      setConfirmSecret('')
      setShowChange(false)
      setMessage('O método principal de acesso foi atualizado.')
    })
  }

  return (
    <section className="securitySettingsCard" aria-labelledby="security-settings-title">
      <div className="securitySettingsHeading">
        <div>
          <span>PRIVACIDADE E ACESSO</span>
          <h2 id="security-settings-title">Cofre local</h2>
          <p>Os dados deste perfil permanecem cifrados quando a aplicação está bloqueada.</p>
        </div>
        <span className="securityStatusBadge">AES-GCM</span>
      </div>

      <div className="securitySettingsGrid">
        <label>
          <span>Bloqueio por inatividade</span>
          <select
            value={security.session.profile.autoLockMinutes}
            disabled={busy}
            onChange={(event) => void run(async () => {
              await security.setAutoLockMinutes(Number(event.target.value))
              setMessage('Tempo de bloqueio atualizado.')
            })}
          >
            <option value={1}>1 minuto</option>
            <option value={5}>5 minutos</option>
            <option value={10}>10 minutos</option>
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
          </select>
        </label>

        <div className="securitySettingAction">
          <span>Passkey / biometria</span>
          {security.session.profile.passkey ? (
            <button type="button" disabled={busy} onClick={() => void run(async () => {
              await security.disablePasskey()
              setMessage('A passkey foi removida deste perfil. O PIN/palavra-passe continua ativo.')
            })}>
              Desativar passkey
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => void run(async () => {
              await security.enablePasskey()
              setMessage('Passkey ativada. O navegador pedirá verificação biométrica ou do dispositivo quando aplicável.')
            })}>
              Ativar passkey
            </button>
          )}
        </div>

        <div className="securitySettingAction">
          <span>Sincronização móvel ↔ computador</span>
          <small>
            {security.cloudSyncConfigured
              ? cloudSync?.enabled
                ? `Ativa · ${formatSyncTime(cloudSync.lastSyncedAt)} · ${endpointLabel(security.cloudSyncEndpoint)}`
                : `Ligação pronta · ${endpointLabel(security.cloudSyncEndpoint)}`
              : 'Indique o endereço público do Worker Cloudflare para ligar esta publicação ao backend já criado.'}
          </small>

          <label>
            <span>Endpoint do Worker Cloudflare</span>
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="https://foco-jornada.<subdomínio>.workers.dev"
              value={syncEndpoint}
              disabled={busy}
              onChange={(event) => setSyncEndpoint(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !syncEndpoint.trim()}
            onClick={() => void run(async () => {
              await security.configureCloudSyncEndpoint(syncEndpoint)
              setMessage('Ligação Cloudflare validada e sincronização ativada. O cofre continua cifrado durante todo o transporte.')
            })}
          >
            {security.cloudSyncConfigured ? 'Validar e atualizar ligação' : 'Validar ligação e ativar'}
          </button>
          <small>
            O endereço é validado através de <code>/health</code> antes de ser guardado. Só são aceites endpoints HTTPS em <code>workers.dev</code> (ou localhost em desenvolvimento).
          </small>

          {security.cloudSyncConfigured ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(async () => {
                const nextEnabled = !cloudSync?.enabled
                await security.setCloudSyncEnabled(nextEnabled)
                setMessage(nextEnabled
                  ? 'Sincronização ativada. O cofre será comparado com a cópia remota sem sobrescrever conflitos.'
                  : 'Sincronização desativada neste perfil. A cópia local continua disponível normalmente.')
              })}
            >
              {cloudSync?.enabled ? 'Desativar sincronização' : 'Ativar sincronização'}
            </button>
          ) : null}
          {cloudSync?.lastError ? <small role="alert">{cloudSync.lastError}</small> : null}
          <small>
            Para associar outro dispositivo pela primeira vez, importe nele uma cópia segura deste mesmo perfil. O endereço do Worker acompanha o perfil e ambos passam a usar a mesma chave de dados sem a enviar ao servidor.
          </small>
        </div>
      </div>

      <div className="securitySettingsActions">
        <button type="button" disabled={busy} onClick={() => setShowChange((value) => !value)}>
          Alterar PIN / palavra-passe
        </button>
        <button type="button" disabled={busy} onClick={() => void run(async () => {
          const code = await security.rotateRecoveryCode()
          setRecoveryCode(code)
          setMessage('Foi criado um novo código de recuperação. O código anterior deixou de funcionar.')
        })}>
          Criar novo código de recuperação
        </button>
        <button className="securityLockNow" type="button" disabled={busy} onClick={() => void security.lock()}>
          Bloquear agora
        </button>
      </div>

      {showChange ? (
        <form className="securityChangeForm" onSubmit={submitSecretChange}>
          <label>
            <span>Acesso atual</span>
            <input
              type="password"
              inputMode={security.session.profile.secretType === 'pin' ? 'numeric' : 'text'}
              autoComplete="current-password"
              value={currentSecret}
              onChange={(event) => setCurrentSecret(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Novo método</span>
            <select value={nextType} onChange={(event) => setNextType(event.target.value as 'pin' | 'password')}>
              <option value="pin">PIN de 6 dígitos</option>
              <option value="password">Palavra-passe</option>
            </select>
          </label>
          <label>
            <span>Novo acesso</span>
            <input
              type="password"
              inputMode={nextType === 'pin' ? 'numeric' : 'text'}
              autoComplete="new-password"
              value={nextSecret}
              onChange={(event) => setNextSecret(nextType === 'pin'
                ? event.target.value.replace(/\D/g, '').slice(0, 6)
                : event.target.value)}
              required
            />
          </label>
          <label>
            <span>Confirmar novo acesso</span>
            <input
              type="password"
              inputMode={nextType === 'pin' ? 'numeric' : 'text'}
              autoComplete="new-password"
              value={confirmSecret}
              onChange={(event) => setConfirmSecret(nextType === 'pin'
                ? event.target.value.replace(/\D/g, '').slice(0, 6)
                : event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy}>Guardar alteração</button>
        </form>
      ) : null}

      {recoveryCode ? (
        <div className="securityRecoveryReveal" role="status">
          <strong>Novo código de recuperação</strong>
          <code>{recoveryCode}</code>
          <p>Guarda-o fora deste dispositivo. O Foco Jornada não guarda este código em texto simples e não o consegue mostrar novamente.</p>
          <button type="button" onClick={() => setRecoveryCode('')}>Já guardei</button>
        </div>
      ) : null}

      {message ? <p className="securitySettingsMessage" role="status">{message}</p> : null}
    </section>
  )
}
