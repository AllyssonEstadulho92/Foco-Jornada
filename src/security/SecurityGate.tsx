import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { SecurityProfile } from './profileStore'
import {
  securityManager,
  type SecuritySession,
} from './SecurityManager'

type View = 'unlock' | 'create' | 'recover' | 'recovery-code'

const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function SecurityGate({
  profiles,
  onProfilesChanged,
  onUnlocked,
}: {
  profiles: SecurityProfile[]
  onProfilesChanged: () => Promise<void>
  onUnlocked: (session: SecuritySession) => void
}) {
  const activeId = securityManager.getActiveProfileId()
  const initialProfile = profiles.find((profile) => profile.id === activeId) ?? profiles[0]
  const [selectedId, setSelectedId] = useState(initialProfile?.id ?? '')
  const [view, setView] = useState<View>(profiles.length ? 'unlock' : 'create')
  const [secretType, setSecretType] = useState<'pin' | 'password'>('pin')
  const [secret, setSecret] = useState('')
  const [confirmSecret, setConfirmSecret] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newRecoverySecret, setNewRecoverySecret] = useState('')
  const [confirmRecoverySecret, setConfirmRecoverySecret] = useState('')
  const [recoverySecretType, setRecoverySecretType] = useState<'pin' | 'password'>('pin')
  const [createdRecoveryCode, setCreatedRecoveryCode] = useState('')
  const [pendingSession, setPendingSession] = useState<SecuritySession | null>(null)
  const [enablePasskey, setEnablePasskey] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const importRef = useRef<HTMLInputElement | null>(null)

  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0]

  useEffect(() => {
    if (!selectedId && profiles[0]) setSelectedId(profiles[0].id)
  }, [profiles, selectedId])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const lockSeconds = useMemo(() => {
    if (!selected?.lockedUntil) return 0
    return Math.max(0, Math.ceil((Date.parse(selected.lockedUntil) - now) / 1000))
  }, [now, selected?.lockedUntil])

  function resetInputs() {
    setSecret('')
    setConfirmSecret('')
    setRecoveryCode('')
    setNewRecoverySecret('')
    setConfirmRecoverySecret('')
    setMessage('')
  }

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

  function appendPin(value: number) {
    if (busy || lockSeconds > 0 || secret.length >= 6) return
    setSecret((current) => (current + String(value)).slice(0, 6))
  }

  async function unlock() {
    if (!selected) return
    await run(async () => {
      const result = await securityManager.unlockWithSecret(selected.id, secret)
      if (!result.ok) {
        setMessage(
          result.lockedUntil
            ? result.message + ' Tenta novamente depois da espera indicada.'
            : result.message,
        )
        setSecret('')
        await onProfilesChanged()
        return
      }
      onUnlocked(result.session)
    })
  }

  async function unlockPasskey() {
    if (!selected) return
    await run(async () => {
      const result = await securityManager.unlockWithPasskey(selected.id)
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      onUnlocked(result.session)
    })
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault()
    if (secret !== confirmSecret) {
      setMessage('A confirmação não coincide.')
      return
    }
    void run(async () => {
      const created = await securityManager.createProfile(secret, secretType)
      let session: SecuritySession = created
      let passkeyMessage = ''
      if (enablePasskey) {
        try {
          session = await securityManager.enablePasskey(created)
        } catch (error) {
          passkeyMessage = error instanceof Error
            ? ' A passkey não foi ativada: ' + error.message
            : ' A passkey não pôde ser ativada.'
        }
      }
      setPendingSession(session)
      setCreatedRecoveryCode(created.recoveryCode)
      setMessage('Acesso criado com sucesso.' + passkeyMessage)
      setView('recovery-code')
      await onProfilesChanged()
    })
  }

  function submitRecovery(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    if (newRecoverySecret !== confirmRecoverySecret) {
      setMessage('A confirmação do novo acesso não coincide.')
      return
    }
    void run(async () => {
      const recovered = await securityManager.recoverAndChangeSecret(
        selected.id,
        recoveryCode,
        newRecoverySecret,
        recoverySecretType,
      )
      await onProfilesChanged()
      onUnlocked(recovered)
    })
  }

  async function importSecureBackup(file: File) {
    await run(async () => {
      const imported = await securityManager.importSecureBackup(await file.text())
      await onProfilesChanged()
      setSelectedId(imported.id)
      setView('unlock')
      setSecret('')
      setMessage('Cópia segura importada. Introduz o PIN/palavra-passe existente ou usa o código de recuperação.')
    })
  }

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void importSecureBackup(file)
  }

  async function resetProfile() {
    if (!selected) return
    const confirmation = window.prompt(
      'Esta operação elimina definitivamente o cofre local deste perfil. Escreve APAGAR para confirmar.',
    )
    if (confirmation !== 'APAGAR') return
    await run(async () => {
      await securityManager.deleteProfile(selected.id)
      await onProfilesChanged()
      resetInputs()
      setSelectedId('')
      setView(profiles.length <= 1 ? 'create' : 'unlock')
    })
  }

  if (view === 'recovery-code' && pendingSession) {
    return (
      <main className="securityScreen">
        <section className="securityCard securityRecoveryCard" aria-labelledby="security-recovery-created">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <span className="securityEyebrow">FOCO JORNADA · USO PESSOAL</span>
          <h1 id="security-recovery-created">Guarda o código de recuperação</h1>
          <p>
            Este código é a única forma de recuperar o cofre sem o PIN/palavra-passe.
            Não é guardado em texto simples.
          </p>
          <code className="securityRecoveryCode">{createdRecoveryCode}</code>
          <div className="securityWarning">
            Se perderes o acesso e também este código, a reposição do perfil elimina os dados locais
            que não existam numa cópia recuperável.
          </div>
          {message ? <p className="securityMessage" role="status">{message}</p> : null}
          <button className="securityPrimary" type="button" onClick={() => onUnlocked(pendingSession)}>
            Guardei o código · Entrar
          </button>
        </section>
      </main>
    )
  }

  if (view === 'create') {
    return (
      <main className="securityScreen">
        <section className="securityCard" aria-labelledby="security-create-title">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <span className="securityEyebrow">FOCO JORNADA · USO PESSOAL</span>
          <h1 id="security-create-title">Criar acesso</h1>
          <p>
            Será criado um cofre local independente. Os dados existentes neste navegador,
            se existirem, só serão removidos do formato antigo depois de uma migração encriptada validada.
          </p>

          <form className="securityCreateForm" onSubmit={submitCreate}>
            <div className="securitySegment" role="group" aria-label="Método principal de acesso">
              <button
                type="button"
                className={secretType === 'pin' ? 'isActive' : ''}
                onClick={() => {
                  setSecretType('pin')
                  setSecret('')
                  setConfirmSecret('')
                }}
              >
                PIN de 6 dígitos
              </button>
              <button
                type="button"
                className={secretType === 'password' ? 'isActive' : ''}
                onClick={() => {
                  setSecretType('password')
                  setSecret('')
                  setConfirmSecret('')
                }}
              >
                Palavra-passe
              </button>
            </div>

            <label>
              <span>{secretType === 'pin' ? 'Criar PIN' : 'Criar palavra-passe'}</span>
              <input
                type="password"
                inputMode={secretType === 'pin' ? 'numeric' : 'text'}
                autoComplete="new-password"
                value={secret}
                maxLength={secretType === 'pin' ? 6 : 256}
                onChange={(event) => setSecret(
                  secretType === 'pin'
                    ? event.target.value.replace(/\D/g, '').slice(0, 6)
                    : event.target.value,
                )}
                required
              />
              <small>
                {secretType === 'pin'
                  ? '6 dígitos. Para maior resistência a ataques offline, prefere uma palavra-passe.'
                  : 'Mínimo de 12 caracteres.'}
              </small>
            </label>

            <label>
              <span>Confirmar</span>
              <input
                type="password"
                inputMode={secretType === 'pin' ? 'numeric' : 'text'}
                autoComplete="new-password"
                value={confirmSecret}
                maxLength={secretType === 'pin' ? 6 : 256}
                onChange={(event) => setConfirmSecret(
                  secretType === 'pin'
                    ? event.target.value.replace(/\D/g, '').slice(0, 6)
                    : event.target.value,
                )}
                required
              />
            </label>

            {securityManager.canAttemptPasskey() ? (
              <label className="securityPasskeyOption">
                <input
                  type="checkbox"
                  checked={enablePasskey}
                  onChange={(event) => setEnablePasskey(event.target.checked)}
                />
                <span>Ativar também passkey/biometria quando o autenticador suportar PRF</span>
              </label>
            ) : null}

            {message ? <p className="securityMessage" role="status">{message}</p> : null}
            <button className="securityPrimary" type="submit" disabled={busy}>
              {busy ? 'A criar proteção…' : 'Criar acesso'}
            </button>
          </form>

          <button
            className="securitySecondary"
            type="button"
            disabled={busy}
            onClick={() => importRef.current?.click()}
          >
            Importar cópia segura
          </button>
          <input
            ref={importRef}
            className="securityHiddenFileInput"
            type="file"
            accept="application/json,.json"
            onChange={handleImportChange}
            aria-label="Importar cópia segura do Foco Jornada"
          />

          {profiles.length ? (
            <button
              className="securityTextAction"
              type="button"
              onClick={() => {
                resetInputs()
                setView('unlock')
              }}
            >
              Voltar aos perfis existentes
            </button>
          ) : null}
        </section>
      </main>
    )
  }

  if (view === 'recover') {
    return (
      <main className="securityScreen">
        <section className="securityCard" aria-labelledby="security-recover-title">
          <div className="securityBrandMark" aria-hidden="true">FJ</div>
          <span className="securityEyebrow">RECUPERAÇÃO LOCAL</span>
          <h1 id="security-recover-title">Recuperar acesso</h1>
          <p>
            O código de recuperação desencripta a mesma chave de dados e permite definir um novo PIN
            ou palavra-passe. Não existe bypass.
          </p>
          <form className="securityCreateForm" onSubmit={submitRecovery}>
            <label>
              <span>Código de recuperação</span>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Novo método</span>
              <select
                value={recoverySecretType}
                onChange={(event) => setRecoverySecretType(event.target.value as 'pin' | 'password')}
              >
                <option value="pin">PIN de 6 dígitos</option>
                <option value="password">Palavra-passe</option>
              </select>
            </label>
            <label>
              <span>Novo acesso</span>
              <input
                type="password"
                inputMode={recoverySecretType === 'pin' ? 'numeric' : 'text'}
                value={newRecoverySecret}
                onChange={(event) => setNewRecoverySecret(
                  recoverySecretType === 'pin'
                    ? event.target.value.replace(/\D/g, '').slice(0, 6)
                    : event.target.value,
                )}
                required
              />
            </label>
            <label>
              <span>Confirmar novo acesso</span>
              <input
                type="password"
                inputMode={recoverySecretType === 'pin' ? 'numeric' : 'text'}
                value={confirmRecoverySecret}
                onChange={(event) => setConfirmRecoverySecret(
                  recoverySecretType === 'pin'
                    ? event.target.value.replace(/\D/g, '').slice(0, 6)
                    : event.target.value,
                )}
                required
              />
            </label>
            {message ? <p className="securityMessage" role="status">{message}</p> : null}
            <button className="securityPrimary" type="submit" disabled={busy}>
              Recuperar e definir novo acesso
            </button>
          </form>
          <button
            className="securityTextAction"
            type="button"
            onClick={() => {
              resetInputs()
              setView('unlock')
            }}
          >
            Voltar
          </button>
          <button
            className="securityDangerAction"
            type="button"
            disabled={busy}
            onClick={() => void resetProfile()}
          >
            Repor este perfil e apagar o cofre local
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="securityScreen">
      <section className="securityCard securityUnlockCard" aria-labelledby="security-unlock-title">
        <div className="securityBrandMark" aria-hidden="true">FJ</div>
        <span className="securityEyebrow">FOCO JORNADA · USO PESSOAL</span>
        <h1 id="security-unlock-title">
          Introduza o seu {selected?.secretType === 'password' ? 'acesso' : 'PIN'}
        </h1>
        <p>{selected?.secretType === 'password' ? 'Palavra-passe do cofre local' : '6 dígitos'}</p>

        {profiles.length > 1 ? (
          <label className="securityProfileSelect">
            <span>Perfil neste dispositivo</span>
            <select
              value={selected?.id ?? ''}
              onChange={(event) => {
                setSelectedId(event.target.value)
                setSecret('')
                setMessage('')
              }}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {selected?.secretType === 'pin' ? (
          <>
            <div
              className="securityPinDots"
              aria-label={String(secret.length) + ' de 6 dígitos introduzidos'}
            >
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className={index < secret.length ? 'isFilled' : ''} />
              ))}
            </div>
            <div className="securityKeypad" aria-label="Teclado numérico">
              {keypad.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy || lockSeconds > 0}
                  onClick={() => appendPin(value)}
                >
                  <strong>{value}</strong>
                </button>
              ))}
              <span className="securityKeypadSpacer" />
              <button
                type="button"
                disabled={busy || lockSeconds > 0}
                onClick={() => appendPin(0)}
              >
                <strong>0</strong>
              </button>
              <button
                type="button"
                aria-label="Apagar último dígito"
                disabled={busy || !secret.length}
                onClick={() => setSecret((current) => current.slice(0, -1))}
              >
                ⌫
              </button>
            </div>
          </>
        ) : (
          <label className="securityPasswordField">
            <span>Palavra-passe</span>
            <input
              autoFocus
              type="password"
              autoComplete="current-password"
              value={secret}
              disabled={busy || lockSeconds > 0}
              onChange={(event) => setSecret(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && secret) void unlock()
              }}
            />
          </label>
        )}

        {lockSeconds > 0 ? (
          <p className="securityLockout" role="status">
            Nova tentativa disponível em {lockSeconds}s.
          </p>
        ) : null}
        {message ? <p className="securityMessage" role="status">{message}</p> : null}

        <button
          className="securityPrimary"
          type="button"
          disabled={
            busy
            || lockSeconds > 0
            || (selected?.secretType === 'pin' ? secret.length !== 6 : !secret)
          }
          onClick={() => void unlock()}
        >
          {busy ? 'A verificar…' : 'Entrar'}
        </button>

        {selected?.passkey && securityManager.canAttemptPasskey() ? (
          <button
            className="securitySecondary"
            type="button"
            disabled={busy || lockSeconds > 0}
            onClick={() => void unlockPasskey()}
          >
            Entrar com passkey / biometria
          </button>
        ) : null}

        <div className="securityProtectedNote">
          Cofre local encriptado · a chave é mantida apenas durante a sessão desbloqueada
        </div>
        <button
          className="securityTextAction"
          type="button"
          onClick={() => {
            resetInputs()
            setView('recover')
          }}
        >
          Esqueci o meu acesso
        </button>
        <button
          className="securityTextAction"
          type="button"
          onClick={() => {
            resetInputs()
            setView('create')
          }}
        >
          Criar outro perfil local
        </button>
        <button
          className="securityTextAction"
          type="button"
          disabled={busy}
          onClick={() => importRef.current?.click()}
        >
          Importar cópia segura
        </button>
        <input
          ref={importRef}
          className="securityHiddenFileInput"
          type="file"
          accept="application/json,.json"
          onChange={handleImportChange}
          aria-label="Importar cópia segura do Foco Jornada"
        />
      </section>
    </main>
  )
}
