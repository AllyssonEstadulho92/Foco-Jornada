import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { AppIcon } from '../components/ui/AppIcon'
import { NavigationIcon } from '../navigation/NavigationIcon'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'
import { downloadDayData } from '../utils/downloadDayData'

type ProtectionStatus = 'ok' | 'warning' | 'error' | 'info'

interface ProtectionCheck {
  id: string
  label: string
  status: ProtectionStatus
  detail: string
}

function RowArrow() {
  return <span className="moreRowArrow" aria-hidden="true"><AppIcon name="chevron-right" /></span>
}

function SectionIcon({ type }: { type: 'quick' | 'management' }) {
  return <AppIcon name={type === 'quick' ? 'sparkle' : 'settings'} />
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
      await downloadDayData(services)
      pushAppNotification('success', 'Dados exportados', 'A cópia técnica do dia foi guardada no dispositivo.')
    } catch {
      pushAppNotification('error', 'Não foi possível exportar', 'Tenta novamente em Ferramentas.')
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
      label: 'Ligação segura',
      status: secureContext ? 'ok' : 'error',
      detail: secureContext
        ? 'A aplicação está a usar uma ligação segura HTTPS.'
        : 'A ligação não é segura. Abre a aplicação através de HTTPS.',
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
        label: 'Dados locais',
        status: 'ok',
        detail: 'Os dados guardados neste dispositivo estão acessíveis.',
      })
    } catch {
      checks.push({
        id: 'database',
        label: 'Dados locais',
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
            label: 'Uso sem Internet',
            status: 'ok',
            detail: 'Os ficheiros essenciais estão preparados para funcionar sem ligação.',
          })
        } else if (registration?.installing || registration?.waiting) {
          checks.push({
            id: 'pwa',
            label: 'Uso sem Internet',
            status: 'warning',
            detail: 'A aplicação está a preparar uma atualização. Volta a verificar dentro de alguns segundos.',
          })
        } else {
          checks.push({
            id: 'pwa',
            label: 'Uso sem Internet',
            status: 'warning',
            detail: 'O modo offline ainda não está ativo nesta abertura. Recarrega a aplicação e verifica novamente.',
          })
        }
      } catch {
        checks.push({
          id: 'pwa',
          label: 'Uso sem Internet',
          status: 'warning',
          detail: 'O navegador suporta o modo offline, mas não foi possível verificar o estado.',
        })
      }
    } else {
      checks.push({
        id: 'pwa',
        label: 'Uso sem Internet',
        status: 'warning',
        detail: 'Este navegador não suporta o modo offline da aplicação.',
      })
    }

    if (navigator.storage) {
      try {
        const persisted = await navigator.storage.persisted()
        checks.push({
          id: 'persistence',
          label: 'Proteção dos dados',
          status: persisted ? 'ok' : 'warning',
          detail: persisted
            ? 'O navegador marcou os dados da aplicação como persistentes.'
            : 'Os dados não estão marcados como persistentes. Em falta extrema de espaço, o navegador pode removê-los.',
        })
      } catch {
        checks.push({
          id: 'persistence',
          label: 'Proteção dos dados',
          status: 'info',
          detail: 'O navegador não informou o estado de persistência dos dados.',
        })
      }

      try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage ?? 0
        const quota = estimate.quota ?? 0
        const percent = quota > 0 ? (usage / quota) * 100 : 0
        checks.push({
          id: 'capacity',
          label: 'Espaço disponível',
          status: quota > 0 && percent >= 90 ? 'warning' : 'ok',
          detail: quota > 0
            ? `${formatBytes(usage)} usados de ${formatBytes(quota)} disponíveis (${percent.toFixed(1)}%).`
            : 'O navegador não indicou o espaço disponível, mas os dados locais estão acessíveis.',
        })
      } catch {
        checks.push({
          id: 'capacity',
          label: 'Espaço disponível',
          status: 'info',
          detail: 'O navegador não disponibilizou uma estimativa de espaço.',
        })
      }
    } else {
      checks.push({
        id: 'persistence',
        label: 'Proteção dos dados',
        status: 'info',
        detail: 'Este navegador não disponibiliza informação sobre persistência ou espaço de armazenamento.',
      })
    }

    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    checks.push({
      id: 'installation',
      label: 'Aplicação instalada',
      status: standalone ? 'ok' : 'info',
      detail: standalone
        ? 'A aplicação está aberta como app instalada.'
        : 'A aplicação está aberta no navegador. A instalação no ecrã principal é opcional.',
    })

    checks.push({
      id: 'network',
      label: 'Ligação à Internet',
      status: 'info',
      detail: navigator.onLine
        ? 'O dispositivo está online. Os registos continuam guardados neste dispositivo.'
        : 'O dispositivo está offline. Os dados locais continuam disponíveis.',
    })

    checks.push({
      id: 'data-location',
      label: 'Onde ficam os dados',
      status: 'info',
      detail: 'A versão atual guarda jornada, pausas, atividades, foco, café e definições neste dispositivo. Ainda não existe sincronização automática na cloud.',
    })

    checks.push({
      id: 'backup',
      label: 'Cópia de segurança',
      status: 'info',
      detail: 'Limpar os dados do navegador ou perder o dispositivo pode eliminar os registos. Exporta uma cópia quando precisares.',
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
        ? 'Tudo a funcionar sem bloqueios'
        : 'Ainda não verificado'

  return (
    <section className="reportPage morePage moreToolsPage" aria-labelledby="more-title">
      <header className="reportHeader moreHeader moreToolsHeader">
        <div>
          <span className="eyebrow">MAIS</span>
          <h1 id="more-title">Ferramentas</h1>
          <p>Acede às funções complementares e aos dados da aplicação.</p>
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
            <span className="moreRowCopy"><strong>Guia</strong><small>Aprende a usar a aplicação</small></span>
            <RowArrow />
          </Link>

          <Link to="/horas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="hours" /></span>
            <span className="moreRowCopy"><strong>Horas & ausências</strong><small>Confere horas, faltas e saldo</small></span>
            <RowArrow />
          </Link>

          <Link to="/vencimento" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="payroll" /></span>
            <span className="moreRowCopy"><strong>Vencimento</strong><small>Consulta a estimativa do que vais receber</small></span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-management-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="management" /></span>
          <h2 id="more-management-title">Dados e aplicação</h2>
        </div>

        <div className="moreList moreListGrouped">
          <Link to="/estatisticas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy"><strong>Relatórios</strong><small>Hoje, semana e mês</small></span>
            <RowArrow />
          </Link>

          <Link to="/relatorio" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy"><strong>Relatório A4</strong><small>Consulta e imprime apenas o relatório do dia</small></span>
            <RowArrow />
          </Link>

          <Link to="/definicoes" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="settings" /></span>
            <span className="moreRowCopy"><strong>Definições</strong><small>Horário, pausas, tema e dados</small></span>
            <RowArrow />
          </Link>

          <button type="button" className="moreRow moreRowButton" onClick={() => void exportToday()}>
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
            <span className="moreRowCopy"><strong>Exportar dados</strong><small>Guarda uma cópia técnica do dia no dispositivo</small></span>
            <RowArrow />
          </button>
        </div>
      </section>

      <aside className="moreLocalCard" aria-label="Dados guardados no dispositivo">
        <span className="moreLocalInfoIcon" aria-hidden="true">i</span>
        <div>
          <strong>Os teus dados ficam neste dispositivo</strong>
          <p>A versão atual guarda os registos localmente.</p>
        </div>
        <button
          type="button"
          className="moreLocalShield"
          aria-label="Ver estado da aplicação e proteção dos dados"
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
              <span className="eyebrow">ESTADO DA APLICAÇÃO</span>
              <h2 id="local-protection-title">Proteção dos dados</h2>
              <p>{protectionLoading ? 'A verificar…' : protectionSummary}</p>
            </div>
            <button type="button" className="moreProtectionClose" onClick={() => setProtectionOpen(false)} aria-label="Fechar estado da aplicação">×</button>
          </div>

          {protectionLoading ? (
            <div className="moreProtectionLoading" role="status">
              <span className="moreProtectionSpinner" aria-hidden="true" />
              <span>A verificar ligação, dados, modo offline e armazenamento…</span>
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
                <button type="button" className="button buttonSecondary" onClick={() => void runProtectionCheck()}>Verificar novamente</button>
              </div>
            </>
          )}
        </section>
      ) : null}
    </section>
  )
}
