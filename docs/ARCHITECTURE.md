# Arquitetura — Foco & Jornada

## Estado atual
A aplicação é uma PWA estática, local-first, publicada em GitHub Pages. Não existe backend, autenticação ou base de dados remota na versão atual.

## Camadas
1. **Domínio e estado** — `core.js`: jornada, pausas, atividades, café, métricas, migração e validação. Estruturas antigas são mantidas apenas quando necessárias para compatibilidade de backups.
2. **Aplicação** — `app.js`: renderização base e handlers históricos.
3. **Planeamento** — `planning-mode.js`: prioridades, atividades do dia, atrasos, estado da jornada e atalhos operacionais.
4. **Estabilidade/UX** — `stability.js`, `ux.js` e módulos corretivos temporários.
5. **Features** — `features-core.js` e controladores de horário, resumo, transportes e integrações.
6. **Escala** — `shift-planner-core.js`, `shift-planner.js`, `shift-mobile-interactions.js` e `shift-reports.js`.
7. **PWA** — `manifest.webmanifest` e `sw.js`.

## Persistência
O estado principal e as features são guardados em `localStorage`, com camadas locais de recuperação. A aplicação continua funcional sem servidor depois do cache inicial.

## Regras temporais
Timers visuais não são fonte de verdade. Jornada e pausas são derivados de timestamps (`startedAt`, `endedAt`, `expectedEndAt`). Suspender o Safari ou fechar a PWA não deve reiniciar os tempos.

## Integridade
O domínio impede estados incompatíveis como várias jornadas ou pausas simultâneas. O ecrã de diagnóstico e a suite automatizada verificam estas condições e também validam estruturas antigas durante migração.

## Integrações externas
- **Moovit:** apenas deep links oficiais e fallback conhecido; a Foco & Jornada não fornece horários de transporte próprios.
- **Supershift:** existe um planeador de escala interno e exportação ICS. Não são utilizados URL schemes privados ou APIs proprietárias inventadas.

## Dívida técnica 4.3.0
A base 4.2.x acumulou módulos corretivos (`runtime-fixes.js`, `summary-guard.js`, `shift-mobile-interactions.js`, `shift-reports.js`). A 4.3.0 tem como objetivo absorver estas regras nos módulos definitivos e reduzir duplicação de handlers.

Consultar `ROADMAP.md` e `docs/CONSOLIDATION-4.3.md` para o plano de evolução.
