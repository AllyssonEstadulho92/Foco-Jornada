# Arquitetura — Foco & Jornada

## Estado atual
A aplicação é uma PWA estática, local-first, publicada em GitHub Pages. Não existe backend, autenticação ou base de dados remota na versão atual.

## Camadas
1. **Domínio e estado** — `core.js`: jornada, pausas, atividades, Pomodoro, café, métricas, migração e validação.
2. **Aplicação** — `app.js`: renderização das vistas e handlers históricos.
3. **Estabilidade/UX** — `stability.js`, `ux.js` e módulos corretivos temporários.
4. **Features** — `features-core.js` e controladores de horário, resumo, transportes e integrações.
5. **Escala** — `shift-planner-core.js`, `shift-planner.js`, `shift-mobile-interactions.js` e `shift-reports.js`.
6. **PWA** — `manifest.webmanifest` e `sw.js`.

## Persistência
O estado principal e as features são guardados em `localStorage`. A aplicação continua funcional sem servidor depois do cache inicial. Uma futura migração para IndexedDB está prevista no roadmap, mas não faz parte da release estável atual.

## Regras temporais
Timers visuais não são fonte de verdade. Jornada, pausas e foco são derivados de timestamps (`startedAt`, `endedAt`, `expectedEndAt`, `pausedAt`, `pausedMs`). Suspender o Safari ou fechar a PWA não deve reiniciar os tempos.

## Integridade
O domínio impede estados incompatíveis como várias jornadas, pausas ou sessões de foco simultâneas. O ecrã de diagnóstico e a suite automatizada verificam parte destas condições.

## Integrações externas
- **Moovit:** apenas deep links oficiais e fallback conhecido; a Foco & Jornada não fornece horários de transporte próprios.
- **Supershift:** existe um planeador de escala interno inspirado no fluxo funcional mostrado pelo utilizador e exportação ICS. Não são utilizados URL schemes privados ou APIs proprietárias inventadas.

## Dívida técnica 4.3.0
A base 4.2.x acumulou módulos corretivos (`runtime-fixes.js`, `summary-guard.js`, `shift-mobile-interactions.js`, `shift-reports.js`). A 4.3.0 tem como objetivo absorver estas regras nos módulos definitivos e reduzir duplicação de handlers.

Consultar `ROADMAP.md` e `docs/CONSOLIDATION-4.3.md` para o plano de evolução.
