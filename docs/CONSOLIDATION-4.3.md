# Consolidação 4.3.0

## Objetivo
A 4.3.0 é uma release de estabilidade e consolidação. Não deve crescer em largura antes de reduzir duplicação de handlers, corrigir inconsistências de versão e tornar os fluxos críticos testáveis por interação.

## Camadas atuais
1. `core.js` — domínio, estado principal e compatibilidade de migração.
2. `app.js` — apresentação base e handlers históricos.
3. `planning-mode.js` — Planeamento público, prioridades e atalhos operacionais.
4. `stability.js` / `ux.js` — estabilidade do runtime, navegação visual e notificações.
5. `runtime-fixes.js` — correções funcionais acumuladas a absorver progressivamente.
6. `features-core.js` + módulos de features — horário, transportes, resumo e integrações.
7. `shift-planner-core.js` + `shift-planner.js` — escala, turnos, rotações e relatórios.
8. `shift-mobile-interactions.js` — interação tátil reforçada para o calendário.
9. `shift-reports.js` — configuração explícita de horas normais e salário/hora.
10. `summary-guard.js` — proteção temporária contra disputa de renderização do resumo diário.
11. `sw.js` — cache e atualização PWA.

## Dívida técnica prioritária
- eliminar handlers duplicados entre `app.js` e `runtime-fixes.js`;
- retirar `summary-guard.js` quando o fecho do dia tiver uma única fonte de verdade;
- incorporar a interação tátil do calendário no próprio planeador;
- tornar horas/salário parte do modelo definitivo da escala;
- alinhar versões, pacote, cache e documentação numa única release;
- manter estruturas antigas apenas onde forem necessárias para importar/migrar dados;
- adicionar testes DOM/E2E aos botões críticos.

## Ordem de trabalho
1. Documentação e remoção de código morto.
2. Coerência de versões/defaults.
3. Planeamento e Atividades.
4. Resumo diário e Backup.
5. Supershift/Relatórios/Calendário.
6. Moovit.
7. Atualizações PWA.
8. Testes DOM e smoke test em iPhone.

## Regra de publicação
Enquanto estes pontos estiverem em consolidação, a versão pública estável permanece 4.2.x. A etiqueta 4.3.0 só deve aparecer na interface quando versão, cache, testes e documentação forem atualizados no mesmo release candidate.
