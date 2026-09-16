# Arquitetura

Atualizado em: 2026-09-16

## Visão geral

O **Foco Jornada** é uma PWA única React/TypeScript responsiva. Telemóvel, tablet e computador usam o mesmo bundle, rotas, regras de domínio e persistência; breakpoints alteram apresentação, não cálculos.

```text
GitHub Pages
  └─ React 19 + TypeScript + Vite / React Router
       ├─ AppShell responsivo
       ├─ Presentation: Hoje, Foco, Turnos, Horas, Férias, Definições
       │    └─ VacationWorkspacePage (PR #212)
       │         ├─ #/ferias: evolução mensal + indicadores + configuração
       │         └─ #/ferias/planeamento: sugestões + calendário + simulador
       │              └─ VacationBalancePage (mesma agregação e dados)
       ├─ Application: casos de uso e reconciliações de WorkSchedule
       ├─ Domain
       │    ├─ VacationBalance: referência laboral + projeção pessoal
       │    ├─ VacationPlanner: simulação pura
       │    └─ VacationSuggestions: opções por critério, sem escrita
       └─ Persistência cifrada
            ├─ IndexedDB/Dexie
            ├─ secureStorage no snapshot cifrado
            └─ sync opcional: Cloudflare Worker + Durable Object
```

## Stack e camadas

React 19, TypeScript 5.9, Vite 7, React Router, IndexedDB/Dexie, cofre AES-GCM, Zustand onde necessário, Vitest 5, GitHub Pages, Cloudflare Worker/Durable Objects; Node 22/npm 11.6.0 em CI.

### Presentation

Componentes relevantes: `src/presentation/layouts/AppShell.tsx`, páginas `TodayReferencePage.tsx`, `FocusPage.tsx`, `ActivitiesPage.tsx`, `ShiftMapPage.tsx`, `WorkHoursCalculatorPage.tsx`, `VacationBalancePage.tsx`, `VacationPlannerPanel.tsx`, `VacationSuggestionsPanel.tsx`, `VacationWorkspacePage.tsx`, `SettingsReferencePage.tsx` e `src/presentation/providers/AppServicesProvider.tsx`.

Férias usam `src/styles/vacation.css` (base), `vacation-accrual.css` (grelha mensal), `vacation-insights.css` (indicadores), `vacation-planner.css` (simulador), `vacation-suggestions.css` (sugestões) e `vacation-workspace.css` (separação visual e navegação). Testes estruturais: `vacation-card-containment.test.ts`, `vacation-insights.test.ts`, `vacation-planner.test.ts`, `vacation-suggestions.test.ts` e `vacation-workspace.test.ts`. Indicadores/simulações não persistem snapshots nem períodos novos.

### Application

Coordena casos de uso e repositories, não regras visuais: entrada, saída, pausas, foco/atividades e `reconcileScheduledWorkday` com base em `WorkSchedule`. A página de férias agrega fontes existentes e envia datas/configuração normalizadas para `calculateVacationBalance`. Planeador e sugestões recebem o mesmo conjunto por props, sem reler nem duplicar a agregação; a sugestão entrega início/fim ao formulário existente, não chama mutações.

### Domain

`VacationBalance` é a autoridade para referência laboral, saldo pessoal, dias úteis e evolução mensal. `VacationPlanner` reutiliza `calculateVacationBalance` sem escrever turnos/horas. `VacationSuggestions` enumera opções futuras, aplica critérios e reutiliza `simulateVacationPeriod` para validar contagem/saldo, sem uma segunda fórmula. Valida datas civis, deduplica, filtra sábado/domingo, distingue gozadas/planeadas e simula sem duplicação de datas.

## Rotas e isolamento visual — PR #212

`#/` Hoje; `#/foco` Foco; `#/atividades`; `#/turnos`; `#/horas`; `#/ferias`; **`#/ferias/planeamento`**; `#/definicoes`; restantes rotas mantidas. Desktop usa sidebar, mobile/tablet top bar, navegação inferior e drawer.

`VacationWorkspacePage` recebe `view="overview" | "planning"`. `NavLink` com `end` em `/ferias` evita ativar a vista geral quando se navega para `/ferias/planeamento`; `aria-current=page` é tratado pelo Router. Ambas as vistas utilizam o mesmo `VacationBalancePage` e cálculos, sem estado ou dados duplicados:

- overview: hero «Férias acumuladas mês a mês» → métricas → painel mensal → «O que tens, o que falta e o que vem a seguir» → configurações/referência/fontes/nota legal;
- planning: apenas `VacationPlannerPanel`, contendo sugestões, filtros, calendário, períodos, simulação e link separado para registo no mapa de turnos.

A separação atual é **de apresentação por CSS**: `display:none` oculta a zona não aplicável em cada rota. React ainda monta o componente completo e calcula os seus valores, mesmo quando a zona não é visível; não alegar desmontagem ou isolamento funcional. Esta opção evita refatorar cálculos num pedido primariamente visual; extração de componentes/hook comum pode ser feita numa alteração posterior, com testes de regressão. A nova rota tem H1 acessível próprio.

Layout `vacation-workspace.css`: contentor fluido `min(100%, 80rem)`, gaps/padding `clamp`, cartões e textos com `min-width:0`, `max-width:100%`, `overflow-wrap:anywhere`, grelha de métricas `auto-fit/minmax(min(100%,15rem),1fr)`, navegação 2→1 colunas até 560px. Planeamento recebe cabeçalho autónomo, grelhas fluidas, respiro e sem borda/padding duplicados do painel externo. `focus-visible`, `forced-colors` e `prefers-reduced-motion`. Mais detalhes em `docs/VACATION-WORKSPACE.md`.

