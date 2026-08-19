# Consolidação 4.3.0

## Objetivo
A 4.3.0 é uma release de estabilidade e consolidação. Não deve crescer em largura antes de reduzir duplicação de handlers, corrigir inconsistências de versão e tornar os fluxos críticos testáveis por interação.

## Camadas atuais
1. `core.js` — domínio e estado principal.
2. `app.js` — apresentação e handlers históricos.
3. `stability.js` / `ux.js` — estabilidade do runtime, navegação visual e notificações.
4. `runtime-fixes.js` — correções funcionais acumuladas que devem ser absorvidas progressivamente no núcleo/app.
5. `features-core.js` + módulos de features — horário, transportes, resumo e integrações.
6. `shift-planner-core.js` + `shift-planner.js` — escala, turnos, rotações e relatórios.
7. `shift-mobile-interactions.js` — interação tátil reforçada para o calendário.
8. `shift-reports.js` — configuração explícita de horas normais e salário/hora.
9. `summary-guard.js` — proteção temporária contra disputa de renderização do resumo diário.
10. `sw.js` — cache e atualização PWA.

## Dívida técnica prioritária
- eliminar handlers duplicados entre `app.js` e `runtime-fixes.js`;
- retirar `summary-guard.js` quando o fecho do dia tiver uma única fonte de verdade;
- incorporar a interação tátil do calendário no próprio planeador;
- tornar horas/salário parte do modelo definitivo da escala, sem migração corretiva em runtime;
- alinhar `APP_VERSION`, versão UI, features, escala, pacote e cache numa única release;
- corrigir defaults históricos no núcleo em vez de depender de migração visual;
- adicionar testes DOM/E2E aos botões críticos.

## Ordem de trabalho
1. Documentação e remoção de código morto.
2. Coerência de versões/defaults.
3. Pomodoro e Atividades.
4. Resumo diário e Backup.
5. Supershift/Relatórios/Calendário.
6. Moovit.
7. Atualizações PWA.
8. Testes DOM e smoke test em iPhone.

## Regra de publicação
Enquanto estes pontos estiverem em consolidação, a versão pública estável permanece 4.2.x. A etiqueta 4.3.0 só deve aparecer na interface quando versão, cache, testes e documentação forem atualizados no mesmo release candidate.
