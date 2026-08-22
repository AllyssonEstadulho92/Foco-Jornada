import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { NavigationIcon } from '../navigation/NavigationIcon'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'

type ProtectionStatus = 'ok' | 'warning' | 'error' | 'info'

interface ProtectionCheck {
  id: string
  label: string
  status: ProtectionStatus
  detail: string
}

function RowArrow() {
  return <span className="moreRowArrow" aria-hidden="true">›</span>
}

function SectionIcon({ type }: { type: 'quick' | 'management' }) {
  if (type === 'quick') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m13.5 2-8 11h6l-1 9 8-12h-6z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.04v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.04h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  )
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const amount = value / 1024 ** index
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`
}

function statusLabel(status: ProtectionStatus): string {
  if (status === 'ok') return 'OK'
  if (status === 'warning') return 'Atenção'
  if (status === 'error') return 'Erro'
  return 'Info'
}

export function MorePage() {
  const services = useAppServices()
  const [protectionOpen, setProtectionOpen] = useState(false)
  const [protectionLoading, setProtectionLoading] = useState(false)
  const [protectionChecks, setProtectionChecks] = useState<ProtectionCheck[]>([])
  const [protectionCheckedAt, setProtectionCheckedAt] = useState<Date | null>(null)

  async function exportToday() {
    try {
      const date = toLocalDateKey(new Date())
      const report = await buildDayReport({
        journeyRepository: services.journeyRepository,
        breakRepository: services.breakRepository,
        activityRepository: services.activityRepository,
        focusRepository: services.focusRepository,
        coffeeRepository: services.coffeeRepository,
        date,
      })

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `foco-jornada-${date}.json`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      pushAppNotification('success', 'Relatório exportado', 'O relatório do dia foi guardado em JSON.')
    } catch {
      pushAppNotification('error', 'Não foi possível exportar', 'Tenta novamente a partir do menu Mais.')
    }
  }

  async function runProtectionCheck() {
    setProtectionOpen(true)
    setProtectionLoading(true)

    const checks: ProtectionCheck[] = []
    const secureHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const secureContext = window.isSecureContext || window.location.protocol === 'https:' || secureHost

    checks.push({
      id: 'https',
      label: 'Ligação segura HTTPS',
      status: secureContext ? 'ok' : 'error',
      detail: secureContext
        ? 'A aplicação está num contexto seguro, necessário para a proteção do navegador e para a PWA.'
        : 'A ligação não está num contexto seguro. Abre a aplicação através de HTTPS.',
    })

    try {
      const date = toLocalDateKey(new Date())
      await Promise.all([
        services.settingsRepository.get(),
        buildDayReport({
          journeyRepository: services.journeyRepository,
          breakRepository: services.breakRepository,
          activityRepository: services.activityRepository,
          focusRepository: services.focusRepository,
          coffeeRepository: services.coffeeRepository,
          date,
        }),
      ])
      checks.push({
        id: 'database',
        label: 'Base de dados local',
        status: 'ok',
        detail: 'IndexedDB respondeu corretamente para definições, jornada, pausas, atividades, foco e café.',
      })
    } catch {
      checks.push({
        id: 'database',
        label: 'Base de dados local',
        status: 'error',
        detail: 'Não foi possível ler todos os dados locais. Evita limpar o navegador até voltares a verificar.',
      })
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.active) {
          checks.push({
            id: 'pwa',
            label: 'PWA e funcionamento offline',
            status: 'ok',
            detail: 'O service worker está ativo e pode disponibilizar os ficheiros essenciais sem ligação.',
          })
        } else if (registration?.installing || registration?.waiting) {
          checks.push({
            id: 'pwa',
            label: 'PWA e funcionamento offline',
            status: 'warning',
            detail: 'A PWA está a instalar ou a preparar uma atualização. Volta a verificar dentro de alguns segundos.',
          })
        } else {
          checks.push({
            id: 'pwa',
            label: 'PWA e funcionamento offline',
            status: 'warning',
            detail: 'Não foi encontrado um service worker ativo nesta abertura. Recarrega a aplicação e verifica novamente.',
          })
        }
      } catch {
        checks.push({
          id: 'pwa',
          label: 'PWA e funcionamento offline',
          status: 'warning',
          detail: 'O navegador suporta PWA, mas não foi possível consultar o estado do service worker.',
        })
      }
    } else {
      checks.push({
        id: 'pwa',
        label: 'PWA e funcionamento offline',
        status: 'warning',
        detail: 'Este navegador não disponibiliza service workers para esta aplicação.',
      })
    }

    if (navigator.storage) {
      try {
        const persisted = await navigator.storage.persisted()
        checks.push({
          id: 'persistence',
          label: 'Proteção contra limpeza automática',
          status: persisted ? 'ok' : 'warning',
          detail: persisted
            ? 'O navegador marcou o armazenamento da aplicação como persistente.'
            : 'O armazenamento não está marcado como persistente. Em falta extrema de espaço, o navegador pode remover dados locais.',
        })
      } catch {
        checks.push({
          id: 'persistence',
          label: 'Proteção contra limpeza automática',
          status: 'info',
          detail: 'O navegador não informou se o armazenamento está marcado como persistente.',
        })
      }

      try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage ?? 0
        const quota = estimate.quota ?? 0
        const percent = quota > 0 ? (usage / quota) * 100 : 0
        checks.push({
          id: 'capacity',
          label: 'Espaço de armazenamento',
          status: quota > 0 && percent >= 90 ? 'warning' : 'ok',
          detail: quota > 0
            ? `${formatBytes(usage)} usados de ${formatBytes(quota)} disponíveis para este contexto (${percent.toFixed(1)}%).`
            : 'O navegador não forneceu a quota disponível, mas o armazenamento local está acessível.',
        })
      } catch {
        checks.push({
          id: 'capacity',
          label: 'Espaço de armazenamento',
          status: 'info',
          detail: 'O navegador não disponibilizou uma estimativa de utilização e quota.',
        })
      }
    } else {
      checks.push({
        id: 'persistence',
        label: 'Proteção do armazenamento',
        status: 'info',
        detail: 'Este navegador não expõe o estado de persistência ou a quota de armazenamento.',
      })
    }

    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    checks.push({
      id: 'installation',
      label: 'Modo de instalação',
      status: standalone ? 'ok' : 'info',
      detail: standalone
        ? 'A aplicação está aberta em modo instalado/standalone.'
        : 'A aplicação está aberta no navegador. A instalação como PWA é opcional.',
    })

    checks.push({
      id: 'network',
      label: 'Ligação à Internet',
      status: 'info',
      detail: navigator.onLine
        ? 'O dispositivo está online. Os registos funcionais da V1 continuam guardados localmente.'
        : 'O dispositivo está offline. O estado da base de dados local foi verificado neste dispositivo.',
    })

    checks.push({
      id: 'data-location',
      label: 'Destino dos dados',
      status: 'info',
      detail: 'A V1 guarda jornada, pausas, atividades, foco, café e definições neste dispositivo; não existe sincronização cloud automática.',
    })

    checks.push({
      id: 'backup',
      label: 'Recuperação e cópia de segurança',
      status: 'info',
      detail: 'Limpar os dados do navegador, remover o armazenamento do site ou perder o dispositivo pode eliminar os registos. A exportação JSON do dia continua disponível no menu Gestão.',
    })

    setProtectionChecks(checks)
    setProtectionCheckedAt(new Date())
    setProtectionLoading(false)
  }

  const protectionErrors = protectionChecks.filter((check) => check.status === 'error').length
  const protectionWarnings = protectionChecks.filter((check) => check.status === 'warning').length
  const protectionSummary = protectionErrors > 0
    ? `${protectionErrors} situação${protectionErrors === 1 ? '' : 'ões'} a corrigir`
    : protectionWarnings > 0
      ? `${protectionWarnings} aviso${protectionWarnings === 1 ? '' : 's'} para rever`
      : protectionChecks.length > 0
        ? 'Tudo verificado sem bloqueios'
        : 'Ainda não verificado'

  return (
    <section className="reportPage morePage moreToolsPage" aria-labelledby="more-title">
      <header className="reportHeader moreHeader moreToolsHeader">
        <div>
          <span className="eyebrow">MAIS</span>
          <h1 id="more-title">Ferramentas</h1>
          <p>Organização, horas, vencimento e apoio.</p>
        </div>
      </header>

      <section className="moreToolSection" aria-labelledby="more-quick-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="quick" /></span>
          <h2 id="more-quick-title">Acesso rápido</h2>
        </div>

        <div className="moreList moreListGrouped">
          <Link to="/guia" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="moreRowCopy">
              <strong>Guia de utilização</strong>
              <small>Como usar a aplicação</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/horas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="hours" /></span>
            <span className="moreRowCopy">
              <strong>Calculadora de horas & ausências</strong>
              <small>Horas trabalhadas, doença e saldo</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/vencimento" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="payroll" /></span>
            <span className="moreRowCopy">
              <strong>Vencimento & planificação</strong>
              <small>Previsão salarial e calendário</small>
            </span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-management-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="management" /></span>
          <h2 id="more-management-title">Gestão</h2>
        </div>

        <div className="moreList moreListGrouped">
          <Link to="/estatisticas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy">
              <strong>Estatísticas</strong>
              <small>Hoje, 7 dias e 30 dias</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/definicoes" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="settings" /></span>
            <span className="moreRowCopy">
              <strong>Definições</strong>
              <small>Horário, pausas, café e preferências</small>
            </span>
            <RowArrow />
          </Link>

          <button type="button" className="moreRow moreRowButton" onClick={() => void exportToday()}>
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
            <span className="moreRowCopy">
              <strong>Exportar o dia</strong>
              <small>Guardar relatório em JSON</small>
            </span>
            <RowArrow />
          </button>
        </div>
      </section>

      <aside className="moreLocalCard" aria-label="Armazenamento local">
        <span className="moreLocalInfoIcon" aria-hidden="true">i</span>
        <div>
          <strong>Tudo fica guardado localmente</strong>
          <p>Os seus dados permanecem neste dispositivo.</p>
        </div>
        <button
          type="button"
          className="moreLocalShield"
          aria-label="Verificar proteção e armazenamento local"
          aria-expanded={protectionOpen}
          aria-controls="local-protection-panel"
          onClick={() => void runProtectionCheck()}
          disabled={protectionLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 19 6v5c0 4.6-2.7 7.7-7 10-4.3-2.3-7-5.4-7-10V6z" />
            <rect x="9.2" y="10.4" width="5.6" height="4.8" rx="1.1" />
            <path d="M10.4 10.4V9.2a1.6 1.6 0 0 1 3.2 0v1.2" />
          </svg>
        </button>
      </aside>

      {protectionOpen ? (
        <section id="local-protection-panel" className="moreProtectionPanel" aria-labelledby="local-protection-title" aria-live="polite">
          <div className="moreProtectionHeader">
            <div>
              <span className="eyebrow">DIAGNÓSTICO LOCAL</span>
              <h2 id="local-protection-title">Proteção e armazenamento</h2>
              <p>{protectionLoading ? 'A verificar o dispositivo…' : protectionSummary}</p>
            </div>
            <button type="button" className="moreProtectionClose" onClick={() => setProtectionOpen(false)} aria-label="Fechar diagnóstico">×</button>
          </div>

          {protectionLoading ? (
            <div className="moreProtectionLoading" role="status">
              <span className="moreProtectionSpinner" aria-hidden="true" />
              <span>A verificar HTTPS, dados locais, PWA e armazenamento…</span>
            </div>
          ) : (
            <>
              <div className="moreProtectionList">
                {protectionChecks.map((check) => (
                  <article key={check.id} className={`moreProtectionCheck is-${check.status}`}>
                    <span className="moreProtectionStatusDot" aria-hidden="true" />
                    <div>
                      <div className="moreProtectionCheckTitle">
                        <strong>{check.label}</strong>
                        <span>{statusLabel(check.status)}</span>
                      </div>
                      <p>{check.detail}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="moreProtectionFooter">
                <span>{protectionCheckedAt ? `Última verificação: ${protectionCheckedAt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                <button type="button" className="button buttonSecondary" onClick={() => void runProtectionCheck()}>
                  Verificar novamente
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}
    </section>
  )
}
