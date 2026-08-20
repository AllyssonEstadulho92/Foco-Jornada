import { useState, type FormEvent } from 'react'
import { getActivityDurationMs, type Activity } from '../../domain/activities/Activity'
import { formatClockTime, formatDuration } from '../../shared/utils/dateTime'
import { useActivityController } from '../hooks/useActivityController'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'

function statusLabel(status: Activity['status']): string {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'active':
      return 'Em curso'
    case 'completed':
      return 'Concluída'
    case 'cancelled':
      return 'Cancelada'
  }
}

export function ActivitiesPage() {
  const { activeJourney, isLoading: isJourneyLoading } = useJourneyController()
  const { activities, activeActivity, isLoading, isBusy, error, create, edit, start, complete, cancel } =
    useActivityController(activeJourney?.id)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const now = useNow()
  const nowIso = now.toISOString()

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await create(name, description)
    if (created) {
      setName('')
      setDescription('')
    }
  }

  function beginEdit(activity: Activity) {
    setEditingId(activity.id)
    setEditingName(activity.name)
    setEditingDescription(activity.description ?? '')
  }

  async function saveEdit(activityId: string) {
    const updated = await edit(activityId, editingName, editingDescription)
    if (updated) setEditingId(null)
  }

  return (
    <section className="activitiesPage" aria-labelledby="activities-title">
      <header className="activitiesHeader">
        <div>
          <span className="eyebrow">ATIVIDADES</span>
          <h1 id="activities-title">Atividades</h1>
          <p>Organiza o trabalho da jornada atual e acompanha o tempo de cada atividade.</p>
        </div>
        <span className={`activityJourneyState ${activeJourney ? 'activityJourneyStateActive' : ''}`}>
          {activeJourney ? 'Jornada ativa' : 'Sem jornada ativa'}
        </span>
      </header>

      {error ? (
        <div className="errorBanner" role="alert">
          {error}
        </div>
      ) : null}

      <section className="activityCreatePanel" aria-labelledby="new-activity-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">NOVA</span>
            <h2 id="new-activity-title">Criar atividade</h2>
          </div>
        </div>

        <form className="activityForm" onSubmit={(event) => void handleCreate(event)}>
          <label>
            <span>Nome</span>
            <input
              maxLength={120}
              placeholder="Ex.: Tratamento de ocorrências"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span>Descrição</span>
            <textarea
              maxLength={500}
              placeholder="Opcional"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button
            className="actionButton actionButtonPrimary"
            type="submit"
            disabled={!activeJourney || isBusy || isJourneyLoading || !name.trim()}
          >
            {isBusy ? 'A guardar…' : 'Criar atividade'}
          </button>
        </form>

        {!activeJourney && !isJourneyLoading ? (
          <p className="activityHint">Inicia uma jornada no ecrã Hoje para criares atividades.</p>
        ) : null}
      </section>

      {activeActivity ? (
        <section className="currentActivityPanel" aria-labelledby="current-activity-title">
          <div>
            <span className="sectionKicker">ATUAL</span>
            <h2 id="current-activity-title">{activeActivity.name}</h2>
            {activeActivity.description ? <p>{activeActivity.description}</p> : null}
          </div>
          <div className="currentActivityTime">
            <span>Em curso desde {formatClockTime(activeActivity.startedAt)}</span>
            <strong>{formatDuration(getActivityDurationMs(activeActivity, nowIso))}</strong>
          </div>
          <button
            className="actionButton actionButtonPrimary"
            type="button"
            disabled={isBusy}
            onClick={() => void complete(activeActivity.id)}
          >
            Concluir atividade
          </button>
        </section>
      ) : null}

      <section className="activityListPanel" aria-labelledby="activity-list-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">JORNADA ATUAL</span>
            <h2 id="activity-list-title">Lista de atividades</h2>
          </div>
          <span className="historyCount">{activities.length}</span>
        </div>

        {isLoading || isJourneyLoading ? (
          <p className="mutedText">A carregar atividades…</p>
        ) : activities.length === 0 ? (
          <div className="historyEmpty">Ainda não existem atividades nesta jornada.</div>
        ) : (
          <div className="activityList">
            {activities
              .slice()
              .reverse()
              .map((activity) => {
                const isEditing = editingId === activity.id
                return (
                  <article className={`activityCard activityCard-${activity.status}`} key={activity.id}>
                    {isEditing ? (
                      <div className="activityEditForm">
                        <input
                          maxLength={120}
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                        />
                        <textarea
                          maxLength={500}
                          rows={2}
                          value={editingDescription}
                          onChange={(event) => setEditingDescription(event.target.value)}
                        />
                        <div className="activityInlineActions">
                          <button type="button" onClick={() => void saveEdit(activity.id)}>
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}>
                            Cancelar edição
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="activityCardMain">
                          <div className="activityCardTitleRow">
                            <strong>{activity.name}</strong>
                            <span className={`activityStatus activityStatus-${activity.status}`}>
                              {statusLabel(activity.status)}
                            </span>
                          </div>
                          {activity.description ? <p>{activity.description}</p> : null}
                          <div className="activityMeta">
                            <span>
                              {activity.startedAt ? `Início ${formatClockTime(activity.startedAt)}` : 'Ainda não iniciada'}
                            </span>
                            <span>{formatDuration(getActivityDurationMs(activity, nowIso))}</span>
                          </div>
                        </div>

                        <div className="activityCardActions">
                          {activity.status === 'pending' ? (
                            <button type="button" disabled={isBusy} onClick={() => void start(activity.id)}>
                              Iniciar
                            </button>
                          ) : null}
                          {activity.status === 'active' ? (
                            <button type="button" disabled={isBusy} onClick={() => void complete(activity.id)}>
                              Concluir
                            </button>
                          ) : null}
                          {activity.status === 'pending' || activity.status === 'active' ? (
                            <>
                              <button type="button" disabled={isBusy} onClick={() => beginEdit(activity)}>
                                Editar
                              </button>
                              <button
                                className="activityDangerAction"
                                type="button"
                                disabled={isBusy}
                                onClick={() => void cancel(activity.id)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </article>
                )
              })}
          </div>
        )}
      </section>
    </section>
  )
}
