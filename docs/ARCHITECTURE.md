# Arquitetura

Atualizado em: 2026-09-18. O histórico integral anterior foi preservado em `docs/history/ARCHITECTURE-pre-217.md`.

## PR #221 — planeamento em quatro passos

A imagem PDF enviada pelo utilizador expôs uma longa sequência de métricas de 2026 antes das opções de julho de 2027. `VacationPlannerPanel` conserva o cálculo partilhado `calculateVacationBalance`, o relógio e a simulação; na escolha do próximo ano renderiza primeiro `VacationJointPlanner`, seguido de um `details.vacationPlannerContext` recolhido com as quatro métricas de 2026 e aviso de que não transitam automaticamente para 2027. Para o ano corrente a mesma `liveSummary` continua antes das sugestões e formulário. A ordem visual corresponde à ordem do DOM/teclado; não se reordena apenas por CSS.

`VacationJointPlanner` preserva `suggestJointVacationPeriods`, cofre cifrado e `confirmationScope`, mas agrupa a vista em `section.vacationJointChoice` (preferências), `section.vacationJointCompare` (botões de opções), `section.vacationJointSimulation` (cenário e calendário opcional) e `VacationConfirmationChecklist` (confirmações efémeras). A explicação extensa fica em `details.vacationJointMethod`, não é retirada. Os botões conservam `aria-pressed`, calendário `aria-expanded`, mês bloqueado no `select`, resets ao mudar cenário e a regra de não gravar simulações. O novo módulo `src/styles/vacation-planning-structure.css` está importado por último em `VacationWorkspacePage` e atua só em `.vacationWorkspace--planning`: grelhas responsivas, passos com bordas discretas e leitura mais compacta sem esconder alternativas. Teste estrutural `vacation-planning-structure.test.ts` e auditoria em `docs/VACATION-PLANNING-STRUCTURE-2026.md`. A atualização é de apresentação; não cria direito laboral, aprovação ou sincronização em tempo real.

## Intervenção PR #220 — apresentação e navegação acessível

As rotas `#/ferias` e `#/ferias/planeamento` continuam a renderizar `VacationWorkspacePage`, `VacationBalancePage` e os respetivos painéis, sem novos componentes de domínio ou dependências. `vacation-visual-audit.css`, importada por `VacationWorkspacePage`, usa tokens, largura de leitura de 74rem, cartões com destaque proporcional e contenção das grelhas de sete colunas em ecrãs compactos. O layout é o mesmo código responsivo para móvel/web, não sincronização instantânea entre dispositivos.

`AppShell.tsx` apresenta um `<button type="button" className="skipLink">` para «Saltar para o conteúdo», que chama `focusSection('main-content')`. O `<main id="main-content" tabIndex={-1}>` é focado sem modificar `window.location.hash`; preserva Enter/Espaço e foco visível. O `focusSection` serve também o atalho de proveniência de férias. `focusSection.test.ts` verifica os hashes das duas páginas de férias e turnos. CSS global e restantes funções do shell não foram modificados. A navegação precisa ainda de teste físico VoiceOver/teclado.

## Plataforma e camadas

PWA React 19/TypeScript 5.9/Vite 7/React Router, publicada em GitHub Pages. AppShell responsivo (desktop sidebar, mobile top bar/bottom nav/drawer); o mesmo bundle e perfil servem os dispositivos. Domain isolado para férias/jornada/horas, camada application de casos de uso, presentation de componentes e Zustand de horas. IndexedDB/Dexie e `secureStorage` integram o cofre cifrado AES-GCM; replicação opcional por Cloudflare Worker/Durable Object transporta o cofre cifrado, nunca passwords/PIN/dataKey.

## Rotas hash e saltos internos — PR #218

