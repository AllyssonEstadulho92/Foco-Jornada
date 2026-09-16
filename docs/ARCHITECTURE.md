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
       │    │    ├─ resumo vivo e indicadores
       │    │    ├─ sugestão de períodos (PR #211)
       │    │    ├─ simulação de períodos futuros (PR #210)
       │    │    └─ evolução mensal
       │    └─ Definições
       ├─ Application: casos de uso / reconciliações
       ├─ Domain
       │    ├─ VacationBalance: direito configurado e projeção pessoal
       │    ├─ VacationPlanner: simulação pura
       │    └─ VacationSuggestions: opções por critério, sem escrita
       └─ Persistência cifrada
            ├─ IndexedDB/Dexie
            ├─ secureStorage no snapshot cifrado
            └─ sync opcional: Cloudflare Worker + Durable Object
```

## Stack confirmada

React 19, TypeScript 5.9, Vite 7, React Router, IndexedDB/Dexie, cofre cifrado AES-GCM, Zustand onde necessário, Vitest 5, GitHub Pages, Cloudflare Worker/Durable Objects; Node 22 e npm 11.6.0 nos workflows.

## Camadas

### Presentation

Componentes relevantes: `src/presentation/layouts/AppShell.tsx`, `src/presentation/pages/TodayReferencePage.tsx`, `FocusPage.tsx`, `ActivitiesPage.tsx`, `ShiftMapPage.tsx`, `WorkHoursCalculatorPage.tsx`, `VacationBalancePage.tsx`, `VacationPlannerPanel.tsx`, `VacationSuggestionsPanel.tsx`, `SettingsReferencePage.tsx` e `src/presentation/providers/AppServicesProvider.tsx`.

A página de férias usa `src/styles/vacation.css` (base), `vacation-accrual.css` (grelha mensal), `vacation-insights.css` (indicadores), `vacation-planner.css` (simulador) e `vacation-suggestions.css` (protótipo de sugestões, isolado). Os testes `vacation-card-containment.test.ts`, `vacation-insights.test.ts`, `vacation-planner.test.ts` e `vacation-suggestions.test.ts` protegem estruturas visuais. Indicadores e simulações não guardam snapshots de progresso, datas estimadas nem períodos novos.

### Application

Coordena casos de uso e repositories, sem regras visuais: entrada/saída, pausas, foco/atividades e `reconcileScheduledWorkday` com base no `WorkSchedule`. A página de férias agrega as fontes existentes e envia datas/configuração normalizadas a `calculateVacationBalance`. O planeador e o painel de sugestões recebem **o mesmo conjunto** por props, sem reler ou duplicar a agregação. O painel de sugestões entrega um par início/fim ao formulário do simulador existente; não chama mutações.

### Domain

`VacationBalance` é autoridade para referência laboral, saldo pessoal, dias úteis e evolução mensal. `VacationPlanner` contém funções puras que reutilizam `calculateVacationBalance` para a projeção temporal, sem escrever turnos/horas. `VacationSuggestions` enumera opções futuras, aplica os critérios escolhidos e reutiliza `simulateVacationPeriod` para validar saldos e contagem de dias, evitando uma segunda fórmula de acumulação. Responsabilidades incluem validar datas civis, deduplicar, filtrar sábado/domingo, separar gozadas/planeadas, calcular direitos configurados, projeções mensais/anuais e simular períodos sem duplicar datas.

## Rotas relevantes

`#/` hoje; `#/foco` foco; `#/atividades` atividades; `#/turnos` mapa de turnos; `#/horas` calculadora de horas; `#/ferias` férias, sugestões e simulador no mesmo ecrã; `#/definicoes` definições. Desktop usa sidebar; mobile/tablet usa top bar, bottom navigation e drawer. PR #211 não acrescenta rota redundante.

## Persistência

Bases: `foco-jornada-security-v1` (perfil de segurança/KDF/chaves/metadados de sync) e `foco-jornada-vault-v1` (`EncryptedVaultRecord` cifrado). Configuração de férias em `secureStorage`, chave `foco-jornada-vacation-settings-v1`, campos:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays`;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

PR #210/#211 não acrescentam campos, migrações, registos de férias artificiais ou alterações ao cofre. As preferências de busca de sugestões são estado React efémero, sem sync adicional.

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
  └─ projeção pessoal: meses fechados, acumulado vivo, saldo, marcos, previsão
VacationPlanner(simulação)
  ├─ mesmas datas/configuração da página
  ├─ validar intervalo futuro
  ├─ dias úteis novos = úteis do intervalo − já registados
  ├─ calculateVacationBalance(fim do dia anterior)
  ├─ calculateVacationBalance(fim último dia + novos temporários)
  └─ previsão dezembro anterior − dias úteis novos
VacationSuggestions(sugestão)
  ├─ datas futuras no ano atual, tamanho pedido e mês excluído
  ├─ rejeitar sobreposições com dias úteis registados
  ├─ usar simulateVacationPeriod em cada candidato
  ├─ aceitar só saldo pessoal não negativo no fim/dezembro
  ├─ ordenar por critério explícito e escolher um por mês de início
  └─ enviar escolha à simulação, nunca criar um registo
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

`progressoAnual% = clamp(acumuladoVivo / metaAnual) × 100`; `faltaAnual = max(0, metaAnual - acumuladoVivo)`; `comprometido = gozadas + planeadas`; `previsaoFimAno = metaAnual + transitados + ajustes - comprometido`.

O próximo marco = `min(metaAnual, floor(acumuladoVivo) + 1)` enquanto a meta não for atingida; a data usa o mesmo modelo mensal.

## Planeador de períodos — PR #210

`src/domain/vacation/VacationPlanner.ts` exporta `simulateVacationPeriod` e `listUpcomingVacationPeriods`: aceita apenas início posterior a hoje e fim até 31 de dezembro do ano atual; valida o calendário civil em UTC; desconta só dias úteis não registados; calcula saldo antes/depois com `calculateVacationBalance`; projeta dezembro; agrupa próximos dias úteis futuros registados, inclusive sexta–segunda; devolve inválido em vez de gravar. Não cria tabela, backend ou migração. A marcação exige uma ação separada. Detalhes: `docs/VACATION-PLANNER.md`.

## Sugestões de períodos — PR #211

`src/domain/vacation/VacationSuggestions.ts` exporta `suggestVacationPeriods`. Os inputs `requestedDays` (inteiro 1–30), `excludedMonth` (0–12) e `preference` (`rest`, `soon`, `balance`) são efémeros. Para cada começo útil futuro, avança até somar os dias pedidos e rejeita intervalos com dias úteis já registados, mês excluído ou passagem de ano. Valida os candidatos com a simulação existente e só apresenta saldos pessoais projetados não negativos no fim e em dezembro. O critério `rest` mede dias consecutivos potenciais incluindo sábados/domingos adjacentes, `soon` usa a data mais próxima e `balance` compara o saldo estimado ao fim. Ordena e retém uma opção por mês inicial, sem prometer que seja a escolha objetivamente melhor.

`VacationSuggestionsPanel.tsx` apresenta filtros, cartão principal, meses, calendário, outras opções, aviso de ausência de cenários, legenda, acessibilidade e botão que preenche a simulação já existente. Não interpreta o ano ilustrativo 2025 como data válida em 2026; não inventa feriados, folgas, preços ou autorização. Detalhes: `docs/VACATION-SUGGESTIONS.md`.

## Arquitetura visual

Grelha mensal: `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, contenção de largura, `overflow-wrap`, diferenciação de estados, `forced-colors` e `prefers-reduced-motion`.

Painel de indicadores: `vacation-insights.css` com `repeat(auto-fit, minmax(min(100%, 14rem), 1fr))`, barra anual acessível, estado negativo e uma coluna até 560 px.

Planeador: `vacation-planner.css` com grids `auto-fit/minmax`, campos de data rotulados, texto/números contidos e uma coluna até 560 px. Resultados `aria-live="polite"`, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.

Sugestões: `vacation-suggestions.css` isolado, grelha de filtros adaptativa, cartão principal com ilustração CSS decorativa, cartões por mês selecionáveis com `aria-pressed`, calendário navegável com controlos reais de 44px, descanso/feriados diferenciados semanticamente, mobile de uma coluna até 520px, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.

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

PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker; backend recebe apenas cofre cifrado e metadados técnicos. Nenhum HTML não confiável é injetado na UI de férias. PR #211 não cria endpoint, token, segredo, permissão, dependência ou dado persistido. Indicadores e simulações não são enviados como telemetria. Links externos usam `rel="noreferrer"`.

## Qualidade

Workflow `Qualidade`: Node 22, npm 11.6.0, instalação, `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke test Chromium e artefacto. O head final só pode ser integrado depois de todos os gates verdes. PR #211 acrescenta `VacationSuggestions.test.ts` e `vacation-suggestions.test.ts`.