## Persistência e fronteira de segurança

`foco-jornada-security-v1`: perfil/KDF/chaves/metadados sync. `foco-jornada-vault-v1`: `EncryptedVaultRecord` cifrado. Configuração de férias em `secureStorage`, chave `foco-jornada-vacation-settings-v1`, campos `employmentStartDate`, `annualEntitlementDays`, `monthlyAccrualTargetDays`, `carriedDays`, `manualTakenDays`, `adjustmentDays`.

PR #210/#211/#212 não acrescentam campos, migrações, férias artificiais nem alterações ao cofre. Filtros de sugestões são estado React efémero. PIN, palavra-passe, código recuperação e dataKey original não são enviados ao Worker; backend recebe cofre cifrado/metadados. Nenhum HTML não confiável é injetado no planeador; PR #212 não acrescenta endpoint, token, segredo, permissão, dependência, telemetria ou mutação.

## Fontes e cálculo de férias

```text
WorkHours: reason === "ferias"
Shift map mensal: kind === "vacation"
Payroll plan mensal: kind === "vacation"
  ↓ normalizar YYYY-MM-DD, deduplicar Set<string>
  ↓ regra padrão: seg.–sex. contam; sábado/domingo não
calculateVacationBalance()
  ├─ referência laboral
  └─ projeção pessoal: meses fechados, acumulado vivo, saldo, marcos, dezembro
VacationPlanner(simulação)
  ├─ mesmas datas/configuração da página
  ├─ validar intervalo futuro; úteis novos = úteis − já registados
  ├─ calculateVacationBalance(fim do dia anterior e último dia + úteis novos temporários)
  └─ previsão de dezembro anterior − úteis novos
VacationSuggestions(sugestão)
  ├─ datas futuras do ano atual, dias pedidos, mês excluído
  ├─ rejeitar sobreposições com úteis registados
  ├─ simulateVacationPeriod valida cada candidato
  ├─ aceitar saldo pessoal não negativo no fim/dezembro
  └─ ordenar por critério e enviar seleção à simulação; nunca criar registo
```

Não inferir férias de baixa, folga, ausência ou jornada não iniciada. Feriados, escalas especiais e CCT não são inferidos. 24/08–06/09/2026 = 14 datas civis, dez úteis descontados, quatro dias de fim de semana ignorados.

### Referência laboral e projeção pessoal

Ano normal: `direitoAno = max(22, annualEntitlementDays confirmado)`; `saldoHoje = direitoAno + transitados + ajustes - gozadas`; `saldoProjetado = saldoHoje - planeadas`. Ano de admissão: `mesesCompletos = meses completos desde employmentStartDate`, `direitoAdmissao = min(20, mesesCompletos × 2)` com marco de seis meses separado.

Projeção pessoal: `parcelaMensal = metaAnual / 12`; `marcoMes = metaAnual × numeroMes / 12`; meta 28: março 7, junho 14, setembro 21, dezembro 28. `progressoMes = (diaMes - 1 + progressoDia) / diasNoMes`; `acumuladoVivo = metaAnual × (mesAtual - 1 + progressoMes) / 12`; `saldoVivo = acumuladoVivo + transitados + ajustes - gozadas`; `saldoVivoProjetado = saldoVivo - planeadas`. Atualizar a cada 60 segundos e em `focus`/`visibilitychange`.

Indicadores PR #209: `annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate`, `hasReachedAccrualTarget`. `progresso = clamp(acumuladoVivo/meta) × 100`; `falta = max(0, meta-acumuladoVivo)`; `comprometido = gozadas+planeadas`; `previsaoDezembro = meta + transitados + ajustes − comprometido`; próximo marco `min(meta,floor(acumuladoVivo)+1)`.

### Simulador e sugestões

`VacationPlanner.ts` exporta `simulateVacationPeriod`/`listUpcomingVacationPeriods`: apenas futuro até 31/12 do ano atual, UTC para datas civis, evita duplicação, saldos antes/depois e dezembro, grupos de úteis futuros incluindo sexta–segunda; nenhuma gravação. `docs/VACATION-PLANNER.md`.

`VacationSuggestions.ts` exporta `suggestVacationPeriods`: `requestedDays` inteiro 1–30, `excludedMonth` 0–12, `preference` rest/soon/balance. Cada início útil avança até dias pedidos e rejeita conflitos/mês excluído/ano diferente. Reutiliza simulação, filtra saldos pessoais não negativos, um representante por mês. Descanso potencial inclui fins de semana adjacentes apenas se forem descanso na escala. Não infere feriados, preços ou autorização. `docs/VACATION-SUGGESTIONS.md`.

## Sincronização móvel ↔ computador

`EncryptedVaultRecord → CloudSyncManager → fingerprint SHA-256 + token derivado da dataKey + revisão remota esperada → Cloudflare Worker → Durable Object por profileId`. Só local mudou: push; só remoto: pull+validação; igual: atualizar metadados; ambos: conflito explícito sem last-write-wins silencioso. Links externos `rel="noreferrer"`.

## Qualidade

Workflow `Qualidade`: Node 22/npm 11.6.0, `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. Head final tem de estar verde antes de integrar. PR #212 acrescenta `vacation-workspace.test.ts`; validação física real ainda pendente.
