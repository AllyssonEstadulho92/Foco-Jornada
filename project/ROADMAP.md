# Roadmap — Foco & Jornada

## V1 — núcleo funcional

| Fase | Objetivo | Estado |
|---|---|---|
| 0 | Especificação | Concluída |
| 1 | Fundação | Concluída |
| 2 | Jornada | Concluída |
| 3 | Pausas | Concluída |
| 4 | Atividades | Concluída |
| 5 | Foco/Pomodoro | Concluída |
| 6 | Café | Concluída |
| 7 | Dashboard | Concluída |
| 8 | Histórico/Estatísticas/Definições | Concluída |
| 9 | Qualidade/PWA | Concluída |

## Evolução já integrada após a V1

A aplicação evoluiu para além do escopo inicial e inclui atualmente:

- calculadora de horas, ausências e horas extra;
- vencimento e planificação mensal;
- mapa de turnos;
- stock pessoal;
- sticks e sessão técnica glo;
- medicamentos, horários e estados de toma;
- reconciliação e proteção de dados de stock;
- centro de notificações e deadlines;
- relatório diário A4/PDF;
- temas claro, escuro e sistema.

## 1.2 — hardening

| Frente | Estado |
|---|---|
| Publicação GitHub Pages apenas por artefacto | Concluída — PR #152 |
| Remoção de builds compilados do repositório | Em validação — PR #153 |
| Lazy loading/code splitting por rota | Em validação — PR #153 |
| Backup do estado operacional fora do IndexedDB | Em validação — PR #153 |
| Smoke test desktop + mobile | Em validação — PR #153 |
| Redução de polling de permissões | Em validação — PR #153 |
| Rigor semântico do relatório A4 | Em validação — PR #153 |

Ver `project/docs/HARDENING_1_2.md`.

## Próximas fases controladas

1. Migrar gradualmente persistências operacionais de `localStorage` para IndexedDB, com migração retrocompatível.
2. Consolidar CSS e tokens por ecrã sem reintroduzir uma camada global não validada.
3. Converter manipulações diretas de DOM para componentes/hooks React quando cada módulo for intervencionado.
4. Expandir testes de browser/visual para Safari/iPhone, Android, tablet e desktop.
5. Exigir o workflow `Qualidade` através de proteção/ruleset de `main`.
6. Adotar lockfile controlado para builds reprodutíveis.

## Backlog de produto

- autenticação e contas;
- sincronização entre dispositivos;
- backend/cloud e backups online;
- estatísticas de longo prazo;
- exportação CSV estruturada;
- publicação nativa Android/iOS;
- funcionalidades colaborativas, se vierem a ser necessárias.
