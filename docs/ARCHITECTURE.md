# Arquitetura

Atualizado em: 2026-09-16

## Visão geral

O **Foco Jornada** é uma única PWA responsiva. Telemóvel, tablet e computador usam o mesmo bundle React/TypeScript, as mesmas rotas, regras de domínio e persistência. As diferenças entre breakpoints são de apresentação e navegação, não de regra de negócio.

```text
GitHub Pages
  └─ React 19 + TypeScript + Vite
       ├─ Router / AppShell responsivo
       ├─ Presentation
       │    ├─ Today / jornada
       │    ├─ Foco / atividades
       │    ├─ Turnos / horas
       │    ├─ Férias
       │    │    ├─ resumo vivo
       │    │    ├─ painel de indicadores
       │    │    ├─ simulação de períodos futuros
       │    │    └─ evolução mensal
       │    └─ Definições
       ├─ Application
       │    └─ casos de uso / reconciliações
       ├─ Domain
       │    ├─ VacationBalance
       │    │    ├─ referência laboral
       │    │    ├─ filtro de dias úteis padrão
       │    │    ├─ marcos mensais pessoais
       │    │    ├─ evolução intramensal em tempo real
       │    │    └─ indicadores derivados anuais
       │    └─ VacationPlanner (simulação pura)
       └─ Persistência cifrada
            ├─ IndexedDB/Dexie
            ├─ secureStorage no snapshot cifrado
            └─ sync opcional
                 └─ Cloudflare Worker + Durable Object
```

## Stack confirmada

React 19, TypeScript 5.9, Vite 7, React Router, IndexedDB/Dexie, cofre cifrado AES-GCM, Zustand onde necessário, Vitest 5, GitHub Pages, Cloudflare Worker/Durable Objects; Node 22 e npm 11.6.0 nos workflows.

## Camadas

### Presentation

Componentes relevantes:

- `src/presentation/layouts/AppShell.tsx`;
- `src/presentation/pages/TodayReferencePage.tsx`;
- `src/presentation/pages/FocusPage.tsx`;
- `src/presentation/pages/ActivitiesPage.tsx`;
- `src/presentation/pages/ShiftMapPage.tsx`;
- `src/presentation/pages/WorkHoursCalculatorPage.tsx`;
- `src/presentation/pages/VacationBalancePage.tsx`;
- `src/presentation/pages/VacationPlannerPanel.tsx`;
- `src/presentation/pages/SettingsReferencePage.tsx`;
- `src/presentation/providers/AppServicesProvider.tsx`.

A página de férias usa `src/styles/vacation.css` (base), `vacation-accrual.css` (grelha mensal), `vacation-insights.css` (indicadores) e `vacation-planner.css` (simulador). Os testes `vacation-card-containment.test.ts`, `vacation-insights.test.ts` e `vacation-planner.test.ts` protegem estruturas visuais. Indicadores e simulações não guardam snapshots de progresso, datas estimadas nem períodos novos.

### Application

Coordena casos de uso e repositories, sem regras visuais: entrada/saída, pausas, foco/atividades e `reconcileScheduledWorkday` com base no `WorkSchedule`. A página de férias agrega as fontes existentes e envia datas/configuração normalizadas a `calculateVacationBalance`; o planeador recebe **o mesmo conjunto** por props, sem reler ou duplicar a agregação.

### Domain

`VacationBalance` é autoridade para referência laboral, saldo pessoal, dias úteis e evolução mensal. `VacationPlanner` contém funções puras que reutilizam `calculateVacationBalance` para a projeção temporal, sem escrever turnos/horas. Responsabilidades: validar datas civis, deduplicar, filtrar sábado/domingo, separar gozadas/planeadas, calcular direitos configurados, projeções mensais/anuais e simular períodos futuros sem duplicar datas.

## Rotas relevantes

`#/` hoje; `#/foco` foco; `#/atividades` atividades; `#/turnos` mapa de turnos; `#/horas` calculadora de horas; `#/ferias` férias e simulador no mesmo ecrã; `#/definicoes` definições. Desktop usa sidebar; mobile/tablet usa top bar, bottom navigation e drawer.

## Persistência

Bases: `foco-jornada-security-v1` (perfil de segurança/KDF/chaves/metadados de sync) e `foco-jornada-vault-v1` (`EncryptedVaultRecord` cifrado). Configuração de férias em `secureStorage`, chave `foco-jornada-vacation-settings-v1`, campos:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays`;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

PR #210 não acrescenta campos, migração, registo de férias artificial ou alterações ao cofre.

## Fontes de dados das férias

```text
WorkHours store: reason === "ferias"
Shift map mensal: kind === "vacation"
Payroll plan mensal: kind === "vacation"
  ↓ normalizar YYYY-MM-DD
  ↓ deduplicar Set<string>
  ↓ semana padrão: seg.–sex. contam, sábado/domingo não
calculateVacationBalance()
  ├─ referência laboral
  └─ projeção pessoal
       ├─ meses fechados e progresso atual
       ├─ acumulado e saldo vivo/projetado
       ├─ progresso anual e dias ainda por acumular
       ├─ próximo marco/data
       └─ projeção 31 dezembro
