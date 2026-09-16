# Changelog

## 2026-09-16 — áreas de férias separadas e layout fluido (PR #212)

### Interface e navegação

- `#/ferias` passa a apresentar **Férias acumuladas mês a mês**, métricas e meses primeiro; **O que tens, o que falta e o que vem a seguir** surge depois. Configuração, referência laboral, fontes e notas de precisão são preservadas no fim.
- Nova rota autónoma `#/ferias/planeamento`: **PLANEAMENTO · ano atual / Planeia as próximas férias**, com sugestões, filtros, calendário, alternativas, simulador e ação de registo no mapa de turnos. Navegação bidirecional através de `NavLink` com estado ativo e foco visível.
- `vacation-workspace.css`: contentor máximo 80rem, espaçamento e padding fluidos, grelha de métricas `auto-fit/minmax`, cabeçalhos contidos, navegação 2→1 colunas até 560px, painéis do planeador com espaçamento próprio e sem bordas externas duplicadas. Suporte de `forced-colors` e `prefers-reduced-motion`.

### Arquitetura, integridade e QA

- `VacationWorkspacePage.tsx` reutiliza `VacationBalancePage` em ambas as rotas: nenhuma mudança na contagem dos 10 dias úteis de 24/08–06/09, na meta pessoal 28, no simulador, nas sugestões ou na sincronização.
- O isolamento é visual por `display:none`: zonas ocultas continuam montadas no React. A extração futura para componentes/hook partilhado pode eliminar renderizações ocultas; não é atribuída a este PR.
- `vacation-workspace.test.ts` cobre rotas, nav, ordem, isolamento, largura, mobile, foco e acessibilidade estrutural. Especificação em `docs/VACATION-WORKSPACE.md`.
- Sem nova persistência, schema, auth, API, Worker, token, segredo, dependência ou telemetria. A projeção pessoal continua distinta do direito laboral.
- **Estado nesta revisão:** CI final, merge, Pages e validação física em dispositivo real pendentes; não declarar publicado antes de confirmação.

## 2026-09-16 — sugestões de férias baseadas em critérios (PR #211)

- Painel **Sugestão de férias** na área de planeamento: cabeçalho, período destacado, filtros, meses, calendário, alternativas e ações reais.
- Dias úteis pretendidos (1–30, padrão 10), mês a evitar, critérios «Juntar fins de semana», «Mais cedo» e «Maior saldo no fim».
- Períodos futuros do ano atual sem sobreposição ou mês excluído; um candidato por mês inicial. Descanso potencial com fins de semana adjacentes, saldo no fim e previsão dezembro.
- Calendário navegável com úteis sugeridos, fins de semana e férias registadas. «Simular este período» preenche o formulário existente sem marcar férias; registo explícito no mapa de turnos. Estado vazio claro.
- `VacationSuggestions.ts` reutiliza simulação/balanço, sem segundo cálculo; filtros efémeros, sem persistência, API, dependência, permissão, telemetria. Não presume feriados, escala, preços ou aprovação; meta pessoal 28 separada do direito oficial.
- CSS isolado acessível (`focus-visible`, alvos 44px, `forced-colors`, `prefers-reduced-motion`); testes `VacationSuggestions.test.ts` e `vacation-suggestions.test.ts` cobrem entradas, conflitos, saldos e estrutura.
- Qualidade #1150/#1156 no head e run `35127380594` em `main` passaram audit, TypeScript, lint, testes, build, Worker, smoke e artefacto. Merge `b687673a467cf5fc5061160b41a254e4b55118cc`; Publicar #250, Pages #819 e build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff` com sucesso. Teste físico pendente.

## 2026-09-16 — simulação de períodos futuros (PR #210)

- Novo painel «Simula as próximas férias» em `#/ferias`: início/fim e pré-visualização sem gravação; dias civis, úteis, fins de semana e úteis já registados, sem desconto duplicado.
- Saldo pessoal no início/fim, previsão 31/12 antes/depois, alerta de valor negativo, lista de grupos futuros sexta–segunda; registo separado no mapa de turnos.
- Datas civis UTC, bloqueio de passado/invertidas/ano diferente; 24/08–06/09/2026 = dez úteis e quatro fins de semana, meta 28 − dez dias novos = 18 em dezembro.
- Testes `VacationPlanner.test.ts` e `vacation-planner.test.ts`, CSS isolado acessível; sem migração, endpoint, segredo, autenticação, permissão, dependência ou telemetria. Referência laboral separada.
- Qualidade #1143/#1148/head e #1149 após merge: sucesso. Merge `73a6c0f43caf40219a98b1224113bdddaaec420b`; Publicar #249, Pages #814, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`. Validação física pendente.