`router.tsx` usa `createHashRouter`: `#/ferias` representa rota. `<a href="#vacation-evidence-title">` no PR #217 substituía-a e originava 404 no iPhone. O atalho da vista geral usa botão e `focusSection(id)` (`src/presentation/navigation/focusSection.ts`) para scroll/foco sem URL; título `tabIndex={-1}`. Rota residual `*` apresenta `NotFoundPage` em PT-PT. CSS `vacation-evidence-layout.css` e `route-not-found.css` preservam visual; `focusSection.test.ts` e `vacation-evidence.test.ts` cobrem regressão. O skip link global foi corrigido no PR #220. Ver `docs/HASH-ROUTER-NAVIGATION.md`.

## Férias — rotas, apresentação e dados

`#/ferias` → `VacationWorkspacePage(view="overview")` → `VacationBalancePage` + `VacationEvidencePanel` (só overview). `#/ferias/planeamento` → o mesmo `VacationBalancePage` com secções não aplicáveis ocultas por CSS; `VacationPlannerPanel` mostra resumo vivo, `VacationSuggestionsPanel`, `VacationJointPlanner`, calendário e simulação. **Limite ainda pendente:** a vista ocultada continua montada; não alegar que CSS evita toda a computação.

CSS base `vacation-workspace.css`, `vacation-evidence-layout.css`, `vacation-evidence.css`, `vacation.css`, `vacation-accrual.css`, `vacation-insights.css`, `vacation-planner.css`, `vacation-planner-live.css`, `vacation-suggestions.css`, `vacation-joint-planner.css`, `vacation-confirmations.css` e `vacation-visual-audit.css`. O novo módulo de layout #221 é limitado ao percurso de planeamento, não um tema global. Os separadores móveis compactos, cartões de altura intrínseca, hierarquia do saldo e atalho secundário vieram do PR #219. Os testes `vacation-visual-audit.test.ts` e `vacation-planning-structure.test.ts` são estruturais; não substituem capturas reais.

`VacationBalance.ts` é a autoridade para referência laboral e projeção pessoal. Meta anual pessoal configurável (28 por omissão): acumulado vivo calculado da meta, meses anteriores e fração do mês local; saldo vivo = acumulado + transitados + ajustes − gozadas; após planeadas subtrai futuros úteis. Contagem valida datas civis, deduplica e desconta seg.–sex. por defeito; dias manuais sem data continuam descontados e nunca viram datas inventadas.

`VacationYearRecords.ts` lê `useWorkHoursStore` (`reason="ferias"`), `foco-jornada-shift-map-v1-AAAA-MM` e `foco-jornada-payroll-plan-v1-AAAA-MM` (`kind="vacation"`) do cofre. `collectVacationEvidenceForYear` valida YYYY-MM-DD, reúne fontes por data (`horas`, `turnos`, `plano`); `collectVacationDatesForYear` deriva datas dessa mesma coleta para o futuro. `VacationEvidencePanel` só consulta quando aberto, sem escrever, com atualização manual e foco/visibilidade. `VacationBalancePage` ainda mantém coletor próprio para ano atual; reconciliar apenas depois de testes com dados reais.

## Segurança, riscos e QA

PRs #217–#221 não alteram autenticação, autorização, sessões, CSRF, backend, esquema de dados, Worker, segredos, dependências ou sync; não injetam HTML nem enviam pedidos de férias. Links de rota usam `NavLink`; saltos internos não usam hashes simples. Botões têm foco visível, detalhes nativos para conteúdo secundário, proveniência com `aria-expanded`/`aria-controls`, contraste forçado e movimento reduzido. CI cobre auditoria, TypeScript, ESLint, Vitest, build, Worker dry-run e smoke Chromium. Testes físicos cross-device pendentes.

Feriados, escalas fora de segunda–sexta, aprovação, disponibilidade da parceira e dias contratuais exigem confirmação externa. Ver `docs/VACATION-EVIDENCE.md`, `docs/VACATION-PLANNER-LIVE.md`, `docs/VACATION-PLANNER.md`, `docs/VACATION-SUGGESTIONS.md` e `docs/VACATION-PLANNING-STRUCTURE-2026.md`.
