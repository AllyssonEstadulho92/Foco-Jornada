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

    const webCryptoReady = Boolean(window.crypto?.subtle)
    checks.push({
      id: 'web-crypto',
      label: 'Criptografia do navegador',
      status: webCryptoReady ? 'ok' : 'error',
      detail: webCryptoReady
        ? 'A Web Crypto API está disponível para proteger o cofre local.'
        : 'Este navegador não disponibiliza a Web Crypto API necessária ao cofre encriptado.',
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
        detail: 'O cofre desbloqueado deste perfil está acessível através da camada local protegida.',
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
      detail: 'Os dados pessoais deste perfil ficam no cofre local encriptado deste dispositivo. Não existe sincronização automática na cloud.',
    })

    checks.push({
      id: 'backup',
      label: 'Cópia de segurança',
      status: 'info',
      detail: 'Limpar os dados do navegador ou perder o dispositivo pode eliminar os registos. Mantém uma cópia de segurança cifrada e o código de recuperação em locais separados.',
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
          <h1 id="more-title">Mais</h1>
          <p>As restantes áreas da aplicação, organizadas por função.</p>
        </div>
      </header>

      <section className="moreToolSection" aria-labelledby="more-work-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><NavigationIcon name="journey" /></span>
          <div>
            <h2 id="more-work-title">Dia e trabalho</h2>
            <small>Planeamento, registos e acompanhamento diário</small>
          </div>
        </div>
        <div className="moreList moreListGrouped">
          <Link to="/calendario" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="calendar" /></span>
            <span className="moreRowCopy"><strong>Jornada</strong><small>Calendário operacional e planeamento do dia</small></span>
            <RowArrow />
          </Link>
          <Link to="/atividades" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="activities" /></span>
            <span className="moreRowCopy"><strong>Atividades</strong><small>Registos e tarefas da jornada</small></span>
            <RowArrow />
          </Link>
          <Link to="/historico" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="history" /></span>
            <span className="moreRowCopy"><strong>Histórico</strong><small>Consulta os registos anteriores</small></span>
            <RowArrow />
          </Link>
          <Link to="/turnos" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="calendar" /></span>
            <span className="moreRowCopy"><strong>Mapa de turnos</strong><small>Turnos, escalas e organização mensal</small></span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-personal-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><NavigationIcon name="medication" /></span>
          <div>
            <h2 id="more-personal-title">Saúde e uso pessoal</h2>
            <small>Medicação, glo e stock pessoal permanecem independentes</small>
          </div>
        </div>
        <div className="moreList moreListGrouped">
          <Link to="/medicamentos" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="medication" /></span>
            <span className="moreRowCopy"><strong>Medicação</strong><small>Tomas, horários, lembretes e stock</small></span>
            <RowArrow />
          </Link>
          <Link to="/sticks" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="glo" /></span>
            <span className="moreRowCopy"><strong>glo</strong><small>Sessões, ritmo, utilização e stock</small></span>
            <RowArrow />
          </Link>
          <Link to="/stock" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="list" /></span>
            <span className="moreRowCopy"><strong>Stock pessoal</strong><small>Controlo central do stock guardado</small></span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-analysis-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
          <div>
            <h2 id="more-analysis-title">Análise e finanças</h2>
            <small>Resultados, horas e informação financeira</small>
          </div>
        </div>
        <div className="moreList moreListGrouped">
          <Link to="/relatorios" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy"><strong>Relatórios</strong><small>Visão consolidada do dia, semana e mês</small></span>
            <RowArrow />
          </Link>
          <Link to="/estatisticas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy"><strong>Estatísticas</strong><small>Análise detalhada da utilização e jornada</small></span>
            <RowArrow />
          </Link>
          <Link to="/horas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="hours" /></span>
            <span className="moreRowCopy"><strong>Horas e ausências</strong><small>Saldo, faltas e cálculo de horas</small></span>
            <RowArrow />
          </Link>
          <Link to="/vencimento" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="payroll" /></span>
            <span className="moreRowCopy"><strong>Vencimento</strong><small>Estimativa e configuração do vencimento</small></span>
            <RowArrow />
          </Link>
          <Link to="/relatorio" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
            <span className="moreRowCopy"><strong>Relatório A4</strong><small>Consulta, impressão e exportação do dia</small></span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-system-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="management" /></span>
          <div>
            <h2 id="more-system-title">Dados e sistema</h2>
            <small>Preferências, ajuda, exportação e proteção local</small>
          </div>
        </div>
        <div className="moreList moreListGrouped">
          <Link to="/definicoes" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="settings" /></span>
            <span className="moreRowCopy"><strong>Definições e segurança</strong><small>Tema, acesso, bloqueio e preferências</small></span>
            <RowArrow />
          </Link>
          <Link to="/guia" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="moreRowCopy"><strong>Ajuda e guia</strong><small>Consulta como utilizar as principais funções</small></span>
            <RowArrow />
          </Link>
          <button type="button" className="moreRow moreRowButton" onClick={() => void exportToday()}>
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
            <span className="moreRowCopy"><strong>Exportar dados do dia</strong><small>Guarda uma cópia técnica no dispositivo</small></span>
            <RowArrow />
          </button>
        </div>
      </section>

      <aside className="moreLocalCard" aria-label="Cofre local encriptado">
        <span className="moreLocalInfoIcon" aria-hidden="true"><AppIcon name="lock" /></span>
        <div>
          <strong>Cofre local encriptado</strong>
          <p>Os dados deste perfil permanecem cifrados em repouso neste dispositivo.</p>
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
          <AppIcon name="shield" />
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
            <button type="button" className="moreProtectionClose" onClick={() => setProtectionOpen(false)} aria-label="Fechar estado da aplicação"><AppIcon name="close" /></button>
          </div>

          {protectionLoading ? (
            <div className="moreProtectionLoading" role="status">
              <span className="moreProtectionSpinner" aria-hidden="true" />
              <span>A verificar ligação, cofre, modo offline e armazenamento…</span>
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
