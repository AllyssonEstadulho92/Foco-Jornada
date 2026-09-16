# Cabeçalho compacto do planeamento de férias — PR #213

## Sintoma observado

Na vista `#/ferias/planeamento` em captura de ecrã do utilizador, a etiqueta «Pré-visualização sem guardar» saía do contorno pela direita e o cabeçalho ocupava uma caixa branca muito alta, com espaço vazio até ao conteúdo seguinte.

## Alteração e âmbito

- `VacationPlannerPanel.tsx` troca o cabeçalho genérico por um `header.vacationPlannerHero` com rótulo de ano dinâmico, título, descrição e etiqueta curta. O estado de pré-visualização é texto informativo, não um botão.
- `vacation-planner.css` limita as duas colunas a `minmax(0, 1fr)` e `minmax(0, 12.5rem)`; abaixo de 820px passa para uma coluna. Todas as frases podem quebrar linha dentro da caixa.
- O planeador autónomo deixa de usar uma grelha que podia esticar a primeira linha: `.vacationWorkspace--planning .vacationPage > .vacationPlannerPanel` passa a coluna flex com altura intrínseca. O cabeçalho tem `flex: 0 0 auto`, `min-height: 0` e não força altura de viewport.
- Mantêm-se os filtros, sugestões, calendário, seleção de datas, resultados e ligação explícita para registar no mapa de turnos.

## Integridade, segurança e regressões

A alteração é apenas de apresentação; não altera `VacationBalance`, `VacationPlanner`, `VacationSuggestions`, registos, saldo pessoal de 28 dias, regra 24/08–06/09/2026 = dez úteis, persistência, cofre, sincronização, permissões ou API. `vacation-workspace.test.ts` cobre estrutura, badge, contenção, coluna flex e breakpoint, além dos testes existentes de contagem e simulação. Os gates de CI incluem auditoria, TypeScript, lint, testes, build, Worker dry-run e smoke Chromium. Uma captura validada no iPhone real com a versão publicada é necessária para confirmar a correção visual.
