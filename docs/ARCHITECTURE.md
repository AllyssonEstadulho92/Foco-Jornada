# Arquitetura

Atualizado em: 2026-09-20. Histórico integral anterior preservado em `docs/history/ARCHITECTURE-pre-217.md`.

## Refinamento visual de 20/09 — branch de design, não publicada

`VacationWorkspacePage` mantém exatamente duas rotas React Router (`#/ferias`, `#/ferias/planeamento`). O invólucro `vacationWorkspaceToolbar` reúne os dois `NavLink` com um botão «Registos» apenas na vista geral; este chama `focusSection('vacation-evidence-title')` e desloca o foco para `VacationEvidencePanel` sem modificar a rota hash. «Registos» é consulta de datas e fontes disponíveis, não um novo histórico de férias aprovadas nem uma terceira rota.

A nova folha `vacation-elegance.css` é importada por último e limitada a `.vacationWorkspace`, com tabs compactas, destaque do saldo **pessoal**, cartão de perigo distinto quando negativo, grelhas responsivas 960/540/355px, linha temporal puramente visual no painel de proveniência e suporte a foco visível, alto contraste e movimento reduzido. O domínio continua a produzir todos os números; a folha não define valores, não calcula percentagens nem altera `VacationBalancePage`. `vacation-elegance.test.ts` inspeciona navegação, regras críticas e invariantes de apresentação. A camada adicional deverá ser consolidada nas folhas existentes após testes físicos, sem regressões de cascata.

A PR #224 de integridade da leitura do cofre permanece noutra branch e não é pressuposta por esta alteração; nenhum ajuste às fontes, saldo, armazenamento, sincronização, permissões ou contrato é introduzido. Pendente executar a CI para commit final e testes no iPhone/Android/tablet/desktop, incluindo 200% zoom, leitor de ecrã, modo escuro e contraste.

## PR #223 — protótipo aplicado às duas rotas com valores reais

`VacationWorkspacePage` continua a ser o ponto de entrada das rotas `#/ferias` e `#/ferias/planeamento`, com `NavLink` e salto `focusSection` sem mudança do hash. Importa `vacation-prototype.css` (apresentação de ambas as vistas) e `vacation-month-visual.css` (gráfico/tabela). A paisagem em `src/assets/vacation-coast.svg` é SVG local processado pelo Vite, sem pedido externo, pessoas ou saldos fictícios. As classes permanecem escopadas a `.vacationWorkspace` / `.vacationWorkspace--overview` / `.vacationWorkspace--planning`; o `AppShell` e restantes páginas não são redesenhados.

`VacationBalancePage` mantém `useWorkHoursStore`, `secureStorage`, `calculateVacationBalance`, o temporizador de 60 s e atualização em foco/visibilidade, recolha/deduplicação anterior, configuração, direito laboral separado, proveniência e notas. Em `vacationAccrualPanel`, `VacationMonthlyVisualization` recebe **o mesmo** `balance.monthlyAccrualSchedule` e `balance.monthlyAccrualTargetDays` do domínio, sem leitura ou gravação adicional: comuta entre gráfico de 12 barras (altura = acumulado/objetivo, mês corrente usa `liveCumulativeDays`; restantes `cumulativeDays`) e tabela semântica (mês, acumulado, estado, fecho). Os quatro valores intramensais e todos os 12 cartões antigos estão num `<details>` opcional e continuam no DOM sem duplicar a contagem. A vista Gráfico/Tabela não é persistida, não há arredondamento acumulativo.

`VacationPlannerPanel`, `VacationSuggestionsPanel`, `VacationJointPlanner`, `VacationConfirmationChecklist` mantêm as mesmas propostas, filtros, calendário e simulações. Os passos Escolher/Comparar/Simular/Confirmar são apresentados com hierarquia visual, sem envio de pedidos reais: nenhum endpoint ILUNION é implementado. Ano seguinte não herda saldo automaticamente; julho predefinido e bloqueios de novembro/dezembro são restrições comunicadas, não verificação externa. A ilustração panorâmica substitui a fotografia do protótipo sem impor um novo serviço de imagens; números/nomes exemplificativos não são importados.

Testes `VacationMonthlyVisualization.test.tsx` exercitam a alternância e valores, `vacation-prototype.test.ts` protege rotas, SVG local, contenção, detalhes e ausência de submissão falsa; testes de domínio e navegação existentes continuam. Sem novos schemas, dependências, API, Worker, autenticação, segredos, sessão ou sincronização. Pendente validar no iPhone físico: CSS e smoke Chromium não provam todos os breakpoints, contraste, VoiceOver e registos reais. Especificação: `docs/VACATION-PROTOTYPE-2026.md`.