## 2026-09-16 — indicadores de férias (PR #209)

- Painel «O que tens, o que falta e o que vem a seguir»: progresso anual, restante, próximo marco/data, gozadas/planeadas, total comprometido, dezembro, fins de semana ignorados e fecho mensal.
- Indicadores derivados de `VacationBalance` (`annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate`, `hasReachedAccrualTarget`), sem segunda taxa nem persistência.
- `vacation-insights.css` e testes: grelha fluida, progresso acessível, estado negativo, contenção, `forced-colors`, `prefers-reduced-motion`; 24/08–06/09 mantém dez úteis e previsão de 18 (meta 28). Sem migração/API/segredo.
- Qualidade #1140/#1141, Publicar #248 e Pages #807 verdes; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## 2026-09-16 — hierarquia visual mensal (PR #208)

- Grelha de meses `repeat(auto-fit,minmax(min(100%,15rem),1fr))`, resumo mínimo 13rem, mês atual destacado, valor/barra/texto consistente, mobile sem altura excessiva. Teste `vacation-card-containment.test.ts`. Sem alteração de domínio/cofre/sync/API.
- Qualidade #1138/#1139, Publicar #247, Pages #801; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`.

## 2026-09-15 — contenção dos cartões mensais (PR #207)

- Badge de setembro corrigido; mês/estado/valores/barra contidos sem reticências, mobile uma coluna, teste `vacation-card-containment.test.ts`.
- Qualidade #1131/#1132, Publicar #246, Pages #796; merge `3a564251eece4a4c2870982ed3127c1638a68482`, build `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`.

## 2026-09-15 — evolução mensal em tempo real (PR #206)

- `asOfDayProgress`, acumulado/saldo/projetado vivos, taxa e marcos exatos; atualização minuto/focus/visibility; barra mensal e ausência de arredondamento intermédio.
- Qualidade #1122/#1123, Publicar #245, Pages #790; merge `15f4df15308a145f9d303cf56d699837f9516303`, build `05e32a99bd0479fdb417876cb9a31f305a32866d`.

## 2026-09-15 — contagem de dias úteis (PR #205)

- Sábado/domingo não reduzem saldo padrão, datas deduplicadas: 24/08–06/09 = 14 civis, dez úteis, quatro fins de semana.
- Qualidade #1113/#1114, Publicar #244, Pages #785; merge `2e309975a38e0df975bf1958879fefb3c3b4b514`, build `26e8dcffca10589846dad4577e96ad03ea1e0608`.

## 2026-09-15 — meta mensal pessoal (PR #204)

- Meta configurável 28 padrão; `monthlyAccrualTargetDays`, meses e marcos `meta × mês/12` sem drift. Qualidade #1105/#1106, Publicar #237, Pages #772; merge `131e6a721f03c3f5d9e22f1ebea885593607c315`, build `9629239c2ccde1cac925d00a3197d645cc8ed308`.

## 2026-09-15 — ferramenta de saldo (PR #203)

- `#/ferias`, `VacationBalance` puro, referência laboral separada, datas de turnos/plano/horas e configuração em `secureStorage` cifrado.
- Qualidade #1097/#1098, Publicar #236, Pages #767; merge `225e808a416ac6e18f23c1b7178e99886d7cecbf`, build `d5dee6cd9418eaf4483ca4422c17b8331d915445`.

## 2026-09-10 — automação de jornada e pausas (PR #202)

- `reconcileScheduledWorkday` por `WorkSchedule`, Pomodoro manual, timestamps exatos após background; Vitest 5.0.0/sharp 0.35.4 override/npm 11.6.0 workflows. Merge `62b0cb44db31fff957a4486b7ac24634c721e3ea`, build `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

## 2026-09-08 — logótipo animado (PR #200/#201)

`logo-mark.svg` com CSS progressivo, tema claro/escuro, `prefers-reduced-motion`, `role="status"`, `aria-live="polite"`.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

Hambúrguer ↔ X no mesmo botão, alvo 44×44px, top bar visível com drawer/backdrop abaixo, ARIA/safe-area.

## 2026-09-07 — sincronização móvel ↔ computador (PR #191–#194)

Worker/Durable Object transportam só cofre cifrado; token derivado da dataKey; conflitos bilaterais explícitos, associação temporária sem enviar PIN/password/dataKey original.

## 2026-09-07 — turnos noturnos (PR #189)

Normalização de horas após meia-noite, preservando entrada antecipada e saída da madrugada.

## 2026-09-05 — medicação e histórico

Gestos horizontais em tomas, definir/eliminar com confirmação, tombstone `deletedAt` e versionamento, Histórico Resumo/Detalhes técnicos.
