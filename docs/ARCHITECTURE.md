# Arquitetura

Atualizado em: 2026-09-16

## Visão geral

O **Foco Jornada** é uma única PWA responsiva. Telemóvel, tablet e computador usam o mesmo bundle React/TypeScript, as mesmas rotas, regras de domínio e persistência. As diferenças de breakpoints são visuais, não de regra de negócio.

```text
GitHub Pages
  └─ React 19 + TypeScript + Vite
       ├─ Router / AppShell responsivo
       ├─ Presentation
       │    ├─ Today / jornada, Foco / atividades, Turnos / horas
       │    ├─ Férias
       │    │    ├─ resumo vivo e indicadores
       │    │    ├─ sugestões de períodos (PR #211)
       │    │    ├─ simulação de períodos (PR #210)
       │    │    └─ evolução mensal
       │    └─ Definições
       ├─ Application: casos de uso / reconciliações
       ├─ Domain
       │    ├─ VacationBalance: referência laboral e projeção pessoal
       │    ├─ VacationPlanner: simulação pura
       │    └─ VacationSuggestions: opções por critério, sem escrita
       └─ Persistência cifrada
            ├─ IndexedDB/Dexie
            ├─ secureStorage no snapshot cifrado
            └─ sync opcional: Cloudflare Worker + Durable Object
```

## Stack confirmada

React 19, TypeScript 5.9, Vite 7, React Router, IndexedDB/Dexie, cofre AES-GCM, Zustand onde necessário, Vitest 5, GitHub Pages, Cloudflare Worker/Durable Objects; Node 22 e npm 11.6.0 em CI.

## Camadas

### Presentation

Componentes: `src/presentation/layouts/AppShell.tsx`, páginas `TodayReferencePage.tsx`, `FocusPage.tsx`, `ActivitiesPage.tsx`, `ShiftMapPage.tsx`, `WorkHoursCalculatorPage.tsx`, `VacationBalancePage.tsx`, `VacationPlannerPanel.tsx`, `VacationSuggestionsPanel.tsx`, `SettingsReferencePage.tsx` e `src/presentation/providers/AppServicesProvider.tsx`.

Férias: `src/styles/vacation.css` (base), `vacation-accrual.css` (grelha mensal), `vacation-insights.css` (indicadores), `vacation-planner.css` (simulador) e `vacation-suggestions.css` (sugestões isoladas). Testes `vacation-card-containment.test.ts`, `vacation-insights.test.ts`, `vacation-planner.test.ts` e `vacation-suggestions.test.ts` protegem elementos estruturais visuais. Não se guardam snapshots derivados nem cenários novos.

### Application

Coordena casos de uso e repositories, não regras visuais: entrada/saída, pausas, foco/atividades e `reconcileScheduledWorkday` com base no `WorkSchedule`. A página de férias agrega as fontes e envia datas/configuração normalizadas a `calculateVacationBalance`. Planeador e sugestões recebem o mesmo conjunto por props, sem reler nem duplicar agregação. A sugestão envia início/fim ao formulário da simulação existente, não chama mutações.

### Domain

`VacationBalance` é a autoridade para referência laboral, saldo pessoal, dias úteis e evolução mensal. `VacationPlanner` reutiliza `calculateVacationBalance` para projeções temporais sem escrever turnos/horas. `VacationSuggestions` enumera opções futuras, aplica critérios escolhidos e reutiliza `simulateVacationPeriod` para validar contagem e saldos. Responsabilidades incluem validar datas civis, deduplicar, filtrar sábados/domingos, separar gozadas/planeadas, calcular valores anuais/mensais, simular sem duplicar datas.

## Rotas relevantes

`#/` hoje; `#/foco` foco; `#/atividades` atividades; `#/turnos` mapa de turnos; `#/horas` calculadora de horas; `#/ferias` férias, sugestões e simulador no mesmo ecrã; `#/definicoes` definições. Desktop com sidebar; mobile/tablet com top bar, bottom navigation e drawer. PR #211 não introduz rota redundante.

## Persistência

`foco-jornada-security-v1` contém perfil de segurança/KDF/chaves/metadados de sync e `foco-jornada-vault-v1` contém o `EncryptedVaultRecord` cifrado. A configuração de férias usa `secureStorage`, chave `foco-jornada-vacation-settings-v1`, campos `employmentStartDate`, `annualEntitlementDays`, `monthlyAccrualTargetDays`, `carriedDays`, `manualTakenDays` e `adjustmentDays`.

PR #210/#211 não acrescentam campos, migrações, registos artificiais nem alterações ao cofre. As preferências da busca são estado React efémero sem nova sincronização.

## Fontes de dados e fluxo

```text
WorkHours store: reason === "ferias"
Shift map mensal: kind === "vacation"
Payroll plan mensal: kind === "vacation"
  ↓ normalizar YYYY-MM-DD
  ↓ deduplicar Set<string>
  ↓ semana padrão: seg.–sex. contam; sábado/domingo não
calculateVacationBalance()
  ├─ referência laboral
  └─ projeção pessoal: meses fechados, acumulado vivo, saldo, marcos e dezembro
VacationPlanner(simulação)
  ├─ mesmas datas/configuração da página
  ├─ validar intervalo futuro
  ├─ úteis novos = úteis do intervalo − já registados
  ├─ calculateVacationBalance(fim do dia anterior)
  ├─ calculateVacationBalance(fim do último dia + úteis novos temporários)
  └─ previsão dezembro anterior − úteis novos
VacationSuggestions(sugestão)
  ├─ datas futuras do ano atual, tamanho pedido, mês excluído
  ├─ rejeitar sobreposições com úteis registados
  ├─ simulateVacationPeriod valida cada candidato
  ├─ aceitar saldo pessoal não negativo no fim/dezembro
  ├─ ordenar por critério e escolher um por mês de início
  └─ enviar seleção à simulação, nunca criar registo
```