## PR #222 — ritmo visual e correção de altura no telemóvel

A apresentação de `#/ferias` usa `src/styles/vacation-insights.css` para uma grelha com cartões de altura intrínseca, superfícies neutras e destaque seletivo da barra anual/«Próximo marco». O cartão de alerta mantém o contraste de perigo. Em <=560px, os indicadores continuam numa coluna e sem recorte do texto. `#/ferias/planeamento` usa a folha já existente `vacation-planning-structure.css`: a partir de 1100px, `VacationJointPlanner` distribui `vacationJointChoice` (4/12) e `vacationJointCompare` (8/12) lado a lado; abaixo mantém-se a ordem sequencial do DOM e em <=440px o resumo de 2026 em `<details>` passa a duas linhas. O calendário de sete colunas e as alternativas permanecem acessíveis.

**Auditoria do PDF de 19/09:** em `vacation.css` a partir de `max-width:640px`, `.vacationPanelHeader` muda para coluna, mas `vacation-accrual.css` e `vacation-insights.css` fixavam bases flex de 240/260px no bloco do título. A base passa do eixo horizontal ao vertical, criando espaço vazio entre títulos e métricas; `vacation-workspace.css` acrescentava `flex-basis:100%` em `max-width:560px`. A correção permanece na folha **existente** `vacation-workspace.css`: cabeçalhos da vista geral <=640px com `flex:0 0 auto`, largura completa e altura intrínseca; a regra genérica móvel substitui `flex-basis:100%` por `flex:0 0 auto`. Os cartões mensais <=560px reduzem espaçamento interno e permitem que mês e estado partilhem a linha com quebra segura. Não se escondem meses, valores nem notas. `vacation-workspace.test.ts` protege essas regras; ver `docs/VACATION-MOBILE-SPACING-AUDIT-2026.md`. A correção é fundada em PDF + inspeção CSS, não comprovação visual após publicação.

As alterações do PR #222 são de CSS e testes estruturais (`vacation-insights.test.ts`, `vacation-planning-structure.test.ts`, `vacation-workspace.test.ts`). TSX, contas, estados, rotas, datas, cofre, backend, Worker e sincronização permanecem iguais. Testes automatizados não provam aspeto real em iPhone, texto ampliado ou exportação PDF.

## PR #221 — planeamento em quatro passos

O PDF anterior mostrou métricas de 2026 antes das opções de julho de 2027. `VacationPlannerPanel` conserva `calculateVacationBalance`, relógio e simulação; no ano seguinte renderiza primeiro `VacationJointPlanner` e depois `details.vacationPlannerContext` recolhido com as quatro métricas de 2026 e aviso de não transferência do saldo. No ano corrente `liveSummary` permanece antes das sugestões e formulário. A ordem visual corresponde ao DOM e ao teclado.

`VacationJointPlanner` preserva `suggestJointVacationPeriods`, cofre cifrado e `confirmationScope`, mas agrupa a vista em `section.vacationJointChoice`, `section.vacationJointCompare`, `section.vacationJointSimulation` e `VacationConfirmationChecklist`; explicações extensas estão num `details.vacationJointMethod`. Botões mantêm `aria-pressed`, calendário `aria-expanded`, mês bloqueado no `select`, reset ao mudar cenário e simulação sem gravação. `vacation-planning-structure.css` atua na rota de planeamento; testes `vacation-planning-structure.test.ts` e documentação `docs/VACATION-PLANNING-STRUCTURE-2026.md`. Não cria direito laboral, aprovação ou sincronização instantânea.

## Intervenção PR #220 — apresentação e navegação acessível

As rotas `#/ferias` e `#/ferias/planeamento` renderizam `VacationWorkspacePage`, `VacationBalancePage` e os respetivos painéis. `vacation-visual-audit.css` aplica largura de leitura de 74rem, hierarquia dos cartões e contenção de calendários de sete colunas. O mesmo código responsivo serve móvel/web, sem garantir replicação instantânea.

`AppShell.tsx` apresenta `<button type="button" className="skipLink">` para «Saltar para o conteúdo» com `focusSection('main-content')`; `<main id="main-content" tabIndex={-1}>` recebe foco sem modificar `window.location.hash`. `focusSection.test.ts` verifica hashes de férias e turnos. O salto exige ainda teste físico com VoiceOver/teclado.

