# Roadmap — Foco & Jornada

## V1

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
| 9 | Qualidade final/PWA | Concluída — auditoria final na PR #39 |

## Entrega V1

A V1 inclui persistência IndexedDB, recuperação por timestamps, jornada linear, pausas, atividades, foco/Pomodoro, café, histórico, estatísticas, definições, calculadora de horas e ausências, vencimento/planificação, guia de utilização, exportação JSON, interface responsiva e PWA com manifest, service worker e cache offline.

A auditoria final é integrada em `main` apenas com typecheck, lint, testes e build concluídos com sucesso. A validação manual em browsers e dispositivos reais continua a fazer parte do fecho de qualidade visual, sem alterar o núcleo funcional da V1.

## V2 — backlog

- autenticação e contas;
- sincronização entre dispositivos;
- backend/cloud e backups;
- notificações avançadas;
- estatísticas de longo prazo;
- exportação CSV/PDF;
- publicação nativa Android/iOS;
- funcionalidades colaborativas, se vierem a ser necessárias.