VacationPlanner(simulação)
  ├─ mesmas datas/configuração da página
  ├─ validar intervalo futuro
  ├─ dias úteis novos = úteis do intervalo − já registados
  ├─ calculateVacationBalance(fim do dia anterior)
  ├─ calculateVacationBalance(fim último dia + novos temporários)
  └─ previsão dezembro anterior − dias úteis novos
```

A aplicação não infere férias de baixa, folga, ausência ou jornada não iniciada.

## Referência laboral

Ano normal: `direitoAno = max(22, annualEntitlementDays confirmado)`; `saldoHoje = direitoAno + transitados + ajustes - gozadas`; `saldoProjetado = saldoHoje - planeadas`.

Ano de admissão: `mesesCompletos = meses completos desde employmentStartDate`; `direitoAdmissao = min(20, mesesCompletos × 2)`. O marco dos seis meses permanece separado.

## Projeção pessoal mensal

`parcelaMensal = metaAnual / 12`; `marcoMes = metaAnual × numeroDoMes / 12`. Para meta 28: março 7, junho 14, setembro 21 e dezembro 28.

`progressoMes = (diaDoMes - 1 + progressoDoDia) / diasNoMes`

`acumuladoVivo = metaAnual × (mesAtual - 1 + progressoMes) / 12`

`saldoVivo = acumuladoVivo + transitados + ajustes - gozadas`

`saldoVivoProjetado = saldoVivo - planeadas`

A página atualiza a referência temporal a cada 60 segundos e também em `focus`/`visibilitychange`.

## Indicadores derivados — PR #209

Campos `annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate` e `hasReachedAccrualTarget`.

`progressoAnual% = clamp(acumuladoVivo / metaAnual) × 100`

`faltaAnual = max(0, metaAnual - acumuladoVivo)`

`comprometido = gozadas + planeadas`

`previsaoFimAno = metaAnual + transitados + ajustes - comprometido`

O próximo marco = `min(metaAnual, floor(acumuladoVivo) + 1)` enquanto a meta não for atingida; a data usa o mesmo modelo mensal.

## Planeador de períodos — PR #210

`src/domain/vacation/VacationPlanner.ts` exporta `simulateVacationPeriod` e `listUpcomingVacationPeriods`.

- aceita apenas início posterior a hoje e fim até 31 de dezembro do ano atual;
- valida o calendário civil em UTC para evitar erros por mudança da hora;
- para cada dia útil verifica se já consta dos registos e soma apenas os novos;
- calcula o saldo pessoal **antes** com `calculateVacationBalance` no fim do dia anterior;
- calcula o saldo pessoal **depois** com `calculateVacationBalance` no fim do último dia, acrescentando novas datas apenas ao input temporário;
- calcula a previsão de dezembro depois, subtraindo apenas novas datas do valor atual;
- agrupa próximos dias úteis futuros registados, inclusive sexta–segunda;
- devolve estado inválido em vez de gravar valores ou assumir períodos autorizados.

Não cria nova tabela, ação de escrita, registo, backend ou migração. O acesso ao mapa de turnos continua uma ligação explícita. Saldo por período é uma projeção pessoal, não validação do direito contratual. Detalhes: `docs/VACATION-PLANNER.md`.

## Arquitetura visual

Grelha mensal: `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, contenção de largura, `overflow-wrap`, diferenciação de estados, `forced-colors` e `prefers-reduced-motion`.

Painel de indicadores: `vacation-insights.css` com `repeat(auto-fit, minmax(min(100%, 14rem), 1fr))`, barra anual acessível, estado negativo e uma coluna até 560 px.

Planeador: `vacation-planner.css` com grids `auto-fit/minmax`, campos de data rotulados, texto/números contidos e uma coluna até 560 px. Resultados `aria-live="polite"`, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.

## Semana útil padrão

Segunda–sexta contam; sábado/domingo não reduzem saldo. 24/08/2026–06/09/2026 = 10 dias contabilizados + quatro fins de semana ignorados. Feriados e regimes especiais permanecem fora da inferência automática.

## Sincronização móvel ↔ computador

```text
EncryptedVaultRecord
  └─ CloudSyncManager
       ├─ fingerprint SHA-256
       ├─ token derivado da dataKey
       ├─ revisão remota esperada
       └─ Cloudflare Worker
            └─ Durable Object por profileId
```

Apenas local mudou → push; apenas remoto mudou → pull + validação; igual → atualizar metadados; ambos mudaram → conflito explícito, sem `last-write-wins` silencioso.

## Segurança

- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker;
- backend recebe apenas cofre cifrado e metadados técnicos;
- nenhum HTML não confiável é injetado na UI de férias;
- PR #210 não cria endpoint, token, segredo, permissão, dependência ou dado persistido;
- indicadores e simulações não são enviados como telemetria;
- links externos mantêm `rel="noreferrer"`.

## Qualidade

Workflow `Qualidade`: Node 22, npm 11.6.0, instalação, `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke test Chromium e artefacto. O head final só pode ser integrado depois de todos os gates verdes. PR #210 acrescenta `VacationPlanner.test.ts` e `vacation-planner.test.ts`.