## Plataforma e camadas

PWA React 19/TypeScript 5.9/Vite 7/React Router, publicada em GitHub Pages. AppShell responsivo com barra lateral desktop, topo/barra inferior/gaveta móvel; o mesmo bundle e perfil servem os dispositivos. Camada domain para férias/jornada/horas, application de casos de uso e presentation de componentes, com Zustand de horas. IndexedDB/Dexie e `secureStorage` integram o cofre AES-GCM; replicação opcional por Cloudflare Worker/Durable Object transporta apenas o cofre cifrado, nunca passwords/PIN/dataKey.

## Rotas hash e saltos internos — PR #218

`router.tsx` usa `createHashRouter`: `#/ferias` representa uma rota. `<a href="#vacation-evidence-title">` substituía-a e originava 404 no iPhone. O atalho da vista geral usa botão e `focusSection(id)` (`src/presentation/navigation/focusSection.ts`) para scroll/foco sem mudar o URL; título `tabIndex={-1}`. Rota residual `*` mostra `NotFoundPage` PT-PT. `focusSection.test.ts` e `vacation-evidence.test.ts` protegem regressões. O skip link global foi corrigido no PR #220; ver `docs/HASH-ROUTER-NAVIGATION.md`.

## Férias — rotas, apresentação e dados

`#/ferias` → `VacationWorkspacePage(view="overview")` → `VacationBalancePage` + `VacationEvidencePanel` (só overview). `#/ferias/planeamento` → o mesmo `VacationBalancePage` com secções não aplicáveis ocultas por CSS; `VacationPlannerPanel` mostra resumo vivo, `VacationSuggestionsPanel`, `VacationJointPlanner`, calendário e simulação. **Limite:** vista ocultada continua montada; CSS não impede toda a computação.

CSS base `vacation-workspace.css`, `vacation-evidence-layout.css`, `vacation-evidence.css`, `vacation.css`, `vacation-accrual.css`, `vacation-insights.css`, `vacation-planner.css`, `vacation-planner-live.css`, `vacation-suggestions.css`, `vacation-joint-planner.css`, `vacation-confirmations.css` e `vacation-visual-audit.css`. A camada #221 é escopada à rota de planeamento. Testes estruturais não substituem medições físicas.

`VacationBalance.ts` define referência laboral e projeção pessoal. Meta anual configurável (28 por omissão): acumulado vivo deriva da meta, meses anteriores e fração do mês local; saldo = acumulado + transitados + ajustes − gozados; após planeadas subtrai futuros úteis. Valida datas civis, deduplica e desconta segunda–sexta por omissão; dias manuais sem data continuam descontados sem inventar datas.

`VacationYearRecords.ts` lê `useWorkHoursStore` (`reason="ferias"`), `foco-jornada-shift-map-v1-AAAA-MM` e `foco-jornada-payroll-plan-v1-AAAA-MM` (`kind="vacation"`) do cofre. `collectVacationEvidenceForYear` valida YYYY-MM-DD e reúne fontes por data (`horas`, `turnos`, `plano`); `collectVacationDatesForYear` deriva datas da mesma coleta de proveniência para o futuro. `VacationEvidencePanel` consulta só quando aberto, sem escrita, com refresh manual/foco/visibilidade. `VacationBalancePage` mantém coletor próprio para ano corrente, pendente de reconciliação com dados reais.

## Segurança, riscos e QA

PRs #217–#223 não alteram autenticação, autorização, sessões, CSRF, backend, esquema de dados, Worker, segredos, dependências ou sync; não injetam HTML nem submetem pedidos de férias. Links de rota usam `NavLink`; saltos internos não usam hashes simples. Há foco visível, detalhes nativos para informação secundária, proveniência com `aria-expanded`/`aria-controls`, contraste forçado e movimento reduzido. CI cobre auditoria, TypeScript, ESLint, Vitest, build, Worker dry-run e smoke Chromium. Testes cross-device físicos pendentes.

Feriados, escala não habitual, aprovação, disponibilidade da parceira e dias contratuais exigem confirmação externa. Ver `docs/VACATION-EVIDENCE.md`, `docs/VACATION-PLANNER-LIVE.md`, `docs/VACATION-PLANNER.md`, `docs/VACATION-SUGGESTIONS.md`, `docs/VACATION-PLANNING-STRUCTURE-2026.md`, `docs/VACATION-MOBILE-SPACING-AUDIT-2026.md` e `docs/VACATION-PROTOTYPE-2026.md`.