Não se inferem férias de baixa, folga, ausência ou jornada não iniciada.

## Referência laboral e projeção pessoal

Ano normal: `direitoAno = max(22, annualEntitlementDays confirmado)`; `saldoHoje = direitoAno + transitados + ajustes - gozadas`; `saldoProjetado = saldoHoje - planeadas`. Ano de admissão: `mesesCompletos = meses completos desde employmentStartDate`, `direitoAdmissao = min(20, mesesCompletos × 2)`; marco de seis meses separado.

Projeção pessoal: `parcelaMensal = metaAnual / 12`; `marcoMes = metaAnual × numeroMes / 12`. Meta 28: março 7, junho 14, setembro 21, dezembro 28.

`progressoMes = (diaMes - 1 + progressoDia) / diasNoMes`; `acumuladoVivo = metaAnual × (mesAtual - 1 + progressoMes) / 12`; `saldoVivo = acumuladoVivo + transitados + ajustes - gozadas`; `saldoVivoProjetado = saldoVivo - planeadas`. O relógio da página atualiza a cada 60 segundos e em `focus`/`visibilitychange`.

Indicadores derivados de PR #209: `annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate` e `hasReachedAccrualTarget`. `progressoAnual = clamp(acumuladoVivo/metaAnual) × 100`, `falta = max(0, metaAnual - acumuladoVivo)`, `comprometido = gozadas + planeadas`, `previsaoDezembro = metaAnual + transitados + ajustes - comprometido`; próximo marco `min(metaAnual, floor(acumuladoVivo) + 1)` enquanto abaixo da meta.

## Simulador de períodos — PR #210

`src/domain/vacation/VacationPlanner.ts` exporta `simulateVacationPeriod` e `listUpcomingVacationPeriods`. Aceita apenas início posterior a hoje e fim até 31/12 do ano atual; valida datas em UTC; desconta úteis não registados; consulta `calculateVacationBalance` antes/depois e projeta dezembro; agrupa dias futuros registados, incluindo sexta–segunda. Devolve inválido em vez de gravar. Registo real só por ação separada. Especificação `docs/VACATION-PLANNER.md`.

## Sugestões — PR #211

`src/domain/vacation/VacationSuggestions.ts` exporta `suggestVacationPeriods`, inputs efémeros `requestedDays` (1–30), `excludedMonth` (0–12), `preference` (`rest`, `soon`, `balance`). Para cada início útil futuro, soma os dias pedidos e rejeita sobreposição com útil registado, mês excluído e passagem de ano. Valida candidatos com o simulador existente, filtra saldo pessoal não negativo no fim e em dezembro. `rest` mede descanso potencial consecutivo incluindo fins de semana adjacentes, `soon` usa data mais próxima e `balance` compara saldo estimado no fim; apresenta no máximo uma opção por mês de início. Não atribui qualidade objetiva nem aprova férias.

`VacationSuggestionsPanel.tsx` apresenta filtros, cartão destacado, meses, calendário, alternativas, estado vazio, legenda, acessibilidade e botão que preenche o simulador existente. O ano é dinâmico, não o 2025 ilustrativo. Não infere feriados, folgas, preços ou autorização. Especificação `docs/VACATION-SUGGESTIONS.md`.

## Arquitetura visual

Grelha mensal: `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, contenção, `overflow-wrap`, estados, `forced-colors` e `prefers-reduced-motion`. Indicadores: `vacation-insights.css`, grelha `repeat(auto-fit, minmax(min(100%, 14rem), 1fr))`, barra anual acessível, estado negativo, uma coluna até 560px. Planeador: `vacation-planner.css`, grids auto-fit, inputs rotulados, resultados `aria-live="polite"`, mobile uma coluna até 560px. Sugestões: `vacation-suggestions.css` isolado, filtros adaptativos, ilustração decorativa CSS, mês selecionado com `aria-pressed`, calendário com controlos de 44px e estados distintos para úteis sugeridos, fins de semana e férias já registadas (não existe estado de feriado), uma coluna até 520px, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.

## Semana útil padrão

Segunda–sexta contam; sábado/domingo não reduzem saldo. 24/08/2026–06/09/2026 = dez dias úteis e quatro fins de semana ignorados. Feriados e regimes especiais permanecem fora da inferência automática.

## Sincronização móvel ↔ computador

`EncryptedVaultRecord` → `CloudSyncManager` (fingerprint SHA-256, token derivado de `dataKey`, revisão remota esperada) → Cloudflare Worker → Durable Object por `profileId`. Só local mudou → push; só remoto → pull/validação; igual → metadados; ambos → conflito explícito, sem `last-write-wins` silencioso.

## Segurança

PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker; backend recebe só cofre cifrado e metadados técnicos. UI de férias não injeta HTML não confiável. PR #211 não cria endpoint, token, segredo, permissão, dependência, dado persistido ou telemetria. Links externos com `rel="noreferrer"`.

## Qualidade e publicação

Workflow Qualidade: Node22, npm11.6.0, instalação, audit high, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium, artefacto. PR #211 adicionou testes `VacationSuggestions.test.ts` e `vacation-suggestions.test.ts`. Qualidade #1150/#1156 no head e run `35127380594` em `main`: sucesso. Merge `b687673a467cf5fc5061160b41a254e4b55118cc`; Publicar #250 e Pages #819: sucesso; build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff`. Validação visual no iPhone/Android/tablet/desktop real permanece pendente.
